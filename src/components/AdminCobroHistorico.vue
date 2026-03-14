<template>
  <div>
    <!-- Filtros -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <span class="filter-label">Filtros</span>
      <select class="form-control" v-model="filtroEstado" style="width:170px;padding:5px 10px;font-size:12px" :style="filtroEstado !== '' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="cancelado">Cancelados</option>
          <option value="judicializado">Judicializados</option>
        </select>
      <select class="form-control" :class="{'filter-active': !!filtroIntermediario}" style="width:180px;padding:5px 10px;font-size:12px" v-model="filtroIntermediario" :style="!!filtroIntermediario ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
        <option value="">Todos los intermediarios</option>
        <option v-for="i in intermediarios" :key="i.id" :value="i.id">{{ i.nombre }}</option>
      </select>
      <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Buscar préstamo..." v-model="busqueda" style="width:200px" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
    </div>

    <!-- Tabla préstamos -->
    <div class="table-card">
      <div class="table-header">
        <h3>Préstamos ({{ prestamosFiltered.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>CC</th>
              <th>Alias</th>
              <th>Intermediario</th>
              <th>Tipo</th>
              <th style="text-align:right">Importe</th>
              <th>Inicio</th>
              <th style="text-align:center">Meses</th>
              <th>Estado</th>
              <th style="text-align:center">Cobros</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in prestamosFiltered" :key="p.id">
              <td class="td-mono" style="color:var(--text3);text-align:center">{{ p.centro_coste || '—' }}</td>
              <td style="font-weight:500">{{ p.alias }}</td>
              <td style="font-size:12px">{{ p.intermediarios?.nombre || '—' }}</td>
              <td v-html="getTipoBadge(p.tipo_prestamo)" />
              <td class="td-mono td-right">{{ fmtDec(p.importe) }}</td>
              <td style="font-size:12px">{{ fmtDate(p.fecha_inicio) }}</td>
              <td class="td-mono td-center">{{ p.duracion_meses }}</td>
              <td v-html="getEstadoBadge(p.estado)" />
              <td class="td-mono td-center">
                <span :class="cobrosCount[p.id] > 0 ? 'badge badge-green' : 'badge badge-gray'">{{ cobrosCount[p.id] || 0 }}</span>
              </td>
              <td style="display:flex;gap:6px;align-items:center;justify-content:flex-end">
                <!-- Forzar cobros -->
                <button
                  class="btn btn-sm"
                  :class="tieneCobrosPendientes(p) ? 'btn-cobrar' : ''"
                  style="padding:3px 9px;font-size:11px;white-space:nowrap"
                  :disabled="procesando === p.id || !tieneCobrosPendientes(p)"
                  @click="tieneCobrosPendientes(p) && forzarCobros(p)"
                  :title="tieneCobrosPendientes(p) ? 'Registrar todos los cobros pendientes' : 'No hay cobros pendientes'">
                  <span v-if="procesando === p.id" class="btn-spinner"></span>{{ procesando === p.id ? 'Procesando...' : '⚡ Forzar cobros' }}
                </button>
                <!-- Borrar cobros -->
                <button
                  class="btn btn-sm"
                  :style="cobrosCount[p.id] > 0
                    ? 'padding:2px 7px;font-size:13px;color:var(--red);border-color:var(--red)'
                    : 'padding:2px 7px;font-size:13px;color:var(--text3);border-color:var(--border);cursor:default'"
                  :disabled="procesando === p.id || !(cobrosCount[p.id] > 0)"
                  @click="cobrosCount[p.id] > 0 && borrarTodosCobros(p)"
                  :title="cobrosCount[p.id] > 0 ? 'Eliminar todos los cobros de este préstamo' : 'No hay cobros que eliminar'">✕</button>
              </td>
            </tr>
            <tr v-if="!prestamosFiltered.length">
              <td colspan="10" class="table-empty">Sin préstamos</td>
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
import { fmt, fmtDate, today, uuid, generateCalendarioTeorico, generateCalendarioCCP, getTipoBadge, getEstadoBadge , fmtDec } from '../utils.js'

// ── Estado ────────────────────────────────────
const prestamos      = ref([])
const intermediarios = ref([])
const todosCobros    = ref([])
const filtroEstado = usePersistedRef('adminCobro.filtroEstado', 'activo')
const filtroIntermediario = usePersistedRef('adminCobro.filtroIntermediario', '')
const busqueda = usePersistedRef('adminCobro.busqueda', '')
const procesando        = ref(null)

// ── Carga ─────────────────────────────────────
onMounted(cargar)

async function cargar() {
  const [{ data: p }, { data: i }, { data: cb }] = await Promise.all([
    supabase.from('prestamos').select('*, intermediarios(nombre), garantias(valor_tasacion)').order('centro_coste'),
    supabase.from('intermediarios').select('id, nombre').order('nombre'),
    supabase.from('cobros').select('id, prestamo_id, cuota_num, importe, tipo')
  ])
  prestamos.value      = p  || []
  intermediarios.value = i  || []
  todosCobros.value    = cb || []
}

// ── Computed ──────────────────────────────────
function esActivo(p) {
  return p.estado === 'activo'
}

const prestamosFiltered = computed(() => {
  let list = prestamos.value
  if (filtroEstado.value === 'activo') list = list.filter(p => esActivo(p))
  else if (filtroEstado.value) list = list.filter(p => p.estado === filtroEstado.value)
  if (filtroIntermediario.value) list = list.filter(p => p.intermediario_id === filtroIntermediario.value)
  const q = busqueda.value.toLowerCase()
  if (q) list = list.filter(p => p.alias.toLowerCase().includes(q) || (p.intermediarios?.nombre || '').toLowerCase().includes(q))
  return list
})

const cobrosCount = computed(() => {
  const m = {}
  todosCobros.value.forEach(c => { m[c.prestamo_id] = (m[c.prestamo_id] || 0) + 1 })
  return m
})

// ── Estado botones ────────────────────────────
function tieneCobrosPendientes(prestamo) {
  if (prestamo.estado === 'judicializado') return false
  const hoy = today()
  const esCancelado = prestamo.estado === 'cancelado'
  const fechaLimite = esCancelado ? (prestamo.fecha_cancelacion || hoy) : hoy
  const cuotasYaCobradas = new Set(todosCobros.value.filter(c => c.prestamo_id === prestamo.id).map(c => String(c.cuota_num)))
  const tieneCancelacion = todosCobros.value.some(c => c.prestamo_id === prestamo.id && c.tipo === 'cancelacion')
  if (esCancelado && tieneCancelacion) return false
  const cal = generateCalendarioTeoricoSinFiltroEstado(prestamo)
  return cal.some(c => c.fecha <= fechaLimite && !cuotasYaCobradas.has(String(c.num)))
}

// ── Acciones ──────────────────────────────────
async function forzarCobros(prestamo) {
  procesando.value = prestamo.id
  try {
    const cobrosExistentes = todosCobros.value.filter(c => c.prestamo_id === prestamo.id)
    const cuotasYaCobradas = new Set(cobrosExistentes.map(c => String(c.cuota_num)))
    const hoy = today()
    const esCancelado = prestamo.estado === 'cancelado'
    const fechaLimite = esCancelado ? (prestamo.fecha_cancelacion || hoy) : hoy

    if (esCancelado) {
      const cal = generateCalendarioTeoricoSinFiltroEstado(prestamo)
      const cuotasPendientes = cal.filter(c => c.fecha <= fechaLimite && !cuotasYaCobradas.has(String(c.num)))
      const inserts = cuotasPendientes.map(c => ({
        id: 'CB' + uuid(), prestamo_id: prestamo.id, cuota_num: String(c.num),
        fecha_teorica: c.fecha, fecha_real: c.fecha,
        importe: Math.round(c.total * 100) / 100, tipo: 'pago_cuota',
        notas: 'Registrado por Cobros Históricos'
      }))
      const principalPendiente = calcPrincipalPendiente(prestamo, cal, cuotasYaCobradas, cuotasPendientes.map(c => String(c.num)))
      const diasDemora = calcDiasDesdeUltimaCuota(cal, fechaLimite, cuotasYaCobradas, cuotasPendientes.map(c => String(c.num)))
      const interesesExtras = calcInteresesProporcionales(prestamo, diasDemora)
      const importeCancelacion = Math.round((principalPendiente + interesesExtras) * 100) / 100
      if (importeCancelacion > 0) {
        inserts.push({
          id: 'CB' + uuid(), prestamo_id: prestamo.id, cuota_num: 'C',
          fecha_teorica: fechaLimite, fecha_real: fechaLimite,
          importe: importeCancelacion, tipo: 'cancelacion',
          notas: `Liquidación cancelación: principal ${fmt(principalPendiente)} + intereses proporcionales ${fmt(interesesExtras)}`
        })
      }
      if (inserts.length) {
        const { error } = await supabase.from('cobros').insert(inserts)
        if (error) { alert('Error: ' + error.message); return }

      }
    } else {
      const cal = generateCalendarioTeorico(prestamo)
      const cuotasPendientes = cal.filter(c => c.fecha <= fechaLimite && !cuotasYaCobradas.has(String(c.num)))
      if (!cuotasPendientes.length) { alert('No hay cuotas pendientes de cobro hasta hoy.'); return }
      const inserts = cuotasPendientes.map(c => ({
        id: 'CB' + uuid(), prestamo_id: prestamo.id, cuota_num: String(c.num),
        fecha_teorica: c.fecha, fecha_real: c.fecha,
        importe: Math.round(c.total * 100) / 100, tipo: 'pago_cuota',
        notas: 'Registrado por Cobros Históricos'
      }))
      const { error } = await supabase.from('cobros').insert(inserts)
      if (error) { alert('Error: ' + error.message); return }

    }
    await cargar()
  } finally {
    procesando.value = null
  }
}

async function borrarTodosCobros(prestamo) {
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === prestamo.id)
  if (!cobrosP.length) return
  // Devengados son virtuales: solo bloqueamos si hay pagos reales registrados
  const { data: contrCCP } = await supabase.from('contratos_ccp').select('id').eq('prestamo_id', prestamo.id)
  const cccpIds = (contrCCP || []).map(c => c.id)
  if (cccpIds.length) {
    const { data: pagosReales } = await supabase
      .from('pagos_reales_participe').select('id').in('contrato_ccp_id', cccpIds).limit(1)
    if (pagosReales?.length) {
      return alert(`No se pueden eliminar los cobros de "${prestamo.alias}" porque hay pagos reales registrados a partícipes. Elimínalos primero desde los contratos CCP.`)
    }
  }
  if (!confirm(`¿Eliminar TODOS los cobros (${cobrosP.length}) del préstamo "${prestamo.alias}"? Esta acción no se puede deshacer.`)) return
  procesando.value = prestamo.id
  try {
    await supabase.from('cobros').delete().eq('prestamo_id', prestamo.id)
    await cargar()
  } finally {
    procesando.value = null
  }
}

// ── Helpers calendario ────────────────────────
function generateCalendarioTeoricoSinFiltroEstado(prestamo) {
  const cuotas = []
  const inicio = new Date(prestamo.fecha_inicio + 'T00:00:00')
  const periodicidad = (prestamo.periodicidad || 'mensual').toLowerCase()
  const P = Number(prestamo.importe)
  const tasaAnual = Number(prestamo.interes_ordinario) / 100
  const tipo = prestamo.tipo_prestamo
  let mesesPaso, numCuotas, tasaPeriodo
  if (periodicidad === 'trimestral') { mesesPaso = 3; numCuotas = Math.round(prestamo.duracion_meses / 3); tasaPeriodo = tasaAnual * 3 / 12 }
  else if (periodicidad === 'anual') { mesesPaso = 12; numCuotas = Math.round(prestamo.duracion_meses / 12); tasaPeriodo = tasaAnual }
  else { mesesPaso = 1; numCuotas = prestamo.duracion_meses; tasaPeriodo = tasaAnual / 12 }
  const fmtF = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  let cuotaFija = 0
  if (tipo === 'Francés' && tasaPeriodo > 0) cuotaFija = Math.round(P * tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -numCuotas)) * 100) / 100
  let cuotasCarencia = 0, cuotaFijaPostCarencia = 0
  if (tipo === 'Francés con carencia') {
    cuotasCarencia = Math.round(numCuotas / 2)
    const nPost = numCuotas - cuotasCarencia
    cuotaFijaPostCarencia = (tasaPeriodo > 0 && nPost > 0)
      ? Math.round(P * tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -nPost)) * 100) / 100
      : Math.round(P / nPost * 100) / 100
  }
  let saldo = P
  for (let i = 1; i <= numCuotas; i++) {
    const fecha = new Date(inicio)
    fecha.setMonth(fecha.getMonth() + i * mesesPaso)
    fecha.setDate(prestamo.dia_cobro)
    let interes = 0, principal = 0
    if (tipo === 'Americano') { interes = Math.round(P * tasaPeriodo * 100) / 100; principal = i === numCuotas ? P : 0 }
    else if (tipo === 'Francés') {
      interes = Math.round(saldo * tasaPeriodo * 100) / 100
      principal = Math.round((cuotaFija - interes) * 100) / 100
      if (i === numCuotas) principal = Math.round(saldo * 100) / 100
      saldo = Math.round((saldo - principal) * 100) / 100
    } else if (tipo === 'Francés con carencia') {
      if (i <= cuotasCarencia) { interes = Math.round(P * tasaPeriodo * 100) / 100; principal = 0 }
      else {
        interes = Math.round(saldo * tasaPeriodo * 100) / 100
        principal = Math.round((cuotaFijaPostCarencia - interes) * 100) / 100
        if (i === numCuotas) principal = Math.round(saldo * 100) / 100
        saldo = Math.round((saldo - principal) * 100) / 100
      }
    }
    cuotas.push({ num: i, fecha: fmtF(fecha), interes, principal, total: Math.round((interes + principal) * 100) / 100 })
  }
  return cuotas
}

