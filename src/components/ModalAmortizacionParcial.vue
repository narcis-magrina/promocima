<template>
  <div class="modal-overlay" v-if="modelValue">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>💰 Amortización Parcial de Principal</h2>
        <button class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      <div class="modal-body">

        <div class="alert alert-info" style="margin-bottom:16px">
          Se cancelará este préstamo y se creará uno nuevo con el capital restante,
          la misma fecha de vencimiento y las cuotas reducidas.
        </div>

        <!-- Fecha -->
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Fecha de amortización <span class="req">*</span></label>
            <input class="form-control" type="date" v-model="form.fecha" @change="recalcular">
          </div>
        </div>

        <!-- Desglose -->
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">
          Desglose del cobro
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">

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
            <label class="form-label">
              Intereses ordinarios (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">calculado · editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesOrdinario">
            <div style="font-size:11px;color:var(--text3);margin-top:3px">
              Intereses de
              <template v-if="desglosePeriodo.meses > 0">{{ desglosePeriodo.meses }} mes{{ desglosePeriodo.meses > 1 ? 'es' : '' }}<template v-if="desglosePeriodo.dias > 0"> y {{ desglosePeriodo.dias }} día{{ desglosePeriodo.dias > 1 ? 's' : '' }}</template></template><template v-else>{{ desglosePeriodo.dias }} día{{ desglosePeriodo.dias !== 1 ? 's' : '' }}</template>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Intereses de demora (€)
              <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:6px">editable</span>
            </label>
            <input class="form-control" type="number" step="0.01" min="0" v-model="form.interesDemora">
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

        <!-- Preview préstamo sucesor -->
        <div v-if="nuevoCapital > 0"
          style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:14px">
          <div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
            Nuevo préstamo generado
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
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Cuotas restantes</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:600">{{ cuotasRestantes }}</div>
            </div>
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px">
              <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Nueva cuota</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:600;color:var(--green)">{{ fmt(nuevaCuota) }}</div>
            </div>
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
import { fmt, generateCalendarioTeorico, distribuirCobros, uuid, today } from '../utils.js'

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
  return { fecha: today(), principal: 0, interesOrdinario: 0, interesDemora: 0, gastos: 0, notas: '' }
}

// ── Capital pendiente ────────────────────────────────────────────────────────
// Americano: importe directo (sin APs embebidas).
// Francés: importe menos principal amortizado via cuotas cobradas.
const capitalPendiente = computed(() => {
  const p = props.prestamo
  if (p.tipo_prestamo === 'Americano') return Number(p.importe)
  const cal = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, props.cobros)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - amortCuotas) * 100) / 100)
})

// ── Nuevo capital del préstamo sucesor ────────────────────────────────────────
const nuevoCapital = computed(() =>
  Math.max(0, Math.round((capitalPendiente.value - Number(form.value.principal || 0)) * 100) / 100)
)

// ── Cuotas restantes (para preview nueva cuota) ───────────────────────────────
const cuotasRestantes = computed(() =>
  props.calendarioConEstado.filter(c => c.estado !== 'cobrada').length
)

// ── Nueva cuota mensual del préstamo sucesor ──────────────────────────────────
const nuevaCuota = computed(() => {
  if (nuevoCapital.value <= 0 || cuotasRestantes.value <= 0) return 0
  const tipo     = props.prestamo.tipo_prestamo
  const tasa     = Number(props.prestamo.interes_ordinario) / 100
  const tasaMes  = (props.prestamo.periodicidad || 'mensual') === 'anual' ? tasa
                 : (props.prestamo.periodicidad || 'mensual') === 'trimestral' ? tasa * 3 / 12
                 : tasa / 12
  const n = cuotasRestantes.value
  if (tipo === 'Americano') return Math.round(nuevoCapital.value * tasaMes * 100) / 100
  if (tasaMes > 0 && n > 0)
    return Math.round(nuevoCapital.value * tasaMes / (1 - Math.pow(1 + tasaMes, -n)) * 100) / 100
  return n > 0 ? Math.round(nuevoCapital.value / n * 100) / 100 : 0
})

