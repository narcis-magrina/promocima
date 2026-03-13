<template>
  <div>
    <!-- KPIs -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card kc-green">
        <div class="kpi-label">Capital Desplegado</div>
        <div class="kpi-value">{{ fmtInt(capitalActivo) }}</div>
        <div class="kpi-sub">{{ prestamosActivos.length }} préstamos activos</div>
        <div class="kpi-sub" style="color:var(--blue)">Promocima: {{ fmtInt(capitalActivo - capitalParticipado) }}</div>
      </div>
      <div class="kpi-card kc-green">
        <div class="kpi-label">Capital Activo</div>
        <div class="kpi-value">{{ fmtInt(capitalActivoReal) }}</div>
        <div class="kpi-sub" style="color:var(--blue)">Promocima: {{ fmtInt(capitalActivoReal - capitalParticipado) }}</div>
      </div>
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Capital Participado</div>
        <div class="kpi-value">{{ fmtInt(capitalParticipado) }}</div>
        <div class="kpi-sub">{{ nParticipados }} préstamos con CCP activo</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">LTV Medio Cartera</div>
        <div class="kpi-value">{{ ltvMedio }}%</div>
        <div class="kpi-sub">Media LTV préstamos activos</div>
      </div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
      <div class="kpi-card kc-green">
        <div class="kpi-label">Ingresos Mensuales</div>
        <div class="kpi-value">{{ fmtInt(interesesMes) }}</div>
        <div class="kpi-sub">Intereses ordinarios activos</div>
      </div>
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Intereses Partícipes</div>
        <div class="kpi-value">{{ fmtInt(pagosParticipesMes) }}</div>
        <div class="kpi-sub">Bruto mensual devengado</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Ingresos Gestión</div>
        <div class="kpi-value">{{ fmtInt(ingresosGestionMes) }}</div>
        <div class="kpi-sub">Comisión gestión mensual</div>
      </div>
      <div class="kpi-card kc-red">
        <div class="kpi-label">Incidencias</div>
        <div class="kpi-value">{{ incidencias }}</div>
        <div class="kpi-sub">{{ enRetraso }} en retraso · {{ judicializados }} judicializado{{ judicializados !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <!-- Resumen por estado -->
    <div class="table-card">
      <div class="table-header"><h3>Resumen de Cartera por Estado</h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Estado</th>
            <th style="text-align:center">N.º Préstamos</th>
            <th style="text-align:right">Capital</th>
            <th style="text-align:right">% Capital</th>
            <th style="text-align:right">Capital Activo</th>
            <th style="text-align:right">% Capital activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in resumenEstados" :key="row.est">
            <td v-html="getEstadoBadge(row.est)" />
            <td class="td-center">{{ row.count }}</td>
            <td class="td-mono td-right">{{ fmtInt(row.capital) }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pct + '%', background: row.color }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct.toFixed(1) }}%</span>
              </div>
            </td>
            <td class="td-mono td-right" style="color:var(--green)">
              {{ row.capitalActivo !== null ? fmtInt(row.capitalActivo) : '—' }}
            </td>
            <td>
              <div v-if="row.est !== 'cancelado'" style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pctActiva + '%', background: row.color }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pctActiva.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid var(--border);background:var(--bg2)">
            <td style="text-align:left;font-weight:700;font-size:13px;padding:10px 12px">Total activos</td>
            <td style="text-align:center;font-size:13px;padding:10px 12px">{{ resumenEstados.filter(r => r.est !== 'cancelado').reduce((s,r) => s + r.count, 0) }}</td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px">{{ fmtInt(resumenEstados.filter(r => r.est !== 'cancelado').reduce((s,r) => s + r.capital, 0)) }}</td>
            <td style="padding:10px 12px"></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtInt(resumenEstados.filter(r => r.est !== 'cancelado' && r.capitalActivo !== null).reduce((s,r) => s + r.capitalActivo, 0)) }}</td>
            <td style="padding:10px 12px"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Préstamos por intermediario -->
    <div class="table-card">
      <div class="table-header"><h3>Préstamos por Intermediario</h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Intermediario</th>
            <th style="text-align:right">Al día</th>
            <th style="text-align:right">Con retraso</th>
            <th style="text-align:right">Cancelados</th>
            <th style="text-align:right">Judicializados</th>
            <th style="text-align:right">Capital</th>
            <th style="text-align:right">Capital Activo</th>
            <th style="text-align:right;min-width:120px">% Capital activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in porIntermediario" :key="row.nombre">
            <td style="font-weight:500">{{ row.nombre }}</td>
            <td class="td-mono td-right">
              <span style="color:var(--green)">{{ fmtInt(row.al_dia_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--orange)">{{ fmtInt(row.retraso_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.retraso_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(row.cancelado_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--red)">{{ fmtInt(row.judicial_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.judicial_n }})</span>
            </td>
            <td class="td-mono td-right" style="font-weight:600">
              {{ fmtInt(row.activos_imp) }}
              <span style="color:var(--text3);font-size:11px"> ({{ row.activos_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtInt(row.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pct + '%', background: 'var(--accent)' }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
          <tr v-if="!porIntermediario.length">
            <td colspan="8" class="table-empty">Sin datos</td>
          </tr>
        </tbody>
        <tfoot v-if="porIntermediario.length">
          <tr style="border-top:2px solid var(--border);background:var(--bg2)">
            <td style="text-align:left;font-weight:700;font-size:13px;padding:10px 12px">Total</td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.al_dia_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.al_dia_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--orange);padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.retraso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.retraso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text3);padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.cancelado_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.cancelado_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--red);padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.judicial_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.judicial_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.activos_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.activos_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtInt(porIntermediario.reduce((s,r) => s + r.capital_activo_imp, 0)) }}</td>
            <td style="padding:10px 12px"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Préstamos por partícipe -->
    <div class="table-card">
      <div class="table-header"><h3>Préstamos por Partícipe</h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Partícipe</th>
            <th style="text-align:right">Al día</th>
            <th style="text-align:right">Con retraso</th>
            <th style="text-align:right">Cancelados</th>
            <th style="text-align:right">Judicializados</th>
            <th style="text-align:right">Capital</th>
            <th style="text-align:right">Capital Activo</th>
            <th style="text-align:right;min-width:120px">% Capital activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in porParticipe" :key="row.nombre">
            <td style="font-weight:500">{{ row.nombre }}</td>
            <td class="td-mono td-right">
              <span style="color:var(--green)">{{ fmtInt(row.al_dia_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--orange)">{{ fmtInt(row.retraso_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.retraso_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(row.cancelado_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--red)">{{ fmtInt(row.judicial_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ row.judicial_n }})</span>
            </td>
            <td class="td-mono td-right" style="font-weight:600">
              {{ fmtInt(row.activos_imp) }}
              <span style="color:var(--text3);font-size:11px"> ({{ row.activos_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtInt(row.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pct + '%', background: 'var(--accent)' }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
          <!-- Préstamos sin partícipe (no compartidos con ningún partícipe) -->
          <tr v-if="sinParticipe.activos_n > 0 || sinParticipe.cancelado_n > 0" style="border-top:2px solid var(--border)">
            <td style="font-style:italic;color:var(--text3)">Sin partícipe</td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(sinParticipe.al_dia_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ sinParticipe.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(sinParticipe.retraso_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ sinParticipe.retraso_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(sinParticipe.cancelado_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ sinParticipe.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtInt(sinParticipe.judicial_imp) }}</span>
              <span style="color:var(--text3);font-size:11px"> ({{ sinParticipe.judicial_n }})</span>
            </td>
            <td class="td-mono td-right" style="font-weight:600;color:var(--text3)">
              {{ fmtInt(sinParticipe.activos_imp) }}
              <span style="font-size:11px"> ({{ sinParticipe.activos_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtInt(sinParticipe.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="flex:1">
                  <div class="progress-fill" :style="{ width: sinParticipe.pct + '%', background: 'var(--text3)' }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ sinParticipe.pct.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
          <tr v-if="!porParticipe.length && !sinParticipe.total_n">
            <td colspan="8" class="table-empty">Sin datos</td>
          </tr>
        </tbody>
        <tfoot v-if="porParticipe.length || sinParticipe.activos_n > 0">
          <tr style="border-top:2px solid var(--border);background:var(--bg2)">
            <td style="text-align:left;font-weight:700;font-size:13px;padding:10px 12px">Total</td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.al_dia_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, sinParticipe].reduce((s,r) => s + r.al_dia_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--orange);padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.retraso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, sinParticipe].reduce((s,r) => s + r.retraso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text3);padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.cancelado_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, sinParticipe].reduce((s,r) => s + r.cancelado_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--red);padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.judicial_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, sinParticipe].reduce((s,r) => s + r.judicial_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.activos_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, sinParticipe].reduce((s,r) => s + r.activos_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtInt([...porParticipe, sinParticipe].reduce((s,r) => s + r.capital_activo_imp, 0)) }}</td>
            <td style="padding:10px 12px"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, calcInteresOrdinario, getEstadoBadge, generateCalendarioTeorico, today , distribuirCobros } from '../utils.js'

defineEmits(['navigate'])

const loading          = ref(true)
const prestamosRaw     = ref([])
const todosCobros      = ref([])
const intermediariosRaw = ref([])
const ccpRaw           = ref([])   // contratos_ccp activos con importe_participacion y porcentaje_gestion
const irpfGlobal       = ref(19)

onMounted(async () => {
  const [{ data: p }, { data: c }, { data: cl }, { data: inter }, { data: ccp }, { data: cfg }] = await Promise.all([
    supabase.from('prestamos').select('*'),
    (async () => {
      const PAGE = 1000
      let all = [], from = 0
      while (true) {
        const { data } = await supabase.from('cobros')
          .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal')
          .order('id').range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return { data: all }
    })(),
    supabase.from('clientes').select('id, nombre'),
    supabase.from('intermediarios').select('id, nombre'),
    supabase.from('contratos_ccp').select('prestamo_id, participe_id, importe_participacion, porcentaje_gestion, activo, participes(nombre)'),
    supabase.from('config').select('porcentaje_irpf').eq('id', 1).single()
  ])
  const clientesMap = Object.fromEntries((cl || []).map(x => [x.id, x]))
  prestamosRaw.value      = (p || []).map(x => ({ ...x, clientes: clientesMap[x.cliente_id] || null }))
  todosCobros.value       = c     || []
  intermediariosRaw.value = inter || []
  ccpRaw.value            = (ccp || []).filter(c => c.activo)
  irpfGlobal.value        = cfg?.porcentaje_irpf ?? 19
  loading.value = false
})

// ── Estado calculado ─────────────────────────────────────────────────────────
function tieneRetraso(p) {
  if (p.estado === 'judicializado' || p.estado === 'cancelado') return false
  const hoy     = today()
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal     = generateCalendarioTeorico(p, cobrosP)
  const calConEstado = distribuirCobros(cal, cobrosP)

  // Fecha de la primera amortización parcial (si la hay)
  const fechaPrimeraAP = cobrosP
    .filter(c => c.tipo === 'amortizacion_parcial')
    .map(c => c.fecha_real || c.fecha_teorica)
    .filter(Boolean)
    .sort()[0] || null

  return calConEstado.some(c => {
    if (c.fecha > hoy) return false
    // Cuotas anteriores a una AP se consideran saldadas
    if (fechaPrimeraAP && c.fecha < fechaPrimeraAP) return false
    return c.estado !== 'cobrada'
  })
}

function estadoCalc(p) {
  if (p.estado === 'cancelado')     return 'cancelado'
  if (p.estado === 'judicializado') return 'judicializado'
  return tieneRetraso(p) ? 'con_retraso' : 'al_dia'
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
const prestamosActivos = computed(() => prestamosRaw.value.filter(p => p.estado !== 'cancelado'))
const capitalActivo    = computed(() => prestamosActivos.value.reduce((s, p) => s + Number(p.importe), 0))
const enRetraso        = computed(() => prestamosActivos.value.filter(p => tieneRetraso(p)).length)
const judicializados   = computed(() => prestamosActivos.value.filter(p => p.estado === 'judicializado').length)
const incidencias      = computed(() => enRetraso.value + judicializados.value)

const interesesMes = computed(() =>
  prestamosActivos.value
    .filter(p => p.estado !== 'judicializado')
    .reduce((s, p) => s + calcInteresOrdinario(Number(p.importe), Number(p.interes_ordinario)), 0)
)

const ltvMedio = computed(() => {
  const vals = prestamosActivos.value
    .filter(p => p.garantia_tasacion)
    .map(p => Number(p.importe) / Number(p.garantia_tasacion) * 100)
  if (!vals.length) return 0
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

// Capital participado: suma real de importe_participacion de contratos CCP activos en préstamos activos
const prestamosConCCP = computed(() => {
  const ids = new Set(ccpRaw.value.map(c => c.prestamo_id))
  return prestamosActivos.value.filter(p => ids.has(p.id))
})
const capitalParticipado = computed(() =>
  ccpRaw.value
    .filter(c => prestamosActivos.value.some(p => p.id === c.prestamo_id))
    .reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)
const nParticipados = computed(() => prestamosConCCP.value.length)

// Capital activo real (descuenta principal ya amortizado en préstamos franceses)
const capitalActivoReal = computed(() =>
  prestamosActivos.value
    .reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
)

// Intereses devengados a partícipes = importe_participacion × tasa_mensual (bruto, sin IRPF ni gestión)
const pagosParticipesMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosActivos.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    const tasa = Number(prestamo.interes_ordinario) / 100 / 12
    return s + Number(ccp.importe_participacion) * tasa
  }, 0)
)

// Ingresos por gestión = importe_participacion × % gestión / 12
const ingresosGestionMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosActivos.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    return s + Number(ccp.importe_participacion) * (Number(ccp.porcentaje_gestion || 0) / 100) / 12
  }, 0)
)

// ── Capital activo real de un préstamo (descuenta amortizaciones parciales y francés) ─
function calcCapitalActivoPrestamo(p) {
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  // Amortizaciones parciales de principal
  const totalAmort = cobrosP
    .filter(c => c.tipo === 'amortizacion_parcial')
    .reduce((s, c) => s + Number(c.importe_principal || 0), 0)
  if (p.tipo_prestamo === 'Americano') {
    return Math.max(0, Number(p.importe) - totalAmort)
  }
  // Francés: descontar también el principal amortizado via cuotas
  const cal = generateCalendarioTeorico(p, cobrosP)
  const calConEstado = distribuirCobros(cal, cobrosP)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - totalAmort - amortCuotas) * 100) / 100)
}

