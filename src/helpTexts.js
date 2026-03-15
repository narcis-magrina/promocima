// ═══════════════════════════════════════════════
//  TEXTOS DE AYUDA — PROMOCIMA
//  Glosario centralizado para los tooltips ? de la aplicación
// ═══════════════════════════════════════════════

export const help = {
  // ── Estados / situaciones de préstamos ─────────────────────────────────────
  desplegado:   'Préstamo que se ha concedido en algún momento, independientemente de su estado actual.',
  en_curso:     'Préstamo que no ha sido cancelado. Incluye activos y judicializados.',
  activo:       'Préstamo en curso y no judicializado. Puede estar al día o con retraso.',
  al_dia:       'Préstamo activo sin cuotas vencidas pendientes de cobro.',
  con_retraso:  'Préstamo activo con una o más cuotas vencidas sin cobrar.',
  judicializado:'Préstamo que ha entrado en proceso judicial.',
  cancelado:    'Préstamo que ha sido cancelado y liquidado.',

  // ── Capital ────────────────────────────────────────────────────────────────
  capital_en_curso:   'Suma del importe nominal de todos los préstamos en curso (no cancelados).',
  capital_activo:     'Capital vivo real: importe en curso descontando el principal ya amortizado en préstamos franceses y amortizaciones parciales.',
  capital_al_dia:     'Capital activo (vivo) de los préstamos al día.',
  capital_con_retraso:'Capital activo (vivo) de los préstamos con retraso.',
  capital_judicializado: 'Capital activo (vivo) de los préstamos judicializados.',
  capital_participado:'Suma de los importes de participación (contratos CCP activos) en préstamos en curso.',
  capital_cancelado:  'Importe nominal de los préstamos cancelados.',

  // ── Partícipes / CCP ───────────────────────────────────────────────────────
  participacion_en_curso: 'Suma de los importes de participación (contratos CCP activos) en préstamos no cancelados.',
  prestamos_en_curso:     'Número de préstamos en curso en los que este partícipe tiene algún contrato CCP activo.',
  rentabilidad_mes:       'Rendimiento neto mensual estimado: devengado bruto menos gastos de gestión, antes de impuestos.',

  // ── Cobros ─────────────────────────────────────────────────────────────────
  total_cobrado:    'Suma de todos los cobros registrados desde el inicio.',
  cobros_ultimo_mes:'Cobros registrados en los últimos 30 días.',

  // ── Garantías ──────────────────────────────────────────────────────────────
  ltv: 'Loan To Value: cociente entre el importe del préstamo y el valor de tasación de la garantía.',
}
