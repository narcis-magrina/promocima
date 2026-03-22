<template>
  <div>
    <!-- KPIs -->
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi-card kc-green">
        <div class="kpi-label">Total Cobrado</div>
        <div class="kpi-value">{{ fmtN(totalCobrado) }}</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Cobros Último Mes</div>
        <div class="kpi-value">{{ fmtN(cobrosUltimos30imp) }}</div>
        <div class="kpi-sub">{{ cobrosUltimos30n }} recibo{{ cobrosUltimos30n !== 1 ? 's' : '' }} · {{ cobrosRangoLabel }}</div>
      </div>
      <div class="kpi-card kc-orange">
        <div class="kpi-label">Con Retraso</div>
        <div class="kpi-value">{{ fmtN(totalPendienteGlobal) }}</div>
        <div class="kpi-sub">{{ cuotasPendientes.length }} cuota{{ cuotasPendientes.length !== 1 ? 's' : '' }}</div>
        <div class="kpi-sub" v-if="totalJudicialGlobal > 0" style="color:var(--red)">Judicializados: {{ fmtN(totalJudicialGlobal) }}</div>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs" style="margin-bottom:20px">
      <div class="tab" :class="{ active: seccion === 'proximos' }" @click="seccion = 'proximos'">
        ⏰ Cobros Previstos
        <span v-if="cuotasPendientes.length" class="badge badge-orange" style="margin-left:6px;font-size:11px">{{ cuotasPendientes.length }}</span>
      </div>
      <div class="tab" :class="{ active: seccion === 'historico' }" @click="seccion = 'historico'">📋 Cobros Históricos</div>
    </div>

    <!-- ── COBROS PREVISTOS ─────────────────────────────────────── -->
    <div v-if="seccion === 'proximos'">
      <div v-if="loadingProximos" style="padding:40px;text-align:center;color:var(--text3)">Calculando cuotas pendientes…</div>
      <div v-else class="table-card">
        <div class="table-header">
          <h3>Cuotas con retraso ({{ cuotasFiltradas.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="filter-label">Filtros</span>
            <select class="form-control" :class="{'filter-active': !!filtroPrestamosPrev}" style="width:160px;padding:5px 10px;font-size:12px" v-model="filtroPrestamosPrev" :style="!!filtroPrestamosPrev ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option value="">Todos los préstamos</option>
              <option v-for="p in prestamosUnicosPrev" :key="p" :value="p">{{ p }}</option>
            </select>
            <select class="form-control" :class="{'filter-active': !!filtroIntermediario}" style="width:160px;padding:5px 10px;font-size:12px" v-model="filtroIntermediario" :style="!!filtroIntermediario ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option value="">Todos los intermediarios</option>
              <option v-for="i in intermediariosUnicos" :key="i" :value="i">{{ i }}</option>
            </select>
            <select class="form-control" :class="{'filter-active': !!filtroEstado}" style="width:150px;padding:5px 10px;font-size:12px" v-model="filtroEstado" :style="!!filtroEstado ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="judicializado">Judicializado</option>
            </select>
            <select class="form-control" :class="{'filter-active': soloMasAntiguo}" style="width:140px;padding:5px 10px;font-size:12px" v-model="soloMasAntiguo" :style="soloMasAntiguo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option :value="false">Todas las cuotas</option>
              <option :value="true">1 por préstamo</option>
            </select>
            <select class="form-control" v-model="vistaAgrupada" style="width:180px;padding:5px 10px;font-size:12px" :style="vistaAgrupada ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option :value="false">Vista plana</option>
              <option :value="true">Agrupar por préstamo</option>
            </select>
            <span style="font-size:12px;color:var(--text3)">Total: {{ fmtN(totalPendiente) }}</span>
          </div>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th @click="setSortPrev('centro_coste')" :class="thClassPrev('centro_coste')" class="col-hide-mobile">CC <span class="sort-icon">{{ thIconPrev('centro_coste') }}</span></th>
                <th @click="setSortPrev('alias')" :class="thClassPrev('alias')">Préstamo <span class="sort-icon">{{ thIconPrev('alias') }}</span></th>
                <th class="col-hide-mobile">Cliente</th>
                <th class="col-hide-mobile">Intermediario</th>
                <th class="col-hide-mobile">Estado</th>
                <th style="text-align:center">Cuota</th>
                <th @click="setSortPrev('fecha')" :class="thClassPrev('fecha')" class="col-hide-mobile">Fecha teórica <span class="sort-icon">{{ thIconPrev('fecha') }}</span></th>
                <th style="text-align:right">Importe</th>
                <th @click="setSortPrev('diasRetraso')" :class="thClassPrev('diasRetraso')" style="text-align:right" class="col-hide-mobile">Días<br>retraso <span class="sort-icon">{{ thIconPrev('diasRetraso') }}</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <!-- Vista plana -->
              <template v-if="!vistaAgrupada">
                <tr v-for="c in cuotasFiltradas" :key="c._key" :style="c.esJudicial ? 'background:rgba(239,68,68,0.06)' : ''">
                  <td class="td-mono td-center col-hide-mobile" style="font-weight:600">{{ c.centro_coste }}</td>
                  <td style="font-size:12px;font-weight:500;cursor:pointer" @click="$emit('navigate','prestamos',c.prestamo_id)">{{ c.alias }}</td>
                  <td style="font-size:12px" class="col-hide-mobile">{{ c.cliente }}</td>
                  <td style="font-size:12px" class="col-hide-mobile">{{ c.intermediario }}</td>
                  <td class="col-hide-mobile"><span class="badge" :class="c.estado === 'judicializado' ? 'badge-red' : 'badge-green'">{{ c.estado === 'judicializado' ? 'Judicializado' : 'Activo' }}</span></td>
                  <td class="td-mono td-center" :style="c.esJudicial ? 'color:var(--red);font-weight:700' : ''">{{ c.num }}</td>
                  <td style="font-size:12px;color:var(--orange)" class="col-hide-mobile">{{ fmtDate(c.fecha) }}</td>
                  <td class="td-mono td-right" style="font-weight:600;vertical-align:top">
                    {{ fmtDec(c.total) }}
                    <div v-if="c.esJudicial" style="margin-top:3px;font-size:10px;color:var(--text3);line-height:1.8;min-width:220px">
                      <div v-if="c.principal > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(c.principal) }}</span></div>
                      <div v-if="c.interes_ordinario > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.interes_ordinario) }}</span></div>
                      <div v-if="c.gastos > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Gastos:</span><span style="font-family:var(--mono)">{{ fmtDec(c.gastos) }}</span></div>
                      <div v-if="c.demora > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap;border-top:1px solid var(--border);padding-top:2px"><span>Int. dem. ({{ c.diasRetraso }}d):</span><span style="font-family:var(--mono)">{{ fmtDec(c.demora) }}</span></div>
                    </div>
                  </td>
                  <td class="td-mono td-right col-hide-mobile" style="color:var(--orange)">{{ c.diasRetraso }}</td>
                  <td style="display:flex;gap:4px;align-items:center">
                    <button v-if="!c.esJudicial" class="btn btn-sm" style="white-space:nowrap;background:var(--green);color:#fff;border-color:var(--green)" :disabled="c.registrando" @click="cobrarCuota(c)">
                      {{ c.registrando ? '…' : '✓ Cobrar' }}
                    </button>
                    <button v-if="!c.esJudicial" class="btn btn-sm btn-registrar" style="white-space:nowrap;background:var(--orange);color:#fff;border-color:var(--orange)" @click.stop="abrirModificar(c)">
                      ✎ Modificar
                    </button>
                  </td>
                </tr>
              </template>
              <!-- Vista agrupada por cliente -->
              <template v-else>
                <template v-for="grupo in cuotasAgrupadas" :key="grupo.prestamo_id">
                  <!-- Cabecera préstamo -->
                  <tr style="background:var(--bg2);border-top:2px solid color-mix(in srgb,var(--accent) 30%,transparent)">
                    <td colspan="6" style="font-weight:700;font-size:13px;padding:8px 10px;color:var(--accent)">
                      📋 {{ grupo.alias }}
                      <span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:6px">{{ grupo.cliente }}</span>
                      <span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:8px">· {{ grupo.lineas.length }} cuota{{ grupo.lineas.length !== 1 ? 's' : '' }}</span>
                    </td>
                    <td class="td-mono td-right" style="font-weight:700;color:var(--orange);font-size:13px">{{ fmtDec(grupo.totalPendiente) }}</td>
                    <td colspan="3"></td>
                  </tr>
                  <!-- Líneas del cliente -->
                  <tr v-for="c in grupo.lineas" :key="c._key" :style="c.esJudicial ? 'background:rgba(239,68,68,0.06)' : 'background:color-mix(in srgb,var(--accent) 3%,transparent)'">
                    <td style="font-size:12px;font-weight:500;cursor:pointer;padding-left:24px" @click="$emit('navigate','prestamos',c.prestamo_id)">{{ c.alias }}</td>
                    <td style="font-size:12px;color:var(--text3)" class="col-hide-mobile">—</td>
                    <td style="font-size:12px" class="col-hide-mobile">{{ c.intermediario }}</td>
                    <td class="col-hide-mobile"><span class="badge" :class="c.estado === 'judicializado' ? 'badge-red' : 'badge-green'">{{ c.estado === 'judicializado' ? 'Judicializado' : 'Activo' }}</span></td>
                    <td class="td-mono td-center" :style="c.esJudicial ? 'color:var(--red);font-weight:700' : ''">{{ c.num }}</td>
                    <td style="font-size:12px;color:var(--orange)" class="col-hide-mobile">{{ fmtDate(c.fecha) }}</td>
                    <td class="td-mono td-right" style="font-weight:600;vertical-align:top">
                      {{ fmtDec(c.total) }}
                      <div v-if="c.esJudicial" style="margin-top:3px;font-size:10px;color:var(--text3);line-height:1.8;min-width:220px">
                        <div v-if="c.principal > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(c.principal) }}</span></div>
                        <div v-if="c.interes_ordinario > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.interes_ordinario) }}</span></div>
                        <div v-if="c.gastos > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap"><span>Gastos:</span><span style="font-family:var(--mono)">{{ fmtDec(c.gastos) }}</span></div>
                        <div v-if="c.demora > 0" style="display:flex;justify-content:space-between;gap:8px;white-space:nowrap;border-top:1px solid var(--border);padding-top:2px"><span>Int. dem. ({{ c.diasRetraso }}d):</span><span style="font-family:var(--mono)">{{ fmtDec(c.demora) }}</span></div>
                      </div>
                    </td>
                    <td class="td-mono td-right col-hide-mobile" style="color:var(--orange)">{{ c.diasRetraso }}</td>
                    <td style="display:flex;gap:4px;align-items:center">
                      <button v-if="!c.esJudicial" class="btn btn-sm" style="white-space:nowrap;background:var(--green);color:#fff;border-color:var(--green)" :disabled="c.registrando" @click="cobrarCuota(c)">
                        {{ c.registrando ? '…' : '✓ Cobrar' }}
                      </button>
                      <button v-if="!c.esJudicial" class="btn btn-sm btn-registrar" style="white-space:nowrap;background:var(--orange);color:#fff;border-color:var(--orange)" @click.stop="abrirModificar(c)">
                        ✎ Modificar
                      </button>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-if="!cuotasPendientes.length">
                <td colspan="10" class="table-empty" style="color:var(--green)">✓ No hay cuotas con retraso</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── HISTÓRICO ────────────────────────────────────────────── -->
    <div v-if="seccion === 'historico'" class="table-card">
      <div class="table-header">
        <h3>Historial de Cobros ({{ cobrosFiltrados.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="filter-label">Filtros</span>
          <select class="form-control" :class="{'filter-active': !!filtroPrestamo}" style="width:180px;padding:5px 10px;font-size:12px" v-model="filtroPrestamo" :style="!!filtroPrestamo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="">Todos los préstamos</option>
            <option v-for="p in prestamosUnicos" :key="p" :value="p">{{ p }}</option>
          </select>
          <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Filtrar por préstamo..." v-model="busqueda" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th @click="setSort('prestamo_alias')" :class="thClass('prestamo_alias')">Préstamo <span class="sort-icon">{{ thIcon('prestamo_alias') }}</span></th>
              <th class="col-hide-mobile">Cliente</th>
              <th @click="setSort('cuota_num')" :class="thClass('cuota_num')" style="text-align:center" class="col-hide-mobile">Cuota<br>Nº <span class="sort-icon">{{ thIcon('cuota_num') }}</span></th>
              <th @click="setSort('fecha_teorica')" :class="thClass('fecha_teorica')" class="col-hide-mobile">F. Teórica <span class="sort-icon">{{ thIcon('fecha_teorica') }}</span></th>
              <th @click="setSort('fecha_real')" :class="thClass('fecha_real')">F. Real <span class="sort-icon">{{ thIcon('fecha_real') }}</span></th>
              <th @click="setSort('importe')" :class="thClass('importe')" style="text-align:right">Importe <span class="sort-icon">{{ thIcon('importe') }}</span></th>
              <th class="col-hide-mobile">Tipo</th>
              <th class="col-hide-mobile">Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cobrosFiltrados" :key="c.id">
              <td style="font-size:12px;font-weight:500">{{ c.prestamos?.alias || '—' }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ c.prestamos?.clientes?.nombre || '—' }}</td>
              <td class="td-mono td-center col-hide-mobile">{{ c.cuota_num }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ fmtDate(c.fecha_teorica) }}</td>
              <td style="font-size:12px">{{ fmtDate(c.fecha_real) }}</td>
              <td class="td-mono td-right" style="font-weight:600">{{ fmtDec(c.importe) }}</td>
              <td class="col-hide-mobile"><span class="badge" :class="c.tipo === 'cancelacion' ? 'badge-red' : 'badge-green'">{{ c.tipo === 'cancelacion' ? 'Cancelación' : 'Pago cuota' }}</span></td>
              <td style="font-size:11px;color:var(--text3)" class="col-hide-mobile">{{ c.notas || '—' }}</td>
              <td>
                <button class="btn btn-sm btn-danger-solid" style="padding:2px 7px;font-size:13px" title="Eliminar cobro" @click="eliminarCobro(c)">✕</button>
              </td>
            </tr>
            <tr v-if="!cobrosFiltrados.length"><td colspan="10" class="table-empty">Sin cobros</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── Modal Modificar Cobro ─────────────────────────────────── -->
  <div class="modal-overlay" v-if="modalModificar">
    <div class="modal">
      <div class="modal-header">
        <h2>Registrar cobro</h2>
        <button class="btn btn-ghost btn-sm" @click="modalModificar = false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-grid" style="gap:14px">
          <div class="form-group">
            <label class="form-label">Préstamo</label>
            <input class="form-control" v-focus :value="formModificar.alias" disabled style="opacity:0.6">
          </div>
          <div class="form-group">
            <label class="form-label">Cuota nº</label>
            <input class="form-control" :value="formModificar.num" disabled style="opacity:0.6">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha teórica</label>
            <input class="form-control" :value="formModificar.fecha" disabled style="opacity:0.6">
          </div>
          <div class="form-group">
            <label class="form-label">Importe (€) <span class="req">*</span></label>
            <input class="form-control" type="number" step="0.01" v-model="formModificar.importe">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha real cobro <span class="req">*</span></label>
            <input class="form-control" type="date" v-model="formModificar.fechaReal">
          </div>
          <div class="form-group">
            <label class="form-label">Notas</label>
            <input class="form-control" v-model="formModificar.notas" placeholder="Observaciones opcionales">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="modalModificar = false">Cancelar</button>
        <button class="btn btn-primary" :disabled="guardandoModificar" @click="guardarModificar">
          <span v-if="guardandoModificar" class="btn-spinner"></span>
          Registrar cobro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { validarCampos, traducirErrorSupabase } from '../utils/validar.js'
import { useAuth } from '../composables/useAuth.js'
const { empresaId } = useAuth()
import { ref, computed, onMounted, watch } from 'vue'
import { useSort } from '../composables/useSort.js'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtN, fmtDate, today, uuid, generateCalendarioTeorico, distribuirCobros , fmtDec } from '../utils.js'

defineEmits(['navigate'])

const seccion = ref('proximos')
const hoy = today()
const filtroPrestamosPrev  = usePersistedRef('cobros.filtroPrestamosPrev', '')
const vistaAgrupada        = usePersistedRef('cobros.vistaAgrupada', false)
const filtroIntermediario  = usePersistedRef('cobros.filtroIntermediario', '')
const filtroEstado         = usePersistedRef('cobros.filtroEstado', 'activo')
const soloMasAntiguo       = usePersistedRef('cobros.soloMasAntiguo', true)

// ── Cobros previstos ─────────────────────────────────────────────────────────
const loadingProximos  = ref(false)
const cuotasPendientes = ref([])

function diasEntre(fechaStr) {
  const d1 = new Date(hoy + 'T00:00:00')
  const d2 = new Date(fechaStr + 'T00:00:00')
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24))
}

async function calcularPendientes() {
  loadingProximos.value = true

  const [{ data: prestamos }, { data: cobros }] = await Promise.all([
    supabase.from('prestamos').select('*, intermediarios(id, nombre)').neq('estado', 'cancelado').order('centro_coste'),
    (async () => {
      const PAGE = 1000
      let all = [], from = 0
      while (true) {
        const { data } = await supabase.from('cobros')
          .select('prestamo_id, cuota_num, fecha_teorica, importe, tipo, fecha_real, importe_principal, modalidad_recalculo')
          .order('id').range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return { data: all }
    })(),
  ])

  const clientesIds = [...new Set((prestamos || []).map(p => p.cliente_id).filter(Boolean))]
  const { data: clientes } = await supabase.from('clientes').select('id, nombre').in('id', clientesIds)
  const clientesMap = Object.fromEntries((clientes || []).map(c => [c.id, c.nombre]))

  const resultado = []
  for (const p of (prestamos || [])) {
    const cobrosP = (cobros || []).filter(c => c.prestamo_id === p.id)

    if (p.estado === 'judicializado') {
      // La fila J se construye siempre desde los campos del préstamo.
      // No existe cobro de tipo 'judicializacion' en BD: la judicialización
      // no genera movimiento de caja. Se resuelve mediante la cancelación.
      if (p.fecha_judicializacion && p.importe_demanda) {
        const diasDesde = diasEntre(p.fecha_judicializacion)
        const tasa = Number(p.interes_demora || 0) / 100
        const importe_demanda = Number(p.importe_demanda || 0)
        const demora = Math.round(importe_demanda * tasa / 365 * diasDesde * 100) / 100
        resultado.push({
          _key:              p.id + '-judicial',
          prestamo_id:       p.id,
          centro_coste:      p.centro_coste || '—',
          alias:             p.alias,
          cliente:           clientesMap[p.cliente_id] || '—',
          intermediario:     p.intermediarios?.nombre || '—',
          estado:            'judicializado',
          num:               'J',
          fecha:             p.fecha_judicializacion,
          fechaEfectiva:     hoy,
          total:             importe_demanda,
          principal:         Number(p.demanda_principal || 0),
          interes_ordinario: Number(p.demanda_interes_ordinario || 0),
          gastos:            Number(p.demanda_gastos || 0),
          demora,
          diasRetraso:       diasDesde,
          esJudicial:        true,
          registrando:       false,
        })
      }
      continue
    }

    const cal     = generateCalendarioTeorico(p, cobrosP)
    const calDist = distribuirCobros(cal, cobrosP)
    for (const cuota of calDist) {
      if (cuota.estado === 'cobrada') continue
      if (cuota.fecha > hoy) continue
      resultado.push({
        _key:          p.id + '-' + cuota.num,
        prestamo_id:   p.id,
        centro_coste:  p.centro_coste || '—',
        alias:         p.alias,
        cliente:       clientesMap[p.cliente_id] || '—',
        intermediario: p.intermediarios?.nombre || '—',
        estado:        p.estado,
        num:           cuota.num,
        fecha:         cuota.fecha,
        fechaEfectiva: cuota.fecha,
        total:         cuota.total,
        principal:     cuota.principal ?? null,
        diasRetraso:   diasEntre(cuota.fecha),
        esJudicial:    false,
        registrando:   false,
      })
    }
  }

  cuotasPendientes.value = resultado
  loadingProximos.value  = false
}

onMounted(calcularPendientes)
watch(seccion, v => { if (v === 'proximos') calcularPendientes() })

const prestamosUnicosPrev = computed(() => [...new Set(cuotasPendientes.value.map(c => c.alias).filter(x => x && x !== '—'))].sort())
const intermediariosUnicos = computed(() => [...new Set(cuotasPendientes.value.map(c => c.intermediario).filter(x => x && x !== '—'))].sort())
const cuotasFiltadasBase = computed(() => {
  let list = cuotasPendientes.value
  if (filtroPrestamosPrev.value) list = list.filter(c => c.alias === filtroPrestamosPrev.value)
  if (filtroIntermediario.value) list = list.filter(c => c.intermediario === filtroIntermediario.value)
  if (filtroEstado.value)        list = list.filter(c => c.estado === filtroEstado.value)
  if (soloMasAntiguo.value) {
    const porPrestamo = {}
    for (const c of list) {
      if (!porPrestamo[c.prestamo_id] || c.fecha < porPrestamo[c.prestamo_id].fecha) {
        porPrestamo[c.prestamo_id] = c
      }
    }
    list = Object.values(porPrestamo)
  }
  return list
})
const sortPrevKey = usePersistedRef('cobros.sortPrevKey', 'fecha')
const sortPrevDir = usePersistedRef('cobros.sortPrevDir', 'asc')
const { sorted: cuotasFiltradas, setSort: setSortPrev, thIcon: thIconPrev, thClass: thClassPrev } = useSort(cuotasFiltadasBase, 'fecha', 'asc', sortPrevKey, sortPrevDir)

const totalPendienteGlobal = computed(() => cuotasPendientes.value.reduce((s, c) => s + Number(c.total || 0), 0))
const totalJudicialGlobal  = computed(() => cuotasPendientes.value.filter(c => c.esJudicial).reduce((s, c) => s + Number(c.total || 0), 0))
const cuotasAgrupadas = computed(() => {
  const grupos = {}
  for (const c of cuotasFiltradas.value) {
    const key = c.prestamo_id
    if (!grupos[key]) grupos[key] = { alias: c.alias, cliente: c.cliente, prestamo_id: key, lineas: [], totalPendiente: 0 }
    grupos[key].lineas.push(c)
    grupos[key].totalPendiente = Math.round((grupos[key].totalPendiente + Number(c.total || 0)) * 100) / 100
  }
  return Object.values(grupos).sort((a,b) => (a.alias || '').localeCompare(b.alias || ''))
})

const totalPendiente = computed(() => cuotasFiltradas.value.reduce((s, c) => s + Number(c.total || 0), 0))

async function cobrarCuota(cuota) {
  cuota.registrando = true
  const { error } = await supabase.from('cobros').insert({
    id:                'CB' + uuid(),
    prestamo_id:       cuota.prestamo_id,
    cuota_num:         String(cuota.num),
    fecha_teorica:     cuota.fecha,
    fecha_real:        cuota.fechaEfectiva || cuota.fecha,
    importe:           cuota.total,
    importe_principal: cuota.principal,
    tipo:              'pago_cuota',  // judicialización no genera cobro en BD
    notas:             '',
    empresa_id:        empresaId.value,
  })
  if (error) { alert(traducirErrorSupabase(error)); cuota.registrando = false; return }
  // Quitar de la lista
  cuotasPendientes.value = cuotasPendientes.value.filter(c => c._key !== cuota._key)
  await cargarCobros()
}

// ── Histórico ────────────────────────────────────────────────────────────────
const cobrosRaw = ref([])
const { sorted: cobrosOrdenados, setSort, thIcon, thClass } = useSort(cobrosRaw, 'fecha_real', 'desc')
const busqueda      = usePersistedRef('cobros.busqueda', '')
const filtroPrestamo = usePersistedRef('cobros.filtroPrestamo', '')

async function cargarCobros() {
  const { data } = await supabase
    .from('cobros')
    .select('*, prestamos(alias, clientes(nombre))')
    .order('fecha_real', { ascending: false })
  cobrosRaw.value = data || []
}

onMounted(cargarCobros)

async function eliminarCobro(cobro) {
  // Los pagos a partícipes no están vinculados a cobros concretos, por lo que
  // un cobro puede eliminarse aunque existan pagos registrados en este préstamo.
  if (!confirm(`¿Eliminar el cobro de la cuota ${cobro.cuota_num} del préstamo ${cobro.prestamos?.alias || cobro.prestamo_id}?`)) return
  await supabase.from('cobros').delete().eq('id', cobro.id)
  await cargarCobros()
}

const totalCobrado = computed(() => cobrosOrdenados.value.reduce((s, c) => s + Number(c.importe), 0))

// Calcula el inicio del rango:
// - Si fecha ref es último día del mes → día 1 del mismo mes (mes natural)
// - Si no → mismo día en mes anterior + 1. Si ese día no existe, último día mes anterior + 1 (= día 1 mes actual)
function inicioRangoMesAnterior(fechaRef) {
  // Parseo manual para evitar problemas de zona horaria en el navegador
  const partes = fechaRef.split('-').map(Number)
  const anio = partes[0], mes = partes[1], dia = partes[2]  // mes es 1-based
  const pad = n => String(n).padStart(2, '0')

  // Último día del mes de la fecha ref (new Date(anio, mes, 0) = último día del mes mes)
  const ultimoDiaMes = new Date(anio, mes, 0).getDate()

  // Caso 1: último día del mes → mes natural completo (01/mm/aaaa)
  if (dia === ultimoDiaMes) {
    return anio + '-' + pad(mes) + '-01'
  }

  // Caso 2: mismo día en mes anterior + 1
  const mesAnt = mes === 1 ? 12 : mes - 1
  const anioAnt = mes === 1 ? anio - 1 : anio
  const ultimoDiaMesAnt = new Date(anioAnt, mesAnt, 0).getDate()
  const diaEnMesAnt = Math.min(dia, ultimoDiaMesAnt)
  // +1 día usando Date (mesAnt es 1-based, Date usa 0-based)
  const inicio = new Date(anioAnt, mesAnt - 1, diaEnMesAnt + 1)
  return inicio.getFullYear() + '-' + pad(inicio.getMonth() + 1) + '-' + pad(inicio.getDate())
}

// ── Modal Modificar ───────────────────────────────────────────────────────────
const modalModificar    = ref(false)
const guardandoModificar = ref(false)
const formModificar     = ref({ cuotaRef: null, alias: '', num: '', fecha: '', importe: 0, fechaReal: '', notas: '' })

function abrirModificar(cuota) {
  formModificar.value = {
    cuotaRef: cuota,
    alias:     cuota.alias,
    num:       cuota.num,
    fecha:     cuota.fecha,
    importe:   cuota.total,
    fechaReal: cuota.fechaEfectiva || cuota.fecha,
    notas:     '',
  }
  modalModificar.value = true
}

async function guardarModificar() {
  const f = formModificar.value
  const errores = validarCampos(f, [
    { campo: 'importe',   label: 'Importe (€)',       requerido: true, tipo: 'numero', min: 0.01 },
    { campo: 'fechaReal', label: 'Fecha real de cobro', requerido: true, tipo: 'fecha' },
  ])
  if (errores.length) return alert(errores.join('\n'))
  guardandoModificar.value = true
  const cuota = f.cuotaRef
  const { error } = await supabase.from('cobros').insert({
    id:                'CB' + uuid(),
    prestamo_id:       cuota.prestamo_id,
    cuota_num:         String(cuota.num),
    fecha_teorica:     cuota.fecha,
    fecha_real:        f.fechaReal,
    importe:           Number(f.importe),
    importe_principal: cuota.principal || 0,
    tipo:              'pago_cuota',
    notas:             f.notas || '',
    empresa_id:        empresaId.value,
  })
  guardandoModificar.value = false
  if (error) return alert(traducirErrorSupabase(error))
  modalModificar.value = false
  cuotasPendientes.value = cuotasPendientes.value.filter(c => c._key !== cuota._key)
  await cargarCobros()
}

const cobrosUltimos30 = computed(() => {
  const hoyRef = today()
  const limiteInf = inicioRangoMesAnterior(hoyRef)
  return cobrosOrdenados.value.filter(c => {
    const fecha = c.fecha_real || c.fecha_teorica
    return fecha >= limiteInf && fecha <= hoyRef
  })
})

const cobrosRangoLabel = computed(() => {
  const hoyRef = today()
  return fmtDate(inicioRangoMesAnterior(hoyRef)) + ' – ' + fmtDate(hoyRef)
})
const cobrosUltimos30imp = computed(() => cobrosUltimos30.value.reduce((s, c) => s + Number(c.importe), 0))
const cobrosUltimos30n   = computed(() => cobrosUltimos30.value.length)

const prestamosUnicos = computed(() => {
  const aliases = cobrosOrdenados.value.map(c => c.prestamos?.alias).filter(Boolean)
  return [...new Set(aliases)].sort()
})

const cobrosFiltrados = computed(() => {
  let list = cobrosOrdenados.value
  if (filtroPrestamo.value) list = list.filter(c => c.prestamos?.alias === filtroPrestamo.value)
  const q = busqueda.value.toLowerCase()
  if (!q) return list
  return list.filter(c => (c.prestamos?.alias || '').toLowerCase().includes(q))
})
</script>
