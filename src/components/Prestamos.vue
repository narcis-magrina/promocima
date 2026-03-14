<template>
  <div>

    <!-- ── DETALLE ─────────────────────────────── -->
    <PrestamoDetalle
      v-if="viewId && prestamo"
      :prestamo="prestamo"
      :cobros="cobros"
      :prestamo-id="viewId"
      @navigate="$emit('navigate', $event)"
      @editar="editarPrestamo"
      @recargar="cargarTodo"
    />

    <!-- ── LISTA ───────────────────────────────── -->
    <template v-else-if="!viewId">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
        <div class="kpi-card kc-green">
          <div class="kpi-label">Capital Activo</div>
          <div class="kpi-value">{{ fmtN(capitalTotal) }}</div>
          <div class="kpi-sub">Capital inicial: {{ fmtInt(prestamosConSituacion.filter(p => p.estado !== 'cancelado').reduce((s,p) => s + Number(p.importe), 0)) }}</div>
          <div class="kpi-sub">{{ prestamosConSituacion.filter(p => p.estado !== 'cancelado').length }} préstamos activos</div>
        </div>
        <div class="kpi-card kc-green">
          <div class="kpi-label">Al Día</div>
          <div class="kpi-value">{{ fmtN(capitalActivoAlDia) }}</div>
          <div class="kpi-sub">Capital inicial: {{ fmtInt(capitalInicialAlDia) }}</div>
          <div class="kpi-sub">{{ nAlDia }} préstamo{{ nAlDia !== 1 ? 's' : '' }}</div>
        </div>
        <div class="kpi-card kc-orange">
          <div class="kpi-label">Con Retraso</div>
          <div class="kpi-value">{{ fmtN(capitalActivoRetraso) }}</div>
          <div class="kpi-sub">Capital inicial: {{ fmtInt(capitalInicialRetraso) }}</div>
          <div class="kpi-sub">{{ nConRetraso }} préstamo{{ nConRetraso !== 1 ? 's' : '' }}</div>
        </div>
        <div class="kpi-card kc-red">
          <div class="kpi-label">Judicializados</div>
          <div class="kpi-value">{{ fmtN(capitalActivoJudicial) }}</div>
          <div class="kpi-sub">Capital inicial: {{ fmtInt(capitalInicialJudicial) }}</div>
          <div class="kpi-sub">{{ nJudicializados }} préstamo{{ nJudicializados !== 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="section-header">
        <div>
          <div class="section-title">Préstamos</div>
          <div class="section-sub">{{ prestamos.length }} en total</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="filter-label">Filtros</span>
          <select class="form-control" v-model="filtroEstado" style="width:160px;padding:5px 10px;font-size:12px" :style="filtroEstado !== '' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="cancelado">Cancelados</option>
            <option value="judicializado">Judicializados</option>
          </select>
          <select class="form-control" v-model="filtroSituacion" style="width:160px;padding:5px 10px;font-size:12px" :style="filtroSituacion !== '' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todas las situaciones</option>
            <option value="al_dia">Al día</option>
            <option value="con_retraso">Con retraso</option>
          </select>
          <select class="form-control" :class="{'filter-active': !!filtroIntermediario}" style="width:160px;padding:5px 10px;font-size:12px" v-model="filtroIntermediario" :style="!!filtroIntermediario ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los intermediarios</option>
            <option v-for="i in intermediariosSorted" :key="i.id" :value="i.id">{{ i.nombre }}</option>
          </select>
          <button class="btn btn-primary" @click="abrirModalNuevo">+ Nuevo Préstamo</button>
        </div>
      </div>
      <div class="table-card">
        <div class="table-header">
          <h3>Listado <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
          <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Buscar préstamo..." v-model="busqueda" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr>
                <th @click="setSortP('centro_coste')" :class="thClassP('centro_coste')" style="text-align:center" class="col-hide-mobile">CC <span class="sort-icon">{{ thIconP('centro_coste') }}</span></th>
                <th @click="setSortP('alias')" :class="thClassP('alias')">Alias <span class="sort-icon">{{ thIconP('alias') }}</span></th>
                <th class="col-hide-mobile">Intermediario</th>
                <th @click="setSortP('tipo_prestamo')" :class="thClassP('tipo_prestamo')" class="col-hide-mobile">Tipo <span class="sort-icon">{{ thIconP('tipo_prestamo') }}</span></th>
                <th @click="setSortP('importe')" :class="thClassP('importe')" style="text-align:right">Importe <span class="sort-icon">{{ thIconP('importe') }}</span></th>
                <th style="text-align:right">Activo</th>
                <th @click="setSortP('fecha_inicio')" :class="thClassP('fecha_inicio')" class="col-hide-mobile">Inicio <span class="sort-icon">{{ thIconP('fecha_inicio') }}</span></th>
                <th @click="setSortP('duracion_meses')" :class="thClassP('duracion_meses')" style="text-align:center" class="col-hide-mobile">Meses <span class="sort-icon">{{ thIconP('duracion_meses') }}</span></th>
                <th @click="setSortP('interes_ordinario')" :class="thClassP('interes_ordinario')" style="text-align:center">Interés <span class="sort-icon">{{ thIconP('interes_ordinario') }}</span></th>
                <th style="text-align:center" class="col-hide-mobile">LTV</th>
                <th @click="setSortP('estado')" :class="thClassP('estado')">Estado <span class="sort-icon">{{ thIconP('estado') }}</span></th>
                <th style="width:40px"></th>
              </tr></thead>
            <tbody>
              <tr v-for="p in prestamosFiltrados" :key="p.id" style="cursor:pointer" @click="$emit('navigate','prestamos',p.id)">
                <td class="td-mono td-center col-hide-mobile" style="color:var(--text3)">{{ p.centro_coste || '—' }}</td>
                <td style="font-weight:500">{{ p.alias }}</td>
                <td style="font-size:12px" class="col-hide-mobile">{{ p.intermediarios?.nombre || '—' }}</td>
                <td v-html="getTipoBadge(p.tipo_prestamo)" class="col-hide-mobile" />
                <td class="td-mono td-right">{{ fmtN(p.importe) }}</td>
                <td class="td-mono td-right" style="color:var(--green)">
                  {{ p.estado !== 'cancelado' ? fmtN(calcCapitalActivoPrestamo(p)) : '—' }}
                </td>
                <td style="font-size:12px" class="col-hide-mobile">{{ fmtDateShort(p.fecha_inicio) }}</td>
                <td class="td-center col-hide-mobile">{{ p.duracion_meses }}</td>
                <td class="td-mono td-center">{{ p.interes_ordinario }}%</td>
                <td class="td-mono td-center col-hide-mobile" :style="{ color: ltvColor(p) }">{{ ltvValor(p) }}%</td>
                <td v-html="getEstadoBadge(estadoVisible(p))" />
                <td @click.stop>
                  <button
                    class="btn btn-sm btn-danger-solid"
                    :disabled="!!motivoNoPuedeEliminar(p)"
                    :title="motivoNoPuedeEliminar(p) || 'Eliminar préstamo'"
                    @click.stop="eliminarPrestamoLista(p.id)"
                  >✕</button>
                </td>
              </tr>
              <tr v-if="!prestamosFiltrados.length"><td colspan="11" class="table-empty">Sin préstamos</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── MODAL PRÉSTAMO ─────────────────────── -->
    <div class="modal-overlay" v-if="modalPrestamo">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 style="display:flex;align-items:center;gap:10px">
            {{ formP.id ? 'Editar' : 'Nuevo' }} Préstamo
            <span v-if="cobrosVencimientoExisten" style="font-size:11px;font-weight:500;background:rgba(249,115,22,0.12);color:var(--orange);border:1px solid rgba(249,115,22,0.3);padding:2px 8px;border-radius:4px">
              ⚠ Parcialmente bloqueado: existen cobros registrados
            </span>
          </h2>
          <button class="btn btn-ghost btn-sm" @click="modalPrestamo = false">✕</button>
        </div>
        <div class="modal-body">
          <!-- Datos del préstamo -->
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Alias <span class="req">*</span></label><input class="form-control" v-model="formP.alias"></div>
            <div class="form-group"><label class="form-label">Centro de Coste</label><input class="form-control" v-model="formP.centro_coste"></div>
            <div class="form-group"><label class="form-label">Cliente <span class="req">*</span></label>
              <select class="form-control" :class="{'filter-active': !!formP.cliente_id}" v-model="formP.cliente_id" :style="!!formP.cliente_id ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option v-for="c in clientesSorted" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Intermediario</label>
              <select class="form-control" :class="{'filter-active': !!formP.intermediario_id}" v-model="formP.intermediario_id" :style="!!formP.intermediario_id ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option value="">Sin intermediario</option>
                <option v-for="i in intermediariosSorted" :key="i.id" :value="i.id">{{ i.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Importe (€) <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="formP.importe"
                :disabled="cobrosVencimientoExisten"
                :title="cobrosVencimientoExisten ? 'No editable: ya existen cobros al vencimiento' : ''"
                :style="cobrosVencimientoExisten ? 'opacity:0.5;cursor:not-allowed' : ''">

            </div>
            <div class="form-group">
              <label class="form-label">Fecha Inicio <span class="req">*</span></label>
              <input v-if="cobrosVencimientoExisten" class="form-control" type="text"
                :value="fmtDate(formP.fecha_inicio)"
                disabled
                style="opacity:0.6;cursor:not-allowed;background:var(--bg2)"
                title="No editable: ya existen cobros al vencimiento">
              <input v-else class="form-control" type="date" v-model="formP.fecha_inicio" @change="onFechaInicioChange">
            </div>
            <div class="form-group">
              <label class="form-label">Duración (meses) <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="formP.duracion_meses"
                :disabled="cobrosVencimientoExisten && formP.tipo_prestamo !== 'Americano'"
                :title="cobrosVencimientoExisten && formP.tipo_prestamo !== 'Americano' ? 'No editable en préstamos franceses con cobros' : (cobrosVencimientoExisten ? 'En americano puede extenderse más allá del último cobro' : '')"
                :style="cobrosVencimientoExisten && formP.tipo_prestamo !== 'Americano' ? 'opacity:0.5;cursor:not-allowed' : ''">
              <div v-if="cobrosVencimientoExisten && formP.tipo_prestamo === 'Americano'" style="font-size:10px;color:var(--blue);margin-top:3px">En americano: la duración puede ampliarse (mín. {{ ultimaCuotaCobrada + 1 }} meses)</div>
            </div>
            <div class="form-group"><label class="form-label">Día de Cobro <span class="req">*</span></label><input class="form-control" type="number" min="1" max="31" v-model="formP.dia_cobro"><div style="font-size:10px;color:var(--text3);margin-top:3px">Si el mes no tiene ese día, se usa el último día del mes</div></div>
            <div class="form-group">
              <label class="form-label">Tipo de Préstamo</label>
              <select class="form-control" :class="{'filter-active': !!formP.tipo_prestamo}" v-model="formP.tipo_prestamo"
                :disabled="cobrosVencimientoExisten"
                :style="cobrosVencimientoExisten ? 'opacity:0.5;cursor:not-allowed' : ''"
                :title="cobrosVencimientoExisten ? 'No editable: ya existen cobros al vencimiento' : ''">
                <option>Americano</option><option>Francés</option><option>Francés con carencia</option>
              </select>
            </div>
            <div class="form-group" v-if="formP.tipo_prestamo === 'Francés con carencia'">
              <label class="form-label">Meses de carencia <span class="req">*</span></label>
              <input class="form-control" type="number" min="1" v-model="formP.meses_carencia">
              <div style="font-size:10px;color:var(--text3);margin-top:3px">Nº de meses en que solo se pagan intereses</div>
            </div>
            <div class="form-group">
              <label class="form-label">Periodicidad</label>
              <select class="form-control" :class="{'filter-active': !!formP.periodicidad}" v-model="formP.periodicidad" :style="!!formP.periodicidad ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Interés Ordinario (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="formP.interes_ordinario"
                :disabled="cobrosVencimientoExisten"
                :style="cobrosVencimientoExisten ? 'opacity:0.5;cursor:not-allowed' : ''"
                :title="cobrosVencimientoExisten ? 'No editable: ya existen cobros al vencimiento' : ''">
            </div>
            <div class="form-group">
              <label class="form-label">Interés Demora (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="formP.interes_demora"
                :disabled="cobrosVencimientoExisten"
                :style="cobrosVencimientoExisten ? 'opacity:0.5;cursor:not-allowed' : ''"
                :title="cobrosVencimientoExisten ? 'No editable: ya existen cobros al vencimiento' : ''">
            </div>
            <div class="form-group"><label class="form-label">Comisión Apertura (%)</label><input class="form-control" type="number" step="0.01" v-model="formP.comision_apertura"></div>
          </div>
          <!-- CIRBE -->
          <div style="border-top:1px solid var(--border);margin-top:18px;padding-top:14px">
            <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Opciones</div>
            <label class="ts-wrap" @click="formP.cirbe = !formP.cirbe">
              <div class="ts-track" :class="{ on: formP.cirbe }"><div class="ts-thumb"></div></div>
              <span class="ts-label">{{ formP.cirbe ? 'Integra con CIRBE' : 'No integra con CIRBE' }}</span>
            </label>
          </div>
          <!-- Bloque Garantía -->
          <div style="border-top:1px solid var(--border);margin-top:18px;padding-top:14px">
            <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Garantía Hipotecaria</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="form-control" :class="{'filter-active': !!formP.garantia_tipo}" v-model="formP.garantia_tipo" :style="!!formP.garantia_tipo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                  <option value="">Sin tipo</option>
                  <option>Solar</option><option>Local Comercial</option><option>Nave Industrial</option>
                  <option>Edificio</option><option>Vivienda</option><option>Parking</option><option>Otro</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">Dirección</label><input class="form-control" v-model="formP.garantia_direccion"></div>
              <div class="form-group"><label class="form-label">Tasación (€) <span class="req">*</span></label><input class="form-control" type="number" v-model="formP.garantia_tasacion"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="modalPrestamo = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarPrestamo">Guardar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSort } from '../composables/useSort.js'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtN, fmtDate, generateCalendarioTeorico, distribuirCobros, getCuotaEstado, getEstadoBadge, getTipoBadge, uuid, today } from '../utils.js'
const fmtDateShort = (d) => { if (!d) return '—'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
import PrestamoDetalle from './PrestamoDetalle.vue'

const props = defineProps({ viewId: String })
const emit = defineEmits(['navigate'])

// ── Estado ────────────────────────────────────
const prestamosRaw = ref([])
const { sorted: prestamos, setSort: setSortP, thIcon: thIconP, thClass: thClassP } = useSort(prestamosRaw, 'centro_coste')
const cobros      = ref([])
const todosCobros = ref([])
const clientes    = ref([])
const intermediarios = ref([])

const ccpPrestamosIds = ref(new Set())  // prestamo_ids que tienen ≥1 contrato CCP
const busqueda           = usePersistedRef('prestamos.busqueda', '')
const filtroEstado       = usePersistedRef('prestamos.filtroEstado', 'activo')
const filtroSituacion    = usePersistedRef('prestamos.filtroSituacion', '')
const filtroIntermediario = usePersistedRef('prestamos.filtroIntermediario', '')

const modalPrestamo = ref(false)
const formP = ref(formPrestamoVacio())

function formPrestamoVacio() {
  const hoy = today()
  const diaHoy = new Date(hoy + 'T00:00:00').getDate()
  return { id: null, alias: '', centro_coste: '', cliente_id: '', intermediario_id: '', importe: '', garantia_tipo: '', garantia_direccion: '', garantia_tasacion: '', fecha_inicio: hoy, duracion_meses: 36, dia_cobro: diaHoy, periodicidad: 'mensual', tipo_prestamo: 'Americano', interes_ordinario: 11, interes_demora: 14, comision_apertura: 2, cirbe: false, meses_carencia: '' }
}

function onFechaInicioChange() {
  if (formP.value.fecha_inicio) {
    const d = new Date(formP.value.fecha_inicio + 'T00:00:00')
    formP.value.dia_cobro = d.getDate()
  }
}

// ── Computed ──────────────────────────────────
const prestamo = computed(() => prestamos.value.find(p => p.id === props.viewId) || null)

function esActivo(p) {
  return p.estado === 'activo'
}

function estadoVisible(p) {
  if (p.estado === 'cancelado')     return 'cancelado'
  if (p.estado === 'judicializado') return 'judicializado'
  return p.situacion || 'al_dia'
}

function calcSituacion(p, cobrosPreCalculados) {
  if (!esActivo(p)) return null
  const hoy = today()
  const cobrosP = cobrosPreCalculados !== undefined
    ? cobrosPreCalculados
    : todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal = generateCalendarioTeorico(p, cobrosP)

  // Misma lógica de tramos que PrestamoDetalle para consistencia
  const cobrosOrdinarios = cobrosP
    .filter(x => x.tipo === 'pago_cuota' || x.tipo === 'cancelacion')
    .map(x => ({ fecha: x.fecha_real || x.fecha_teorica, importe: Math.round(Number(x.importe) * 100) / 100 }))
    .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))

  const apFechas = cobrosP
    .filter(x => x.tipo === 'amortizacion_parcial' && Number(x.importe_principal || 0) > 0)
    .map(x => x.fecha_real || x.fecha_teorica)
    .filter(Boolean).sort()

  const limites = [...apFechas, null]
  const tramos = []
  let ci = 0
  for (const limite of limites) {
    let total = 0
    while (ci < cobrosOrdinarios.length) {
      if (limite !== null && cobrosOrdinarios[ci].fecha >= limite) break
      total = Math.round((total + cobrosOrdinarios[ci].importe) * 100) / 100
      ci++
    }
    tramos.push(total)
  }

  let tramoIdx = 0, restante = tramos[0] || 0, apIdx = 0
  for (const cuota of cal) {
    while (apIdx < apFechas.length && apFechas[apIdx] < cuota.fecha) {
      apIdx++; tramoIdx++
      restante = tramos[tramoIdx] || 0
    }
    if (cuota.fecha > hoy) break
    const cobrado = Math.round(Math.min(restante, cuota.total) * 100) / 100
    restante = Math.round((restante - cobrado) * 100) / 100
    if (cobrado < cuota.total * 0.99) return 'con_retraso'
  }
  return 'al_dia'
}

const clientesSorted     = computed(() => [...clientes.value].sort((a,b) => a.nombre.localeCompare(b.nombre)))
const intermediariosSorted = computed(() => [...intermediarios.value].sort((a,b) => a.nombre.localeCompare(b.nombre)))

const prestamosConSituacion = computed(() => prestamos.value)

const activos        = computed(() => prestamosConSituacion.value.filter(p => esActivo(p)))
function calcCapitalActivoPrestamo(p) {
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const totalAmort = cobrosP
    .filter(c => c.tipo === 'amortizacion_parcial')
    .reduce((s, c) => s + Number(c.importe_principal || 0), 0)
  if (p.tipo_prestamo === 'Americano') {
    return Math.max(0, Number(p.importe) - totalAmort)
  }
  const cal = generateCalendarioTeorico(p, cobrosP)
  const calConEstado = distribuirCobros(cal, cobrosP)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - totalAmort - amortCuotas) * 100) / 100)
}

