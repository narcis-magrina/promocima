/**
 * Tests Promocima — basados en promocima_test_cases_v3.xlsx
 * Ejecutar: npx vitest run tests/promocima.test.js
 *
 * Hojas cubiertas:
 *   1_Calculo_cuota    → generateCalendarioTeorico()
 *   2_Capital_Activo   → calcCapitalActivoPrestamo()
 *   3_Situacion        → calcSituacionPrestamo()
 *   4_KPIs_Dashboard   → lógica del Dashboard con dataset fijo (fecha sistema: 2026-03-20)
 *
 * Dataset KPIs:
 *   P1: Americano 100k 6% 36m 2024-06-15 cancelado   garantia 200k apertura 2%
 *   P2: Francés   60k  8% 48m 2025-08-20 activo       garantia 200k apertura 2%
 *   P3: Americano 80k  9% 60m 2024-09-05 cancelado   garantia 300k apertura 2%
 *   P4: Francés   80k  8% 36m 2024-10-10 judicializado garantia 250k apertura 1%
 *   CCP1: P1 40%  CCP2: P2 50%  CCP3: P3 25%  — gestión 2% todos
 *   Cobros: P2 y P4 con 3 cuotas cobradas
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  generateCalendarioTeorico,
  calcCapitalActivoPrestamo,
  calcSituacionPrestamo,
  distribuirCobros,
  setToday,
  resetToday,
  fmt, fmtInt, fmtN, fmtDec,
  calcInteresOrdinario, calcInteresesDemora, getLTV,
  generateCalendarioCCP,
  calcularLineasCCP,
} from '../src/utils.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const prest = (tipo, importe, tasa, meses, inicio, dia, carencia = 0, estado = 'activo') => ({
  tipo_prestamo: tipo, importe, interes_ordinario: tasa, duracion_meses: meses,
  fecha_inicio: inicio, dia_cobro: dia, periodicidad: 'mensual',
  meses_carencia: carencia, estado,
})

const cobro = (tipo, importe, fecha) => ({
  tipo, importe, fecha_real: fecha, fecha_teorica: fecha,
})

const tol = (calc, esp, tolerancia = 0.02) =>
  expect(Math.abs(Number(calc) - Number(esp))).toBeLessThanOrEqual(tolerancia)

// ─── Hoja 1: Calendario teórico ──────────────────────────────────────────────

describe('Hoja 1 — generateCalendarioTeorico', () => {

  describe('A1: Americano 100k 6% 12m inicio 2024-01-15 día 15', () => {
    const cal = generateCalendarioTeorico(prest('Americano', 100000, 6, 12, '2024-01-15', 15))
    it('c1 fecha',                () => expect(cal[0].fecha).toBe('2024-02-15'))
    it('c1 interés',              () => tol(cal[0].interes, 500))
    it('c1 principal',            () => tol(cal[0].principal, 0))
    it('c12 fecha',               () => expect(cal[11].fecha).toBe('2025-01-15'))
    it('c12 interés',             () => tol(cal[11].interes, 500))
    it('c12 principal',           () => tol(cal[11].principal, 100000))
  })

  describe('A2: Americano 50k 9% 24m inicio 2024-03-01 día 1', () => {
    const cal = generateCalendarioTeorico(prest('Americano', 50000, 9, 24, '2024-03-01', 1))
    it('c6 fecha',                () => expect(cal[5].fecha).toBe('2024-09-01'))
    it('c6 interés',              () => tol(cal[5].interes, 375))
    it('c6 principal',            () => tol(cal[5].principal, 0))
  })

  describe('F1: Francés 100k 6% 12m inicio 2024-01-15 día 15', () => {
    const cal = generateCalendarioTeorico(prest('Francés', 100000, 6, 12, '2024-01-15', 15))
    it('c1 fecha',                () => expect(cal[0].fecha).toBe('2024-02-15'))
    it('c1 interés',              () => tol(cal[0].interes, 500, 0.01))
    it('c1 principal',            () => tol(cal[0].principal, 8106.642971, 0.01))
    it('c1 total (PMT)',          () => tol(cal[0].total, 8606.642971, 0.01))
    it('c6 fecha',                () => expect(cal[5].fecha).toBe('2024-07-15'))
    it('c6 interés reducido',     () => tol(cal[5].interes, 295.297106, 0.01))
    it('c6 principal',            () => tol(cal[5].principal, 8311.345864, 0.01))
    it('c12 fecha',               () => expect(cal[11].fecha).toBe('2025-01-15'))
    it('c12 interés',             () => tol(cal[11].interes, 42.819119, 0.01))
    it('c12 principal',           () => tol(cal[11].principal, 8563.823851, 0.1))
  })

  describe('F2: Francés 60k 8% 24m inicio 2024-06-01 día 1', () => {
    const cal = generateCalendarioTeorico(prest('Francés', 60000, 8, 24, '2024-06-01', 1))
    it('c1 fecha',                () => expect(cal[0].fecha).toBe('2024-07-01'))
    it('c1 interés',              () => tol(cal[0].interes, 400))
    it('c1 principal',            () => tol(cal[0].principal, 2313.637487, 0.01))
    it('c1 total',                () => tol(cal[0].total, 2713.637487, 0.01))
  })

  describe('FC1: Francés carencia 80k 7% 18m carencia 6m inicio 2024-01-01 día 1', () => {
    const cal = generateCalendarioTeorico(prest('Francés con carencia', 80000, 7, 18, '2024-01-01', 1, 6))
    it('c1 fecha',                () => expect(cal[0].fecha).toBe('2024-02-01'))
    it('c1 interés (carencia)',   () => tol(cal[0].interes, 466.666667, 0.01))
    it('c1 principal = 0',        () => tol(cal[0].principal, 0))
    it('c7 fecha',                () => expect(cal[6].fecha).toBe('2024-08-01'))
    it('c7 interés',              () => tol(cal[6].interes, 466.67, 0.01))
    it('c7 principal',            () => tol(cal[6].principal, 6455.47, 0.1))
  })
})

// ─── Hoja 2: Capital Activo ───────────────────────────────────────────────────

describe('Hoja 2 — calcCapitalActivoPrestamo', () => {
  const pA = prest('Americano', 100000, 6, 12, '2024-01-15', 15)
  const pF = prest('Francés', 100000, 6, 12, '2024-01-15', 15)
  const PMT = generateCalendarioTeorico(pF)[0].total

  it('CA1: Americano sin cobros → importe íntegro', () =>
    tol(calcCapitalActivoPrestamo(pA, []), 100000))

  it('CF1: Francés sin cobros → importe íntegro', () =>
    tol(calcCapitalActivoPrestamo(pF, []), 100000))

  it('CF2: Francés 3 cuotas cobradas → saldo reducido', () => {
    const cobros = [1, 2, 3].map(i => cobro('pago_cuota', PMT, `2024-0${i+1}-15`))
    tol(calcCapitalActivoPrestamo(pF, cobros), 75558.27, 0.1)
  })

  it('CF3: Francés 12 cuotas cobradas → capital ≈ 0', () => {
    const cal = generateCalendarioTeorico(pF)
    const fechas = ['02','03','04','05','06','07','08','09','10','11','12']
      .map(m => `2024-${m}-15`)
    fechas.push('2025-01-15')
    const cobros = cal.map((cu, i) => cobro('pago_cuota', cu.total, fechas[i]))
    tol(calcCapitalActivoPrestamo(pF, cobros), 0, 0.1)
  })
})

// ─── Hoja 3: Situación ────────────────────────────────────────────────────────

describe('Hoja 3 — calcSituacionPrestamo', () => {
  beforeEach(() => setToday('2026-03-20'))
  afterEach(()  => resetToday())

  it('S1: Cancelado → null', () =>
    expect(calcSituacionPrestamo(
      prest('Americano', 50000, 6, 12, '2024-01-01', 1, 0, 'cancelado'), []
    )).toBeNull())

  it('S2: Judicializado → null', () =>
    expect(calcSituacionPrestamo(
      prest('Americano', 50000, 6, 12, '2024-01-01', 1, 0, 'judicializado'), []
    )).toBeNull())

  it('S3: Inicio futuro → al_dia', () =>
    expect(calcSituacionPrestamo(
      prest('Americano', 50000, 6, 12, '2026-05-20', 1), []
    )).toBe('al_dia'))

  it('S4: Todas las cuotas cobradas → al_dia', () => {
    const p = prest('Americano', 100000, 6, 12, '2024-01-15', 15)
    const cobros = [...Array(11).keys()]
      .map(i => cobro('pago_cuota', 500, `2024-${String(i+2).padStart(2,'0')}-15`))
    cobros.push(cobro('pago_cuota', 100500, '2025-01-15'))
    expect(calcSituacionPrestamo(p, cobros)).toBe('al_dia')
  })

  it('S5: Inicio antiguo sin cobros → con_retraso', () =>
    expect(calcSituacionPrestamo(
      prest('Americano', 50000, 6, 24, '2022-01-01', 1), []
    )).toBe('con_retraso'))

  it('S6: Cuota 1 sin cobrar (cobros 2-12) → con_retraso', () => {
    const p = prest('Americano', 100000, 6, 12, '2024-01-15', 15)
    const cobros = [...Array(10).keys()]
      .map(i => cobro('pago_cuota', 500, `2024-${String(i+3).padStart(2,'0')}-15`))
    cobros.push(cobro('pago_cuota', 100500, '2025-01-15'))
    expect(calcSituacionPrestamo(p, cobros)).toBe('con_retraso')
  })
})

// ─── Hoja 4: KPIs Dashboard ───────────────────────────────────────────────────

describe('Hoja 4 — KPIs Dashboard (fecha sistema: 2026-03-20)', () => {
  beforeEach(() => setToday('2026-03-20'))
  afterEach(()  => resetToday())

  // ── Dataset ────────────────────────────────────────────────────────────────
  const mkP = (id, tipo, imp, tasa, meses, inicio, dia, estado, garantia, apertura) => ({
    id, tipo_prestamo: tipo, importe: imp, interes_ordinario: tasa, duracion_meses: meses,
    fecha_inicio: inicio, dia_cobro: dia, periodicidad: 'mensual', meses_carencia: 0,
    estado, garantia_tasacion: garantia, comision_apertura: apertura,
  })

  const prestamos = [
    mkP('P1', 'Americano', 100000, 6, 36, '2024-06-15', 15, 'cancelado',    200000, 2),
    mkP('P2', 'Francés',    60000, 8, 48, '2025-08-20', 20, 'activo',       200000, 2),
    mkP('P3', 'Americano',  80000, 9, 60, '2024-09-05',  5, 'cancelado',    300000, 2),
    mkP('P4', 'Francés',    80000, 8, 36, '2024-10-10', 10, 'judicializado',250000, 1),
  ]

  const ccps = [
    { prestamo_id: 'P1', pct: 0.4, pct_gestion: 0.02 },
    { prestamo_id: 'P2', pct: 0.5, pct_gestion: 0.02 },
    { prestamo_id: 'P3', pct: 0.25, pct_gestion: 0.02 },
  ]

  // Cobros: 3 cuotas cobradas de P2 y P4
  const calP2 = generateCalendarioTeorico(prestamos[1])
  const cobrosP2 = calP2.slice(0, 3).map((cu, i) => {
    const d = new Date('2025-08-20T00:00:00')
    d.setMonth(d.getMonth() + i + 1)
    return cobro('pago_cuota', cu.total, d.toISOString().slice(0, 10))
  })
  const calP4 = generateCalendarioTeorico(prestamos[3])
  const cobrosP4 = calP4.slice(0, 3).map((cu, i) => {
    const d = new Date('2024-10-10T00:00:00')
    d.setMonth(d.getMonth() + i + 1)
    return cobro('pago_cuota', cu.total, d.toISOString().slice(0, 10))
  })
  const cxid = { P1: [], P2: cobrosP2, P3: [], P4: cobrosP4 }

  // ── Helpers KPI ────────────────────────────────────────────────────────────
  const cap = id => {
    const p = prestamos.find(p => p.id === id)
    if (p.estado === 'cancelado') return 0
    return calcCapitalActivoPrestamo(p, cxid[id])
  }
  const enCurso  = () => prestamos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + cap(p.id), 0)
  const activo   = () => prestamos.filter(p => p.estado === 'activo').reduce((s, p) => s + cap(p.id), 0)
  const judicial = () => prestamos.filter(p => p.estado === 'judicializado').reduce((s, p) => s + cap(p.id), 0)

  const capPartActivo = () => ccps.reduce((s, ccp) => {
    const p = prestamos.find(p => p.id === ccp.prestamo_id)
    if (p.estado === 'cancelado') return s
    if (p.estado === 'judicializado') return s
    return s + cap(ccp.prestamo_id) * ccp.pct
  }, 0)

  const ingrAnualesP = p => {
    if (p.estado === 'cancelado' || p.estado === 'judicializado') return 0
    return generateCalendarioTeorico(p)
      .filter(c => new Date(c.fecha + 'T00:00:00').getFullYear() === 2026)
      .reduce((s, c) => s + c.interes, 0)
  }
  const totalIngr   = () => prestamos.reduce((s, p) => s + ingrAnualesP(p), 0)
  const ingrPart    = () => ccps.reduce((s, ccp) => {
    const p = prestamos.find(p => p.id === ccp.prestamo_id)
    if (p.estado === 'cancelado' || p.estado === 'judicializado') return s
    return s + ingrAnualesP(p) * ccp.pct
  }, 0)
  // Gestión: sobre capital vivo de la participación (cap vivo × % participación × % gestión)
  const ingrGestion = () => ccps.reduce((s, ccp) => {
    const p = prestamos.find(p => p.id === ccp.prestamo_id)
    if (p.estado === 'cancelado' || p.estado === 'judicializado') return s
    return s + Math.round(cap(ccp.prestamo_id) * ccp.pct * ccp.pct_gestion * 100) / 100
  }, 0)
  const ingrApertura = () => {
    const hoy = new Date('2026-03-20'), hace12 = new Date('2025-03-20')
    return prestamos.reduce((s, p) => {
      const fi = new Date(p.fecha_inicio + 'T00:00:00')
      if (fi >= hace12 && fi <= hoy && p.estado !== 'cancelado')
        return s + Math.round(p.importe * p.comision_apertura / 100 * 100) / 100
      return s
    }, 0)
  }
  const garantiasEnCurso  = () => prestamos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + p.garantia_tasacion, 0)
  const garantiasParticipes = () => ccps.reduce((s, ccp) => {
    const p = prestamos.find(p => p.id === ccp.prestamo_id)
    if (p.estado === 'cancelado') return s
    return s + p.garantia_tasacion * ccp.pct
  }, 0)

  // K5: meses transcurridos desde fecha_inicio hasta fecha_sistema (por diferencia de meses de calendario)
  const mesesDesdeInicio = p => {
    const hoy   = new Date('2026-03-20T00:00:00')
    const inicio = new Date(p.fecha_inicio + 'T00:00:00')
    return (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth())
  }
  const durMedia = grupo => {
    const arr = prestamos.filter(grupo)
    return Math.round(arr.reduce((s, p) => s + mesesDesdeInicio(p), 0) / arr.length)
  }

  // ── K1: Capital ─────────────────────────────────────────────────────────────
  describe('K1 Capital', () => {
    it('K1.1 Invertido (no cancelados)',    () => tol(prestamos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + p.importe, 0), 140000))
    it('K1.2 En curso (capital activo)',     () => tol(enCurso(), 130824.04, 0.1))
    it('K1.3 Activo (no judicial)',          () => tol(activo(), 56784.33, 0.1))
    it('K1.4 Judicializado',                () => tol(judicial(), 74039.71, 0.1))
    it('K1.5 % judicializado',              () => tol(judicial() / (activo() + judicial()), 0.565949, 0.001))
    it('K1.6 Participado activo',           () => tol(capPartActivo(), 28392.165, 0.1))
    it('K1.7 Participado judicializado = 0',() => tol(0, 0))
    it('K1.8 % jud partícipes = 0',         () => tol(0, 0))
  })

  // ── K2: Rendimiento ──────────────────────────────────────────────────────────
  describe('K2 Rendimiento', () => {
    it('K2.1 Ingresos anuales 2026',        () => tol(totalIngr(), 3963.875785, 0.5))
    it('K2.2 Ingresos partícipes 2026',     () => tol(ingrPart(), 1981.937892, 0.5))
    it('K2.3 Ingresos gestión',             () => tol(ingrGestion(), 567.8433, 1))
    it('K2.4 Ingresos apertura LTM',        () => tol(ingrApertura(), 1200, 1))
    it('K2.5 Rent. activas',                () => tol(totalIngr() / activo(), 0.069806, 0.001))
    it('K2.6 Rent. partícipes',             () => tol(ingrPart() / capPartActivo(), 0.069806, 0.001))
    it('K2.7 Rent. Promocima',              () => tol(
      (totalIngr() - ingrPart() + ingrGestion() + ingrApertura()) / (activo() - capPartActivo()),
      0.132071, 0.001))
  })

  // ── K3: Operaciones ──────────────────────────────────────────────────────────
  describe('K3 Operaciones', () => {
    it('K3.1 Total = 4',                    () => expect(prestamos.length).toBe(4))
    it('K3.2 Canceladas = 2',               () => expect(prestamos.filter(p => p.estado === 'cancelado').length).toBe(2))
    it('K3.3 En curso = 2',                 () => expect(prestamos.filter(p => p.estado !== 'cancelado').length).toBe(2))
    it('K3.4 Judicializadas = 1',           () => expect(prestamos.filter(p => p.estado === 'judicializado').length).toBe(1))
    it('K3.5 Activas = 1',                  () => expect(prestamos.filter(p => p.estado === 'activo').length).toBe(1))
  })

  // ── K4: LTV ──────────────────────────────────────────────────────────────────
  describe('K4 LTV', () => {
    it('K4.1 Garantías en curso',           () => tol(garantiasEnCurso(), 450000))
    it('K4.2 LTV en curso',                 () => tol(enCurso() / garantiasEnCurso(), 0.29072, 0.001))
    it('K4.3 Garantías partícipes',         () => tol(garantiasParticipes(), 100000))
    it('K4.4 LTV partícipes',               () => tol(capPartActivo() / garantiasParticipes(), 0.283922, 0.001))
  })

  // ── K5: Duración ─────────────────────────────────────────────────────────────
  // Meses transcurridos desde fecha_inicio hasta fecha del sistema (diferencia de meses de calendario)
  describe('K5 Duración', () => {
    it('K5.1 Media en curso (meses)',        () => expect(durMedia(p => p.estado !== 'cancelado')).toBe(12))
    it('K5.2 Media activas (meses)',         () => expect(durMedia(p => p.estado === 'activo')).toBe(7))
    it('K5.3 Media judicializadas (meses)',  () => expect(durMedia(p => p.estado === 'judicializado')).toBe(17))
  })
})

// ─── Hoja 5: Formateadores ────────────────────────────────────────────────────

describe('Hoja 5 — fmt / fmtInt / fmtN / fmtDec', () => {
  describe('fmt', () => {
    it('F01 positivo con miles',    () => expect(fmt(1234.56)).toBe('1.234,56 €'))
    it('F02 negativo',              () => expect(fmt(-1234.56)).toBe('-1.234,56 €'))
    it('F03 cero',                  () => expect(fmt(0)).toBe('0,00 €'))
    it('F04 millón',                () => expect(fmt(1000000)).toBe('1.000.000,00 €'))
    it('F05 menos de 1',            () => expect(fmt(0.5)).toBe('0,50 €'))
    it('F06 null → guion',          () => expect(fmt(null)).toBe('—'))
  })

  describe('fmtInt', () => {
    it('F07 redondea a entero',     () => expect(fmtInt(1234.56)).toBe('1.235 €'))
    it('F08 millón sin decimales',  () => expect(fmtInt(1000000)).toBe('1.000.000 €'))
    it('F09 null → guion',          () => expect(fmtInt(null)).toBe('—'))
  })

  describe('fmtN', () => {
    it('F10 sin € ni decimales',    () => expect(fmtN(1234.56)).toBe('1.235'))
    it('F11 negativo sin €',        () => expect(fmtN(-500)).toBe('-500'))
    it('F12 null → guion',          () => expect(fmtN(null)).toBe('—'))
  })

  describe('fmtDec', () => {
    it('F13 con decimales sin €',   () => expect(fmtDec(1234.56)).toBe('1.234,56'))
    it('F14 negativo sin €',        () => expect(fmtDec(-1234.56)).toBe('-1.234,56'))
    it('F15 null → guion',          () => expect(fmtDec(null)).toBe('—'))
  })
})

// ─── Hoja 6: Cálculos auxiliares ─────────────────────────────────────────────

describe('Hoja 6 — calcInteresOrdinario / calcInteresesDemora / getLTV', () => {
  describe('calcInteresOrdinario(importe, tasa)', () => {
    it('C01 100k 6%',   () => expect(calcInteresOrdinario(100000, 6)).toBe(500))
    it('C02 60k 8%',    () => expect(calcInteresOrdinario(60000,  8)).toBe(400))
    it('C03 80k 9%',    () => expect(calcInteresOrdinario(80000,  9)).toBe(600))
    it('C04 tasa 0',    () => expect(calcInteresOrdinario(50000,  0)).toBe(0))
  })

  describe('calcInteresesDemora(importe, tasa, dias)', () => {
    it('D01 30 días',   () => expect(Math.abs(calcInteresesDemora(10000, 14, 30)  - 115.07)).toBeLessThan(0.01))
    it('D02 0 días',    () => expect(calcInteresesDemora(10000, 14, 0)).toBe(0))
    it('D03 365 días',  () => expect(Math.abs(calcInteresesDemora(10000, 14, 365) - 1400)).toBeLessThan(0.01))
    it('D04 90 días',   () => expect(Math.abs(calcInteresesDemora(50000, 10, 90)  - 1232.88)).toBeLessThan(0.01))
  })

  describe('getLTV(prestamo, garantia)', () => {
    it('L01 LTV 50%',       () => expect(getLTV({importe:100000}, {valor_tasacion:200000})).toBe('50.0'))
    it('L02 LTV 26.7%',     () => expect(getLTV({importe:80000},  {valor_tasacion:300000})).toBe('26.7'))
    it('L03 sin garantía → null', () => expect(getLTV({importe:100000}, null)).toBeNull())
  })
})

// ─── Hoja 7: generateCalendarioCCP ───────────────────────────────────────────

describe('Hoja 7 — generateCalendarioCCP', () => {
  const prestamo = {
    tipo_prestamo: 'Americano', importe: 100000, interes_ordinario: 6,
    duracion_meses: 12, fecha_inicio: '2024-01-15', dia_cobro: 15,
    periodicidad: 'mensual', estado: 'activo',
  }
  const mkCCP = (firma) => ({
    fecha_firma: firma, importe_participacion: 40000,
    porcentaje_participacion: 40, porcentaje_gestion: 2,
  })
  const tol = (a, b, t = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(t)

  describe('CC1: firma mismo día cobro (2024-01-15)', () => {
    const cal = generateCalendarioCCP(mkCCP('2024-01-15'), prestamo)
    it('c1 fecha_prestamo',  () => expect(cal[0].fecha_prestamo).toBe('2024-02-15'))
    it('c1 factor = 1',      () => expect(cal[0].factor).toBe(1))
    it('c1 beneficio',       () => tol(cal[0].beneficio, 200))
    it('c1 gestión',         () => tol(cal[0].gestion, 66.67))
    it('c1 neto',            () => tol(cal[0].neto, 108))
    it('c12 fecha_prestamo', () => expect(cal[11].fecha_prestamo).toBe('2025-01-15'))
    it('c12 factor = 1',     () => expect(cal[11].factor).toBe(1))
    it('c12 neto',           () => tol(cal[11].neto, 108))
    it('total 12 cuotas',    () => expect(cal.length).toBe(12))
  })

  describe('CC2: firma antes del cobro (2024-01-05, día cobro 15)', () => {
    const cal = generateCalendarioCCP(mkCCP('2024-01-05'), prestamo)
    it('c1 factor proporcional (15-5)/30',  () => tol(cal[0].factor, (15-5)/30, 0.001))
    it('c1 beneficio proporcional',          () => tol(cal[0].beneficio, 66.67))
    it('c1 neto proporcional',               () => tol(cal[0].neto, 36))
    it('c2 factor = 1',                      () => expect(cal[1].factor).toBe(1))
    it('c2 neto completo',                   () => tol(cal[1].neto, 108))
  })

  describe('CC3: firma después del cobro (2024-02-20, día cobro 15)', () => {
    const cal = generateCalendarioCCP(mkCCP('2024-02-20'), prestamo)
    it('c2 del préstamo omitida (factor=0)', () => {
      // la primera cuota del calendario debe ser c3 del préstamo
      expect(cal[0].num).toBe(3)
    })
    it('primera cuota del partícipe: c3 préstamo, factor (30-20+15)/30', () =>
      tol(cal[0].factor, (30-20+15)/30, 0.001))
    it('primera cuota neto proporcional',    () => tol(cal[0].neto, 90))
    it('segunda cuota (c4) factor = 1',      () => expect(cal[1].factor).toBe(1))
    it('segunda cuota neto completo',        () => tol(cal[1].neto, 108))
  })

  describe('CC4: firma a mitad del préstamo (2024-06-15 = c5)', () => {
    const cal = generateCalendarioCCP(mkCCP('2024-06-15'), prestamo)
    it('primera cuota es c5 del préstamo',  () => expect(cal[0].num).toBe(5))
    it('fecha_prestamo primera cuota',       () => expect(cal[0].fecha_prestamo).toBe('2024-06-15'))
    it('factor = 1 (firma coincide día)',     () => expect(cal[0].factor).toBe(1))
    it('total 8 cuotas (c5..c12)',           () => expect(cal.length).toBe(8))
  })
})

// ─── Hoja 8: calcularLineasCCP ────────────────────────────────────────────────

describe('Hoja 8 — calcularLineasCCP', () => {
  const prestamo = {
    tipo_prestamo: 'Americano', importe: 100000, interes_ordinario: 6,
    duracion_meses: 12, fecha_inicio: '2024-01-15', dia_cobro: 15,
    periodicidad: 'mensual', estado: 'activo',
  }
  const contrato = {
    fecha_firma: '2024-01-15', importe_participacion: 40000,
    porcentaje_participacion: 40, porcentaje_gestion: 2,
  }
  const mkCobro = (num, imp, fecha) => ({
    cuota_num: String(num), importe: imp,
    fecha_real: fecha, fecha_teorica: fecha,
    tipo: 'pago_cuota', prestamo_id: 'P1',
  })
  const mkPago = (imp, fecha) => ({ importe_neto: imp, fecha_pago_real: fecha })
  const tol = (a, b, t = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(t)

  it('L01 sin cobros → c1 pendiente=108 dev=0 pag=0', () => {
    const lineas = calcularLineasCCP(contrato, prestamo, [], [])
    tol(lineas[0].col_pendiente, 108)
    tol(lineas[0].col_devengado, 0)
    tol(lineas[0].col_pagado, 0)
    expect(lineas[0].estado).toBe('pendiente')
  })

  it('L02 sin cobros → c3 también pendiente', () => {
    const lineas = calcularLineasCCP(contrato, prestamo, [], [])
    tol(lineas[2].col_pendiente, 108)
    expect(lineas[2].estado).toBe('pendiente')
  })

  it('L03 c1 cobrada sin pago → devengado', () => {
    const lineas = calcularLineasCCP(contrato, prestamo, [mkCobro(1,500,'2024-02-15')], [])
    tol(lineas[0].col_pendiente, 0)
    tol(lineas[0].col_devengado, 108)
    tol(lineas[0].col_pagado, 0)
    expect(lineas[0].estado).toBe('devengado')
  })

  it('L04 c2 cobrada sin pago → también devengada', () => {
    const cobros = [mkCobro(1,500,'2024-02-15'), mkCobro(2,500,'2024-03-15')]
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, [])
    tol(lineas[1].col_devengado, 108)
    expect(lineas[1].estado).toBe('devengado')
  })

  it('L05 c1 cobrada y pago 108 → pagado', () => {
    const lineas = calcularLineasCCP(
      contrato, prestamo,
      [mkCobro(1,500,'2024-02-15')],
      [mkPago(108,'2024-03-10')]
    )
    tol(lineas[0].col_pagado, 108)
    tol(lineas[0].col_devengado, 0)
    tol(lineas[0].col_pendiente, 0)
    expect(lineas[0].estado).toBe('pagado')
  })

  it('L06 c1 cobrada, pago parcial 50 → mixto', () => {
    const lineas = calcularLineasCCP(
      contrato, prestamo,
      [mkCobro(1,500,'2024-02-15')],
      [mkPago(50,'2024-03-10')]
    )
    tol(lineas[0].col_pagado, 50)
    tol(lineas[0].col_devengado, 58)
    tol(lineas[0].col_pendiente, 0)
    expect(lineas[0].estado).toBe('mixto')
  })

  it('L07 c1+c2 cobradas, pago 108 → c1 pagada', () => {
    const cobros = [mkCobro(1,500,'2024-02-15'), mkCobro(2,500,'2024-03-15')]
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, [mkPago(108,'2024-03-10')])
    tol(lineas[0].col_pagado, 108)
    expect(lineas[0].estado).toBe('pagado')
  })

  it('L08 c1+c2 cobradas, pago 108 → c2 devengada', () => {
    const cobros = [mkCobro(1,500,'2024-02-15'), mkCobro(2,500,'2024-03-15')]
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, [mkPago(108,'2024-03-10')])
    tol(lineas[1].col_devengado, 108)
    tol(lineas[1].col_pagado, 0)
    expect(lineas[1].estado).toBe('devengado')
  })

  it('L09 c1+c2 cobradas, pago 216 → c1 pagada', () => {
    const cobros = [mkCobro(1,500,'2024-02-15'), mkCobro(2,500,'2024-03-15')]
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, [mkPago(216,'2024-03-10')])
    tol(lineas[0].col_pagado, 108)
    expect(lineas[0].estado).toBe('pagado')
  })

  it('L10 c1+c2 cobradas, pago 216 → c2 también pagada', () => {
    const cobros = [mkCobro(1,500,'2024-02-15'), mkCobro(2,500,'2024-03-15')]
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, [mkPago(216,'2024-03-10')])
    tol(lineas[1].col_pagado, 108)
    expect(lineas[1].estado).toBe('pagado')
  })

  it('L11 c1 cobrada a medias (250/500) → ratio 0.5, mixto', () => {
    const lineas = calcularLineasCCP(contrato, prestamo, [mkCobro(1,250,'2024-02-15')], [])
    tol(lineas[0].col_pendiente, 54)
    tol(lineas[0].col_devengado, 54)
    tol(lineas[0].col_pagado, 0)
    expect(lineas[0].estado).toBe('mixto')
  })
})
