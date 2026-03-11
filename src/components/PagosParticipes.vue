<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Pagos a Partícipes</div>
        <div class="section-sub">Devengados pendientes y pagos registrados</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card kc-green">
        <div class="kpi-label">Total Pagado (neto)</div>
        <div class="kpi-value">{{ fmt(totalPagado) }}</div>
        <div class="kpi-sub">{{ realizados.length }} pago{{ realizados.length !== 1 ? 's' : '' }} registrado{{ realizados.length !== 1 ? 's' : '' }}</div>
      </div>
      <div class="kpi-card kc-red">
        <div class="kpi-label">Retenciones IRPF</div>
        <div class="kpi-value">{{ fmt(totalRetenciones) }}</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Neto Pagado</div>
        <div class="kpi-value">{{ fmt(totalPagado) }}</div>
      </div>
      <div class="kpi-card kc-orange">
        <div class="kpi-label">Devengado Pendiente</div>
        <div class="kpi-value">{{ fmt(totalDevengadoPendiente) }}</div>
        <div class="kpi-sub">{{ devengadosPendientes.length }} línea{{ devengadosPendientes.length !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: tabActivo === 'devengados' }" @click="tabActivo = 'devengados'">
        💰 Pagos Devengados <span v-if="devengadosPendientes.length" class="tab-badge">{{ devengadosPendientes.length }}</span>
      </div>
      <div class="tab" :class="{ active: tabActivo === 'realizados' }" @click="tabActivo = 'realizados'">
        📋 Pagos Registrados
      </div>
    </div>

    <!-- Pestaña Devengados -->
    <div v-if="tabActivo === 'devengados'" class="table-card">
      <div class="table-header">
        <h3>Pagos Devengados ({{ devengadosFiltrados.length }})</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="filter-label">Filtros</span>
          <select class="form-control" v-model="filtroParticipeDev" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroParticipeDev ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los partícipes</option>
            <option v-for="p in participesList" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
          <select class="form-control" v-model="filtroPrestamosDev" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroPrestamosDev ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los préstamos</option>
            <option v-for="p in prestamosList" :key="p.alias" :value="p.alias">{{ p.alias }}</option>
          </select>
          <select class="form-control" v-model="vistaAgrupada" style="width:150px;padding:5px 10px;font-size:12px" :style="vistaAgrupada ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option :value="false">Vista plana</option>
            <option :value="true">Agrupar por partícipe</option>
          </select>
          <div style="display:flex;gap:10px;align-items:center;font-size:11px">
            <span style="display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:rgba(239,68,68,0.25);border:1px solid rgba(239,68,68,0.5);display:inline-block"></span>Vencido</span>
            <span style="display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:rgba(59,130,246,0.30);border:1px solid rgba(59,130,246,0.55);display:inline-block"></span>Próximo pago</span>
            <span style="display:inline-flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:rgba(34,197,94,0.25);border:1px solid rgba(34,197,94,0.5);display:inline-block"></span>Posterior</span>
          </div>
          <span style="font-size:12px;color:var(--text3)">Total: {{ fmt(totalDevFiltrado) }} €</span>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Préstamo</th>
              <th>Partícipe</th>
              <th style="text-align:right">Devengado</th>
              <th style="text-align:right">Gestión</th>
              <th style="text-align:right">Bruto</th>
              <th style="text-align:right;color:var(--red)">IRPF</th>
              <th style="text-align:right;color:var(--green)">Neto</th>
              <th>Cobro préstamo</th>
              <th>Fecha teórica</th>
              <th>Fecha pago</th>
              <th style="text-align:center;white-space:nowrap">
                <button
                  v-if="devengadosFiltrados.some(d => calcEstadoPago(d.fechaPagoEfectiva) === 'proximo')"
                  class="btn btn-sm btn-registrar"
                  style="white-space:nowrap;font-size:11px;padding:3px 8px"
                  :disabled="pagandoProximos"
                  @click="pagarTodosProximos"
                >
                  {{ pagandoProximos ? '…' : '✓ Pagar próximo' }}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Vista plana -->
            <template v-if="!vistaAgrupada">
              <tr v-for="d in devengadosFiltrados" :key="d._key" :style="rowStyle(d)">
                <td style="font-size:12px;font-weight:500">{{ d.prestamo_alias }}</td>
                <td style="font-size:12px">{{ d.participe_nombre }}</td>
                <td class="td-mono td-right">{{ fmt(d.beneficio) }}</td>
                <td class="td-mono td-right" style="color:var(--orange)">{{ fmt(d.gestion) }}</td>
                <td class="td-mono td-right">{{ fmt(d.bruto) }}</td>
                <td class="td-mono td-right" style="color:var(--red)">{{ fmt(d.irpf) }}</td>
                <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmt(d.neto) }}</td>
                <td style="font-size:12px;color:var(--text3)">{{ d.fecha_cobro_prestamo ? fmtDate(d.fecha_cobro_prestamo) : '—' }}</td>
                <td style="font-size:12px;color:var(--text3)">{{ fmtDate(d.fecha_cobro) }}</td>
                <td style="text-align:center">
                  <input type="date" class="form-control" style="width:140px;padding:3px 8px;font-size:12px;display:inline-block" v-model="d.fechaPagoEfectiva">
                </td>
                <td>
                  <button class="btn btn-sm btn-registrar" style="white-space:nowrap" :disabled="d.pagando" @click="pagarDevengado(d)">
                    {{ d.pagando ? '…' : '✓ Pagar' }}
                  </button>
                </td>
              </tr>
            </template>
            <!-- Vista agrupada por partícipe -->
            <template v-else>
              <template v-for="grupo in devengadosAgrupados" :key="grupo.participe_id">
                <!-- Cabecera de partícipe -->
                <tr style="background:color-mix(in srgb,var(--accent) 8%,var(--bg2));border-top:2px solid color-mix(in srgb,var(--accent) 30%,transparent)">
                  <td colspan="6" style="font-weight:700;font-size:13px;padding:8px 10px;color:var(--accent)">
                    👤 {{ grupo.participe_nombre }}
                    <span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:8px">{{ grupo.lineas.length }} cuota{{ grupo.lineas.length !== 1 ? 's' : '' }}</span>
                  </td>
                  <td class="td-mono td-right" style="font-weight:700;color:var(--green);font-size:13px">{{ fmt(grupo.totalNeto) }}</td>
                  <td colspan="3"></td>
                </tr>
                <!-- Líneas del partícipe -->
                <tr v-for="d in grupo.lineas" :key="d._key" :style="rowStyle(d)">
                  <td style="font-size:12px;font-weight:500;padding-left:24px">{{ d.prestamo_alias }}</td>
                  <td style="font-size:12px;color:var(--text3)">—</td>
                  <td class="td-mono td-right">{{ fmt(d.beneficio) }}</td>
                  <td class="td-mono td-right" style="color:var(--orange)">{{ fmt(d.gestion) }}</td>
                  <td class="td-mono td-right">{{ fmt(d.bruto) }}</td>
                  <td class="td-mono td-right" style="color:var(--red)">{{ fmt(d.irpf) }}</td>
                  <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmt(d.neto) }}</td>
                  <td style="font-size:12px;color:var(--text3)">{{ d.fecha_cobro_prestamo ? fmtDate(d.fecha_cobro_prestamo) : '—' }}</td>
                  <td style="font-size:12px;color:var(--text3)">{{ fmtDate(d.fecha_cobro) }}</td>
                  <td style="text-align:center">
                    <input type="date" class="form-control" style="width:140px;padding:3px 8px;font-size:12px;display:inline-block" v-model="d.fechaPagoEfectiva">
                  </td>
                  <td>
                    <button class="btn btn-sm btn-registrar" style="white-space:nowrap" :disabled="d.pagando" @click="pagarDevengado(d)">
                      {{ d.pagando ? '…' : '✓ Pagar' }}
                    </button>
                  </td>
                </tr>
              </template>
            </template>
            <tr v-if="!devengadosPendientes.length">
              <td colspan="10" class="table-empty" style="color:var(--green)">✓ No hay devengados pendientes de pago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tabla pagos realizados -->
    <div v-if="tabActivo === 'realizados'" class="table-card">
      <div class="table-header">
        <h3>Pagos Registrados ({{ realizados.length }})</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="filter-label">Filtros</span>
          <select class="form-control" v-model="filtroParticipeReg" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroParticipeReg ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los partícipes</option>
            <option v-for="p in participeRegList" :key="p.nombre" :value="p.nombre">{{ p.nombre }}</option>
          </select>
          <select class="form-control" v-model="filtroPrestamoReg" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroPrestamoReg ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los préstamos</option>
            <option v-for="p in prestamoRegList" :key="p.alias" :value="p.alias">{{ p.alias }}</option>
          </select>
          <button class="btn btn-sm btn-registrar" @click="abrirRegistrar">+ Registrar Pago</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Partícipe</th>
              <th>Préstamo</th>
              <th @click="setSort('fecha_pago_real')" :class="thClass('fecha_pago_real')">Fecha Pago <span class="sort-icon">{{ thIcon('fecha_pago_real') }}</span></th>
              <th style="text-align:right">Devengado</th>
              <th style="text-align:right">Gestión</th>
              <th style="text-align:right">Bruto</th>
              <th style="text-align:right">IRPF</th>
              <th style="text-align:right;color:var(--green)">Neto</th>
              <th style="text-align:center;white-space:nowrap">
                <button
                  v-if="devengadosFiltrados.some(d => calcEstadoPago(d.fechaPagoEfectiva) === 'proximo')"
                  class="btn btn-sm btn-registrar"
                  style="white-space:nowrap;font-size:11px;padding:3px 8px"
                  :disabled="pagandoProximos"
                  @click="pagarTodosProximos"
                >
                  {{ pagandoProximos ? '…' : '✓ Pagar próximo' }}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in realizados" :key="p.id">
              <td style="font-size:12px;font-weight:500">{{ p.contratos_ccp?.participes?.nombre || '—' }}</td>
              <td style="font-size:12px">{{ p.contratos_ccp?.prestamos?.alias || '—' }}</td>
              <td style="font-size:12px">{{ fmtDate(p.fecha_pago_real) }}</td>
              <td class="td-mono td-right">{{ fmt(p.importe_devengado) }}</td>
              <td class="td-mono td-right" style="color:var(--orange)">{{ fmt(p.importe_gestion) }}</td>
              <td class="td-mono td-right">{{ fmt(p.importe_bruto) }}</td>
              <td class="td-mono td-right" style="color:var(--red)">{{ fmt(p.importe_retencion) }}</td>
              <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmt(p.importe_neto) }}</td>
              <td>
                <button class="btn btn-sm btn-danger-solid" style="padding:2px 7px;font-size:13px"
                  title="Eliminar pago" @click="eliminarPagoYRecargar(p)">✕</button>
              </td>
            </tr>
            <tr v-if="!realizados.length"><td colspan="9" class="table-empty">Sin pagos registrados</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL REGISTRAR PAGO -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>Registrar Pago a Partícipe</h2>
          <button class="btn btn-ghost btn-sm" @click="modalAbierto = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Contrato CCP <span class="req">*</span></label>
              <select class="form-control" v-model="form.contrato_ccp_id">
                <option value="">— Selecciona contrato —</option>
                <option v-for="c in contratos" :key="c.id" :value="c.id">{{ c.participes?.nombre }} · {{ c.prestamos?.alias }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Pago <span class="req">*</span></label>
              <input class="form-control" type="date" v-model="form.fecha_pago_real">
            </div>
            <div class="form-group">
              <label class="form-label">Importe Devengado (€) <span class="req">*</span></label>
              <input class="form-control" type="number" step="0.01" v-model="form.importe_devengado" @input="recalcularImportes">
            </div>
            <div class="form-group">
              <label class="form-label">Gestión</label>
              <input class="form-control" type="number" step="0.01" :value="form.importe_gestion" readonly style="opacity:0.7">
            </div>
            <div class="form-group">
              <label class="form-label">Bruto</label>
              <input class="form-control" type="number" step="0.01" :value="form.importe_bruto" readonly style="opacity:0.7">
            </div>
            <div class="form-group">
              <label class="form-label">IRPF</label>
              <input class="form-control" type="number" step="0.01" :value="form.importe_retencion" readonly style="opacity:0.7">
            </div>
            <div class="form-group">
              <label class="form-label">Neto a Pagar</label>
              <input class="form-control" type="number" step="0.01" :value="form.importe_neto" readonly style="font-weight:700;color:var(--green)">
            </div>
            <div class="form-group span-2">
              <label class="form-label">Observaciones</label>
              <textarea class="form-control" v-model="form.observaciones"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="modalAbierto = false">Cancelar</button>
          <button class="btn btn-registrar" :disabled="saving" @click="guardar">
            <span v-if="saving" class="btn-spinner"></span>Registrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSort } from '../composables/useSort.js'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { supabase } from '../supabase.js'