function calcPrincipalPendiente(prestamo, cal, cobradas, nuevas) {
  const todasCobradas = new Set([...cobradas, ...nuevas])
  const P = Number(prestamo.importe)
  if (prestamo.tipo_prestamo === 'Americano') {
    return todasCobradas.has(String(cal[cal.length - 1].num)) ? 0 : P
  }
  return cal.filter(c => !todasCobradas.has(String(c.num))).reduce((s, c) => s + c.principal, 0)
}

function calcDiasDesdeUltimaCuota(cal, fechaCancelacion, cobradas, nuevas) {
  const todasCobradas = new Set([...cobradas, ...nuevas])
  const cuotasOrdenadas = cal.filter(c => todasCobradas.has(String(c.num))).sort((a, b) => b.num - a.num)
  const fechaRef = cuotasOrdenadas.length ? cuotasOrdenadas[0].fecha : cal[0]?.fecha
  if (!fechaRef) return 0
  const fRef = new Date(fechaRef + 'T00:00:00')
  const fCancel = new Date(fechaCancelacion + 'T00:00:00')
  return Math.max(0, Math.round((fCancel - fRef) / (1000 * 60 * 60 * 24)))
}

function calcInteresesProporcionales(prestamo, dias) {
  if (dias <= 0) return 0
  return Math.round(Number(prestamo.importe) * (Number(prestamo.interes_ordinario) / 100) / 365 * dias * 100) / 100
}

</script>
