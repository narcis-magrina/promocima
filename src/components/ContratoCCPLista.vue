<template>
  <div>
    <!-- KPIs -->
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Importe Participado En Curso <HelpTip :texto="help.participacion_en_curso" /></div>
        <div class="kpi-value">{{ fmtN(kliEnCurso) }}</div>
        <div class="kpi-sub">{{ kliEnCursoN }} contrato{{ kliEnCursoN !== 1 ? 's' : '' }}</div>
      </div>
      <div class="kpi-card kc-green">
        <div class="kpi-label">Al Día <HelpTip :texto="help.al_dia" /></div>
        <div class="kpi-value">{{ fmtN(kliAlDia) }}</div>
        <div class="kpi-sub">{{ kliAlDiaN }} ({{ kliAlDiaPct }}%)</div>
      </div>
      <div class="kpi-card kc-orange">
        <div class="kpi-label">Con Retraso <HelpTip :texto="help.con_retraso" /></div>
        <div class="kpi-value">{{ fmtN(kliRetraso) }}</div>
        <div class="kpi-sub">{{ kliRetrasoN }} ({{ kliRetrasoPct }}%)</div>
      </div>
      <div class="kpi-card kc-red">
        <div class="kpi-label">Judicializado <HelpTip :texto="help.judicializado" /></div>
        <div class="kpi-value">{{ fmtN(kliJudicial) }}</div>
        <div class="kpi-sub">{{ kliJudicialN }} ({{ kliJudicialPct }}%)</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Importe Cancelados <HelpTip :texto="help.cancelado" /></div>
        <div class="kpi-value">{{ fmtN(kliCancelado) }}</div>
        <div class="kpi-sub">{{ kliCanceladoN }} préstamo{{ kliCanceladoN !== 1 ? 's' : '' }}</div>
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
              <td style="font-size:12px">{{ c.prestamos?.alias || '—' }}</td>
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
import { fmt, fmtInt, fmtN, fmtDate , fmtDec } from '../utils.js'

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
const contratosRef = computed(() => props.contratos)
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