// ── Fecha de referencia para cálculo de intereses ────────────────────────────
const fechaUltimaCobrada = computed(() => {
  const cobradas = props.calendarioConEstado.filter(c => c.estado === 'cobrada' || c.estado === 'parcial')
  return cobradas.length ? cobradas[cobradas.length - 1].fecha : props.prestamo.fecha_inicio
})

// ── Pendiente de cuota parcial previa ────────────────────────────────────────
const importePendienteCuotaPartial = computed(() => {
  const fecha   = form.value.fecha || today()
  const parcial = props.calendarioConEstado
    .filter(c => c.estado === 'parcial' && c.fecha <= fecha).slice(-1)[0]
  return parcial ? (parcial.pendiente || 0) : 0
})

// ── Desglose meses/días para el hint ─────────────────────────────────────────
const desglosePeriodo = computed(() => {
  const fecha  = form.value.fecha || today()
  const dRef   = new Date(fechaUltimaCobrada.value + 'T00:00:00')
  const dAmort = new Date(fecha + 'T00:00:00')
  let meses = (dAmort.getFullYear() - dRef.getFullYear()) * 12
            + (dAmort.getMonth()    - dRef.getMonth())
  if (dAmort.getDate() < dRef.getDate()) meses = Math.max(0, meses - 1)
  const dIni = new Date(dRef); dIni.setMonth(dIni.getMonth() + meses)
  const dias = Math.min(30, Math.max(0, Math.round((dAmort - dIni) / 86400000)))
  return { meses, dias }
})

// ── Recalcular intereses al cambiar fecha ─────────────────────────────────────
function recalcular() {
  const p       = props.prestamo
  const tasaAnual = Number(p.interes_ordinario) / 100
  const r       = v => Math.round(v * 100) / 100
  const { meses, dias } = desglosePeriodo.value

  // Meses enteros
  let interesesMeses = 0
  if (p.tipo_prestamo === 'Americano') {
    interesesMeses = r(capitalPendiente.value * tasaAnual / 12 * meses)
  } else {
    let s = capitalPendiente.value
    const tasaMes = tasaAnual / 12
    const pmt = props.calendarioConEstado.find(c => c.estado !== 'cobrada')?.total || 0
    for (let m = 0; m < meses; m++) {
      if (s <= 0.005) break
      const intMes = r(s * tasaMes)
      interesesMeses = r(interesesMeses + intMes)
      s = r(s - (pmt > 0 ? r(Math.min(pmt - intMes, s)) : 0))
    }
  }

  // Días restantes
  let interesesDias = 0
  if (dias > 0) {
    let saldo = capitalPendiente.value
    if (p.tipo_prestamo !== 'Americano' && meses > 0) {
      const tasaMes = tasaAnual / 12
      const pmt = props.calendarioConEstado.find(c => c.estado !== 'cobrada')?.total || 0
      let s = capitalPendiente.value
      for (let m = 0; m < meses; m++) {
        if (s <= 0.005) break
        const intMes = r(s * tasaMes)
        s = r(s - (pmt > 0 ? r(Math.min(pmt - intMes, s)) : 0))
      }
      saldo = s
    }
    interesesDias = r(r(saldo * tasaAnual / 12) * dias / 30)
  }

  form.value.interesOrdinario = r(interesesMeses + interesesDias + importePendienteCuotaPartial.value)
  // Intereses de demora: siempre 0 por defecto, el usuario los introduce manualmente
}

watch(() => props.modelValue, open => { if (open) { form.value = formVacio(); recalcular() } })

// ── Total cobro ───────────────────────────────────────────────────────────────
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

