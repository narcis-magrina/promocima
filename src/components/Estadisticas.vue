<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Estadísticas de Dirección</div>
        <div class="section-sub">Solo lectura · Calculado dinámicamente</div>
      </div>
    </div>

    <div v-if="loading" class="table-empty">Cargando...</div>
    <template v-else>
      <div class="kpi-grid">
        <div class="kpi-card kc-yellow">
          <div class="kpi-label">Capital Desplegado</div>
          <div class="kpi-value">{{ fmt(capitalActivo) }}</div>
          <div class="kpi-sub">{{ activos.length }} préstamos activos</div>
        </div>
        <div class="kpi-card kc-blue">
          <div class="kpi-label">LTV Medio Cartera</div>
          <div class="kpi-value">{{ ltvMedio }}%</div>
          <div class="kpi-sub">Máximo permitido: 40%</div>
        </div>
        <div class="kpi-card kc-green">
          <div class="kpi-label">Rentabilidad Media</div>
          <div class="kpi-value">{{ rentabilidadMedia }}%</div>
          <div class="kpi-sub">Interés ordinario ponderado</div>
        </div>
        <div class="kpi-card kc-red">
          <div class="kpi-label">Judicializados</div>
          <div class="kpi-value">{{ judicializados.length }}</div>
          <div class="kpi-sub">{{ total ? ((judicializados.length / total) * 100).toFixed(0) : 0 }}% del total</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <!-- Métricas clave -->
        <div class="table-card" style="margin:0">
          <div class="table-header"><h3>Métricas Clave</h3></div>
          <table>
            <tbody>
              <tr v-for="m in metricas" :key="m.label">
                <td style="color:var(--text2);font-size:13px">{{ m.label }}</td>
                <td class="td-mono td-right" style="font-weight:600;font-size:13px">{{ m.valor }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Distribución por estado -->
        <div class="table-card" style="margin:0">
          <div class="table-header"><h3>Distribución por Estado</h3></div>
          <table>
            <thead><tr><th>Estado</th><th>Préstamos</th><th style="text-align:right">Capital</th><th>%</th></tr></thead>
            <tbody>
              <tr v-for="row in distribucion" :key="row.est">
                <td v-html="getEstadoBadge(row.est)" />
                <td class="td-center">{{ row.count }}</td>
                <td class="td-mono td-right">{{ fmt(row.capital) }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="flex:1">
                      <div class="progress-fill" :style="{ width: row.pct + '%', background: row.color }" />
                    </div>
                    <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, getEstadoBadge, generateCalendarioTeorico, distribuirCobros, calcSituacionPrestamo, today } from '../utils.js'

const loading = ref(true)
const prestamos = ref([])
const clientes  = ref([])
const todosCobros = ref([])

onMounted(async () => {
  const [{ data: p }, { data: c }, { data: cb }] = await Promise.all([
    supabase.from('prestamos').select('*, garantias(valor_tasacion)'),
    supabase.from('clientes').select('id, tipo'),
    supabase.from('cobros').select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo').range(0, 9999),
  ])
  prestamos.value   = p || []
  clientes.value    = c || []
  todosCobros.value = cb || []
  loading.value     = false
})

const total = computed(() => prestamos.value.length)
const activos = computed(() => prestamos.value.filter(p => p.estado !== 'cancelado'))
const judicializados = computed(() => prestamos.value.filter(p => p.judicializado))
const alDia = computed(() => prestamos.value.filter(p => {
  if (p.estado !== 'activo') return false
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  return calcSituacionPrestamo(p, cobrosP) === 'al_dia'
}))
const conRetraso = computed(() => prestamos.value.filter(p => {
  if (p.estado !== 'activo') return false
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  return calcSituacionPrestamo(p, cobrosP) === 'con_retraso'
}))
const cancelados = computed(() => prestamos.value.filter(p => p.estado === 'cancelado'))

const capitalActivo = computed(() => activos.value.reduce((s, p) => s + Number(p.importe), 0))

const ltvMedio = computed(() => {
  const vals = activos.value.filter(p => p.garantias).map(p => Number(p.importe) / Number(p.garantias.valor_tasacion) * 100)
  if (!vals.length) return 0
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

const rentabilidadMedia = computed(() => {
  if (!activos.value.length) return 0
  return (activos.value.reduce((s, p) => s + Number(p.interes_ordinario), 0) / activos.value.length).toFixed(2)
})

const distribucion = computed(() => [
  { est: 'al_dia',        label: 'Al día',        color: 'var(--green)'  },
  { est: 'con_retraso',   label: 'Con retraso',   color: 'var(--orange)' },
  { est: 'judicializado', label: 'Judicializado', color: 'var(--red)'    },
  { est: 'cancelado',     label: 'Cancelado',     color: 'var(--text3)'  },
].map(row => {
  let ps
  if (row.est === 'al_dia' || row.est === 'con_retraso') {
    ps = prestamos.value.filter(p => {
      if (p.estado !== 'activo') return false
      const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
      return calcSituacionPrestamo(p, cobrosP) === row.est
    })
  } else {
    ps = prestamos.value.filter(p => p.estado === row.est)
  }
  return { ...row, count: ps.length, capital: ps.reduce((s, p) => s + Number(p.importe), 0), pct: total.value ? Math.round(ps.length / total.value * 100) : 0 }
}))

const metricas = computed(() => [
  ['% Préstamos Activos', `${total.value ? ((activos.value.length / total.value) * 100).toFixed(0) : 0}%`],
  ['% Cancelados', `${total.value ? ((cancelados.value.length / total.value) * 100).toFixed(0) : 0}%`],
  ['% Al día (sobre activos)', `${activos.value.length ? ((alDia.value.length / activos.value.length) * 100).toFixed(0) : 0}%`],
  ['% Con retraso (sobre activos)', `${activos.value.length ? ((conRetraso.value.length / activos.value.length) * 100).toFixed(0) : 0}%`],
  ['% Judicializados (sobre total)', `${total.value ? ((judicializados.value.length / total.value) * 100).toFixed(0) : 0}%`],
  ['Total Clientes', `${clientes.value.length}`],
  ['Empresas / Personas', `${clientes.value.filter(c => c.tipo === 'empresa').length} / ${clientes.value.filter(c => c.tipo === 'persona').length}`],
].map(([label, valor]) => ({ label, valor })))
</script>
