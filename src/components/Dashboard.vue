<template>
  <div>
    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">
    <!-- Fila 1: Capital + Rentabilidad -->

      <!-- KPI 1: Capital -->
      <div class="kpi-card kc-green">
        <div class="kpi-label">Capital Invertido <HelpTip :texto="help.invertido" /></div>
        <div class="kpi-value" style="font-size:18px">{{ fmtN(capitalEnCurso) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">En curso <HelpTip :texto="help.en_curso" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalActivo) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Activo <HelpTip :texto="help.activo" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalActivoNoJudicial) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Judicializado <HelpTip :texto="help.judicializado" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalJudicializado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">% judicializado</span>
            <span class="kpi-row-val" >{{ pctJudicializado }}%</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Participado activo <HelpTip :texto="help.capital_participado" pos="right" /></span>
            <span class="kpi-row-val">{{ fmtN(capitalParticipado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Part. judicializado</span>
            <span class="kpi-row-val">{{ fmtN(capitalParticJudicializado) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">% jud. partícipes</span>
            <span class="kpi-row-val" >{{ pctJudicPartícipes }}%</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Ingresos anuales -->
      <div class="kpi-card kc-blue">
        <div class="kpi-label">Rentabilidad</div>
        <div class="kpi-value" style="font-size:18px">{{ fmtN(ingrAnualesActivas) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. anuales op. activas</span>
            <span class="kpi-row-val">{{ fmtN(ingrAnualesActivas) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. anuales part. activas</span>
            <span class="kpi-row-val">{{ fmtN(ingrAnualesParticipes) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. gestión anual</span>
            <span class="kpi-row-val">{{ fmtN(ingrGestionAnual) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Ingr. apertura LTM</span>
            <span class="kpi-row-val">{{ fmtN(ingrAperturaLTM) }}</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Rent. activas</span>
            <span class="kpi-row-val">{{ rentActivas }}%</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Rent. partícipes</span>
            <span class="kpi-row-val">{{ rentParticipes }}%</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Rent. total Promocima</span>
            <span class="kpi-row-val">{{ rentTotalPromocima }}%</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Fila 2: Operaciones + LTV + Duración -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">

      <!-- KPI 3: Operaciones -->
      <div class="kpi-card kc-purple">
        <div class="kpi-label">Operaciones</div>
        <div class="kpi-value" style="font-size:18px">{{ nOperacionesTotal }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Op. totales <HelpTip :texto="help.invertido" pos="right" /></span>
            <span class="kpi-row-val">{{ nOperacionesTotal }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Canceladas <HelpTip :texto="help.cancelado" pos="right" /></span>
            <span class="kpi-row-val">{{ nCanceladas }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">En curso <HelpTip :texto="help.en_curso" pos="right" /></span>
            <span class="kpi-row-val">{{ nEnCurso }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Judicializadas <HelpTip :texto="help.judicializado" pos="right" /></span>
            <span class="kpi-row-val">{{ nJudicializados }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Activas <HelpTip :texto="help.activo" pos="right" /></span>
            <span class="kpi-row-val">{{ nActivas }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Al día <HelpTip :texto="help.al_dia" pos="right" /></span>
            <span class="kpi-row-val">{{ nAlDia }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Con retraso <HelpTip :texto="help.con_retraso" pos="right" /></span>
            <span class="kpi-row-val">{{ nConRetraso }}</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Garantías -->
      <div class="kpi-card kc-orange">
        <div class="kpi-label">LTV</div>
        <div class="kpi-value" style="font-size:18px">{{ fmtN(garantiasEnCurso) }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Total garantías en curso</span>
            <span class="kpi-row-val">{{ fmtN(garantiasEnCurso) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">LTV op. en curso <HelpTip :texto="help.ltv_en_curso" pos="right" /></span>
            <span class="kpi-row-val" >{{ ltvEnCurso }}%</span>
          </div>
          <div class="kpi-row kpi-row-sep">
            <span style="color:var(--text3)">Total garantías partícipes</span>
            <span class="kpi-row-val">{{ fmtN(garantiasParticipes) }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">LTV op. partícipes <HelpTip :texto="help.ltv_participes" pos="right" /></span>
            <span class="kpi-row-val" >{{ ltvParticipes }}%</span>
          </div>
        </div>
      </div>

      <!-- KPI 5: Duraciones -->
      <div class="kpi-card kc-gray-dim">
        <div class="kpi-label">Duración <HelpTip texto="Las duraciones se expresan en meses." /></div>
        <div class="kpi-value" style="font-size:18px">{{ durMediaEnCurso }}</div>
        <div style="margin-top:8px;display:grid;gap:4px">
          <div class="kpi-row">
            <span style="color:var(--text3)">Duración media en curso</span>
            <span class="kpi-row-val">{{ durMediaEnCurso }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Duración media canceladas</span>
            <span class="kpi-row-val">{{ durMediaCanceladas }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Duración media activas</span>
            <span class="kpi-row-val">{{ durMediaActivas }}</span>
          </div>
          <div class="kpi-row">
            <span style="color:var(--text3)">Duración media judicializadas</span>
            <span class="kpi-row-val">{{ durMediaJudicializadas }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen por estado -->
    <div class="table-card">
      <div class="table-header"><h3>Resumen de Cartera por Estado <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Estado</th>
            <th style="text-align:center">N.º<br>Préstamos</th>
            <th style="text-align:right" class="col-hide-mobile">Capital</th>
            <th style="text-align:right" class="col-hide-mobile">%<br>Capital</th>
            <th style="text-align:right">Capital<br>Activo</th>
            <th style="text-align:right">%<br>Capital<br>Activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in resumenEstados" :key="row.est">
            <td v-html="getEstadoBadge(row.est)" />
            <td class="td-center">{{ row.count }}</td>
            <td class="td-mono td-right col-hide-mobile">{{ fmtN(row.capital) }}</td>
            <td class="col-hide-mobile">
              <div style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar progress-bar-hide-mobile" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pct + '%', background: row.color }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct.toFixed(1) }}%</span>
              </div>
            </td>
            <td class="td-mono td-right" style="color:var(--green)">
              {{ row.capitalActivo !== null ? fmtN(row.capitalActivo) : '—' }}
            </td>
            <td>
              <div v-if="row.est !== 'cancelado'" style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar progress-bar-hide-mobile" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pctActiva + '%', background: row.color }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pctActiva.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid var(--border);background:var(--bg2)">
            <td style="text-align:left;font-weight:700;font-size:13px;padding:10px 12px">Total en curso</td>
            <td style="text-align:center;font-size:13px;padding:10px 12px">{{ resumenEstados.filter(r => r.est !== 'cancelado').reduce((s,r) => s + r.count, 0) }}</td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px" class="col-hide-mobile">{{ fmtN(resumenEstados.filter(r => r.est !== 'cancelado').reduce((s,r) => s + r.capital, 0)) }}</td>
            <td style="padding:10px 12px" class="col-hide-mobile"></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtN(resumenEstados.filter(r => r.est !== 'cancelado' && r.capitalActivo !== null).reduce((s,r) => s + r.capitalActivo, 0)) }}</td>
            <td style="padding:10px 12px"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Préstamos por intermediario -->
    <div class="table-card">
      <div class="table-header"><h3>Préstamos por Intermediario <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Intermediario</th>
            <th style="text-align:right">Al día</th>
            <th style="text-align:right">Con<br>retraso</th>
            <th style="text-align:right" class="col-hide-mobile">Cancelados</th>
            <th style="text-align:right">Judicializados</th>
            <th style="text-align:right" class="col-hide-mobile">Capital</th>
            <th style="text-align:right">Capital<br>Activo</th>
            <th style="text-align:right">%<br>Capital<br>Activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in porIntermediario" :key="row.nombre">
            <td style="font-weight:500">{{ row.nombre }}</td>
            <td class="td-mono td-right">
              <span style="color:var(--green)">{{ fmtN(row.al_dia_imp) }}</span>
              <span class="td-count">({{ row.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--orange)">{{ fmtN(row.retraso_imp) }}</span>
              <span class="td-count">({{ row.retraso_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile">
              <span style="color:var(--text3)">{{ fmtN(row.cancelado_imp) }}</span>
              <span class="td-count">({{ row.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--red)">{{ fmtN(row.judicial_imp) }}</span>
              <span class="td-count">({{ row.judicial_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile" style="font-weight:600">
              {{ fmtN(row.en_curso_imp) }}
              <span class="td-count">({{ row.en_curso_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtN(row.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar progress-bar-hide-mobile" style="flex:1">
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
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtN(porIntermediario.reduce((s,r) => s + r.al_dia_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.al_dia_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--orange);padding:10px 12px">{{ fmtN(porIntermediario.reduce((s,r) => s + r.retraso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.retraso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text3);padding:10px 12px" class="col-hide-mobile">{{ fmtN(porIntermediario.reduce((s,r) => s + r.cancelado_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.cancelado_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--red);padding:10px 12px">{{ fmtN(porIntermediario.reduce((s,r) => s + r.judicial_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.judicial_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px" class="col-hide-mobile">{{ fmtN(porIntermediario.reduce((s,r) => s + r.en_curso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ porIntermediario.reduce((s,r) => s + r.en_curso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtN(porIntermediario.reduce((s,r) => s + r.capital_activo_imp, 0)) }}</td>
            <td style="padding:10px 12px"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Préstamos por partícipe -->
    <div class="table-card">
      <div class="table-header"><h3>Préstamos por Partícipe <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
      <div v-if="loading" class="table-empty">Cargando...</div>
      <table v-else>
        <thead>
          <tr>
            <th>Partícipe</th>
            <th style="text-align:right">Al día</th>
            <th style="text-align:right">Con<br>retraso</th>
            <th style="text-align:right" class="col-hide-mobile">Cancelados</th>
            <th style="text-align:right">Judicializados</th>
            <th style="text-align:right" class="col-hide-mobile">Capital</th>
            <th style="text-align:right">Capital<br>Activo</th>
            <th style="text-align:right">%<br>Capital<br>Activo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in porParticipe" :key="row.nombre">
            <td style="font-weight:500">{{ row.nombre }}</td>
            <td class="td-mono td-right">
              <span style="color:var(--green)">{{ fmtN(row.al_dia_imp) }}</span>
              <span class="td-count">({{ row.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--orange)">{{ fmtN(row.retraso_imp) }}</span>
              <span class="td-count">({{ row.retraso_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile">
              <span style="color:var(--text3)">{{ fmtN(row.cancelado_imp) }}</span>
              <span class="td-count">({{ row.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--red)">{{ fmtN(row.judicial_imp) }}</span>
              <span class="td-count">({{ row.judicial_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile" style="font-weight:600">
              {{ fmtN(row.en_curso_imp) }}
              <span class="td-count">({{ row.en_curso_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtN(row.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar progress-bar-hide-mobile" style="flex:1">
                  <div class="progress-fill" :style="{ width: row.pct + '%', background: 'var(--accent)' }" />
                </div>
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">{{ row.pct.toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
          <!-- Préstamos sin partícipe (no compartidos con ningún partícipe) -->
          <tr v-if="sinParticipe.en_curso_n > 0 || sinParticipe.cancelado_n > 0" style="border-top:2px solid var(--border)">
            <td style="font-style:italic;color:var(--text3)">Sin partícipe</td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtN(sinParticipe.al_dia_imp) }}</span>
              <span class="td-count">({{ sinParticipe.al_dia_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtN(sinParticipe.retraso_imp) }}</span>
              <span class="td-count">({{ sinParticipe.retraso_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile">
              <span style="color:var(--text3)">{{ fmtN(sinParticipe.cancelado_imp) }}</span>
              <span class="td-count">({{ sinParticipe.cancelado_n }})</span>
            </td>
            <td class="td-mono td-right">
              <span style="color:var(--text3)">{{ fmtN(sinParticipe.judicial_imp) }}</span>
              <span class="td-count">({{ sinParticipe.judicial_n }})</span>
            </td>
            <td class="td-mono td-right col-hide-mobile" style="font-weight:600;color:var(--text3)">
              {{ fmtN(sinParticipe.en_curso_imp) }}
              <span style="font-size:11px"> ({{ sinParticipe.en_curso_n }})</span>
            </td>
            <td class="td-mono td-right" style="color:var(--green);font-weight:600">
              {{ fmtN(sinParticipe.capital_activo_imp) }}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar progress-bar-hide-mobile" style="flex:1">
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
        <tfoot v-if="porParticipe.length || (sinParticipe && sinParticipe.en_curso_n > 0)">
          <tr style="border-top:2px solid var(--border);background:var(--bg2)">
            <td style="text-align:left;font-weight:700;font-size:13px;padding:10px 12px">Total</td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.al_dia_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.al_dia_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--orange);padding:10px 12px">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.retraso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.retraso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--text3);padding:10px 12px" class="col-hide-mobile">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.cancelado_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.cancelado_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--red);padding:10px 12px">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.judicial_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.judicial_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;padding:10px 12px" class="col-hide-mobile">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.en_curso_imp, 0)) }} <span style="color:var(--text3);font-size:11px">({{ [...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.en_curso_n, 0) }})</span></td>
            <td style="text-align:right;font-family:var(--mono);font-size:12px;color:var(--green);padding:10px 12px">{{ fmtN([...porParticipe, ...(sinParticipe ? [sinParticipe] : [])].reduce((s,r) => s + r.capital_activo_imp, 0)) }}</td>
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
import { fmt, fmtInt, fmtN, calcInteresOrdinario, getEstadoBadge, generateCalendarioTeorico, today , distribuirCobros } from '../utils.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'

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
  const hoy      = today()
  const cobrosP  = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal      = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, cobrosP)
  return calConEstado.some(c => c.fecha <= hoy && c.estado !== 'cobrada')
}

function calcEstadoPrestamo(p) {
  if (p.estado === 'cancelado')     return 'cancelado'
  if (p.estado === 'judicializado') return 'judicializado'
  return tieneRetraso(p) ? 'con_retraso' : 'al_dia'
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
const prestamosEnCurso = computed(() => prestamosRaw.value.filter(p => p.estado !== 'cancelado'))
const capitalEnCurso   = computed(() => prestamosEnCurso.value.reduce((s, p) => s + Number(p.importe), 0))
const nConRetraso        = computed(() => prestamosEnCurso.value.filter(p => tieneRetraso(p)).length)
const nJudicializados   = computed(() => prestamosEnCurso.value.filter(p => p.estado === 'judicializado').length)
const incidencias      = computed(() => nConRetraso.value + nJudicializados.value)

const interesesMes = computed(() =>
  prestamosEnCurso.value
    .filter(p => p.estado !== 'judicializado')
    .reduce((s, p) => s + calcInteresOrdinario(Number(p.importe), Number(p.interes_ordinario)), 0)
)

const ltvMedio = computed(() => {
  const vals = prestamosEnCurso.value
    .filter(p => p.garantia_tasacion)
    .map(p => Number(p.importe) / Number(p.garantia_tasacion) * 100)
  if (!vals.length) return 0
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})

// Capital participado: suma del capital vivo proporcional de CCPs en préstamos activos (no jud, no cancelados)
const prestamosConCCP = computed(() => {
  const ids = new Set(ccpRaw.value.map(c => c.prestamo_id))
  return prestamosEnCurso.value.filter(p => ids.has(p.id))
})
const capitalParticipado = computed(() =>
  ccpRaw.value.reduce((s, c) => {
    const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
    if (!p || p.estado === 'cancelado' || p.estado === 'judicializado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalActivoPrestamo(p) * fraccion
  }, 0)
)
const nParticipados = computed(() => prestamosConCCP.value.length)

// Capital activo real (descuenta principal ya amortizado en préstamos franceses)
const capitalActivo = computed(() =>
  prestamosEnCurso.value
    .reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
)

// Intereses devengados a partícipes = importe_participacion × tasa_mensual (bruto, sin IRPF ni gestión)
const pagosParticipesMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosEnCurso.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    const tasa = Number(prestamo.interes_ordinario) / 100 / 12
    return s + Number(ccp.importe_participacion) * tasa
  }, 0)
)

// Ingresos por gestión = importe_participacion × % gestión / 12
const ingresosGestionMes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const prestamo = prestamosEnCurso.value.find(p => p.id === ccp.prestamo_id)
    if (!prestamo || prestamo.estado === 'judicializado') return s
    return s + Number(ccp.importe_participacion) * (Number(ccp.porcentaje_gestion || 0) / 100) / 12
  }, 0)
)

// ── Nuevos computed para KPIs unificados ─────────────────────────────────────
const netoPromocima = computed(() =>
  interesesMes.value - pagosParticipesMes.value + ingresosGestionMes.value
)

const rentabilidadMedia = computed(() => {
  const activos = prestamosEnCurso.value.filter(p => p.estado !== 'judicializado')
  if (!activos.length) return '0.0'
  const media = activos.reduce((s, p) => s + Number(p.interes_ordinario), 0) / activos.length
  return media.toFixed(1)
})

const rentabilidadPromocima = computed(() => {
  const capitalPropioActivo = capitalActivo.value - capitalParticipado.value
  if (!capitalPropioActivo) return '0.0'
  return (netoPromocima.value / capitalPropioActivo * 100 * 12).toFixed(1)
})

const importeRetraso = computed(() =>
  prestamosEnCurso.value.filter(p => tieneRetraso(p)).reduce((s, p) => s + Number(p.importe), 0)
)

const importeJudicial = computed(() =>
  prestamosEnCurso.value.filter(p => p.estado === 'judicializado').reduce((s, p) => s + Number(p.importe), 0)
)

const pctIncidencias = computed(() => {
  if (!capitalActivo.value) return '0.0'
  return ((importeRetraso.value + importeJudicial.value) / capitalActivo.value * 100).toFixed(1)
})

// ── KPI 1: Capital ────────────────────────────────────────────────────────────
const capitalJudicializado = computed(() =>
  prestamosEnCurso.value
    .filter(p => p.estado === 'judicializado')
    .reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
)
// Capital activo = capital vivo de operaciones NO judicializadas (al día + con retraso)
const capitalActivoNoJudicial = computed(() => capitalActivo.value - capitalJudicializado.value)
const pctJudicializado = computed(() =>
  capitalEnCurso.value ? (capitalJudicializado.value / capitalEnCurso.value * 100).toFixed(1) : '0.0'
)
// Capital participado judicializado: capital vivo proporcional de CCPs en préstamos judicializados
const capitalParticJudicializado = computed(() =>
  ccpRaw.value.reduce((s, c) => {
    const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
    if (!p || p.estado !== 'judicializado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalActivoPrestamo(p) * fraccion
  }, 0)
)
const pctJudicPartícipes = computed(() => {
  const total = capitalParticipado.value + capitalParticJudicializado.value
  return total ? (capitalParticJudicializado.value / total * 100).toFixed(1) : '0.0'
})

// ── KPI 2: Ingresos anuales ───────────────────────────────────────────────────
// Para préstamos americanos: importe * tasa_anual
// Para préstamos franceses: suma de intereses de cuotas del año natural en curso
const anoActual = computed(() => Number(today().slice(0, 4)))

const ingrAnualesActivas = computed(() => {
  const activos = prestamosEnCurso.value.filter(p => p.estado !== 'judicializado')
  return activos.reduce((s, p) => {
    const tipo = p.tipo_prestamo
    const tasa = Number(p.interes_ordinario) / 100
    if (tipo === 'Americano') {
      return s + Number(p.importe) * tasa
    }
    // Francés / Francés con carencia: sumar intereses de cuotas del año actual
    const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
    const cal = generateCalendarioTeorico(p)
    const interesesAnio = cal
      .filter(c => new Date(c.fecha + 'T00:00:00').getFullYear() === anoActual.value)
      .reduce((acc, c) => acc + (c.interes || 0), 0)
    return s + interesesAnio
  }, 0)
})

// Intereses anuales proporcionales a la participación de cada CCP
const ingrAnualesParticipes = computed(() => {
  return ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'judicializado' || p.estado === 'cancelado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    const tipo = p.tipo_prestamo
    const tasa = Number(p.interes_ordinario) / 100
    let interesAnual = 0
    if (tipo === 'Americano') {
      interesAnual = impTotal * tasa
    } else {
      const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
      const cal = generateCalendarioTeorico(p)
      interesAnual = cal
        .filter(c => new Date(c.fecha + 'T00:00:00').getFullYear() === anoActual.value)
        .reduce((acc, c) => acc + (c.interes || 0), 0)
    }
    return s + interesAnual * fraccion
  }, 0)
})

const ingrGestionAnual = computed(() => ingresosGestionMes.value * 12)

// Ingresos apertura LTM: préstamos firmados en los últimos 12 meses
const ingrAperturaLTM = computed(() => {
  const hoy = today()
  const hace12m = new Date(hoy)
  hace12m.setFullYear(hace12m.getFullYear() - 1)
  const limite = hace12m.toISOString().split('T')[0]
  return prestamosRaw.value
    .filter(p => p.fecha_inicio && p.fecha_inicio >= limite && p.fecha_inicio <= hoy)
    .reduce((s, p) => s + Number(p.importe) * Number(p.comision_apertura || 0) / 100, 0)
})

const rentActivas = computed(() => {
  if (!capitalActivoNoJudicial.value) return '0.00'
  return (ingrAnualesActivas.value / capitalActivoNoJudicial.value * 100).toFixed(2)
})

// Capital participado solo en préstamos activos (no judicializados)
const capitalParticipActivos = computed(() =>
  ccpRaw.value
    .filter(c => {
      const p = prestamosRaw.value.find(p => p.id === c.prestamo_id)
      return p && p.estado !== 'cancelado' && p.estado !== 'judicializado'
    })
    .reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)

const rentParticipes = computed(() => {
  if (!capitalParticipActivos.value) return '0.00'
  return (ingrAnualesParticipes.value / capitalParticipActivos.value * 100).toFixed(2)
})

const rentTotalPromocima = computed(() => {
  const capitalPropio = capitalActivoNoJudicial.value - capitalParticipActivos.value
  if (!capitalPropio) return '0.00'
  const ingrNetos = ingrAnualesActivas.value - ingrAnualesParticipes.value + ingrGestionAnual.value + ingrAperturaLTM.value
  return (ingrNetos / capitalPropio * 100).toFixed(2)
})

// ── KPI 3: Operaciones ────────────────────────────────────────────────────────
const nOperacionesTotal  = computed(() => prestamosRaw.value.length)
const nCanceladas        = computed(() => prestamosRaw.value.filter(p => p.estado === 'cancelado').length)
const nEnCurso           = computed(() => prestamosEnCurso.value.length)
const nActivas           = computed(() => prestamosEnCurso.value.filter(p => p.estado !== 'judicializado').length)
const nAlDia             = computed(() => prestamosEnCurso.value.filter(p => p.estado !== 'judicializado' && !tieneRetraso(p)).length)

// ── KPI 4: Garantías ──────────────────────────────────────────────────────────
// ── KPI 4: Garantías / LTV ────────────────────────────────────────────────────
// Garantías = suma de garantia_tasacion de préstamos en curso (activos + judicializados)
const garantiasEnCurso = computed(() =>
  prestamosEnCurso.value
    .filter(p => Number(p.garantia_tasacion || 0) > 0)
    .reduce((s, p) => s + Number(p.garantia_tasacion), 0)
)
// LTV en curso = capital vivo real (activo + judicializado) / garantías en curso
const ltvEnCurso = computed(() =>
  garantiasEnCurso.value ? (capitalActivo.value / garantiasEnCurso.value * 100).toFixed(1) : '0.0'
)
// Garantías partícipes = garantías en curso × % participación sobre el total de cada préstamo
const garantiasParticipes = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'cancelado') return s
    if (!Number(p.garantia_tasacion || 0)) return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    return s + Number(p.garantia_tasacion) * fraccion
  }, 0)
)
// Capital vivo proporcional participado (en curso = activo + judicializado)
const capitalVivoParticipado = computed(() =>
  ccpRaw.value.reduce((s, ccp) => {
    const p = prestamosRaw.value.find(p => p.id === ccp.prestamo_id)
    if (!p || p.estado === 'cancelado') return s
    const impTotal = Number(p.importe || 0)
    const fraccion = impTotal > 0 ? Number(ccp.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalActivoPrestamo(p) * fraccion
  }, 0)
)
// LTV partícipes = capital vivo participado en curso / garantías partícipes
const ltvParticipes = computed(() =>
  garantiasParticipes.value ? (capitalVivoParticipado.value / garantiasParticipes.value * 100).toFixed(1) : '0.0'
)

// ── KPI 5: Duraciones ─────────────────────────────────────────────────────────
// Duración real = días transcurridos / 30, redondeado
// Para canceladas: fecha_cancelacion - fecha_inicio
// Para el resto: hoy - fecha_inicio
function duracionRealMeses(p, fechaFin) {
  if (!p.fecha_inicio) return null
  const inicio = new Date(p.fecha_inicio + 'T00:00:00')
  const fin    = fechaFin ? new Date(fechaFin + 'T00:00:00') : new Date(today() + 'T00:00:00')
  const dias   = (fin - inicio) / 86400000
  return dias > 0 ? Math.floor(dias / 30) : null
}
function durMedia(arr, canceladas = false) {
  const vals = arr
    .map(p => canceladas ? duracionRealMeses(p, p.fecha_cancelacion) : duracionRealMeses(p, null))
    .filter(v => v !== null)
  if (!vals.length) return '—'
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
}
const durMediaEnCurso       = computed(() => durMedia(prestamosEnCurso.value))
const durMediaCanceladas     = computed(() => durMedia(prestamosRaw.value.filter(p => p.estado === 'cancelado'), true))
const durMediaActivas        = computed(() => durMedia(prestamosEnCurso.value.filter(p => p.estado !== 'judicializado')))
const durMediaJudicializadas = computed(() => durMedia(prestamosEnCurso.value.filter(p => p.estado === 'judicializado')))

// ── Capital activo real de un préstamo ────────────────────────────────────────
function calcCapitalActivoPrestamo(p) {
  if (p.tipo_prestamo === 'Americano') return Number(p.importe)
  const cobrosP = todosCobros.value.filter(c => c.prestamo_id === p.id)
  const cal = generateCalendarioTeorico(p)
  const calConEstado = distribuirCobros(cal, cobrosP)
  const amortCuotas = calConEstado
    .filter(c => c.estado === 'cobrada')
    .reduce((s, c) => s + (c.principal || 0), 0)
  return Math.max(0, Math.round((Number(p.importe) - amortCuotas) * 100) / 100)
}

// ── Resumen por estado ────────────────────────────────────────────────────────
const resumenEstados = computed(() => {
  const todos         = prestamosRaw.value
  const totalCapital  = todos.reduce((s, p) => s + Number(p.importe), 0)
  const activosCapital = todos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + Number(p.importe), 0)
  function filtrar(est) {
    if (est === 'con_retraso') return todos.filter(p => calcEstadoPrestamo(p) === 'con_retraso')
    if (est === 'al_dia')      return todos.filter(p => calcEstadoPrestamo(p) === 'al_dia')
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
  const est      = e => ps.filter(p => calcEstadoPrestamo(p) === e)
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
    en_curso_imp: activosImp,      en_curso_n: activosArr.length,
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
    .sort((a, b) => b.en_curso_imp - a.en_curso_imp)
})

// ── Por partícipe ─────────────────────────────────────────────────────────────
// Cada fila muestra la PARTICIPACIÓN del partícipe (importe_participacion del CCP),
// no el importe total del préstamo.
const porParticipe = computed(() => {
  const totalCapitalActivo = prestamosRaw.value.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)
  const prestamoMap = Object.fromEntries(prestamosRaw.value.map(p => [p.id, p]))

  // Agrupar contratos CCP por partícipe
  const grupos = {}
  for (const ccp of ccpRaw.value) {
    const key    = ccp.participe_id
    const nombre = ccp.participes?.nombre || key
    if (!grupos[key]) grupos[key] = { nombre, ccps: [] }
    grupos[key].ccps.push(ccp)
  }

  return Object.values(grupos).map(({ nombre, ccps }) => {
    // Para cada CCP, calculamos los importes proporcionales según su fracción de participación
    let al_dia_imp = 0, al_dia_n = 0
    let retraso_imp = 0, retraso_n = 0
    let cancelado_imp = 0, cancelado_n = 0
    let judicial_imp = 0, judicial_n = 0
    let capital_activo_imp = 0

    // Usamos un Set para contar préstamos únicos por estado (un préstamo puede tener varios CCPs del mismo partícipe)
    const prestamosContados = {}

    for (const ccp of ccps) {
      const p = prestamoMap[ccp.prestamo_id]
      if (!p) continue
      const imp = Number(ccp.importe_participacion || 0)
      const impTotal = Number(p.importe || 0)
      // Fracción que representa este CCP sobre el préstamo total
      const fraccion = impTotal > 0 ? imp / impTotal : 0
      const estado = p.estado === 'cancelado' ? 'cancelado'
                   : p.estado === 'judicializado' ? 'judicializado'
                   : tieneRetraso(p) ? 'con_retraso' : 'al_dia'

      // Capital activo proporcional
      const capActivo = calcCapitalActivoPrestamo(p) * fraccion

      // Acumular por estado (usando el CCP como unidad, no el préstamo)
      if (estado === 'cancelado') {
        cancelado_imp += imp
        if (!prestamosContados[p.id + '_c']) { cancelado_n++; prestamosContados[p.id + '_c'] = true }
      } else if (estado === 'judicializado') {
        judicial_imp += imp
        if (!prestamosContados[p.id + '_j']) { judicial_n++; prestamosContados[p.id + '_j'] = true }
        capital_activo_imp += capActivo
      } else if (estado === 'con_retraso') {
        retraso_imp += imp
        if (!prestamosContados[p.id + '_r']) { retraso_n++; prestamosContados[p.id + '_r'] = true }
        capital_activo_imp += capActivo
      } else {
        al_dia_imp += imp
        if (!prestamosContados[p.id + '_a']) { al_dia_n++; prestamosContados[p.id + '_a'] = true }
        capital_activo_imp += capActivo
      }
    }

    const en_curso_imp = al_dia_imp + retraso_imp + judicial_imp
    const en_curso_n   = al_dia_n + retraso_n + judicial_n
    return {
      nombre,
      al_dia_imp, al_dia_n,
      retraso_imp, retraso_n,
      cancelado_imp, cancelado_n,
      judicial_imp, judicial_n,
      en_curso_imp, en_curso_n,
      capital_activo_imp,
      pct: totalCapitalActivo ? capital_activo_imp / totalCapitalActivo * 100 : 0,
    }
  }).sort((a, b) => b.en_curso_imp - a.en_curso_imp)
})

// ── Sin partícipe ─────────────────────────────────────────────────────────────
// Incluye:
// 1. Préstamos que no tienen ningún CCP
// 2. La parte NO participada de préstamos que sí tienen CCP
const sinParticipe = computed(() => {
  const totalCapitalActivo = prestamosRaw.value.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + calcCapitalActivoPrestamo(p), 0)

  // Suma de importe_participacion por préstamo (solo CCPs activos)
  const participadoPorPrestamo = {}
  for (const ccp of ccpRaw.value) {
    participadoPorPrestamo[ccp.prestamo_id] = (participadoPorPrestamo[ccp.prestamo_id] || 0) + Number(ccp.importe_participacion || 0)
  }

  let al_dia_imp = 0, al_dia_n = 0
  let retraso_imp = 0, retraso_n = 0
  let cancelado_imp = 0, cancelado_n = 0
  let judicial_imp = 0, judicial_n = 0
  let capital_activo_imp = 0

  for (const p of prestamosRaw.value) {
    const impTotal     = Number(p.importe || 0)
    const participado  = participadoPorPrestamo[p.id] || 0
    const noParticipado = Math.max(0, impTotal - participado)
    if (noParticipado <= 0) continue

    const fraccion = impTotal > 0 ? noParticipado / impTotal : 0
    const capActivo = calcCapitalActivoPrestamo(p) * fraccion
    const estado = p.estado === 'cancelado' ? 'cancelado'
                 : p.estado === 'judicializado' ? 'judicializado'
                 : tieneRetraso(p) ? 'con_retraso' : 'al_dia'

    if (estado === 'cancelado') {
      cancelado_imp += noParticipado; cancelado_n++
    } else if (estado === 'judicializado') {
      judicial_imp += noParticipado; judicial_n++; capital_activo_imp += capActivo
    } else if (estado === 'con_retraso') {
      retraso_imp += noParticipado; retraso_n++; capital_activo_imp += capActivo
    } else {
      al_dia_imp += noParticipado; al_dia_n++; capital_activo_imp += capActivo
    }
  }

  const en_curso_imp = al_dia_imp + retraso_imp + judicial_imp
  const en_curso_n   = al_dia_n + retraso_n + judicial_n
  return {
    al_dia_imp, al_dia_n,
    retraso_imp, retraso_n,
    cancelado_imp, cancelado_n,
    judicial_imp, judicial_n,
    en_curso_imp, en_curso_n,
    capital_activo_imp,
    pct: totalCapitalActivo ? capital_activo_imp / totalCapitalActivo * 100 : 0,
    total_n: en_curso_n + cancelado_n,
  }
})
</script>
