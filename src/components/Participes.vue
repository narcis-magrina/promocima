<template>
  <div>
    <!-- DETALLE -->
    <template v-if="viewId && participe">
      <div v-if="!esPortalParticipe" class="back-btn" @click="$emit('navigate','participes')">← Volver a Partícipes</div>
      <div class="section-header">
        <div>
          <div class="section-title">{{ participe.nombre }}</div>
          <div class="section-sub">{{ participe.id }} · NIF: {{ participe.nif }}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button v-if="!readOnly || soloEditarContacto" class="btn btn-sm btn-registrar" @click="editar(participe)">✎ Editar</button>
          <button v-if="!readOnly" class="btn btn-sm btn-danger" @click="eliminarParticipe(participe.id)">✕ Eliminar</button>
          <button v-if="!readOnly" class="btn btn-sm btn-primary" @click="$emit('navigate','contratos-ccp')">Ver Contratos CCP →</button>
        </div>
      </div>

      <!-- KPIs del partícipe -->
      <div v-if="kpiPartLoading" style="color:var(--text3);font-size:12px;margin-bottom:16px">Calculando KPIs…</div>
      <template v-else>
        <!-- Fila 1: Estado préstamos -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:14px">
          <div class="kpi-card kc-purple">
            <div class="kpi-label">Capital En Curso <HelpTip :texto="help.capital_en_curso" pos="right" /></div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--purple)">{{ fmtN(kpartEnCurso) }}</div>
            <div class="kpi-sub">{{ kpartEnCursoN }} préstamo{{ kpartEnCursoN!==1?'s':''}} en curso</div>
          </div>
          <div class="kpi-card kc-green">
            <div class="kpi-label">Al Día <HelpTip :texto="help.al_dia" pos="right" /></div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--green)">{{ fmtN(kpartAlDia) }}</div>
            <div class="kpi-sub">{{ kpartAlDiaN }} préstamo{{ kpartAlDiaN!==1?'s':''  }}</div>
          </div>
          <div class="kpi-card kc-orange">
            <div class="kpi-label">Con Retraso <HelpTip :texto="help.con_retraso" pos="right" /></div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--orange)">{{ fmtN(kpartRetraso) }}</div>
            <div class="kpi-sub">{{ kpartRetrasoN }} préstamo{{ kpartRetrasoN!==1?'s':''  }}</div>
          </div>
          <div class="kpi-card kc-red">
            <div class="kpi-label">Judicializados <HelpTip :texto="help.judicializado" pos="right" /></div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--red)">{{ fmtN(kpartJudicial) }}</div>
            <div class="kpi-sub">{{ kpartJudicialN }} préstamo{{ kpartJudicialN!==1?'s':''  }}</div>
          </div>
          <div class="kpi-card kc-gray-dim">
            <div class="kpi-label">Cancelados <HelpTip :texto="help.cancelado" pos="right" /></div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--text3)">{{ fmtN(kpartCancelado) }}</div>
            <div class="kpi-sub">{{ kpartCanceladoN }} préstamo{{ kpartCanceladoN!==1?'s':''  }}</div>
          </div>
        </div>

        <!-- Fila 2: Parámetros + Rendimiento + Devengado -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:14px;margin-bottom:20px">
          <!-- Parámetros -->
          <div class="kpi-card kc-blue">
            <div class="kpi-label">Parámetros</div>
            <div style="font-size:12px;margin-top:4px;display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text3)">% Gestión</span>
                <span style="font-family:var(--mono);color:var(--blue)">{{ kpartPctGestion }}%</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text3)">IRPF</span>
                <span style="font-family:var(--mono);color:var(--red)">{{ kpartIrpf }}%</span>
              </div>
            </div>
          </div>
          <!-- Rentabilidad/mes -->
          <div class="kpi-card kc-yellow" style="grid-column:span 2">
            <div class="kpi-label">Rentabilidad Partícipe / mes</div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ fmtDec(kpartBrutoMes) }}</div>
            <div class="kpi-sub" style="margin-top:4px">Restados los gastos de gestión</div>
            <div class="kpi-sub">Antes de impuestos</div>
          </div>
          <!-- Rentabilidad anual prevista -->
          <div class="kpi-card kc-green" style="grid-column:span 2">
            <div class="kpi-label">Rentabilidad anual prevista</div>
            <div style="font-family:var(--mono);font-size:26px;font-weight:700;color:var(--green)">{{ kpartRentPct }}%</div>
            <div class="kpi-sub">Antes de impuestos</div>
          </div>
          <!-- Bruto Devengado (inline, solo si hay) -->
          <div class="kpi-card kc-yellow" style="grid-column:span 2" v-if="kpartBrutoDevengado > 0">
            <div class="kpi-label">Bruto Devengado</div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent)">{{ fmtDec(kpartBrutoDevengado) }}</div>
            <div class="kpi-sub">{{ kpartDevengados.length }} pago{{ kpartDevengados.length !== 1 ? 's' : '' }} pendiente{{ kpartDevengados.length !== 1 ? 's' : '' }}</div>
          </div>
        </div>

      </template>

      <!-- Datos del partícipe -->
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Tipo</div><div class="detail-value">{{ participe.tipo }}</div></div>
        <div class="detail-item"><div class="detail-label">Teléfono</div><div class="detail-value">{{ participe.telefono || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">{{ participe.email || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Centro de Coste</div><div class="detail-value mono">{{ participe.centro_coste || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Fecha Alta</div><div class="detail-value">{{ fmtDate(participe.fecha_alta) }}</div></div>
        <div class="detail-item"><div class="detail-label">Estado</div>
          <div><span class="badge" :class="participe.activo ? 'badge-green' : 'badge-gray'">{{ participe.activo ? 'Activo' : 'Inactivo' }}</span></div>
        </div>
        <div class="detail-item" v-if="participe.direccion" style="grid-column:span 3">
          <div class="detail-label">Dirección</div><div class="detail-value">{{ participe.direccion }}</div>
        </div>
      </div>
      <div class="table-card">
        <div class="table-header"><h3>{{ readOnly ? 'Participaciones' : 'Contratos CCP Asociados' }} <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
        <table>
          <thead><tr><th class="col-hide-mobile">ID</th><th>Préstamo</th><th class="col-hide-mobile">Fecha Firma</th><th style="text-align:right">Importe</th><th class="col-hide-mobile">% Particip.</th><th class="col-hide-mobile">% Gestión</th><th class="col-hide-mobile">Estado préstamo</th><th style="text-align:right">Rent./mes</th><th>Estado CCP</th></tr></thead>
          <tbody>
            <tr v-for="c in contratosParticipe" :key="c.id" style="cursor:pointer" @click="$emit('navigate','contratos-ccp',c.id)">
              <td class="td-mono col-hide-mobile" style="color:var(--text3)">{{ c.id }}</td>
              <td>{{ c.prestamos?.alias || '—' }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ fmtDate(c.fecha_firma) }}</td>
              <td class="td-mono td-right">{{ fmtDec(c.importe_participacion) }}</td>
              <td class="td-mono td-center col-hide-mobile">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-center col-hide-mobile">{{ c.porcentaje_gestion }}%</td>
              <td class="col-hide-mobile">
                <span v-if="c.prestamos?.estado === 'cancelado'" class="badge badge-gray">Cancelado</span>
                <span v-else-if="c.prestamos?.estado === 'judicializado'" class="badge badge-red">Judicializado</span>
                <span v-else-if="c.prestamos?.situacion === 'con_retraso'" class="badge badge-orange">Con retraso</span>
                <span v-else class="badge badge-green">Al día</span>
              </td>
              <td class="td-mono td-right" style="color:var(--orange)">
                {{ c.activo && c.prestamos?.estado !== 'cancelado' ? fmtDec(c.importe_participacion * c.prestamos?.interes_ordinario / 100 / 12) : '—' }}
              </td>
              <td>
                <span class="badge" :class="c.activo ? 'badge-green' : 'badge-gray'">
                  {{ c.activo ? 'Activo' : 'Cancelado' }}
                </span>
              </td>
            </tr>
            <tr v-if="!contratosParticipe.length"><td colspan="8" class="table-empty">Sin contratos</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- LISTA -->
    <template v-else>
      <!-- KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="kpi-card kc-purple">
          <div class="kpi-label">Importe Participación En Curso <HelpTip :texto="help.participacion_en_curso" /></div>
          <div class="kpi-value" style="color:var(--purple)">{{ fmtN(kpiImporteParticipado) }}</div>
        </div>
        <div class="kpi-card kc-green">
          <div class="kpi-label">Préstamos En Curso <HelpTip :texto="help.prestamos_en_curso" /></div>
          <div class="kpi-value">{{ kpiNPrestamosActivos }}</div>
          <div class="kpi-sub">
            Al día: {{ kpiAlDia }} · Retraso: {{ kpiConRetraso }} · Judicial: {{ kpiJudicializados }}
          </div>
        </div>
        <div class="kpi-card kc-blue">
          <div class="kpi-label">Nº Partícipes</div>
          <div class="kpi-value">{{ items.length }}</div>
          <div class="kpi-sub">{{ kpiNEmpresas }} empresa{{ kpiNEmpresas !== 1 ? 's' : '' }} · {{ kpiNPersonas }} persona{{ kpiNPersonas !== 1 ? 's' : '' }}</div>
        </div>
        <div class="kpi-card kc-gray-dim">
          <div class="kpi-label">Participación Cancelada</div>
          <div class="kpi-value" style="color:var(--text3)">{{ fmtN(kpiImporteCanceladoParticipado) }}</div>
          <div class="kpi-sub">{{ kpiNCancelados }} préstamo{{ kpiNCancelados !== 1 ? 's' : '' }} cancelados</div>
        </div>
      </div>
      <div class="section-header">
        <div>
          <div class="section-title">Partícipes</div>
          <div class="section-sub">{{ items.length }} registrados</div>
        </div>
        <button v-if="!readOnly" class="btn btn-primary" @click="abrirModal()">+ Nuevo Partícipe</button>
      </div>
      <div class="table-card">
        <div class="table-header">
          <h3>Listado <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="form-control" style="width:130px;padding:5px 10px;font-size:12px" v-model="filtroActivoP">
              <option value="activos">Activos</option>
              <option value="todos">Todos</option>
            </select>
            <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Buscar..." v-model="busqueda" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
          </div>
        </div>
        <table>
          <thead><tr>
              <th @click="setSort('centro_coste')" :class="thClass('centro_coste')" style="text-align:center" class="col-hide-mobile">CC <span class="sort-icon">{{ thIcon('centro_coste') }}</span></th>
              <th @click="setSort('nombre')" :class="thClass('nombre')">Nombre <span class="sort-icon">{{ thIcon('nombre') }}</span></th>
              <th @click="setSort('tipo')" :class="thClass('tipo')" class="col-hide-mobile">Tipo <span class="sort-icon">{{ thIcon('tipo') }}</span></th>
              <th class="col-hide-mobile">NIF</th><th class="col-hide-mobile">Email</th>
              <th @click="setSort('nContratos')" :class="thClass('nContratos')" style="text-align:center">Contratos <span class="sort-icon">{{ thIcon('nContratos') }}</span></th>
              <th @click="setSort('capitalParticipado')" :class="thClass('capitalParticipado')" style="text-align:right" class="col-hide-mobile">Capital<br>participado <span class="sort-icon">{{ thIcon('capitalParticipado') }}</span></th>
              <th @click="setSort('capitalParticipActivo')" :class="thClass('capitalParticipActivo')" style="text-align:right">Capital<br>activo <span class="sort-icon">{{ thIcon('capitalParticipActivo') }}</span></th>
              <th @click="setSort('capitalCancelado')" :class="thClass('capitalCancelado')" style="text-align:right" class="col-hide-mobile">Cancelado <span class="sort-icon">{{ thIcon('capitalCancelado') }}</span></th>
              <th @click="setSort('devengadoMes')" :class="thClass('devengadoMes')" style="text-align:right" class="col-hide-mobile">Rent./mes <span class="sort-icon">{{ thIcon('devengadoMes') }}</span></th>
              <th @click="setSort('activo')" :class="thClass('activo')" class="col-hide-mobile">Estado <span class="sort-icon">{{ thIcon('activo') }}</span></th>
              <th style="width:40px"></th>
            </tr></thead>
          <tbody>
            <tr v-for="p in participesFiltrados" :key="p.id" style="cursor:pointer" @click="$emit('navigate','participes',p.id)">
              <td class="td-mono td-center col-hide-mobile" style="color:var(--text3)">{{ p.centro_coste || '—' }}</td>
              <td style="font-weight:500">{{ p.nombre }}</td>
              <td class="col-hide-mobile"><span class="badge" :class="p.tipo === 'empresa' ? 'badge-green' : 'badge-blue'">{{ p.tipo }}</span></td>
              <td class="td-mono col-hide-mobile" style="font-size:12px">{{ p.nif }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ p.email || '—' }}</td>
              <td class="td-center"><span class="badge badge-gray">{{ p.nContratos || 0 }}</span></td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--violet)">{{ p.capitalParticipado ? fmtN(p.capitalParticipado) : '—' }}</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ p.capitalParticipActivo ? fmtN(p.capitalParticipActivo) : '—' }}</td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--text3)">{{ p.capitalCancelado ? fmtN(p.capitalCancelado) : '—' }}</td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--orange)">{{ p.devengadoMes ? fmtDec(p.devengadoMes) : '—' }}</td>
              <td><span class="badge" :class="p.activo ? 'badge-green' : 'badge-gray'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td @click.stop>
                <button
                  class="btn btn-sm btn-danger-solid"
                  :disabled="contratos.some(cc => cc.participe_id === p.id)"
                  :title="contratos.some(cc => cc.participe_id === p.id) ? 'No se puede eliminar: tiene contratos CCP' : 'Eliminar partícipe'"
                  @click.stop="eliminarParticipeLista(p.id)"
                >✕</button>
              </td>
            </tr>
            <tr v-if="!participesFiltrados.length"><td colspan="8" class="table-empty">Sin resultados</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- MODAL -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ form.id ? 'Editar' : 'Nuevo' }} Partícipe</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrarModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Centro de Coste <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="form.centro_coste">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" :class="{'filter-active': !!form.tipo}" v-model="form.tipo" :style="!!form.tipo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option value="persona">Persona Física</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>
            <div class="form-group span-2">
              <label class="form-label">Nombre completo / Razón social <span class="req">*</span></label>
              <input class="form-control" v-model="form.nombre" :disabled="soloEditarContacto" :style="soloEditarContacto?'opacity:0.6;cursor:not-allowed':''">
            </div>
            <div class="form-group"><label class="form-label">NIF / CIF</label><input class="form-control" v-model="form.nif" :disabled="soloEditarContacto" :style="soloEditarContacto?'opacity:0.6;cursor:not-allowed':''"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" v-model="form.telefono"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-control" v-model="form.email"></div>
            <div class="form-group"><label class="form-label">Fecha Alta</label><input class="form-control" type="date" v-model="form.fecha_alta"></div>
            <div class="form-group span-2"><label class="form-label">Dirección</label><input class="form-control" v-model="form.direccion"></div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <div style="padding-top:6px">
                <label class="ts-wrap" @click="form.activo = !form.activo">
                  <div class="ts-track" :class="{ on: form.activo }"><div class="ts-thumb"></div></div>
                  <span class="ts-label">{{ form.activo ? 'Activado' : 'Desactivado' }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" @click="guardarParticipe">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, onMounted, watch } from 'vue'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { useSort } from '../composables/useSort.js'
import { useCrud } from '../composables/useCrud.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'
import { fmt, fmtInt, fmtN, fmtDate, today , generateCalendarioTeorico, distribuirCobros, calcSituacionPrestamo , fmtDec } from '../utils.js'
import { supabase } from '../supabase.js'

const props = defineProps({
  viewId: String,
  readOnly: { type: Boolean, default: false },       // oculta botones de acción
  soloEditarContacto: { type: Boolean, default: false }, // modal solo edita tel/email/dir
  vistaContratos: { type: Boolean, default: false },  // muestra solo la tabla de contratos
  esPortalParticipe: { type: Boolean, default: false }, // oculta navegación interna (back-btn)
})
const emit = defineEmits(['navigate'])

const busqueda = usePersistedRef('participes.busqueda', '')

// ── KPIs lista ────────────────────────────────
const kpiPrestamos      = ref([])
const kpiContratos      = ref([])

onMounted(async () => {
  const [{ data: pr }, { data: cc }, { data: cb }] = await Promise.all([
    supabase.from('prestamos').select('id, importe, estado, interes_ordinario, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad'),
    supabase.from('contratos_ccp').select('prestamo_id, participe_id, activo, importe_participacion'),
    supabase.from('cobros').select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo').range(0, 9999),
  ])
  kpiContratos.value  = cc || []
  // Enriquecer préstamos con situación calculada
  kpiPrestamos.value  = (pr || []).map(p => {
    const cobrosP = (cb || []).filter(c => c.prestamo_id === p.id)
    return { ...p, situacion: calcSituacionPrestamo(p, cobrosP) }
  })
})

// Préstamos que tienen al menos un CCP activo
const prestamosConCCP = computed(() => {
  const ids = new Set(kpiContratos.value.filter(c => c.activo).map(c => c.prestamo_id))
  return kpiPrestamos.value.filter(p => ids.has(p.id))
})
const prestamosActivosConCCP    = computed(() => prestamosConCCP.value.filter(p => p.estado !== 'cancelado'))
const prestamosActivosIds       = computed(() => new Set(kpiPrestamos.value.filter(p => p.estado !== 'cancelado').map(p => p.id)))
const ccpActivos                = computed(() => kpiContratos.value.filter(c => c.activo && prestamosActivosIds.value.has(c.prestamo_id)))
const kpiImporteParticipado     = computed(() => ccpActivos.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiNPrestamosActivos      = computed(() => prestamosActivosConCCP.value.length)
// estados simplificados (sin cálculo de retraso real para KPI — usamos campo estado BD)
const kpiAlDia          = computed(() => prestamosActivosConCCP.value.filter(p => p.situacion === 'al_dia').length)
const kpiConRetraso     = computed(() => prestamosActivosConCCP.value.filter(p => p.situacion === 'con_retraso').length)
const kpiJudicializados = computed(() => prestamosActivosConCCP.value.filter(p => p.estado === 'judicializado').length)
const kpiImporteCancelados          = computed(() => kpiPrestamos.value.filter(p => p.estado === 'cancelado').reduce((s, p) => s + Number(p.importe), 0))
const kpiNCancelados                = computed(() => kpiPrestamos.value.filter(p => p.estado === 'cancelado').length)
const kpiImporteCanceladoParticipado = computed(() =>
  kpiContratos.value.filter(c => canceladosIds.value.has(c.prestamo_id))
    .reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)
const kpiNEmpresas      = computed(() => items.value.filter(p => p.tipo === 'empresa').length)
const kpiNPersonas      = computed(() => items.value.filter(p => p.tipo === 'persona').length)

// Capital participado por partícipe (usando kpiContratos, igual que Dashboard)
const capitalPorParticipe = computed(() => {
  const map = {}
  for (const c of ccpActivos.value) {
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += Number(c.importe_participacion || 0)
  }
  return map
})

// Devengado mensual por partícipe: usa contratos del useCrud (tienen prestamos.interes_ordinario)
const devengadoPorParticipe = computed(() => {
  const map = {}
  for (const c of contratos.value) {
    if (!c.activo || c.prestamos?.estado === 'cancelado') continue
    const imp     = Number(c.importe_participacion || 0)
    const interes = Number(c.prestamos?.interes_ordinario || 0)
    const val     = imp * interes / 100 / 12
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += val
  }
  return map
})

// Capital cancelado por partícipe: contratos activos en préstamos cancelados
const canceladosIds = computed(() => new Set(kpiPrestamos.value.filter(p => p.estado === 'cancelado').map(p => p.id)))
const capitalCanceladoPorParticipe = computed(() => {
  const map = {}
  for (const c of kpiContratos.value.filter(c => canceladosIds.value.has(c.prestamo_id))) {
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += Number(c.importe_participacion || 0)
  }
  return map
})

const {
  items, secundarios: contratos,
  modalAbierto, form,
  abrirModal, editar, cerrarModal, guardar, eliminar,
  inicializar, cargarDatos,
} = useCrud(
  'participes',
  () => ({ id: null, nombre: '', tipo: 'persona', nif: '', telefono: '', email: '', centro_coste: '', direccion: '', fecha_alta: '', activo: true }),
  {
    ordenPor:   'nombre',
    prefixId:   'PT',
    secundaria: { tabla: 'contratos_ccp', select: '*, prestamos(id, alias, importe, estado, tipo_prestamo, fecha_inicio, duracion_meses, dia_cobro, periodicidad, interes_ordinario)', orden: 'id' },
    enriquecerItems: (parts, conts) => {
      // Igual que Dashboard: contratos activos cruzados con prestamos no cancelados por ID
      const ccpActivos = conts.filter(c => c.activo)
      const prestamosActivosIds = new Set(
        conts.map(c => c.prestamos).filter(p => p && p.estado !== 'cancelado').map(p => p.id)
      )
      return parts.map(x => {
        const misContratos = ccpActivos.filter(c =>
          c.participe_id === x.id && prestamosActivosIds.has(c.prestamo_id)
        )
        const capitalParticipado    = misContratos.reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
        const capitalParticipActivo = capitalParticipado
        return { ...x, nContratos: conts.filter(c => c.participe_id === x.id).length, capitalParticipado, capitalParticipActivo }
      })
    },
    validar: f => (!(f.nombre || '').trim() || f.centro_coste === '' || f.centro_coste === null || f.centro_coste === undefined) ? 'Nombre y Centro de Coste son obligatorios' : null,
    prepararData: f => {
      const data = { ...f }
      delete data.id
      delete data.nContratos
      delete data.capitalParticipado
      delete data.capitalParticipActivo
      delete data.capitalCancelado
      delete data.devengadoMes
      // Si no se ha rellenado la fecha alta, usar la fecha del sistema
      if (!data.fecha_alta) data.fecha_alta = today()
      return data
    },
  }
)

inicializar(toRef(props, 'viewId'))

const { sorted: participesSorted, setSort, thIcon, thClass } = useSort(items, 'centro_coste')
const participe          = computed(() => items.value.find(p => p.id === props.viewId) || null)
const contratosParticipe = computed(() => contratos.value.filter(c => c.participe_id === props.viewId))
const filtroActivoP = ref('activos')
const participesFiltrados = computed(() => {
  const q   = busqueda.value.toLowerCase()
  const cap = capitalPorParticipe.value
  return participesSorted.value
    .filter(p => filtroActivoP.value === 'activos' ? p.activo : true)
    .filter(p => p.nombre.toLowerCase().includes(q) || (p.nif || '').toLowerCase().includes(q))
    .map(p => ({
      ...p,
      capitalParticipado:    cap[p.id] || 0,
      capitalParticipActivo: cap[p.id] || 0,
      capitalCancelado:      capitalCanceladoPorParticipe.value[p.id] || 0,
      devengadoMes:          Math.round((devengadoPorParticipe.value[p.id] || 0) * 100) / 100,
    }))
})
async function eliminarParticipeLista(id) {
  if (contratos.value.some(cc => cc.participe_id === id))
    return alert('No se puede eliminar: tiene contratos CCP vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este partícipe?' })
  if (ok && props.viewId === id) emit('navigate', 'participes')
}

async function eliminarParticipe(id) {
  if (contratos.value.some(cc => cc.participe_id === id))
    return alert('No se puede eliminar: tiene contratos CCP vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este partícipe?' })
  if (ok) emit('navigate', 'participes')
}