// ── Resumen por estado ────────────────────────────────────────────────────────
const resumenEstados = computed(() => {
  const todos         = prestamosRaw.value
  const totalCapital  = todos.reduce((s, p) => s + Number(p.importe), 0)
  const activosCapital = todos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + Number(p.importe), 0)
  function filtrar(est) {
    if (est === 'con_retraso') return todos.filter(p => estadoCalc(p) === 'con_retraso')
    if (est === 'al_dia')      return todos.filter(p => estadoCalc(p) === 'al_dia')
    return todos.filter(p => p.estado === est)
  }
  return [
    { est: 'al_dia',        color: 'var(--green)'  },
    { est: 'con_retraso',   color: 'var(--orange)' },
    { est: 'judicializado', color: 'var(--red)'    },
    { est: 'cancelado',     color: 'var(--text3)'  },
  ].map(row => {
    const ps         = filtrar(row.est)
    const capital    = ps.reduce((s, p) => s + Number(p.importe), 0)
    const capitalActivo = row.est !== 'cancelado'
      ? ps.reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
      : null
    const pct        = totalCapital   ? capital / totalCapital   * 100 : 0
    const totalCapitalActivo = todos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
    const pctActiva  = row.est !== 'cancelado' && capitalActivo !== null && totalCapitalActivo
      ? capitalActivo / totalCapitalActivo * 100
      : null
    return { ...row, count: ps.length, capital, capitalActivo, pct, pctActiva }
  })
})

