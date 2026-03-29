<template>
  <div>
    <div v-if="loading" class="table-empty">Cargando...</div>
    <div v-else>

      <div class="table-card" style="padding:20px;margin-bottom:14px">
        <div class="table-header" style="margin-bottom:16px">
          <h3>Vencimientos previstos</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="font-size:12px;color:var(--text3)">Granularidad</label>
            <select class="form-control" style="width:auto;font-size:12px" v-model="granularidad">
              <option value="mes">Mensual</option>
              <option value="trimestre">Trimestral</option>
              <option value="año">Anual</option>
            </select>
          </div>
        </div>
        <Bar :data="chartData" :options="chartOptions" :plugins="chartPlugins" style="max-height:380px" />
      </div>

      <div class="table-card" style="padding:20px">
        <h3 style="margin-bottom:14px">Detalle de vencimientos</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Préstamo</th>
              <th>Tipo</th>
              <th>Vencimiento</th>
              <th class="text-right">Importe inicial</th>
              <th class="text-right">Capital en curso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in vencimientosDetalle" :key="p.id">
              <td>{{ p.alias || p.centro_coste || '—' }}</td>
              <td>{{ p.tipoCliente === 'persona' ? 'Particular' : 'Empresa' }}</td>
              <td>{{ fmtDate(p.fechaVenc) }}</td>
              <td class="text-right">{{ fmtN(p.importe) }} €</td>
              <td class="text-right">{{ fmtN(p.capitalVivo) }} €</td>
            </tr>
            <tr v-if="!vencimientosDetalle.length">
              <td colspan="5" class="table-empty">Sin datos</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, BarController,
  Title, Tooltip, Legend,
} from 'chart.js'
import { supabase } from '../supabase.js'
import { fmtN, fmtDate, today, generateCalendarioTeorico, distribuirCobros } from '../utils.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend)

const loading          = ref(true)
const prestamosRaw     = ref([])
const cobrosRaw        = ref([])
const ccpRaw           = ref([])
const granularidad     = ref('trimestre')

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
    supabase.from('prestamos').select('id, alias, centro_coste, importe, fecha_inicio, fecha_cancelacion, estado, cliente_id, tipo_prestamo, duracion_meses, dia_cobro, periodicidad, meses_carencia, interes_ordinario'),
    supabase.from('clientes').select('id, tipo'),
    supabase.from('contratos_ccp').select('prestamo_id, importe_participacion'),
    fetchAllCobros(),
  ])
  const clientesMap = Object.fromEntries((cl || []).map(x => [x.id, x.tipo?.toLowerCase() || '']))
  prestamosRaw.value = (p || []).map(x => ({ ...x, tipoCliente: clientesMap[x.cliente_id] || '' }))
  ccpRaw.value       = ccp    || []
  cobrosRaw.value    = cobros || []
  loading.value = false
})

// ── Capital vivo ──────────────────────────────────────────────────────────────
const calendariosPorPrestamo = computed(() => {
  const map = {}
  for (const p of prestamosRaw.value) {
    if (p.tipo_prestamo !== 'Americano') {
      const pCalc = p.estado === 'cancelado' ? { ...p, estado: 'activo' } : p
      map[p.id] = generateCalendarioTeorico(pCalc)
    }
  }
  return map
})

function capitalVivoEnFecha(prestamo, fecha) {
  if (prestamo.tipo_prestamo === 'Americano') return Number(prestamo.importe)
  const cal = calendariosPorPrestamo.value[prestamo.id]
  if (!cal) return Number(prestamo.importe)
  const cobrosP = cobrosRaw.value.filter(c =>
    c.prestamo_id === prestamo.id && c.fecha_real && c.fecha_real <= fecha
  )
  const { capitalPendiente } = distribuirCobros(cal, cobrosP)
  return capitalPendiente ?? Number(prestamo.importe)
}

