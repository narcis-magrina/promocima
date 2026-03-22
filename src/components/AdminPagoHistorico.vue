<template>
  <div>
    <!-- Filtros -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <span class="filter-label">Filtros</span>
      <select class="form-control" v-model="filtroEstado" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroEstado !== '' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      <select class="form-control" :class="{'filter-active': !!filtroParticipe}" style="width:200px;padding:5px 10px;font-size:12px" v-model="filtroParticipe" :style="!!filtroParticipe ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
        <option value="">Todos los partícipes</option>
        <option v-for="p in participes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
    </div>

    <!-- Tabla contratos CCP -->
    <div class="table-card">
      <div class="table-header">
        <h3>Contratos CCP ({{ contratosFiltered.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Partícipe</th>
              <th>Préstamo</th>
              <th>Fecha Firma</th>
              <th style="text-align:right">Importe</th>
              <th style="text-align:center">% Part.</th>
              <th style="text-align:center">% Gestión</th>
              <th>Estado</th>
              <th style="text-align:center">Pagados</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosFiltered" :key="c.id">
              <td style="font-size:12px;font-weight:500">{{ c.participes?.nombre || '—' }}</td>
              <td style="font-size:12px">{{ c.prestamos?.alias || '—' }}</td>
              <td style="font-size:12px">{{ fmtDate(c.fecha_firma) }}</td>
              <td class="td-mono td-right">{{ fmtDec(c.importe_participacion) }}</td>
              <td class="td-mono td-center">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-center">{{ c.porcentaje_gestion }}%</td>
              <td>
                <span class="badge" :class="c.activo ? 'badge-green' : 'badge-gray'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="td-mono td-center">
                <span :class="pagosCount[c.id] > 0 ? 'badge badge-green' : 'badge badge-gray'">{{ pagosCount[c.id] || 0 }}</span>
              </td>
              <td style="display:flex;gap:6px;align-items:center;justify-content:flex-end">
                <!-- Forzar pagos -->
                <button
                  class="btn btn-sm"
                  :class="tienePagosPendientes(c) ? 'btn-cobrar' : ''"
                  style="padding:3px 9px;font-size:11px;white-space:nowrap"
                  :disabled="procesando === c.id || !tienePagosPendientes(c)"
                  @click="tienePagosPendientes(c) && forzarPagos(c)"
                  :title="tienePagosPendientes(c) ? 'Registrar todos los pagos pendientes' : 'No hay pagos pendientes'">
                  <span v-if="procesando === c.id" class="btn-spinner"></span>{{ procesando === c.id ? 'Procesando...' : '⚡ Forzar pagos' }}
                </button>
                <!-- Borrar pagos -->
                <button
                  class="btn btn-sm"
                  :style="pagosCount[c.id] > 0
                    ? 'padding:2px 7px;font-size:13px;color:var(--red);border-color:var(--red)'
                    : 'padding:2px 7px;font-size:13px;color:var(--text3);border-color:var(--border);cursor:default'"
                  :disabled="procesando === c.id || !(pagosCount[c.id] > 0)"
                  @click="pagosCount[c.id] > 0 && borrarTodosPagos(c)"
                  :title="pagosCount[c.id] > 0 ? 'Eliminar todos los pagos de este contrato' : 'No hay pagos que eliminar'">✕</button>
              </td>
            </tr>
            <tr v-if="!contratosFiltered.length">
              <td colspan="9" class="table-empty">Sin contratos CCP</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { fmt, fmtDate, today, uuid, calcularLineasCCP , fmtDec } from '../utils.js'
import { eliminarPagos } from '../composables/useDevengados.js'

// ── Estado ────────────────────────────────────
const contratos       = ref([])
const participes      = ref([])
const todosPagos      = ref([])   // pagos reales (todos son pagados en nueva arquitectura)
const cobrosPorPrestamo = ref({}) // cobros agrupados por prestamo_id
const filtroEstado = usePersistedRef('adminPago.filtroEstado', 'activo')
const filtroParticipe = usePersistedRef('adminPago.filtroParticipe', '')
const procesando      = ref(null)
const pctIRPF         = ref(19)

// ── Carga ─────────────────────────────────────
onMounted(cargar)

async function cargar() {
  const [{ data: ct }, { data: pt }, { data: pg }, { data: cb }, { data: cfg }] = await Promise.all([
    supabase.from('contratos_ccp').select('*, participes(nombre), prestamos(id, alias, importe, interes_ordinario, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad, estado)'),
    supabase.from('participes').select('id, nombre').order('nombre'),
    supabase.from('pagos_reales_participe').select('id, contrato_ccp_id, importe_neto, fecha_pago_real'),
    supabase.from('cobros').select('id, prestamo_id, cuota_num, importe, tipo, fecha_real'),
    supabase.from('config').select('porcentaje_irpf').limit(1).single(),
  ])
  contratos.value  = ct || []
  participes.value = pt || []
  todosPagos.value = pg || []
  pctIRPF.value    = cfg?.data?.porcentaje_irpf || 19
  // Agrupar cobros por prestamo_id
  const mapa = {}
  for (const c of (cb || [])) {
    if (!mapa[c.prestamo_id]) mapa[c.prestamo_id] = []
    mapa[c.prestamo_id].push(c)
  }
  cobrosPorPrestamo.value = mapa
}

// ── Computed ──────────────────────────────────
const contratosFiltered = computed(() => {
  let list = contratos.value
  if (filtroEstado.value === 'activo') list = list.filter(c => c.activo)
  else if (filtroEstado.value === 'inactivo') list = list.filter(c => !c.activo)
  if (filtroParticipe.value) list = list.filter(c => c.participe_id === filtroParticipe.value)
  return list
})

const pagosCount = computed(() => {
  const m = {}
  todosPagos.value.forEach(p => { m[p.contrato_ccp_id] = (m[p.contrato_ccp_id] || 0) + 1 })
  return m
})

// ── Estado botones: hay devengado pendiente de cobrar hoy? ────────────────────
function tienePagosPendientes(contrato) {
  const prestamo = contrato.prestamos
  if (!prestamo?.fecha_inicio) return false
  const cobros   = cobrosPorPrestamo.value[prestamo.id] || []
  const pagos    = todosPagos.value.filter(p => p.contrato_ccp_id === contrato.id)
  const lineas   = calcularLineasCCP(contrato, prestamo, cobros, pagos, pctIRPF.value)
  const hoy      = today()
  return lineas.some(l =>
    (l.estado === 'devengado' || l.estado === 'devengado_parcial') && l.fecha_cobro <= hoy
  )
}

// ── Forzar pagos: insertar pago real por cada devengado vencido no pagado ─────
async function forzarPagos(contrato) {
  procesando.value = contrato.id
  try {
    const prestamo = contrato.prestamos
    if (!prestamo?.fecha_inicio) { alert('No se encontró el préstamo asociado.'); return }
    const cobros = cobrosPorPrestamo.value[prestamo.id] || []
    const pagos  = todosPagos.value.filter(p => p.contrato_ccp_id === contrato.id)
    const lineas = calcularLineasCCP(contrato, prestamo, cobros, pagos, pctIRPF.value)
    const hoy    = today()
    const inserts = lineas
      .filter(l => (l.estado === 'devengado' || l.estado === 'devengado_parcial') && l.fecha_cobro <= hoy)
      .map(l => ({
        id:                'PRP' + uuid(),
        contrato_ccp_id:   contrato.id,
        fecha_pago_real:   l.fecha_cobro || hoy,
        importe_devengado: l.beneficio,
        importe_gestion:   l.gestion,
        importe_bruto:     l.bruto,
        importe_retencion: l.irpf,
        importe_neto:      l.neto,
        observaciones:     'Generado por Pagos Históricos',
      }))
    if (!inserts.length) { alert('No hay pagos devengados vencidos pendientes.'); return }
    const { error } = await supabase.from('pagos_reales_participe').insert(inserts)
    if (error) { alert('Error: ' + error.message); return }
    await cargar()
  } finally {
    procesando.value = null
  }
}

// ── Borrar todos los pagos reales de un contrato ──────────────────────────────
async function borrarTodosPagos(contrato) {
  const pagosP = todosPagos.value.filter(p => p.contrato_ccp_id === contrato.id)
  if (!pagosP.length) return
  if (!confirm(`¿Eliminar TODOS los pagos registrados (${pagosP.length}) del contrato de "${contrato.participes?.nombre} · ${contrato.prestamos?.alias}"? Los devengados volverán a calcularse automáticamente.`)) return
  procesando.value = contrato.id
  try {
    await eliminarPagos(pagosP.map(p => p.id))
    await cargar()
  } finally {
    procesando.value = null
  }
}
</script>
