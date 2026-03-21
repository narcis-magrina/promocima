-- ═══════════════════════════════════════════════════════════════════════════════
--  MIGRACIÓN: Sistema multi-empresa
--  Ejecutar en Supabase SQL Editor
--  Todos los datos existentes quedan asignados a empresa 'PROMOCIMA'
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla empresas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id          text PRIMARY KEY,
  nombre      text NOT NULL,
  descripcion text,
  activa      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO empresas (id, nombre, descripcion)
VALUES ('PROMOCIMA', 'Promocima', 'Empresa principal')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Añadir empresa_id a perfiles ──────────────────────────────────────────
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
UPDATE perfiles SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
ALTER TABLE perfiles ALTER COLUMN empresa_id SET NOT NULL;

-- ── 3. Añadir empresa_id a tablas de datos ────────────────────────────────────
ALTER TABLE clientes               ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE intermediarios         ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE prestamos              ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE cobros                 ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE participes             ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE contratos_ccp          ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE pagos_reales_participe ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE titulares              ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);
ALTER TABLE config                 ADD COLUMN IF NOT EXISTS empresa_id text REFERENCES empresas(id);

-- ── 4. Migrar datos existentes → PROMOCIMA ───────────────────────────────────
UPDATE clientes               SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE intermediarios         SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE prestamos              SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE cobros                 SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE participes             SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE contratos_ccp          SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE pagos_reales_participe SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE titulares              SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;
UPDATE config                 SET empresa_id = 'PROMOCIMA' WHERE empresa_id IS NULL;

-- ── 5. NOT NULL tras migrar ───────────────────────────────────────────────────
ALTER TABLE clientes               ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE intermediarios         ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE prestamos              ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE cobros                 ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE participes             ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE contratos_ccp          ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE pagos_reales_participe ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE titulares              ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE config                 ALTER COLUMN empresa_id SET NOT NULL;

-- ── 6. Funciones helper para RLS ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT empresa_id FROM perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_participe_ids()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(participe_ids, '{}') FROM perfiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid()
$$;

-- ── 7. RLS tabla empresas ─────────────────────────────────────────────────────
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresas_select" ON empresas;
DROP POLICY IF EXISTS "empresas_insert" ON empresas;
DROP POLICY IF EXISTS "empresas_update" ON empresas;
DROP POLICY IF EXISTS "empresas_delete" ON empresas;

CREATE POLICY "empresas_select" ON empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "empresas_insert" ON empresas FOR INSERT TO authenticated WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY "empresas_update" ON empresas FOR UPDATE TO authenticated USING (get_my_rol() = 'admin');
CREATE POLICY "empresas_delete" ON empresas FOR DELETE TO authenticated USING (get_my_rol() = 'admin');

-- ── 8. RLS policies por empresa ───────────────────────────────────────────────

-- CLIENTES
DROP POLICY IF EXISTS "clientes_empresa" ON clientes;
CREATE POLICY "clientes_empresa" ON clientes FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- INTERMEDIARIOS
DROP POLICY IF EXISTS "intermediarios_empresa" ON intermediarios;
CREATE POLICY "intermediarios_empresa" ON intermediarios FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- TITULARES
DROP POLICY IF EXISTS "titulares_empresa" ON titulares;
CREATE POLICY "titulares_empresa" ON titulares FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- PRESTAMOS
DROP POLICY IF EXISTS "prestamos_empresa" ON prestamos;
CREATE POLICY "prestamos_empresa" ON prestamos FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- COBROS
DROP POLICY IF EXISTS "cobros_empresa" ON cobros;
CREATE POLICY "cobros_empresa" ON cobros FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- PARTICIPES: admin/interno ven todos, partícipe solo los suyos
DROP POLICY IF EXISTS "participes_empresa" ON participes;
CREATE POLICY "participes_empresa" ON participes FOR ALL TO authenticated
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() IN ('admin', 'interno')
      OR id = ANY(get_my_participe_ids())
    )
  )
  WITH CHECK (empresa_id = get_my_empresa_id());

-- CONTRATOS_CCP: admin/interno ven todos, partícipe solo los suyos
DROP POLICY IF EXISTS "contratos_ccp_empresa" ON contratos_ccp;
CREATE POLICY "contratos_ccp_empresa" ON contratos_ccp FOR ALL TO authenticated
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() IN ('admin', 'interno')
      OR participe_id = ANY(get_my_participe_ids())
    )
  )
  WITH CHECK (empresa_id = get_my_empresa_id());

-- PAGOS_REALES_PARTICIPE
DROP POLICY IF EXISTS "pagos_participe_empresa" ON pagos_reales_participe;
CREATE POLICY "pagos_participe_empresa" ON pagos_reales_participe FOR ALL TO authenticated
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() IN ('admin', 'interno')
      OR contrato_ccp_id IN (
        SELECT id FROM contratos_ccp
        WHERE participe_id = ANY(get_my_participe_ids())
      )
    )
  )
  WITH CHECK (empresa_id = get_my_empresa_id());

-- CONFIG
DROP POLICY IF EXISTS "config_empresa" ON config;
CREATE POLICY "config_empresa" ON config FOR ALL TO authenticated
  USING (empresa_id = get_my_empresa_id())
  WITH CHECK (empresa_id = get_my_empresa_id());

-- ── 9. Verificación ───────────────────────────────────────────────────────────
SELECT 'empresas'                  AS tabla, COUNT(*) AS registros FROM empresas
UNION ALL SELECT 'perfiles PROMOCIMA',       COUNT(*) FROM perfiles            WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'clientes PROMOCIMA',       COUNT(*) FROM clientes            WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'prestamos PROMOCIMA',      COUNT(*) FROM prestamos           WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'cobros PROMOCIMA',         COUNT(*) FROM cobros              WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'participes PROMOCIMA',     COUNT(*) FROM participes          WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'contratos PROMOCIMA',      COUNT(*) FROM contratos_ccp       WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'pagos PROMOCIMA',          COUNT(*) FROM pagos_reales_participe WHERE empresa_id = 'PROMOCIMA'
UNION ALL SELECT 'config PROMOCIMA',         COUNT(*) FROM config              WHERE empresa_id = 'PROMOCIMA';