import { fmt, fmtDate, today, uuid, calcularLineasCCP, fechaReferenciaGlobal } from '../utils.js'
import { eliminarPago } from '../composables/useDevengados.js'

defineEmits(['navigate'])

const saving       = ref(false)
const pagosRaw     = ref([])
const contratos    = ref([])
const pctIRPF      = ref(19)
const tabActivo    = usePersistedRef('pagos.tabActivo', 'devengados')
const modalAbierto = ref(false)
const form         = ref(formVacio())

const { sorted: pagosOrdenados, setSort, thIcon, thClass } = useSort(pagosRaw, 'fecha_pago_real', 'desc')
const pagandoProximos = ref(false)
const filtroParticipeDev = usePersistedRef('pagos.filtroParticipeDev', '')
const vistaAgrupada       = usePersistedRef('pagos.vistaAgrupada', false)
const filtroPrestamosDev  = usePersistedRef('pagos.filtroPrestamosDev', '')
const filtroParticipeReg  = usePersistedRef('pagos.filtroParticipeReg', '')
const filtroPrestamoReg   = usePersistedRef('pagos.filtroPrestamoReg', '')
const prestamosMap   = ref({})
const cobrosMap      = ref({})

function formVacio() {
  return { contrato_ccp_id: '', fecha_pago_real: today(), importe_devengado: '', importe_gestion: 0, importe_bruto: 0, importe_retencion: 0, importe_neto: 0, observaciones: '' }
}

