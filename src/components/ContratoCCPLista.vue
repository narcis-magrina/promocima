<template>
  <div>
    <!-- KPIs: 3 tarjetas -->
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">

      <!-- Capital Participado -->
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Capital Participado <HelpTip :texto="help.participacion_en_curso" /></div>
        <div class="kpi-value">{{ fmtN(kliEnCurso) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">En curso</span>
            <span class="kpi-row-val">{{ fmtN(kliEnCurso) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Activo</span>
            <span class="kpi-row-val">{{ fmtN(kliActivo) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Al día</span>
            <span class="kpi-row-val">{{ fmtN(kliAlDia) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Con retraso</span>
            <span class="kpi-row-val">{{ fmtN(kliRetraso) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Judicializado</span>
            <span class="kpi-row-val">{{ fmtN(kliJudicial) }}</span>
          </div>
        </div>
      </div>

      <!-- Rentabilidad Promocima -->
      <div class="kpi-card kc-green">
        <div class="kpi-label">Rentabilidad Promocima</div>
        <div class="kpi-value">{{ fmtN(kliRentPromoTotal) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span>Gestión anual</span>
            <span class="kpi-row-val">{{ fmtN(kliGestionAnual) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span>Apertura LTM (part.)</span>
            <span class="kpi-row-val">{{ fmtN(kliAperturaLTM) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep" style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.15)">
            <span style="font-size:11px;color:var(--text2)">Rentabilidad añadida</span>
            <span class="kpi-row-val" style="font-size:11px">{{ kliRentCapPromo }}%</span>
          </div>
        </div>
      </div>

      <!-- Rentabilidad Partícipes -->
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Rentabilidad Partícipes</div>
        <div class="kpi-value">{{ fmtN(kliIngrAnuales) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span>Ingresos anuales</span>
            <span class="kpi-row-val">{{ fmtN(kliIngrAnuales) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span>Rentabilidad media</span>
            <span class="kpi-row-val">{{ kliRentMedia }}%</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Header + filtro -->
    <div class="section-header">
      <div>
        <div class="section-title">Contratos CCP</div>
        <div class="section-sub">Contratos de Cuenta en Participación</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="filter-label">Filtros</span>
        <select class="form-control" style="width:140px;padding:5px 10px;font-size:12px" v-model="filtroActivo">
          <option value="activos">Activos</option>
          <option value="todos">Todos</option>
        </select>
        <select class="form-control" :class="{'filter-active': !!filtroParticipe}" style="width:180px;padding:5px 10px;font-size:12px" v-model="filtroParticipe" :style="!!filtroParticipe ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
          <option value="">Todos los partícipes</option>
          <option v-for="p in participes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
        <button v-if="!readOnly" class="btn btn-primary" @click="$emit('nuevo')">+ Nuevo Contrato</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-card">
      <div class="table-header"><h3>Listado ({{ contratosFiltrados.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th @click="setSort('participe_nombre')" :class="thClass('participe_nombre')">Partícipe <span class="sort-icon">{{ thIcon('participe_nombre') }}</span></th>
              <th @click="setSort('prestamo_alias')"   :class="thClass('prestamo_alias')">Préstamo <span class="sort-icon">{{ thIcon('prestamo_alias') }}</span></th>
              <th @click="setSort('fecha_firma')"      :class="thClass('fecha_firma')" class="col-hide-mobile">F. Firma <span class="sort-icon">{{ thIcon('fecha_firma') }}</span></th>
              <th @click="setSort('importe_participacion')" :class="thClass('importe_participacion')" style="text-align:right">Importe <span class="sort-icon">{{ thIcon('importe_participacion') }}</span></th>
              <th @click="setSort('porcentaje_participacion')" :class="thClass('porcentaje_participacion')" style="text-align:center" class="col-hide-mobile">% Part. <span class="sort-icon">{{ thIcon('porcentaje_participacion') }}</span></th>
              <th @click="setSort('porcentaje_gestion')" :class="thClass('porcentaje_gestion')" style="text-align:center" class="col-hide-mobile">% Gest. <span class="sort-icon">{{ thIcon('porcentaje_gestion') }}</span></th>
              <th style="text-align:right" class="col-hide-mobile">Bruto/mes</th>
              <th style="text-align:right">Rent./mes</th>
              <th @click="setSort('activo')" :class="thClass('activo')">Estado <span class="sort-icon">{{ thIcon('activo') }}</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosFiltrados" :key="c.id" style="cursor:pointer"
                @click="$emit('seleccionar', c.id)">
              <td style="font-size:12px;font-weight:500">{{ c.participes?.nombre || '—' }}</td>
              <td style="font-size:12px">
                {{ c.prestamos?.alias || '—' }}
                <span v-if="prestamos.find(p => p.id === c.prestamo_id)?.origen_prestamo_id"
                  title="Contrato sobre préstamo originado por amortización parcial"
                  style="font-size:10px;background:rgba(139,92,246,0.12);color:var(--purple);border:1px solid rgba(139,92,246,0.3);padding:1px 5px;border-radius:4px;margin-left:4px">AP</span>
              </td>
              <td style="font-size:12px" class="col-hide-mobile">{{ fmtDate(c.fecha_firma) }}</td>
              <td class="td-mono td-right">{{ fmtDec(c.importe_participacion) }}</td>
              <td class="td-mono td-center col-hide-mobile">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-center col-hide-mobile">{{ c.porcentaje_gestion }}%</td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--accent)">{{ fmtDec(calcInteresBruto(c)) }}</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ fmtDec(calcInteresNeto(c)) }}</td>
              <td><span class="badge" :class="c.activo ? 'badge-green' : 'badge-gray'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td @click.stop style="display:flex;gap:4px;align-items:center" v-if="!readOnly">
                <button class="btn btn-sm btn-registrar" style="padding:2px 8px;font-size:12px"
                  title="Editar contrato" @click.stop="$emit('editar', c)">✎</button>
                <button class="btn btn-sm btn-danger-solid" style="padding:2px 7px;font-size:13px"
                  title="Eliminar contrato" @click.stop="$emit('eliminar', c)">✕</button>
              </td>
            </tr>
            <tr v-if="!contratosFiltrados.length"><td colspan="9" class="table-empty">Sin contratos</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSort } from '../composables/useSort.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'
import { fmt, fmtInt, fmtN, fmtDate, fmtDec, generateCalendarioTeorico, today, calcCapitalEnCursoPrestamo } from '../utils.js'

// ── Props / emits ──────────────────────────────
const props = defineProps({
  contratos:  { type: Array, required: true },   // ya enriquecidos con participes/prestamos
  participes: { type: Array, required: true },
  prestamos:  { type: Array, required: true },
  readOnly:   { type: Boolean, default: false },
})
const emit = defineEmits(['seleccionar', 'nuevo', 'editar', 'eliminar'])

// ── Filtro + orden ─────────────────────────────
const filtroParticipe = ref('')
const filtroActivo = ref('activos')  // 'activos' | 'todos'
// Aplanar campos calculados para que useSort pueda ordenar por ellos directamente
const contratosRef = computed(() => props.contratos.map(c => ({
  ...c,
  participe_nombre: c.participes?.nombre || '',
  prestamo_alias:   c.prestamos?.alias   || '',
})))
const { sorted: contratosOrdenados, setSort, thIcon, thClass } = useSort(contratosRef, 'id')

const contratosFiltrados = computed(() => {
  let lista = contratosOrdenados.value
  if (filtroActivo.value === 'activos') lista = lista.filter(c => c.activo)
  if (filtroParticipe.value) lista = lista.filter(c => c.participe_id === filtroParticipe.value)
  return lista
})

// ── KPIs ───────────────────────────────────────
const kliEnriquecidos = computed(() =>
  props.contratos.map(c => {
    const pr = props.prestamos.find(p => p.id === c.prestamo_id)
    // estadoPrestamo: usar situacion calculada para activos, estado BD para cancelado/judicializado
    const estadoPrestamo = !pr ? 'activo'
      : pr.estado === 'cancelado'     ? 'cancelado'
      : pr.estado === 'judicializado' ? 'judicializado'
      : pr.situacion || 'al_dia'
    return { ...c, estadoPrestamo }
  })
)
const kliEnCursos     = computed(() => kliEnriquecidos.value.filter(c => c.activo && c.estadoPrestamo !== 'cancelado'))
const kliEnCurso      = computed(() => kliEnCursos.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliActivoArr    = computed(() => kliEnCursos.value.filter(c => c.estadoPrestamo !== 'judicializado'))
const kliActivo       = computed(() => kliActivoArr.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliEnCursoN     = computed(() => kliEnCursos.value.length)
const kliAlDiaArr    = computed(() => kliEnCursos.value.filter(c => c.estadoPrestamo === 'al_dia'))
const kliAlDia       = computed(() => kliAlDiaArr.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliAlDiaN      = computed(() => kliAlDiaArr.value.length)
const kliAlDiaPct    = computed(() => kliEnCurso.value ? (kliAlDia.value  / kliEnCurso.value * 100).toFixed(1) : '0.0')
const kliRetrasoArr  = computed(() => kliEnCursos.value.filter(c => c.estadoPrestamo === 'con_retraso'))
const kliRetraso     = computed(() => kliRetrasoArr.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliRetrasoN    = computed(() => kliRetrasoArr.value.length)
const kliRetrasoPct  = computed(() => kliEnCurso.value ? (kliRetraso.value / kliEnCurso.value * 100).toFixed(1) : '0.0')
const kliJudicialArr = computed(() => kliEnCursos.value.filter(c => c.estadoPrestamo === 'judicializado'))
const kliJudicial    = computed(() => kliJudicialArr.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliJudicialN   = computed(() => kliJudicialArr.value.length)
const kliJudicialPct = computed(() => kliEnCurso.value ? (kliJudicial.value / kliEnCurso.value * 100).toFixed(1) : '0.0')
const kliCancelados  = computed(() => kliEnriquecidos.value.filter(c => c.estadoPrestamo === 'cancelado'))
const kliCancelado   = computed(() => kliCancelados.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kliCanceladoN  = computed(() => new Set(kliCancelados.value.map(c => c.prestamo_id)).size)

// ── KPI: Rentabilidad Partícipes ───────────────────────────────────────────────
const anoActualKli = new Date().getFullYear()
// Solo contratos activos en préstamos no cancelados y no judicializados
const kliActNoJud = computed(() => kliEnCursos.value.filter(c => {
  const pr = props.prestamos.find(p => p.id === c.prestamo_id)
  return pr && pr.estado !== 'judicializado'
}))
const kliCapActivoNoJud = computed(() => kliActNoJud.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))

const kliIngrAnuales = computed(() =>
  Math.round(kliActNoJud.value.reduce((s, c) => {
    const pr = props.prestamos.find(p => p.id === c.prestamo_id)
    if (!pr) return s
    const pctPart = Number(c.porcentaje_participacion || 0) / 100
    const pctGest = Number(c.porcentaje_gestion || 0) / 100
    const tasaNet = Number(pr.interes_ordinario || 0) / 100 - pctGest
    const capPart = Number(pr.importe) * pctPart
    const cal = generateCalendarioTeorico(pr)
    const cuotasAnio = cal.filter(cu => new Date(cu.fecha + 'T00:00:00').getFullYear() === anoActualKli).length
    return s + capPart * tasaNet / 12 * cuotasAnio
  }, 0) * 100) / 100
)
const kliRentMedia = computed(() => {
  if (!kliCapActivoNoJud.value) return '0.00'
  return (kliIngrAnuales.value / kliCapActivoNoJud.value * 100).toFixed(2)
})

// ── KPI: Rentabilidad Promocima ────────────────────────────────────────────────
const kliGestionAnual = computed(() =>
  Math.round(kliActNoJud.value.reduce((s, c) => {
    return s + Number(c.importe_participacion || 0) * Number(c.porcentaje_gestion || 0) / 100
  }, 0) * 100) / 100
)
const kliAperturaLTM = computed(() => {
  const hoy    = today()
  const hace12 = new Date(hoy + 'T00:00:00')
  hace12.setFullYear(hace12.getFullYear() - 1)
  const hace12Str = hace12.toISOString().slice(0, 10)
  return Math.round(props.contratos.filter(c => c.activo).reduce((s, c) => {
    const pr = props.prestamos.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'cancelado') return s
    const fi = pr.fecha_inicio || ''
    if (fi < hace12Str || fi > hoy) return s
    return s + Number(pr.importe || 0) * Number(pr.comision_apertura || 0) / 100 * Number(c.porcentaje_participacion || 0) / 100
  }, 0) * 100) / 100
})
// Total Rentabilidad Promocima = gestión + apertura
const kliRentPromoTotal = computed(() =>
  Math.round((kliGestionAnual.value + kliAperturaLTM.value) * 100) / 100
)
// Capital Promocima en curso = Σ importe préstamos en curso − Σ importe_participacion CCP en curso
// Rentabilidad = (Gestión anual + Apertura LTM partícipes) / Capital Promocima en curso × 100
const kliRentCapPromo = computed(() => {
  // totalEnCurso: misma lógica que capitalEnCurso (subtítulo "En curso") del Dashboard
  const totalEnCurso = props.prestamos
    .filter(p => p.estado !== 'cancelado')
    .reduce((s, p) => s + calcCapitalEnCursoPrestamo(p, p.cobrosP || []), 0)
  // capPart: misma lógica que capitalParticipado del Dashboard
  const capPart = props.contratos.reduce((s, c) => {
    if (!c.activo) return s
    const pr = props.prestamos.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'cancelado' || pr.estado === 'judicializado') return s
    const impTotal = Number(pr.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(pr, pr.cobrosP || []) * fraccion
  }, 0)
  const capPromo = totalEnCurso - capPart
  if (!capPromo) return '0.00'
  return (kliRentPromoTotal.value / capPromo * 100).toFixed(2)
})

// ── Helper ─────────────────────────────────────
function calcInteresBruto(c) {
  const pr = props.prestamos.find(p => p.id === c.prestamo_id)
  if (!pr || !c.activo || pr.estado === 'cancelado') return 0
  return Math.round((Number(c.importe_participacion) * Number(pr.interes_ordinario) / 100 / 12) * (1 - Number(c.porcentaje_gestion) / 100) * 100) / 100
}

function calcInteresNeto(c) {
  const pr = props.prestamos.find(p => p.id === c.prestamo_id)
  if (!pr || !c.activo || pr.estado === 'cancelado') return 0
  const bruto = (Number(c.importe_participacion) * Number(pr.interes_ordinario) / 100 / 12) * (1 - Number(c.porcentaje_gestion) / 100)
  return Math.round(bruto * (1 - 0.19) * 100) / 100
}
</script>