// ── KPIs detalle partícipe ────────────────────
const kpiPartLoading   = ref(false)
const kpiPartContratos = ref([])   // contratos CCP del partícipe con prestamo info
const kpiPartPagos     = ref([])   // pagos_reales_participe
const kpiPartIrpf      = ref(19)

watch(() => props.viewId, v => { if (v) cargarKPIsPart(v) }, { immediate: true })

async function cargarKPIsPart(pid) {
  if (!pid) return
  kpiPartLoading.value = true
  try {
    const [{ data: cc }, { data: cfg }] = await Promise.all([
      supabase.from('contratos_ccp')
        .select('*, prestamos(id, alias, estado, importe, interes_ordinario, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad)')
        .eq('participe_id', pid),
      supabase.from('config').select('porcentaje_irpf').eq('id', 1).single(),
    ])
    // Cargar cobros de los préstamos vinculados para calcular situación real
    const prestamoIds = [...new Set((cc || []).map(c => c.prestamo_id))]
    let cobrosKPIPart = []
    if (prestamoIds.length) {
      const { data: cbp } = await supabase
        .from('cobros')
        .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo')
        .in('prestamo_id', prestamoIds)
      cobrosKPIPart = cbp || []
    }
    // Enriquecer cada contrato con la situacion calculada del préstamo
    kpiPartContratos.value = (cc || []).map(c => {
      const pr = c.prestamos
      if (!pr) return c
      const cobrosP = cobrosKPIPart.filter(cb => cb.prestamo_id === pr.id)
      return { ...c, prestamos: { ...pr, situacion: calcSituacionPrestamo(pr, cobrosP) } }
    })
    kpiPartIrpf.value = cfg?.porcentaje_irpf ?? 19
    // Load pagos for those contracts
    const ids = (cc || []).map(c => c.id)
    if (ids.length) {
      const { data: pg } = await supabase
        .from('pagos_reales_participe').select('*')
        .in('contrato_ccp_id', ids)
      kpiPartPagos.value = pg || []
    } else {
      kpiPartPagos.value = []
    }
  } finally {
    kpiPartLoading.value = false
  }
}