async function cargar() {
  const [{ data: p }, { data: c }, { data: cfg }, { data: prest }] = await Promise.all([
    supabase.from('pagos_reales_participe')
      .select('*, contratos_ccp(*, participes(nombre), prestamos(alias))')
      .order('fecha_pago_real', { ascending: false }),
    supabase.from('contratos_ccp')
      .select('id, prestamo_id, participe_id, importe_participacion, porcentaje_participacion, porcentaje_gestion, porcentaje_apertura, fecha_firma, activo, participes(id, nombre)'),
    supabase.from('config').select('porcentaje_irpf').eq('id', 1).single(),
    supabase.from('prestamos').select('id, alias, interes_ordinario, importe, tipo_prestamo, periodicidad, fecha_inicio, dia_cobro, duracion_meses, estado'),
    supabase.from('cobros').select('id, prestamo_id, cuota_num, fecha_real, fecha_teorica, importe, tipo').in('tipo', ['pago_cuota','cancelacion']).limit(9999),
  ])
  pagosRaw.value  = p || []
  contratos.value = c || []
  pctIRPF.value   = cfg?.porcentaje_irpf ?? 19
  prestamosMap.value = Object.fromEntries((prest || []).map(pr => [pr.id, pr]))

  // Cargar cobros por préstamo con contratos CCP para evitar límite de Supabase
  const prestamoIdsConCCP = [...new Set((c || []).map(ct => ct.prestamo_id).filter(Boolean))]
  const cobrosResult = await Promise.all(
    prestamoIdsConCCP.map(pid =>
      supabase.from('cobros')
        .select('id, prestamo_id, cuota_num, fecha_real, fecha_teorica, importe, tipo')
        .eq('prestamo_id', pid)
        .in('tipo', ['pago_cuota','cancelacion'])
    )
  )
  const todosLosCobros = cobrosResult.flatMap(r => r.data || [])
  cobrosMap.value = Object.fromEntries(
    prestamoIdsConCCP.map(pid => [pid, todosLosCobros.filter(cb => cb.prestamo_id === pid)])
  )
  // Debug
  const blanes = (prest || []).find(p => p.alias === 'Blanes')
  if (blanes) {
    const cBlanes = cobrosMap.value[blanes.id] || []
    console.log('[Pagos] cobros Blanes total:', cBlanes.length, cBlanes.map(c => `${c.cuota_num}(${c.fecha_real})`).join(', '))
  }
}

