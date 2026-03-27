-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0006 — Eliminar restricción de unicidad en NIF de partícipes
--  Motivo: un mismo NIF puede aparecer en múltiples empresas
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.participes DROP CONSTRAINT IF EXISTS participes_nif_key;
