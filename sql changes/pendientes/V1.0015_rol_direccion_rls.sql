-- ═══════════════════════════════════════════════════════════════════════════════
--  V1.0015 — Añadir rol 'dirección' a las RLS policies de partícipes y contratos
--  Fecha: 2026-03-28
--  Motivo: Las políticas RLS de participes, contratos_ccp y pagos_reales_participe
--          solo permitían los roles 'admin' e 'interno'. El nuevo rol 'dirección'
--          necesita acceso de lectura/escritura a estas tablas igual que 'interno'.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── participes ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS participes_empresa ON public.participes;
CREATE POLICY participes_empresa ON public.participes
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR id = ANY (get_my_participe_ids())
    )
  );

-- ── contratos_ccp ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS contratos_ccp_empresa ON public.contratos_ccp;
CREATE POLICY contratos_ccp_empresa ON public.contratos_ccp
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR participe_id = ANY (get_my_participe_ids())
    )
  );

-- ── pagos_reales_participe ────────────────────────────────────────────────────
DROP POLICY IF EXISTS pagos_participe_empresa ON public.pagos_reales_participe;
CREATE POLICY pagos_participe_empresa ON public.pagos_reales_participe
  FOR ALL
  USING (
    empresa_id = get_my_empresa_id()
    AND (
      get_my_rol() = ANY (ARRAY['admin', 'interno', 'dirección'])
      OR contrato_ccp_id IN (
        SELECT id FROM contratos_ccp
        WHERE participe_id = ANY (get_my_participe_ids())
      )
    )
  );