function calcEstadoPago(fechaPago) {
  const ref = fechaReferenciaGlobal.value || today()
  const fc  = fechaPago || ''
  if (!fc || fc <= ref) return 'vencido'
  const [ry, rm] = ref.split('-').map(Number)
  const dia10ref = ref <= `${String(ry).padStart(4,'0')}-${String(rm).padStart(2,'0')}-10`
    ? `${String(ry).padStart(4,'0')}-${String(rm).padStart(2,'0')}-10`
    : `${rm === 12 ? ry+1 : ry}-${String(rm === 12 ? 1 : rm+1).padStart(2,'0')}-10`
  return fc <= dia10ref ? 'proximo' : 'posterior'
}

function rowStyle(d) {
  const ep = calcEstadoPago(d.fechaPagoEfectiva)
  if (ep === 'vencido')   return 'background:rgba(239,68,68,0.13);border-left:3px solid rgba(239,68,68,0.6)'
  if (ep === 'proximo')   return 'background:rgba(59,130,246,0.13);border-left:3px solid rgba(59,130,246,0.6)'
  if (ep === 'posterior') return 'background:rgba(34,197,94,0.13);border-left:3px solid rgba(34,197,94,0.6)'
  return ''
}

// ── Devengados pendientes ──────────────────────────────────────────────────
const devengadosPendientes = computed(() => {
  const lista = []
  console.log('[Pagos] contratos cargados:', contratos.value.length, '| prestamosMap:', Object.keys(prestamosMap.value).length, '| cobrosMap prestamos:', Object.keys(cobrosMap.value).length)
  for (const contrato of contratos.value) {
    const prestamo = prestamosMap.value[contrato.prestamo_id]
    if (!prestamo) { console.log('[Pagos] prestamo no encontrado para contrato:', contrato.id, contrato.prestamo_id); continue }
    if (!prestamo.fecha_inicio || !prestamo.duracion_meses) { console.log('[Pagos] prestamo sin fecha_inicio/duracion:', prestamo.id, prestamo.fecha_inicio, prestamo.duracion_meses); continue }
    if (prestamo.estado === 'cancelado') continue
    const cobrosP  = cobrosMap.value[prestamo.id] || []
    const pagosC   = pagosRaw.value.filter(pg => pg.contrato_ccp_id === contrato.id)
    const lineas   = calcularLineasCCP(contrato, prestamo, cobrosP, pagosC, pctIRPF.value)
    const devengadas = lineas.filter(l => l.col_devengado >= 0.005)
    console.log(`[Pagos] contrato ${contrato.id} (${prestamo.alias} / ${contrato.participes?.nombre}): ${lineas.length} líneas, ${devengadas.length} devengadas, cobros=${cobrosP.length}, pagos=${pagosC.length}`)
    if (prestamo.alias === 'Blanes' && contrato.participes?.nombre === 'Exporten') {
      for (const l of lineas) {
        if (l.col_devengado > 0 || l.col_pendiente < l.neto) {
          console.log(`  Cuota ${l.cuota_num}: devengado=${l.col_devengado.toFixed(2)} pagado=${l.col_pagado.toFixed(2)} pendiente=${l.col_pendiente.toFixed(2)} fecha_cobro=${l.fecha_cobro} fecha_cobro_prestamo=${l.fecha_cobro_prestamo}`)
        }
      }
    }
    for (const l of lineas) {
      if (l.col_devengado < 0.005) continue
      lista.push({
        _key:             contrato.id + '-' + l.cuota_num,
        contrato_ccp_id:  contrato.id,
        participe_id:     contrato.participes?.id,
        participe_nombre: contrato.participes?.nombre || '—',
        prestamo_alias:   prestamo.alias || '—',
        cuota_num:        l.cuota_num,
        beneficio:        Math.round(l.beneficio * (l.col_devengado / (l.neto || 1)) * 100) / 100,
        gestion:          Math.round(l.gestion   * (l.col_devengado / (l.neto || 1)) * 100) / 100,
        bruto:            Math.round(l.bruto      * (l.col_devengado / (l.neto || 1)) * 100) / 100,
        irpf:             Math.round(l.irpf       * (l.col_devengado / (l.neto || 1)) * 100) / 100,
        neto:             l.col_devengado,
        fecha_cobro_prestamo: l.fecha_cobro_prestamo || null,
        fecha_cobro:      l.fecha_cobro,
        fechaPagoEfectiva: l.fecha_cobro || today(),

        pagando:          false,
      })
    }
  }
  return lista.sort((a, b) => (b.fecha_cobro || '').localeCompare(a.fecha_cobro || ''))
})

