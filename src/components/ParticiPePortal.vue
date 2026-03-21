<template>
  <div>
    <!-- KPIs resumen -->
    <div v-if="loading" style="color:var(--text3);font-size:12px;margin-bottom:16px">Calculando KPIs…</div>
    <template v-else>

      <!-- Fila 1: Capital Invertido + Rentabilidad -->
      <div class="portal-kpi-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">

        <!-- Capital Invertido -->
        <div class="kpi-card kc-purple">
          <div class="kpi-label">Capital Invertido</div>
          <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartEnCurso) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>En curso</span>
              <span class="kpi-row-val">{{ fmtN(kpartEnCurso) }}</span>
            </div>
            <div class="kpi-row">
              <span>Activo</span>
              <span class="kpi-row-val">{{ fmtN(kpartActivo) }}</span>
            </div>
            <template v-if="kpartJudicial > 0">
              <div class="kpi-row kpi-row-sep">
                <span>Judicializado</span>
                <span class="kpi-row-val">{{ fmtN(kpartJudicial) }}</span>
              </div>
              <div class="kpi-row">
                <span>% Judicializado</span>
                <span class="kpi-row-val">{{ kpartPctJudicial }}%</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Rentabilidad -->
        <div class="kpi-card kc-blue">
          <div class="kpi-label">Rentabilidad</div>
          <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartIngrAnuales) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Ingresos anuales previstos</span>
              <span class="kpi-row-val">{{ fmtN(kpartIngrAnuales) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span>Rentabilidad</span>
              <span class="kpi-row-val">{{ kpartRentPct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fila 2: Operaciones + LTV -->
      <div class="portal-kpi-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px">

        <!-- Operaciones -->
        <div class="kpi-card kc-green">
          <div class="kpi-label">Operaciones</div>
          <div class="kpi-value" style="font-size:20px">{{ kpartOpTotal }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Total</span>
              <span class="kpi-row-val">{{ kpartOpTotal }}</span>
            </div>
            <div class="kpi-row">
              <span>En curso</span>
              <span class="kpi-row-val">{{ kpartOpEnCurso }}</span>
            </div>
            <div class="kpi-row">
              <span>Activas</span>
              <span class="kpi-row-val">{{ kpartOpActivas }}</span>
            </div>
            <div class="kpi-row">
              <span>Judicializadas</span>
              <span class="kpi-row-val">{{ kpartOpJudicializ }}</span>
            </div>
            <div class="kpi-row">
              <span>Canceladas</span>
              <span class="kpi-row-val">{{ kpartOpCanceladas }}</span>
            </div>
          </div>
        </div>

        <!-- LTV -->
        <div class="kpi-card kc-yellow">
          <div class="kpi-label">LTV</div>
          <div class="kpi-value" style="font-size:20px">{{ kpartLTV !== null ? kpartLTV + '%' : '—' }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Total garantías</span>
              <span class="kpi-row-val">{{ fmtN(kpartGarantias) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span>LTV</span>
              <span class="kpi-row-val">{{ kpartLTV !== null ? kpartLTV + '%' : '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fila 3: Situación mes -->
      <div style="margin-bottom:20px">
        <div class="kpi-card kc-orange">
          <div class="kpi-label">Situación mes</div>
          <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartBrutoMes) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Beneficio/mes</span>
              <span class="kpi-row-val">{{ fmtN(kpartBrutoMes) }}</span>
            </div>
            <div class="kpi-row">
              <span>Neto/mes</span>
              <span class="kpi-row-val">{{ fmtN(kpartNetoMes) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span>Devengado pendiente</span>
              <span class="kpi-row-val">{{ kpartDevengadoTotal > 0 ? fmtN(kpartDevengadoTotal) : '—' }}</span>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Contratos -->
    <div class="section-header" style="margin-bottom:14px">
      <div>
        <div class="section-title">Mis Contratos CCP</div>
        <div class="section-sub">Participaciones activas en préstamos</div>
      </div>
    </div>

    <div v-if="loading" style="color:var(--text3);padding:20px">Cargando…</div>
    <div v-else-if="!contratos.length" class="table-empty" style="margin-bottom:20px">
      No hay contratos CCP asociados a tu perfil.
    </div>

    <template v-else>
      <!-- Filtro de estado — solo si hay cancelados -->
      <div v-if="contratos.some(c => estadoContrato(c) === 'cancelado')" style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="btn btn-sm" :class="filtroEstado==='activos' ? 'btn-primary' : ''" @click="filtroEstado='activos'">Activos</button>
        <button class="btn btn-sm" :class="filtroEstado==='todos' ? 'btn-primary' : ''" @click="filtroEstado='todos'">Todos</button>
        <span style="font-size:12px;color:var(--text3)">{{ contratosFiltrados.length }} contrato{{ contratosFiltrados.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="table-card" style="margin-bottom:20px;overflow-x:auto">
        <div class="table-header"><h3>Contratos ({{ contratosFiltrados.length }})</h3></div>
        <table>
          <thead>
            <tr>
              <th>Préstamo</th>
              <th v-if="modoTodo">Partícipe</th>
              <th style="text-align:right">Importe Participado</th>
              <th style="text-align:center">% Part.</th>
              <th v-if="modoTodo" style="text-align:right">Beneficio/mes</th>
              <th style="text-align:right">Neto/mes</th>
              <th style="text-align:right;color:var(--orange)">Devengado</th>
              <th>Estado préstamo</th>
              <th>Estado contrato</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosFiltrados" :key="c.id" style="cursor:pointer" @click="emit('navigate', 'contratos-ccp', c.id)">
              <td style="font-weight:500">{{ c.prestamos?.alias || c.prestamo_id }}</td>
              <td v-if="modoTodo" style="font-size:12px;color:var(--text2)">{{ c.participes?.nombre || '—' }}</td>
              <td class="td-mono td-right">{{ fmt(c.importe_participacion) }}</td>
              <td class="td-mono td-center">{{ c.porcentaje_participacion }}%</td>
              <td v-if="modoTodo" class="td-mono td-right" style="color:var(--accent)">{{ fmt(calcBeneficioMes(c)) }}</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ fmt(calcInteresNeto(c)) }}</td>
              <td class="td-mono td-right" style="color:var(--orange)">{{ calcDevengado(c) > 0 ? fmt(calcDevengado(c)) : '—' }}</td>
              <td><span v-html="getEstadoBadge(c.prestamos?.estado === 'cancelado' ? 'cancelado' : c.prestamos?.estado === 'judicializado' ? 'judicializado' : c.prestamos?.situacion || 'al_dia')" /></td>
              <td><span class="badge" :class="c.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtN, fmtDate, getEstadoBadge, calcSituacionPrestamo, calcCapitalEnCursoPrestamo, generateCalendarioTeorico, calcDevengadoContrato, today } from '../utils.js'
import { useAuth } from '../composables/useAuth.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'

const props = defineProps({
  participeId:  { type: String,  default: null },  // un partícipe específico
  participeIds: { type: Array,   default: null },  // lista explícita (modo Todo)
  fechaCierre:  { type: String,  default: null },  // fecha de cierre portal (YYYY-MM-DD)
})
const emit  = defineEmits(['navigate'])

const { participeId: authParticipeId, participeIds: authParticipeIds } = useAuth()
// IDs a mostrar: prop explícito, lista explícita, o los del auth
const pidsActivos = computed(() => {
  if (props.participeIds) return props.participeIds          // modo Todo con lista
  if (props.participeId)  return [props.participeId]         // un partícipe específico
  return authParticipeIds.value || []                         // del auth (portal standalone)
})

const contratos  = ref([])
const filtroEstado = ref('activos')  // 'activos' | 'todos'
const pagos      = ref([])
const loading    = ref(true)

onMounted(cargar)
watch(() => props.participeId, cargar)
watch(() => props.participeIds, cargar)
watch(() => props.fechaCierre, cargar)
watch(authParticipeIds, cargar)

async function cargar() {
  const pids = pidsActivos.value
  if (!pids.length) { loading.value = false; return }
  loading.value = true
  try {
    // Buscar por participe_id
    const { data: cc } = await supabase
      .from('contratos_ccp')
      .select('*, participes(nombre), prestamos(id, alias, estado, interes_ordinario, importe, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad, garantia_tasacion, meses_carencia)')
      .in('participe_id', pids)
      .order('fecha_firma')

    const prestamoIds = [...new Set((cc || []).map(c => c.prestamo_id).filter(Boolean))]
    let cobrosPortal = []
    if (prestamoIds.length) {
      const { data: cbp } = await supabase
        .from('cobros')
        .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, cuota_num')
        .in('prestamo_id', prestamoIds)
        .limit(50000)
      cobrosPortal = cbp || []
    }

    // Aplicar fecha de cierre: filtrar contratos, cobros y pagos posteriores a la fecha
    const cierre = props.fechaCierre || null
    const ccFiltrados = (cc || []).filter(c => !cierre || ((c.fecha_firma || '9999') <= cierre))

    contratos.value = ccFiltrados
      .filter(c => !cierre || !c.prestamos || ((c.prestamos.fecha_inicio || '9999') <= cierre))
      .map(c => {
        const pr = c.prestamos
        if (!pr) return c
        const cobrosP = cobrosPortal
          .filter(cb => cb.prestamo_id === pr.id)
          .filter(cb => !cierre || (cb.fecha_real || cb.fecha_teorica || '') <= cierre)
        return { ...c, cobrosP, prestamos: { ...pr, situacion: calcSituacionPrestamo(pr, cobrosP, cierre) } }
      })

    const ccpIds = contratos.value.map(c => c.id)
    if (ccpIds.length) {
      let pgQuery = supabase
        .from('pagos_reales_participe').select('*')
        .in('contrato_ccp_id', ccpIds)
        .order('fecha_pago_real', { ascending: false })
      if (props.fechaCierre) pgQuery = pgQuery.lte('fecha_pago_real', props.fechaCierre)
      const { data: pg } = await pgQuery
      pagos.value = pg || []
    } else {
      pagos.value = []
    }
  } finally {
    loading.value = false
  }
}

// Modo Todo: hay varios partícipes en la lista
const modoTodo = computed(() => pidsActivos.value.length > 1)

// Filtro de estado
const contratosFiltrados = computed(() => {
  if (filtroEstado.value === 'todos') return contratos.value
  return contratos.value.filter(c => estadoContrato(c) !== 'cancelado')
})

// ── Helpers de estado ─────────────────────────────────────────────────────────
const estadoContrato = c => {
  const pr = c.prestamos
  if (!pr) return 'al_dia'
  if (pr.estado === 'cancelado')     return 'cancelado'
  if (pr.estado === 'judicializado') return 'judicializado'
  return pr.situacion || 'al_dia'
}

const capActivoContrato = c => {
  const pr = c.prestamos
  if (!pr || pr.estado === 'cancelado') return 0
  return calcCapitalEnCursoPrestamo(pr, c.cobrosP || []) * Number(c.porcentaje_participacion) / 100
}

// ── Grupos ───────────────────────────────────────────────────────────────────
const contratosActivos = computed(() => contratos.value.filter(c => c.activo && estadoContrato(c) !== 'cancelado'))
const contratosActNOJud= computed(() => contratosActivos.value.filter(c => estadoContrato(c) !== 'judicializado'))
const contratosJud     = computed(() => contratosActivos.value.filter(c => estadoContrato(c) === 'judicializado'))

// ── Capital Invertido ─────────────────────────────────────────────────────────
const kpartEnCurso    = computed(() => contratosActivos.value.reduce((s,c) => s + capActivoContrato(c), 0))
const kpartActivo     = computed(() => contratosActNOJud.value.reduce((s,c) => s + capActivoContrato(c), 0))
const kpartJudicial   = computed(() => contratosJud.value.reduce((s,c) => s + capActivoContrato(c), 0))
const kpartPctJudicial= computed(() => {
  const base = kpartActivo.value + kpartJudicial.value
  return base > 0 ? Math.round(kpartJudicial.value / base * 10000) / 100 : 0
})

// ── Rentabilidad (neta de gestión, desde el punto de vista del partícipe) ────
const anoActual = new Date().getFullYear()
const kpartIngrAnuales = computed(() =>
  Math.round(contratosActNOJud.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr) return s
    const pctPart = Number(c.porcentaje_participacion) / 100
    const tasaNet = (Number(pr.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
    const capPart = Number(pr.importe) * pctPart
    const cal = generateCalendarioTeorico(pr)
    const cuotasAnio = cal.filter(cu => new Date(cu.fecha + 'T00:00:00').getFullYear() === anoActual).length
    return s + capPart * tasaNet / 12 * cuotasAnio
  }, 0) * 100) / 100
)
const kpartRentPct = computed(() => {
  if (!kpartActivo.value) return '0.00'
  return (kpartIngrAnuales.value / kpartActivo.value * 100).toFixed(2)
})

// ── Operaciones ───────────────────────────────────────────────────────────────
const kpartOpTotal      = computed(() => contratos.value.length)
const kpartOpCanceladas = computed(() => contratos.value.filter(c => estadoContrato(c) === 'cancelado').length)
const kpartOpEnCurso    = computed(() => contratosActivos.value.length)
const kpartOpJudicializ = computed(() => contratosJud.value.length)
const kpartOpActivas    = computed(() => contratosActNOJud.value.length)

// ── LTV ───────────────────────────────────────────────────────────────────────
const kpartGarantias = computed(() =>
  contratosActivos.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr || !pr.garantia_tasacion) return s
    return s + Number(pr.garantia_tasacion) * Number(c.porcentaje_participacion) / 100
  }, 0)
)
const kpartLTV = computed(() => {
  if (!kpartGarantias.value) return null
  return Math.round(kpartEnCurso.value / kpartGarantias.value * 10000) / 100
})

// ── Situación mes ─────────────────────────────────────────────────────────────
const kpartBrutoMes = computed(() =>
  Math.round(contratosActNOJud.value.reduce((s, c) => {
    if (!c.prestamos) return s
    const tasaNet = (Number(c.prestamos.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
    return s + Number(c.importe_participacion) * tasaNet / 12
  }, 0) * 100) / 100
)
const kpartNetoMes = computed(() =>
  Math.round(kpartBrutoMes.value * (1 - 0.19) * 100) / 100
)
const kpartDevengadoTotal = computed(() =>
  Math.round(contratosActivos.value.reduce((s, c) => s + calcDevengado(c), 0) * 100) / 100
)

// ── Tabla contratos ───────────────────────────────────────────────────────────
function calcBeneficioMes(c) {
  // Intereses - gestión (bruto antes de IRPF)
  if (!c.prestamos) return 0
  const tasaNet = (Number(c.prestamos.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
  return Math.round(Number(c.importe_participacion) * tasaNet / 12 * 100) / 100
}

function calcInteresNeto(c) {
  if (!c.prestamos) return 0
  const tasaNet = (Number(c.prestamos.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
  const bruto   = Number(c.importe_participacion) * tasaNet / 12
  return Math.round(bruto * (1 - 0.19) * 100) / 100
}

function calcDevengado(c) {
  if (!c.prestamos || !c.activo || c.prestamos.estado === 'cancelado') return 0
  const pagosC = pagos.value.filter(p => p.contrato_ccp_id === c.id)
  return calcDevengadoContrato(c, c.prestamos, c.cobrosP || [], pagosC, props.fechaCierre || today())
}
</script>
