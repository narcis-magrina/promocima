-- ═══════════════════════════════════════════════════════════════════════════════
--  MIGRACIÓN CONSOLIDADA — V1.0007 a V1.0011
--  Para aplicar en PRODUCCIÓN (Supabase SQL Editor)
--  Generado: 2026-03-27
--
--  Incluye (en orden):
--    V1.0007 — Columna empresa_ids[] en perfiles + migración de datos
--    V1.0010 — Tabla perfiles_empresas + RLS + funciones definitivas
--    V1.0011 — Función get_all_participes()
--
--  NOTA: Las funciones intermedias de V1.0008 y V1.0009 se omiten porque
--        V1.0010 ya define la versión definitiva de get_my_empresa_id().
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 1 (V1.0007) — Añadir empresa_ids[] a perfiles y migrar datos
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS empresa_ids text[] DEFAULT '{}';

UPDATE public.perfiles
  SET empresa_ids = ARRAY[empresa_id]
  WHERE empresa_id IS NOT NULL
    AND (empresa_ids IS NULL OR empresa_ids = '{}');


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 2 (V1.0010) — Crear tabla perfiles_empresas
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.perfiles_empresas (
  perfil_id     uuid    NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  empresa_id    text    NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  participe_ids text[]  NOT NULL DEFAULT '{}',
  orden         int     NOT NULL DEFAULT 0,  -- 0 = empresa principal
  PRIMARY KEY (perfil_id, empresa_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 3 (V1.0010) — Migrar datos a perfiles_empresas
-- ─────────────────────────────────────────────────────────────────────────────

-- Empresa principal (empresa_ids[1]) con sus participe_ids
INSERT INTO public.perfiles_empresas (perfil_id, empresa_id, participe_ids, orden)
SELECT
  id,
  empresa_ids[1],
  COALESCE(participe_ids, '{}'),
  0
FROM public.perfiles
WHERE empresa_ids[1] IS NOT NULL
ON CONFLICT DO NOTHING;

-- Empresas adicionales (empresa_ids[2..n]) sin participe_ids
INSERT INTO public.perfiles_empresas (perfil_id, empresa_id, participe_ids, orden)
SELECT
  p.id,
  unnest(p.empresa_ids[2:]) AS empresa_id,
  '{}',
  generate_subscripts(p.empresa_ids[2:], 1)
FROM public.perfiles p
WHERE array_length(p.empresa_ids, 1) > 1
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 4 (V1.0010) — RLS en perfiles_empresas
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.perfiles_empresas ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve sus propios accesos
CREATE POLICY perfiles_empresas_own ON public.perfiles_empresas
  FOR SELECT TO authenticated
  USING (perfil_id = auth.uid());

-- Admins gestionan todos los accesos
CREATE POLICY perfiles_empresas_admin ON public.perfiles_empresas
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 5 (V1.0010) — Funciones definitivas
-- ─────────────────────────────────────────────────────────────────────────────

-- get_my_empresa_id: prioridad header x-empresa-id > empresa principal en perfiles_empresas
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true)::json->>'x-empresa-id', ''),
    (SELECT empresa_id FROM public.perfiles_empresas
     WHERE perfil_id = auth.uid()
     ORDER BY orden ASC
     LIMIT 1)
  )
$$;

-- get_my_participe_ids: partícipes del usuario en la empresa activa
CREATE OR REPLACE FUNCTION public.get_my_participe_ids()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT participe_ids FROM public.perfiles_empresas
     WHERE perfil_id = auth.uid()
       AND empresa_id = get_my_empresa_id()),
    '{}'
  )
$$;


-- ─────────────────────────────────────────────────────────────────────────────
--  PASO 6 (V1.0011) — Función para listar todos los partícipes (solo admins)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_all_participes()
RETURNS TABLE (id text, nombre text, empresa_id text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, nombre, empresa_id
  FROM public.participes
  WHERE activo = true
  ORDER BY nombre
$$;
