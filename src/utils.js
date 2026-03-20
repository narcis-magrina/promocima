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
// En producción devuelve la fecha real del sistema.
// En tests, llamar a setToday('2026-03-20') para fijar una fecha determinista.
let _todayFn = () => new Date().toISOString().split('T')[0]
export const today = () => _todayFn()
export const setToday = (fn) => { _todayFn = typeof fn === 'function' ? fn : () => fn }
export const resetToday = () => { _todayFn = () => new Date().toISOString().split('T')[0] }

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
// Un préstamo = un calendario limpio. Las APs generan un préstamo nuevo,
// por lo que no hay tramos ni lógica de amortización parcial aquí.
export const generateCalendarioTeorico = (prestamo) => {
  if (prestamo.estado === 'cancelado') return []

  const r         = v => Math.round(v * 100) / 100
  const inicio    = new Date(prestamo.fecha_inicio + 'T00:00:00')
  const P         = Number(prestamo.importe)
  const tipo      = prestamo.tipo_prestamo
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
    const mesTotal  = inicio.getMonth() + n * mesesPaso
    const anio      = inicio.getFullYear() + Math.floor(mesTotal / 12)
    const mes       = mesTotal % 12
    const diasEnMes = new Date(anio, mes + 1, 0).getDate()
    return fmtFecha(new Date(anio, mes, Math.min(prestamo.dia_cobro, diasEnMes)))
  }

  const calcPMT = (saldo, tasa, n) => {
    if (tasa <= 0 || n <= 0) return n > 0 ? r(saldo / n) : 0
    return r(saldo * tasa / (1 - Math.pow(1 + tasa, -n)))
  }

  let cuotaFija = tipo === 'Francés' ? calcPMT(P, tasaPeriodo, numCuotasTotal) : 0
  let cuotasCarencia = 0, cuotaFijaPostCarencia = 0
  if (tipo === 'Francés con carencia') {
    const mesesCarenciaConf = Number(prestamo.meses_carencia || 0)
    cuotasCarencia = mesesCarenciaConf > 0
      ? Math.round(mesesCarenciaConf / mesesPaso)
      : Math.round(numCuotasTotal / 2)
    cuotaFijaPostCarencia = calcPMT(P, tasaPeriodo, Math.max(1, numCuotasTotal - cuotasCarencia))
  }

  const cuotas = []
  let saldo = P

  for (let i = 1; i <= numCuotasTotal; i++) {
    if (saldo <= 0.005) break

    let interes = 0, principal = 0

    if (tipo === 'Americano') {
      interes   = r(saldo * tasaPeriodo)
      principal = (i === numCuotasTotal || saldo <= interes + 0.005) ? saldo : 0

    } else if (tipo === 'Francés') {
      interes   = r(saldo * tasaPeriodo)
      principal = saldo <= cuotaFija + 0.005 ? saldo : Math.max(0, r(cuotaFija - interes))
      saldo     = r(saldo - principal)

    } else if (tipo === 'Francés con carencia') {
      if (i <= cuotasCarencia) {
        interes   = r(P * tasaPeriodo)
        principal = 0
      } else {
        interes   = r(saldo * tasaPeriodo)
        principal = saldo <= cuotaFijaPostCarencia + 0.005 ? saldo : Math.max(0, r(cuotaFijaPostCarencia - interes))
        saldo     = r(saldo - principal)
      }
    }

    cuotas.push({
      num:       i,
      fecha:     fechaDeCuota(i),
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

export const generateCalendarioCCP = (contrato, prestamo, porcentajeIRPF = 19) => {
  // Sin cobros como parámetro: las APs generan un préstamo nuevo,
  // por lo que el calendario del partícipe es siempre lineal desde fecha_firma.

  const cuotas = []
  const fechaFirma       = new Date(contrato.fecha_firma + 'T00:00:00')
  const diaFirma         = fechaFirma.getDate()
  const diaCobro         = Number(prestamo.dia_cobro)
  const principalInicial = Number(contrato.importe_participacion)
  const pctGestion       = Number(contrato.porcentaje_gestion) / 100
  const pctIRPF          = porcentajeIRPF / 100

  const fmtFecha = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const calcCuota = (factor) => {
    const beneficio = Math.round(principalInicial * (Number(prestamo.interes_ordinario) / 100) / 12 * factor * 100) / 100
    const gestion   = Math.round(principalInicial * pctGestion / 12 * factor * 100) / 100
    const bruto     = Math.round((beneficio - gestion) * 100) / 100
    const irpf      = Math.round(bruto * pctIRPF * 100) / 100
    const neto      = Math.round((bruto - irpf) * 100) / 100
    return { beneficio, gestion, bruto, irpf, neto, factor }
  }

  const inicio = new Date(prestamo.fecha_inicio + 'T00:00:00')
  let cuotasDelPartícipe = 0

  for (let i = 1; i <= prestamo.duracion_meses; i++) {
    const mesTotal   = inicio.getMonth() + i
    const anioP      = inicio.getFullYear() + Math.floor(mesTotal / 12)
    const mesP       = mesTotal % 12
    const diasEnMesP = new Date(anioP, mesP + 1, 0).getDate()
    const fechaPrestamo = new Date(anioP, mesP, Math.min(diaCobro, diasEnMesP))
    const fechaStr   = fmtFecha(fechaPrestamo)

    if (fechaPrestamo < fechaFirma) continue

    cuotasDelPartícipe++

    const mesNextC  = fechaPrestamo.getMonth() + 1  // mes siguiente (0-based)
    const anioNextC = mesNextC === 12 ? fechaPrestamo.getFullYear() + 1 : fechaPrestamo.getFullYear()
    const mesNextCNorm = mesNextC === 12 ? 1 : mesNextC + 1
    const fechaCobro = new Date(anioNextC, mesNextCNorm - 1, 10)

    let factor
    if (cuotasDelPartícipe === 1) {
      if (diaFirma < diaCobro)       factor = (diaCobro - diaFirma) / 30
      else if (diaFirma === diaCobro) factor = 1
      else                            factor = 0
    } else if (cuotasDelPartícipe === 2) {
      factor = diaFirma <= diaCobro ? 1 : (30 - diaFirma + diaCobro) / 30
    } else {
      factor = 1
    }

    if (factor === 0) continue

    const calc = calcCuota(factor)

    cuotas.push({
      num: i,
      numParticipe: cuotasDelPartícipe,
      fecha_prestamo: fechaStr,
      fecha_cobro: fmtFecha(fechaCobro),
      factor: Math.round(factor * 10000) / 10000,
      principalActual: principalInicial,
      ...calc
    })
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
  const calTeórico = generateCalendarioCCP(contrato, prestamo, pctIRPF)
    .filter(c => !fJud || c.fecha_prestamo <= fJud)

  // ── 2. Mapear cobros del préstamo a cuotas por distribución secuencial ────────
  // Ordenamos los cobros por fecha y los imputamos secuencialmente al calendario
  // del préstamo — igual que distribuirCobros. cuota_num se ignora.
  const calPrestamo = generateCalendarioTeorico(prestamo)
  const interesPorCuota = {}
  for (const cuota of calPrestamo) {
    interesPorCuota[String(cuota.num)] = cuota.interes
  }

  const cobrosOrdenados = [...(cobros || [])]
    .filter(c => c.tipo === 'pago_cuota' || c.tipo === 'cancelacion')
    .sort((a, b) => {
      const fa = a.fecha_real || a.fecha_teorica || ''
      const fb = b.fecha_real || b.fecha_teorica || ''
      return fa > fb ? 1 : fa < fb ? -1 : 0
    })

  // Para cada cuota del préstamo, acumular los cobros que la cubren
  // guardando también la fecha real del cobro (para calcular fecha de pago al partícipe)
  const cobrosPorCuota = {}
  let poolCobros = cobrosOrdenados.map(c => ({ ...c, restante: Number(c.importe) }))
  for (const cuota of calPrestamo) {
    const total = cuota.interes + (cuota.principal || 0)
    let acumulado = 0
    const cobrosEsta = []
    for (const cobro of poolCobros) {
      if (cobro.restante <= 0) continue
      if (acumulado >= total) break
      const tomar = Math.min(cobro.restante, total - acumulado)
      acumulado = Math.round((acumulado + tomar) * 100) / 100
      cobrosEsta.push({ ...cobro, importe: tomar })
      cobro.restante = Math.round((cobro.restante - tomar) * 100) / 100
    }
    if (cobrosEsta.length) cobrosPorCuota[String(cuota.num)] = cobrosEsta
    poolCobros = poolCobros.filter(c => c.restante > 0.005)
    if (!poolCobros.length) break
  }

  // ── 3. Pool de pagos reales al partícipe (ordenados cronológicamente) ─────────
  const tasaMensual = Number(prestamo.interes_ordinario) / 100 / 12

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

    // ── Fecha de cobro al partícipe: día 10 del mes siguiente al cobro más reciente ──
    // Usamos la fecha más tardía entre los cobros asignados a esta cuota,
    // ya que el pago al partícipe se produce cuando la cuota queda completamente cubierta.
    let fechaCobro = cuota.fecha_cobro  // fallback: fecha teórica ya calculada
    if (cobrosC.length) {
      const fechas = cobrosC.map(c => c.fecha_real || c.fecha_teorica || '').filter(Boolean)
      const fRef = fechas.sort().slice(-1)[0]
      if (fRef) {
        const d = new Date(fRef + 'T00:00:00')
        const mesNext = d.getMonth() + 1
        const anioNext = mesNext === 12 ? d.getFullYear() + 1 : d.getFullYear()
        const mesNextNorm = mesNext === 12 ? 1 : mesNext + 1
        fechaCobro = `${anioNext}-${String(mesNextNorm).padStart(2,'0')}-10`
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
// Distribución simple: sin tramos por AP (las APs generan un préstamo nuevo).
export const distribuirCobros = (cal, cobros) => {
  const r = v => Math.round(v * 100) / 100
  let restante = r(
    cobros
      .filter(c => c.tipo === 'pago_cuota' || c.tipo === 'cancelacion')
      .reduce((s, c) => s + Number(c.importe), 0)
  )
  return cal.map(c => {
    const cobrado   = r(Math.min(restante, c.total))
    restante        = r(restante - cobrado)
    const pendiente = r(c.total - cobrado)
    const estado    = pendiente <= 0.005 ? 'cobrada'
                    : cobrado > 0        ? 'parcial'
                    :                     'pendiente'
    return { ...c, cobrado, pendiente, estado }
  })
}

// ── Calcular situación de un préstamo (al_dia / con_retraso) ─────────────
// Requiere el préstamo y sus cobros. Usa distribución secuencial correcta.
// fechaRef: fecha de referencia opcional (para el portal con fecha de cierre).
//           Si se omite, usa today().
export const calcSituacionPrestamo = (prestamo, cobros, fechaRef = null) => {
  if (prestamo.estado === 'cancelado' || prestamo.estado === 'judicializado') return null
  const hoy = fechaRef || today()
  const cal = generateCalendarioTeorico(prestamo)
  const calConEstado = distribuirCobros(cal, cobros)
  return calConEstado.some(c => c.fecha <= hoy && c.estado !== 'cobrada') ? 'con_retraso' : 'al_dia'
}

// ── Capital activo de un préstamo ──────────────────────────────────────────────
// Americano: el importe es el capital (sin APs embebidas — generan préstamo nuevo).
// Francés: importe menos el principal amortizado via cuotas cobradas.
export const calcCapitalEnCursoPrestamo = (prestamo, cobros = []) => {
  const r = v => Math.round(v * 100) / 100
  if (prestamo.tipo_prestamo === 'Americano') {
    return Number(prestamo.importe)
  }
  const cal = generateCalendarioTeorico(prestamo)
  const calConEstado = distribuirCobros(cal, cobros)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, r(Number(prestamo.importe) - amortCuotas))
}

// ── Devengado pendiente de un contrato CCP ────────────────────────────────────
// Una cuota está devengada cuando el préstamo ha cobrado su cuota Y el mes
// siguiente al cobro ya ha comenzado (el partícipe sabe el día 1 que cobrará).
// Regla: primer día del mes siguiente al cobro del préstamo ≤ fechaRef.
// Si el cobro es parcial, el devengado es proporcional al ratio cobrado/esperado.
// pagosReales: pagos ya realizados al partícipe (se restan del total devengado).
// fechaRef: fecha de referencia (fecha_cierre_portal o today()).
export const calcDevengadoContrato = (contrato, prestamo, cobros = [], pagosReales = [], fechaRef = null) => {
  const r = v => Math.round(v * 100) / 100
  if (!prestamo || prestamo.estado === 'cancelado') return 0

  const ref = fechaRef || today()

  // Calendario teórico del partícipe (cuotas con fecha_prestamo y neto)
  const cal = generateCalendarioCCP(contrato, prestamo)

  // Interés esperado por cuota (para ratio en cobros parciales) + distribución secuencial
  const calPrestamo = generateCalendarioTeorico(prestamo)
  const interesPorCuota = {}
  for (const c of calPrestamo) interesPorCuota[String(c.num)] = c.interes

  // Distribuir cobros secuencialmente por fecha sobre el calendario del préstamo
  const cobrosOrd = [...cobros.filter(c => c.tipo === 'pago_cuota' || c.tipo === 'cancelacion')]
    .sort((a, b) => {
      const fa = a.fecha_real || a.fecha_teorica || ''
      const fb = b.fecha_real || b.fecha_teorica || ''
      return fa > fb ? 1 : fa < fb ? -1 : 0
    })

  const cobrosPorCuota = {}
  let poolCobros = cobrosOrd.map(c => ({ ...c, restante: Number(c.importe) }))
  for (const cuota of calPrestamo) {
    const total = cuota.interes + (cuota.principal || 0)
    let acumulado = 0
    const cobrosEsta = []
    for (const cobro of poolCobros) {
      if (cobro.restante <= 0) continue
      if (acumulado >= total) break
      const tomar = Math.min(cobro.restante, total - acumulado)
      acumulado = Math.round((acumulado + tomar) * 100) / 100
      cobrosEsta.push({ ...cobro, importe: tomar })
      cobro.restante = Math.round((cobro.restante - tomar) * 100) / 100
    }
    if (cobrosEsta.length) cobrosPorCuota[String(cuota.num)] = cobrosEsta
    poolCobros = poolCobros.filter(c => c.restante > 0.005)
    if (!poolCobros.length) break
  }

  let totalDevengado = 0
  for (const cuota of cal) {
    const cobrosC = cobrosPorCuota[String(cuota.num)] || []
    if (!cobrosC.length) continue  // préstamo no ha cobrado esta cuota → no devengado

    // Fecha real del cobro más tardío (para cobros parciales en días diferentes)
    const fechaCobro = cobrosC
      .map(c => c.fecha_real || c.fecha_teorica || '')
      .filter(Boolean)
      .sort()
      .slice(-1)[0]
    if (!fechaCobro) continue

    // Primer día del mes siguiente al cobro más tardío
    const dc = new Date(fechaCobro + 'T00:00:00')
    const mesNext = dc.getMonth() + 1  // 0-based → 1-based del mes siguiente
    const anioNext = mesNext === 12 ? dc.getFullYear() + 1 : dc.getFullYear()
    const mesNextNorm = mesNext === 12 ? 1 : mesNext + 1
    const primerDiaSiguiente = `${anioNext}-${String(mesNextNorm).padStart(2, '0')}-01`

    if (primerDiaSiguiente > ref) continue  // el mes siguiente aún no ha llegado

    // Ratio de cobro: si es parcial, el devengado es proporcional
    const totalCobrado = r(cobrosC.reduce((s, c) => s + Number(c.importe), 0))
    const interesEsperado = interesPorCuota[String(cuota.num)] || 0
    const ratio = interesEsperado > 0 ? Math.min(1, totalCobrado / interesEsperado) : 1

    totalDevengado = r(totalDevengado + r(cuota.neto * ratio))
  }

  // Restar lo ya pagado al partícipe
  const totalPagado = r(pagosReales.reduce((s, p) => s + Number(p.importe_neto || 0), 0))
  return Math.max(0, r(totalDevengado - totalPagado))
}
