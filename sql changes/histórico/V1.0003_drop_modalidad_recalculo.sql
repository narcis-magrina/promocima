-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0003 — Eliminar columna modalidad_recalculo de la tabla cobros
--  Motivo: columna sin uso, nunca se implementó la funcionalidad prevista
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.cobros DROP COLUMN IF EXISTS modalidad_recalculo;
