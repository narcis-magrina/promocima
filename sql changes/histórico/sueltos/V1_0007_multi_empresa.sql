-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0007 — Soporte multi-empresa por usuario
--  Añade empresa_ids[] manteniendo empresa_id existente para compatibilidad
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Añadir columna empresa_ids (array, primer elemento = empresa principal)
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS empresa_ids text[] DEFAULT '{}';

-- 2. Migrar datos existentes: copiar empresa_id actual a empresa_ids[]
UPDATE public.perfiles
  SET empresa_ids = ARRAY[empresa_id]
  WHERE empresa_id IS NOT NULL
    AND (empresa_ids IS NULL OR empresa_ids = '{}');

-- 3. Actualizar función get_my_empresa_id para que use el primer elemento de empresa_ids
--    (con fallback a empresa_id por compatibilidad)
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    empresa_ids[1],
    empresa_id
  )
  FROM perfiles WHERE id = auth.uid()
$$;