// Enriquecer contratos con estado del préstamo
const kpiPartEnr = computed(() =>
  kpiPartContratos.value.map(c => {
    const pr = c.prestamos  // ya enriquecido con situacion en cargarKPIsPart
    const estadoPrestamo = !pr ? 'al_dia'
      : pr.estado === 'cancelado'     ? 'cancelado'
      : pr.estado === 'judicializado' ? 'judicializado'
      : pr.situacion || 'al_dia'
    return { ...c, estadoPrestamo }
  })
)

// Por estado de préstamo — suma importe_participacion como proxy del principal
const kpiPartActivos    = computed(() => kpiPartEnr.value.filter(c => c.activo && c.estadoPrestamo !== 'cancelado'))
const kpartEnCurso       = computed(() => kpiPartActivos.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
const kpartEnCursoN      = computed(() => kpiPartActivos.value.length)
const kpartAlDiaN       = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'al_dia').length)
const kpartAlDia        = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'al_dia').reduce((s,c)=>s+Number(c.importe_participacion),0))
const kpartRetrasoN     = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'con_retraso').length)
const kpartRetraso      = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'con_retraso').reduce((s,c)=>s+Number(c.importe_participacion),0))
const kpartJudicialN    = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'judicializado').length)
const kpartJudicial     = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'judicializado').reduce((s,c)=>s+Number(c.importe_participacion),0))
const kpartCanceladoN   = computed(() => kpiPartEnr.value.filter(c => c.estadoPrestamo === 'cancelado').length)
const kpartCancelado    = computed(() => kpiPartEnr.value.filter(c => c.estadoPrestamo === 'cancelado').reduce((s,c)=>s+Number(c.importe_participacion),0))

