<template>
  <div>

    <!-- ── DETALLE ─────────────────────────────── -->
    <ContratoCCPDetalle
      v-if="viewId && contrato"
      :contrato="contrato"
      :prestamo-detalle="prestamoDetalle"
      :cobros-prestamo="cobrosPrestamo"
      :read-only="readOnly"
      :es-portal-participe="esPortalParticipe"
      @navigate="(page, id) => $emit('navigate', page, id)"
      @editar="editarContrato"
    />

    <!-- ── LISTA ───────────────────────────────── -->
    <ContratoCCPLista
      v-else
      :contratos="contratos"
      :participes="participes"
      :prestamos="prestamos"
      :read-only="readOnly"
      @seleccionar="id => $emit('navigate', 'contratos-ccp', id)"
      @nuevo="abrirNuevo"
      @editar="editarContrato"
      @eliminar="eliminarContrato"
    />

    <!-- ── Modal Nuevo / Editar Contrato ───────── -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2 style="display:flex;align-items:center;gap:10px">
            {{ form.id ? 'Editar' : 'Nuevo' }} Contrato CCP
            <span v-if="form.id && tienePagosRealizados" style="font-size:11px;font-weight:500;background:rgba(239,68,68,0.1);color:var(--red);border:1px solid rgba(239,68,68,0.25);padding:2px 8px;border-radius:4px">
              🔒 Bloqueado: existen pagos ya realizados
            </span>
          </h2>
          <button class="btn btn-ghost btn-sm" @click="modalAbierto = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Partícipe <span class="req">*</span></label>
              <select class="form-control" v-model="form.participe_id"
                :disabled="!!form.id || tienePagosRealizados"
                :style="(form.id || tienePagosRealizados) ? 'opacity:0.5;cursor:not-allowed' : ''">
                <option v-for="p in participesSorted" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Préstamo <span class="req">*</span></label>
              <select class="form-control" v-model="form.prestamo_id"
                :disabled="!!form.id || tienePagosRealizados"
                :style="(form.id || tienePagosRealizados) ? 'opacity:0.5;cursor:not-allowed' : ''">
                <option v-for="p in prestamosActivosSorted" :key="p.id" :value="p.id">{{ p.alias }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Firma <span class="req">*</span></label>
              <input class="form-control" type="date" v-model="form.fecha_firma"
                :min="prestamos.find(p => p.id === form.prestamo_id)?.fecha_inicio || undefined"
                :disabled="tienePagosRealizados"
                :style="tienePagosRealizados ? 'opacity:1;cursor:not-allowed;color:var(--text1);-webkit-text-fill-color:var(--text1)' : ''">
              <div v-if="form.prestamo_id && prestamos.find(p => p.id === form.prestamo_id)?.fecha_inicio"
                   style="font-size:11px;color:var(--text3);margin-top:3px">
                Mínimo: {{ prestamos.find(p => p.id === form.prestamo_id)?.fecha_inicio }}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Importe Participación (€) <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="form.importe_participacion"
                :disabled="tienePagosRealizados"
                :style="tienePagosRealizados ? 'opacity:0.5;cursor:not-allowed' : ''">
            </div>
            <div class="form-group">
              <label class="form-label">% Gestión</label>
              <input class="form-control" type="number" step="0.01" v-model="form.porcentaje_gestion"
                :disabled="tienePagosRealizados"
                :style="tienePagosRealizados ? 'opacity:0.5;cursor:not-allowed' : ''">
            </div>
            <div class="form-group">
              <label class="form-label">% Apertura</label>
              <input class="form-control" type="number" step="0.01" v-model="form.porcentaje_apertura"
                :disabled="tienePagosRealizados"
                :style="tienePagosRealizados ? 'opacity:0.5;cursor:not-allowed' : ''">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="modalAbierto = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="tienePagosRealizados" @click="guardar">Guardar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'
import { today, generateCalendarioTeorico, distribuirCobros, calcSituacionPrestamo } from '../utils.js'
import ContratoCCPDetalle from './ContratoCCPDetalle.vue'
import ContratoCCPLista   from './ContratoCCPLista.vue'

// ── Props / emits ──────────────────────────────
const props = defineProps({
  viewId:            String,
  readOnly:          { type: Boolean, default: false },
  esPortalParticipe: { type: Boolean, default: false }, // se pasa al detalle para ocultar back-btn
})
const emit  = defineEmits(['navigate'])

// ── Estado ─────────────────────────────────────
const contratosRaw = ref([])
const participes   = ref([])
const prestamos    = ref([])
const todosCobrosGlobal = ref([])
const todosPagos   = ref([])
const cobrosPrestamo = ref([])  // cobros reales del préstamo activo en detalle
const modalAbierto = ref(false)
const form         = ref(formVacio())

function formVacio() {
  return {
    id: null, participe_id: '', prestamo_id: '', fecha_firma: today(),
    importe_participacion: '', porcentaje_gestion: 2, porcentaje_apertura: 0,
  }
}

// Computed: lista de pagos realizados del contrato en edición
const tienePagosRealizados = computed(() => {
  if (!form.value.id) return false
  return todosPagos.value.some(p => p.contrato_ccp_id === form.value.id)
})

// Listas ordenadas para los selects
const participesSorted = computed(() => [...participes.value].sort((a, b) => a.nombre.localeCompare(b.nombre)))
const prestamosActivosSorted = computed(() =>
  prestamos.value.filter(p => p.estado !== 'cancelado').sort((a, b) => a.alias.localeCompare(b.alias))
)

// Abrir modal nuevo
function abrirNuevo() {
  form.value = formVacio()
  modalAbierto.value = true
}

// Abrir modal edición
function editarContrato(c) {
  form.value = {
    id: c.id,
    participe_id: c.participe_id,
    prestamo_id: c.prestamo_id,
    fecha_firma: c.fecha_firma,
    importe_participacion: c.importe_participacion,
    porcentaje_gestion: c.porcentaje_gestion,
    porcentaje_apertura: c.porcentaje_apertura || 0,
  }
  modalAbierto.value = true
}

// ── Computed ───────────────────────────────────
const contratos = computed(() => contratosRaw.value)

const contrato = computed(() =>
  contratos.value.find(c => c.id === props.viewId) || null
)

const prestamoDetalle = computed(() =>
  contrato.value
    ? prestamos.value.find(p => p.id === contrato.value.prestamo_id) || null
    : null
)



// ── Lifecycle ──────────────────────────────────
onMounted(cargarDatos)
watch(() => props.viewId, cargarDatos)

async function cargarDatos() {
  const [{ data: c }, { data: p }, { data: pr }, { data: tp }, { data: cbGlobal }] = await Promise.all([
    supabase.from('contratos_ccp').select('*, participes(nombre), prestamos(id, alias, interes_ordinario)'),
    supabase.from('participes').select('id, nombre').order('nombre'),
    supabase.from('prestamos').select('id, alias, importe, interes_ordinario, interes_demora, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad, estado, fecha_judicializacion, importe_demanda, demanda_principal, demanda_interes_ordinario, demanda_gastos, meses_carencia'),
    supabase.from('pagos_reales_participe').select('contrato_ccp_id'),
    supabase.from('cobros').select('prestamo_id, cuota_num, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo').range(0, 9999),
  ])
  // Cargar cobros del préstamo para el contrato en detalle
  if (props.viewId) {
    const contratoActual = (c || []).find(cc => cc.id === props.viewId)
    if (contratoActual?.prestamo_id) {
      const { data: cobros } = await supabase
        .from('cobros')
        .select('*')
        .eq('prestamo_id', contratoActual.prestamo_id)
        .order('fecha_real')
      cobrosPrestamo.value = cobros || []
    } else {
      cobrosPrestamo.value = []
    }
  }
  const prestamosMap = Object.fromEntries((pr || []).map(p => [p.id, p]))
  // Sincronizar activo: un CCP debe estar inactivo si su préstamo está cancelado
  const contratosSync = (c || []).map(cc => {
    const pr_ = prestamosMap[cc.prestamo_id]
    const debeEstarActivo = pr_ ? pr_.estado !== 'cancelado' : cc.activo
    // Si el estado no coincide, actualizar en BD de forma silenciosa
    if (cc.activo !== debeEstarActivo) {
      supabase.from('contratos_ccp').update({ activo: debeEstarActivo }).eq('id', cc.id)
      return { ...cc, activo: debeEstarActivo }
    }
    return cc
  })
  contratosRaw.value    = contratosSync
  participes.value      = p  || []
  todosPagos.value      = tp || []
  todosCobrosGlobal.value = cbGlobal || []
  // Enriquecer préstamos con situación calculada (al_dia / con_retraso)
  prestamos.value = (pr || []).map(p => {
    const cobrosP = (cbGlobal || []).filter(c => c.prestamo_id === p.id)
    return { ...p, situacion: calcSituacionPrestamo(p, cobrosP) }
  })
}

// ── Acciones ───────────────────────────────────
async function guardar() {
  if (!form.value.participe_id || !form.value.prestamo_id || !form.value.importe_participacion)
    return alert('Completa los campos obligatorios')
  const prestamo = prestamos.value.find(p => p.id === form.value.prestamo_id)
  if (!prestamo) return alert('Préstamo no encontrado')
  // La fecha de firma del CCP debe ser igual o posterior a la fecha de inicio del préstamo
  if (form.value.fecha_firma && prestamo.fecha_inicio && form.value.fecha_firma < prestamo.fecha_inicio)
    return alert(`La fecha de firma del contrato CCP (${form.value.fecha_firma}) no puede ser anterior a la fecha de inicio del préstamo (${prestamo.fecha_inicio}).`)
  const porcentaje_participacion =
    Math.round((Number(form.value.importe_participacion) / Number(prestamo.importe)) * 10000) / 100

  // Validar que la suma de participaciones activas no supere el importe del préstamo
  const { data: ccpExistentes } = await supabase
    .from('contratos_ccp')
    .select('id, importe_participacion')
    .eq('prestamo_id', form.value.prestamo_id)
    .eq('activo', true)
  const sumaExistente = (ccpExistentes || [])
    .filter(c => c.id !== form.value.id) // excluir el contrato actual en edición
    .reduce((s, c) => s + Number(c.importe_participacion), 0)
  const nuevaSuma = sumaExistente + Number(form.value.importe_participacion)
  if (nuevaSuma > Number(prestamo.importe)) {
    const disponible = Number(prestamo.importe) - sumaExistente
    return alert(
      `La participación de ${Number(form.value.importe_participacion).toLocaleString('es-ES')} € supera el importe disponible del préstamo.\n` +
      `Importe préstamo: ${Number(prestamo.importe).toLocaleString('es-ES')} €\n` +
      `Ya participado: ${sumaExistente.toLocaleString('es-ES')} €\n` +
      `Disponible: ${disponible.toLocaleString('es-ES')} €`
    )
  }

  if (form.value.id) {
    // Edición
    const data = {
      fecha_firma: form.value.fecha_firma,
      importe_participacion: form.value.importe_participacion,
      porcentaje_participacion,
      porcentaje_gestion: form.value.porcentaje_gestion,
      porcentaje_apertura: form.value.porcentaje_apertura,
    }
    const { error } = await supabase.from('contratos_ccp').update(data).eq('id', form.value.id)
    if (error) return alert('Error al guardar: ' + error.message)
  } else {
    // Creación — ID único consultando el máximo existente
    const { data: existentes } = await supabase.from('contratos_ccp').select('id')
    const nums = (existentes || []).map(x => parseInt(x.id.replace(/\D/g, '')) || 0)
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    const nuevoId = 'CCP' + String(next).padStart(3, '0')
    const contratoNuevo = {
      id: nuevoId, ...form.value, porcentaje_participacion,
      activo: prestamo.estado !== 'cancelado',
    }
    delete contratoNuevo.id_  // limpieza
    const { error } = await supabase.from('contratos_ccp').insert({ ...contratoNuevo, id: nuevoId })
    if (error) return alert('Error al guardar: ' + error.message)
  }
  modalAbierto.value = false
  await cargarDatos()
}

async function eliminarContrato(c) {
  const pagosRealizados = todosPagos.value.filter(p => p.contrato_ccp_id === c.id)
  if (pagosRealizados.length > 0)
    return alert(`No se puede eliminar este contrato: tiene ${pagosRealizados.length} pago(s) registrado(s). Elimínalos primero desde el detalle del contrato.`)
  if (!confirm(`¿Eliminar el contrato de "${c.participes?.nombre} · ${c.prestamos?.alias}"? Se eliminarán también los devengados pendientes.`))
    return
  await supabase.from('pagos_reales_participe').delete().eq('contrato_ccp_id', c.id)
  const { error } = await supabase.from('contratos_ccp').delete().eq('id', c.id)
  if (error) return alert('Error al eliminar: ' + error.message)
  await cargarDatos()
}
</script>
