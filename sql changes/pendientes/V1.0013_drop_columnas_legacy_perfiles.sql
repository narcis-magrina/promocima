-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0013 — Drop columnas legacy de perfiles
--  Fecha: 2026-03-28
--  Motivo: Tras la migración a perfiles_empresas (V1.0007-V1.0011), las columnas
--          empresa_id, empresa_ids[] y participe_ids[] de la tabla perfiles
--          quedaron obsoletas. Toda esa información vive ahora en perfiles_empresas.
--  Prerequisito: V1.0007-V1.0011 aplicada (perfiles_empresas debe existir y
--                tener los datos migrados).
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.perfiles
  DROP COLUMN IF EXISTS empresa_id,
  DROP COLUMN IF EXISTS empresa_ids,
  DROP COLUMN IF EXISTS participe_ids;