const participesList = computed(() => {
  const seen = new Set()
  return contratos.value
    .map(c => c.participes)
    .filter(p => p && !seen.has(p.id) && seen.add(p.id))
    .sort((a,b) => a.nombre.localeCompare(b.nombre))
})

const prestamosList = computed(() => {
  const seen = new Set()
  return devengadosPendientes.value
    .map(d => ({ id: d.prestamo_id || d.prestamo_alias, alias: d.prestamo_alias }))
    .filter(p => p.alias && !seen.has(p.alias) && seen.add(p.alias))
    .sort((a,b) => a.alias.localeCompare(b.alias))
})

const devengadosFiltrados = computed(() => {
  let list = devengadosPendientes.value
  if (filtroParticipeDev.value)  list = list.filter(d => d.participe_id === filtroParticipeDev.value)
  if (filtroPrestamosDev.value)  list = list.filter(d => d.prestamo_alias === filtroPrestamosDev.value)
  return list
})

const devengadosAgrupados = computed(() => {
  const grupos = {}
  for (const d of devengadosFiltrados.value) {
    const key = d.participe_id || d.participe_nombre
    if (!grupos[key]) grupos[key] = { participe_id: d.participe_id, participe_nombre: d.participe_nombre, lineas: [], totalNeto: 0 }
    grupos[key].lineas.push(d)
    grupos[key].totalNeto = Math.round((grupos[key].totalNeto + d.neto) * 100) / 100
  }
  return Object.values(grupos).sort((a,b) => a.participe_nombre.localeCompare(b.participe_nombre))
})

