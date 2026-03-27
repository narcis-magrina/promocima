-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0010 — Rediseño multi-empresa: nueva tabla perfiles_empresas
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Crear tabla perfiles_empresas
CREATE TABLE public.perfiles_empresas (
  perfil_id     uuid    NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  empresa_id    text    NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  participe_ids text[]  NOT NULL DEFAULT '{}',
  orden         int     NOT NULL DEFAULT 0,  -- 0 = empresa principal
  PRIMARY KEY (perfil_id, empresa_id)
);

-- 2. Migrar datos existentes desde perfiles
INSERT INTO public.perfiles_empresas (perfil_id, empresa_id, participe_ids, orden)
SELECT
  id,
  empresa_ids[1],
  COALESCE(participe_ids, '{}'),
  0
FROM public.perfiles
WHERE empresa_ids[1] IS NOT NULL
ON CONFLICT DO NOTHING;

-- También migrar empresa_ids adicionales (sin participe_ids)
INSERT INTO public.perfiles_empresas (perfil_id, empresa_id, participe_ids, orden)
SELECT
  p.id,
  unnest(p.empresa_ids[2:]) AS empresa_id,
  '{}',
  generate_subscripts(p.empresa_ids[2:], 1)
FROM public.perfiles p
WHERE array_length(p.empresa_ids, 1) > 1
ON CONFLICT DO NOTHING;

-- 3. Activar RLS
ALTER TABLE public.perfiles_empresas ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios accesos
CREATE POLICY perfiles_empresas_own ON public.perfiles_empresas
  FOR SELECT TO authenticated
  USING (perfil_id = auth.uid());

-- Admins gestionan todos los accesos
CREATE POLICY perfiles_empresas_admin ON public.perfiles_empresas
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');

-- 4. Actualizar get_my_empresa_id para usar perfiles_empresas
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

-- 5. Actualizar get_my_participe_ids para usar perfiles_empresas
CREATE OR REPLACE FUNCTION public.get_my_participe_ids()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT participe_ids FROM public.perfiles_empresas
     WHERE perfil_id = auth.uid()
       AND empresa_id = get_my_empresa_id()),
    '{}'
  )
$$;
