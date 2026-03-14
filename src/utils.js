// ═══════════════════════════════════════════════
//  UTILIDADES COMPARTIDAS — PROMOCIMA
// ═══════════════════════════════════════════════

export const fmt = (n) => {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  // Formateo manual, independiente del locale del navegador/SO
  const [intPart, decPart] = abs.toFixed(2).split('.')
  // Añadir puntos de miles manualmente
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${intFormatted},${decPart} €`
}

// Igual que fmt pero sin decimales (para el Dashboard)
export const fmtInt = (n) => {
  if (n === null || n === undefined) return '—'
  const num = Math.round(Number(n))
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const intFormatted = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${intFormatted} €`
}

export const fmtN = (n) => {
  if (n === null || n === undefined) return '—'
  const num = Math.round(Number(n))
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const intFormatted = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${intFormatted}`
}

// Igual que fmt pero sin símbolo € (para celdas de tabla donde el título ya dice "importes en €")
export const fmtDec = (n) => {
  if (n === null || n === undefined) return '—'
  const num = Number(n)
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${intFormatted},${decPart}`
}

export const fmtPct = (n) => Number(n).toFixed(2) + '%'

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const uuid = () => Math.random().toString(36).substr(2, 9).toUpperCase()

// ── Fecha de referencia global ─────────────────────────────────────────────
// Si se configura una fecha de referencia, se usa en lugar de la fecha real.
// Así los estados "al día / con retraso" son comparables a un día determinado.
import { ref } from 'vue'
export const today = () => new Date().toISOString().split('T')[0]

// ── Cálculos financieros ──────────────────────

export const calcInteresOrdinario = (importe, tasa) => {
  return (importe * (tasa / 100)) / 12
}

export const calcInteresesDemora = (importe, tasa, dias) => {
  return (importe * (tasa / 100) / 365) * dias
}

export const getLTV = (prestamo, garantia) => {
  if (!garantia) return null
  return (prestamo.importe / garantia.valor_tasacion * 100).toFixed(1)
}

// ── Calendario teórico ────────────────────────

