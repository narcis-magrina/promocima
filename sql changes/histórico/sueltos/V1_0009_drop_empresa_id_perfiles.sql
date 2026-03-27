-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0009 — Paso 1: eliminar dependencia de empresa_id en perfiles
--  get_my_empresa_id ahora usa solo empresa_ids[] y el header x-empresa-id
--  empresa_id se mantiene en la tabla pero ya no se usa en la lógica
-- ═══════════════════════════════════════════════════════════════════════════════

-- Actualizar get_my_empresa_id para no depender de empresa_id
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true)::json->>'x-empresa-id', ''),
    empresa_ids[1]
  )
  FROM perfiles WHERE id = auth.uid()
$$;
