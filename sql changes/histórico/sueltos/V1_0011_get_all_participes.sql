-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0011 — Función para listar todos los partícipes (solo admins)
--  Usada en GestionUsuarios para mostrar partícipes de todas las empresas
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_all_participes()
RETURNS TABLE (id text, nombre text, empresa_id text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, nombre, empresa_id
  FROM public.participes
  WHERE activo = true
  ORDER BY nombre
$$;