const capitalTotal = computed(() =>
  prestamosConSituacion.value
    .filter(p => p.estado !== 'cancelado')
    .reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
)
const nActivos       = computed(() => activos.value.length)
const nAlDia          = computed(() => activos.value.filter(p => p.situacion === 'al_dia').length)
const nConRetraso     = computed(() => activos.value.filter(p => p.situacion === 'con_retraso').length)
const nJudicializados = computed(() => prestamosConSituacion.value.filter(p => p.estado === 'judicializado').length)

const alDiaArr        = computed(() => activos.value.filter(p => p.situacion === 'al_dia'))
const retrasoArr      = computed(() => activos.value.filter(p => p.situacion === 'con_retraso'))
const judicialArr     = computed(() => prestamosConSituacion.value.filter(p => p.estado === 'judicializado'))

const capitalActivoAlDia    = computed(() => alDiaArr.value.reduce((s,p) => s + calcCapitalActivoPrestamo(p), 0))
const capitalActivoRetraso  = computed(() => retrasoArr.value.reduce((s,p) => s + calcCapitalActivoPrestamo(p), 0))
const capitalActivoJudicial = computed(() => judicialArr.value.reduce((s,p) => s + calcCapitalActivoPrestamo(p), 0))

const capitalInicialAlDia    = computed(() => alDiaArr.value.reduce((s,p) => s + Number(p.importe), 0))
const capitalInicialRetraso  = computed(() => retrasoArr.value.reduce((s,p) => s + Number(p.importe), 0))
const capitalInicialJudicial = computed(() => judicialArr.value.reduce((s,p) => s + Number(p.importe), 0))

