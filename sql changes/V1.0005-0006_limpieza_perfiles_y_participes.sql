-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0005-0006 — Limpieza perfiles y partícipes
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- V1.0005 — Corregir RLS de perfiles para que admins puedan editar otros usuarios
DROP POLICY IF EXISTS perfiles_own ON public.perfiles;

CREATE POLICY perfiles_own ON public.perfiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY perfiles_admin ON public.perfiles FOR ALL TO authenticated
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');

-- V1.0005 — Eliminar columna obsoleta participe_id (sustituida por participe_ids[])
ALTER TABLE public.perfiles DROP COLUMN IF EXISTS participe_id;

-- V1.0006 — Eliminar restricción de unicidad en NIF de partícipes
-- Motivo: un mismo NIF puede aparecer en múltiples empresas
ALTER TABLE public.participes DROP CONSTRAINT IF EXISTS participes_nif_key;