// ── Fecha de vencimiento ──────────────────────────────────────────────────────
function calcFechaVenc(prestamo) {
  if (!prestamo.fecha_inicio || !prestamo.duracion_meses) return null
  const d = new Date(prestamo.fecha_inicio + 'T00:00:00')
  d.setMonth(d.getMonth() + Number(prestamo.duracion_meses))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Datos base ────────────────────────────────────────────────────────────────
const vencimientosBase = computed(() => {
  const hoy = today()
  const lista = prestamosRaw.value
    .filter(p => p.estado !== 'cancelado' && p.fecha_inicio)
    .map(p => ({ ...p, fechaVenc: calcFechaVenc(p), capitalVivo: capitalVivoEnFecha(p, hoy) }))
    .filter(p => p.fechaVenc)
  lista.sort((a, b) => (a.fechaVenc < b.fechaVenc ? -1 : a.fechaVenc > b.fechaVenc ? 1 : 0))
  return lista
})

const vencimientosDetalle = computed(() =>
  [...vencimientosBase.value].sort((a, b) => (a.fechaVenc < b.fechaVenc ? -1 : a.fechaVenc > b.fechaVenc ? 1 : 0))
)

// ── Helpers de periodo ────────────────────────────────────────────────────────
function periodoKey(mesStr, gran) {
  const [y, m] = mesStr.split('-').map(Number)
  if (gran === 'mes')       return { key: mesStr,                       label: `${String(m).padStart(2,'0')}/${y}` }
  if (gran === 'trimestre') return { key: `${y}-Q${Math.ceil(m / 3)}`, label: `Q${Math.ceil(m / 3)} ${y}` }
  return                           { key: `${y}`,                       label: `${y}` }
}

function periodoEntre(desdeStr, hastaStr, gran) {
  const resultado = [], seen = new Set()
  let cur = new Date(desdeStr + '-01T00:00:00')
  const fin = new Date(hastaStr + '-01T00:00:00')
  while (cur <= fin) {
    const mesStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    const { key, label } = periodoKey(mesStr, gran)
    if (!seen.has(key)) { seen.add(key); resultado.push({ key, label }) }
    cur.setMonth(cur.getMonth() + 1)
  }
  return resultado
}

// ── Índice de separación pasado/futuro ───────────────────────────────────────
const separadorIdx = computed(() => {
  const gran = granularidad.value
  const hoyMes = today().slice(0, 7)
  const [hy, hm] = hoyMes.split('-').map(Number)

  const esPasado = (key) => {
    if (gran === 'mes') return key < hoyMes
    if (gran === 'trimestre') {
      const claveActual = `${hy}-Q${Math.ceil(hm / 3)}`
      const [ky, kq] = key.split('-Q').map(Number)
      const [cy, cq] = claveActual.split('-Q').map(Number)
      return ky < cy || (ky === cy && kq < cq)
    }
    return Number(key) < hy
  }

  // En mensual: buscar cuántas claves únicas del gráfico son pasadas
  const labels = serie.value
  let count = 0
  for (const punto of labels) {
    // Reconstruir la key desde el label para comparar
    const key = gran === 'mes'
      ? (() => { const [m, y] = punto.label.split('/'); return `${y}-${m}` })()
      : gran === 'trimestre'
        ? (() => { const [q, y] = punto.label.split(' '); return `${y}-${q}` })()
        : punto.label
    if (!esPasado(key)) break
    count++
  }
  return count
})

// Plugin inline: línea vertical discontinua entre último periodo vencido y primero futuro
const chartPlugins = computed(() => [{
  id: 'separadorHoy',
  afterDraw(chart) {
    const idx = separadorIdx.value
    if (idx <= 0) return
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart
    const xPrev = x.getPixelForValue(idx - 1)
    const xNext = x.getPixelForValue(idx)
    const xLine = (xPrev + xNext) / 2
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.55)'
    ctx.lineWidth = 1.5
    ctx.moveTo(xLine, top)
    ctx.lineTo(xLine, bottom)
    ctx.stroke()
    ctx.restore()
  },
}])

