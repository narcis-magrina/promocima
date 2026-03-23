-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0003-0004 — Limpieza y mantenimiento
--  Ejecutar: en PRODUCCIÓN desde el SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- V1.0003 — Eliminar columna modalidad_recalculo de la tabla cobros
-- Motivo: columna sin uso, nunca se implementó la funcionalidad prevista
ALTER TABLE public.cobros DROP COLUMN IF EXISTS modalidad_recalculo;

-- V1.0004 — Añadir campo mantenimiento a la tabla config
-- Motivo: permitir poner la app en mantenimiento para usuarios no administradores
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS mantenimiento boolean NOT NULL DEFAULT false;
