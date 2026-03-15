// ═══════════════════════════════════════════════
//  TEXTOS DE AYUDA — PROMOCIMA
//  Glosario centralizado para tooltips y panel de ayuda
// ═══════════════════════════════════════════════

// ── Glosario completo (usado en el panel de ayuda) ────────────────────────────
export const glosario = [
  {
    termino:    'Capital desplegado',
    definicion: 'Nominal de las operaciones en curso (no canceladas). Es el importe bruto concedido sin descontar amortizaciones.',
  },
  {
    termino:    'Capital en curso',
    definicion: 'Capital vivo real de las operaciones activas y judicializadas. Descuenta el principal ya amortizado en préstamos franceses y amortizaciones parciales.',
  },
  {
    termino:    'Activo',
    definicion: 'Operaciones en curso no judicializadas. Incluye las que están al día y las que tienen retraso.',
  },
  {
    termino:    'Al día',
    definicion: 'Operaciones activas sin ninguna cuota vencida pendiente de cobro.',
  },
  {
    termino:    'Con retraso',
    definicion: 'Operaciones activas con una o más cuotas vencidas sin cobrar.',
  },
  {
    termino:    'Judicializado',
    definicion: 'Operaciones que han entrado en proceso judicial.',
  },
  {
    termino:    'Cancelado',
    definicion: 'Operaciones que han sido canceladas y liquidadas.',
  },
  {
    termino:    'LTV (Loan To Value)',
    definicion: 'Ratio entre el capital vivo en curso y el valor de tasación de las garantías, expresado en porcentaje. Se calcula sobre los préstamos en curso (activos + judicializados). Un LTV del 40% significa que el capital pendiente representa el 40% del valor de tasación de la garantía. A mayor LTV, mayor riesgo.',
  },
]

// ── Textos cortos para tooltips ? ─────────────────────────────────────────────
export const help = {
  // Estados
  desplegado:    'Nominal de las operaciones en curso (no canceladas).',
  en_curso:      'Capital vivo real: activas + judicializadas, descontando principal amortizado.',
  activo:        'Operaciones en curso no judicializadas (al día + con retraso).',
  al_dia:        'Operaciones activas sin cuotas vencidas pendientes.',
  con_retraso:   'Operaciones activas con cuotas vencidas sin cobrar.',
  judicializado: 'Operaciones que han entrado en proceso judicial.',
  cancelado:     'Operaciones canceladas y liquidadas.',

  // Capital
  capital_en_curso:      'Nominal de las operaciones en curso (no canceladas).',
  capital_activo:        'Capital vivo real: activas + judicializadas, descontando amortizaciones.',
  capital_al_dia:        'Capital vivo de las operaciones al día.',
  capital_con_retraso:   'Capital vivo de las operaciones con retraso.',
  capital_judicializado: 'Capital vivo de las operaciones judicializadas.',
  capital_participado:   'Suma de importes de participación (contratos CCP activos) en operaciones en curso.',
  capital_cancelado:     'Nominal de las operaciones canceladas.',

  // Partícipes / CCP
  participacion_en_curso: 'Suma de importes CCP activos en operaciones no canceladas.',
  prestamos_en_curso:     'Operaciones en curso donde este partícipe tiene algún contrato CCP activo.',
  rentabilidad_mes:       'Rendimiento neto mensual: devengado bruto menos gestión, antes de impuestos.',

  // Ingresos
  ingr_anuales_activas:    'Intereses anuales de operaciones activas. Americanos: nominal × tasa. Franceses: intereses de cuotas del año en curso.',
  ingr_anuales_participes: 'Parte proporcional de los ingresos anuales correspondiente a participaciones CCP activas.',
  ingr_gestion:            'Ingresos por comisión de gestión (% gestión × participación × 12 meses).',
  ingr_apertura_ltm:       'Comisiones de apertura de operaciones firmadas en los últimos 12 meses.',
  rent_activas:            'Ingresos anuales activas / capital activo.',
  rent_participes:         'Ingresos anuales partícipes / capital participado activo.',
  rent_total_promocima:    '(Ingresos propios + gestión + apertura LTM) / capital propio activo.',

  // Garantías
  ltv:                 'Loan To Value: ratio entre el capital vivo en curso y el valor de tasación de las garantías.',
  ltv_en_curso:        'Capital vivo en curso (activos + judicializados) / suma de tasaciones de garantías de esas operaciones.',
  ltv_participes:      'Capital vivo participado en curso / garantías en curso proporcionales al % de participación CCP.',
  garantias_en_curso:  'Suma del valor de tasación de garantías de operaciones en curso.',
  ltv_en_curso:        'Capital en curso / total garantías en curso.',
  garantias_participes:'Valor de tasación de garantías proporcional a la participación CCP.',
  ltv_participes:      'Capital participado / garantías partícipes.',

  // Duraciones
  duracion: 'Expresadas en meses. Días desde la fecha de inicio hasta hoy (canceladas: hasta fecha de cancelación), divididos entre 30 y redondeados.',

  // Cobros
  total_cobrado:     'Suma de todos los cobros registrados desde el inicio.',
  cobros_ultimo_mes: 'Cobros registrados en los últimos 30 días.',
}
