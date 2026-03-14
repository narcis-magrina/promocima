<template>
  <div>
    <div class="back-btn" @click="$emit('navigate','contratos-ccp')">← Volver a Contratos CCP</div>

    <!-- Cabecera -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
      <div>
        <div style="font-size:18px;font-weight:700">{{ contrato.id }}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">
          {{ contrato.participes?.nombre }} · {{ contrato.prestamos?.alias }}
        </div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px">Firma: {{ fmtDate(contrato.fecha_firma) }}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button v-if="!readOnly" class="btn btn-sm btn-registrar" @click="$emit('editar', contrato)">✎ Editar</button>
        <span class="badge" :class="contrato.activo ? 'badge-green' : 'badge-gray'">
          {{ contrato.activo ? 'Activo' : 'Inactivo' }}
        </span>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:20px">
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Importe Participación</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ fmtDec(contrato.importe_participacion) }}</div>
        <div class="kpi-sub" style="color:var(--green)">Activo: {{ fmtDec(participacionActiva) }}</div>
        <div class="kpi-sub" style="color:var(--orange)" v-if="participacionAmortizada > 0">Amortizado: {{ fmtDec(participacionAmortizada) }}</div>
        <div class="kpi-sub" style="color:var(--text3)">{{ contrato.porcentaje_participacion }}% del préstamo</div>
      </div>
      <div class="kpi-card kc-blue">
        <div class="kpi-label">% Gestión</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ contrato.porcentaje_gestion }}%</div>
      </div>
      <div class="kpi-card kc-green">
        <div class="kpi-label">Rentabilidad Habitual/mes</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ fmtDec(rentabilidadMes) }}</div>
        <div class="kpi-sub">Bruto · antes de IRPF</div>
      </div>
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Total Pagado</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ fmtDec(totalPagadoNeto) }}</div>
        <div class="kpi-sub">{{ pagosReales.length }} pago{{ pagosReales.length !== 1 ? 's' : '' }} registrado{{ pagosReales.length !== 1 ? 's' : '' }}</div>
      </div>
      <div class="kpi-card kc-orange">
        <div class="kpi-label">Devengado Pendiente</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ fmtDec(totalDevengadoNeto) }}</div>
        <div class="kpi-sub">{{ nLineasDevengadas }} cuota{{ nLineasDevengadas !== 1 ? 's' : '' }} por cobrar</div>
      </div>
      <div class="kpi-card kc-red">
        <div class="kpi-label">Pendiente</div>
        <div style="font-family:var(--mono);font-size:18px;font-weight:700">{{ fmtDec(totalPendienteNeto) }}</div>
        <div class="kpi-sub">cuotas no vencidas</div>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs">
      <div class="tab" :class="{ active: tab === 'detalle' }"    @click="tab = 'detalle'">Detalle</div>
      <div class="tab" :class="{ active: tab === 'calendario' }" @click="tab = 'calendario'">Calendario</div>
      <div class="tab" :class="{ active: tab === 'pagos' }"      @click="tab = 'pagos'">{{ readOnly ? 'Pagos' : 'Pagos Reales' }}</div>
    </div>

    <!-- Tab Detalle -->
    <div v-if="tab === 'detalle'" style="display:grid;gap:16px">

      <!-- Tarjeta préstamo -->
      <div class="table-card" style="padding:24px">
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Préstamo vinculado</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Alias</span>
            <span style="font-size:13px;font-weight:500">{{ contrato.prestamos?.alias || '—' }}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Importe</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamoDetalle ? fmt(prestamoDetalle.importe) : '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Tipo préstamo</span>
            <span style="font-size:13px;font-weight:500">{{ prestamoDetalle?.tipo_prestamo || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Periodicidad</span>
            <span style="font-size:13px;font-weight:500;text-transform:capitalize">{{ prestamoDetalle?.periodicidad || '—' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Interés ordinario</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamoDetalle?.interes_ordinario || '—' }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Interés demora</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamoDetalle?.interes_demora || '—' }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Día de cobro</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ prestamoDetalle?.dia_cobro || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Tarjeta condiciones CCP -->
      <div class="table-card" style="padding:24px">
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border);padding-bottom:6px">Condiciones del contrato</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Fecha firma</span>
            <span style="font-size:13px;font-weight:500">{{ fmtDate(contrato.fecha_firma) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Estado</span>
            <span class="badge" :class="contrato.activo ? 'badge-green' : 'badge-gray'">{{ contrato.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">Importe participación</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ fmtDec(contrato.importe_participacion) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">% Participación</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ contrato.porcentaje_participacion }}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">% Gestión</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ contrato.porcentaje_gestion }}%</span>
          </div>
          <div v-if="Number(contrato.porcentaje_apertura) > 0" style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--text3)">% Apertura</span>
            <span style="font-size:13px;font-weight:500;font-family:var(--mono)">{{ contrato.porcentaje_apertura }}%</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Tab Calendario -->
    <div v-if="tab === 'calendario'">
      <!-- Leyenda de cálculo -->
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
        <div style="font-size:11px;color:var(--text3)">
          <span style="font-weight:600;color:var(--text2)">Neto</span> = Beneficio − Gestión ({{ contrato.porcentaje_gestion }}%) − IRPF ({{ pctIRPF }}%)
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-left:auto">
          <span class="badge badge-green" style="font-size:10px">Pagado</span>
          <span class="badge badge-outline-yellow" style="font-size:10px">Devengado</span>
          <span class="badge" style="font-size:10px;background:#fff;color:var(--red);border:1px solid var(--red);font-weight:700">⚠ Anticipo</span>
          <span class="badge badge-gray" style="font-size:10px">Pendiente</span>
          <select class="form-control" v-model="filtroCal" style="width:160px;padding:4px 8px;font-size:12px" :style="filtroCal !== 'todas' ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
            <option value="todas">Todas</option>
            <option value="pendientes">Devengados / Pendientes</option>
            <option value="pagado">Pagadas</option>
          </select>
        </div>
      </div>
      <div v-if="!lineasCalendario.length" class="table-empty">
        <div>⚠️ No se puede generar el calendario.</div>
        <div v-if="camposFaltantes.length" style="margin-top:6px;font-size:12px;color:var(--orange)">
          Campos pendientes en el préstamo: <strong>{{ camposFaltantes.join(', ') }}</strong>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text3);font-family:var(--mono);text-align:left;max-width:600px;margin-left:auto;margin-right:auto">
          <div>fecha_inicio: {{ prestamoParaCalculo?.fecha_inicio ?? '❌ null' }}</div>
          <div>dia_cobro: {{ prestamoParaCalculo?.dia_cobro ?? '❌ null' }}</div>
          <div>duracion_meses: {{ prestamoParaCalculo?.duracion_meses ?? '❌ null' }}</div>
          <div>interes_ordinario: {{ prestamoParaCalculo?.interes_ordinario ?? '❌ null' }}</div>
          <div>tipo_prestamo: {{ prestamoParaCalculo?.tipo_prestamo ?? '❌ null' }}</div>
          <div>importe: {{ prestamoParaCalculo?.importe ?? '❌ null' }}</div>
          <div>contrato.fecha_firma: {{ contrato?.fecha_firma ?? '❌ null' }}</div>
          <div>prestamoDetalle cargado: {{ !!prestamoDetalle }}</div>
        </div>
      </div>
      <div v-else style="overflow-y:auto;width:100%">
        <table style="width:100%">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cobro prestatario</th>
              <th>Pago partícipe</th>
              <th style="text-align:center">Factor</th>
              <th style="text-align:right">Beneficio</th>
              <th style="text-align:right;color:var(--green)">Neto</th>
              <th style="text-align:right;color:var(--green)">Pagado</th>
              <th style="text-align:right;color:var(--orange)">Devengado</th>
              <th style="text-align:right;color:var(--text3)">Pendiente</th>
              <th style="text-align:center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtroCalLineas" :key="'l'+(c.num ?? c.cuota_num)"
                :style="c.esJudicial
                  ? 'background:rgba(239,68,68,0.06);border-top:2px solid rgba(239,68,68,0.3)'
                  : c.tipo === 'amortizacion_parcial'
                    ? 'background:rgba(99,102,241,0.07);border-top:2px solid rgba(99,102,241,0.25)'
                  : c.numParticipe <= 2 && c.estado !== 'pendiente' ? 'background:rgba(245,158,11,0.04)' : ''">
              <td class="td-mono td-center">
                <template v-if="c.esJudicial">
                  <span style="color:var(--red);font-weight:700">J</span>
                </template>
                <template v-else-if="c.tipo === 'amortizacion_parcial'">
                  <span style="color:var(--accent);font-weight:700">AP</span>
                </template>
                <template v-else>
                  {{ c.numParticipe }}
                  <span style="font-size:9px;color:var(--text3);margin-left:2px">(P{{ c.num }})</span>
                  <span v-if="c.numParticipe <= 2 && c.factor < 1 && c.factor > 0" style="font-size:9px;color:var(--accent);margin-left:4px">★</span>
                </template>
              </td>
              <td style="font-size:12px">
                <span v-if="c.esJudicial" style="color:var(--red);font-weight:600">⚖ {{ fmtDate(c.fecha_prestamo) }}</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial'" style="color:var(--accent);font-weight:600">⬇ {{ fmtDate(c.fecha_prestamo) }}</span>
                <template v-else>{{ fmtDate(c.fecha_prestamo) }}</template>
              </td>
              <td style="font-size:12px;font-weight:500">
                <span v-if="c.esJudicial" style="color:var(--text3);font-style:italic">Reclamación judicial</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial'" style="color:var(--text3);font-style:italic">Amort. Parcial</span>
                <template v-else>{{ fmtDate(c.fecha_cobro) }}</template>
              </td>
              <td class="td-mono td-center" style="font-size:11px;color:var(--text3)">
                <span v-if="c.esJudicial">—</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial'">—</span>
                <template v-else>{{ c.factor === 0 ? '0' : c.factor === 1 ? '1' : c.factor.toFixed(4) }}</template>
              </td>
              <!-- Beneficio -->
              <td class="td-mono td-right">
                <span v-if="c.esJudicial" style="color:var(--text3)">—</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial'" style="color:var(--text3)">—</span>
                <template v-else>{{ fmtDec(c.beneficio) }}</template>
              </td>
              <!-- Neto con tooltip (normal) / importe demanda (judicial) -->
              <td class="td-mono td-right" style="white-space:nowrap">
                <template v-if="c.esJudicial">
                  <span style="color:var(--red);font-weight:700;font-family:var(--mono);vertical-align:top">{{ fmtDec(c.neto) }}</span>
                  <div style="margin-top:4px;font-size:10px;color:var(--text3);line-height:1.8">
                    <div v-if="c.principal_J > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Principal:</span><span style="font-family:var(--mono)">{{ fmtDec(c.principal_J) }}</span></div>
                    <div v-if="c.interes_ordinario_J > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Int. ord.:</span><span style="font-family:var(--mono)">{{ fmtDec(c.interes_ordinario_J) }}</span></div>
                    <div v-if="c.gastos_J > 0" style="display:flex;justify-content:space-between;gap:12px"><span>Gastos:</span><span style="font-family:var(--mono)">{{ fmtDec(c.gastos_J) }}</span></div>
                    <div v-if="c.demora_J > 0" style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;padding-top:2px;border-top:1px solid var(--border)">
                      <span>Int. Dem. ({{ c.diasDemora }}d):</span>
                      <span style="font-family:var(--mono)">{{ fmtDec(c.demora_J) }}</span>
                    </div>
                  </div>
                </template>
                <!-- Fila AP: desglose principal (sin retenciones) + intereses netos -->
                <span v-else-if="c.tipo === 'amortizacion_parcial'" class="ccp-neto-wrap">
                  <span style="color:var(--green);font-weight:600">{{ fmtDec(c.principal_part + c.neto) }}</span>
                  <span class="ccp-info-btn" tabindex="0">i
                    <span class="ccp-tooltip">
                      <span class="ccp-tt-row"><span class="ccp-tt-label">Principal devuelto</span><span class="ccp-tt-val ccp-green">{{ fmtDec(c.principal_part) }}</span></span>
                      <span class="ccp-tt-divider"></span>
                      <span class="ccp-tt-row"><span class="ccp-tt-label">Int. ordinarios</span><span class="ccp-tt-val">{{ fmtDec(c.beneficio) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-sub"><span class="ccp-tt-label">− Gestión ({{ contrato.porcentaje_gestion }}%)</span><span class="ccp-tt-val ccp-orange">{{ fmtDec(c.gestion) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-res"><span class="ccp-tt-label">= Bruto</span><span class="ccp-tt-val">{{ fmtDec(c.bruto) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-sub"><span class="ccp-tt-label">− IRPF ({{ pctIRPF }}%)</span><span class="ccp-tt-val ccp-red">{{ fmtDec(c.irpf) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-res"><span class="ccp-tt-label">= Neto intereses</span><span class="ccp-tt-val ccp-green">{{ fmtDec(c.neto) }}</span></span>
                      <span class="ccp-tt-divider"></span>
                      <span class="ccp-tt-row ccp-tt-total"><span class="ccp-tt-label">= Total neto</span><span class="ccp-tt-val ccp-green">{{ fmtDec(c.principal_part + c.neto) }}</span></span>
                    </span>
                  </span>
                </span>
                <!-- Cuota normal -->
                <span v-else class="ccp-neto-wrap">
                  <span style="color:var(--green);font-weight:600">{{ fmtDec(c.neto) }}</span>
                  <span class="ccp-info-btn" tabindex="0">i
                    <span class="ccp-tooltip">
                      <span class="ccp-tt-row"><span class="ccp-tt-label">Beneficio</span><span class="ccp-tt-val">{{ fmtDec(c.beneficio) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-sub"><span class="ccp-tt-label">− Gestión ({{ contrato.porcentaje_gestion }}%)</span><span class="ccp-tt-val ccp-orange">{{ fmtDec(c.gestion) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-res"><span class="ccp-tt-label">= Bruto</span><span class="ccp-tt-val">{{ fmtDec(c.bruto) }}</span></span>
                      <span class="ccp-tt-row ccp-tt-sub"><span class="ccp-tt-label">− IRPF ({{ pctIRPF }}%)</span><span class="ccp-tt-val ccp-red">{{ fmtDec(c.irpf) }}</span></span>
                      <span class="ccp-tt-divider"></span>
                      <span class="ccp-tt-row ccp-tt-total"><span class="ccp-tt-label">= Neto</span><span class="ccp-tt-val ccp-green">{{ fmtDec(c.neto) }}</span></span>
                    </span>
                  </span>
                </span>
              </td>
              <!-- col_pagado -->
              <td class="td-mono td-right" style="color:var(--green);font-weight:600">
                {{ c.col_pagado > 0.005 ? fmtDec(c.col_pagado) : '—' }}
              </td>
              <!-- col_devengado -->
              <td class="td-mono td-right"
                  :style="{ color: c.col_devengado > 0.005 ? 'var(--orange)' : 'var(--text3)' }"
                  :title="!c.cuota_completa && c.col_devengado > 0.005 ? 'Cobro parcial (' + Math.round((c.ratio||0)*100) + '%)' : ''">
                {{ c.col_devengado > 0.005 ? fmtDec(c.col_devengado) : '—' }}
              </td>
              <!-- col_pendiente -->
              <td class="td-mono td-right" :style="{ color: c.esJudicial && c.col_pendiente > 0.005 ? 'var(--red)' : 'var(--text3)' }">
                {{ c.col_pendiente > 0.005 ? fmtDec(c.col_pendiente) : '—' }}
              </td>
              <!-- Estado -->
              <td class="td-center">
                <span v-if="c.esJudicial && c.estado === 'pendiente'" class="badge badge-red" style="font-size:10px">⚖ Judicial</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial' && c.estado === 'devengado'" class="badge badge-outline-yellow" style="font-size:10px;color:var(--accent);border-color:var(--accent)">⬇ Amort.</span>
                <span v-else-if="c.tipo === 'amortizacion_parcial' && c.estado === 'pagado'" class="badge badge-green" style="font-size:10px">⬇ Amort.</span>
                <span v-else-if="c.estado === 'pendiente'"    class="badge badge-gray" style="font-size:10px">Pendiente</span>
                <span v-else-if="c.estado === 'pagado'"       class="badge badge-green" style="font-size:10px">Pagado</span>
                <span v-else-if="c.estado === 'devengado'"    class="badge badge-outline-yellow" style="font-size:10px">Devengado</span>
                <span v-else-if="c.estado === 'anticipado'"   class="badge" style="font-size:10px;background:#fff;color:var(--red);border:1px solid var(--red);font-weight:700">⚠ Anticipo</span>
                <span v-else class="badge" style="font-size:10px;background:rgba(99,102,241,0.12);color:var(--accent);border:1px solid rgba(99,102,241,0.3)" :title="'Pagado: ' + fmtDec(c.col_pagado) + ' · Dev: ' + fmtDec(c.col_devengado) + ' · Pend: ' + fmtDec(c.col_pendiente)">Mixto</span>
              </td>
            </tr>
          </tbody>
          <!-- Totales -->
          <tfoot>
            <tr style="font-weight:600;border-top:2px solid var(--border)">
              <td colspan="6" style="font-size:12px;color:var(--text3);padding-top:8px">Totales</td>
              <td class="td-mono td-right" style="color:var(--green);padding-top:8px">{{ fmtDec(totalColPagado) }}</td>
              <td class="td-mono td-right" style="color:var(--orange);padding-top:8px">{{ fmtDec(totalColDevengado) }}</td>
              <td class="td-mono td-right" style="color:var(--text3);padding-top:8px">{{ fmtDec(totalColPendiente) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Tab Pagos Reales -->
    <div v-if="tab === 'pagos'">
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px" v-if="!readOnly">
        <button class="btn btn-sm btn-registrar" @click="abrirRegistrarPago">+ Registrar Pago</button>
      </div>
      <div class="table-card">
        <div class="table-header"><h3>Pagos Registrados ({{ pagosReales.length }}) <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
        <table>
          <thead>
            <tr>
              <th class="sorted-desc">Fecha Pago <span class="sort-icon">↓</span></th>
              <th style="text-align:right">Devengado</th>
              <th style="text-align:right">Gestión</th>
              <th style="text-align:right">Bruto</th>
              <th style="text-align:right">IRPF</th>
              <th style="text-align:right;color:var(--green)">Neto</th>
              <th>Obs.</th>
              <th v-if="!readOnly"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pagosReales" :key="p.id">
              <td style="font-size:12px;font-weight:500">{{ fmtDate(p.fecha_pago_real) }}</td>
              <td class="td-mono td-right">{{ fmtDec(p.importe_devengado) }}</td>
              <td class="td-mono td-right" style="color:var(--orange)">{{ fmtDec(p.importe_gestion) }}</td>
              <td class="td-mono td-right">{{ fmtDec(p.importe_bruto) }}</td>
              <td class="td-mono td-right" style="color:var(--red)">{{ fmtDec(p.importe_retencion) }}</td>
              <td class="td-mono td-right" style="color:var(--green);font-weight:600">{{ fmtDec(p.importe_neto) }}</td>
              <td style="font-size:11px;color:var(--text3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                  :title="p.observaciones">{{ p.observaciones || '—' }}</td>
              <td v-if="!readOnly">
                <button class="btn btn-sm btn-danger-solid" style="padding:2px 7px;font-size:13px"
                  title="Eliminar pago" @click="eliminarPagoYRecargar(p)">✕</button>
              </td>
            </tr>
            <tr v-if="!pagosReales.length"><td :colspan="readOnly ? 7 : 8" class="table-empty">Sin pagos registrados</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Pago -->
    <div class="modal-overlay" v-if="modalPago">
      <div class="modal">
        <div class="modal-header">
          <h2>Registrar Pago</h2>
          <button class="btn btn-ghost btn-sm" @click="modalPago = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="totalDevengadoNeto > 0" class="alert alert-info" style="margin-bottom:12px">
            Devengado pendiente de cobrar: <strong>{{ fmtDec(totalDevengadoNeto) }}</strong> neto
          </div>
          <div class="form-grid cols-1">
            <div class="form-group">
              <label class="form-label">Fecha Pago <span class="req">*</span></label>
              <input class="form-control" type="date" v-model="formPago.fecha_pago_real">
            </div>
            <div class="form-group">
              <label class="form-label">
                Importe Devengado (€) <span class="req">*</span>
                <span style="font-size:11px;color:var(--text3);font-weight:400"> — interés bruto de participación, antes de gestión e IRPF</span>
              </label>
              <input class="form-control" type="number" step="0.01" v-model="formPago.importe_devengado" @input="recalcular">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
              <div class="form-group">
                <label class="form-label">Gestión ({{ contrato.porcentaje_gestion }}%)</label>
                <input class="form-control" type="number" step="0.01" :value="formPago.importe_gestion" readonly style="opacity:0.7">
              </div>
              <div class="form-group">
                <label class="form-label">Bruto</label>
                <input class="form-control" type="number" step="0.01" :value="formPago.importe_bruto" readonly style="opacity:0.7">
              </div>
              <div class="form-group">
                <label class="form-label">IRPF ({{ pctIRPF }}%)</label>
                <input class="form-control" type="number" step="0.01" :value="formPago.importe_retencion" readonly style="opacity:0.7">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Neto a pagar</label>
              <input class="form-control" type="number" step="0.01" :value="formPago.importe_neto" readonly
                style="font-weight:700;font-size:16px;color:var(--green);background:rgba(16,185,129,0.05)">
            </div>
            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <textarea class="form-control" v-model="formPago.observaciones" rows="2"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="modalPago = false">Cancelar</button>
          <button class="btn btn-registrar" :disabled="saving" @click="guardarPago">
            <span v-if="saving" class="btn-spinner"></span>Registrar Pago
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'
import { fmt, fmtDate, today, uuid, calcularLineasCCP , fmtDec } from '../utils.js'
import { eliminarPago } from '../composables/useDevengados.js'

const props = defineProps({
  contrato:        { type: Object, required: true },
  prestamoDetalle: { type: Object, default: null },
  cobrosPrestamo:  { type: Array,  default: () => [] },
  readOnly:        { type: Boolean, default: false },
})
const emit = defineEmits(['navigate', 'recargar', 'editar'])

const tab         = ref('detalle')
const filtroCal   = ref('pendientes')
const saving      = ref(false)
const modalPago   = ref(false)
const pagosReales = ref([])
const pctIRPF     = ref(19)

function formPagoVacio() {
  return { fecha_pago_real: today(), importe_devengado: '', importe_gestion: 0, importe_bruto: 0, importe_retencion: 0, importe_neto: 0, observaciones: '' }
}
const formPago = ref(formPagoVacio())

async function cargarConfig() {
  const { data } = await supabase.from('config').select('porcentaje_irpf').eq('id', 1).single()
  if (data?.porcentaje_irpf) pctIRPF.value = data.porcentaje_irpf
}

// Calendario calculado al vuelo cruzando cobros + pagos reales
const camposFaltantes = computed(() => {
  if (!props.prestamoDetalle) return ['préstamo no cargado']
  const faltan = []
  if (!props.prestamoDetalle.fecha_inicio) faltan.push('Fecha Inicio')
  if (!props.prestamoDetalle.dia_cobro)    faltan.push('Día de Cobro')
  if (!props.prestamoDetalle.duracion_meses) faltan.push('Duración (meses)')
  if (!props.prestamoDetalle.interes_ordinario) faltan.push('Interés Ordinario')
  return faltan
})

const prestamoParaCalculo = computed(() => {
  if (!props.prestamoDetalle) return null
  // Si falta fecha_inicio, usar fecha_firma del contrato CCP como aproximación
  if (!props.prestamoDetalle.fecha_inicio && props.contrato?.fecha_firma) {
    return { ...props.prestamoDetalle, fecha_inicio: props.contrato.fecha_firma }
  }
  return props.prestamoDetalle
})

const lineasCalendario = computed(() => {
  if (!props.contrato || !prestamoParaCalculo.value?.fecha_inicio) return []
  if (!prestamoParaCalculo.value.dia_cobro || !prestamoParaCalculo.value.duracion_meses) return []
  const result = calcularLineasCCP(props.contrato, prestamoParaCalculo.value, props.cobrosPrestamo, pagosReales.value, pctIRPF.value)
  console.log('[CCP] lineasCalendario:', result.length, 'líneas', { contrato: props.contrato?.id, prestamo: prestamoParaCalculo.value?.id, fecha_inicio: prestamoParaCalculo.value?.fecha_inicio, duracion: prestamoParaCalculo.value?.duracion_meses })
  return result
})

const filtroCalLineas = computed(() => {
  if (filtroCal.value === 'pagado')    return lineasCalendario.value.filter(l => l.estado === 'pagado' || l.estado === 'anticipado')
  if (filtroCal.value === 'pendientes') return lineasCalendario.value.filter(l => l.estado !== 'pagado')
  return lineasCalendario.value
})

const totalPagadoNeto    = computed(() => Math.round(lineasCalendario.value.reduce((s, l) => s + (l.col_pagado   || 0), 0) * 100) / 100)
const totalDevengadoNeto = computed(() => Math.round(lineasCalendario.value.reduce((s, l) => s + (l.col_devengado || 0), 0) * 100) / 100)
const totalColPagado     = computed(() => totalPagadoNeto.value)
const totalColDevengado  = computed(() => totalDevengadoNeto.value)
const totalColPendiente  = computed(() => Math.round(lineasCalendario.value.reduce((s, l) => s + (l.col_pendiente || 0), 0) * 100) / 100)
const totalDevengadoBruto = computed(() => Math.round(
  lineasCalendario.value
    .filter(l => l.estado === 'devengado' || l.estado === 'devengado_parcial')
    .reduce((s, l) => {
      if (l.estado === 'devengado') return s + l.bruto
      const ratio = l.neto > 0 ? Math.max(0, l.neto - l.pagado_participe) / l.neto : 0
      return s + l.bruto * ratio
    }, 0)
  * 100) / 100)
const totalPendienteNeto = computed(() => Math.round(
  lineasCalendario.value.filter(l => l.estado === 'pendiente').reduce((s, l) => s + l.neto, 0)
  * 100) / 100)
const nLineasDevengadas  = computed(() =>
  lineasCalendario.value.filter(l => l.estado === 'devengado' || l.estado === 'devengado_parcial').length)
const rentabilidadMes = computed(() => {
  if (!props.contrato || !prestamoParaCalculo.value) return 0
  const imp     = Number(props.contrato.importe_participacion)
  const interes = imp * Number(prestamoParaCalculo.value?.interes_ordinario || 0) / 100 / 12
  const gestion = imp * Number(props.contrato.porcentaje_gestion) / 100 / 12
  return Math.round((interes - gestion) * 100) / 100
})

onMounted(async () => { await cargarConfig(); await cargarPagos() })
// ── Participación activa / amortizada ────────────────────────────────────────
const participacionAmortizada = computed(() => {
  const pctPart = Number(props.contrato?.porcentaje_participacion || 0) / 100
  return props.cobrosPrestamo
    .filter(c => c.tipo === 'amortizacion_parcial' && Number(c.importe_principal || 0) > 0)
    .reduce((s, c) => s + Math.round(Number(c.importe_principal) * pctPart * 100) / 100, 0)
})

const participacionActiva = computed(() =>
  Math.max(0, Math.round((Number(props.contrato?.importe_participacion || 0) - participacionAmortizada.value) * 100) / 100)
)

watch(() => props.contrato?.id, () => { tab.value = 'detalle'; cargarPagos() })

async function cargarPagos() {
  if (!props.contrato?.id) return
  const { data } = await supabase.from('pagos_reales_participe').select('*')
    .eq('contrato_ccp_id', props.contrato.id).order('fecha_pago_real', { ascending: false })
  pagosReales.value = data || []
}

// La gestión es proporcional al devengado respecto al beneficio teórico de la cuota de referencia
// gestion = gestion_teorica × (devengado_real / beneficio_teorico)
// Se guarda la cuota de referencia al abrir el modal
const cuotaRef = ref(null)

function recalcular() {
  const dev = Math.round((Number(formPago.value.importe_devengado) || 0) * 100) / 100
  if (!dev) {
    formPago.value.importe_gestion   = 0
    formPago.value.importe_bruto     = 0
    formPago.value.importe_retencion = 0
    formPago.value.importe_neto      = 0
    return
  }
  // Calcular gestión proporcional al devengado usando la cuota de referencia
  // gestión = importe_participacion × gestion% / 12 × factor × (dev / beneficio_teorico)
  let gestion
  if (cuotaRef.value && cuotaRef.value.beneficio > 0) {
    const ratio = dev / cuotaRef.value.beneficio
    gestion = Math.round(cuotaRef.value.gestion * ratio * 100) / 100
  } else {
    // Fallback: gestión proporcional directa
    const imp    = Number(props.contrato.importe_participacion)
    const pctG   = Number(props.contrato.porcentaje_gestion) / 100
    const benefMes = imp * Number(prestamoParaCalculo.value?.interes_ordinario || 0) / 100 / 12
    const gestMes  = imp * pctG / 12
    gestion = benefMes > 0 ? Math.round(gestMes * (dev / benefMes) * 100) / 100 : 0
  }
  const bruto     = Math.round((dev - gestion) * 100) / 100
  const retencion = Math.round(bruto * (pctIRPF.value / 100) * 100) / 100
  const neto      = Math.round((bruto - retencion) * 100) / 100
  formPago.value.importe_gestion   = gestion
  formPago.value.importe_bruto     = bruto
  formPago.value.importe_retencion = retencion
  formPago.value.importe_neto      = neto
}

function abrirRegistrarPago() {
  formPago.value = formPagoVacio()
  cuotaRef.value = null
  // Primera línea con col_devengado > 0 (cobrado del préstamo pero sin pagar al partícipe)
  const primerDev = lineasCalendario.value.find(l => (l.col_devengado || 0) > 0.005)
  if (primerDev) {
    cuotaRef.value = primerDev
    formPago.value.fecha_pago_real = primerDev.fecha_cobro
    // Escalar importes proporcionalmente al devengado pendiente
    const ratioD = primerDev.neto > 0 ? primerDev.col_devengado / primerDev.neto : 1
    formPago.value.importe_devengado = Math.round(primerDev.beneficio * ratioD * 100) / 100
    formPago.value.importe_gestion   = Math.round(primerDev.gestion   * ratioD * 100) / 100
    formPago.value.importe_bruto     = Math.round(primerDev.bruto     * ratioD * 100) / 100
    formPago.value.importe_retencion = Math.round(primerDev.irpf      * ratioD * 100) / 100
    formPago.value.importe_neto      = primerDev.col_devengado
  }
  modalPago.value = true
}

async function guardarPago() {
  if (!formPago.value.fecha_pago_real || !formPago.value.importe_devengado)
    return alert('Fecha e importe devengado son obligatorios')
  if (Number(formPago.value.importe_devengado) <= 0)
    return alert('El importe debe ser mayor que cero')
  saving.value = true
  try {
    const { error } = await supabase.from('pagos_reales_participe').insert({
      id:                'PRP' + uuid(),
      contrato_ccp_id:   props.contrato.id,
      fecha_pago_real:   formPago.value.fecha_pago_real,
      importe_devengado: Number(formPago.value.importe_devengado),
      importe_gestion:   Number(formPago.value.importe_gestion),
      importe_bruto:     Number(formPago.value.importe_bruto),
      importe_retencion: Number(formPago.value.importe_retencion),
      importe_neto:      Number(formPago.value.importe_neto),
      observaciones:     formPago.value.observaciones || null,
    })
    if (error) { alert('Error al guardar: ' + error.message); return }
    modalPago.value = false
    await cargarPagos()
  } finally { saving.value = false }
}

async function eliminarPagoYRecargar(p) {
  const ok = await eliminarPago(p)
  if (ok) await cargarPagos()
}
</script>

<style scoped>
.ccp-neto-wrap { display:inline-flex; align-items:center; gap:4px; }
.ccp-info-btn {
  display:inline-flex; align-items:center; justify-content:center;
  width:13px; height:13px; border-radius:50%;
  background:transparent; color:var(--text3);
  border:1px solid var(--text3);
  font-size:8px; font-weight:700; font-style:normal;
  cursor:default; position:relative; flex-shrink:0;
  line-height:1; opacity:0.6;
  transition: opacity 0.15s;
}
.ccp-info-btn:hover, .ccp-info-btn:focus { opacity:1; outline:none; }
.ccp-info-btn .ccp-tooltip {
  display:none; position:absolute;
  right:20px; top:50%; transform:translateY(-50%);
  background:var(--bg4); border:1px solid var(--border2);
  border-radius:8px; padding:10px 14px;
  min-width:220px; z-index:200;
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  flex-direction:column; gap:3px;
}
.ccp-info-btn:hover .ccp-tooltip,
.ccp-info-btn:focus .ccp-tooltip { display:flex; }
.ccp-tt-row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.ccp-tt-label { font-size:11px; color:var(--text3); white-space:nowrap; }
.ccp-tt-val { font-family:var(--mono); font-size:12px; color:var(--text1); }
.ccp-tt-sub .ccp-tt-label { padding-left:10px; }
.ccp-tt-res { border-top:1px solid var(--border); padding-top:3px; margin-top:1px; }
.ccp-tt-res .ccp-tt-label { font-weight:600; color:var(--text2); }
.ccp-tt-divider { border-top:2px solid var(--border); margin:3px 0; }
.ccp-tt-total .ccp-tt-label { font-weight:700; color:var(--text1); }
.ccp-orange { color:#f97316 !important; }
.ccp-red    { color:#ef4444 !important; }
.ccp-green  { color:#22c55e !important; font-weight:700; }
</style>