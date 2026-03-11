<template>
  <div class="modal-overlay" v-if="modelValue">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>💰 Amortización Parcial de Principal</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      <div class="modal-body">

        <div class="alert alert-warning" style="margin-bottom:16px">
          <span v-if="form.modalidad === 'misma_cuota'">
            El calendario se recalculará manteniendo la <strong>misma cuota mensual</strong>.
            Al reducirse el capital, el préstamo se <strong>acorta</strong> (menos cuotas).
          </span>
          <span v-else>
            El calendario se recalculará manteniendo la <strong>misma fecha de vencimiento</strong>.
            Las cuotas restantes <strong>bajarán de importe</strong> al reducirse el capital.
          </span>
        </div>

        <!-- Fecha + Modalidad -->
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Fecha de amortización <span class="req">*</span></label>
            <input class="form-control" type="date" v-model="form.fecha" @change="recalcular">
          </div>
          <div class="form-group">
            <label class="form-label">Modalidad de recálculo</label>
            <select class="form-control" v-model="form.modalidad">
              <option value="misma_cuota">Misma cuota → préstamo se acorta</option>
              <option value="misma_fecha">Misma fecha fin → cuotas bajan de importe</option>
            </select>
          </div>
        </div>

        <!-- Desglose -->
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">
          Desglose del cobro
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">

          <div class="form-group">
            <label class="form-label">
              Intereses ordinarios (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">calculado · editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesOrdinario">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">
              {{ diasDesdeUltimo }} días · {{ fmt(capitalPendiente) }} · {{ prestamo.interes_ordinario }}% / 12 / 30
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Intereses de demora (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">calculado · editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesDemora">
          </div>

          <div class="form-group">
            <label class="form-label">Principal amortizado (€) <span class="req">*</span></label>
            <input class="form-control" type="number" step="0.01" min="0"
              :max="capitalPendiente"
              v-model="form.principal">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">
              Capital pendiente actual: <strong>{{ fmt(capitalPendiente) }}</strong>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Gastos (€)</label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.gastos">
          </div>

        </div>

        <!-- Total cobro -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Total cobro amortización</div>
            <div style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent)">{{ fmt(total) }}</div>
          </div>
          <div style="font-size:11px;color:var(--text3);display:flex;gap:16px;flex-wrap:wrap">
            <span>Int. ordinarios: <strong style="color:var(--text2)">{{ fmt(+form.interesOrdinario||0) }}</strong></span>
            <span>Demora: <strong style="color:var(--text2)">{{ fmt(+form.interesDemora||0) }}</strong></span>
            <span>Principal: <strong style="color:var(--green)">{{ fmt(+form.principal||0) }}</strong></span>
            <span v-if="(+form.gastos||0)>0">Gastos: <strong style="color:var(--text2)">{{ fmt(+form.gastos||0) }}</strong></span>
          </div>
        </div>

        <!-- Preview recálculo -->
        <div v-if="(+form.principal||0) > 0 && previewCalendario.length"
          style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:14px">
          <div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
            Vista previa tras la amortización
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Capital anterior</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:600">{{ fmt(capitalPendiente) }}</div>
            </div>
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Capital nuevo</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:600;color:var(--green)">{{ fmt(nuevoCapital) }}</div>
            </div>
            <!-- misma_cuota: cuota igual, plazo más corto -->
            <template v-if="form.modalidad === 'misma_cuota'">
              <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
                <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Cuota (sin cambio)</div>
                <div style="font-family:var(--mono);font-size:15px;font-weight:600">{{ fmt(cuotaActual) }}</div>
              </div>
              <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
                <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Cuotas restantes</div>
                <div style="font-family:var(--mono);font-size:15px;font-weight:600;color:var(--green)">
                  {{ previewCalendario.length }}
                  <span style="font-size:11px;color:var(--text3);font-family:var(--sans)"> (antes {{ cuotasRestantesActuales }})</span>
                </div>
              </div>
            </template>
            <!-- misma_fecha: mismo número de cuotas, cuota más baja -->
            <template v-else>
              <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
                <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Cuotas (sin cambio)</div>
                <div style="font-family:var(--mono);font-size:15px;font-weight:600">{{ cuotasRestantesActuales }}</div>
              </div>
              <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
                <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Nueva cuota mensual</div>
                <div style="font-family:var(--mono);font-size:15px;font-weight:600;color:var(--green)">
                  {{ fmt(nuevaCuota) }}
                  <span style="font-size:11px;color:var(--text3);font-family:var(--sans)"> (antes {{ fmt(cuotaActual) }})</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" v-model="form.notas" rows="2"
            placeholder="Amortización parcial de principal"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="$emit('update:modelValue', false)">Cancelar</button>
        <button class="btn btn-registrar" :disabled="saving || !esValido" @click="ejecutar">
          <span v-if="saving" class="btn-spinner"></span>
          💰 Confirmar Amortización
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, generateCalendarioTeorico, uuid, today } from '../utils.js'