const totalDevFiltrado = computed(() => devengadosFiltrados.value.reduce((s,d) => s + d.neto, 0))
const totalDevengadoPendiente = computed(() => devengadosPendientes.value.reduce((s,d) => s + d.neto, 0))

async function pagarTodosProximos() {
  const proximos = devengadosFiltrados.value.filter(d => calcEstadoPago(d.fechaPagoEfectiva) === 'proximo')
  if (!proximos.length) return
  if (!confirm(`¿Pagar los ${proximos.length} devengados de próximo pago?`)) return
  pagandoProximos.value = true
  for (const d of proximos) {
    await pagarDevengado(d)
  }
  pagandoProximos.value = false
}

async function pagarDevengado(d) {
  d.pagando = true
  try {
    const { error } = await supabase.from('pagos_reales_participe').insert({
      id:                'PRP' + uuid(),
      contrato_ccp_id:   d.contrato_ccp_id,
      fecha_pago_real:   d.fechaPagoEfectiva || today(),
      importe_devengado: d.beneficio,
      importe_gestion:   d.gestion,
      importe_bruto:     d.bruto,
      importe_retencion: d.irpf,
      importe_neto:      d.neto,
      observaciones:     null,
    })
    if (error) { alert('Error: ' + error.message); return }
    await cargar()
  } finally { d.pagando = false }
}

