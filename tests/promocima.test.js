// ═══════════════════════════════════════════════════════════════════════════════
//  TESTS NIVEL 1 — PROMOCIMA
//  Lógica pura: no requiere Supabase ni Vue.
//  Ejecutar desde la raíz del proyecto: node tests/promocima.test.js
//
//  Para añadir un caso: añade una entrada al array correspondiente.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  generateCalendarioTeorico,
  calcCapitalActivoPrestamo,
  calcSituacionPrestamo,
  distribuirCobros,
} from '../src/utils.js'

// ── Runner ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0

function test(id, desc, got, expected, mode = 'num', tolerance = 0.01) {
  let ok
  if (mode === 'bool')   ok = got === expected
  if (mode === 'null')   ok = got === null
  if (mode === 'string') ok = got === expected
  if (mode === 'date')   ok = got === expected
  if (mode === 'num')    ok = Math.abs(Number(got) - Number(expected)) <= tolerance
  if (ok) {
    console.log(`  ✓  ${id.padEnd(8)} ${desc}`)
    passed++
  } else {
    console.log(`  ✗  ${id.padEnd(8)} ${desc}`)
    console.log(`         esperado: ${JSON.stringify(expected)}  |  obtenido: ${JSON.stringify(got)}`)
    failed++
  }
}

function cuota(prestamo, cobros, n) {
  return generateCalendarioTeorico(prestamo, cobros).find(c => c.num === n)
}