const props = defineProps({
  modelValue:          { type: Boolean, required: true },
  prestamoId:          { type: String,  required: true },
  prestamo:            { type: Object,  required: true },
  cobros:              { type: Array,   required: true },
  calendarioConEstado: { type: Array,   required: true },
})
const emit = defineEmits(['update:modelValue', 'ejecutado'])

const saving = ref(false)
const form   = ref(formVacio())

function formVacio() {
  return { fecha: today(), modalidad: 'misma_cuota', principal: 0, interesOrdinario: 0, interesDemora: 0, gastos: 0, notas: '' }
}

// ── Capital pendiente: importe original menos lo ya amortizado ─────────────
const capitalPendiente = computed(() => {
  const p       = props.prestamo
  const importe = Number(p.importe)

  // Amortizaciones parciales previas ya registradas
  const amortParcialPrevio = props.cobros
    .filter(c => c.tipo === 'amortizacion_parcial')
    .reduce((s, c) => s + Number(c.importe_principal || 0), 0)

  // Principal amortizado vía cuotas ordinarias (distribución secuencial)
  let amortCuotas = 0
  if (p.tipo_prestamo !== 'Americano') {
    const totalPagadoEnCuotas = props.cobros
      .filter(c => c.tipo === 'pago_cuota')
      .reduce((s, c) => s + Number(c.importe), 0)
    const cal = generateCalendarioTeorico(p, props.cobros)
    let restante = totalPagadoEnCuotas
    for (const cuota of cal) {
      if (restante <= 0) break
      const cobrado = Math.min(restante, cuota.total)
      restante -= cobrado
      const ratio = cuota.total > 0 ? Math.min(1, cobrado / cuota.total) : 0
      amortCuotas += cuota.principal * ratio
    }
    amortCuotas = Math.round(amortCuotas * 100) / 100
  }

  return Math.max(0, Math.round((importe - amortParcialPrevio - amortCuotas) * 100) / 100)
})

// ── Cuota actual (primera cuota no cobrada del calendario) ─────────────────
const cuotaActual = computed(() => {
  const pendiente = props.calendarioConEstado.find(c => c.estado !== 'cobrada')
  return pendiente?.total || 0
})

const cuotasRestantesActuales = computed(() =>
  props.calendarioConEstado.filter(c => c.estado !== 'cobrada').length
)

// ── Días desde el último vencimiento cobrado hasta la fecha de amortización ─
const diasDesdeUltimo = computed(() => {
  const fecha     = form.value.fecha || today()
  const fechaAmort = new Date(fecha + 'T00:00:00')
  const cobradas  = props.calendarioConEstado.filter(c => c.estado === 'cobrada')
  const fechaRef  = cobradas.length
    ? new Date(cobradas[cobradas.length - 1].fecha + 'T00:00:00')
    : new Date(props.prestamo.fecha_inicio + 'T00:00:00')
  return Math.max(0, Math.round((fechaAmort - fechaRef) / 86400000))
})

// ── Nuevo capital tras la amortización ────────────────────────────────────
const nuevoCapital = computed(() =>
  Math.max(0, Math.round((capitalPendiente.value - Number(form.value.principal || 0)) * 100) / 100)
)

// ── Nueva cuota para modalidad misma_fecha ───────────────────────────────
const nuevaCuota = computed(() => {
  if (nuevoCapital.value <= 0 || cuotasRestantesActuales.value <= 0) return 0
  const tipo = props.prestamo.tipo_prestamo
  const tasaAnual = Number(props.prestamo.interes_ordinario) / 100
  const periodicidad = (props.prestamo.periodicidad || 'mensual').toLowerCase()
  const tasaPeriodo = periodicidad === 'anual' ? tasaAnual
                    : periodicidad === 'trimestral' ? tasaAnual * 3 / 12
                    : tasaAnual / 12
  const n = cuotasRestantesActuales.value

  if (tipo === 'Americano') {
    // Cuota americana = solo intereses sobre nuevo capital
    return Math.round(nuevoCapital.value * tasaPeriodo * 100) / 100
  }
  // Francés: PMT
  if (tasaPeriodo > 0 && n > 0) {
    return Math.round(nuevoCapital.value * tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -n)) * 100) / 100
  }
  return n > 0 ? Math.round(nuevoCapital.value / n * 100) / 100 : 0
})