// ── Helper: agrega un array de préstamos en una fila de resumen ───────────────
function fila(ps, totalActivosCartera, totalCapitalActivoCartera) {
  const est      = e => ps.filter(p => estadoCalc(p) === e)
  const imp      = arr => arr.reduce((s, p) => s + Number(p.importe), 0)
  const al_dia   = est('al_dia')
  const retraso  = est('con_retraso')
  const cancelado  = ps.filter(p => p.estado === 'cancelado')
  const judicial   = ps.filter(p => p.estado === 'judicializado')
  const activosArr = [...al_dia, ...retraso, ...judicial]  // activos = no cancelados
  const activosImp = imp(activosArr)
  const capitalActivoImp = activosArr.reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
  return {
    al_dia_imp: imp(al_dia),      al_dia_n: al_dia.length,
    retraso_imp: imp(retraso),    retraso_n: retraso.length,
    cancelado_imp: imp(cancelado),cancelado_n: cancelado.length,
    judicial_imp: imp(judicial),  judicial_n: judicial.length,
    activos_imp: activosImp,      activos_n: activosArr.length,
    capital_activo_imp: capitalActivoImp,
    pct: totalCapitalActivoCartera ? capitalActivoImp / totalCapitalActivoCartera * 100 : 0,
  }
}

