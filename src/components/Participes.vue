<template>
  <div>
    <!-- DETALLE -->
    <template v-if="viewId && participe">
      <div v-if="!esPortalParticipe" class="back-btn" @click="$emit('navigate','participes')">← Volver a Partícipes</div>
      <div class="section-header">
        <div>
          <div class="section-title">{{ participe.nombre }}</div>
          <div class="section-sub">{{ participe.id }} · NIF: {{ participe.nif }}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button v-if="!readOnly || soloEditarContacto" class="btn btn-sm btn-registrar" @click="editar(participe)">✎ Editar</button>
          <button v-if="!readOnly" class="btn btn-sm btn-danger" @click="eliminarParticipe(participe.id)">✕ Eliminar</button>
          <button v-if="!readOnly" class="btn btn-sm btn-primary" @click="$emit('navigate','contratos-ccp')">Ver Contratos CCP →</button>
        </div>
      </div>

      <!-- KPIs del partícipe -->
      <div v-if="kpiPartLoading" style="color:var(--text3);font-size:12px;margin-bottom:16px">Calculando KPIs…</div>
      <template v-else>

        <!-- Fila 1: Capital Invertido + Rentabilidad -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">

          <!-- Capital Invertido -->
          <div class="kpi-card kc-purple">
            <div class="kpi-label">Capital Invertido</div>
            <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartEnCurso) }}</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row">
                <span>En curso <HelpTip :texto="help.capital_en_curso" pos="right" /></span>
                <span class="kpi-row-val">{{ fmtN(kpartEnCurso) }}</span>
              </div>
              <div class="kpi-row">
                <span>Activo <HelpTip :texto="help.capital_activo_participado" pos="right" /></span>
                <span class="kpi-row-val">{{ fmtN(kpartActivo) }}</span>
              </div>
              <template v-if="kpartJudicial > 0">
                <div class="kpi-row kpi-row-sep">
                  <span>Judicializado</span>
                  <span class="kpi-row-val">{{ fmtN(kpartJudicial) }}</span>
                </div>
                <div class="kpi-row">
                  <span>% Judicializado</span>
                  <span class="kpi-row-val">{{ kpartPctJudicial }}%</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Rentabilidad -->
          <div class="kpi-card kc-blue">
            <div class="kpi-label">Rentabilidad</div>
            <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartIngrAnuales) }}</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row">
                <span>Ingresos anuales previstos</span>
                <span class="kpi-row-val">{{ fmtN(kpartIngrAnuales) }}</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span>Rentabilidad</span>
                <span class="kpi-row-val">{{ kpartRentPct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila 2: Operaciones + LTV -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px">

          <!-- Operaciones -->
          <div class="kpi-card kc-green">
            <div class="kpi-label">Operaciones</div>
            <div class="kpi-value" style="font-size:20px">{{ kpartOpTotal }}</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row">
                <span>Total</span>
                <span class="kpi-row-val">{{ kpartOpTotal }}</span>
              </div>
              <div class="kpi-row">
                <span>En curso</span>
                <span class="kpi-row-val">{{ kpartOpEnCurso }}</span>
              </div>
              <div class="kpi-row">
                <span>Activas</span>
                <span class="kpi-row-val">{{ kpartOpActivas }}</span>
              </div>
              <div class="kpi-row">
                <span>Judicializadas</span>
                <span class="kpi-row-val">{{ kpartOpJudicializ }}</span>
              </div>
              <div class="kpi-row">
                <span>Canceladas</span>
                <span class="kpi-row-val">{{ kpartOpCanceladas }}</span>
              </div>
            </div>
          </div>

          <!-- LTV -->
          <div class="kpi-card kc-yellow">
            <div class="kpi-label">LTV</div>
            <div class="kpi-value" style="font-size:20px">{{ kpartLTV !== null ? kpartLTV + '%' : '—' }}</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row">
                <span>Total garantías</span>
                <span class="kpi-row-val">{{ fmtN(kpartGarantias) }}</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span>LTV</span>
                <span class="kpi-row-val">{{ kpartLTV !== null ? kpartLTV + '%' : '—' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila 3: Situación mes -->
        <div style="margin-bottom:20px">
          <div class="kpi-card kc-orange">
            <div class="kpi-label">Situación mes</div>
            <div class="kpi-value" style="font-size:20px">{{ fmtN(kpartBrutoMes) }}</div>
            <div style="margin-top:8px;display:grid;gap:4px">
              <div class="kpi-row">
                <span>Beneficio/mes</span>
                <span class="kpi-row-val">{{ fmtN(kpartBrutoMes) }}</span>
              </div>
              <div class="kpi-row">
                <span>Neto/mes</span>
                <span class="kpi-row-val">{{ fmtN(kpartNetoMes) }}</span>
              </div>
              <div class="kpi-row kpi-row-sep">
                <span>Devengado pendiente</span>
                <span class="kpi-row-val">{{ kpartDevengadoTotal > 0 ? fmtN(kpartDevengadoTotal) : '—' }}</span>
              </div>
            </div>
          </div>
        </div>

      </template>

      <!-- Datos del partícipe — oculto en el portal -->
      <div v-if="!esPortalParticipe" class="detail-grid">
        <div class="detail-item"><div class="detail-label">Tipo</div><div class="detail-value">{{ participe.tipo }}</div></div>
        <div class="detail-item"><div class="detail-label">Teléfono</div><div class="detail-value">{{ participe.telefono || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">{{ participe.email || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Centro de Coste</div><div class="detail-value mono">{{ participe.centro_coste || '—' }}</div></div>
        <div class="detail-item"><div class="detail-label">Fecha Alta</div><div class="detail-value">{{ fmtDate(participe.fecha_alta) }}</div></div>
        <div class="detail-item"><div class="detail-label">Estado</div>
          <div><span class="badge" :class="participe.activo ? 'badge-green' : 'badge-gray'">{{ participe.activo ? 'Activo' : 'Inactivo' }}</span></div>
        </div>
        <div class="detail-item" v-if="participe.direccion" style="grid-column:span 3">
          <div class="detail-label">Dirección</div><div class="detail-value">{{ participe.direccion }}</div>
        </div>
      </div>
        <!-- Filtro de estado — solo si hay cancelados -->
      <div v-if="contratosParticipe.some(c => c.prestamos?.estado === 'cancelado')" style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <button class="btn btn-sm" :class="filtroEstadoP==='activos' ? 'btn-primary' : ''" @click="filtroEstadoP='activos'">Activos</button>
        <button class="btn btn-sm" :class="filtroEstadoP==='todos' ? 'btn-primary' : ''" @click="filtroEstadoP='todos'">Todos</button>
        <span style="font-size:12px;color:var(--text3)">{{ contratosParticipeFiltrados.length }} contrato{{ contratosParticipeFiltrados.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="table-card">
        <div class="table-header"><h3>{{ readOnly ? 'Participaciones' : 'Contratos CCP Asociados' }} <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3></div>
        <table>
          <thead><tr>
            <th>Préstamo</th>
            <th style="text-align:right">Importe Participado</th>
            <th style="text-align:center">% Part.</th>
            <th style="text-align:right">Beneficio/mes</th>
            <th style="text-align:right">Neto/mes</th>
            <th style="text-align:right;color:var(--orange)">Devengado</th>
            <th>Estado préstamo</th>
            <th>Estado contrato</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in contratosParticipeFiltrados" :key="c.id" style="cursor:pointer" @click="$emit('navigate','contratos-ccp',c.id)">
              <td style="font-weight:500">{{ c.prestamos?.alias || '—' }}</td>
              <td class="td-mono td-right">{{ fmt(c.importe_participacion) }}</td>
              <td class="td-mono td-center">{{ c.porcentaje_participacion }}%</td>
              <td class="td-mono td-right" style="color:var(--accent)">
                {{ c.activo && c.prestamos?.estado !== 'cancelado' ? fmt(calcBeneficioMesP(c)) : '—' }}
              </td>
              <td class="td-mono td-right" style="color:var(--green)">
                {{ c.activo && c.prestamos?.estado !== 'cancelado' ? fmt(calcInteresNetoP(c)) : '—' }}
              </td>
              <td class="td-mono td-right" style="color:var(--orange)">
                {{ calcDevengadoP(c) > 0 ? fmt(calcDevengadoP(c)) : '—' }}
              </td>
              <td><span v-html="getEstadoBadge(c.prestamos?.estado === 'cancelado' ? 'cancelado' : c.prestamos?.estado === 'judicializado' ? 'judicializado' : c.prestamos?.situacion || 'al_dia')" /></td>
              <td><span class="badge" :class="c.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ c.activo ? 'Activo' : 'Cancelado' }}</span></td>
            </tr>
            <tr v-if="!contratosParticipeFiltrados.length"><td colspan="8" class="table-empty">Sin contratos</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- LISTA -->
    <template v-else>
      <!-- KPIs: 3 tarjetas -->
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">

        <!-- Capital Participado -->
        <div class="kpi-card kc-purple">
          <div class="kpi-label">Capital Participado <HelpTip :texto="help.participacion_en_curso" /></div>
          <div class="kpi-value">{{ fmtN(kpiCapEnCurso) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span style="color:var(--text3)">En curso</span>
              <span class="kpi-row-val">{{ fmtN(kpiCapEnCurso) }}</span>
            </div>
            <div class="kpi-row">
              <span style="color:var(--text3)">Activo</span>
              <span class="kpi-row-val">{{ fmtN(kpiCapActivo) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span style="color:var(--text3)">Al día</span>
              <span class="kpi-row-val">{{ fmtN(kpiCapAlDia) }}</span>
            </div>
            <div class="kpi-row">
              <span style="color:var(--text3)">Con retraso</span>
              <span class="kpi-row-val">{{ fmtN(kpiCapRetraso) }}</span>
            </div>
            <div class="kpi-row">
              <span style="color:var(--text3)">Judicializado</span>
              <span class="kpi-row-val">{{ fmtN(kpiCapJudicial) }}</span>
            </div>
          </div>
        </div>

        <!-- Rentabilidad Promocima -->
        <div class="kpi-card kc-green">
          <div class="kpi-label">Rentabilidad Promocima</div>
          <div class="kpi-value">{{ fmtN(kpiRentPromoTotal) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Gestión anual</span>
              <span class="kpi-row-val">{{ fmtN(kpiGestionAnual) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span>Apertura LTM (part.)</span>
              <span class="kpi-row-val">{{ fmtN(kpiAperturaLTM) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep" style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.15)">
              <span style="font-size:11px;color:var(--text2)">Rent. capital Promocima</span>
              <span class="kpi-row-val" style="font-size:11px">{{ kpiRentCapPromo }}%</span>
            </div>
            <!-- DEBUG -->
            <div style="margin-top:10px;border-top:1px dashed rgba(255,255,255,0.2);padding-top:8px">
              <button @click="showDebugPromo=!showDebugPromo" style="font-size:10px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%">
                {{ showDebugPromo ? '▲ Ocultar debug' : '▼ Ver cálculo paso a paso' }}
              </button>
              <div v-if="showDebugPromo" style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.85);line-height:1.8;font-family:var(--mono)">
                <div style="font-weight:700;margin-bottom:4px;color:#fff">— Préstamos en curso —</div>
                <div>Nº préstamos: {{ kpiDebugPromo.nPrestamosEC }}</div>
                <div>Capital activo en curso: {{ fmtN(kpiDebugPromo.totalEnCurso) }}</div>
                <div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.55);display:grid;gap:1px">
                  <div v-for="l in kpiDebugPromo.lineasPrestamos" :key="l.alias" style="display:flex;justify-content:space-between;gap:8px;font-family:var(--mono)">
                    <span>{{ l.alias }} ({{ l.tipo }}, {{ l.nCobros }}cb)</span>
                    <span>{{ fmtN(l.importe) }} → <b style="color:rgba(255,255,255,0.8)">{{ fmtN(l.capActivo) }}</b></span>
                  </div>
                </div>
                <div style="margin-top:6px;font-weight:700;color:#fff">— Capital participado en curso —</div>
                <div>Nº contratos CCP: {{ kpiDebugPromo.nCCPEnCurso }}</div>
                <div>Capital activo participado: {{ fmtN(kpiDebugPromo.capPart) }}</div>
                <div style="margin-top:6px;font-weight:700;color:#fff">— Capital Promocima en curso —</div>
                <div>{{ fmtN(kpiDebugPromo.totalEnCurso) }} − {{ fmtN(kpiDebugPromo.capPart) }} = <span style="color:#4ade80;font-weight:700">{{ fmtN(kpiDebugPromo.capPromo) }}</span></div>
                <div style="margin-top:6px;font-weight:700;color:#fff">— Ingresos Promocima —</div>
                <div>Gestión anual: {{ fmtN(kpiDebugPromo.gestion) }}</div>
                <div style="margin-top:4px;font-size:10px;color:rgba(255,255,255,0.6)">
                  <div v-for="l in kpiDebugPromo.lineasGestion" :key="l.prestamo" style="display:flex;justify-content:space-between;gap:8px">
                    <span>{{ l.prestamo }} ({{ fmtN(l.imp_part) }} × {{ l.pct_gest }}%)</span>
                    <span>{{ fmtN(l.gestion) }}</span>
                  </div>
                </div>
                <div style="margin-top:4px">Apertura LTM (part.): {{ fmtN(kpiDebugPromo.apertura) }}</div>
                <div>Total ingresos: {{ fmtN(kpiDebugPromo.gestion) }} + {{ fmtN(kpiDebugPromo.apertura) }} = <span style="color:#4ade80;font-weight:700">{{ fmtN(kpiDebugPromo.total) }}</span></div>
                <div style="margin-top:6px;font-weight:700;color:#fff">— Rentabilidad —</div>
                <div>{{ fmtN(kpiDebugPromo.total) }} / {{ fmtN(kpiDebugPromo.capPromo) }} × 100 = <span style="color:#4ade80;font-weight:700">{{ kpiDebugPromo.rentPct }}%</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rentabilidad Partícipes -->
        <div class="kpi-card kc-blue">
          <div class="kpi-label">Rentabilidad Partícipes</div>
          <div class="kpi-value">{{ fmtN(kpiIngrAnuales) }}</div>
          <div style="margin-top:8px;display:grid;gap:4px">
            <div class="kpi-row">
              <span>Ingresos anuales</span>
              <span class="kpi-row-val">{{ fmtN(kpiIngrAnuales) }}</span>
            </div>
            <div class="kpi-row kpi-row-sep">
              <span>Rentabilidad media</span>
              <span class="kpi-row-val">{{ kpiRentMedia }}%</span>
            </div>
          </div>
        </div>

      </div>
      <div class="section-header">
        <div>
          <div class="section-title">Partícipes</div>
          <div class="section-sub">{{ items.length }} registrados</div>
        </div>
        <button v-if="!readOnly" class="btn btn-primary" @click="abrirModal()">+ Nuevo Partícipe</button>
      </div>
      <div class="table-card">
        <div class="table-header">
          <h3>Listado <span style="font-weight:400;color:var(--text3);font-size:11px">(importes en €)</span></h3>
          <div style="display:flex;gap:8px;align-items:center">
            <select class="form-control" style="width:130px;padding:5px 10px;font-size:12px" v-model="filtroActivoP">
              <option value="activos">Activos</option>
              <option value="todos">Todos</option>
            </select>
            <input class="search-input" :class="{'filter-active': !!busqueda}" placeholder="Buscar..." v-model="busqueda" :style="!!busqueda ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
          </div>
        </div>
        <table>
          <thead><tr>
              <th @click="setSort('centro_coste')" :class="thClass('centro_coste')" style="text-align:center" class="col-hide-mobile">CC <span class="sort-icon">{{ thIcon('centro_coste') }}</span></th>
              <th @click="setSort('nombre')" :class="thClass('nombre')">Nombre <span class="sort-icon">{{ thIcon('nombre') }}</span></th>
              <th @click="setSort('tipo')" :class="thClass('tipo')" class="col-hide-mobile">Tipo <span class="sort-icon">{{ thIcon('tipo') }}</span></th>
              <th class="col-hide-mobile">NIF</th><th class="col-hide-mobile">Email</th>
              <th @click="setSort('nContratos')" :class="thClass('nContratos')" style="text-align:center">Contratos <span class="sort-icon">{{ thIcon('nContratos') }}</span></th>
              <th @click="setSort('capitalParticipado')" :class="thClass('capitalParticipado')" style="text-align:right" class="col-hide-mobile">Capital<br>participado <span class="sort-icon">{{ thIcon('capitalParticipado') }}</span></th>
              <th @click="setSort('capitalParticipActivo')" :class="thClass('capitalParticipActivo')" style="text-align:right">Capital<br>activo <span class="sort-icon">{{ thIcon('capitalParticipActivo') }}</span></th>
              <th @click="setSort('capitalCancelado')" :class="thClass('capitalCancelado')" style="text-align:right" class="col-hide-mobile">Cancelado <span class="sort-icon">{{ thIcon('capitalCancelado') }}</span></th>
              <th @click="setSort('devengadoMes')" :class="thClass('devengadoMes')" style="text-align:right" class="col-hide-mobile">Rent./mes <span class="sort-icon">{{ thIcon('devengadoMes') }}</span></th>
              <th @click="setSort('activo')" :class="thClass('activo')" class="col-hide-mobile">Estado <span class="sort-icon">{{ thIcon('activo') }}</span></th>
              <th style="width:40px"></th>
            </tr></thead>
          <tbody>
            <tr v-for="p in participesFiltrados" :key="p.id" style="cursor:pointer" @click="$emit('navigate','participes',p.id)">
              <td class="td-mono td-center col-hide-mobile" style="color:var(--text3)">{{ p.centro_coste || '—' }}</td>
              <td style="font-weight:500">{{ p.nombre }}</td>
              <td class="col-hide-mobile"><span class="badge" :class="p.tipo === 'empresa' ? 'badge-green' : 'badge-blue'">{{ p.tipo }}</span></td>
              <td class="td-mono col-hide-mobile" style="font-size:12px">{{ p.nif }}</td>
              <td style="font-size:12px" class="col-hide-mobile">{{ p.email || '—' }}</td>
              <td class="td-center"><span class="badge badge-gray">{{ p.nContratos || 0 }}</span></td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--violet)">{{ p.capitalParticipado ? fmtN(p.capitalParticipado) : '—' }}</td>
              <td class="td-mono td-right" style="color:var(--green)">{{ p.capitalParticipActivo ? fmtN(p.capitalParticipActivo) : '—' }}</td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--text3)">{{ p.capitalCancelado ? fmtN(p.capitalCancelado) : '—' }}</td>
              <td class="td-mono td-right col-hide-mobile" style="color:var(--orange)">{{ p.devengadoMes ? fmtDec(p.devengadoMes) : '—' }}</td>
              <td><span class="badge" :class="p.activo ? 'badge-green' : 'badge-gray'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td @click.stop>
                <button
                  class="btn btn-sm btn-danger-solid"
                  :disabled="contratos.some(cc => cc.participe_id === p.id)"
                  :title="contratos.some(cc => cc.participe_id === p.id) ? 'No se puede eliminar: tiene contratos CCP' : 'Eliminar partícipe'"
                  @click.stop="eliminarParticipeLista(p.id)"
                >✕</button>
              </td>
            </tr>
            <tr v-if="!participesFiltrados.length"><td colspan="8" class="table-empty">Sin resultados</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- MODAL -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ form.id ? 'Editar' : 'Nuevo' }} Partícipe</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrarModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Centro de Coste <span class="req">*</span></label>
              <input class="form-control" type="number" v-model="form.centro_coste">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-control" :class="{'filter-active': !!form.tipo}" v-model="form.tipo" :style="!!form.tipo ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''">
                <option value="persona">Persona Física</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>
            <div class="form-group span-2">
              <label class="form-label">Nombre completo / Razón social <span class="req">*</span></label>
              <input class="form-control" v-model="form.nombre" :disabled="soloEditarContacto" :style="soloEditarContacto?'opacity:0.6;cursor:not-allowed':''">
            </div>
            <div class="form-group"><label class="form-label">NIF / CIF</label><input class="form-control" v-model="form.nif" :disabled="soloEditarContacto" :style="soloEditarContacto?'opacity:0.6;cursor:not-allowed':''"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input class="form-control" v-model="form.telefono"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-control" v-model="form.email"></div>
            <div class="form-group"><label class="form-label">Fecha Alta</label><input class="form-control" type="date" v-model="form.fecha_alta"></div>
            <div class="form-group span-2"><label class="form-label">Dirección</label><input class="form-control" v-model="form.direccion"></div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <div style="padding-top:6px">
                <label class="ts-wrap" @click="form.activo = !form.activo">
                  <div class="ts-track" :class="{ on: form.activo }"><div class="ts-thumb"></div></div>
                  <span class="ts-label">{{ form.activo ? 'Activado' : 'Desactivado' }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" @click="guardarParticipe">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef, onMounted, watch } from 'vue'
import { usePersistedRef } from '../composables/usePersistedRef.js'
import { useSort } from '../composables/useSort.js'
import { useCrud } from '../composables/useCrud.js'
import HelpTip from './HelpTip.vue'
import { help } from '../helpTexts.js'
import { fmt, fmtInt, fmtN, fmtDate, today, generateCalendarioTeorico, distribuirCobros, calcSituacionPrestamo, calcCapitalEnCursoPrestamo, getEstadoBadge, calcularLineasCCP, calcDevengadoContrato, fmtDec } from '../utils.js'
import { supabase } from '../supabase.js'

const props = defineProps({
  viewId: String,
  readOnly: { type: Boolean, default: false },
  soloEditarContacto: { type: Boolean, default: false },
  vistaContratos: { type: Boolean, default: false },
  esPortalParticipe: { type: Boolean, default: false },
  fechaCierre: { type: String, default: null },  // fecha de cierre portal (YYYY-MM-DD)
})
const emit = defineEmits(['navigate'])

const busqueda = usePersistedRef('participes.busqueda', '')

// ── KPIs lista ────────────────────────────────
const kpiPrestamos      = ref([])
const kpiContratos      = ref([])

onMounted(async () => {
  // Paginar cobros igual que el Dashboard para no perder registros con el límite de 1000 de Supabase
  const fetchAllCobros = async () => {
    const PAGE = 1000
    let all = [], from = 0
    while (true) {
      const { data } = await supabase
        .from('cobros')
        .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo')
        .order('id').range(from, from + PAGE - 1)
      if (!data || data.length === 0) break
      all = all.concat(data)
      if (data.length < PAGE) break
      from += PAGE
    }
    return all
  }
  const [{ data: pr }, { data: cc }, cb] = await Promise.all([
    supabase.from('prestamos').select('id, importe, estado, interes_ordinario, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad, comision_apertura'),
    supabase.from('contratos_ccp').select('prestamo_id, participe_id, activo, importe_participacion, porcentaje_participacion, porcentaje_gestion'),
    fetchAllCobros(),
  ])
  kpiContratos.value  = cc || []
  // Enriquecer préstamos con situación calculada
  kpiPrestamos.value  = (pr || []).map(p => {
    const cobrosP = (cb || []).filter(c => c.prestamo_id === p.id)
    return { ...p, cobrosP, situacion: calcSituacionPrestamo(p, cobrosP) }
  })
})

// Préstamos que tienen al menos un CCP activo
const prestamosConCCP = computed(() => {
  const ids = new Set(kpiContratos.value.filter(c => c.activo).map(c => c.prestamo_id))
  return kpiPrestamos.value.filter(p => ids.has(p.id))
})
const prestamosActivosConCCP    = computed(() => prestamosConCCP.value.filter(p => p.estado !== 'cancelado'))
const prestamosActivosIds       = computed(() => new Set(kpiPrestamos.value.filter(p => p.estado !== 'cancelado').map(p => p.id)))
const ccpActivos                = computed(() => kpiContratos.value.filter(c => c.activo && prestamosActivosIds.value.has(c.prestamo_id)))
const kpiImporteParticipado     = computed(() => ccpActivos.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiNPrestamosActivos      = computed(() => prestamosActivosConCCP.value.length)
// estados simplificados (sin cálculo de retraso real para KPI — usamos campo estado BD)
const kpiAlDia          = computed(() => prestamosActivosConCCP.value.filter(p => p.situacion === 'al_dia').length)
const kpiConRetraso     = computed(() => prestamosActivosConCCP.value.filter(p => p.situacion === 'con_retraso').length)
const kpiJudicializados = computed(() => prestamosActivosConCCP.value.filter(p => p.estado === 'judicializado').length)
const kpiImporteCancelados          = computed(() => kpiPrestamos.value.filter(p => p.estado === 'cancelado').reduce((s, p) => s + Number(p.importe), 0))
const kpiNCancelados                = computed(() => kpiPrestamos.value.filter(p => p.estado === 'cancelado').length)
const kpiImporteCanceladoParticipado = computed(() =>
  kpiContratos.value.filter(c => canceladosIds.value.has(c.prestamo_id))
    .reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
)
const kpiNEmpresas      = computed(() => items.value.filter(p => p.tipo === 'empresa').length)
const kpiNPersonas      = computed(() => items.value.filter(p => p.tipo === 'persona').length)

// ── KPIs Capital participado desglosado ───────
// CCP activos en préstamos NO cancelados (en curso)
const ccpEnCurso  = computed(() => kpiContratos.value.filter(c => {
  if (!c.activo) return false
  const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
  return pr && pr.estado !== 'cancelado'
}))
const ccpActivos2 = computed(() => ccpEnCurso.value.filter(c => {
  const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
  return pr && pr.estado !== 'cancelado' && pr.estado !== 'judicializado'
}))
const ccpAlDia    = computed(() => ccpActivos2.value.filter(c => {
  const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
  return pr && pr.situacion === 'al_dia'
}))
const ccpRetraso  = computed(() => ccpActivos2.value.filter(c => {
  const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
  return pr && pr.situacion === 'con_retraso'
}))
const ccpJudicial = computed(() => ccpEnCurso.value.filter(c => {
  const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
  return pr && pr.estado === 'judicializado'
}))
const kpiCapEnCurso   = computed(() => ccpEnCurso.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiCapActivo    = computed(() => ccpActivos2.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiCapAlDia     = computed(() => ccpAlDia.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiCapRetraso   = computed(() => ccpRetraso.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))
const kpiCapJudicial  = computed(() => ccpJudicial.value.reduce((s, c) => s + Number(c.importe_participacion || 0), 0))

// ── KPIs Rentabilidad Promocima ───────────────
// Gestión anual: capital vivo participado × % gestión
const kpiGestionAnual = computed(() => {
  return Math.round(ccpEnCurso.value.reduce((s, c) => {
    const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'judicializado') return s
    return s + Number(c.importe_participacion || 0) * Number(c.porcentaje_gestion || 0) / 100
  }, 0) * 100) / 100
})
// Apertura LTM por partícipes: aperturas de los 12 últimos meses × % participación
const kpiAperturaLTM = computed(() => {
  const hoy     = today()
  const hace12  = new Date(hoy + 'T00:00:00')
  hace12.setFullYear(hace12.getFullYear() - 1)
  const hace12Str = hace12.toISOString().slice(0, 10)
  return Math.round(kpiContratos.value.reduce((s, c) => {
    if (!c.activo) return s
    const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'cancelado') return s
    const fi = pr.fecha_inicio || ''
    if (fi < hace12Str || fi > hoy) return s
    return s + Number(pr.importe || 0) * Number(pr.comision_apertura || 0) / 100 * Number(c.porcentaje_participacion || 0) / 100
  }, 0) * 100) / 100
})

// ── KPIs Rentabilidad Partícipes ──────────────
const anoActualKpi = new Date().getFullYear()
const kpiIngrAnuales = computed(() => {
  return Math.round(ccpActivos2.value.reduce((s, c) => {
    const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
    if (!pr) return s
    const pctPart = Number(c.porcentaje_participacion || 0) / 100
    const pctGest = Number(c.porcentaje_gestion || 0) / 100
    const tasaNet = (Number(pr.interes_ordinario || 0) / 100) - pctGest
    const capPart = Number(pr.importe) * pctPart
    const cal     = generateCalendarioTeorico(pr)
    const cuotasAnio = cal.filter(cu => new Date(cu.fecha + 'T00:00:00').getFullYear() === anoActualKpi).length
    return s + capPart * tasaNet / 12 * cuotasAnio
  }, 0) * 100) / 100
})
const kpiRentMedia = computed(() => {
  if (!kpiCapActivo.value) return '0.00'
  return (kpiIngrAnuales.value / kpiCapActivo.value * 100).toFixed(2)
})
// Rentabilidad Promocima: total = gestión + apertura
const kpiRentPromoTotal = computed(() =>
  Math.round((kpiGestionAnual.value + kpiAperturaLTM.value) * 100) / 100
)
// Capital Promocima en curso = Σ importe préstamos en curso − Σ importe_participacion CCP en curso
// Rentabilidad = (Gestión anual + Apertura LTM partícipes) / Capital Promocima en curso × 100
const kpiRentCapPromo = computed(() => {
  // Misma lógica que el Dashboard KPI Capital, subtítulo "En curso"
  // totalEnCurso = Σ calcCapitalEnCursoPrestamo(p) de préstamos no cancelados
  const totalEnCurso = kpiPrestamos.value
    .filter(p => p.estado !== 'cancelado')
    .reduce((s, p) => s + calcCapitalEnCursoPrestamo(p, p.cobrosP || []), 0)
  // capPart = Σ calcCapitalEnCursoPrestamo(p) × (importe_participacion / importe) de CCPs activos no cancelados no judicializados
  // (misma lógica que capitalParticipado en Dashboard)
  const capPart = kpiContratos.value.reduce((s, c) => {
    if (!c.activo) return s
    const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'cancelado' || pr.estado === 'judicializado') return s
    const impTotal = Number(pr.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(pr, pr.cobrosP || []) * fraccion
  }, 0)
  const capPromo = totalEnCurso - capPart
  if (!capPromo) return '0.00'
  return (kpiRentPromoTotal.value / capPromo * 100).toFixed(2)
})

// ── DEBUG Rentabilidad Promocima ─────────────────────────────────────────────
const kpiDebugPromo = computed(() => {
  const prestamosEnCurso = kpiPrestamos.value.filter(p => p.estado !== 'cancelado')
  const totalEnCurso     = prestamosEnCurso.reduce((s, p) => s + calcCapitalEnCursoPrestamo(p, p.cobrosP || []), 0)
  const nPrestamosEC     = prestamosEnCurso.length
  // capPart: misma lógica que capitalParticipado del Dashboard
  const capPart = kpiContratos.value.reduce((s, c) => {
    if (!c.activo) return s
    const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
    if (!pr || pr.estado === 'cancelado' || pr.estado === 'judicializado') return s
    const impTotal = Number(pr.importe || 0)
    const fraccion = impTotal > 0 ? Number(c.importe_participacion || 0) / impTotal : 0
    return s + calcCapitalEnCursoPrestamo(pr, pr.cobrosP || []) * fraccion
  }, 0)
  const nCCPEnCurso      = ccpEnCurso.value.length
  const capPromo         = totalEnCurso - capPart
  const gestion          = kpiGestionAnual.value
  const apertura         = kpiAperturaLTM.value
  const total            = kpiRentPromoTotal.value
  const rentPct          = kpiRentCapPromo.value
  // Desglose gestión: contrato a contrato
  const lineasGestion = ccpEnCurso.value
    .filter(c => { const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id); return pr && pr.estado !== 'judicializado' })
    .map(c => {
      const pr = kpiPrestamos.value.find(p => p.id === c.prestamo_id)
      const g  = Math.round(Number(c.importe_participacion || 0) * Number(c.porcentaje_gestion || 0) / 100 * 100) / 100
      return { prestamo: pr?.alias || c.prestamo_id, imp_part: Number(c.importe_participacion || 0), pct_gest: Number(c.porcentaje_gestion || 0), gestion: g }
    })
  const lineasPrestamos = prestamosEnCurso.map(p => ({
    alias: p.alias || p.id,
    tipo: p.tipo_prestamo,
    importe: Number(p.importe || 0),
    capActivo: Math.round(calcCapitalEnCursoPrestamo(p, p.cobrosP || []) * 100) / 100,
    nCobros: (p.cobrosP || []).length,
  }))
  return { nPrestamosEC, totalEnCurso, nCCPEnCurso, capPart, capPromo, gestion, apertura, total, rentPct, lineasGestion, lineasPrestamos }
})
const showDebugPromo = ref(false)

// Capital participado por partícipe (usando kpiContratos, igual que Dashboard)
const capitalPorParticipe = computed(() => {
  const map = {}
  for (const c of ccpActivos.value) {
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += Number(c.importe_participacion || 0)
  }
  return map
})

// Devengado mensual por partícipe: usa contratos del useCrud (tienen prestamos.interes_ordinario)
const devengadoPorParticipe = computed(() => {
  const map = {}
  for (const c of contratos.value) {
    if (!c.activo || c.prestamos?.estado === 'cancelado') continue
    const imp     = Number(c.importe_participacion || 0)
    const interes = Number(c.prestamos?.interes_ordinario || 0)
    const val     = imp * interes / 100 / 12
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += val
  }
  return map
})

// Capital cancelado por partícipe: contratos activos en préstamos cancelados
const canceladosIds = computed(() => new Set(kpiPrestamos.value.filter(p => p.estado === 'cancelado').map(p => p.id)))
const capitalCanceladoPorParticipe = computed(() => {
  const map = {}
  for (const c of kpiContratos.value.filter(c => canceladosIds.value.has(c.prestamo_id))) {
    if (!map[c.participe_id]) map[c.participe_id] = 0
    map[c.participe_id] += Number(c.importe_participacion || 0)
  }
  return map
})

const {
  items, secundarios: contratos,
  modalAbierto, form,
  abrirModal, editar, cerrarModal, guardar, eliminar,
  inicializar, cargarDatos,
} = useCrud(
  'participes',
  () => ({ id: null, nombre: '', tipo: 'persona', nif: '', telefono: '', email: '', centro_coste: '', direccion: '', fecha_alta: '', activo: true }),
  {
    ordenPor:   'nombre',
    prefixId:   'PT',
    idPadding:  6,
    secundaria: { tabla: 'contratos_ccp', select: '*, prestamos(id, alias, importe, estado, tipo_prestamo, fecha_inicio, duracion_meses, dia_cobro, periodicidad, interes_ordinario)', orden: 'id' },
    enriquecerItems: (parts, conts) => {
      // Igual que Dashboard: contratos activos cruzados con prestamos no cancelados por ID
      const ccpActivos = conts.filter(c => c.activo)
      const prestamosActivosIds = new Set(
        conts.map(c => c.prestamos).filter(p => p && p.estado !== 'cancelado').map(p => p.id)
      )
      return parts.map(x => {
        const misContratos = ccpActivos.filter(c =>
          c.participe_id === x.id && prestamosActivosIds.has(c.prestamo_id)
        )
        const capitalParticipado    = misContratos.reduce((s, c) => s + Number(c.importe_participacion || 0), 0)
        const capitalParticipActivo = capitalParticipado
        return { ...x, nContratos: conts.filter(c => c.participe_id === x.id).length, capitalParticipado, capitalParticipActivo }
      })
    },
    validar: f => (!(f.nombre || '').trim() || f.centro_coste === '' || f.centro_coste === null || f.centro_coste === undefined) ? 'Nombre y Centro de Coste son obligatorios' : null,
    prepararData: f => {
      const data = { ...f }
      delete data.id
      delete data.nContratos
      delete data.capitalParticipado
      delete data.capitalParticipActivo
      delete data.capitalCancelado
      delete data.devengadoMes
      // Si no se ha rellenado la fecha alta, usar la fecha del sistema
      if (!data.fecha_alta) data.fecha_alta = today()
      return data
    },
  }
)

inicializar(toRef(props, 'viewId'))

const { sorted: participesSorted, setSort, thIcon, thClass } = useSort(items, 'centro_coste')
const participe          = computed(() => items.value.find(p => p.id === props.viewId) || null)
// Contratos del partícipe: base del useCrud enriquecida con cobrosP y situación real de kpiPartContratos
const contratosParticipe = computed(() => {
  const base = contratos.value.filter(c => c.participe_id === props.viewId)
  // kpiPartContratos tiene: cobrosP, prestamos completo (con meses_carencia, garantia_tasacion...), situacion
  const kpiMap = Object.fromEntries(kpiPartContratos.value.map(c => [c.id, c]))
  return base.map(c => {
    const kpi = kpiMap[c.id]
    if (!kpi) return c
    return {
      ...c,
      cobrosP:   kpi.cobrosP || [],
      prestamos: kpi.prestamos ?? c.prestamos,
    }
  })
})
const filtroEstadoP = ref('activos')
const contratosParticipeFiltrados = computed(() => {
  if (filtroEstadoP.value === 'todos') return contratosParticipe.value
  return contratosParticipe.value.filter(c =>
    c.prestamos?.estado !== 'cancelado'
  )
})
const filtroActivoP = ref('activos')
const participesFiltrados = computed(() => {
  const q   = busqueda.value.toLowerCase()
  const cap = capitalPorParticipe.value
  return participesSorted.value
    .filter(p => filtroActivoP.value === 'activos' ? p.activo : true)
    .filter(p => p.nombre.toLowerCase().includes(q) || (p.nif || '').toLowerCase().includes(q))
    .map(p => ({
      ...p,
      capitalParticipado:    cap[p.id] || 0,
      capitalParticipActivo: cap[p.id] || 0,
      capitalCancelado:      capitalCanceladoPorParticipe.value[p.id] || 0,
      devengadoMes:          Math.round((devengadoPorParticipe.value[p.id] || 0) * 100) / 100,
    }))
})
async function eliminarParticipeLista(id) {
  if (contratos.value.some(cc => cc.participe_id === id))
    return alert('No se puede eliminar: tiene contratos CCP vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este partícipe?' })
  if (ok && props.viewId === id) emit('navigate', 'participes')
}

async function eliminarParticipe(id) {
  if (contratos.value.some(cc => cc.participe_id === id))
    return alert('No se puede eliminar: tiene contratos CCP vinculados.')
  const ok = await eliminar(id, { msgConfirm: '¿Eliminar este partícipe?' })
  if (ok) emit('navigate', 'participes')
}

// ── KPIs detalle partícipe ────────────────────
const kpiPartLoading   = ref(false)
const kpiPartContratos = ref([])   // contratos CCP del partícipe con prestamo info
const kpiPartPagos     = ref([])   // pagos_reales_participe
const kpiPartIrpf      = ref(19)

watch(() => props.viewId,    v => { if (v) cargarKPIsPart(v) }, { immediate: true })
watch(() => props.fechaCierre, () => { if (props.viewId) cargarKPIsPart(props.viewId) })

async function cargarKPIsPart(pid) {
  if (!pid) return
  kpiPartLoading.value = true
  const cierre = props.fechaCierre || null
  try {
    const [{ data: cc }, { data: cfg }] = await Promise.all([
      supabase.from('contratos_ccp')
        .select('*, prestamos(id, alias, estado, importe, interes_ordinario, fecha_inicio, dia_cobro, duracion_meses, tipo_prestamo, periodicidad, garantia_tasacion, meses_carencia)')
        .eq('participe_id', pid),
      supabase.from('config').select('porcentaje_irpf').eq('id', 1).single(),
    ])

    // Filtrar contratos y préstamos por fecha de cierre
    const ccFiltrados = (cc || [])
      .filter(c => !cierre || (c.fecha_firma || '') <= cierre)
      .filter(c => !cierre || !c.prestamos || (c.prestamos.fecha_inicio || '') <= cierre)

    // Cargar cobros y filtrar por fecha de cierre
    const prestamoIds = [...new Set(ccFiltrados.map(c => c.prestamo_id))]
    let cobrosKPIPart = []
    if (prestamoIds.length) {
      const { data: cbp } = await supabase
        .from('cobros')
        .select('prestamo_id, importe, tipo, fecha_real, fecha_teorica, importe_principal, modalidad_recalculo, cuota_num')
        .in('prestamo_id', prestamoIds)
      cobrosKPIPart = (cbp || []).filter(cb => !cierre || (cb.fecha_real || cb.fecha_teorica || '') <= cierre)
    }

    // Enriquecer cada contrato con la situacion calculada del préstamo
    kpiPartContratos.value = ccFiltrados.map(c => {
      const pr = c.prestamos
      if (!pr) return c
      const cobrosP = cobrosKPIPart.filter(cb => cb.prestamo_id === pr.id)
      return { ...c, cobrosP, prestamos: { ...pr, situacion: calcSituacionPrestamo(pr, cobrosP, cierre) } }
    })
    kpiPartIrpf.value = cfg?.porcentaje_irpf ?? 19

    // Cargar pagos filtrando por fecha de cierre
    const ids = ccFiltrados.map(c => c.id)
    if (ids.length) {
      let pgQuery = supabase.from('pagos_reales_participe').select('*').in('contrato_ccp_id', ids)
      if (cierre) pgQuery = pgQuery.lte('fecha_pago_real', cierre)
      const { data: pg } = await pgQuery
      kpiPartPagos.value = pg || []
    } else {
      kpiPartPagos.value = []
    }
  } finally {
    kpiPartLoading.value = false
  }
}

// Enriquecer contratos con estado del préstamo
const kpiPartEnr = computed(() =>
  kpiPartContratos.value.map(c => {
    const pr = c.prestamos  // ya enriquecido con situacion en cargarKPIsPart
    const estadoPrestamo = !pr ? 'al_dia'
      : pr.estado === 'cancelado'     ? 'cancelado'
      : pr.estado === 'judicializado' ? 'judicializado'
      : pr.situacion || 'al_dia'
    return { ...c, estadoPrestamo }
  })
)

// ── Capital activo real por contrato (descuenta cuotas cobradas en Francés) ──
const capActivoPorContrato = (c) => {
  const pr = c.prestamos
  if (!pr || pr.estado === 'cancelado') return 0
  return calcCapitalEnCursoPrestamo(pr, c.cobrosP || []) * Number(c.porcentaje_participacion) / 100
}

// Por estado de préstamo
const kpiPartActivos    = computed(() => kpiPartEnr.value.filter(c => c.activo && c.estadoPrestamo !== 'cancelado'))
const kpiPartActNOJud   = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo !== 'judicializado'))
const kpiPartJud        = computed(() => kpiPartActivos.value.filter(c => c.estadoPrestamo === 'judicializado'))

// Capital Invertido — capital activo real × % participación
const kpartEnCurso    = computed(() => kpiPartActivos.value.reduce((s,c) => s + capActivoPorContrato(c), 0))
const kpartActivo     = computed(() => kpiPartActNOJud.value.reduce((s,c) => s + capActivoPorContrato(c), 0))
const kpartJudicial   = computed(() => kpiPartJud.value.reduce((s,c) => s + capActivoPorContrato(c), 0))
const kpartJudicialN  = computed(() => kpiPartJud.value.length)
const kpartPctJudicial= computed(() => {
  const base = kpartActivo.value + kpartJudicial.value
  return base > 0 ? Math.round(kpartJudicial.value / base * 10000) / 100 : 0
})
const kpartEnCursoN   = computed(() => kpiPartActivos.value.length)
const kpartCanceladoN = computed(() => kpiPartEnr.value.filter(c => c.estadoPrestamo === 'cancelado').length)

// Rentabilidad — ingresos anuales netos de gestión desde el punto de vista del partícipe
// La gestión se descuenta de la tasa del préstamo:
//   tasa_partícipe = tasa_préstamo - % gestión
//   ingresos = capital_participado × tasa_partícipe / 12 × nº cuotas en el año
const anoActual = new Date().getFullYear()
const kpartIngrAnuales = computed(() => {
  return Math.round(kpiPartActNOJud.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr) return s
    const pctPart   = Number(c.porcentaje_participacion) / 100
    const tasaNet   = (Number(pr.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
    const capPart   = Number(pr.importe) * pctPart  // capital del partícipe en el préstamo
    // Contar cuotas del préstamo que caen en el año actual
    const cal = generateCalendarioTeorico(pr)
    const cuotasAnio = cal.filter(cu => new Date(cu.fecha + 'T00:00:00').getFullYear() === anoActual).length
    return s + capPart * tasaNet / 12 * cuotasAnio
  }, 0) * 100) / 100
})
const kpartRentPct = computed(() => {
  if (!kpartActivo.value) return '0.00'
  return (kpartIngrAnuales.value / kpartActivo.value * 100).toFixed(2)
})

// Operaciones
const kpartOpTotal      = computed(() => kpiPartEnr.value.length)
const kpartOpCanceladas = computed(() => kpiPartEnr.value.filter(c => c.estadoPrestamo === 'cancelado').length)
const kpartOpEnCurso    = computed(() => kpiPartActivos.value.length)
const kpartOpJudicializ = computed(() => kpiPartJud.value.length)
const kpartOpActivas    = computed(() => kpiPartActNOJud.value.length)

// LTV
const kpartGarantias = computed(() =>
  kpiPartActivos.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr || !pr.garantia_tasacion) return s
    return s + Number(pr.garantia_tasacion) * Number(c.porcentaje_participacion) / 100
  }, 0)
)
const kpartLTV = computed(() => {
  if (!kpartGarantias.value) return null
  return Math.round(kpartEnCurso.value / kpartGarantias.value * 10000) / 100
})

// Parámetros (mantenidos para compatibilidad con otras partes del template)
const kpartIrpf = computed(() => kpiPartIrpf.value)
const kpartPctGestion = computed(() => {
  const activos = kpiPartActivos.value
  if (!activos.length) return 0
  return Math.round(activos.reduce((s,c) => s + Number(c.porcentaje_gestion), 0) / activos.length * 100) / 100
})
const kpartBrutoMes = computed(() => {
  return Math.round(kpiPartActNOJud.value.reduce((s, c) => {
    const pr = c.prestamos
    if (!pr) return s
    const imp     = Number(c.importe_participacion)
    const interes = imp * Number(pr.interes_ordinario) / 100 / 12
    const gestion = imp * Number(c.porcentaje_gestion) / 100 / 12
    return s + (interes - gestion)
  }, 0) * 100) / 100
})
const kpartIrpfMes  = computed(() => Math.round(kpartBrutoMes.value * (kpartIrpf.value / 100) * 100) / 100)
const kpartNetoMes  = computed(() => Math.round((kpartBrutoMes.value - kpartIrpfMes.value) * 100) / 100)
const kpartBrutoAcum      = computed(() => kpiPartPagos.value.reduce((s,p) => s + Number(p.importe_bruto), 0))
const kpartDevengadoTotal = computed(() =>
  Math.round(kpiPartActNOJud.value.reduce((s, c) => s + calcDevengadoP(c), 0) * 100) / 100
)
const kpartDevengados     = computed(() => [])
const kpartDevengadosAgrupados = computed(() => [])

// Guardar partícipe — si soloEditarContacto, sólo actualiza tel/email/dir
async function guardarParticipe() {
  if (props.soloEditarContacto && form.value.id) {
    const { error } = await supabase.from('participes').update({
      telefono:  form.value.telefono,
      email:     form.value.email,
      direccion: form.value.direccion,
    }).eq('id', form.value.id)
    if (error) return alert('Error: ' + error.message)
    cerrarModal()
    // Refrescar datos del partícipe (useCrud: re-init forzando recarga)
    await cargarDatos()
  } else {
    await guardar()
  }
}

// Beneficio/mes = capital × (tasa_préstamo - % gestión) / 12
function calcBeneficioMesP(c) {
  if (!c.prestamos) return 0
  const tasaNet = (Number(c.prestamos.interes_ordinario) - Number(c.porcentaje_gestion)) / 100
  return Math.round(Number(c.importe_participacion) * tasaNet / 12 * 100) / 100
}

// Neto/mes = Beneficio/mes × (1 - IRPF 19%)
function calcInteresNetoP(c) {
  return Math.round(calcBeneficioMesP(c) * (1 - 0.19) * 100) / 100
}

// Devengado = neto de cuotas cuyo préstamo cobró y cuyo mes siguiente ya comenzó
function calcDevengadoP(c) {
  // Usar kpiPartContratos directamente — tiene cobrosP y prestamos completo
  const kpi = kpiPartContratos.value.find(k => k.id === c.id)
  if (!kpi || !kpi.prestamos || !c.activo || kpi.prestamos.estado === 'cancelado') return 0
  const pagosC = kpiPartPagos.value.filter(p => p.contrato_ccp_id === c.id)
  return calcDevengadoContrato(kpi, kpi.prestamos, kpi.cobrosP || [], pagosC, props.fechaCierre || today())
}
</script>