// ── Preview: longitud del nuevo calendario ────────────────────────────────
const previewCalendario = computed(() => {
  const principal = Number(form.value.principal || 0)
  if (principal <= 0 || nuevoCapital.value <= 0 || !form.value.fecha) return []
  const p    = props.prestamo
  const tipo = p.tipo_prestamo
  const periodicidad = (p.periodicidad || 'mensual').toLowerCase()
  const tasaPeriodo = periodicidad === 'anual' ? Number(p.interes_ordinario) / 100
                    : periodicidad === 'trimestral' ? Number(p.interes_ordinario) / 100 * 3 / 12
                    : Number(p.interes_ordinario) / 100 / 12

  if (form.value.modalidad === 'misma_fecha' || tipo === 'Americano') {
    // Misma fecha fin: mismo número de cuotas restantes
    return Array.from({ length: cuotasRestantesActuales.value }, (_, i) => i + 1)
  }

  // misma_cuota (Francés): n = -ln(1 - r×P/C) / ln(1+r)
  const cuota = cuotaActual.value
  if (cuota <= 0) return []
  if (tasaPeriodo > 0) {
    const ratio = tasaPeriodo * nuevoCapital.value / cuota
    if (ratio >= 1) return []
    const nCuotas = Math.ceil(-Math.log(1 - ratio) / Math.log(1 + tasaPeriodo))
    return Array.from({ length: nCuotas }, (_, i) => i + 1)
  }
  const nCuotas = Math.ceil(nuevoCapital.value / cuota)
  return Array.from({ length: nCuotas }, (_, i) => i + 1)
})

// ── Recalcular intereses automáticamente al cambiar fecha ─────────────────
function recalcular() {
  const p       = props.prestamo
  const fecha   = form.value.fecha || today()
  const dias    = diasDesdeUltimo.value
  const tasaAnual = Number(p.interes_ordinario) / 100

  // Intereses ordinarios: base 30 días fijos (coherente con cuota mensual = capital * tasa / 12)
  // cuota_mensual * (dias / 30)  →  capital * tasaAnual / 12 * dias / 30
  form.value.interesOrdinario = Math.round(capitalPendiente.value * tasaAnual / 12 * dias / 30 * 100) / 100

  // Intereses de demora: cuotas vencidas y no cobradas
  const tasaDemora = Number(p.interes_demora) / 100
  const fechaRef   = new Date(fecha + 'T00:00:00')
  form.value.interesDemora = Math.round(
    props.calendarioConEstado
      .filter(c => (c.estado === 'pendiente' || c.estado === 'parcial') && new Date(c.fecha + 'T00:00:00') < fechaRef)
      .reduce((s, c) => {
        const dias = Math.max(0, Math.round((fechaRef - new Date(c.fecha + 'T00:00:00')) / 86400000))
        return s + Math.round(c.pendiente * tasaDemora / 365 * dias * 100) / 100
      }, 0)
    * 100) / 100
}

watch(() => props.modelValue, open => {
  if (open) { form.value = formVacio(); recalcular() }
})

// ── Total cobro ────────────────────────────────────────────────────────────
const total = computed(() => Math.round((
  Number(form.value.interesOrdinario || 0) +
  Number(form.value.interesDemora    || 0) +
  Number(form.value.principal        || 0) +
  Number(form.value.gastos           || 0)
) * 100) / 100)

const esValido = computed(() =>
  !!form.value.fecha &&
  Number(form.value.principal || 0) > 0 &&
  Number(form.value.principal) <= capitalPendiente.value + 0.01
)

// ── Ejecutar ───────────────────────────────────────────────────────────────
async function ejecutar() {
  if (!esValido.value || saving.value) return
  const principal = Number(form.value.principal)
  if (!confirm(`¿Confirmar amortización parcial de ${fmt(principal)} con fecha ${form.value.fecha}?`)) return

  saving.value = true
  try {
    const r  = v => Math.round(Number(v || 0) * 100) / 100
    const { error } = await supabase.from('cobros').insert({
      id:                        'CB' + uuid(),
      prestamo_id:               props.prestamoId,
      cuota_num:                 'AP' + form.value.fecha.replace(/-/g, ''),
      fecha_teorica:             form.value.fecha,
      fecha_real:                form.value.fecha,
      importe:                   r(total.value),
      importe_principal:         r(form.value.principal),
      importe_interes_ordinario: r(form.value.interesOrdinario),
      importe_interes_demora:    r(form.value.interesDemora),
      importe_gastos:            r(form.value.gastos),
      tipo:                      'amortizacion_parcial',
      modalidad_recalculo:        form.value.modalidad,
      notas:                     form.value.notas || `Amortización parcial: ${fmt(r(form.value.principal))} de principal`,
    })
    if (error) { alert('Error al guardar: ' + error.message); return }
    emit('update:modelValue', false)
    emit('ejecutado')
  } finally {
    saving.value = false
  }
}
</script>
