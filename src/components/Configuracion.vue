<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Configuración Global</div>
        <div class="section-sub">Valores por defecto para nuevos préstamos y cálculos</div>
      </div>
      <button class="btn btn-primary" @click="guardar">Guardar Cambios</button>
    </div>

    <div v-if="loading" class="table-empty">Cargando...</div>
    <template v-else>
      <!-- Identificación -->
      <div class="table-card">
        <div class="table-header"><h3>Identificación</h3></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Nombre de la Empresa</label>
              <input class="form-control" v-model="form.nombre_empresa" placeholder="Nombre de la empresa">
            </div>
            <div class="form-group">
              <label class="form-label">Código BdE <span style="color:var(--text3);font-size:10px">(4 dígitos)</span></label>
              <input class="form-control" v-model="form.id_BdE" placeholder="0000" maxlength="4">
            </div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header"><h3>Tipos de Interés</h3></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Interés Ordinario por defecto (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="form.interes_ordinario">
            </div>
            <div class="form-group">
              <label class="form-label">Interés de Demora por defecto (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="form.interes_demora">
            </div>
            <div class="form-group">
              <label class="form-label">Comisión de Apertura por defecto (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="form.comision_apertura">
            </div>
            <div class="form-group">
              <label class="form-label">Gestión por defecto (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="form.gestion">
            </div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header"><h3>Partícipes</h3></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Retención IRPF (%)</label>
              <input class="form-control" type="number" step="0.01" v-model="form.porcentaje_irpf">
            </div>
            <div class="form-group">
              <label class="form-label">Día de cobro partícipes</label>
              <input class="form-control" type="number" min="1" max="28" v-model="form.dia_cobro_participes">
            </div>
            <div class="form-group">
              <label class="form-label">% Gestión partícipes por defecto</label>
              <input class="form-control" type="number" step="0.01" v-model="form.porcentaje_gestion_defecto">
            </div>
            <div class="form-group">
              <label class="form-label">% Apertura partícipes por defecto</label>
              <input class="form-control" type="number" step="0.01" v-model="form.porcentaje_apertura_defecto">
            </div>
          </div>
        </div>
      </div>

      <!-- Fecha de referencia -->
      <div class="table-card" style="border:1px solid var(--orange);border-radius:8px">
        <div class="table-header">
          <h3 style="color:var(--orange)">📅 Fecha de Referencia</h3>
        </div>
        <div class="modal-body">
          <div style="margin-bottom:12px;font-size:13px;color:var(--text2);line-height:1.6">
            Por defecto el sistema usa la fecha de hoy para calcular si los préstamos están
            <strong>al día</strong> o <strong>con retraso</strong>. Si introduces una fecha aquí,
            toda la aplicación usará esa fecha como referencia — útil para que la información
            sea comparable al último día en que se introdujeron datos.
            <br><strong style="color:var(--orange)">Déjalo en blanco para usar la fecha real del sistema.</strong>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Fecha de referencia <span style="color:var(--text3);font-size:10px">(vacío = hoy)</span></label>
              <input class="form-control" type="date" v-model="form.fecha_referencia">
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end">
              <button class="btn btn-sm" style="background:var(--text3);color:#fff;border-color:var(--text3)"
                @click="form.fecha_referencia = null">✕ Usar fecha real</button>
            </div>
          </div>
          <div v-if="form.fecha_referencia" style="margin-top:8px;padding:8px 12px;background:color-mix(in srgb,var(--orange) 12%,transparent);border-radius:6px;font-size:12px;color:var(--orange)">
            ⚠ La aplicación está usando <strong>{{ form.fecha_referencia }}</strong> como fecha de referencia en lugar de hoy.
          </div>
        </div>
      </div>

      <div class="alert alert-success" v-if="guardado">✓ Configuración guardada correctamente</div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { fechaReferenciaGlobal } from '../utils.js'

const loading = ref(true)
const guardado = ref(false)
const form = ref({
  nombre_empresa: '',
  id_BdE: '',
  interes_ordinario: 11,
  interes_demora: 14,
  comision_apertura: 2,
  gestion: 2,
  porcentaje_irpf: 19,
  dia_cobro_participes: 10,
  porcentaje_gestion_defecto: 2,
  porcentaje_apertura_defecto: 0,
  fecha_referencia: null
})

onMounted(async () => {
  const { data } = await supabase.from('config').select('*').eq('id', 1).single()
  if (data) form.value = { ...form.value, ...data }
  loading.value = false
})

async function guardar() {
  const { error } = await supabase.from('config').upsert({ ...form.value, id: 1 }).eq('id', 1)
  if (error) {
    alert('Error al guardar: ' + error.message)
    return
  }
  // Actualizar la fecha de referencia global en tiempo real (sin recargar página)
  fechaReferenciaGlobal.value = form.value.fecha_referencia || null
  guardado.value = true
  setTimeout(() => { guardado.value = false }, 3000)
}
</script>
