<template>
  <!-- MODAL JUDICIALIZAR -->
  <div class="modal-overlay" v-if="modelValue === 'judicializar'">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>Judicialización del Préstamo</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', null)">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger">El préstamo entrará en estado judicializado. Los cobros pendientes serán sustituidos por la reclamación judicial. No se registra ningún cobro hasta que haya resolución judicial.</div>

        <!-- Fecha -->
        <div class="form-grid cols-1" style="margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Fecha de Judicialización <span class="req">*</span></label>
            <input class="form-control" type="date" v-model="formJud.fecha" @change="recalcularJud">
          </div>
        </div>

        <!-- Desglose demanda -->
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Desglose de la demanda</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Principal pendiente (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="formJud.principal">
          </div>
          <div class="form-group">
            <label class="form-label">Intereses ordinarios hasta la fecha (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="formJud.interesOrdinario">
          </div>
          <div class="form-group">
            <label class="form-label">Otros gastos (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="formJud.gastos">
          </div>
        </div>

        <!-- Total demanda -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Total importe demanda</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">Los intereses de demora se calcularán sobre este importe desde la fecha de judicialización</div>
          </div>
          <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--red)">{{ fmt(totalJud) }}</div>
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" v-model="formJud.notas" rows="2"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="$emit('update:modelValue', null)">Cancelar</button>
        <button class="btn btn-danger" @click="ejecutarJud">⚖ Confirmar Judicialización</button>
      </div>
    </div>
  </div>

  <!-- MODAL REVERTIR -->
  <div class="modal-overlay" v-if="modelValue === 'revertir'">
    <div class="modal">
      <div class="modal-header">
        <h2>Revertir Judicialización</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', null)">✕</button>
      </div>
      <div class="modal-body">
        <div class="alert alert-warning">
          Se eliminará el estado judicial del préstamo y volverá a estado activo con su calendario original. Los pagos a partícipes registrados anteriores a la judicialización no se ven afectados.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="$emit('update:modelValue', null)">Cancelar</button>
        <button class="btn btn-danger" @click="ejecutarRevertir">↩ Confirmar reversión</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, generateCalendarioTeorico, today, distribuirCobros } from '../utils.js'

// modelValue: null | 'judicializar' | 'revertir'
const props = defineProps({
  modelValue:  { type: String,  default: null },
  prestamoId:  { type: String,  required: true },
  prestamo:    { type: Object,  required: true },
  cobros:      { type: Array,   required: true },
  calendarioConEstado: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'ejecutado'])

// ── Judicializar ──────────────────────────────
const formJud = ref(formJudVacio())

function formJudVacio() {
  return { fecha: today(), principal: 0, interesOrdinario: 0, gastos: 0, notas: '' }
}

const totalJud = computed(() => {
  const f = formJud.value
  return Math.round((Number(f.principal || 0) + Number(f.interesOrdinario || 0) + Number(f.gastos || 0)) * 100) / 100
})

watch(() => props.modelValue, v => {
  if (v === 'judicializar') { formJud.value = formJudVacio(); recalcularJud() }
})

function calcPrincipalPendiente() {
  const p = props.prestamo
  if (p.tipo_prestamo === 'Americano') return Number(p.importe)
  const cal = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, props.cobros)
  const amortizado = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - amortizado) * 100) / 100)
}

function calcInteresOrdinarioPendiente(fecha) {
  // Solo se reclaman intereses de cuotas vencidas hasta la fecha de judicialización
  // que NO han sido cobradas mediante cobro real registrado.
  // Las cuotas cobradas parcialmente se prorratean por la fracción pendiente.
  const cal = generateCalendarioTeorico(props.prestamo)
  const calConEstado = distribuirCobros(cal, props.cobros)
  // Importe real cobrado de cobros de tipo pago_cuota
  const cobradoReal = props.cobros
    .filter(c => (c.tipo === 'pago_cuota') && (c.fecha_real || c.fecha_teorica) <= fecha)
    .reduce((s, c) => s + Number(c.importe || 0), 0)
  // Distribuir el cobrado real sobre el calendario para saber qué cuotas están realmente pagadas
  let restante = cobradoReal
  return calConEstado.reduce((s, c) => {
    if (c.fecha > fecha) return s
    const cobradoCuota = Math.min(restante, c.total)
    restante = Math.max(0, restante - cobradoCuota)
    const fraccionPendiente = c.total > 0 ? Math.max(0, (c.total - cobradoCuota) / c.total) : 0
    if (fraccionPendiente < 0.005) return s  // cuota cobrada al 100%
    return s + Math.round(c.interes * fraccionPendiente * 100) / 100
  }, 0)
}

function recalcularJud() {
  const fecha = formJud.value.fecha || today()
  formJud.value.principal = calcPrincipalPendiente()
  formJud.value.interesOrdinario = Math.round(calcInteresOrdinarioPendiente(fecha) * 100) / 100
}

async function ejecutarJud() {
  const f = formJud.value
  if (!f.fecha) return alert('La fecha es obligatoria')

  // Validar que la fecha de judicialización no sea anterior al último cobro real
  const cobrosReales = props.cobros
    .filter(c => c.fecha_real && c.tipo === 'pago_cuota')
    .map(c => c.fecha_real)
    .sort()
  if (cobrosReales.length) {
    const ultimoCobro = cobrosReales[cobrosReales.length - 1]
    if (f.fecha < ultimoCobro) {
      return alert(`La fecha de judicialización (${f.fecha}) no puede ser anterior al último cobro registrado (${ultimoCobro}).`)
    }
  }

  const r = v => Math.round(Number(v || 0) * 100) / 100
  const principal        = r(f.principal)
  const interesOrdinario = r(f.interesOrdinario)
  const gastos           = r(f.gastos)
  const totalDemanda     = r(principal + interesOrdinario + gastos)

  await supabase.from('prestamos').update({
    estado: 'judicializado', judicializado: true,
    fecha_judicializacion: f.fecha, importe_demanda: totalDemanda,
    demanda_principal: principal, demanda_interes_ordinario: interesOrdinario, demanda_gastos: gastos,
  }).eq('id', props.prestamoId)
  // La judicialización no genera cobro: no hay entrada de dinero.
  // La fila J del calendario se construye desde los campos del préstamo (cobroJudicial computed).

  emit('update:modelValue', null)
  emit('ejecutado')
}

// ── Revertir judicialización ──────────────────
async function ejecutarRevertir() {
  // Los pagos a partícipes existentes son siempre de cuotas anteriores a la judicialización
  // y no están vinculados a ella, por lo que no impiden la reversión.
  await supabase.from('prestamos').update({
    estado: 'activo', judicializado: false,
    fecha_judicializacion: null, importe_demanda: null,
    demanda_principal: null, demanda_interes_ordinario: null, demanda_gastos: null,
  }).eq('id', props.prestamoId)

  emit('update:modelValue', null)
  emit('ejecutado')
}
</script>
