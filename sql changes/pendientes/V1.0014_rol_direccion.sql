-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0014 — Añadir rol 'dirección' al check constraint de perfiles
--  Fecha: 2026-03-28
--  Motivo: El nuevo rol 'dirección' no estaba incluido en el constraint
--          perfiles_rol_check, lo que impedía asignarlo a usuarios.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check;

ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('admin', 'interno', 'dirección', 'participe'));
