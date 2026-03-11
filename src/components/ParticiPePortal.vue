<template>
  <div>
    <!-- KPIs resumen -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="kpi-card kc-yellow">
        <div class="kpi-label">Importe Participado</div>
        <div class="kpi-value">{{ fmtInt(totalActivo) }}</div>
        <div class="kpi-sub">{{ contratosActivos.length }} contrato{{ contratosActivos.length !== 1 ? 's' : '' }} activo{{ contratosActivos.length !== 1 ? 's' : '' }}</div>
      </div>
      <div class="kpi-card kc-green">
        <div class="kpi-label">Total Cobrado</div>
        <div class="kpi-value">{{ fmtInt(totalCobrado) }}</div>
        <div class="kpi-sub">pagos realizados</div>
      </div>
      <div class="kpi-card kc-orange">
        <div class="kpi-label">Devengado Pendiente</div>
        <div class="kpi-value">{{ fmtInt(totalDevengado) }}</div>
        <div class="kpi-sub">{{ nDevengados }} pago{{ nDevengados !== 1 ? 's' : '' }} por cobrar</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Total Cobrado</div>
        <div class="kpi-value" style="font-size:15px">{{ fmt(totalCobrado) }}</div>
        <div class="kpi-sub" v-if="proximoPago">{{ fmt(proximoPago.importe_neto) }} neto</div>
      </div>
    </div>

    <!-- Contratos -->
    <div class="section-header" style="margin-bottom:14px">
      <div>
        <div class="section-title">Mis Contratos CCP</div>
        <div class="section-sub">Participaciones activas en préstamos</div>
      </div>
    </div>

    <div v-if="loading" style="color:var(--text3);padding:20px">Cargando…</div>
    <div v-else-if="!contratos.length" class="table-empty" style="margin-bottom:20px">
      No hay contratos CCP asociados a tu perfil.
    </div>

    <template v-else>
      <!-- Tabla contratos -->
      <div class="table-card" style="margin-bottom:20px">
        <div class="table-header"><h3>Contratos ({{ contratos.length }})</h3></div>
        <table>
          <thead>
            <tr>
              <th>Préstamo</th>
              <th style="text-align:right">Importe Participado</th>
              <th style="text-align:center">% Part.</th>
              <th style="text-align:right">Neto/mes</th>
              <th>Estado préstamo</th>
              <th>Estado contrato</th>
              <th style="text-align:center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratos" :key="c.id">
              <td style="font-weight:500">{{ c.prestamos?.alias || c.prestamo_id }}</td>
              <td class="td-mono td-right">{{ fmt(c.importe_participacion) }}</td>
              <td class="td-mono td-center">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ fmt(calcInteresNeto(c)) }}</td>
              <td><span v-html="getEstadoBadge(c.prestamos?.estado === 'cancelado' ? 'cancelado' : c.prestamos?.estado === 'judicializado' ? 'judicializado' : c.prestamos?.situacion || 'al_dia')" /></td>
              <td><span class="badge" :class="c.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="td-center">
                <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px"
                  @click="contratoSeleccionado = contratoSeleccionado?.id === c.id ? null : c">
                  {{ contratoSeleccionado?.id === c.id ? '▲ Ocultar' : '▼ Ver pagos' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detalle pagos del contrato seleccionado -->
      <div v-if="contratoSeleccionado" class="table-card">
        <div class="table-header">
          <h3>Pagos — {{ contratoSeleccionado.prestamos?.alias }}</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th style="text-align:right">Bruto</th>
              <th style="text-align:right">IRPF (19%)</th>
              <th style="text-align:right">Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pagosContrato" :key="p.id">
              <td style="font-size:12px">{{ fmtDate(p.fecha_pago_real) }}</td>
              
              <td class="td-mono td-right">{{ fmt(p.importe_bruto) }}</td>
              <td class="td-mono td-right" style="color:var(--red)">{{ fmt(p.importe_retencion) }}</td>
              <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmt(p.importe_neto) }}</td>
              <td>
                <span class="badge badge-outline-green">
                  Pagado
                </span>
              </td>
            </tr>
            <tr v-if="!pagosContrato.length">
              <td colspan="6" class="table-empty">Sin pagos registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Mis Datos Personales (única sección editable) -->
    <div class="table-card" style="margin-top:20px">
      <div class="table-header"><h3>Mis Datos de Contacto</h3></div>
      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:500px">
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-control" type="tel" v-model="formDatos.telefono" placeholder="Teléfono de contacto">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" type="email" v-model="formDatos.email" placeholder="Email de contacto">
        </div>
        <div style="grid-column:span 2;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-primary" :disabled="guardandoDatos" @click="guardarDatos">
            <span v-if="guardandoDatos" class="btn-spinner"></span>
            Guardar datos de contacto
          </button>
        </div>
        <div v-if="msgDatos" style="grid-column:span 2;font-size:12px;color:var(--green)">{{ msgDatos }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtDate, getEstadoBadge , calcSituacionPrestamo } from '../utils.js'
