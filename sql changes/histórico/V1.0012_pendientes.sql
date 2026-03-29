-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0012 — Migraciones pendientes consolidadas
--  Fecha: 2026-03-29
--  Incluye:
--    - Drop tabla emails_pendientes (obsoleta tras migración a /api/invitar.js)
--    - Drop columnas legacy de perfiles (empresa_id, empresa_ids, participe_ids)
--    - Añadir rol 'dirección' al check constraint de perfiles
--    - Añadir rol 'dirección' a las RLS policies de partícipes y contratos
--  Prerequisito: V1.0007-V1.0011 aplicada (perfiles_empresas debe existir).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Drop tabla emails_pendientes ──────────────────────────────────────────
-- Ya no se usa. El flujo de invitación usa /api/invitar.js directamente.

DROP TABLE IF EXISTS public.emails_pendientes;


-- ── 2. Drop columnas legacy de perfiles ──────────────────────────────────────
-- Tras la migración a perfiles_empresas, estas columnas quedaron obsoletas.

ALTER TABLE public.perfiles
  DROP COLUMN IF EXISTS empresa_id,
  DROP COLUMN IF EXISTS empresa_ids,
  DROP COLUMN IF EXISTS participe_ids;


-- ── 3. Añadir rol 'dirección' al check constraint de perfiles ─────────────────

ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check;

ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('admin', 'interno', 'dirección', 'participe'));


-- ── 4. Añadir rol 'dirección' a las RLS policies ─────────────────────────────

-- participes
DROP POLICY IF EXISTS participes_empresa ON public.participes;
CREATE POLICY participes_empresa ON public.participes
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR id = ANY (get_my_participe_ids())
    )
  );

-- contratos_ccp
DROP POLICY IF EXISTS contratos_ccp_empresa ON public.contratos_ccp;
CREATE POLICY contratos_ccp_empresa ON public.contratos_ccp
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR participe_id = ANY (get_my_participe_ids())
    )
  );

-- pagos_reales_participe
DROP POLICY IF EXISTS pagos_participe_empresa ON public.pagos_reales_participe;
CREATE POLICY pagos_participe_empresa ON public.pagos_reales_participe
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR contrato_ccp_id IN (
        SELECT id FROM contratos_ccp
        WHERE participe_id = ANY (get_my_participe_ids())
      )
    )
  );