// ── Ejecutar: 4 pasos atómicos ────────────────────────────────────────────────
async function ejecutar() {
  if (!esValido.value || saving.value) return
  const principal = Number(form.value.principal)
  if (!confirm(`¿Confirmar amortización parcial de ${fmt(principal)} con fecha ${form.value.fecha}?`)) return

  saving.value = true
  try {
    const rnd = v => Math.round(Number(v || 0) * 100) / 100
    const p   = props.prestamo
    const fecha = form.value.fecha

    // ── Paso 1: Cobro de cancelación en el préstamo original ──────────────────
    const { error: e1 } = await supabase.from('cobros').insert({
      id:                        'CB' + uuid(),
      empresa_id:                props.prestamo.empresa_id,
      prestamo_id:               props.prestamoId,
      cuota_num:                 'AP' + fecha.replace(/-/g, ''),
      fecha_teorica:             fecha,
      fecha_real:                fecha,
      importe:                   rnd(total.value),
      importe_principal:         rnd(principal),
      importe_interes_ordinario: rnd(form.value.interesOrdinario),
      importe_interes_demora:    rnd(form.value.interesDemora),
      importe_gastos:            rnd(form.value.gastos),
      tipo:                      'cancelacion',
      notas:                     form.value.notas || `Amortización parcial: ${fmt(rnd(principal))} de principal`,
    })
    if (e1) { alert('Error al registrar el cobro: ' + e1.message); return }

    // ── Paso 2: Cancelar el préstamo original ─────────────────────────────────
    const { error: e2 } = await supabase
      .from('prestamos')
      .update({ estado: 'cancelado', fecha_cancelacion: fecha })
      .eq('id', props.prestamoId)
    if (e2) { alert('Error al cancelar el préstamo: ' + e2.message); return }

    // ── Paso 3: Crear el préstamo sucesor ─────────────────────────────────────
    const diaAP  = new Date(fecha + 'T00:00:00').getDate()
    const { data: prestamosExistentes } = await supabase.from('prestamos').select('id')
    const numsP  = (prestamosExistentes || []).map(x => parseInt(x.id.replace(/\D/g, '')) || 0)
    const nuevoId = 'P' + String((numsP.length ? Math.max(...numsP) : 0) + 1).padStart(3, '0')
    const { error: e3 } = await supabase.from('prestamos').insert({
      id:                  nuevoId,
      empresa_id:          props.prestamo.empresa_id,
      origen_prestamo_id:  props.prestamoId,
      alias:               p.alias + ' (AP)',
      centro_coste:        p.centro_coste,
      cliente_id:          p.cliente_id,
      intermediario_id:    p.intermediario_id || null,
      garantia_tipo:       p.garantia_tipo,
      garantia_direccion:  p.garantia_direccion,
      garantia_tasacion:   p.garantia_tasacion,
      importe:             rnd(nuevoCapital.value),
      fecha_inicio:        fecha,
      dia_cobro:           diaAP,
      duracion_meses:      cuotasRestantes.value,
      interes_ordinario:   p.interes_ordinario,
      interes_demora:      p.interes_demora,
      tipo_prestamo:       p.tipo_prestamo,
      periodicidad:        p.periodicidad || 'mensual',
      meses_carencia:      p.meses_carencia || null,
      comision_apertura:   0,
      cirbe:               p.cirbe || false,
      estado:              'activo',
      judicializado:       false,
    })
    if (e3) { alert('Error al crear el préstamo sucesor: ' + e3.message); return }

    // ── Paso 4: Replicar CCPs activos con saldo proporcional ──────────────────
    const { data: ccps } = await supabase
      .from('contratos_ccp')
      .select('*')
      .eq('prestamo_id', props.prestamoId)
      .eq('activo', true)

    if (ccps && ccps.length > 0) {
      const fraccion = Number(p.importe) > 0 ? rnd(nuevoCapital.value) / Number(p.importe) : 0
      const { data: ccpsExistentes } = await supabase.from('contratos_ccp').select('id')
      const numsC = (ccpsExistentes || []).map(x => parseInt(x.id.replace(/\D/g, '')) || 0)
      let nextCCP = (numsC.length ? Math.max(...numsC) : 0) + 1
      const nuevosCCPs = ccps.map(ccp => ({
        id:                       'CCP' + String(nextCCP++).padStart(3, '0'),
        empresa_id:               props.prestamo.empresa_id,
        prestamo_id:              nuevoId,
        participe_id:             ccp.participe_id,
        porcentaje_participacion: ccp.porcentaje_participacion,
        importe_participacion:    rnd(Number(ccp.importe_participacion) * fraccion),
        porcentaje_gestion:       ccp.porcentaje_gestion,
        fecha_firma:              fecha,
        activo:                   true,
      }))
      const { error: e4 } = await supabase.from('contratos_ccp').insert(nuevosCCPs)
      if (e4) { alert('Error al crear los contratos CCP: ' + e4.message); return }
    }

    emit('update:modelValue', false)
    emit('ejecutado')
  } finally {
    saving.value = false
  }
}
</script>
