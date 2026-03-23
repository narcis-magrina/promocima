-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0005 — Limpieza RLS perfiles + eliminar campo obsoleto participe_id
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Corregir RLS de perfiles para que admins puedan editar otros usuarios
DROP POLICY IF EXISTS perfiles_own ON public.perfiles;

CREATE POLICY perfiles_own ON public.perfiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY perfiles_admin ON public.perfiles FOR ALL TO authenticated
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');

-- 2. Eliminar columna obsoleta participe_id (sustituida por participe_ids[])
ALTER TABLE public.perfiles DROP COLUMN IF EXISTS participe_id;