import { useAuth } from '../composables/useAuth.js'

const { participeId, participeIds } = useAuth()

const contratos  = ref([])
const pagos      = ref([])   // todos los pagos de todos los contratos del partícipe
const loading    = ref(true)
const contratoSeleccionado = ref(null)

onMounted(cargar)
watch(participeIds, cargar)

async function cargar() {
  if (!participeIds.value.length) { loading.value = false; return }
  loading.value = true
  try {
    // 1. Load contratos first to get their IDs
    const { data: cc } = await supabase
      .from('contratos_ccp')
      .select('*, prestamos(id, alias, estado, interes_ordinario, importe, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad)')
      .in('participe_id', participeIds.value)
      .order('fecha_firma')
    // Cargar cobros para calcular situacion real de cada préstamo
    const prestamoIds = [...new Set((cc || []).map(c => c.prestamo_id).filter(Boolean))]
    let cobrosPortal = []
    if (prestamoIds.length) {
      const { data: cbp } = await supabase
        .from('cobros')
        .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo')
        .in('prestamo_id', prestamoIds)
      cobrosPortal = cbp || []
    }
    contratos.value = (cc || []).map(c => {
      const pr = c.prestamos
      if (!pr) return c
      const cobrosP = cobrosPortal.filter(cb => cb.prestamo_id === pr.id)
      return { ...c, prestamos: { ...pr, situacion: calcSituacionPrestamo(pr, cobrosP) } }
    })

    // 2. Load all payments for those contracts
    const ccpIds = contratos.value.map(c => c.id)
    if (ccpIds.length) {
      const { data: pg } = await supabase
        .from('pagos_reales_participe')
        .select('*')
        .in('contrato_ccp_id', ccpIds)
        .order('fecha_pago_real', { ascending: false })
      pagos.value = pg || []
    } else {
      pagos.value = []
    }
  } finally {
    loading.value = false
  }
}

// ── Computed ───────────────────────────────────
const contratosActivos = computed(() => contratos.value.filter(c => c.activo))
const totalActivo      = computed(() => contratosActivos.value.reduce((s, c) => s + Number(c.importe_participacion), 0))
// Nueva arquitectura: todos los registros en pagos_reales_participe son pagos reales
const totalCobrado     = computed(() => pagos.value.reduce((s, p) => s + Number(p.importe_neto), 0))
const totalDevengado   = computed(() => 0)  // Calculado virtualmente — no almacenado
const nDevengados      = computed(() => 0)

const proximoPago = computed(() => {
  // Sin devengados almacenados: no hay próximo pago predecible desde aquí
  return null
})

const pagosContrato = computed(() => {
  if (!contratoSeleccionado.value) return []
  return pagos.value.filter(p => p.contrato_ccp_id === contratoSeleccionado.value.id)
})

function calcInteresNeto(c) {
  if (!c.prestamos) return 0
  const bruto = (Number(c.importe_participacion) * Number(c.prestamos.interes_ordinario) / 100 / 12)
    * (1 - Number(c.porcentaje_gestion) / 100)
  return Math.round(bruto * (1 - 0.19) * 100) / 100
}

// ── Datos personales editables ─────────────────
const formDatos     = ref({ telefono: '', email: '' })
const guardandoDatos = ref(false)
const msgDatos      = ref('')

// Cargar datos personales del partícipe
async function cargarDatosPropios() {
  if (!participeId.value) return  // usa primer partícipe para datos personales
  const { data } = await supabase
    .from('participes').select('telefono, email').eq('id', participeId.value).single()
  if (data) {
    formDatos.value.telefono = data.telefono || ''
    formDatos.value.email    = data.email    || ''
  }
}

onMounted(cargarDatosPropios)
watch(participeIds, cargarDatosPropios)

async function guardarDatos() {
  if (guardandoDatos.value) return
  guardandoDatos.value = true
  msgDatos.value = ''
  try {
    const { error } = await supabase
      .from('participes')
      .update({ telefono: formDatos.value.telefono, email: formDatos.value.email })
      .eq('id', participeId.value)
    if (error) { alert('Error al guardar: ' + error.message); return }
    msgDatos.value = '✓ Datos guardados correctamente'
    setTimeout(() => { msgDatos.value = '' }, 3000)
  } finally {
    guardandoDatos.value = false
  }
}
</script>