onMounted(cargar)

// Todos los registros son pagos reales en la nueva arquitectura
const participeRegList = computed(() => {
  const seen = new Set()
  return pagosRaw.value
    .map(p => ({ nombre: p.contratos_ccp?.participes?.nombre }))
    .filter(p => p.nombre && !seen.has(p.nombre) && seen.add(p.nombre))
    .sort((a,b) => a.nombre.localeCompare(b.nombre))
})

const prestamoRegList = computed(() => {
  const seen = new Set()
  return pagosRaw.value
    .map(p => ({ alias: p.contratos_ccp?.prestamos?.alias }))
    .filter(p => p.alias && !seen.has(p.alias) && seen.add(p.alias))
    .sort((a,b) => a.alias.localeCompare(b.alias))
})

const realizados = computed(() => {
  let list = pagosOrdenados.value
  if (filtroParticipeReg.value) list = list.filter(p => p.contratos_ccp?.participes?.nombre === filtroParticipeReg.value)
  if (filtroPrestamoReg.value)  list = list.filter(p => p.contratos_ccp?.prestamos?.alias   === filtroPrestamoReg.value)
  return list
})

// KPIs
const totalPagado      = computed(() => pagosRaw.value.reduce((s, p) => s + Number(p.importe_neto), 0))
const totalRetenciones = computed(() => pagosRaw.value.reduce((s, p) => s + Number(p.importe_retencion), 0))

// ── Eliminar pago ──
async function eliminarPagoYRecargar(p) {
  const msg = `¿Eliminar el pago a ${p.contratos_ccp?.participes?.nombre || ''}? El devengado volverá a calcularse automáticamente.`
  const ok = await eliminarPago(p, msg)
  if (ok) await cargar()
}

// ── Recalcular en modal ──
function recalcularImportes() {
  const dev     = Math.round((Number(form.value.importe_devengado) || 0) * 100) / 100
  const contrato = contratos.value.find(c => c.id === form.value.contrato_ccp_id)
  const pctG    = contrato ? Number(contrato.porcentaje_gestion) / 100 : 0
  const gestion = Math.round(dev * pctG * 100) / 100
  const bruto   = Math.round((dev - gestion) * 100) / 100
  const ret     = Math.round(bruto * (pctIRPF.value / 100) * 100) / 100
  const neto    = Math.round((bruto - ret) * 100) / 100
  form.value.importe_gestion   = gestion
  form.value.importe_bruto     = bruto
  form.value.importe_retencion = ret
  form.value.importe_neto      = neto
}

function abrirRegistrar() {
  form.value = formVacio()
  modalAbierto.value = true
}

async function guardar() {
  if (!form.value.contrato_ccp_id || !form.value.importe_devengado)
    return alert('Contrato e importe devengado son obligatorios')
  if (Number(form.value.importe_devengado) <= 0)
    return alert('El importe debe ser mayor que cero')
  saving.value = true
  try {
    const { error } = await supabase.from('pagos_reales_participe').insert({
      id:                'PRP' + uuid(),
      contrato_ccp_id:   form.value.contrato_ccp_id,
      fecha_pago_real:   form.value.fecha_pago_real,
      importe_devengado: Number(form.value.importe_devengado),
      importe_gestion:   Number(form.value.importe_gestion),
      importe_bruto:     Number(form.value.importe_bruto),
      importe_retencion: Number(form.value.importe_retencion),
      importe_neto:      Number(form.value.importe_neto),
      observaciones:     form.value.observaciones || null,
    })
    if (error) { alert('Error: ' + error.message); return }
    modalAbierto.value = false
    await cargar()
  } finally { saving.value = false }
}
</script>
