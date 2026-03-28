<template>
  <div>
    <div v-if="loading" class="table-empty">Cargando...</div>
    <div v-else style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">

      <!-- KPI 1: Capital -->
      <div class="kpi-card kc-green">
        <div class="kpi-label">Capital en curso <HelpTip :texto="help.en_curso" /></div>
        <div class="kpi-value" style="font-size:18px">{{ fmtN(capitalEnCurso) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Capital invertido <HelpTip :texto="help.invertido" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalInvertido) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Activo <HelpTip :texto="help.activo" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalActivoNoJudicial) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Judicializado <HelpTip :texto="help.judicializado" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalJudicializado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">% judicializado</span>
            <span class="kpi-row-val">{{ pctJudicializado }}%</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Participado activo <HelpTip :texto="help.capital_participado" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalParticipado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Part. judicializado</span>
            <span class="kpi-row-val">{{ fmtN(capitalParticJudicializado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">% jud. partícipes</span>
            <span class="kpi-row-val">{{ pctJudicPartícipes }}%</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Rentabilidad -->
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Rentabilidad</div>
        <div class="kpi-value" style="font-size:18px">{{ fmtN(ingrAnualesActivas) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. anuales op. activas</span>
            <span class="kpi-row-val">{{ fmtN(ingrAnualesActivas) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. anuales part. activas</span>
            <span class="kpi-row-val">{{ fmtN(ingrAnualesParticipes) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. gestión anual</span>
            <span class="kpi-row-val">{{ fmtN(ingrGestionAnual) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. apertura LTM</span>
            <span class="kpi-row-val">{{ fmtN(ingrAperturaLTM) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Rent. activas</span>
            <span class="kpi-row-val">{{ rentActivas }}%</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Rent. partícipes</span>
            <span class="kpi-row-val">{{ rentParticipes }}%</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Rent. total Promocima</span>
            <span class="kpi-row-val">{{ rentTotalPromocima }}%</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: LTV -->
      <div class="kpi-card kc-orange">
        <div class="kpi-label">LTV</div>
        <div class="kpi-value" style="font-size:18px">{{ ltvEnCurso }}%</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Total garantías en curso</span>
            <span class="kpi-row-val">{{ fmtN(garantiasEnCurso) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">LTV op. en curso <HelpTip :texto="help.ltv_en_curso" pos="right" /></span>
            <span class="kpi-row-val">{{ ltvEnCurso }}%</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Total garantías partícipes</span>
            <span class="kpi-row-val">{{ fmtN(garantiasParticipes) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">LTV op. partícipes <HelpTip :texto="help.ltv_participes" pos="right" /></span>
            <span class="kpi-row-val">{{ ltvParticipes }}%</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fmtN, calcInteresOrdinario, generateCalendarioTeorico, today, distribuirCobros } from '../utils.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'

const loading      = ref(true)
const prestamosRaw = ref([])
const todosCobros  = ref([])
const ccpRaw       = ref([])

onMounted(async () => {
  const [{ data: p }, { data: c }, { data: ccp }] = await Promise.all([
    supabase.from('prestamos').select('*'),
    (async () => {
      const PAGE = 1000
      let all = [], from = 0
      while (true) {
        const { data } = await supabase.from('cobros')
          .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal')
          .order('id').range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return { data: all }
    })(),
    supabase.from('contratos_ccp').select('prestamo_id, participe_id, importe_participacion, porcentaje_gestion, activo, participes(nombre)'),
  ])
  prestamosRaw.value = p  || []
  todosCobros.value  = c  || []
  ccpRaw.value       = (ccp || []).filter(c => c.activo)
  loading.value = false
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcCapitalEnCursoPrestamo(p) {
  if (p.tipo_prestamo === 'Americano') return Number(p.importe)
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, cobrosP)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - amortCuotas) * 100) / 100)
}

function tieneRetraso(p) {
  if (p.estado === 'judicializado' || p.estado === 'cancelado') return false
  const hoy     = today()
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal     = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, cobrosP)
  return calConEstado.some(c => c.fecha <= hoy && c.estado !== 'cobrada')
}

// ── Computed base ────────────────────────────────────────────────────────���────
const prestamosEnCurso = computed(() => prestamosRaw.value.filter(p => p.estado !== 'cancelado'))

const capitalInvertido = computed(() => prestamosEnCurso.value.reduce((s, p) => s + Number(p.importe), 0))

const capitalEnCurso = computed(() =>
  prestamosEnCurso.value.reduce((s, p) => s + calcCapitalEnCursoPrestamo(p), 0)
)

const capitalJudicializado = computed(() =>
  prestamosEnCurso.value
    .filter(p => p.estado === 'judicializado')
    .reduce((s, p) => s + calcCapitalEnCursoPrestamo(p), 0)
)

const capitalActivoNoJudicial = computed(() => capitalEnCurso.value - capitalJudicializado.value)

const pctJudicializado = computed(() =>
  capitalInvertido.value ? (capitalJudicializado.value / capitalInvertido.value * 100).toFixed(1) : '0.0'
)

const capitalParticipado = computed(() =>
  ccpRaw.value.reduce((s, c) => {
    const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
    if (!p || p.estado === 'cancelado' || p.estado === 'judicializado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(p) * fraccion
  }, 0)
)

const capitalParticJudicializado = computed(() =>
  ccpRaw.value.reduce((s, c) => {
    const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
    if (!p || p.estado !== 'judicializado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(p) * fraccion
  }, 0)
)

const pctJudicPartícipes = computed(() => {
  const total = capitalParticipado.value + capitalParticJudicializado.value
  return total ? (capitalParticJudicializado.value / total * 100).toFixed(1) : '0.0'
})

// ── KPI 2: Rentabilidad ───────────────────────────────────────────────────────
const anoActual = computed(() => Number(today().slice(0, 4)))

const pagosParticipesMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosEnCurso.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    const tasa = Number(prestamo.interes_ordinario) / 100 / 12
    return s + Number(ccp.importe_participacion) * tasa
  }, 0)
)

const ingresosGestionMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosEnCurso.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    return s + Number(ccp.importe_participacion) * (Number(ccp.porcentaje_gestion || 0) / 100) / 12
  }, 0)
)

const ingrAnualesActivas = computed(() => {
  const activos = prestamosEnCurso.value.filter(p => p.estado !== 'judicializado')
  return activos.reduce((s, p) => {
    if (p.tipo_prestamo === 'Americano') {
      return s + Number(p.importe) * (Number(p.interes_ordinario) / 100)
    }
    const cal = generateCalendarioTeorico(p)
    const interesesAnio = cal
      .filter(c => new Date(c.fecha + 'T00:00:00').getFullYear() === anoActual.value)
      .reduce((acc, c) => acc + (c.interes || 0), 0)
    return s + interesesAnio
  }, 0)
})

const ingrAnualesParticipes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'judicializado' || p.estado === 'cancelado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    let interesAnual = 0
    if (p.tipo_prestamo === 'Americano') {
      interesAnual = impTotal * (Number(p.interes_ordinario) / 100)
    } else {
      const cal = generateCalendarioTeorico(p)
      interesAnual = cal
        .filter(c => new Date(c.fecha + 'T00:00:00').getFullYear() === anoActual.value)
        .reduce((acc, c) => acc + (c.interes || 0), 0)
    }
    return s + interesAnual * fraccion
  }, 0)
)

const ingrGestionAnual = computed(() => ingresosGestionMes.value * 12)

const ingrAperturaLTM = computed(() => {
  const hoy = today()
  const hace12m = new Date(hoy)
  hace12m.setFullYear(hace12m.getFullYear() - 1)
  const limite = hace12m.toISOString().split('T')[0]
  return prestamosRaw.value
    .filter(p => p.fecha_inicio && p.fecha_inicio >= limite && p.fecha_inicio <= hoy)
    .reduce((s, p) => s + Number(p.importe) * Number(p.comision_apertura || 0) / 100, 0)
})

const rentActivas = computed(() =>
  capitalActivoNoJudicial.value ? (ingrAnualesActivas.value / capitalActivoNoJudicial.value * 100).toFixed(2) : '0.00'
)

const capitalParticipActivos = computed(() =>
  ccpRaw.value
    .filter(c => {
      const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
      return p && p.estado !== 'cancelado' && p.estado !== 'judicializado'
    })
    .reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)

const rentParticipes = computed(() =>
  capitalParticipActivos.value ? (ingrAnualesParticipes.value / capitalParticipActivos.value * 100).toFixed(2) : '0.00'
)

const rentTotalPromocima = computed(() => {
  const capitalPropio = capitalActivoNoJudicial.value - capitalParticipActivos.value
  if (!capitalPropio) return '0.00'
  const ingrNetos = ingrAnualesActivas.value - ingrAnualesParticipes.value + ingrGestionAnual.value + ingrAperturaLTM.value
  return (ingrNetos / capitalPropio * 100).toFixed(2)
})

// ── KPI 3: LTV ────────────────────────────────────────────────────────────────
const garantiasEnCurso = computed(() =>
  prestamosEnCurso.value
    .filter(p => Number(p.garantia_tasacion || 0) > 0)
    .reduce((s, p) => s + Number(p.garantia_tasacion), 0)
)

const ltvEnCurso = computed(() =>
  garantiasEnCurso.value ? (capitalEnCurso.value / garantiasEnCurso.value * 100).toFixed(1) : '0.0'
)

const garantiasParticipes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'cancelado' || !Number(p.garantia_tasacion || 0)) return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    return s + Number(p.garantia_tasacion) * fraccion
  }, 0)
)

const capitalVivoParticipado = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'cancelado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(p) * fraccion
  }, 0)
)

const ltvParticipes = computed(() =>
  garantiasParticipes.value ? (capitalVivoParticipado.value / garantiasParticipes.value * 100).toFixed(1) : '0.0'
)
</script>