// ── Por intermediario ─────────────────────────────────────────────────────────
const porIntermediario = computed(() => {
  const totalCapitalActivo = prestamosRaw.value.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
  const interMap     = Object.fromEntries(intermediariosRaw.value.map(i => [i.id, i.nombre]))
  const grupos       = {}
  for (const p of prestamosRaw.value) {
    const key = p.intermediario_id || '__sin__'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(p)
  }
  return Object.entries(grupos)
    .map(([key, ps]) => ({
      nombre: key === '__sin__' ? 'Sin intermediario' : (interMap[key] || key),
      ...fila(ps, null, totalCapitalActivo),
    }))
    .sort((a, b) => b.activos_imp - a.activos_imp)
})

// ── Por partícipe ─────────────────────────────────────────────────────────────
const porParticipe = computed(() => {
  const prestamoMap = Object.fromEntries(prestamosRaw.value.map(p => [p.id, p]))
  const totalCapitalActivo = ccpRaw.value
    .filter(ccp => { const p = prestamoMap[ccp.prestamo_id]; return p && p.estado !== 'cancelado' && ccp.activo })
    .reduce((s, ccp) => s + Number(ccp.importe_participacion || 0), 0)

  const grupos = {}
  for (const ccp of ccpRaw.value) {
    const key    = ccp.participe_id
    const nombre = ccp.participes?.nombre || key
    if (!grupos[key]) grupos[key] = { nombre, ccps: [] }
    grupos[key].ccps.push(ccp)
  }

  return Object.values(grupos)
    .map(({ nombre, ccps }) => {
      const imp = (arr) => arr.reduce((s, ccp) => s + Number(ccp.importe_participacion || 0), 0)
      const est = (estado) => ccps.filter(ccp => {
        const p = prestamoMap[ccp.prestamo_id]
        return p && estadoCalc(p) === estado && ccp.activo
      })
      const al_dia    = est('al_dia')
      const retraso   = est('con_retraso')
      const judicial  = ccps.filter(ccp => { const p = prestamoMap[ccp.prestamo_id]; return p && p.estado === 'judicializado' })
      const cancelado = ccps.filter(ccp => { const p = prestamoMap[ccp.prestamo_id]; return p && p.estado === 'cancelado' })
      const activos   = [...al_dia, ...retraso, ...judicial]
      const activosImp = imp(activos)
      const capitalActivoImp = imp(ccps.filter(ccp => {
        const p = prestamoMap[ccp.prestamo_id]; return p && p.estado !== 'cancelado' && ccp.activo
      }))
      return {
        nombre,
        al_dia_imp:     imp(al_dia),     al_dia_n:     al_dia.length,
        retraso_imp:    imp(retraso),     retraso_n:    retraso.length,
        cancelado_imp:  imp(cancelado),   cancelado_n:  cancelado.length,
        judicial_imp:   imp(judicial),    judicial_n:   judicial.length,
        activos_imp:    activosImp,       activos_n:    activos.length,
        capital_activo_imp: capitalActivoImp,
        pct: totalCapitalActivo ? capitalActivoImp / totalCapitalActivo * 100 : 0,
      }
    })
    .sort((a, b) => b.activos_imp - a.activos_imp)
})

// ── Sin partícipe ─────────────────────────────────────────────────────────────
const sinParticipe = computed(() => {
  const totalCapitalActivo = prestamosRaw.value.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)

  // Para cada préstamo, calcular la parte NO participada
  // = importe préstamo - suma de importe_participacion de contratos CCP activos
  const participadoPorPrestamo = {}
  for (const ccp of ccpRaw.value) {
    if (!ccp.activo) continue
    participadoPorPrestamo[ccp.prestamo_id] = (participadoPorPrestamo[ccp.prestamo_id] || 0) + Number(ccp.importe_participacion || 0)
  }

  // Construir "préstamos virtuales" con el importe no participado
  const psVirtuales = prestamosRaw.value
    .map(p => {
      const participado = participadoPorPrestamo[p.id] || 0
      const noParticipado = Math.max(0, Number(p.importe) - participado)
      if (noParticipado < 0.01) return null
      return { ...p, importe: noParticipado }
    })
    .filter(Boolean)

  return fila(psVirtuales, null, totalCapitalActivo)
})
</script>
