<template>
  <div class="modal-overlay" v-if="modelValue && modelValue !== 'revertir'">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>Cancelación Anticipada</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-warning">Esta acción cancelará el préstamo definitivamente. Se registrará un único cobro con el desglose indicado.</div>

        <!-- Fecha -->
        <div class="form-grid cols-1" style="margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Fecha de Cancelación <span class="req">*</span></label>
            <input class="form-control" type="date" v-model="form.fecha" @change="recalcular">
          </div>
        </div>

        <!-- Desglose -->
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Desglose del cobro de cancelación</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">

          <div class="form-group">
            <label class="form-label">Principal pendiente (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.principal">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">Se devenga a partícipes</div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Intereses ordinarios pendientes (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">calculado · editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesOrdinario">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">Se devenga a partícipes</div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Intereses de demora pendientes (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">calculado · editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesDemora">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">Se devenga a partícipes</div>
          </div>

          <div class="form-group">
            <label class="form-label">Gastos que se devengan a partícipes (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.gastosDevengan">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">Se devenga a partícipes</div>
          </div>

          <div class="form-group">
            <label class="form-label">Gastos que NO se devengan a partícipes (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.gastosNoDevengan">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">No se devenga a partícipes</div>
          </div>
        </div>

        <!-- Total calculado -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Total cobro cancelación</div>
          <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent)">{{ fmt(total) }}</div>
        </div>

        <div class="form-group" style="margin-top:14px">
          <label class="form-label">Notas</label>
          <textarea class="form-control" v-model="form.notas" rows="2"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="$emit('update:modelValue', false)">Cancelar</button>
        <button class="btn btn-danger" @click="ejecutar">⊗ Confirmar Cancelación</button>
      </div>
    </div>
  </div>

  <!-- Modal revertir cancelación -->
  <div class="modal-overlay" v-if="modelValue === 'revertir'">
    <div class="modal">
      <div class="modal-header">
        <h2>Revertir Cancelación</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-warning">
          Se eliminará el cobro de cancelación, el préstamo volverá a estado
          <strong>{{ estadoAnteriorLabel }}</strong> y podrás continuar operando con él.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="$emit('update:modelValue', false)">Cancelar</button>
        <button class="btn btn-danger" :disabled="ejecutandoRevertir" @click="ejecutarRevertirCancelacion">
          {{ ejecutandoRevertir ? '…' : '↩ Confirmar reversión' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, generateCalendarioTeorico, uuid, today , distribuirCobros } from '../utils.js'

const props = defineProps({
  modelValue:          { type: [Boolean, String], required: true },
  prestamoId:          { type: String,  required: true },
  prestamo:            { type: Object,  required: true },
  cobros:              { type: Array,   required: true },
  calendarioConEstado: { type: Array,   required: true },
})
const emit = defineEmits(['update:modelValue', 'ejecutado'])

// ── Form ──────────────────────────────────────
const form = ref(formVacio())

function formVacio() {
  return { fecha: today(), principal: 0, interesOrdinario: 0, interesDemora: 0, gastosDevengan: 0, gastosNoDevengan: 0, notas: '' }
}

const total = computed(() => {
  const f = form.value
  return Math.round((
    Number(f.principal || 0) + Number(f.interesOrdinario || 0) +
    Number(f.interesDemora || 0) + Number(f.gastosDevengan || 0) +
    Number(f.gastosNoDevengan || 0)
  ) * 100) / 100
})

// Al abrir el modal, inicializar form y recalcular
watch(() => props.modelValue, open => {
  if (open) { form.value = formVacio(); recalcular() }
})

// ── Cálculos automáticos ──────────────────────
function calcPrincipalPendiente() {
  const p   = props.prestamo
  const cal = generateCalendarioTeorico(p, props.cobros)
  const calConEstado = distribuirCobros(cal, props.cobros)
  if (p.tipo_prestamo === 'Americano') {
    // Para americano: principal pendiente = saldo vivo (importe - amortizaciones parciales)
    const totalAmort = props.cobros
      .filter(c => c.tipo === 'amortizacion_parcial')
      .reduce((s, c) => s + Number(c.importe_principal || 0), 0)
    return Math.max(0, Math.round((Number(p.importe) - totalAmort) * 100) / 100)
  }
  // Francés: sumar principal de cuotas cobradas
  const amortizado = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - amortizado) * 100) / 100)
}

function calcInteresOrdinarioPendiente(fecha) {
  const cal = generateCalendarioTeorico(props.prestamo, props.cobros)
  const calConEstado = distribuirCobros(cal, props.cobros)
  return calConEstado.reduce((s, c) => {
    if (c.fecha > fecha) return s
    if (c.estado === 'cobrada') return s
    // Interés pendiente: proporcional a la parte no cobrada
    const fraccionPendiente = c.total > 0 ? c.pendiente / c.total : 1
    return s + Math.round(c.interes * fraccionPendiente * 100) / 100
  }, 0)
}

function recalcular() {
  const fecha = form.value.fecha || today()
  form.value.principal = calcPrincipalPendiente()
  form.value.interesOrdinario = Math.round(calcInteresOrdinarioPendiente(fecha) * 100) / 100

  const p = props.prestamo
  const tasa = Number(p.interes_demora) / 100
  const fechaRef = new Date(fecha + 'T00:00:00')
  const demora = props.calendarioConEstado
    .filter(c => (c.estado === 'pendiente' || c.estado === 'parcial') && new Date(c.fecha + 'T00:00:00') < fechaRef)
    .reduce((s, c) => {
      const dias = Math.round((fechaRef - new Date(c.fecha + 'T00:00:00')) / (1000 * 60 * 60 * 24))
      return s + Math.round(c.pendiente * tasa / 365 * dias * 100) / 100
    }, 0)
  form.value.interesDemora = Math.round(demora * 100) / 100
}

// ── Ejecutar cancelación ──────────────────────
async function ejecutar() {
  const f = form.value
  if (!f.fecha) return alert('La fecha es obligatoria')

  const r = v => Math.round(Number(v || 0) * 100) / 100
  const principal        = r(f.principal)
  const interesOrdinario = r(f.interesOrdinario)
  const interesDemora    = r(f.interesDemora)
  const gastosDevengan   = r(f.gastosDevengan)
  const gastosNoDevengan = r(f.gastosNoDevengan)
  const totalVal         = r(principal + interesOrdinario + interesDemora + gastosDevengan + gastosNoDevengan)

  await supabase.from('prestamos')
    .update({ estado: 'cancelado', fecha_cancelacion: f.fecha })
    .eq('id', props.prestamoId)

  if (totalVal > 0) {
    await supabase.from('cobros').insert({
      id: 'CB' + uuid(),
      prestamo_id: props.prestamoId,
      cuota_num: 'C',
      fecha_teorica: f.fecha,
      fecha_real: f.fecha,
      importe: totalVal,
      importe_principal: principal,
      importe_interes_ordinario: interesOrdinario,
      importe_interes_demora: interesDemora,
      importe_gastos: r(gastosDevengan + gastosNoDevengan),
      gastos_devengan: gastosDevengan,
      tipo: 'cancelacion',
      notas: f.notas || 'Cancelación anticipada',
    })
  }

  const importeDevengado = r(principal + interesOrdinario + interesDemora + gastosDevengan)
  if (importeDevengado > 0) {
  }

  emit('update:modelValue', false)
  emit('ejecutado')
}

// ── Revertir cancelación ──────────────────────
const ejecutandoRevertir = ref(false)

// El estado anterior se deduce del campo judicializado del préstamo,
// que no se modifica al cancelar — si era true, se canceló desde judicializado
const estadoAnteriorCalculado = computed(() =>
  props.prestamo.judicializado ? 'judicializado' : 'activo'
)
const estadoAnteriorLabel = computed(() => estadoAnteriorCalculado.value === 'judicializado' ? 'Judicializado' : 'Activo')

async function ejecutarRevertirCancelacion() {
  ejecutandoRevertir.value = true

  // Borrar cobro de cancelación
  const cobroCancel = props.cobros.find(c => c.tipo === 'cancelacion' || c.cuota_num === 'C')
  if (cobroCancel) {
    await supabase.from('cobros').delete().eq('id', cobroCancel.id)
  }

  // Restaurar estado anterior automáticamente
  const esJud = estadoAnteriorCalculado.value === 'judicializado'
  const updateData = esJud
    ? { estado: 'judicializado', fecha_cancelacion: null, judicializado: true }
    : { estado: 'activo', fecha_cancelacion: null }

  await supabase.from('prestamos').update(updateData).eq('id', props.prestamoId)

  ejecutandoRevertir.value = false
  emit('update:modelValue', false)
  emit('ejecutado')
}
</script>
