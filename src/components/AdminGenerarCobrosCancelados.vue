<template>
  <div>
    <div class="table-card">
      <div class="table-header">
        <h3>Generar cobros teóricos para préstamos cancelados</h3>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span v-if="resumen" style="font-size:12px;color:var(--text3)">
            {{ resumen.candidatos }} préstamos candidatos · {{ resumen.cuotasAInsertar }} cuotas a insertar
          </span>
          <button class="btn" @click="analizar" :disabled="cargando">
            {{ cargando ? 'Analizando…' : '🔍 Analizar' }}
          </button>
          <button
            class="btn btn-registrar"
            @click="ejecutar"
            :disabled="ejecutando || !analizado || !prestamosAnalizados.length"
            :title="!analizado ? 'Pulsa primero Analizar' : !prestamosAnalizados.length ? 'No hay cuotas pendientes de generar' : ''"
          >
            {{ ejecutando ? 'Generando…' : '✅ Generar cobros' }}
          </button>
          <button
            class="btn btn-danger"
            @click="eliminarTodosCobros"
            :disabled="eliminando || cobrosExistentesCount === 0"
            :title="cobrosExistentesCount === 0 ? 'No hay cobros de préstamos cancelados en la BD' : `Eliminar todos los cobros de préstamos cancelados (${cobrosExistentesCount})`"
          >
            {{ eliminando ? 'Eliminando…' : `🗑 Eliminar cobros (${cobrosExistentesCount})` }}
          </button>
        </div>
      </div>

      <div v-if="!analizado" class="table-empty">
        Pulsa "Analizar" para ver qué préstamos cancelados tienen cuotas teóricas pendientes de registrar.
      </div>

      <div v-else-if="!prestamosAnalizados.length" class="table-empty" style="color:var(--green)">
        ✓ Todos los préstamos cancelados con fecha de cancelación ya tienen sus cobros generados.
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>CC</th>
            <th>Alias</th>
            <th>Tipo</th>
            <th style="text-align:right">Importe</th>
            <th>Cancelado el</th>
            <th style="text-align:center">Cuotas a insertar</th>
            <th style="text-align:right">Total a insertar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in prestamosAnalizados" :key="p.id">
            <td class="td-mono" style="color:var(--text3);text-align:center">{{ p.centro_coste || '—' }}</td>
            <td style="font-weight:500">{{ p.alias }}</td>
            <td v-html="getTipoBadge(p.tipo_prestamo)" />
            <td class="td-mono td-right">{{ fmtInt(p.importe) }}</td>
            <td>{{ fmtDate(p.fecha_cancelacion) }}</td>
            <td class="td-mono td-center" style="color:var(--orange)">{{ p.cuotasNuevas.length }}</td>
            <td class="td-mono td-right" style="color:var(--green)">{{ fmtInt(p.cuotasNuevas.reduce((s,c) => s + c.total, 0)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Log de resultado -->
    <div v-if="log.length" class="table-card" style="margin-top:16px">
      <div class="table-header"><h3>Resultado</h3></div>
      <div style="padding:16px;font-size:13px;line-height:2">
        <div v-for="(l, i) in log" :key="i" :style="{ color: l.ok ? 'var(--green)' : 'var(--red)' }">
          {{ l.ok ? '✓' : '✗' }} {{ l.msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fmtInt, fmtDate, uuid, generateCalendarioTeorico, getTipoBadge } from '../utils.js'

const cargando  = ref(false)
const ejecutando = ref(false)
const eliminando = ref(false)
const analizado  = ref(false)
const prestamosAnalizados = ref([])
const log = ref([])
const resumen = ref(null)
const cobrosExistentesCount = ref(0)

onMounted(analizar)

async function analizar() {
  cargando.value = true
  analizado.value = false
  log.value = []
  prestamosAnalizados.value = []

  // Cargar préstamos cancelados con fecha_cancelacion
  const { data: prestamos } = await supabase
    .from('prestamos')
    .select('*')
    .eq('estado', 'cancelado')
    .not('fecha_cancelacion', 'is', null)

  // Contar cobros existentes en préstamos cancelados
  const { count } = await supabase
    .from('cobros')
    .select('id', { count: 'exact', head: true })
    .in('prestamo_id', (await supabase.from('prestamos').select('id').eq('estado', 'cancelado')).data?.map(p => p.id) || [])
  cobrosExistentesCount.value = count || 0

  if (!prestamos?.length) {
    resumen.value = { candidatos: 0, cuotasAInsertar: 0 }
    analizado.value = true
    cargando.value = false
    return
  }

  // Cargar TODOS los cobros de estos préstamos (necesario para recalcular AP)
  const ids = prestamos.map(p => p.id)
  const { data: cobrosExistentes } = await supabase
    .from('cobros')
    .select('prestamo_id, fecha_teorica, importe, tipo, importe_principal, fecha_real, modalidad_recalculo')
    .in('prestamo_id', ids)

  const cobrosMap = {}      // todos los cobros por préstamo (para generateCalendarioTeorico)
  const cobrosYaMap = {}    // solo pago_cuota fechas ya insertadas
  for (const c of (cobrosExistentes || [])) {
    if (!cobrosMap[c.prestamo_id]) cobrosMap[c.prestamo_id] = []
    cobrosMap[c.prestamo_id].push(c)
    if (c.tipo === 'pago_cuota' || c.tipo === 'cancelacion') {
      if (!cobrosYaMap[c.prestamo_id]) cobrosYaMap[c.prestamo_id] = new Set()
      // normalizar fecha a YYYY-MM-DD
      cobrosYaMap[c.prestamo_id].add((c.fecha_teorica || '').substring(0, 10))
    }
  }

  const resultado = []
  for (const p of prestamos) {
    // normalizar fecha_cancelacion a YYYY-MM-DD
    const fechaCancel = (p.fecha_cancelacion || '').substring(0, 10)
    if (!fechaCancel) continue

    const cobrosP  = cobrosMap[p.id] || []
    const yaInsert = cobrosYaMap[p.id] || new Set()

    // Generar calendario teórico — pasar estado ficticio 'activo' para evitar
    // que generateCalendarioTeorico devuelva [] por estado=cancelado
    const prestamoActivo = { ...p, estado: 'activo' }
    const cal = generateCalendarioTeorico(prestamoActivo, cobrosP)

    // Filtrar cuotas cuya fecha ≤ fecha_cancelacion y que no existan ya
    const cuotasNuevas = cal.filter(c => {
      const fechaCuota = (c.fecha || '').substring(0, 10)
      return fechaCuota && fechaCuota <= fechaCancel && !yaInsert.has(fechaCuota)
    })

    if (cuotasNuevas.length > 0) {
      // Calcular principal pendiente y añadirlo a la última cuota nueva
      const ultimaCuota = cuotasNuevas[cuotasNuevas.length - 1]

      // Principal ya amortizado = suma de importe_principal de cobros existentes pago_cuota
      const principalAmortizado = (cobrosMap[p.id] || [])
        .filter(c => c.tipo === 'pago_cuota')
        .reduce((s, c) => s + Number(c.importe_principal || 0), 0)

      // Principal ya amortizado en cuotas nuevas anteriores a la última
      const principalNuevoAnterior = cuotasNuevas.slice(0, -1)
        .reduce((s, c) => s + Number(c.principal || 0), 0)

      const principalPendiente = Math.max(0, Math.round((p.importe - principalAmortizado - principalNuevoAnterior) * 100) / 100)

      if (principalPendiente > 0) {
        ultimaCuota.principal  = Math.round(((ultimaCuota.principal || 0) + principalPendiente) * 100) / 100
        ultimaCuota.total      = Math.round(((ultimaCuota.total      || 0) + principalPendiente) * 100) / 100
      }

      resultado.push({ ...p, cuotasNuevas })
    }
  }

  prestamosAnalizados.value = resultado
  resumen.value = {
    candidatos: resultado.length,
    cuotasAInsertar: resultado.reduce((s, p) => s + p.cuotasNuevas.length, 0)
  }
  analizado.value = true
  cargando.value = false
}

async function ejecutar() {
  if (!prestamosAnalizados.value.length) return
  if (!confirm(`¿Generar ${resumen.value.cuotasAInsertar} cobros teóricos para ${resumen.value.candidatos} préstamos cancelados?`)) return

  ejecutando.value = true
  log.value = []

  for (const p of prestamosAnalizados.value) {
    const ultimaIdx = p.cuotasNuevas.length - 1
    const inserts = p.cuotasNuevas.map((c, i) => ({
      id:                'CB' + uuid(),
      prestamo_id:       p.id,
      cuota_num:         i === ultimaIdx ? 'C' : String(c.num),
      fecha_teorica:     (c.fecha || '').substring(0, 10),
      fecha_real:        (c.fecha || '').substring(0, 10),
      importe:           c.total,
      importe_principal: c.principal ?? null,
      tipo:              i === ultimaIdx ? 'cancelacion' : 'pago_cuota',
      notas:             i === ultimaIdx ? 'Cancelación generada automáticamente' : 'Generado automáticamente (cancelado)',
    }))

    const { error } = await supabase.from('cobros').insert(inserts)
    if (error) {
      log.value.push({ ok: false, msg: `${p.alias}: ${error.message}` })
    } else {
      log.value.push({ ok: true, msg: `${p.alias}: ${inserts.length} cobro${inserts.length !== 1 ? 's' : ''} insertados` })
    }
  }

  ejecutando.value = false
  // Re-analizar para mostrar estado actualizado
  await analizar()
}

async function eliminarTodosCobros() {
  if (!confirm(`¿Eliminar TODOS los cobros (${cobrosExistentesCount.value}) de préstamos cancelados? Esta acción no se puede deshacer.`)) return
  eliminando.value = true
  log.value = []
  // Obtener ids de préstamos cancelados
  const { data: cancelados } = await supabase.from('prestamos').select('id').eq('estado', 'cancelado')
  const ids = (cancelados || []).map(p => p.id)
  if (ids.length) {
    const { error } = await supabase.from('cobros').delete().in('prestamo_id', ids)
    if (error) {
      log.value.push({ ok: false, msg: 'Error al eliminar: ' + error.message })
    } else {
      log.value.push({ ok: true, msg: `Eliminados todos los cobros de ${ids.length} préstamo${ids.length !== 1 ? 's' : ''} cancelados` })
    }
  }
  eliminando.value = false
  await analizar()
}
</script>
