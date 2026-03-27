-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0008 — get_my_empresa_id lee header x-empresa-id para multi-empresa
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true)::json->>'x-empresa-id', ''),
    empresa_ids[1],
    empresa_id
  )
  FROM perfiles WHERE id = auth.uid()
$$;