// Detectar si el préstamo en edición tiene cobros de cuota registrados
// (bloquea campos sensibles)
const cobrosVencimientoExisten = computed(() => {
  if (!formP.value.id) return false
  return todosCobros.value.some(c => c.prestamo_id === formP.value.id && c.tipo === 'pago_cuota')
})

// Último cuota_num cobrado (para validar duracion en americano)
const ultimaCuotaCobrada = computed(() => {
  if (!formP.value.id) return 0
  const nums = todosCobros.value
    .filter(c => c.prestamo_id === formP.value.id && c.tipo === 'pago_cuota')
    .map(c => parseInt(c.cuota_num) || 0)
  return nums.length ? Math.max(...nums) : 0
})

const prestamosFiltrados = computed(() => {
  let list = prestamosConSituacion.value
  if (filtroEstado.value === 'activo') {
    list = list.filter(p => esActivo(p))
  } else if (filtroEstado.value) {
    list = list.filter(p => p.estado === filtroEstado.value)
  }
  if (filtroSituacion.value) list = list.filter(p => p.situacion === filtroSituacion.value)
  if (filtroIntermediario.value) list = list.filter(p => p.intermediario_id === filtroIntermediario.value)
  const q = busqueda.value.toLowerCase()
  if (q) list = list.filter(p => p.alias.toLowerCase().includes(q) || (p.intermediarios?.nombre || '').toLowerCase().includes(q))
  return list
})