// ── Préstamos base reutilizables ──────────────────────────────────────────────
const p_americano_12 = {
  id: 'P-A1', tipo_prestamo: 'Americano',
  importe: 100000, interes_ordinario: 6, duracion_meses: 12,
  fecha_inicio: '2024-01-15', dia_cobro: 15, meses_carencia: 0,
  periodicidad: 'mensual', estado: 'activo',
}
const p_americano_24 = {
  id: 'P-A2', tipo_prestamo: 'Americano',
  importe: 50000, interes_ordinario: 9, duracion_meses: 24,
  fecha_inicio: '2024-03-01', dia_cobro: 1, meses_carencia: 0,
  periodicidad: 'mensual', estado: 'activo',
}
const p_frances_12 = {
  id: 'P-F1', tipo_prestamo: 'Francés',
  importe: 100000, interes_ordinario: 6, duracion_meses: 12,
  fecha_inicio: '2024-01-15', dia_cobro: 15, meses_carencia: 0,
  periodicidad: 'mensual', estado: 'activo',
}
const p_frances_24 = {
  id: 'P-F2', tipo_prestamo: 'Francés',
  importe: 60000, interes_ordinario: 8, duracion_meses: 24,
  fecha_inicio: '2024-06-01', dia_cobro: 1, meses_carencia: 0,
  periodicidad: 'mensual', estado: 'activo',
}
const p_carencia = {
  id: 'P-FC1', tipo_prestamo: 'Francés con carencia',
  importe: 80000, interes_ordinario: 7, duracion_meses: 18,
  fecha_inicio: '2024-01-01', dia_cobro: 1, meses_carencia: 6,
  periodicidad: 'mensual', estado: 'activo',
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 1 — generateCalendarioTeorico
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Grupo 1: Calendario teórico ─────────────────────────────────────')

// A1 — Americano 12m: interés = 100000 × 6% / 12 = 500 cada mes; principal 0 salvo última
{
  const c1  = cuota(p_americano_12, [], 1)
  const c12 = cuota(p_americano_12, [], 12)
  const cal = generateCalendarioTeorico(p_americano_12, [])
  test('A1.1', 'Americano 12m · cuota 1 · fecha',        c1?.fecha,      '2024-02-15', 'date')
  test('A1.2', 'Americano 12m · cuota 1 · interés',      c1?.interes,     500.00)
  test('A1.3', 'Americano 12m · cuota 1 · principal',    c1?.principal,     0.00)
  test('A1.4', 'Americano 12m · cuota 1 · total',        c1?.total,       500.00)
  test('A1.5', 'Americano 12m · cuota 12 · interés',     c12?.interes,    500.00)
  test('A1.6', 'Americano 12m · cuota 12 · principal',   c12?.principal, 100000.00, 'num', 0.05)
  test('A1.7', 'Americano 12m · total cuotas = 12',      cal.length,        12, 'num', 0)
  test('A1.8', 'Americano 12m · suma principal = importe', cal.reduce((s,c)=>s+c.principal,0), 100000, 'num', 0.05)
}

// A2 — Americano 24m: interés = 50000 × 9% / 12 = 375
{
  const c6 = cuota(p_americano_24, [], 6)
  test('A2.1', 'Americano 24m · cuota 6 · interés',    c6?.interes,  375.00)
  test('A2.2', 'Americano 24m · cuota 6 · principal',  c6?.principal,  0.00)
  test('A2.3', 'Americano 24m · cuota 1 · fecha',      cuota(p_americano_24,[],1)?.fecha, '2024-04-01', 'date')
}

// F1 — Francés 12m: valores reales de la función
{
  const cal = generateCalendarioTeorico(p_frances_12, [])
  const c1  = cal[0]
  const c6  = cal[5]
  const c12 = cal[11]
  test('F1.1', 'Francés 12m · cuota 1 · interés',       c1?.interes,    500.00)
  test('F1.2', 'Francés 12m · cuota 1 · total',         c1?.total,     8606.64, 'num', 0.10)
  test('F1.3', 'Francés 12m · cuota 1 · fecha',         c1?.fecha,  '2024-02-15', 'date')
  test('F1.4', 'Francés 12m · cuota 6 · total = cuota 1', Math.abs(c6?.total - c1?.total) < 0.05, true, 'bool')
  test('F1.5', 'Francés 12m · cuota 6 · interés < cuota 1', c6?.interes < c1?.interes, true, 'bool')
  test('F1.6', 'Francés 12m · cuota 12 · fecha',        c12?.fecha, '2025-01-15', 'date')
  test('F1.7', 'Francés 12m · suma principal = importe', cal.reduce((s,c)=>s+c.principal,0), 100000, 'num', 0.10)
  test('F1.8', 'Francés 12m · total cuotas = 12',       cal.length, 12, 'num', 0)
  // Cuota constante: todas las cuotas tienen el mismo total (tolerancia 0.01)
  const totales = cal.map(c=>c.total)
  const maxDiff = Math.max(...totales) - Math.min(...totales)
  test('F1.9', 'Francés 12m · cuota constante (max diff < 1€)', maxDiff < 1, true, 'bool')
}

// F2 — Francés 24m
{
  const cal = generateCalendarioTeorico(p_frances_24, [])
  const c1 = cal[0]
  test('F2.1', 'Francés 24m · cuota 1 · interés',       c1?.interes,  400.00)  // 60000×8%/12
  test('F2.2', 'Francés 24m · cuota 1 · total',         c1?.total,   2713.64, 'num', 0.10)
  test('F2.3', 'Francés 24m · suma principal = importe', cal.reduce((s,c)=>s+c.principal,0), 60000, 'num', 0.10)
  test('F2.4', 'Francés 24m · total cuotas = 24',        cal.length, 24, 'num', 0)
}

// FC1 — Francés con carencia 6m: cuotas 1-6 solo intereses; 7-12 cuota completa
{
  const cal = generateCalendarioTeorico(p_carencia, [])
  const c1 = cal[0]   // carencia
  const c7 = cal[6]   // post-carencia
  test('FC1.1', 'F.Carencia · cuota 1 · principal = 0',   c1?.principal,   0.00)
  test('FC1.2', 'F.Carencia · cuota 1 · interés',         c1?.interes, 466.67, 'num', 0.01)  // 80000×7%/12
  test('FC1.3', 'F.Carencia · cuota 1 · fecha',           c1?.fecha, '2024-02-01', 'date')
  test('FC1.4', 'F.Carencia · cuota 7 · principal > 0',   c7?.principal > 0, true, 'bool')
  test('FC1.5', 'F.Carencia · cuota 7 · fecha',           c7?.fecha, '2024-08-01', 'date')
  test('FC1.6', 'F.Carencia · suma principal = importe',  cal.reduce((s,c)=>s+c.principal,0), 80000, 'num', 0.10)
  test('FC1.7', 'F.Carencia · total cuotas = 18',         cal.length, 18, 'num', 0)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 2 — calcCapitalActivoPrestamo
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Grupo 2: Capital activo ──────────────────────────────────────────')

// CA1 — Americano sin cobros
test('CA1.1', 'Americano sin cobros = importe',
  calcCapitalActivoPrestamo(p_americano_12, []), 100000.00)

// CA2 — Americano con AP 20k
{
  const cobros = [{ tipo:'amortizacion_parcial', importe_principal:20000, fecha_real:'2024-04-15', prestamo_id:'P-A1' }]
  test('CA2.1', 'Americano AP 20k → 80.000',
    calcCapitalActivoPrestamo(p_americano_12, cobros), 80000.00)
}

// CA3 — Americano dos APs
{
  const cobros = [
    { tipo:'amortizacion_parcial', importe_principal:20000, fecha_real:'2024-04-15', prestamo_id:'P-A1' },
    { tipo:'amortizacion_parcial', importe_principal:10000, fecha_real:'2024-06-15', prestamo_id:'P-A1' },
  ]
  test('CA3.1', 'Americano AP 20k+10k → 70.000',
    calcCapitalActivoPrestamo(p_americano_12, cobros), 70000.00)
}

// CF1 — Francés sin cobros
test('CF1.1', 'Francés sin cobros = importe',
  calcCapitalActivoPrestamo(p_frances_12, []), 100000.00)

// CF2 — Francés con cuotas 1-3 cobradas
{
  const cal = generateCalendarioTeorico(p_frances_12, [])
  const cobros = cal.slice(0,3).map((c,i) => ({
    tipo:'pago_cuota', cuota_num:String(i+1),
    importe:c.total, fecha_real:c.fecha, prestamo_id:'P-F1'
  }))
  const capital = calcCapitalActivoPrestamo(p_frances_12, cobros)
  // Valor real obtenido de la función: 75558.28
  test('CF2.1', 'Francés 3 cuotas cobradas · capital < 100000', capital < 100000, true, 'bool')
  test('CF2.2', 'Francés 3 cuotas cobradas · capital > 70000',  capital > 70000,  true, 'bool')
  test('CF2.3', 'Francés 3 cuotas cobradas · capital ≈ 75.558', capital, 75558.28, 'num', 0.10)
}

// CF3 — Francés completamente amortizado
{
  const cal = generateCalendarioTeorico(p_frances_12, [])
  const cobros = cal.map((c,i) => ({
    tipo:'pago_cuota', cuota_num:String(i+1),
    importe:c.total, fecha_real:c.fecha, prestamo_id:'P-F1'
  }))
  test('CF3.1', 'Francés 12 cuotas cobradas → capital = 0',
    calcCapitalActivoPrestamo(p_frances_12, cobros), 0, 'num', 0.10)
}

// CF4 — Francés con AP + cuotas cobradas
{
  const cobros = [
    { tipo:'amortizacion_parcial', importe_principal:30000, fecha_real:'2024-03-15', prestamo_id:'P-F1' },
  ]
  const calConAP = generateCalendarioTeorico(p_frances_12, cobros)
  // Añadir 3 cuotas cobradas post-AP
  const cuotasCobradas = calConAP.slice(2,5).map((c,i) => ({
    tipo:'pago_cuota', cuota_num:String(c.num),
    importe:c.total, fecha_real:c.fecha, prestamo_id:'P-F1'
  }))
  const allCobros = [...cobros, ...cuotasCobradas]
  const capital = calcCapitalActivoPrestamo(p_frances_12, allCobros)
  test('CF4.1', 'Francés AP 30k + 3 cuotas · capital < 70000', capital < 70000, true, 'bool')
  test('CF4.2', 'Francés AP 30k + 3 cuotas · capital > 0',     capital > 0,     true, 'bool')
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPO 3 — calcSituacionPrestamo
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Grupo 3: Situación préstamo ──────────────────────────────────────')

// S1 — Cancelado → null
test('S1.1', 'Cancelado → null',
  calcSituacionPrestamo({ ...p_americano_12, estado:'cancelado' }, []),
  null, 'null')

// S2 — Judicializado → null
test('S2.1', 'Judicializado → null',
  calcSituacionPrestamo({ ...p_americano_12, estado:'judicializado' }, []),
  null, 'null')

// S3 — Inicio futuro, sin cuotas vencidas → al_dia
{
  const hoy = new Date()
  const futuro = new Date(hoy); futuro.setMonth(futuro.getMonth() + 2)
  const fecha = `${futuro.getFullYear()}-${String(futuro.getMonth()+1).padStart(2,'0')}-01`
  test('S3.1', 'Inicio futuro → al_dia',
    calcSituacionPrestamo({ ...p_americano_12, fecha_inicio: fecha }, []),
    'al_dia', 'string')
}

// S4 — Todas las cuotas cobradas → al_dia
{
  const cal = generateCalendarioTeorico(p_americano_12, [])
  const cobros = cal.map((c,i) => ({
    tipo:'pago_cuota', cuota_num:String(i+1),
    importe:c.total, fecha_real:c.fecha, prestamo_id:'P-A1'
  }))
  const sit = calcSituacionPrestamo(p_americano_12, cobros)
  // Con todas cobradas no hay vencidas sin cobrar → al_dia
  test('S4.1', 'Todas las cuotas cobradas → al_dia', sit, 'al_dia', 'string')
}

// S5 — Cuotas vencidas sin cobrar → con_retraso
{
  // Usar fecha_inicio antigua con 0 cobros: varias cuotas vencidas
  const p = { ...p_americano_24, fecha_inicio:'2022-01-01', id:'P-S5' }
  const sit = calcSituacionPrestamo(p, [])
  test('S5.1', 'Cuotas vencidas sin cobrar → con_retraso', sit, 'con_retraso', 'string')
}

// S6 — Solo cuota 1 sin cobrar, resto cobradas → con_retraso
{
  const cal = generateCalendarioTeorico(p_americano_12, [])
  // Cobrar cuotas 2-12, dejar cuota 1 sin cobrar
  const cobros = cal.slice(1).map((c,i) => ({
    tipo:'pago_cuota', cuota_num:String(i+2),
    importe:c.total, fecha_real:c.fecha, prestamo_id:'P-A1'
  }))
  const sit = calcSituacionPrestamo(p_americano_12, cobros)
  test('S6.1', 'Cuota 1 sin cobrar → con_retraso', sit, 'con_retraso', 'string')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(60)}`)
console.log(`  Total: ${passed + failed} tests  |  ✓ ${passed} pasados  |  ✗ ${failed} fallidos`)
console.log(`${'─'.repeat(60)}\n`)
if (failed > 0) process.exit(1)