// Parámetros
const kpartIrpf = computed(() => kpiPartIrpf.value)
const kpartPctGestion = computed(() => {
  const activos = kpiPartActivos.value
  if (!activos.length) return 0
  return Math.round(activos.reduce((s,c) => s + Number(c.porcentaje_gestion), 0) / activos.length * 100) / 100
})

// Rentabilidad/mes: interés participación - gestión mensual
// interes = importe_participacion * interes_ordinario% / 12
// gestion = importe_participacion * porcentaje_gestion% / 12
// bruto   = interes - gestion
const kpartBrutoMes = computed(() => {
  return Math.round(kpiPartActivos.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr) return s
    const imp     = Number(c.importe_participacion)
    const interes = imp * Number(pr.interes_ordinario) / 100 / 12
    const gestion = imp * Number(c.porcentaje_gestion) / 100 / 12
    return s + (interes - gestion)
  }, 0) * 100) / 100
})

const kpartIrpfMes  = computed(() => Math.round(kpartBrutoMes.value * (kpartIrpf.value / 100) * 100) / 100)
const kpartNetoMes  = computed(() => Math.round((kpartBrutoMes.value - kpartIrpfMes.value) * 100) / 100)
const kpartRentPct  = computed(() => {
  if (!kpartEnCurso.value) return '0.00'
  return (kpartBrutoMes.value * 12 / kpartEnCurso.value * 100).toFixed(2)
})

// Acumulados — todos los registros son pagos reales en nueva arquitectura
const kpartBrutoAcum      = computed(() => kpiPartPagos.value.reduce((s,p) => s + Number(p.importe_bruto), 0))
const kpartBrutoDevengado = computed(() => 0)  // Devengados son virtuales, no almacenados
const kpartDevengados     = computed(() => [])
const kpartDevengadosAgrupados = computed(() => [])

// Guardar partícipe — si soloEditarContacto, sólo actualiza tel/email/dir
async function guardarParticipe() {
  if (props.soloEditarContacto && form.value.id) {
    const { error } = await supabase.from('participes').update({
      telefono:  form.value.telefono,
      email:     form.value.email,
      direccion: form.value.direccion,
    }).eq('id', form.value.id)
    if (error) return alert('Error: ' + error.message)
    cerrarModal()
    // Refrescar datos del partícipe (useCrud: re-init forzando recarga)
    await cargarDatos()
  } else {
    await guardar()
  }
}
</script>