// Razón por la que no se puede eliminar un préstamo (null = se puede eliminar)
function motivoNoPuedeEliminar(p) {
  if (todosCobros.value.some(cb => cb.prestamo_id === p.id && cb.tipo !== 'cancelacion'))
    return 'No se puede eliminar: tiene cobros registrados'
  if (ccpPrestamosIds.value.has(p.id))
    return 'No se puede eliminar: tiene contratos CCP vinculados'
  return null
}

function ltvValor(p) {
  if (!p.garantia_tasacion) return '—'
  return (Number(p.importe) / Number(p.garantia_tasacion) * 100).toFixed(1)
}
function ltvColor(p) { return parseFloat(ltvValor(p)) <= 40 ? 'var(--green)' : 'var(--orange)' }

// ── Lifecycle ─────────────────────────────────
onMounted(cargarTodo)
watch(() => props.viewId, cargarTodo)

async function cargarTodo() {
  const [{ data: p }, { data: c }, { data: tc }, { data: cl }, { data: i }, { data: ccp }] = await Promise.all([
    supabase.from('prestamos').select('*'),
    props.viewId
      ? supabase.from('cobros').select('*').eq('prestamo_id', props.viewId).order('fecha_real', { ascending: false, nullsFirst: false }).order('fecha_teorica', { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    (async () => {
      const PAGE = 1000
      let all = [], from = 0, done = false
      while (!done) {
        const { data } = await supabase.from('cobros')
          .select('prestamo_id, importe, tipo, importe_principal, fecha_real, fecha_teorica, modalidad_recalculo')
          .order('id').range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) done = true
        else from += PAGE
      }
      return { data: all }
    })(),
    supabase.from('clientes').select('id, nombre').order('nombre'),
    supabase.from('intermediarios').select('id, nombre').order('nombre'),
    supabase.from('contratos_ccp').select('prestamo_id'),
  ])
  const clientesMap = Object.fromEntries((cl || []).map(c => [c.id, c]))
  const interMap    = Object.fromEntries((i  || []).map(x => [x.id, x]))
  prestamosRaw.value = (p || []).map(x => ({
    ...x,
    clientes:       clientesMap[x.cliente_id]    ? { nombre: clientesMap[x.cliente_id].nombre }    : null,
    intermediarios: interMap[x.intermediario_id] ? { nombre: interMap[x.intermediario_id].nombre } : null,
  }))
  cobros.value      = c  || []
  todosCobros.value = tc || []
  clientes.value    = cl || []
  intermediarios.value = i || []
  ccpPrestamosIds.value = new Set((ccp || []).map(x => x.prestamo_id))

  // Calcular situación cuando TODOS los datos están cargados (evita condición de carrera)
  const cobrosPorPrestamo = {}
  for (const cb of todosCobros.value) {
    if (!cobrosPorPrestamo[cb.prestamo_id]) cobrosPorPrestamo[cb.prestamo_id] = []
    cobrosPorPrestamo[cb.prestamo_id].push(cb)
  }
  prestamosRaw.value = prestamosRaw.value.map(p => {
    const cobrosP = cobrosPorPrestamo[p.id] || []
    const sit = calcSituacion(p, cobrosP)
    if (p.id === 'P061') console.log('[P061]', { cobrosP: cobrosP.length, sit, totalTodosCobros: todosCobros.value.length })
    return { ...p, situacion: sit }
  })
}

// ── Acciones ──────────────────────────────────
function abrirModalNuevo() {
  formP.value = formPrestamoVacio()
  modalPrestamo.value = true
}

function editarPrestamo(p) {
  formP.value = {
    id: p.id, alias: p.alias, centro_coste: p.centro_coste || '',
    cliente_id: p.cliente_id, intermediario_id: p.intermediario_id || '',
    importe: p.importe, garantia_tipo: p.garantia_tipo || '', garantia_direccion: p.garantia_direccion || '', garantia_tasacion: p.garantia_tasacion || '',
    fecha_inicio: p.fecha_inicio, duracion_meses: p.duracion_meses,
    dia_cobro: p.dia_cobro, tipo_prestamo: p.tipo_prestamo, meses_carencia: p.meses_carencia || '',
    periodicidad: p.periodicidad || 'mensual',
    interes_ordinario: p.interes_ordinario, interes_demora: p.interes_demora,
    comision_apertura: p.comision_apertura, cirbe: p.cirbe || false,
  }
  modalPrestamo.value = true
}

async function guardarPrestamo() {
  if (!formP.value.alias || !formP.value.importe) return alert('Completa los campos obligatorios')
  if (formP.value.tipo_prestamo === 'Francés con carencia' && !formP.value.meses_carencia)
    return alert('Indica los meses de carencia del préstamo')
  // Validación campos bloqueados en americano: la duración nueva debe superar el último cobro
  if (cobrosVencimientoExisten.value && formP.value.tipo_prestamo === 'Americano') {
    if (Number(formP.value.duracion_meses) <= ultimaCuotaCobrada.value) {
      return alert(`La nueva duración (${formP.value.duracion_meses} meses) debe ser mayor que el último cobro registrado (cuota ${ultimaCuotaCobrada.value}).`)
    }
  }
  if (formP.value.garantia_tasacion) {
    const ltv = Number(formP.value.importe) / Number(formP.value.garantia_tasacion) * 100
    if (ltv > 40 && !confirm(`Aviso: el LTV es del ${ltv.toFixed(1)}%, por encima del 40% recomendado. ¿Desea guardar igualmente?`)) return
  }
  const data = { ...formP.value, intermediario_id: formP.value.intermediario_id || null }
  // Limpiar meses_carencia si no es carencia
  if (data.tipo_prestamo !== 'Francés con carencia') data.meses_carencia = null
  delete data.id
  let error
  if (formP.value.id) {
    ;({ error } = await supabase.from('prestamos').update(data).eq('id', formP.value.id))
  } else {
    const nums = prestamos.value.map(p => parseInt(p.id.replace(/\D/g, '')) || 0)
    const siguiente = (nums.length ? Math.max(...nums) : 0) + 1
    const nuevoId = 'P' + String(siguiente).padStart(3, '0')
    ;({ error } = await supabase.from('prestamos').insert({ id: nuevoId, ...data, estado: 'activo', judicializado: false }))
  }
  if (error) return alert('Error al guardar: ' + error.message)
  modalPrestamo.value = false
  await cargarTodo()
}

async function eliminarPrestamoLista(id) {
  const tieneCobros = todosCobros.value.some(cb => cb.prestamo_id === id && cb.tipo !== 'cancelacion')
  if (tieneCobros) return alert('No se puede eliminar: tiene cobros registrados.')
  // Verificar contratos CCP vinculados
  const { data: ccpCheck } = await supabase.from('contratos_ccp').select('id').eq('prestamo_id', id).limit(1)
  if (ccpCheck?.length) return alert('No se puede eliminar: el préstamo tiene contratos CCP vinculados. Elimine primero los contratos CCP.')
  if (!confirm('¿Eliminar este préstamo?')) return
  await supabase.from('cobros').delete().eq('prestamo_id', id)
  await supabase.from('prestamos').delete().eq('id', id)
  await cargarTodo()
}
</script>
