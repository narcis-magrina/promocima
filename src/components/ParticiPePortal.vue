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
            <tr v-for="c in contratos" :key="c.id" style="cursor:pointer" @click="emit('navigate', 'contratos-ccp', c.id)">
              <td style="font-weight:500">{{ c.prestamos?.alias || c.prestamo_id }}</td>
              <td class="td-mono td-right">{{ fmt(c.importe_participacion) }}</td>
              <td class="td-mono td-center">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ fmt(calcInteresNeto(c)) }}</td>
              <td><span v-html="getEstadoBadge(c.prestamos?.estado === 'cancelado' ? 'cancelado' : c.prestamos?.estado === 'judicializado' ? 'judicializado' : c.prestamos?.situacion || 'al_dia')" /></td>
              <td><span class="badge" :class="c.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="td-center">
                <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px"
                  @click="emit('navigate', 'contratos-ccp', c.id)">
                  Ver detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>


    </template>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtDate, getEstadoBadge , calcSituacionPrestamo } from '../utils.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({ participeId: { type: String, default: null } })
const emit = defineEmits(['navigate'])

const { participeId: authParticipeId, participeIds } = useAuth()
// Usar el participeId del prop si se pasa, si no usar el del auth
const participeIdActivo = computed(() => props.participeId || authParticipeId.value)

const contratos  = ref([])
const pagos      = ref([])
const loading    = ref(true)


onMounted(cargar)
watch(() => props.participeId, cargar)
watch(participeIds, cargar)

async function cargar() {
  const pid = participeIdActivo.value
  if (!pid) { loading.value = false; return }
  loading.value = true
  try {
    // 1. Load contratos first to get their IDs
    const { data: cc } = await supabase
      .from('contratos_ccp')
      .select('*, prestamos(id, alias, estado, interes_ordinario, importe, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad)')
      .eq('participe_id', pid)
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



function calcInteresNeto(c) {
  if (!c.prestamos) return 0
  const bruto = (Number(c.importe_participacion) * Number(c.prestamos.interes_ordinario) / 100 / 12)
    * (1 - Number(c.porcentaje_gestion) / 100)
  return Math.round(bruto * (1 - 0.19) * 100) / 100
}


</script>