// cobros opcionales: si se pasan, las amortizaciones parciales recalculan el calendario
export const generateCalendarioTeorico = (prestamo, cobros = []) => {
  if (prestamo.estado === 'cancelado') return []

  const r      = v => Math.round(v * 100) / 100
  const inicio = new Date(prestamo.fecha_inicio + 'T00:00:00')
  const P      = Number(prestamo.importe)
  const tipo   = prestamo.tipo_prestamo
  const tasaAnual = Number(prestamo.interes_ordinario) / 100

  const periodicidad = (prestamo.periodicidad || 'mensual').toLowerCase()
  let mesesPaso, numCuotasTotal, tasaPeriodo
  if (periodicidad === 'trimestral') {
    mesesPaso = 3; numCuotasTotal = Math.round(prestamo.duracion_meses / 3); tasaPeriodo = tasaAnual * 3 / 12
  } else if (periodicidad === 'anual') {
    mesesPaso = 12; numCuotasTotal = Math.round(prestamo.duracion_meses / 12); tasaPeriodo = tasaAnual
  } else {
    mesesPaso = 1; numCuotasTotal = prestamo.duracion_meses; tasaPeriodo = tasaAnual / 12
  }

  const fmtFecha = d =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const fechaDeCuota = (n) => {
    // Calcular año y mes destino a partir de inicio, sin usar setDate para evitar
    // el overflow de JS cuando el día de inicio es 29-31 (ej: 31ene +1mes → 3mar)
    const mesTotal = inicio.getMonth() + n * mesesPaso
    const anio = inicio.getFullYear() + Math.floor(mesTotal / 12)
    const mes  = mesTotal % 12  // 0-based
    // Último día del mes destino
    const diasEnMes = new Date(anio, mes + 1, 0).getDate()
    const dia = Math.min(prestamo.dia_cobro, diasEnMes)
    const d = new Date(anio, mes, dia)
    return fmtFecha(d)
  }

  // ── Amortizaciones parciales ordenadas por fecha ───────────────────────
  const amortParciales = cobros
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .map(c => ({
      fecha:     c.fecha_real || c.fecha_teorica,
      principal: Number(c.importe_principal),
      modalidad: c.modalidad_recalculo || 'misma_cuota',
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // ── Calcular cuota PMT inicial ─────────────────────────────────────────
  const calcPMT = (saldo, tasa, n) => {
    if (tasa <= 0 || n <= 0) return n > 0 ? r(saldo / n) : 0
    return r(saldo * tasa / (1 - Math.pow(1 + tasa, -n)))
  }

  let cuotaFija = tipo === 'Francés' ? calcPMT(P, tasaPeriodo, numCuotasTotal) : 0
  let cuotasCarencia = 0, cuotaFijaPostCarencia = 0
  if (tipo === 'Francés con carencia') {
    // Usar meses_carencia guardado en el préstamo; si no existe, mitad del plazo como fallback
    const mesesCarenciaConf = Number(prestamo.meses_carencia || 0)
    cuotasCarencia = mesesCarenciaConf > 0
      ? Math.round(mesesCarenciaConf / mesesPaso)
      : Math.round(numCuotasTotal / 2)
    cuotaFijaPostCarencia = calcPMT(P, tasaPeriodo, Math.max(1, numCuotasTotal - cuotasCarencia))
  }

  // ── Generación del calendario por tramos ──────────────────────────────
  // Cada amortización parcial divide el calendario en tramos.
  // Tramo: { desde (nº cuota, 1-based), saldo, cuotaFija, nCuotas }
  // Con misma_cuota: misma cuotaFija, calculamos cuántas cuotas quedan con el nuevo saldo.
  // Con misma_fecha: recalculamos cuotaFija para agotar el nuevo saldo en las cuotas restantes.

  const cuotas = []
  let saldo        = P
  let apIdx        = 0
  let cuotaNum     = 0  // numeración global de cuota para el usuario
  let factorPrimeraCuotaPostAP = null  // factor proporcional para la 1ª cuota tras AP
  let fechaUltimaAP = null             // fecha de la última AP aplicada

  // Iteramos exactamente numCuotasTotal veces (la definición del préstamo).
  // Para misma_cuota tras amortización parcial, el saldo se agota antes y el break termina el loop.
  for (let i = 1; i <= numCuotasTotal; i++) {
    if (saldo <= 0.005) break

    const fechaStr = fechaDeCuota(i)
    factorPrimeraCuotaPostAP = null  // resetear en cada iteración

    // ── Aplicar amortizaciones parciales cuya fecha cae antes de esta cuota ──
    while (apIdx < amortParciales.length && amortParciales[apIdx].fecha < fechaStr) {
      const ap = amortParciales[apIdx]
      saldo = Math.max(0, r(saldo - ap.principal))
      fechaUltimaAP = ap.fecha
      apIdx++
      if (saldo <= 0.005) break

      if (tipo === 'Francés' && tasaPeriodo > 0) {
        // Cuotas que quedan por generar a partir de esta iteración (i incluida)
        const cuotasRestantes = numCuotasTotal - (i - 1)

        if (ap.modalidad === 'misma_fecha') {
          // Misma fecha fin → recalcular cuota para repartir nuevo saldo en cuotasRestantes
          cuotaFija = calcPMT(saldo, tasaPeriodo, Math.max(1, cuotasRestantes))
        } else {
          // Misma cuota → cuotaFija no cambia; el saldo reducido se agotará antes.
        }
      }

      // ── Factor proporcional para la primera cuota post-AP ──────────────────
      // La AP cae a mitad de período: solo se deben intereses por los días
      // que van desde la fecha de AP hasta el siguiente vencimiento.
      // Período = desde el vencimiento anterior hasta este vencimiento.
      if (fechaUltimaAP) {
        const fechaVencAnt = i > 1 ? fechaDeCuota(i - 1) : inicio.toISOString().slice(0, 10)
        const dVencAnt  = new Date(fechaVencAnt + 'T00:00:00')
        const dVenc     = new Date(fechaStr + 'T00:00:00')
        const dAP       = new Date(fechaUltimaAP + 'T00:00:00')
        const diasPeriodo   = (dVenc - dVencAnt) / 86400000
        const diasDesdeAP   = (dVenc - dAP) / 86400000
        if (diasPeriodo > 0 && diasDesdeAP > 0 && diasDesdeAP < diasPeriodo) {
          factorPrimeraCuotaPostAP = diasDesdeAP / diasPeriodo
        }
      }
    }
    if (saldo <= 0.005) break

    cuotaNum++
    let interes = 0, principal = 0
    const factorAP = factorPrimeraCuotaPostAP  // puede ser null (cuota normal) o fracción

    if (tipo === 'Americano') {
      const interesBase = r(saldo * tasaPeriodo)
      interes = factorAP !== null ? r(interesBase * factorAP) : interesBase
      // Último pago devuelve todo el saldo
      const esUltima = i === numCuotasTotal || saldo <= interesBase + 0.005
      principal = esUltima ? saldo : 0

    } else if (tipo === 'Francés') {
      interes = r(saldo * tasaPeriodo)
      // Si el saldo ya no llega a una cuota completa es la última
      if (saldo <= cuotaFija + 0.005) {
        principal = saldo
      } else {
        principal = Math.max(0, r(cuotaFija - interes))
      }
      saldo = r(saldo - principal)

    } else if (tipo === 'Francés con carencia') {
      if (i <= cuotasCarencia) {
        interes   = r(P * tasaPeriodo)
        principal = 0
      } else {
        interes = r(saldo * tasaPeriodo)
        if (saldo <= cuotaFijaPostCarencia + 0.005) {
          principal = saldo
        } else {
          principal = Math.max(0, r(cuotaFijaPostCarencia - interes))
        }
        saldo = r(saldo - principal)
      }
    }

    cuotas.push({
      num:       cuotaNum,
      fecha:     fechaStr,
      interes:   r(interes),
      principal: r(principal),
      total:     r(interes + principal),
    })
  }

  return cuotas
}


export const getCuotaEstado = (cobros, prestamoId, cuotaNum, montoTeorico) => {
  const cobrosC = cobros.filter(c => c.prestamo_id === prestamoId && c.cuota_num === String(cuotaNum))
  const totalCobrado = cobrosC.reduce((s, c) => s + Number(c.importe), 0)
  if (totalCobrado === 0) return 'pendiente'
  if (totalCobrado >= montoTeorico) return 'cobrada'
  return 'parcial'
}

// ── Badges HTML ───────────────────────────────

export const getEstadoBadge = (estadoVisible) => {
  // Badges de estado: fondo transparente, borde y letra del color del estado
  const map = {
    al_dia:        '<span class="badge badge-outline-green"><span class="dot dot-green"></span>Al día</span>',
    con_retraso:   '<span class="badge badge-outline-orange"><span class="dot dot-orange"></span>Con retraso</span>',
    judicializado: '<span class="badge badge-outline-red"><span class="dot dot-red"></span>Judicializado</span>',
    cancelado:     '<span class="badge badge-outline-gray"><span class="dot dot-gray"></span>Cancelado</span>',
    activo:        '<span class="badge badge-outline-green"><span class="dot dot-green"></span>Al día</span>',
  }
  return map[estadoVisible] || estadoVisible
}

export const getTipoBadge = (tipo) => {
  // Badges de tipo: también outline
  const map = {
    'Americano':            '<span class="badge badge-outline-blue">Americano</span>',
    'Francés':              '<span class="badge badge-outline-purple">Francés</span>',
    'Francés con carencia': '<span class="badge badge-outline-yellow">Fr. Carencia</span>',
  }
  return map[tipo] || tipo
}

// ── Calendario CCP ────────────────────────────

export const generateCalendarioCCP = (contrato, prestamo, porcentajeIRPF = 19, cobros = []) => {
  // contrato: { fecha_firma, importe_participacion, porcentaje_gestion, porcentaje_participacion }
  // prestamo: { fecha_inicio, dia_cobro, duracion_meses, interes_ordinario, tipo_prestamo, importe }
  // cobros:   lista de cobros del préstamo (para detectar amortizaciones parciales)

  const cuotas = []
  const fechaFirma      = new Date(contrato.fecha_firma + 'T00:00:00')
  const diaFirma        = fechaFirma.getDate()
  const diaCobro        = Number(prestamo.dia_cobro)
  const principalInicial = Number(contrato.importe_participacion)
  const pctPart         = Number(contrato.porcentaje_participacion) / 100
  const pctGestion      = Number(contrato.porcentaje_gestion) / 100
  const pctIRPF         = porcentajeIRPF / 100

  const fmtFecha = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  // Amortizaciones parciales ordenadas — reducen el principal del partícipe
  const amortParciales = cobros
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .map(c => ({
      fecha:     c.fecha_real || c.fecha_teorica,
      principal: Number(c.importe_principal) * pctPart,  // parte proporcional al partícipe
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  let principalActual = principalInicial
  let apIdx           = 0
  let fechaUltimaAP   = null  // para calcular factor proporcional primera cuota post-AP

  // Cuota calculada sobre el principal activo, con factor proporcional opcional
  const calcCuota = (factor, ppal) => {
    const beneficio = Math.round(ppal * (Number(prestamo.interes_ordinario) / 100) / 12 * factor * 100) / 100
    const gestion   = Math.round(ppal * pctGestion / 12 * factor * 100) / 100
    const bruto     = Math.round((beneficio - gestion) * 100) / 100
    const irpf      = Math.round(bruto * pctIRPF * 100) / 100
    const neto      = Math.round((bruto - irpf) * 100) / 100
    return { beneficio, gestion, bruto, irpf, neto, factor }
  }

  // Recorrer todas las cuotas del préstamo
  const inicio = new Date(prestamo.fecha_inicio + 'T00:00:00')
  let cuotasDelPartícipe = 0
  let prevFechaStr = fmtFecha(inicio)  // fecha del vencimiento anterior (para calcular días del período)

  for (let i = 1; i <= prestamo.duracion_meses; i++) {
    const mesTotal = inicio.getMonth() + i
    const anioP = inicio.getFullYear() + Math.floor(mesTotal / 12)
    const mesP  = mesTotal % 12
    const diasEnMesP = new Date(anioP, mesP + 1, 0).getDate()
    const fechaPrestamo = new Date(anioP, mesP, Math.min(diaCobro, diasEnMesP))
    const fechaStr = fmtFecha(fechaPrestamo)

    // Factor proporcional si hay AP en este período
    let factorPostAP = null

    // Aplicar APs cuya fecha es anterior a esta cuota → reducir principal activo
    while (apIdx < amortParciales.length && amortParciales[apIdx].fecha < fechaStr) {
      principalActual = Math.max(0, Math.round((principalActual - amortParciales[apIdx].principal) * 100) / 100)
      fechaUltimaAP   = amortParciales[apIdx].fecha
      apIdx++

      // Calcular factor proporcional: días desde AP hasta este vencimiento / días del período
      if (fechaUltimaAP) {
        const dVencAnt  = new Date(prevFechaStr + 'T00:00:00')
        const dVenc     = new Date(fechaStr + 'T00:00:00')
        const dAP       = new Date(fechaUltimaAP + 'T00:00:00')
        const diasPeriodo = (dVenc - dVencAnt) / 86400000
        const diasDesdeAP = (dVenc - dAP) / 86400000
        if (diasPeriodo > 0 && diasDesdeAP > 0 && diasDesdeAP < diasPeriodo) {
          factorPostAP = diasDesdeAP / diasPeriodo
        }
      }
    }

    if (principalActual <= 0.005) break

    // Ignorar cuotas anteriores a la fecha de firma
    if (fechaPrestamo < fechaFirma) {
      prevFechaStr = fechaStr
      continue
    }

    cuotasDelPartícipe++

    // Fecha de cobro del partícipe: día 10 del mes siguiente
    const fechaCobro = new Date(fechaPrestamo)
    fechaCobro.setMonth(fechaCobro.getMonth() + 1)
    fechaCobro.setDate(10)

    // Factor: primeras cuotas del partícipe (proporcional a firma) O primera cuota post-AP
    let factor
    if (factorPostAP !== null) {
      // Primera cuota tras AP: proporcional a días restantes del período
      factor = factorPostAP
    } else if (cuotasDelPartícipe === 1) {
      if (diaFirma < diaCobro)        factor = (diaCobro - diaFirma) / 30
      else if (diaFirma === diaCobro)  factor = 1
      else                             factor = 0
    } else if (cuotasDelPartícipe === 2) {
      if (diaFirma <= diaCobro)        factor = 1
      else                             factor = (30 - diaFirma + diaCobro) / 30
    } else {
      factor = 1
    }

    if (factor === 0) { prevFechaStr = fechaStr; continue }

    const calc = calcCuota(factor, principalActual)

    cuotas.push({
      num: i,
      numParticipe: cuotasDelPartícipe,
      fecha_prestamo: fechaStr,
      fecha_cobro: fmtFecha(fechaCobro),
      factor: Math.round(factor * 10000) / 10000,
      principalActual,
      ...calc
    })

    prevFechaStr = fechaStr
  }

  return cuotas
}

// ── calcularLineasCCP ─────────────────────────────────────────────────────────
// Calcula el estado de cada línea del calendario CCP cruzando:
//   - cobros reales del préstamo (tabla `cobros`)
//   - pagos reales al partícipe (tabla `pagos_reales_participe`)
//
// Los devengados son virtuales: se calculan a partir de los cobros del préstamo.
// Los pagos reales se descuentan cronológicamente contra el devengado más antiguo.
//
// Cada línea puede tener estado:
//   'pendiente'  → no hay cobro real del préstamo para esta cuota
//   'devengado'  → hay cobro, no hay pago al partícipe (o pago parcial: resto devengado)
//   'pagado'     → hay cobro y el pago al partícipe cubre este devengado completo
//
// cobros: [{ cuota_num, importe, fecha_real, tipo }]
// pagosReales: [{ id, importe_neto, fecha_pago_real }] — solo pagos reales, ordenados por fecha
export const calcularLineasCCP = (contrato, prestamo, cobros, pagosReales, pctIRPF = 19) => {
  const r = v => Math.round(v * 100) / 100
  const pctPart   = Number(contrato.porcentaje_participacion) / 100
  const pctGest   = Number(contrato.porcentaje_gestion) / 100
  const pctIRPFd  = pctIRPF / 100

  // ── 1. Obtener calendario teórico (fechas, factores, importes teóricos) ─────
  // Si el préstamo está judicializado, se excluyen las cuotas con fecha posterior
  // a la fecha de judicialización: han sido sustituidas por la reclamación judicial (fila J).
  const fJud = prestamo.estado === 'judicializado' && prestamo.fecha_judicializacion
    ? prestamo.fecha_judicializacion
    : null
  const calTeórico = generateCalendarioCCP(contrato, prestamo, pctIRPF, cobros || [])
    .filter(c => !fJud || c.fecha_prestamo <= fJud)

  // ── 2. Agrupar cobros del préstamo por cuota_num ───────────────────────────
  // Una cuota puede tener varios cobros parciales
  const cobrosPorCuota = {}
  for (const c of (cobros || [])) {
    if (c.tipo !== 'pago_cuota' && c.tipo !== 'cancelacion') continue
    const key = String(c.cuota_num)
    if (!cobrosPorCuota[key]) cobrosPorCuota[key] = []
    cobrosPorCuota[key].push(c)
  }

  // ── 3 + 4 + 5. Construir líneas con las 3 columnas: col_pagado, col_devengado, col_pendiente
  //
  // Cada línea representa una cuota del calendario del partícipe.
  // El neto teórico (100%) se distribuye siempre entre estas 3 columnas que deben sumar neto:
  //
  //   col_pendiente  = parte del neto cuya cuota del préstamo NO ha sido cobrada todavía
  //   col_devengado  = parte del neto cuya cuota SÍ fue cobrada pero aún no pagada al partícipe
  //   col_pagado     = parte del neto cuya cuota SÍ fue cobrada Y ya fue pagada al partícipe
  //
  // Lógica de cálculo:
  //   1. neto_cobrado_prestamo = neto × (totalCobradoPrestamo / cuotaTotalPrestamo)  [capped 0..neto]
  //   2. neto_pendiente_prestamo = neto - neto_cobrado_prestamo
  //   3. De neto_cobrado_prestamo, descontamos los pagos reales al partícipe (cronológicos):
  //        col_pagado   = min(neto_cobrado_prestamo, pagosDisponibles)
  //        col_devengado = neto_cobrado_prestamo - col_pagado
  //   4. col_pendiente = neto_pendiente_prestamo  (independiente de pagos al partícipe)
  //
  // Cuota teórica del préstamo (denominador para el ratio de cobro parcial)
  // cuotaTotalPrestamo se calcula por cuota (varía tras APs) — se obtiene del calendario teórico
  // Mapa num_cuota → interés teórico del préstamo en ese momento
  const tasaMensual = Number(prestamo.interes_ordinario) / 100 / 12
  // Calcular saldo del préstamo en cada cuota teniendo en cuenta APs
  const apsPrestamo = (cobros || [])
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .map(c => ({ fecha: c.fecha_real || c.fecha_teorica, principal: Number(c.importe_principal) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  // Mapa: num_cuota → interés esperado del préstamo (base para ratio cobro parcial)
  const interesPorCuota = {}
  let saldoPrestamo = Number(prestamo.importe)
  let apPIdx = 0
  for (const cuota of calTeórico) {
    const fechaStr = cuota.fecha_prestamo
    while (apPIdx < apsPrestamo.length && apsPrestamo[apPIdx].fecha < fechaStr) {
      saldoPrestamo = Math.max(0, r(saldoPrestamo - apsPrestamo[apPIdx].principal))
      apPIdx++
    }
    interesPorCuota[String(cuota.num)] = r(saldoPrestamo * tasaMensual)
  }

  // Pagos reales al partícipe ordenados cronológicamente
  const pagosSorted = [...(pagosReales || [])].sort((a, b) =>
    (a.fecha_pago_real || '').localeCompare(b.fecha_pago_real || '')
  )
  // Pool de neto pagado disponible para descontar línea a línea
  let poolPagado = r(pagosSorted.reduce((s, p) => s + Number(p.importe_neto), 0))

  const lineas = []

  for (const cuota of calTeórico) {
    if (cuota.factor === 0) continue

    const cobrosC = cobrosPorCuota[String(cuota.num)] || []

    // ── Importes teóricos 100% (beneficio con factor de primeras cuotas, sin tocar) ──
    const { beneficio, gestion, bruto, irpf, neto, factor, num, numParticipe, fecha_prestamo } = cuota

    // ── Fecha de cobro al partícipe: día 10 del mes siguiente al último cobro ──
    let fechaCobro = cuota.fecha_cobro  // fallback: fecha teórica ya calculada
    if (cobrosC.length) {
      const cobrosOrdenados = [...cobrosC].sort((a,b) => (a.fecha_real || '') > (b.fecha_real || '') ? 1 : -1)
      const fUltimo = cobrosOrdenados.slice(-1)[0].fecha_real || cobrosOrdenados.slice(-1)[0].fecha_teorica
      if (fUltimo) {
        const d = new Date(fUltimo + 'T00:00:00')
        d.setMonth(d.getMonth() + 1)
        d.setDate(10)
        fechaCobro = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-10`
      }
    }

    // ── Cuánto se ha cobrado de esta cuota en el préstamo ──
    const totalCobradoPrestamo = cobrosC.reduce((s, c) => s + Number(c.importe), 0)
    const interesEsperado = interesPorCuota[String(cuota.num)] || 0
    const ratio = interesEsperado > 0 ? Math.min(1, totalCobradoPrestamo / interesEsperado) : 0

    // ── Reparto del neto teórico en las 3 columnas ──
    const neto_cobrado_prestamo  = r(neto * ratio)          // parte devengable (prestamista cobró)
    const col_pendiente          = r(neto - neto_cobrado_prestamo)  // prestamista no cobró aún

    // De lo devengable, descontar pagos reales al partícipe
    const col_pagado_dev = r(Math.min(neto_cobrado_prestamo, poolPagado))
    const col_devengado  = r(neto_cobrado_prestamo - col_pagado_dev)
    poolPagado = r(poolPagado - col_pagado_dev)

    // Anticipo: si tras descontar el devengado aún queda pool, puede haberse
    // pagado por adelantado contra cuotas pendientes (cobro del préstamo borrado).
    // Desccontamos también del pool contra la parte pendiente.
    const col_pagado_ant = r(Math.min(col_pendiente, poolPagado))
    poolPagado = r(poolPagado - col_pagado_ant)

    const col_pagado   = r(col_pagado_dev + col_pagado_ant)
    const col_pendiente_real = r(col_pendiente - col_pagado_ant)

    // ── Estado resumido de la línea (para badge) ──
    let estado
    if (col_pagado_ant > 0.005 && col_pagado_dev < 0.005) {
      estado = 'anticipado'          // pagado sin que el préstamo haya sido cobrado aún
    } else if (col_pendiente_real >= neto - 0.005 && col_pagado < 0.005) {
      estado = 'pendiente'           // nada cobrado del préstamo, nada pagado
    } else if (col_pagado >= neto - 0.005) {
      estado = 'pagado'              // cobro completo + pago completo al partícipe
    } else if (col_pendiente_real < 0.005 && col_devengado > 0.005 && col_pagado < 0.005) {
      estado = 'devengado'
    } else if (col_pendiente_real < 0.005 && col_devengado < 0.005 && col_pagado > 0.005) {
      estado = 'pagado'
    } else {
      estado = 'mixto'
    }

    // Fecha real en que se cobró la cuota del préstamo (último cobro real si existe)
    let fecha_cobro_prestamo = null
    if (cobrosC.length) {
      const cobrosOrdenados = [...cobrosC].sort((a,b) => (a.fecha_real || '') > (b.fecha_real || '') ? 1 : -1)
      fecha_cobro_prestamo = cobrosOrdenados.slice(-1)[0].fecha_real || cobrosOrdenados.slice(-1)[0].fecha_teorica || null
    }

    lineas.push({
      cuota_num: String(num),
      num, numParticipe, fecha_prestamo, fechaCobro: fechaCobro || cuota.fecha_cobro,
      fecha_cobro: fechaCobro || cuota.fecha_cobro,
      fecha_cobro_prestamo,
      factor,
      beneficio, gestion, bruto, irpf, neto,
      col_pagado,
      col_devengado,
      col_pendiente: col_pendiente_real,
      ratio,
      cuota_completa: Math.abs(ratio - 1) < 0.005,
      estado,
    })
  }

  // ── Filas de Amortización Parcial ────────────────────────────────────────────
  // Cada AP genera una fila especial en el calendario CCP con:
  //   - principal_part: principal devuelto × pctPart (sin gestión ni IRPF)
  //   - intereses sobre los ordinarios pagados en la AP × pctPart (con gestión e IRPF)
  //   - se intercala en la posición cronológica correcta
  const amortParcialesCobros = (cobros || [])
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .sort((a, b) => (a.fecha_real || a.fecha_teorica || '').localeCompare(b.fecha_real || b.fecha_teorica || ''))

  for (const ap of amortParcialesCobros) {
    const fechaAP      = ap.fecha_real || ap.fecha_teorica
    const principalAP  = Number(ap.importe_principal || 0)
    const interesesAP  = Number(ap.importe_interes_ordinario || 0)

    // Parte proporcional al partícipe
    const principalPart = r(principalAP * pctPart)
    const beneficioPart = r(interesesAP * pctPart)
    const gestionPart   = r(beneficioPart * pctGest)
    const brutoPart     = r(beneficioPart - gestionPart)
    const irpfPart      = r(brutoPart * pctIRPFd)
    const netoPart      = r(brutoPart - irpfPart)

    // Fecha de pago al partícipe: día 10 del mes siguiente a la AP
    const dAP = new Date(fechaAP + 'T00:00:00')
    dAP.setMonth(dAP.getMonth() + 1)
    dAP.setDate(10)
    const fechaCobro = `${dAP.getFullYear()}-${String(dAP.getMonth()+1).padStart(2,'0')}-10`

    // Estado: descontar del pool de pagos reales
    const netoTotal    = r(principalPart + netoPart)  // lo que debe recibir el partícipe
    const col_pagado   = r(Math.min(netoTotal, poolPagado))
    poolPagado         = r(poolPagado - col_pagado)
    const col_devengado = r(netoTotal - col_pagado)

    // ¿Fue cobrada la AP por el prestamista? (existe el cobro en BD)
    const cobrada = !!fechaAP

    let estado
    if (col_pagado >= netoTotal - 0.005)   estado = 'pagado'
    else if (cobrada && col_devengado > 0)  estado = 'devengado'
    else                                    estado = 'pendiente'

    lineas.push({
      tipo:             'amortizacion_parcial',
      cuota_num:        `AP-${fechaAP}`,
      num:              null,
      numParticipe:     null,
      fecha_prestamo:   fechaAP,
      fecha_cobro:      fechaCobro,
      fecha_cobro_prestamo: fechaAP,
      factor:           1,
      // Intereses (con gestión e IRPF)
      beneficio:        beneficioPart,
      gestion:          gestionPart,
      bruto:            brutoPart,
      irpf:             irpfPart,
      neto:             netoPart,
      // Principal (sin retenciones)
      principal_part:   principalPart,
      // Columnas calendario
      col_pagado,
      col_devengado,
      col_pendiente:    0,  // ya se ha producido la AP, no hay pendiente
      ratio:            1,
      cuota_completa:   true,
      estado,
    })
  }

  // Ordenar por fecha_prestamo cronológicamente (las filas AP se intercalan en su posición)
  lineas.sort((a, b) => (a.fecha_prestamo || '').localeCompare(b.fecha_prestamo || ''))

  // ── Fila J: judicialización ────────────────────────────────────────────────
  // Si el préstamo está judicializado, añadir una fila especial al final con
  // la parte proporcional de la demanda que corresponde a este partícipe.
  // Importe = importe_demanda × (importe_participacion / importe_prestamo)
  //
  // Estado de la columna:
  //   - col_pendiente: mientras no hay cobro de tipo 'cancelacion' en el préstamo
  //   - col_devengado: cuando existe un cobro de tipo 'cancelacion' (resolución judicial)
  //   - col_pagado:    cuando se registra el pago real al partícipe
  if (prestamo.estado === 'judicializado' && prestamo.importe_demanda) {
    const importeDemanda   = Number(prestamo.importe_demanda)
    const importePrestamo  = Number(prestamo.importe)
    const importePart      = Number(contrato.importe_participacion)
    const pctPartReal      = importePrestamo > 0 ? importePart / importePrestamo : 0
    const netoJ            = r(importeDemanda * pctPartReal)

    // ¿Hay cobro de cancelación? → la demanda se ha cobrado (resolución judicial)
    const cobroCancelacion = (cobros || []).find(c => c.tipo === 'cancelacion')
    const resuelto         = !!cobroCancelacion

    // Descontar del pool de pagos reales lo que quede
    const col_pagado    = r(Math.min(netoJ, poolPagado))
    const col_devengado = resuelto ? r(netoJ - col_pagado) : 0
    const col_pendiente = resuelto ? 0 : r(netoJ - col_pagado)

    let estado
    if (col_pagado >= netoJ - 0.005)           estado = 'pagado'
    else if (resuelto && col_devengado > 0.005) estado = 'devengado'
    else                                        estado = 'pendiente'

    // Desglose proporcional de la demanda (igual que en calendario de cobros del préstamo)
    const principal_J        = r(Number(prestamo.demanda_principal        || 0) * pctPartReal)
    const interes_ordinario_J= r(Number(prestamo.demanda_interes_ordinario|| 0) * pctPartReal)
    const gastos_J           = r(Number(prestamo.demanda_gastos           || 0) * pctPartReal)

    // Intereses de demora proporcionales: calculados sobre la parte proporcional de la demanda
    // desde la fecha de judicialización hasta la fecha de referencia (igual que en PrestamoDetalle)
    const fJudDate  = new Date(prestamo.fecha_judicializacion + 'T00:00:00')
    const hoyDate   = new Date(today() + 'T00:00:00')
    const diasDemora= Math.max(0, Math.round((hoyDate - fJudDate) / (1000 * 60 * 60 * 24)))
    const tasaDemora= Number(prestamo.interes_demora || 0) / 100
    const demora_J  = r(netoJ * tasaDemora / 365 * diasDemora)

    lineas.push({
      cuota_num:    'J',
      num:          'J',
      numParticipe: 'J',
      esJudicial:   true,
      fecha_prestamo: prestamo.fecha_judicializacion,
      fecha_cobro:    prestamo.fecha_judicializacion,
      factor: 1,
      beneficio: netoJ,
      gestion:   0,
      bruto:     netoJ,
      irpf:      0,
      neto:      netoJ,
      // Desglose proporcional para mostrar en el detalle
      principal_J,
      interes_ordinario_J,
      gastos_J,
      demora_J,
      diasDemora,
      col_pagado,
      col_devengado,
      col_pendiente,
      ratio: resuelto ? 1 : 0,
      cuota_completa: col_pagado >= netoJ - 0.005,
      estado,
    })
  }

  return lineas
}

// ── Distribución secuencial de cobros sobre calendario ───────────────────
// Devuelve el calendario con cobrado/pendiente/estado calculados correctamente.
// Usa la misma lógica que calendarioConEstado en PrestamoDetalle.
export const distribuirCobros = (cal, cobros) => {
  const r = v => Math.round(v * 100) / 100

  const cobrosOrdinarios = cobros
    .filter(c => c.tipo === 'pago_cuota' || c.tipo === 'cancelacion')
    .reduce((s, c) => s + Number(c.importe), 0)

  // Tramos separados por amortizaciones parciales
  const apFechas = cobros
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .map(c => c.fecha_real || c.fecha_teorica)
    .filter(Boolean)
    .sort()

  // Si no hay amortizaciones parciales, distribución simple
  if (!apFechas.length) {
    let restante = r(cobrosOrdinarios)
    return cal.map(c => {
      const cobrado   = r(Math.min(restante, c.total))
      restante        = r(restante - cobrado)
      const pendiente = r(c.total - cobrado)
      const estado    = pendiente <= 0.005 ? 'cobrada'
                      : cobrado > 0      ? 'parcial'
                      :                   'pendiente'
      return { ...c, cobrado, pendiente, estado }
    })
  }

  // Con amortizaciones: tramos por fecha AP
  const cobrosArr = cobros
    .filter(c => c.tipo === 'pago_cuota' || c.tipo === 'cancelacion')
    .map(c => ({ fecha: c.fecha_real || c.fecha_teorica, importe: Number(c.importe) }))
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))

  const limites = [...apFechas, null]
  const tramos = []
  let ci = 0
  for (const limite of limites) {
    let total = 0
    while (ci < cobrosArr.length) {
      if (limite !== null && (cobrosArr[ci].fecha || '') >= limite) break
      total = r(total + cobrosArr[ci].importe)
      ci++
    }
    tramos.push(total)
  }

  let tramoIdx = 0, restante = tramos[0] || 0, apIdx = 0
  return cal.map(c => {
    while (apIdx < apFechas.length && apFechas[apIdx] < c.fecha) {
      apIdx++; tramoIdx++
      restante = tramos[tramoIdx] || 0
    }
    const cobrado   = r(Math.min(restante, c.total))
    restante        = r(restante - cobrado)
    const pendiente = r(c.total - cobrado)
    const estado    = pendiente <= 0.005 ? 'cobrada'
                    : cobrado > 0      ? 'parcial'
                    :                   'pendiente'
    return { ...c, cobrado, pendiente, estado }
  })
}

// ── Calcular situación de un préstamo (al_dia / con_retraso) ─────────────
// Requiere el préstamo y sus cobros. Usa distribución secuencial correcta.
export const calcSituacionPrestamo = (prestamo, cobros) => {
  if (prestamo.estado === 'cancelado' || prestamo.estado === 'judicializado') return null
  const hoy = today()
  const cal = generateCalendarioTeorico(prestamo, cobros)
  const calConEstado = distribuirCobros(cal, cobros)
  return calConEstado.some(c => c.fecha <= hoy && c.estado !== 'cobrada') ? 'con_retraso' : 'al_dia'
}
