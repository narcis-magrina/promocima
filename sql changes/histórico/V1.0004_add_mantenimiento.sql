-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0004 — Añadir campo mantenimiento a la tabla config
--  Motivo: permitir poner la app en mantenimiento para usuarios no administradores
--  Ejecutar: primero en PRUEBAS, verificar, luego en PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.config ADD COLUMN IF NOT EXISTS mantenimiento boolean NOT NULL DEFAULT false;