// ── Serie para el gráfico ─────────────────────────────────────────────────────
const serie = computed(() => {
  if (!vencimientosBase.value.length) return []
  const gran = granularidad.value
  const grupos = {}

  for (const p of vencimientosBase.value) {
    const { key, label } = periodoKey(p.fechaVenc.slice(0, 7), gran)
    if (!grupos[key]) grupos[key] = { label, personas: 0, empresas: 0, judicial: 0 }
    if (p.estado === 'judicializado')      grupos[key].judicial  += p.capitalVivo
    else if (p.tipoCliente === 'persona')  grupos[key].personas  += p.capitalVivo
    else                                   grupos[key].empresas  += p.capitalVivo
  }

  if (gran !== 'mes') {
    const hoyMes = today().slice(0, 7)
    const [hy, hm] = hoyMes.split('-').map(Number)

    // Clave del periodo actual (trimestre o año en curso)
    const claveActual = gran === 'trimestre'
      ? `${hy}-Q${Math.ceil(hm / 3)}`
      : `${hy}`

    // ¿Es la clave estrictamente anterior al periodo actual?
    const esPasado = (key) => {
      if (gran === 'trimestre') {
        const [ky, kq] = key.split('-Q').map(Number)
        const [cy, cq] = claveActual.split('-Q').map(Number)
        return ky < cy || (ky === cy && kq < cq)
      }
      return Number(key) < hy
    }

    // Periodos pasados: solo los que tienen datos, sin huecos
    const clavesPasadas = [], vistoPasado = new Set()
    for (const p of vencimientosBase.value) {
      const { key } = periodoKey(p.fechaVenc.slice(0, 7), gran)
      if (!esPasado(key)) break
      if (!vistoPasado.has(key)) { vistoPasado.add(key); clavesPasadas.push(key) }
    }

    // Periodos desde el actual hasta el último vencimiento: todos, con huecos a 0
    const ultimoVenc = vencimientosBase.value.at(-1).fechaVenc.slice(0, 7)
    const periodosActualesFuturos = periodoEntre(hoyMes, ultimoVenc, gran)
      .map(({ key, label }) => grupos[key] || { label, personas: 0, empresas: 0, judicial: 0 })

    return [
      ...clavesPasadas.map(k => grupos[k]),
      ...periodosActualesFuturos,
    ]
  }

  const orden = [], seen = new Set()
  for (const p of vencimientosBase.value) {
    const { key } = periodoKey(p.fechaVenc.slice(0, 7), gran)
    if (!seen.has(key)) { seen.add(key); orden.push(key) }
  }
  return orden.map(k => grupos[k])
})

// ── Chart ─────────────────────────────────────────────────────────────────────
const chartData = computed(() => ({
  labels: serie.value.map(p => p.label),
  datasets: [
    {
      label: 'Particulares',
      data: serie.value.map(p => Math.round(p.personas)),
      backgroundColor: 'rgba(99, 179, 237, 0.7)',
      borderColor: 'rgba(99, 179, 237, 1)',
      borderWidth: 1,
      stack: 'venc',
    },
    {
      label: 'Empresas',
      data: serie.value.map(p => Math.round(p.empresas)),
      backgroundColor: 'rgba(104, 211, 145, 0.7)',
      borderColor: 'rgba(104, 211, 145, 1)',
      borderWidth: 1,
      stack: 'venc',
    },
    {
      label: 'Judicializados',
      data: serie.value.map(p => Math.round(p.judicial)),
      backgroundColor: 'rgba(159, 122, 234, 0.7)',
      borderColor: 'rgba(159, 122, 234, 1)',
      borderWidth: 1,
      stack: 'venc',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    tooltip: {
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${fmtN(ctx.raw)} €`,
        footer: items => {
          const total = items.reduce((s, i) => s + Number(i.raw), 0)
          const label = serie.value[items[0]?.dataIndex]?.label || ''
          const gran = granularidad.value
          const prestamos = vencimientosBase.value.filter(p => {
            const { label: l } = periodoKey(p.fechaVenc.slice(0, 7), gran)
            return l === label
          })
          const lines = [`Total: ${fmtN(total)} €`, '']
          prestamos.forEach(p => lines.push(`• ${p.alias || p.centro_coste || '—'}  ${fmtN(p.capitalVivo)} €`))
          return lines
        },
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: {
      stacked: true,
      ticks: { callback: v => fmtN(v) + ' €' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
  },
}))
</script>
