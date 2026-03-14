<template>
  <div>
    <div class="back-btn" @click="$emit('navigate','prestamos')">← Volver a Préstamos</div>

    <div class="alert alert-danger" v-if="prestamo.estado === 'judicializado'">
      ⚖ Préstamo judicializado desde {{ fmtDate(prestamo.fecha_judicializacion) }}. Importe demanda: {{ fmtDec(prestamo.importe_demanda) }}.
    </div>
    <div class="alert alert-info" v-if="prestamo.estado === 'cancelado'">
      ⊗ Préstamo cancelado el {{ fmtDate(prestamo.fecha_cancelacion) }}.
    </div>

    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
      <div>
        <div style="font-size:18px;font-weight:700">{{ prestamo.alias }}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">{{ prestamo.id }} · CC: {{ prestamo.centro_coste || '—' }}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span v-html="getTipoBadge(prestamo.tipo_prestamo)" />
        <span v-html="estadoBadge" />
        <button class="btn btn-sm btn-registrar" @click="$emit('editar', prestamo)">✎ Editar</button>
        <button v-if="prestamo.estado !== 'cancelado' && prestamo.estado !== 'judicializado'" class="btn btn-sm btn-registrar" @click="modalAmortParcial = true">$ Amort. Parcial</button>
        <button v-if="prestamo.estado !== 'cancelado'" class="btn btn-sm" style="background:var(--orange);border-color:var(--orange);color:#fff" @click="modalJud = null; modalCancelar = true">⊗ Cancelar</button>
        <button v-if="prestamo.estado === 'cancelado'" class="btn btn-sm" style="background:var(--blue,#3b82f6);border-color:var(--blue,#3b82f6);color:#fff" @click="modalCancelar = 'revertir'">↩ Revertir cancelación</button>
        <button v-if="prestamo.estado !== 'cancelado' && prestamo.estado !== 'judicializado'" class="btn btn-sm btn-danger" @click="modalCancelar = false; modalJud = 'judicializar'">⚖ Judicializar</button>
        <button v-if="prestamo.estado === 'judicializado'" class="btn btn-sm" style="background:var(--orange);border-color:var(--orange);color:#fff" @click="modalJud = 'revertir'">↩ Revertir judicialización</button>
      </div>
    </div>

    <!-- KPIs -->
    <!-- KPIs línea 1: datos del préstamo -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
      <div class="kpi-card kc-yellow">
        <div class="kpi-label">Principal</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ fmtInt(prestamo.importe) }}</div>
        <div class="kpi-sub" style="color:var(--green)">Pendiente: {{ fmtInt(capitalPendiente) }}</div>
        <div class="kpi-sub" style="color:var(--orange)" v-if="tieneAmortParcial">Amortizado: {{ fmtInt(totalAmortizado) }}</div>
        <div class="kpi-sub" style="color:var(--blue)" v-if="tieneParticipes">Promocima: {{ fmtInt(importePropiaActiva) }}</div>
      </div>
      <div class="kpi-card" :class="tieneParticipes ? 'kc-purple' : 'kc-gray-dim'">
        <div class="kpi-label">Parte Participada</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">
          {{ tieneParticipes ? fmtInt(importeParticipado) : '—' }}
        </div>
        <template v-if="tieneParticipes">
          <div class="kpi-sub" style="color:var(--green)">Activa: {{ fmtInt(importeParticipActivo) }}</div>
          <div class="kpi-sub" style="color:var(--orange)" v-if="tieneAmortParcial">Amortizada: {{ fmtInt(importeParticipAmortizado) }}</div>
          <div class="kpi-sub" style="color:var(--text3)">{{ ccpActivos.length }} contrato{{ ccpActivos.length !== 1 ? 's' : '' }} CCP</div>
        </template>
        <div class="kpi-sub" style="color:var(--text3)" v-else>Sin contratos CCP</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Duración</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ prestamo.duracion_meses }} m</div>
        <div class="kpi-sub">Día cobro: {{ prestamo.dia_cobro }}</div>
      </div>
      <div class="kpi-card" :class="parseFloat(ltvDetalle) <= 40 ? 'kc-green' : 'kc-red'">
        <div class="kpi-label">LTV</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700" :style="{ color: parseFloat(ltvDetalle) <= 40 ? 'var(--green)' : 'var(--orange)' }">{{ ltvDetalle }}%</div>
      </div>
    </div>
    <!-- KPIs línea 2: cobros y situación -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
      <div class="kpi-card kc-green">
        <div class="kpi-label">Cuota {{ (prestamo.periodicidad || 'mensual').toUpperCase() }}</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ fmtDec(cuotaDetalle.total) }}</div>
        <div class="kpi-sub" style="color:var(--text3)">Int: {{ fmtDec(cuotaDetalle.interes) }}</div>
        <div class="kpi-sub" style="color:var(--text3)">Ppal: {{ fmtDec(cuotaDetalle.principal) }}</div>
      </div>
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Total Cobrado</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ fmtInt(totalCobrado) }}</div>
      </div>
      <div class="kpi-card" :class="importeRetrasado > 0 ? 'kc-orange' : 'kc-gray-dim'">
        <div class="kpi-label">Retrasado</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700" :style="{ color: importeRetrasado > 0 ? 'var(--orange)' : 'var(--text3)' }">
          {{ importeRetrasado > 0 ? fmtInt(importeRetrasado) : '—' }}
        </div>
        <div class="kpi-sub" style="color:var(--text3)" v-if="importeRetrasado > 0">{{ cobrosVencidosPendientes.length }} cuota{{ cobrosVencidosPendientes.length !== 1 ? 's' : '' }}</div>
        <div class="kpi-sub" style="color:var(--text3)" v-else>Al día</div>
      </div>
      <div class="kpi-card kc-red">
        <div class="kpi-label">Int. Demora</div>
        <div style="font-family:var(--mono);font-size:20px;font-weight:700">{{ fmtDec(interesDemoraTotal) }}</div>
        <div class="kpi-sub" style="color:var(--text3)">Pagados: {{ fmtDec(interesDemoraHistorico) }}</div>
        <div class="kpi-sub" style="color:var(--text3)">Vencidos: {{ fmtDec(interesDemoraVencidas) }}</div>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs">
      <div class="tab" :class="{ active: tabActivo === 'detalle' }" @click="tabActivo = 'detalle'">Detalle</div>
      <div class="tab" :class="{ active: tabActivo === 'calendario' }" @click="tabActivo = 'calendario'">Calendario</div>
      <div class="tab" :class="{ active: tabActivo === 'cobros' }" @click="tabActivo = 'cobros'">Cobros Reales</div>
      <div class="tab" :class="{ active: tabActivo === 'participaciones' }" @click="tabActivo = 'participaciones'">Participaciones</div>
    </div>

    <!-- Tab Detalle -->
    <div v-if="tabActivo === 'detalle'" class="table-card" style="padding:24px;display:grid;gap:28px">

      <!-- Condiciones -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Condiciones</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Tipo préstamo</span>
            <span style="font-size:13px;font-weight:500">{{ prestamo.tipo_prestamo }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Periodicidad</span>
            <span style="font-size:13px;font-weight:500;text-transform:capitalize">{{ prestamo.periodicidad }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Interés ordinario</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.interes_ordinario }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Interés demora</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.interes_demora }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Comisión apertura</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.comision_apertura }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Fecha inicio</span>
            <span style="font-size:13px;font-weight:500">{{ fmtDate(prestamo.fecha_inicio) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Duración</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.duracion_meses }} meses</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Día de cobro</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.dia_cobro }}</span>
          </div>
        </div>
      </div>

      <!-- Partes -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Partes</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Cliente</span>
            <span style="font-size:13px;font-weight:500">{{ prestamo.clientes?.nombre || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Intermediario</span>
            <span style="font-size:13px;font-weight:500">{{ prestamo.intermediarios?.nombre || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Centro de coste</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.centro_coste || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Garantía -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Garantía</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Tipo</span>
            <span style="font-size:13px;font-weight:500">{{ prestamo.garantia_tipo || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Dirección</span>
            <span style="font-size:13px;font-weight:500">{{ prestamo.garantia_direccion || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Tasación</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamo.garantia_tasacion ? fmt(prestamo.garantia_tasacion) : '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">LTV</span>
            <span style="font-size:13px;font-weight:600;font-family:var(--mono)" :style="parseFloat(ltvDetalle) <= 40 ? 'color:var(--green)' : 'color:var(--orange)'">{{ ltvDetalle }}%</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Tab Calendario -->
    <div v-if="tabActivo === 'calendario'">

      <!-- Vista judicializada -->
      <template v-if="prestamo.estado === 'judicializado'">
        <div class="alert alert-danger" style="display:flex;align-items:center;gap:8px">
          ⚖ Préstamo judicializado el {{ fmtDate(prestamo.fecha_judicializacion) }}. Las cuotas pendientes han sido sustituidas por la reclamación judicial.
        </div>
        <div class="table-card">
          <div class="table-header"><h3>Cuotas</h3></div>
          <div style="overflow-y:auto;width:100%">
            <table style="width:100%">
              <thead><tr><th>Nº</th><th>Fecha</th><th style="text-align:right">Interés</th><th style="text-align:right">Principal</th><th style="text-align:right">Total</th><th style="text-align:right">Cobrado</th><th style="text-align:right">Pendiente</th><th>Estado</th></tr></thead>
              <tbody>
                <tr v-for="c in cuotasCobradasAntesJudicializacion" :key="c.esAmortParcial ? 'ap-'+c.fecha : c.num"
                    :style="c.esAmortParcial ? 'background:rgba(99,102,241,0.07);border-top:2px solid rgba(99,102,241,0.25)' : ''">
                  <td class="td-mono td-center">
                    <span v-if="c.esAmortParcial" style="color:var(--accent);font-weight:700">AP</span>
                    <span v-else>{{ c.num }}</span>
                  </td>
                  <td style="font-size:12px">
                    <span v-if="c.esAmortParcial" style="color:var(--accent);font-weight:600">⬇ {{ fmtDate(c.fecha) }}</span>
                    <span v-else>{{ fmtDate(c.fecha) }}</span>
                  </td>
                  <td class="td-mono td-right">
                    <span v-if="c.esAmortParcial" style="color:var(--text3)">{{ c.interesOrdinario > 0 ? fmtDec(c.interesOrdinario) : '—' }}</span>
                    <span v-else>{{ fmtDec(c.interes) }}</span>
                  </td>
                  <td class="td-mono td-right">
                    <span v-if="c.esAmortParcial" style="color:var(--green);font-weight:600">{{ fmtDec(c.principal) }}</span>
                    <span v-else>{{ c.principal > 0 ? fmtDec(c.principal) : '—' }}</span>
                  </td>
                  <td class="td-mono td-right" style="font-weight:600">{{ fmtDec(c.total) }}</td>
                  <td class="td-mono td-right" style="color:var(--green)">{{ fmtDec(c.cobrado) }}</td>
                  <td class="td-mono td-right" style="color:var(--text3)">—</td>
                  <td>
                    <span v-if="c.esAmortParcial" class="badge badge-blue" style="font-size:10px">⬇ Amort.</span>
                    <span v-else class="badge badge-green">cobrada</span>
                  </td>
                </tr>
                <tr v-if="cobroJudicial" style="background:rgba(239,68,68,0.06)">
                  <td class="td-mono td-center" style="color:var(--red);font-weight:700">J</td>
                  <td style="font-size:12px">{{ fmtDate(prestamo.fecha_judicializacion) }}</td>
                  <td class="td-mono td-right" style="color:var(--text3)">—</td>
                  <td class="td-mono td-right" style="color:var(--text3)">—</td>
                  <td class="td-mono td-right" style="font-weight:700;vertical-align:top">
                    {{ fmtDec(cobroJudicial.importe) }}
                    <div style="margin-top:4px;font-size:10px;color:var(--text3);line-height:1.8">
                      <div v-if="cobroJudicial.importe_principal > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(cobroJudicial.importe_principal) }}</span></div>
                      <div v-if="cobroJudicial.importe_interes_ordinario > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(cobroJudicial.importe_interes_ordinario) }}</span></div>
                      <div v-if="cobroJudicial.importe_gastos > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Gastos:</span><span style="font-family:var(--mono)">{{ fmtDec(cobroJudicial.importe_gastos) }}</span></div>
                      <div v-if="demoraJudicial > 0" style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;padding-top:2px;border-top:1px solid var(--border)">
                        <span>Int. Dem. ({{ diasDesdJudicializacion }}):</span>
                        <span style="font-family:var(--mono)">{{ fmtDec(demoraJudicial) }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="td-mono td-right" style="color:var(--text3)">—</td>
                  <td class="td-mono td-right" style="color:var(--text3)">—</td>
                  <td><span class="badge badge-red">judicial</span></td>
                </tr>
                <tr v-if="!cobroJudicial">
                  <td colspan="8" class="table-empty" style="color:var(--orange)">Cobro judicial no registrado aún</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Vista normal -->
      <template v-else>
        <div class="alert alert-info">El calendario teórico es inmutable.</div>
        <div class="table-card">
          <div class="table-header">
            <h3>Cuotas Teóricas</h3>
            <select class="form-control" v-model="filtroCuotas" style="width:150px;padding:5px 10px;font-size:12px" :style="filtroCuotas !== 'todas' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cobrada">Cobradas</option>
            </select>
          </div>
          <div style="overflow-y:auto;width:100%">
            <table style="width:100%">
              <thead><tr><th>Nº</th><th>Fecha</th><th style="text-align:right">Principal</th><th style="text-align:right">Intereses</th><th style="text-align:right">Total</th><th style="text-align:right">Cobrado</th><th style="text-align:right">Pendiente</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                <template v-for="c in cuotasFiltradas" :key="c.esAmortParcial ? 'ap-' + c.fecha : c.num">

                  <!-- Fila de amortización parcial -->
                  <tr v-if="c.esAmortParcial" style="background:color-mix(in srgb, var(--blue,#3b82f6) 8%, transparent);border-left:3px solid var(--blue,#3b82f6)">
                    <td class="td-mono td-center" style="color:var(--text3)">—</td>
                    <td style="font-size:12px">{{ fmtDate(c.fecha) }}</td>
                    <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmtDec(c.principal) }}</td>
                    <td class="td-mono td-right" style="color:var(--text2)">
                      <span v-if="c.interesOrdinario > 0 || c.interesDemora > 0">
                        {{ fmtDec(c.interes) }}
                        <span v-if="c.interesDemora > 0" style="font-size:10px;color:var(--orange)"> (+{{ fmtDec(c.interesDemora) }} demora)</span>
                      </span>
                      <span v-else>—</span>
                    </td>
                    <td class="td-mono td-right" style="font-weight:600">{{ fmtDec(c.total) }}</td>
                    <td class="td-mono td-right" style="color:var(--green)">{{ fmtDec(c.cobrado) }}</td>
                    <td class="td-mono td-right" style="color:var(--text3)">—</td>
                    <td colspan="2">
                      <span class="badge badge-blue" style="background:color-mix(in srgb,var(--blue,#3b82f6) 15%,transparent);color:var(--blue,#3b82f6);border-color:var(--blue,#3b82f6)">💰 Amort. Parcial</span>
                    </td>
                  </tr>

                  <!-- Fila normal de cuota -->
                  <tr v-else>
                    <td class="td-mono td-center">{{ c.num }}</td>
                    <td style="font-size:12px">{{ fmtDate(c.fecha) }}</td>
                    <td class="td-mono td-right">{{ c.principal > 0 ? fmtDec(c.principal) : '—' }}</td>
                    <td class="td-mono td-right">{{ fmtDec(c.interes) }}</td>
                    <td class="td-mono td-right" style="font-weight:600">{{ fmtDec(c.total) }}</td>
                    <td class="td-mono td-right" style="color:var(--green)">{{ c.cobrado > 0 ? fmtDec(c.cobrado) : '—' }}</td>
                    <td class="td-mono td-right" :style="{ color: c.pendiente > 0 ? 'var(--orange)' : 'var(--text3)' }">{{ c.pendiente > 0.001 ? fmtDec(c.pendiente) : '—' }}</td>
                    <td>
                      <span class="badge" :class="{
                        'badge-green':  c.estado === 'cobrada',
                        'badge-orange': c.estado === 'parcial' || (c.estado === 'pendiente' && c.fecha <= hoyStr),
                        'badge-gray':   c.estado === 'pendiente' && c.fecha > hoyStr
                      }">{{ c.estado === 'pendiente' && c.fecha <= hoyStr ? 'con retraso' : c.estado }}</span>
                    </td>
                    <td>
                      <button v-if="c.estado !== 'cobrada' && prestamo.estado !== 'cancelado'" class="btn btn-sm btn-cobrar" style="padding:3px 10px;font-size:11px" :disabled="saving" @click="cobrarCuotaDirecto(c)"><span v-if="saving" class="btn-spinner"></span>✓ Cobrar</button>
                    </td>
                  </tr>

                </template>
                <tr v-if="!cuotasFiltradas.length"><td colspan="9" class="table-empty">Sin cuotas</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Tab Cobros -->
    <div v-if="tabActivo === 'cobros'">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <!-- Zona importación Excel con drag & drop -->
        <div style="display:flex;align-items:center;gap:8px">
          <label
            class="excel-drop-zone"
            :class="{ 'excel-drop-over': dragOver, 'excel-importing': importando }"
            @dragover.prevent="prestamo.estado === 'activo' && (dragOver = true)"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="prestamo.estado === 'activo' && onDrop($event)"
            :style="prestamo.estado !== 'activo' ? 'opacity:0.4;pointer-events:none;cursor:not-allowed' : ''"
            :title="prestamo.estado === 'judicializado' ? 'No disponible en préstamos judicializados' : prestamo.estado === 'cancelado' ? 'No disponible en préstamos cancelados' : 'Arrastra un Excel aquí o haz clic para seleccionar (tabla Pagos con columnas Fecha e Importe)'"
          >
            <span v-if="importando" class="btn-spinner" style="width:12px;height:12px;border-width:2px"></span>
            <span v-else style="font-size:13px">📥</span>
            <span>{{ dragOver ? 'Suelta el Excel…' : importando ? 'Importando…' : 'Importar Excel' }}</span>
            <input type="file" accept=".xlsx,.xls" style="display:none" @change="importarExcel" :disabled="importando || prestamo.estado !== 'activo'">
          </label>
          <!-- Resultado -->
          <span v-if="importResult" :style="{fontSize:'11px', color: importResult.error ? 'var(--red)' : importResult.omitidos > 0 ? 'var(--orange)' : 'var(--green)'}">
            {{ importResult.error || (importResult.insertados + ' cobro(s) importados' + (importResult.omitidos ? ', ' + importResult.omitidos + ' omitidos (fecha ya existía)' : '')) }}
          </span>
        </div>
        <!-- Botones derecha -->
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-registrar" :disabled="cobrosVencidosPendientes.length === 0 || saving || prestamo.estado === 'judicializado'" :title="prestamo.estado === 'judicializado' ? 'Revierte la judicialización primero' : ''" @click="registrarHastaHoy">
            <span v-if="saving" class="btn-spinner"></span>⚡ Registrar hasta hoy ({{ cobrosVencidosPendientes.length }})
          </button>
          <button class="btn btn-sm btn-danger" :disabled="cobros.length === 0 || saving || prestamo.estado === 'cancelado' || prestamo.estado === 'judicializado'" :title="prestamo.estado === 'cancelado' ? 'Revierte la cancelación primero' : prestamo.estado === 'judicializado' ? 'Revierte la judicialización primero' : ''" @click="anularTodosCobros">
            <span v-if="saving" class="btn-spinner"></span>⊗ Anular todos
          </button>
          <button class="btn btn-sm btn-registrar" :disabled="prestamo.estado === 'cancelado' || prestamo.estado === 'judicializado'" :title="prestamo.estado === 'cancelado' ? 'Revierte la cancelación primero' : prestamo.estado === 'judicializado' ? 'Revierte la judicialización primero' : ''" @click="abrirRegistrarCobro">+ Registrar Cobro</button>
        </div>
      </div>
      <div class="table-card">
        <div class="table-header"><h3>Cobros Reales ({{ cobros.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th style="text-align:right">Importe</th>
              <th>Tipo</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cobrosEnriquecidos" :key="c.id">
              <td style="font-size:12px">{{ fmtDate(c.fecha_real) }}</td>
              <td class="td-mono td-right" style="font-weight:600;vertical-align:top">
                {{ fmtDec(c.importe) }}
                <div v-if="c.tipo === 'amortizacion_parcial'" style="margin-top:5px;font-size:10px;color:var(--text3);line-height:1.8">
                  <div v-if="c.importe_principal > 0">Principal: <strong>{{ fmtDec(c.importe_principal) }}</strong></div>
                  <div v-if="c.importe_interes_ordinario > 0">Int. ord.: {{ fmtDec(c.importe_interes_ordinario) }}</div>
                  <div v-if="c.importe_interes_demora > 0">Demora: {{ fmtDec(c.importe_interes_demora) }}</div>
                </div>
                <div v-if="c.tipo === 'cancelacion'" style="margin-top:5px;font-size:10px;color:var(--text3);line-height:1.8">
                  <div v-if="c.importe_principal > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_principal) }}</span></div>
                  <div v-if="c.importe_interes_ordinario > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_interes_ordinario) }}</span></div>
                  <div v-if="c.importe_interes_demora > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Int. dem.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_interes_demora) }}</span></div>
                  <div v-if="c.gastos_devengan > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Gastos (dev.):</span><span style="font-family:var(--mono)">{{ fmtDec(c.gastos_devengan) }}</span></div>
                  <div v-if="(c.importe_gastos - c.gastos_devengan) > 0.01" style="display:flex;justify-content:space-between;gap:12px"><span>Gastos (no dev.):</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_gastos - c.gastos_devengan) }}</span></div>
                </div>
                <div v-if="c.tipo === 'judicializacion'" style="margin-top:5px;font-size:10px;color:var(--text3);line-height:1.8">
                  <div v-if="c.importe_principal > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_principal) }}</span></div>
                  <div v-if="c.importe_interes_ordinario > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_interes_ordinario) }}</span></div>
                  <div v-if="c.importe_gastos > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Gastos:</span><span style="font-family:var(--mono)">{{ fmtDec(c.importe_gastos) }}</span></div>
                </div>
              </td>

              <td>
                <span class="badge" :class="c.tipo === 'cancelacion' ? 'badge-red' : c.tipo === 'judicializacion' ? 'badge-orange' : c.tipo === 'amortizacion_parcial' ? 'badge-blue' : 'badge-green'">
                  {{ c.tipo === 'cancelacion' ? 'Cancelación' : c.tipo === 'judicializacion' ? 'Judicialización' : c.tipo === 'amortizacion_parcial' ? 'Amort. Parcial' : 'Pago cuota' }}
                </span>
              </td>
              <td style="font-size:12px;color:var(--text3)">{{ c.notas || '—' }}</td>
              <td>
                <button
                  class="btn btn-sm btn-danger-solid"
                  style="padding:2px 7px;font-size:13px"
                  :disabled="prestamo.estado === 'cancelado' || prestamo.estado === 'judicializado'"
                  :title="prestamo.estado === 'cancelado' ? 'Revierte la cancelación primero' : prestamo.estado === 'judicializado' ? 'Revierte la judicialización primero' : 'Eliminar cobro'"
                  @click="eliminarCobro(c)"
                >✕</button>
              </td>
            </tr>
            <tr v-if="!cobros.length"><td colspan="9" class="table-empty">Sin cobros registrados</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pestaña Participaciones -->
    <div v-if="tabActivo === 'participaciones'">
      <div class="table-card">
        <div class="table-header"><h3>Participaciones activas ({{ ccpActivos.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
        <div v-if="!ccpActivos.length" class="table-empty">Sin partícipes en este préstamo</div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Partícipe</th>
              <th style="text-align:right">Importe</th>
              <th style="text-align:right">% Participación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in ccpActivos" :key="c.id">
              <td>{{ c.participes?.nombre || '—' }}</td>
              <td class="td-mono td-right" style="color:var(--purple)">{{ fmtInt(c.importe_participacion) }}</td>
              <td class="td-mono td-right">
                {{ prestamo.importe > 0 ? ((Number(c.importe_participacion) / Number(prestamo.importe)) * 100).toFixed(1) : '—' }}%
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border);font-weight:700">
              <td>Total</td>
              <td class="td-mono td-right" style="color:var(--purple)">{{ fmtInt(ccpActivos.reduce((s,c) => s + Number(c.importe_participacion), 0)) }}</td>
              <td class="td-mono td-right">
                {{ prestamo.importe > 0 ? ((ccpActivos.reduce((s,c) => s + Number(c.importe_participacion), 0) / Number(prestamo.importe)) * 100).toFixed(1) : '—' }}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal Cobrar Cuota -->
    <div class="modal-overlay" v-if="modalCuota">
      <div class="modal">
        <div class="modal-header">
          <h2>Cobrar Cuota {{ cuotaSeleccionada?.num }}</h2>
          <button class="btn btn-ghost btn-sm" @click="modalCuota = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            Próxima cuota: <strong>Nº {{ cuotaSeleccionada?.num }}</strong> —
            Fecha prevista: <strong>{{ fmtDate(cuotaSeleccionada?.fecha) }}</strong> —
            Pendiente: <strong>{{ fmtDec(cuotaSeleccionada?.pendiente) }}</strong>
          </div>
          <div class="form-grid cols-1">
            <div class="form-group"><label class="form-label">Fecha Real <span class="req">*</span></label><input class="form-control" type="date" v-model="formCobro.fecha"></div>
            <div class="form-group"><label class="form-label">Importe (€) <span class="req">*</span></label><input class="form-control" type="number" step="0.01" v-model="formCobro.importe"></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea class="form-control" v-model="formCobro.notas"></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="modalCuota = false">Cancelar</button>
          <button class="btn btn-registrar" @click="guardarCobro">Registrar Cobro</button>
        </div>
      </div>
    </div>

    <!-- Modales cancelar, judicializar y amortización parcial -->
    <ModalAmortizacionParcial
      v-model="modalAmortParcial"
      :prestamo-id="prestamo.id"
      :prestamo="prestamo"
      :cobros="cobros"
      :calendario-con-estado="calendarioConEstado"
      @ejecutado="$emit('recargar')"
    />
    <ModalCancelar
      v-model="modalCancelar"
      :prestamo-id="prestamo.id"
      :prestamo="prestamo"
      :cobros="cobros"
      :calendario-con-estado="calendarioConEstado"
      @ejecutado="$emit('recargar')"
    />
    <ModalJudicializar
      v-model="modalJud"
      :prestamo-id="prestamo.id"
      :prestamo="prestamo"
      :cobros="cobros"
      :calendario-con-estado="calendarioConEstado"
      @ejecutado="$emit('recargar')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtInt, fmtDate, generateCalendarioTeorico, getCuotaEstado, getEstadoBadge, getTipoBadge, uuid, today , fmtDec } from '../utils.js'
import ModalCancelar from './ModalCancelar.vue'
import ModalJudicializar from './ModalJudicializar.vue'
import ModalAmortizacionParcial from './ModalAmortizacionParcial.vue'

const props = defineProps({
  prestamo:    { type: Object, required: true },
  cobros:      { type: Array,  required: true },
  prestamoId:  { type: String, required: true },
})
const emit = defineEmits(['navigate', 'editar', 'recargar'])

// ── Estado local ──────────────────────────────
const tabActivo    = ref('detalle')
const saving       = ref(false)
const filtroCuotas = ref('pendiente')
const modalCuota   = ref(false)
const modalCancelar     = ref(false)
const modalAmortParcial = ref(false)
const modalJud     = ref(null)   // null | 'judicializar' | 'revertir'
const cuotaSeleccionada = ref(null)
const formCobro    = ref({ fecha: '', importe: 0, notas: '' })

// Contratos CCP activos de este préstamo (para KPI parte participada)
const ccpActivos   = ref([])

async function cargarCCP() {
  const { data } = await supabase.from('contratos_ccp')
    .select('id, importe_participacion, participes(nombre)')
    .eq('prestamo_id', props.prestamoId).eq('activo', true)
  ccpActivos.value = data || []
}

// Resetear tab al cambiar de préstamo
watch(() => props.prestamoId, () => { tabActivo.value = 'detalle'; cargarCCP() })
onMounted(cargarCCP)

// ── Computed ──────────────────────────────────
const hoyStr = computed(() => today())

const estadoBadge = computed(() => {
  const est = props.prestamo.estado
  if (est === 'cancelado' || est === 'judicializado') return getEstadoBadge(est)
  // Calcular situación al día / con retraso usando distribución secuencial
  const hoy = today()
  const vencidas = calendarioConEstado.value.filter(c => !c.esAmortParcial && c.fecha <= hoy)
  for (const cuota of vencidas) {
    if (cuota.estado !== 'cobrada') return getEstadoBadge('con_retraso')
  }
  return getEstadoBadge('al_dia')
})

const tieneParticipes    = computed(() => ccpActivos.value.length > 0)
const importeParticipado = computed(() =>
  ccpActivos.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)

// Ratio participado sobre el total del préstamo (ej: 0.2 si participan 20.000 de 100.000)
const ratioParticipado = computed(() => {
  const importe = Number(props.prestamo.importe)
  return importe > 0 ? importeParticipado.value / importe : 0
})

// Parte del amortizado que corresponde a los partícipes
const importeParticipAmortizado = computed(() =>
  Math.round(totalAmortizado.value * ratioParticipado.value * 100) / 100
)

// Parte activa de la participación (sobre capital pendiente)
const importeParticipActivo = computed(() =>
  Math.round(capitalPendiente.value * ratioParticipado.value * 100) / 100
)

// Parte propia de Promocima sobre capital pendiente (descontando amortizado)
const importePropiaActiva = computed(() =>
  Math.max(0, Math.round((capitalPendiente.value - importeParticipActivo.value) * 100) / 100)
)

// importePropia sin cambios (usado en otros sitios)
const importePropia = computed(() =>
  Math.max(0, Number(props.prestamo.importe) - importeParticipado.value)
)

const ltvDetalle = computed(() => {
  if (!props.prestamo?.garantia_tasacion) return '—'
  return (Number(props.prestamo.importe) / Number(props.prestamo.garantia_tasacion) * 100).toFixed(1)
})

const totalCobrado = computed(() => props.cobros.reduce((s, c) => s + Number(c.importe), 0))

// ── Capital pendiente (tiene en cuenta amortizaciones parciales) ──────────
const totalAmortizado = computed(() => {
  return props.cobros
    .filter(c => c.tipo === 'amortizacion_parcial')
    .reduce((s, c) => s + Number(c.importe_principal || 0), 0)
})

const capitalPendiente = computed(() => {
  const r = v => Math.round(v * 100) / 100
  const p = props.prestamo
  const importe = Number(p.importe)
  const amortParcialPrevio = totalAmortizado.value
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
    amortCuotas = r(amortCuotas)
  }
  return Math.max(0, r(importe - amortParcialPrevio - amortCuotas))
})

const tieneAmortParcial = computed(() =>
  props.cobros.some(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
)

const calendarioConEstado = computed(() => {
  const r = v => Math.round(v * 100) / 100

  // Amortizaciones parciales ordenadas por fecha — se intercalarán como filas especiales
  const amortParciales = props.cobros
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .map(c => ({
      esAmortParcial:   true,
      fecha:            c.fecha_real || c.fecha_teorica,
      principal:        r(Number(c.importe_principal || 0)),
      interes:          r(Number(c.importe_interes_ordinario || 0) + Number(c.importe_interes_demora || 0)),
      interesOrdinario: r(Number(c.importe_interes_ordinario || 0)),
      interesDemora:    r(Number(c.importe_interes_demora    || 0)),
      total:            r(Number(c.importe || 0)),
      cobrado:          r(Number(c.importe || 0)),
      pendiente:        0,
      estado:           'amortizacion_parcial',
      notas:            c.notas || '',
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Calendario teórico (ya tiene en cuenta las amortizaciones para recalcular cuotas)
  const cal = generateCalendarioTeorico(props.prestamo, props.cobros)

  // Cobros ordinarios ordenados por fecha para distribución secuencial por tramos.
  // Cada amortización parcial divide el calendario en tramos independientes:
  // los cobros anteriores a la AP cubren las cuotas anteriores a la AP,
  // y los cobros posteriores a la AP cubren las cuotas posteriores.
  const cobrosOrdinarios = props.cobros
    .filter(x => x.tipo === 'pago_cuota' || x.tipo === 'cancelacion')
    .map(x => ({ fecha: x.fecha_real || x.fecha_teorica, importe: r(Number(x.importe)) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Construir tramos: [ { hasta: fecha_AP | null, total: suma cobros en ese tramo } ]
  // Un tramo cubre cobros cuya fecha < fecha de la siguiente AP (o hasta el final si no hay más)
  const tramos = []
  let cobrosIdx = 0
  // Tramos: uno por cada AP + uno final
  const fechasAP = amortParciales.map(ap => ap.fecha)
  const limites  = [...fechasAP, null]  // null = sin límite (último tramo)

  for (const limite of limites) {
    let total = 0
    // Sumar cobros cuya fecha < limite (o todos si limite es null)
    const cobrosTramo = []
    while (cobrosIdx < cobrosOrdinarios.length) {
      const cb = cobrosOrdinarios[cobrosIdx]
      if (limite !== null && cb.fecha >= limite) break
      total = r(total + cb.importe)
      cobrosTramo.push(cb)
      cobrosIdx++
    }
    tramos.push({ limite, total })
  }

  // Distribuir: cada tramo cubre las cuotas de su rango
  let tramoIdx  = 0
  let restante  = tramos[0]?.total || 0
  let apIdx     = 0
  const filas   = []
  const fechaPrimeraAP = amortParciales.length > 0 ? amortParciales[0].fecha : null

  for (const c of cal) {
    // Intercalar filas de amortización parcial cuya fecha es anterior a esta cuota
    while (apIdx < amortParciales.length && amortParciales[apIdx].fecha < c.fecha) {
      filas.push(amortParciales[apIdx])
      apIdx++
      // Pasar al siguiente tramo de cobros
      tramoIdx++
      restante = tramos[tramoIdx]?.total || 0
    }

    // Distribuir cobros del tramo actual secuencialmente
    let cobrado, pendiente, estado
    if (restante <= 0) {
      cobrado   = 0
      pendiente = c.total
      estado    = 'pendiente'
    } else {
      cobrado   = r(Math.min(restante, c.total))
      restante  = r(restante - cobrado)
      pendiente = r(c.total - cobrado)
      estado    = pendiente < c.total * 0.01 ? 'cobrada'
                : cobrado   > 0              ? 'parcial'
                :                              'pendiente'
    }

    // Antes de la primera AP: todas las cuotas se dan por saldadas.
    // El total de la cuota pasa a ser lo que realmente se cobró (cobrado),
    // el pendiente es 0 y el estado cobrada. Las completamente pendientes se ocultan.
    if (fechaPrimeraAP && c.fecha < fechaPrimeraAP) {
      if (estado === 'pendiente') continue
      // cobrada o parcial: el importe real es lo cobrado
      filas.push({ ...c, total: cobrado, cobrado, pendiente: 0, estado: 'cobrada' })
      continue
    }

    filas.push({ ...c, cobrado, pendiente, estado })
  }

  // Amortizaciones parciales que queden después de la última cuota
  while (apIdx < amortParciales.length) {
    filas.push(amortParciales[apIdx])
    apIdx++
  }

  return filas
})

const cuotaDetalle = computed(() => {
  const cuotas = calendarioConEstado.value.filter(c => !c.esAmortParcial)
  if (!cuotas.length) return { total: 0, interes: 0, principal: 0 }
  const pendiente = cuotas.find(c => c.estado !== 'cobrada')
  const cuota = pendiente || cuotas[0]
  return { total: cuota.total, interes: cuota.interes, principal: cuota.principal }
})

const cuotasFiltradas = computed(() => {
  const todas = calendarioConEstado.value
  if (filtroCuotas.value === 'cobrada')   return todas.filter(c => c.estado === 'cobrada' || c.esAmortParcial)
  if (filtroCuotas.value === 'pendiente') return todas.filter(c => c.estado !== 'cobrada' || c.esAmortParcial)
  return todas
})

const cobrosVencidosPendientes = computed(() => {
  const hoy = today()
  return calendarioConEstado.value.filter(c => !c.esAmortParcial && c.estado !== 'cobrada' && c.fecha <= hoy)
})

const importeRetrasado = computed(() =>
  cobrosVencidosPendientes.value.reduce((s, c) => s + (c.pendiente || 0), 0)
)

const cobrosEnriquecidos = computed(() => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const tasaDemora = Number(props.prestamo.interes_demora) / 100
  return props.cobros.map(c => {
    let diasRetraso = 0, interesDemora = 0
    if (c.tipo === 'judicializacion') {
      if (c.fecha_teorica) {
        const fJud = new Date(c.fecha_teorica + 'T00:00:00')
        diasRetraso = Math.max(0, Math.round((hoy - fJud) / (1000 * 60 * 60 * 24)))
        if (diasRetraso > 0) interesDemora = Math.round(Number(c.importe) * tasaDemora / 365 * diasRetraso * 100) / 100
      }
    } else if (c.fecha_teorica && c.fecha_real && c.tipo !== 'cancelacion') {
      const fT = new Date(c.fecha_teorica + 'T00:00:00')
      const fR = new Date(c.fecha_real    + 'T00:00:00')
      diasRetraso = Math.max(0, Math.round((fR - fT) / (1000 * 60 * 60 * 24)))
      if (diasRetraso > 0) interesDemora = Math.round(Number(c.importe) * tasaDemora / 365 * diasRetraso * 100) / 100
    }
    return { ...c, diasRetraso, interesDemora }
  }).sort((a, b) => {
    // cobro de judicialización siempre al final
    if (a.tipo === 'judicializacion' && b.tipo !== 'judicializacion') return 1
    if (b.tipo === 'judicializacion' && a.tipo !== 'judicializacion') return -1
    return (b.fecha_real || b.fecha_teorica || '').localeCompare(a.fecha_real || a.fecha_teorica || '')
  })
})

const interesDemoraHistorico = computed(() =>
  cobrosEnriquecidos.value.filter(c => c.tipo !== 'cancelacion').reduce((s, c) => s + (c.interesDemora || 0), 0)
)

const interesDemoraVencidas = computed(() => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const tasa = Number(props.prestamo.interes_demora) / 100
  return calendarioConEstado.value
    .filter(c => (c.estado === 'pendiente' || c.estado === 'parcial') && new Date(c.fecha + 'T00:00:00') < hoy)
    .reduce((s, c) => {
      const dias = Math.round((hoy - new Date(c.fecha + 'T00:00:00')) / (1000 * 60 * 60 * 24))
      return s + Math.round(c.pendiente * tasa / 365 * dias * 100) / 100
    }, 0)
})

const interesDemoraTotal = computed(() => interesDemoraHistorico.value + interesDemoraVencidas.value)

// ── Computed judicialización ──────────────────
const cobroJudicial = computed(() => {
  const p = props.prestamo
  if (p?.estado === 'judicializado' && p?.importe_demanda) {
    return {
      tipo: 'judicializacion', cuota_num: 'J',
      fecha_teorica: p.fecha_judicializacion,
      importe: Number(p.importe_demanda),
      importe_principal: Number(p.demanda_principal || 0),
      importe_interes_ordinario: Number(p.demanda_interes_ordinario || 0),
      importe_gastos: Number(p.demanda_gastos || 0),
    }
  }
  return null
})

const cuotasCobradasAntesJudicializacion = computed(() => {
  if (!props.prestamo?.fecha_judicializacion) return []
  const fJud = props.prestamo.fecha_judicializacion
  return calendarioConEstado.value.filter(c =>
    (c.estado === 'cobrada' || c.esAmortParcial) && c.fecha <= fJud
  )
})

const diasDesdJudicializacion = computed(() => {
  if (!props.prestamo?.fecha_judicializacion) return 0
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fJud = new Date(props.prestamo.fecha_judicializacion + 'T00:00:00')
  return Math.max(0, Math.round((hoy - fJud) / (1000 * 60 * 60 * 24)))
})

const demoraJudicial = computed(() => {
  if (!cobroJudicial.value) return 0
  const tasa = Number(props.prestamo.interes_demora) / 100
  return Math.round(Number(cobroJudicial.value.importe) * tasa / 365 * diasDesdJudicializacion.value * 100) / 100
})

// ── Acciones cobros ──────────────────────────
async function cobrarCuotaDirecto(c) {
  if (saving.value) return
  saving.value = true
  try {
    const importe = Math.round(c.pendiente * 100) / 100
    await supabase.from('cobros').insert({
      id: 'CB' + uuid(),
      prestamo_id: props.prestamoId,
      cuota_num: String(c.num),
      fecha_teorica: c.fecha,
      fecha_real: c.fecha,
      importe,
      tipo: 'pago_cuota',
      notas: '',
    })
    emit('recargar')
    tabActivo.value = 'calendario'
  } finally { saving.value = false }
}

function abrirRegistrarCobro() {
  const primera = calendarioConEstado.value.find(c => !c.esAmortParcial && c.estado !== 'cobrada')
  cuotaSeleccionada.value = primera || { num: 1, fecha: today(), pendiente: 0 }
  formCobro.value = { fecha: primera?.fecha || today(), importe: primera?.pendiente?.toFixed(2) || '', notas: '' }
  modalCuota.value = true
}

async function guardarCobro() {
  if (!formCobro.value.fecha || !formCobro.value.importe) return alert('Fecha e importe son obligatorios')

  let restante = Math.round(Number(formCobro.value.importe) * 100) / 100
  const fechaReal = formCobro.value.fecha
  const notas = formCobro.value.notas

  // Obtener cuotas pendientes (o parcialmente cobradas) desde la seleccionada en adelante
  // Excluir filas especiales de amortización parcial
  const pendientes = calendarioConEstado.value.filter(
    c => !c.esAmortParcial && c.estado !== 'cobrada' && c.num >= cuotaSeleccionada.value.num
  )

  if (restante <= 0) return alert('El importe debe ser mayor que cero')

  // Calcular cuánto del importe cubre cuotas pendientes (para avisar si sobra)
  let simulado = restante
  for (const cuota of pendientes) {
    if (simulado <= 0.001) break
    simulado = Math.round((simulado - Math.min(simulado, cuota.pendiente)) * 100) / 100
  }

  // Si sobra importe después de cubrir todas las cuotas pendientes, informar
  if (simulado > 0.01) {
    const msgExceso = simulado < Number(formCobro.value.importe)
      ? `El importe introducido cubre varias cuotas pendientes, pero sobran ${simulado.toFixed(2)} € que superan el total pendiente del préstamo. Ese exceso no se aplicará a ninguna cuota.\n\n¿Deseas registrar el cobro igualmente?`
      : `El importe introducido supera el total pendiente del préstamo — no hay cuotas a las que aplicarlo.\n\n¿Deseas registrar el cobro igualmente?`
    if (!confirm(msgExceso)) return
  }

  // Insertar un único cobro con el importe total tal como lo introdujo el usuario
  const insert = {
    id: 'CB' + uuid(),
    prestamo_id: props.prestamoId,
    cuota_num: String(cuotaSeleccionada.value?.num || ''),
    fecha_teorica: cuotaSeleccionada.value?.fecha || fechaReal,
    fecha_real: fechaReal,
    importe: Math.round(restante * 100) / 100,
    tipo: 'pago_cuota',
    notas,
  }

  const { error } = await supabase.from('cobros').insert(insert)
  if (error) return alert('Error al registrar: ' + error.message)

  modalCuota.value = false
  emit('recargar')
}

// ── Importar cobros desde Excel ────────────────────────────────────────────
const importando   = ref(false)
const importResult = ref(null)
const dragOver     = ref(false)

async function onDrop(event) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.match(/\.xlsx?$/i)) {
    importResult.value = { error: 'El archivo debe ser un Excel (.xlsx o .xls)' }
    return
  }
  await procesarArchivoExcel(file)
}

// Parser de .xlsx usando SheetJS (cargado dinámicamente desde CDN)
// Busca la tabla llamada "Pagos" y extrae columnas Fecha e Importe
let _XLSX = null
async function getXLSX() {
  if (_XLSX) return _XLSX
  // Cargar SheetJS desde CDN una sola vez
  await new Promise((resolve, reject) => {
    if (window.XLSX) { _XLSX = window.XLSX; resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    script.onload = () => { _XLSX = window.XLSX; resolve() }
    script.onerror = reject
    document.head.appendChild(script)
  })
  return _XLSX
}

async function parsearTablaXLSX(buffer) {
  try {
    const XLSX = await getXLSX()
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: false })

    // Buscar la hoja que tiene la tabla "Pagos":
    // recorrer todas las hojas buscando cabeceras Fecha + Importe en columna >= F (idx 5)
    // para distinguirla de la columna Fecha del cuadro de amortización (columna B)
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      if (!ws['!ref']) continue

      // Leer toda la hoja como array de arrays
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

      // Buscar fila cabecera con "Fecha" e "Importe" en columna >= 5 (col F+)
      let headerRow = -1, colFecha = -1, colImporte = -1
      for (let i = 0; i < Math.min(data.length, 30); i++) {
        const row = data[i]
        if (!row) continue
        for (let j = 5; j < row.length; j++) {
          const cell = row[j]
          if (typeof cell === 'string' && cell.trim().toLowerCase() === 'fecha') {
            // Verificar que en esa misma fila haya también "Importe"
            const iIdx = row.findIndex((c, k) => k > j && typeof c === 'string' && c.trim().toLowerCase() === 'importe')
            if (iIdx !== -1) {
              headerRow = i; colFecha = j; colImporte = iIdx
              break
            }
          }
        }
        if (headerRow !== -1) break
      }
      if (headerRow === -1) continue

      // Convertir número de serie Excel a fecha ISO (sin usar cellDates para mayor control)
      const toISO = n => {
        if (typeof n !== 'number' || n < 36526) return null  // < año 2000
        const d = new Date(Math.round((n - 25569) * 86400 * 1000))
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      // Extraer filas de datos
      const filas = []
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i]
        if (!row) continue
        const fRaw = row[colFecha]
        const iRaw = row[colImporte]
        if (fRaw === null || fRaw === undefined || iRaw === null || iRaw === undefined) continue

        const fechaStr = toISO(fRaw)
        if (!fechaStr) continue

        const importe = typeof iRaw === 'number' ? iRaw : parseFloat(String(iRaw).replace(',', '.'))
        if (isNaN(importe) || importe <= 0) continue

        filas.push({ fecha: fechaStr, importe: Math.round(importe * 100) / 100 })
      }

      if (filas.length > 0) return filas
    }

    return null
  } catch (e) {
    console.error('Error parseando XLSX:', e)
    return null
  }
}

async function importarExcel(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  await procesarArchivoExcel(file)
}

async function procesarArchivoExcel(file) {
  importando.value   = true
  importResult.value = null

  try {
    const buffer = await file.arrayBuffer()
    const filas  = await parsearTablaXLSX(buffer)

    if (!filas || !filas.length) {
      importResult.value = { error: 'No se encontró la tabla "Pagos" con columnas Fecha e Importe en el Excel.' }
      return
    }

    // ── Obtener fechas ya existentes para este préstamo ─────────────────────
    const { data: cobrosExistentes } = await supabase
      .from('cobros').select('fecha_real').eq('prestamo_id', props.prestamoId)
    const fechasExistentes = new Set((cobrosExistentes || []).map(c => c.fecha_real))

    // ── Calcular cuota_num secuencial partiendo del máximo ya existente ───────
    const { data: todosCobrosPrestamo } = await supabase
      .from('cobros').select('cuota_num').eq('prestamo_id', props.prestamoId).eq('tipo', 'pago_cuota')
    const maxExistente = (todosCobrosPrestamo || [])
      .map(c => parseInt(c.cuota_num) || 0)
      .reduce((max, n) => Math.max(max, n), 0)
    let siguienteCuota = maxExistente + 1

    // ── Ordenar filas por fecha (asc) antes de asignar cuota_num ────────────
    filas.sort((a, b) => a.fecha.localeCompare(b.fecha))

    // ── Preparar inserts, omitir fechas ya existentes ───────────────────────
    const inserts   = []
    let   omitidos  = 0
    for (const fila of filas) {
      if (fechasExistentes.has(fila.fecha)) {
        omitidos++
        continue
      }
      inserts.push({
        id:           'CB' + uuid(),
        prestamo_id:  props.prestamoId,
        cuota_num:    String(siguienteCuota++),
        fecha_teorica: fila.fecha,
        fecha_real:    fila.fecha,
        importe:       fila.importe,
        tipo:          'pago_cuota',
        notas:         'Importado desde Excel',
      })
    }

    if (!inserts.length) {
      importResult.value = { insertados: 0, omitidos, error: null }
      return
    }

    const { error } = await supabase.from('cobros').insert(inserts)
    if (error) {
      importResult.value = { error: 'Error al guardar: ' + error.message }
      return
    }

    importResult.value = { insertados: inserts.length, omitidos, error: null }
    emit('recargar')

  } catch (e) {
    importResult.value = { error: 'Error al leer el Excel: ' + e.message }
  } finally {
    importando.value = false
  }
}

async function registrarHastaHoy() {
  const pendientes = cobrosVencidosPendientes.value
  if (!pendientes.length || saving.value) return
  saving.value = true
  try {
    const inserts = pendientes.map(c => ({
      id: 'CB' + uuid(),
      prestamo_id: props.prestamoId,
      cuota_num: String(c.num),
      fecha_teorica: c.fecha,
      fecha_real: c.fecha,
      importe: Math.round(c.total * 100) / 100,
      tipo: 'pago_cuota',
      notas: 'Registrado automáticamente',
    }))
    const { error } = await supabase.from('cobros').insert(inserts)
    if (error) return alert('Error al registrar: ' + error.message)
    emit('recargar')
  } finally { saving.value = false }
}

async function anularTodosCobros() {
  if (!props.cobros.length || saving.value) return
  if (!confirm(`¿Anular los ${props.cobros.length} cobro(s) registrados? Esta acción eliminará todos los cobros de este préstamo y sus devengados asociados pendientes de pago.`)) return
  saving.value = true
  try {
    // Los pagos a partícipes no están vinculados a cobros concretos,
    // por lo que se pueden eliminar cobros aunque existan pagos registrados.
    for (const cobro of [...props.cobros]) {
      await supabase.from('cobros').delete().eq('id', cobro.id)
    }
    emit('recargar')
  } finally { saving.value = false }
}

async function eliminarCobro(cobro) {
  if (props.prestamo.estado === 'cancelado') {
    return alert('No se puede eliminar un cobro de un préstamo cancelado. Revierte la cancelación primero.')
  }
  // Bloquear si hay un evento posterior (cancelación, judicialización, amortización parcial)
  // con fecha mayor o igual a este cobro — no se puede anular cobros anteriores a esos eventos
  const fechaCobro = cobro.fecha_real || cobro.fecha_teorica || ''
  const eventosPosterior = props.cobros.filter(c =>
    c.id !== cobro.id &&
    (c.tipo === 'cancelacion' || c.tipo === 'judicializacion' || c.tipo === 'amortizacion_parcial') &&
    (c.fecha_real || c.fecha_teorica || '') >= fechaCobro
  )
  if (eventosPosterior.length) {
    const tipoEvento = eventosPosterior[0].tipo === 'cancelacion' ? 'cancelación'
                     : eventosPosterior[0].tipo === 'judicializacion' ? 'judicialización'
                     : 'amortización parcial'
    const fechaEvento = eventosPosterior[0].fecha_real || eventosPosterior[0].fecha_teorica
    return alert(`No se puede anular este cobro porque existe una ${tipoEvento} con fecha ${fmtDate(fechaEvento)} posterior o igual. Anula primero ese evento.`)
  }

  // Los devengados son virtuales y los pagos a partícipes no están vinculados
  // a cobros concretos, por lo que un cobro puede eliminarse aunque existan
  // pagos registrados al partícipe en este préstamo.
  if (!confirm(`¿Eliminar el cobro de ${fmtDate(fechaCobro)} por ${fmt(cobro.importe)} €?`)) return
  await supabase.from('cobros').delete().eq('id', cobro.id)
  if (cobro.tipo === 'cancelacion') {
    await supabase.from('prestamos').update({ estado: 'activo', fecha_cancelacion: null }).eq('id', props.prestamoId)
  }
  emit('recargar')
}
</script>

<style scoped>
.excel-drop-zone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px dashed var(--border2);
  background: var(--bg3);
  color: var(--text2);
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
}
.excel-drop-zone:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--bg4);
}
.excel-drop-over {
  border-color: var(--accent) !important;
  background: rgba(99,102,241,0.1) !important;
  color: var(--accent) !important;
  transform: scale(1.02);
}
.excel-importing {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>