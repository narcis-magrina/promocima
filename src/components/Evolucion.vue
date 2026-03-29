<template>
  <div>
    <div v-if="loading" class="table-empty">Cargando...</div>
    <div v-else>

      <!-- Pestañas principales -->
      <div class="tabs" style="margin-bottom:20px">
        <div class="tab" :class="{ active: tabActivo === 'inversion' }" @click="tabActivo = 'inversion'">📈 Inversión en curso</div>
        <div class="tab" :class="{ active: tabActivo === 'ingresos' }"  @click="tabActivo = 'ingresos'">💰 Ingresos</div>
      </div>

      <!-- ══════════════════ TAB: EVOLUCIÓN INVERSIÓN ══════════════════ -->
      <div v-if="tabActivo === 'inversion'">

        <!-- Gráfico 1: Inversión en Curso (capital vivo) -->
        <div class="table-card" style="padding:20px;margin-bottom:14px">
          <div class="table-header" style="margin-bottom:16px">
            <h3>Inversión en Curso</h3>
            <div style="display:flex;gap:8px;align-items:center">
              <label style="font-size:12px;color:var(--text3)">Granularidad</label>
              <select class="form-control" style="width:auto;font-size:12px" v-model="granularidadInvCurso">
                <option value="mes">Mensual</option>
                <option value="trimestre">Trimestral</option>
                <option value="año">Anual</option>
              </select>
              <button class="btn btn-secondary" style="font-size:12px;padding:4px 12px" @click="exportarInversionEnCursoExcel">↓ Excel</button>
            </div>
          </div>
          <Line :data="chartInversionEnCursoData" :options="chartOptionsInversionEnCurso" style="max-height:380px" />
        </div>

        <!-- KPIs inversión en curso -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">
          <div class="kpi-card kc-blue">
            <div class="kpi-label">Particulares</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Actual</span>
                <span class="kpi-row-val" style="font-size:15px;font-weight:600">{{ fmtN(actualCursoParticulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCursoParticulares }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso1.particulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso1Particulares }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior2 }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso2.particulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso2Particulares }}%</span>
              </div>
            </div>
          </div>
          <div class="kpi-card kc-green">
            <div class="kpi-label">Empresas — parte propia</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Actual</span>
                <span class="kpi-row-val" style="font-size:15px;font-weight:600">{{ fmtN(actualCursoEmpresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCursoEmpresasPropias }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso1.empresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso1EmpresasPropias }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior2 }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso2.empresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso2EmpresasPropias }}%</span>
              </div>
            </div>
          </div>
          <div class="kpi-card kc-orange">
            <div class="kpi-label">Empresas — parte participada</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Actual</span>
                <span class="kpi-row-val" style="font-size:15px;font-weight:600">{{ fmtN(actualCursoEmpresasParticipadas) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCursoEmpresasParticipadas }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso1.empresasParticipadas) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso1EmpresasParticipadas }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">Cierre {{ anoAnterior2 }}</span>
                <span class="kpi-row-val">{{ fmtN(cierreCurso2.empresasParticipadas) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctCierreCurso2EmpresasParticipadas }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Movimientos (altas y bajas) -->
        <div v-if="altasBajasVisibles.movimientos.length"
             class="table-card" style="padding:20px;margin-top:14px">
          <div style="font-weight:600;margin-bottom:10px">Movimientos</div>
          <table class="table" style="font-size:13px">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Préstamo</th>
                <th class="text-right">Importe</th>
                <th class="text-right">Interés</th>
                <th class="text-right">Gestión</th>
                <th class="text-right">Apertura</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in altasBajasVisibles.movimientos" :key="p._tipo+'-inv-'+p.id">
                <td>{{ fmtDate(p._fecha) }}</td>
                <td :style="p._tipo === 'alta' ? 'color:var(--green);font-weight:600' : 'color:var(--red);font-weight:600'">
                  {{ p._tipo === 'alta' ? '▲ Alta' : '▼ Baja' }}
                </td>
                <td>{{ p.alias || p.centro_coste || '—' }}</td>
                <td class="text-right">{{ fmtN(p.importe) }} €</td>
                <td class="text-right">{{ Number(p.interes_ordinario || 0).toFixed(2) }}%</td>
                <td class="text-right">{{ gestionPctPorPrestamo[p.id] ? gestionPctPorPrestamo[p.id].toFixed(2) + '%' : '—' }}</td>
                <td class="text-right">{{ p.comision_apertura ? p.comision_apertura + '%' : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div><!-- /tab inversion -->

      <!-- ══════════════════ TAB: EVOLUCIÓN INGRESOS ══════════════════ -->
      <div v-if="tabActivo === 'ingresos'">

        <!-- Gráfico 3: Evolución de Ingresos -->
        <div class="table-card" style="padding:20px;margin-bottom:14px">
          <div class="table-header" style="margin-bottom:16px">
            <h3>Evolución de Ingresos</h3>
            <div style="display:flex;gap:8px;align-items:center">
              <label style="font-size:12px;color:var(--text3)">Granularidad</label>
              <select class="form-control" style="width:auto;font-size:12px" v-model="granularidadIng">
                <option value="mes">Mensual</option>
                <option value="trimestre">Trimestral</option>
                <option value="año">Anual</option>
              </select>
              <button class="btn btn-secondary" style="font-size:12px;padding:4px 12px" @click="exportarIngresosExcel">↓ Excel</button>
            </div>
          </div>
          <Line :data="chartIngresosData" :options="chartOptionsIngresos" style="max-height:380px" />
        </div>

        <!-- KPIs ingresos por ejercicio -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">

          <div class="kpi-card kc-blue">
            <div class="kpi-label">Intereses particulares</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoActual }} (YTD)</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioActual.intParticulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngParticulares }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">LTM</span>
                <span class="kpi-row-val">{{ fmtN(ingLTM.intParticulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngLTMParticulares }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioAnterior.intParticulares) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngParticularesPrev }}%</span>
              </div>
            </div>
          </div>

          <div class="kpi-card kc-green">
            <div class="kpi-label">Intereses empresas propios</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoActual }} (YTD)</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioActual.intEmpresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngEmpresasPropias }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">LTM</span>
                <span class="kpi-row-val">{{ fmtN(ingLTM.intEmpresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngLTMEmpresasPropias }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioAnterior.intEmpresasPropias) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngEmpresasPropiasPrev }}%</span>
              </div>
            </div>
          </div>

          <div class="kpi-card kc-orange">
            <div class="kpi-label">Ingresos por gestión</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoActual }} (YTD)</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioActual.gestion) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngGestion }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">LTM</span>
                <span class="kpi-row-val">{{ fmtN(ingLTM.gestion) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngLTMGestion }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioAnterior.gestion) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngGestionPrev }}%</span>
              </div>
            </div>
          </div>

          <div class="kpi-card kc-purple">
            <div class="kpi-label">Comisiones de apertura</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoActual }} (YTD)</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioActual.apertura) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngApertura }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">LTM</span>
                <span class="kpi-row-val">{{ fmtN(ingLTM.apertura) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngLTMApertura }}%</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span style="color:var(--text3)">{{ anoAnterior }}</span>
                <span class="kpi-row-val">{{ fmtN(ingEjercicioAnterior.apertura) }}</span>
              </div>
              <div class="kpi-row">
                <span style="color:var(--text3)">% sobre total</span>
                <span class="kpi-row-val">{{ pctIngAperturaPrev }}%</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Movimientos (altas y bajas) -->
        <div v-if="altasBajasVisibles.movimientos.length"
             class="table-card" style="padding:20px;margin-top:14px">
          <div style="font-weight:600;margin-bottom:10px">Movimientos</div>
          <table class="table" style="font-size:13px">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Préstamo</th>
                <th class="text-right">Importe</th>
                <th class="text-right">Interés</th>
                <th class="text-right">Gestión</th>
                <th class="text-right">Apertura</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in altasBajasVisibles.movimientos" :key="p._tipo+'-'+p.id">
                <td>{{ fmtDate(p._fecha) }}</td>
                <td :style="p._tipo === 'alta' ? 'color:var(--green);font-weight:600' : 'color:var(--red);font-weight:600'">
                  {{ p._tipo === 'alta' ? '▲ Alta' : '▼ Baja' }}
                </td>
                <td>{{ p.alias || p.centro_coste || '—' }}</td>
                <td class="text-right">{{ fmtN(p.importe) }} €</td>
                <td class="text-right">{{ Number(p.interes_ordinario || 0).toFixed(2) }}%</td>
                <td class="text-right">{{ gestionPctPorPrestamo[p.id] ? gestionPctPorPrestamo[p.id].toFixed(2) + '%' : '—' }}</td>
                <td class="text-right">{{ p.comision_apertura ? p.comision_apertura + '%' : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div><!-- /tab ingresos -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement, Filler,
  Title, Tooltip, Legend
} from 'chart.js'
import { supabase } from '../supabase.js'
import { fmtN, fmtDate, today, generateCalendarioTeorico, distribuirCobros } from '../utils.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend)

const loading          = ref(true)
const prestamosRaw     = ref([])
const ccpRaw           = ref([])
const cobrosRaw        = ref([])   // cobros con principal cobrado (para capital vivo)
const tabActivo        = ref('inversion')
const granularidadInv      = ref('mes')
const granularidadInvCurso = ref('mes')
const granularidadIng      = ref('mes')

async function fetchAllCobros() {
  const PAGE = 1000
  let from = 0, all = []
  while (true) {
    const { data, error } = await supabase
      .from('cobros')
      .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal')
      .range(from, from + PAGE - 1)
    if (error) throw error
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

onMounted(async () => {
  const [{ data: p }, { data: cl }, { data: ccp }, cobros] = await Promise.all([
    supabase.from('prestamos').select('id, alias, centro_coste, importe, fecha_inicio, fecha_cancelacion, estado, cliente_id, interes_ordinario, comision_apertura, tipo_prestamo, duracion_meses, dia_cobro, periodicidad, meses_carencia'),
    supabase.from('clientes').select('id, tipo'),
    supabase.from('contratos_ccp').select('prestamo_id, importe_participacion, porcentaje_gestion'),
    fetchAllCobros(),
  ])
  const clientesMap = Object.fromEntries((cl || []).map(x => [x.id, x.tipo?.toLowerCase() || '']))
  prestamosRaw.value = (p || []).map(x => ({ ...x, tipoCliente: clientesMap[x.cliente_id] || '' }))
  ccpRaw.value       = ccp    || []
  cobrosRaw.value    = cobros || []
  loading.value = false
})

// ── Años de referencia ────────────────────────────────────────────────────────
const anoActual    = Number(today().slice(0, 4))
const anoAnterior  = anoActual - 1
const anoAnterior2 = anoAnterior - 1

// ── Lookups por préstamo ──────────────────────────────────────────────────────
const participadoPorPrestamo = computed(() => {
  const map = {}
  for (const c of ccpRaw.value)
    map[c.prestamo_id] = (map[c.prestamo_id] || 0) + Number(c.importe_participacion || 0)
  return map
})

const gestionMensualPorPrestamo = computed(() => {
  const map = {}
  for (const c of ccpRaw.value)
    map[c.prestamo_id] = (map[c.prestamo_id] || 0) +
      Number(c.importe_participacion || 0) * (Number(c.porcentaje_gestion || 0) / 100) / 12
  return map
})

// % de gestión medio ponderado por préstamo (para mostrar en la tabla de altas/bajas)
const gestionPctPorPrestamo = computed(() => {
  const map = {}
  for (const c of ccpRaw.value) {
    if (!map[c.prestamo_id]) map[c.prestamo_id] = { importe: 0, ponderado: 0 }
    map[c.prestamo_id].importe    += Number(c.importe_participacion || 0)
    map[c.prestamo_id].ponderado  += Number(c.importe_participacion || 0) * Number(c.porcentaje_gestion || 0)
  }
  const result = {}
  for (const [id, v] of Object.entries(map))
    result[id] = v.importe > 0 ? v.ponderado / v.importe : 0
  return result
})

// ── Helpers de fecha ──────────────────────────────────────────────────────────
function mesesEntre(desde, hasta) {
  const meses = []
  let cur = new Date(desde.slice(0, 7) + '-01T00:00:00')
  const fin = new Date(hasta.slice(0, 7) + '-01T00:00:00')
  while (cur <= fin) {
    const y = cur.getFullYear()
    const m = cur.getMonth() + 1
    meses.push(`${y}-${String(m).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return meses
}

function ultimoDiaMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// ── Calendarios teóricos precalculados (para préstamos no Americanos) ─────────
const calendariosPorPrestamo = computed(() => {
  const map = {}
  for (const p of prestamosRaw.value) {
    if (p.tipo_prestamo !== 'Americano') {
      // Para préstamos cancelados, pasamos el estado como 'activo' para que
      // generateCalendarioTeorico no devuelva [] y podamos calcular capital vivo histórico
      const pCalc = p.estado === 'cancelado' ? { ...p, estado: 'activo' } : p
      map[p.id] = generateCalendarioTeorico(pCalc)
    }
  }
  return map
})

// ── Capital vivo de un préstamo en una fecha ──────────────────────────────────
// Americano: capital vivo = importe (sin amortización hasta vencimiento)
// Otros: usa distribuirCobros igual que Analítica para calcular el principal amortizado
function capitalVivoEnFecha(prestamo, fecha) {
  if (prestamo.tipo_prestamo === 'Americano') return Number(prestamo.importe)
  const cal = calendariosPorPrestamo.value[prestamo.id]
  if (!cal) return Number(prestamo.importe)
  const cobrosP = cobrosRaw.value.filter(c =>
    c.prestamo_id === prestamo.id && c.fecha_real && c.fecha_real <= fecha
  )
  const calConEstado = distribuirCobros(cal, cobrosP)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Number(prestamo.importe) - amortCuotas)
}

// ── Serie inversión total (importe inicial, incluye cancelados en su periodo) ─
function stockInicialEnFecha(fecha) {
  let particulares = 0, empresasParticipadas = 0, empresasPropias = 0
  for (const p of prestamosRaw.value) {
    if (!p.fecha_inicio || p.fecha_inicio > fecha) continue
    if (p.estado === 'cancelado' && p.fecha_cancelacion && p.fecha_cancelacion <= fecha) continue
    const importe     = Number(p.importe || 0)
    const participado = Math.min(participadoPorPrestamo.value[p.id] || 0, importe)
    if (p.tipoCliente === 'persona') {
      particulares += importe
    } else {
      empresasParticipadas += participado
      empresasPropias      += importe - participado
    }
  }
  return { particulares, empresasParticipadas, empresasPropias }
}

// ── Serie inversión en curso (capital vivo, solo préstamos no cancelados) ─────
// Usa capitalVivoEnFecha → descuenta el principal amortizado para préstamos no americanos
const prestamosEnCurso = computed(() => prestamosRaw.value.filter(p => p.estado !== 'cancelado'))

function stockVivoEnFecha(fecha) {
  let particulares = 0, empresasParticipadas = 0, empresasPropias = 0
  for (const p of prestamosRaw.value) {
    if (!p.fecha_inicio || p.fecha_inicio > fecha) continue
    if (p.estado === 'cancelado' && p.fecha_cancelacion && p.fecha_cancelacion <= fecha) continue
    const importe     = Number(p.importe || 0)
    const capitalVivo = capitalVivoEnFecha(p, fecha)
    // Mantenemos la fracción de participación proporcional al importe inicial
    const fracPart    = importe > 0 ? Math.min(participadoPorPrestamo.value[p.id] || 0, importe) / importe : 0
    if (p.tipoCliente === 'persona') {
      particulares += capitalVivo
    } else {
      empresasParticipadas += capitalVivo * fracPart
      empresasPropias      += capitalVivo * (1 - fracPart)
    }
  }
  return { particulares, empresasParticipadas, empresasPropias }
}

// ── Generador de puntos de inversión por granularidad ─────────────────────────
function generarPuntosInversion(desde, hasta, gran) {
  const puntos = []
  let cur = new Date(desde.slice(0, 7) + '-01T00:00:00')
  const fin = new Date(hasta.slice(0, 7) + '-01T00:00:00')
  const fmtD = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  let periodoStart = fmtD(cur)
  while (cur <= fin) {
    const y = cur.getFullYear()
    const m = cur.getMonth() + 1
    const mesStr   = `${y}-${String(m).padStart(2, '0')}`
    const fechaFin = `${mesStr}-${ultimoDiaMes(mesStr)}`
    if (gran === 'mes') {
      puntos.push({ label: `${String(m).padStart(2,'0')}/${y}`, fecha: fechaFin, fechaInicio: mesStr + '-01' })
      cur.setMonth(cur.getMonth() + 1)
    } else if (gran === 'trimestre') {
      if (m % 3 === 0 || cur >= fin) {
        puntos.push({ label: `Q${Math.ceil(m/3)} ${y}`, fecha: fechaFin, fechaInicio: periodoStart })
        cur.setMonth(cur.getMonth() + 1)
        periodoStart = fmtD(cur)
      } else {
        cur.setMonth(cur.getMonth() + 1)
      }
    } else {
      if (m === 12 || cur >= fin) {
        puntos.push({ label: `${y}`, fecha: fechaFin, fechaInicio: periodoStart })
        cur.setMonth(cur.getMonth() + 1)
        periodoStart = fmtD(cur)
      } else {
        cur.setMonth(cur.getMonth() + 1)
      }
    }
  }
  return puntos
}

const serieInversion = computed(() => {
  if (!prestamosRaw.value.length) return []
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return []
  return generarPuntosInversion(primeraFecha, hoy, granularidadInv.value)
    .map(({ label, fecha, fechaInicio }) => {
      const altas = prestamosRaw.value.filter(p => p.fecha_inicio >= fechaInicio && p.fecha_inicio <= fecha)
      const bajas = prestamosRaw.value.filter(p => p.fecha_cancelacion && p.fecha_cancelacion >= fechaInicio && p.fecha_cancelacion <= fecha)
      return { label, ...stockInicialEnFecha(fecha), altas, bajas }
    })
})

const serieInversionEnCurso = computed(() => {
  if (!prestamosRaw.value.length) return []
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return []
  return generarPuntosInversion(primeraFecha, hoy, granularidadInvCurso.value)
    .map(({ label, fecha, fechaInicio }) => {
      const altas = prestamosRaw.value.filter(p => p.fecha_inicio >= fechaInicio && p.fecha_inicio <= fecha)
      const bajas = prestamosRaw.value.filter(p => p.fecha_cancelacion && p.fecha_cancelacion >= fechaInicio && p.fecha_cancelacion <= fecha)
      return { label, ...stockVivoEnFecha(fecha), altas, bajas }
    })
})

// ── Ingresos de un mes concreto (YYYY-MM) ────────────────────────────────────
function ingresosDelMes(mesStr) {
  const mesInicio = mesStr + '-01'
  const mesFin    = `${mesStr}-${ultimoDiaMes(mesStr)}`
  let intParticulares = 0, intEmpresasPropias = 0, apertura = 0, gestion = 0

  for (const p of prestamosRaw.value) {
    if (!p.fecha_inicio || p.fecha_inicio > mesFin) continue
    if (p.estado === 'cancelado' && p.fecha_cancelacion && p.fecha_cancelacion < mesInicio) continue

    const importe     = Number(p.importe || 0)
    const tasa        = Number(p.interes_ordinario || 0) / 100 / 12
    const participado = Math.min(participadoPorPrestamo.value[p.id] || 0, importe)
    // Para préstamos con amortización (francés), los intereses se calculan sobre
    // el capital vivo al inicio del mes, no sobre el importe inicial
    const baseInteres = p.tipo_prestamo === 'Americano' ? importe : capitalVivoEnFecha(p, mesInicio)

    if (p.tipoCliente === 'persona') {
      intParticulares += baseInteres * tasa
    } else {
      const fracProp = importe > 0 ? (importe - participado) / importe : 1
      intEmpresasPropias += baseInteres * fracProp * tasa
    }
    gestion += gestionMensualPorPrestamo.value[p.id] || 0
    if (p.fecha_inicio >= mesInicio && p.fecha_inicio <= mesFin) {
      apertura += importe * (Number(p.comision_apertura || 0) / 100)
    }
  }
  return { intParticulares, intEmpresasPropias, apertura, gestion }
}

// ── Serie ingresos (suma de meses por periodo) ────────────────────────────────
const serieIngresos = computed(() => {
  if (!prestamosRaw.value.length) return []
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return []

  const meses = mesesEntre(primeraFecha, hoy)
  const porMes = {}
  for (const mes of meses) porMes[mes] = ingresosDelMes(mes)

  // Capital propio al fin de cada mes (para LTM y rentabilidad recurrente)
  const capitalPropioMes = {}
  for (const mes of meses) {
    const fin = `${mes}-${ultimoDiaMes(mes)}`
    const { particulares, empresasPropias } = stockVivoEnFecha(fin)
    capitalPropioMes[mes] = particulares + empresasPropias
  }

  // Capital propio al inicio de cada mes (= fin del mes anterior)
  // Corrección: los ingresos de un mes se generan sobre el capital que había al empezar ese mes,
  // no el capital que queda al final (que ya incluye altas de ese mes y excluye las bajas)
  const mesAnterior = (mesStr) => {
    const [y, m] = mesStr.split('-').map(Number)
    const mm = m === 1 ? 12 : m - 1
    const yy = m === 1 ? y - 1 : y
    return `${yy}-${String(mm).padStart(2, '0')}`
  }
  const capitalPropioMesInicio = {}
  for (const mes of meses) {
    const prev = mesAnterior(mes)
    if (capitalPropioMes[prev] !== undefined) {
      capitalPropioMesInicio[mes] = capitalPropioMes[prev]
    } else {
      // Primer mes: calcular el capital el día anterior al inicio
      const fin = `${mes}-01` // usar inicio del mes = equivalente a fin del mes anterior
      const { particulares, empresasPropias } = stockVivoEnFecha(fin)
      capitalPropioMesInicio[mes] = particulares + empresasPropias
    }
  }

  const sumar = lista => lista.reduce(
    (acc, mes) => {
      const v = porMes[mes]
      return {
        intParticulares:    acc.intParticulares    + v.intParticulares,
        intEmpresasPropias: acc.intEmpresasPropias + v.intEmpresasPropias,
        apertura:           acc.apertura           + v.apertura,
        gestion:            acc.gestion            + v.gestion,
      }
    },
    { intParticulares: 0, intEmpresasPropias: 0, apertura: 0, gestion: 0 }
  )

  const altasBajas = (fechaInicio, fechaFin) => ({
    altas: prestamosRaw.value.filter(p => p.fecha_inicio >= fechaInicio && p.fecha_inicio <= fechaFin),
    bajas: prestamosRaw.value.filter(p => p.fecha_cancelacion && p.fecha_cancelacion >= fechaInicio && p.fecha_cancelacion <= fechaFin),
  })

  // LTM (Last Twelve Months): suma los 12 meses anteriores al mes indicado (YYYY-MM)
  // Usa capitalPropioMes precalculado para evitar recalcular stockVivoEnFecha por punto
  // Devuelve null si no hay 12 meses completos de historia
  // modo: 'total' | 'sinApertura' | 'soloIntereses'
  const ltmPct = (mesStr, modo = 'total') => {
    const [yStr, mStr] = mesStr.split('-')
    const y = Number(yStr), m = Number(mStr)
    const ltmMeses = []
    for (let i = 11; i >= 0; i--) {
      let mm = m - i, yy = y
      while (mm <= 0) { mm += 12; yy-- }
      ltmMeses.push(`${yy}-${String(mm).padStart(2, '0')}`)
    }
    if (!ltmMeses.every(mes => porMes[mes] && capitalPropioMes[mes] !== undefined)) return null
    const ing = sumar(ltmMeses)
    const cap = ltmMeses.reduce((s, mes) => s + capitalPropioMes[mes], 0) / ltmMeses.length
    if (!cap) return null
    let total
    if (modo === 'sinApertura')        total = ing.intParticulares + ing.intEmpresasPropias + ing.gestion
    else if (modo === 'soloIntereses') total = ing.intParticulares + ing.intEmpresasPropias
    else                               total = ing.intParticulares + ing.intEmpresasPropias + ing.gestion + ing.apertura
    return Math.round((total / cap) * 10000) / 100
  }

  // LTM recurrente con capital de inicio de mes como denominador:
  // - Numerador: sum intereses recurrentes (sin apertura) de los últimos 12 meses
  //   usando porMes[], que ya calcula intereses sobre capitalVivoEnFecha (correcto para francés)
  // - Denominador: promedio de capitalPropioMesInicio[] de los 12 meses
  //   → altas del mes no inflan el denominador de ese mes
  //   → bajas del mes sí están en el denominador de ese mes (estaban al empezar)
  const rentLtmInicioMes = (mesStr) => {
    const [yStr, mStr] = mesStr.split('-')
    const y = Number(yStr), m = Number(mStr)
    const ltmMeses = []
    for (let i = 11; i >= 0; i--) {
      let mm = m - i, yy = y
      while (mm <= 0) { mm += 12; yy-- }
      ltmMeses.push(`${yy}-${String(mm).padStart(2, '0')}`)
    }
    if (!ltmMeses.every(mes => porMes[mes] && capitalPropioMesInicio[mes] !== undefined)) return null
    const ing = sumar(ltmMeses)
    const cap = ltmMeses.reduce((s, mes) => s + capitalPropioMesInicio[mes], 0) / ltmMeses.length
    if (!cap) return null
    const total = ing.intParticulares + ing.intEmpresasPropias + ing.gestion
    return Math.round((total / cap) * 10000) / 100
  }

  if (granularidadIng.value === 'mes') {
    return meses.map(mes => {
      const [y, m] = mes.split('-')
      const fechaInicio = mes + '-01'
      const fechaFin = `${mes}-${ultimoDiaMes(mes)}`
      return { label: `${m}/${y}`, ...porMes[mes], ...altasBajas(fechaInicio, fechaFin), rentabilidadPct: ltmPct(mes), rentabilidadRecurrentePct: ltmPct(mes, 'sinApertura'), rentabilidadInteresesPct: ltmPct(mes, 'soloIntereses'), rentabilidadInicioMesPct: rentLtmInicioMes(mes) }
    })
  }
  if (granularidadIng.value === 'trimestre') {
    const orden = [], grupos = {}
    for (const mes of meses) {
      const [y, m] = mes.split('-').map(Number)
      const key = `${y}-Q${Math.ceil(m/3)}`
      if (!grupos[key]) { grupos[key] = []; orden.push(key) }
      grupos[key].push(mes)
    }
    return orden.map(key => {
      const [y, q] = key.split('-')
      const lista = grupos[key]
      const fechaInicio = lista[0] + '-01'
      const lastMes = lista[lista.length - 1]
      const fechaFin = `${lastMes}-${ultimoDiaMes(lastMes)}`
      const ing = sumar(lista)
      return { label: `${q} ${y}`, ...ing, ...altasBajas(fechaInicio, fechaFin), rentabilidadPct: ltmPct(lastMes), rentabilidadRecurrentePct: ltmPct(lastMes, 'sinApertura'), rentabilidadInteresesPct: ltmPct(lastMes, 'soloIntereses'), rentabilidadInicioMesPct: rentLtmInicioMes(lastMes) }
    })
  }
  // anual
  const orden = [], grupos = {}
  for (const mes of meses) {
    const y = mes.slice(0, 4)
    if (!grupos[y]) { grupos[y] = []; orden.push(y) }
    grupos[y].push(mes)
  }
  return orden.map(y => {
    const lista = grupos[y]
    const fechaInicio = lista[0] + '-01'
    const lastMes = lista[lista.length - 1]
    const fechaFin = `${lastMes}-${ultimoDiaMes(lastMes)}`
    const ing = sumar(lista)
    return { label: y, ...ing, ...altasBajas(fechaInicio, fechaFin), rentabilidadPct: ltmPct(lastMes), rentabilidadRecurrentePct: ltmPct(lastMes, 'sinApertura'), rentabilidadInteresesPct: ltmPct(lastMes, 'soloIntereses'), rentabilidadInicioMesPct: rentLtmInicioMes(lastMes) }
  })
})

// ── Opciones chart ────────────────────────────────────────────────────────────
function makeChartOptions(getSerie, { secondAxis = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        reverse: false,
        labels: { font: { size: 12 }, padding: 16 }
      },
      tooltip: {
        itemSort: (a, b) => b.datasetIndex - a.datasetIndex,
        callbacks: {
          label: ctx => ctx.dataset.yAxisID === 'y2'
            ? ` ${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) + '%' : '—'}`
            : ` ${ctx.dataset.label}: ${fmtN(ctx.raw)} €`,
          footer: items => {
            const idx = items[0]?.dataIndex
            const point = getSerie()[idx]
            const euroItems = items.filter(i => i.dataset.yAxisID !== 'y2')
            const lines = [`Total: ${fmtN(euroItems.reduce((s, i) => s + Number(i.raw), 0))} €`]
            return lines
          }
        }
      }
    },
    scales: {
      x: { ticks: { font: { size: 11 } } },
      y: {
        stacked: true,
        ticks: {
          font: { size: 11 },
          callback: v => v >= 1000000
            ? (v / 1000000).toFixed(1) + ' M€'
            : v >= 1000 ? (v / 1000).toFixed(0) + ' k€' : v + ' €'
        }
      },
      ...(secondAxis ? {
        y2: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            font: { size: 11 },
            callback: v => v.toFixed(1) + '%'
          }
        }
      } : {})
    }
  }
}

const chartOptionsInversion        = computed(() => makeChartOptions(() => serieInversion.value))
const chartOptionsInversionEnCurso = computed(() => makeChartOptions(() => serieInversionEnCurso.value))
const chartOptionsIngresos         = computed(() => makeChartOptions(() => serieIngresos.value, { secondAxis: true }))

const ds = (label, color, data) => ({
  label, data,
  backgroundColor: color.replace('1)', '0.5)'),
  borderColor: color,
  borderWidth: 1.5,
  fill: true,
  tension: 0.3,
  pointRadius: 0,
  order: 1,
})

// ── Chart data ────────────────────────────────────────────────────────────────
const chartInversionData = computed(() => ({
  labels: serieInversion.value.map(p => p.label),
  datasets: [
    ds('Particulares',                 'rgba(99, 179, 237, 1)',  serieInversion.value.map(p => Math.round(p.particulares))),
    ds('Empresas — parte propia',      'rgba(104, 211, 145, 1)', serieInversion.value.map(p => Math.round(p.empresasPropias))),
    ds('Empresas — parte participada', 'rgba(246, 173, 85, 1)',  serieInversion.value.map(p => Math.round(p.empresasParticipadas))),
  ]
}))

const chartInversionEnCursoData = computed(() => ({
  labels: serieInversionEnCurso.value.map(p => p.label),
  datasets: [
    ds('Particulares',                 'rgba(99, 179, 237, 1)',  serieInversionEnCurso.value.map(p => Math.round(p.particulares))),
    ds('Empresas — parte propia',      'rgba(104, 211, 145, 1)', serieInversionEnCurso.value.map(p => Math.round(p.empresasPropias))),
    ds('Empresas — parte participada', 'rgba(246, 173, 85, 1)',  serieInversionEnCurso.value.map(p => Math.round(p.empresasParticipadas))),
  ]
}))

const lineDataset = (label, color, data, extra = {}) => ({
  label, data,
  yAxisID: 'y2',
  type: 'line',
  order: 0,
  borderColor: color,
  backgroundColor: 'transparent',
  borderWidth: 2,
  fill: false,
  tension: 0.3,
  pointRadius: 0,
  pointHoverRadius: 4,
  ...extra,
})

const chartIngresosData = computed(() => ({
  labels: serieIngresos.value.map(p => p.label),
  datasets: [
    // Líneas de rentabilidad primero → aparecen en la fila 1 de la leyenda
    lineDataset('Rentabilidad propia',            'rgba(30, 64, 175, 0.9)',  serieIngresos.value.map(p => p.rentabilidadInteresesPct)),
    lineDataset('Rentabilidad + gestión',          'rgba(239, 68, 68, 0.9)',  serieIngresos.value.map(p => p.rentabilidadRecurrentePct)),
    lineDataset('Rentabilidad total',             'rgba(16, 185, 129, 0.9)', serieIngresos.value.map(p => p.rentabilidadPct)),
    // Áreas después → aparecen en la fila 2 de la leyenda
    ds('Intereses particulares',     'rgba(99, 179, 237, 1)',  serieIngresos.value.map(p => Math.round(p.intParticulares))),
    ds('Intereses empresas propios', 'rgba(104, 211, 145, 1)', serieIngresos.value.map(p => Math.round(p.intEmpresasPropias))),
    ds('Ingresos por gestión',       'rgba(246, 173, 85, 1)',  serieIngresos.value.map(p => Math.round(p.gestion))),
    ds('Comisiones de apertura',     'rgba(159, 122, 234, 1)', serieIngresos.value.map(p => Math.round(p.apertura))),
  ]
}))

// ── KPIs inversión total ──────────────────────────────────────────────────────
const ultimoInv              = computed(() => serieInversion.value.at(-1) || { particulares: 0, empresasParticipadas: 0, empresasPropias: 0 })
const actualParticulares     = computed(() => ultimoInv.value.particulares)
const actualEmpresasParticipadas = computed(() => ultimoInv.value.empresasParticipadas)
const actualEmpresasPropias  = computed(() => ultimoInv.value.empresasPropias)
const totalInvActual         = computed(() => actualParticulares.value + actualEmpresasParticipadas.value + actualEmpresasPropias.value)

const cierreAnterior1 = computed(() => stockInicialEnFecha(`${anoAnterior}-12-31`))
const cierreAnterior2 = computed(() => stockInicialEnFecha(`${anoAnterior2}-12-31`))
const totalCierre1    = computed(() => cierreAnterior1.value.particulares + cierreAnterior1.value.empresasParticipadas + cierreAnterior1.value.empresasPropias)
const totalCierre2    = computed(() => cierreAnterior2.value.particulares + cierreAnterior2.value.empresasParticipadas + cierreAnterior2.value.empresasPropias)

function mkPctInv(valFn, totalRef) {
  return computed(() => totalRef.value ? (valFn() / totalRef.value * 100).toFixed(1) : '0.0')
}
const pctParticulares         = mkPctInv(() => actualParticulares.value,                 totalInvActual)
const pctEmpresasParticipadas = mkPctInv(() => actualEmpresasParticipadas.value,          totalInvActual)
const pctEmpresasPropias      = mkPctInv(() => actualEmpresasPropias.value,               totalInvActual)
const pctCierre1Particulares         = mkPctInv(() => cierreAnterior1.value.particulares,         totalCierre1)
const pctCierre1EmpresasParticipadas = mkPctInv(() => cierreAnterior1.value.empresasParticipadas, totalCierre1)
const pctCierre1EmpresasPropias      = mkPctInv(() => cierreAnterior1.value.empresasPropias,      totalCierre1)
const pctCierre2Particulares         = mkPctInv(() => cierreAnterior2.value.particulares,         totalCierre2)
const pctCierre2EmpresasParticipadas = mkPctInv(() => cierreAnterior2.value.empresasParticipadas, totalCierre2)
const pctCierre2EmpresasPropias      = mkPctInv(() => cierreAnterior2.value.empresasPropias,      totalCierre2)

// ── KPIs inversión en curso ───────────────────────────────────────────────────
const ultimoInvCurso              = computed(() => serieInversionEnCurso.value.at(-1) || { particulares: 0, empresasParticipadas: 0, empresasPropias: 0 })
const actualCursoParticulares     = computed(() => ultimoInvCurso.value.particulares)
const actualCursoEmpresasParticipadas = computed(() => ultimoInvCurso.value.empresasParticipadas)
const actualCursoEmpresasPropias  = computed(() => ultimoInvCurso.value.empresasPropias)
const totalInvCursoActual         = computed(() => actualCursoParticulares.value + actualCursoEmpresasParticipadas.value + actualCursoEmpresasPropias.value)

const cierreCurso1    = computed(() => stockVivoEnFecha(`${anoAnterior}-12-31`))
const cierreCurso2    = computed(() => stockVivoEnFecha(`${anoAnterior2}-12-31`))
const totalCierreCurso1 = computed(() => cierreCurso1.value.particulares + cierreCurso1.value.empresasParticipadas + cierreCurso1.value.empresasPropias)
const totalCierreCurso2 = computed(() => cierreCurso2.value.particulares + cierreCurso2.value.empresasParticipadas + cierreCurso2.value.empresasPropias)

const pctCursoParticulares         = mkPctInv(() => actualCursoParticulares.value,           totalInvCursoActual)
const pctCursoEmpresasParticipadas = mkPctInv(() => actualCursoEmpresasParticipadas.value,    totalInvCursoActual)
const pctCursoEmpresasPropias      = mkPctInv(() => actualCursoEmpresasPropias.value,         totalInvCursoActual)
const pctCierreCurso1Particulares         = mkPctInv(() => cierreCurso1.value.particulares,         totalCierreCurso1)
const pctCierreCurso1EmpresasParticipadas = mkPctInv(() => cierreCurso1.value.empresasParticipadas, totalCierreCurso1)
const pctCierreCurso1EmpresasPropias      = mkPctInv(() => cierreCurso1.value.empresasPropias,      totalCierreCurso1)
const pctCierreCurso2Particulares         = mkPctInv(() => cierreCurso2.value.particulares,         totalCierreCurso2)
const pctCierreCurso2EmpresasParticipadas = mkPctInv(() => cierreCurso2.value.empresasParticipadas, totalCierreCurso2)
const pctCierreCurso2EmpresasPropias      = mkPctInv(() => cierreCurso2.value.empresasPropias,      totalCierreCurso2)

// ── KPIs ingresos — actual (YTD), LTM, ejercicio anterior ────────────────────
const CERO_ING = { intParticulares: 0, intEmpresasPropias: 0, apertura: 0, gestion: 0 }

function reducirMeses(meses) {
  return meses.reduce((acc, mes) => {
    const v = ingresosDelMes(mes)
    return {
      intParticulares:    acc.intParticulares    + v.intParticulares,
      intEmpresasPropias: acc.intEmpresasPropias + v.intEmpresasPropias,
      apertura:           acc.apertura           + v.apertura,
      gestion:            acc.gestion            + v.gestion,
    }
  }, { ...CERO_ING })
}

function sumarMesesAnio(anio) {
  const mesActual = today().slice(0, 7)
  const hasta     = anio === anoActual ? mesActual : `${anio}-12`
  return reducirMeses(mesesEntre(`${anio}-01`, hasta))
}

function sumarLTM() {
  const hoy = today().slice(0, 7)
  const [y, m] = hoy.split('-').map(Number)
  let desdeM = m - 11, desdeY = y
  if (desdeM <= 0) { desdeM += 12; desdeY -= 1 }
  const desde = `${desdeY}-${String(desdeM).padStart(2, '0')}`
  return reducirMeses(mesesEntre(desde, hoy))
}

const ingEjercicioActual   = computed(() => sumarMesesAnio(anoActual))
const ingLTM               = computed(() => sumarLTM())
const ingEjercicioAnterior = computed(() => sumarMesesAnio(anoAnterior))

const totalEjercicioActual   = computed(() => Object.values(ingEjercicioActual.value).reduce((s, v) => s + v, 0))
const totalLTM               = computed(() => Object.values(ingLTM.value).reduce((s, v) => s + v, 0))
const totalEjercicioAnterior = computed(() => Object.values(ingEjercicioAnterior.value).reduce((s, v) => s + v, 0))

function mkPct(periodoRef, campo, totalRef) {
  return computed(() => totalRef.value ? (periodoRef.value[campo] / totalRef.value * 100).toFixed(1) : '0.0')
}
const pctIngParticulares       = mkPct(ingEjercicioActual, 'intParticulares',    totalEjercicioActual)
const pctIngEmpresasPropias    = mkPct(ingEjercicioActual, 'intEmpresasPropias', totalEjercicioActual)
const pctIngGestion            = mkPct(ingEjercicioActual, 'gestion',            totalEjercicioActual)
const pctIngApertura           = mkPct(ingEjercicioActual, 'apertura',           totalEjercicioActual)
const pctIngLTMParticulares    = mkPct(ingLTM, 'intParticulares',    totalLTM)
const pctIngLTMEmpresasPropias = mkPct(ingLTM, 'intEmpresasPropias', totalLTM)
const pctIngLTMGestion         = mkPct(ingLTM, 'gestion',            totalLTM)
const pctIngLTMApertura        = mkPct(ingLTM, 'apertura',           totalLTM)
const pctIngParticularesPrev    = mkPct(ingEjercicioAnterior, 'intParticulares',    totalEjercicioAnterior)
const pctIngEmpresasPropiasPrev = mkPct(ingEjercicioAnterior, 'intEmpresasPropias', totalEjercicioAnterior)
const pctIngGestionPrev         = mkPct(ingEjercicioAnterior, 'gestion',            totalEjercicioAnterior)
const pctIngAperturaPrev        = mkPct(ingEjercicioAnterior, 'apertura',           totalEjercicioAnterior)

// ── Altas y bajas del periodo actual (último punto de la serie de ingresos) ───
const altasBajasVisibles = computed(() => {
  const movimientos = []
  for (const punto of serieIngresos.value) {
    for (const p of (punto.altas || [])) movimientos.push({ ...p, _tipo: 'alta', _periodo: punto.label, _fecha: p.fecha_inicio || '' })
    for (const p of (punto.bajas || [])) movimientos.push({ ...p, _tipo: 'baja', _periodo: punto.label, _fecha: p.fecha_cancelacion || '' })
  }
  movimientos.sort((a, b) => a._fecha < b._fecha ? -1 : a._fecha > b._fecha ? 1 : 0)
  return { movimientos }
})

// ── Exportar a CSV (abre en Excel con separador ; y BOM UTF-8) ────────────────
function exportCSV(filas, nombreArchivo) {
  const csv = '\uFEFF' + filas.map(f => f.join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo; a.click()
  URL.revokeObjectURL(url)
}

function exportarInversionExcel() {
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return
  const filas = [
    ['Mes', 'Particulares', 'Empresas parte propia', 'Empresas parte participada', 'Total'],
    ...generarPuntosInversion(primeraFecha, hoy, 'mes').map(({ label, fecha }) => {
      const v = stockInicialEnFecha(fecha)
      const total = Math.round(v.particulares + v.empresasPropias + v.empresasParticipadas)
      return [label, Math.round(v.particulares), Math.round(v.empresasPropias), Math.round(v.empresasParticipadas), total]
    })
  ]
  exportCSV(filas, `evolucion-inversion-${hoy.slice(0, 10)}.csv`)
}

function exportarInversionEnCursoExcel() {
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return
  const filas = [
    ['Mes', 'Particulares', 'Empresas parte propia', 'Empresas parte participada', 'Total'],
    ...generarPuntosInversion(primeraFecha, hoy, 'mes').map(({ label, fecha }) => {
      const v = stockVivoEnFecha(fecha)
      const total = Math.round(v.particulares + v.empresasPropias + v.empresasParticipadas)
      return [label, Math.round(v.particulares), Math.round(v.empresasPropias), Math.round(v.empresasParticipadas), total]
    })
  ]
  exportCSV(filas, `evolucion-inversion-en-curso-${hoy.slice(0, 10)}.csv`)
}

function exportarIngresosExcel() {
  const hoy = today()
  const primeraFecha = prestamosRaw.value.filter(p => p.fecha_inicio).map(p => p.fecha_inicio).sort()[0]
  if (!primeraFecha) return
  const meses = mesesEntre(primeraFecha, hoy)

  // Precalcular capital propio mensual (mismo cálculo que serieIngresos)
  const capitalPropioMes = {}
  for (const mes of meses) {
    const fin = `${mes}-${ultimoDiaMes(mes)}`
    const { particulares, empresasPropias } = stockVivoEnFecha(fin)
    capitalPropioMes[mes] = particulares + empresasPropias
  }
  const porMes = {}
  for (const mes of meses) porMes[mes] = ingresosDelMes(mes)

  const ltmPctExcel = (mesStr) => {
    const [yStr, mStr] = mesStr.split('-')
    const y = Number(yStr), m = Number(mStr)
    const ltmMeses = []
    for (let i = 11; i >= 0; i--) {
      let mm = m - i, yy = y
      while (mm <= 0) { mm += 12; yy-- }
      ltmMeses.push(`${yy}-${String(mm).padStart(2, '0')}`)
    }
    if (!ltmMeses.every(k => porMes[k] && capitalPropioMes[k] !== undefined)) return ''
    const totalIng = ltmMeses.reduce((s, k) => {
      const v = porMes[k]
      return s + v.intParticulares + v.intEmpresasPropias + v.gestion + v.apertura
    }, 0)
    const cap = ltmMeses.reduce((s, k) => s + capitalPropioMes[k], 0) / ltmMeses.length
    if (!cap) return ''
    return (Math.round((totalIng / cap) * 10000) / 100).toString().replace('.', ',')
  }

  const comentarioMovimientos = (mes) => {
    const inicio = mes + '-01'
    const fin = `${mes}-${ultimoDiaMes(mes)}`
    const altas = prestamosRaw.value.filter(p => p.fecha_inicio >= inicio && p.fecha_inicio <= fin)
    const bajas = prestamosRaw.value.filter(p => p.fecha_cancelacion && p.fecha_cancelacion >= inicio && p.fecha_cancelacion <= fin)
    const lineas = []
    altas.forEach(p => lineas.push(`ALTA: ${p.alias || p.centro_coste || p.id} (${Math.round(Number(p.importe || 0)).toLocaleString('es-ES')} € / ${Number(p.interes_ordinario || 0).toLocaleString('es-ES')}%)`))
    bajas.forEach(p => lineas.push(`BAJA: ${p.alias || p.centro_coste || p.id} (${Math.round(Number(p.importe || 0)).toLocaleString('es-ES')} € / ${Number(p.interes_ordinario || 0).toLocaleString('es-ES')}%)`))
    return lineas.join(' | ')
  }

  const filas = [
    ['Mes', 'Intereses particulares', 'Intereses empresas propios', 'Ingresos gestión', 'Comisiones apertura', 'Total ingresos', 'Capital propio medio (€)', 'Rentabilidad mes anualizada (%)', 'Rentabilidad LTM (%)', 'Movimientos'],
    ...meses.map(mes => {
      const [y, m] = mes.split('-')
      const v = ingresosDelMes(mes)
      const total = Math.round(v.intParticulares + v.intEmpresasPropias + v.gestion + v.apertura)
      const cap = capitalPropioMes[mes]
      const rentMesAnualizada = cap
        ? (Math.round((v.intParticulares + v.intEmpresasPropias + v.gestion) * 12 / cap * 10000) / 100).toString().replace('.', ',')
        : ''
      return [
        `${m}/${y}`,
        Math.round(v.intParticulares),
        Math.round(v.intEmpresasPropias),
        Math.round(v.gestion),
        Math.round(v.apertura),
        total,
        Math.round(cap),
        rentMesAnualizada,
        ltmPctExcel(mes),
        comentarioMovimientos(mes),
      ]
    })
  ]
  exportCSV(filas, `evolucion-ingresos-${hoy.slice(0, 10)}.csv`)
}


</script>
