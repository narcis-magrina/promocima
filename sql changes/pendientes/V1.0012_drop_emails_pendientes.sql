-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0012 — Drop tabla emails_pendientes
--  Fecha: 2026-03-28
--  Motivo: La tabla ya no se usa. El flujo de invitación de usuarios fue
--          migrado a /api/invitar.js (Vercel serverless), que usa directamente
--          supabase.auth.admin.inviteUserByEmail(). Google Apps Script y la
--          cola de emails_pendientes quedaron obsoletos.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.emails_pendientes;
