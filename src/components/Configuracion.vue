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
              <input class="form-control" v-focus v-model="form.nombre_empresa" placeholder="Nombre de la empresa">
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
        <div class="table-header"><h3>Portal Partícipes</h3></div>
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
            <div class="form-group span-2">
              <label class="form-label">Fecha de cierre para el portal de los partícipes
                <span style="color:var(--text3);font-size:11px;margin-left:6px">Los datos posteriores a esta fecha no serán visibles en el portal</span>
              </label>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="form-control" type="date" v-model="form.fecha_cierre_portal" style="max-width:200px">
                <button v-if="form.fecha_cierre_portal" class="btn btn-sm btn-danger" @click="form.fecha_cierre_portal = null" title="Quitar fecha de cierre">✕ Quitar</button>
              </div>
              <div v-if="form.fecha_cierre_portal" style="margin-top:6px;font-size:12px;color:var(--accent)">
                ⚠ El portal mostrará datos hasta el {{ fmtDate(form.fecha_cierre_portal) }} inclusive
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mantenimiento -->
      <div class="table-card">
        <div class="table-header" style="display:flex;align-items:center;justify-content:space-between">
          <h3>Mantenimiento</h3>
          <span class="badge" :class="form.mantenimiento ? 'badge-outline-red' : 'badge-outline-green'">
            {{ form.mantenimiento ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
        <div class="modal-body">
          <div style="display:flex;align-items:center;gap:12px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
              <input type="checkbox" v-model="form.mantenimiento" style="width:16px;height:16px;cursor:pointer">
              Poner la aplicación en mantenimiento para usuarios no administradores
            </label>
          </div>
          <div v-if="form.mantenimiento" style="margin-top:10px;font-size:12px;color:var(--orange)">
            ⚠ Los usuarios con rol <strong>interno</strong> y <strong>partícipe</strong> verán una pantalla de mantenimiento al entrar. Los administradores acceden con normalidad.
          </div>
        </div>
      </div>

      <div class="alert alert-success" v-if="guardado">✓ Configuración guardada correctamente</div>
    </template>
  </div>
</template>

<script setup>
import { validarCampos, traducirErrorSupabase } from '../utils/validar.js'
import { useAuth } from '../composables/useAuth.js'
const { empresaId } = useAuth()
const { setMantenimiento } = useMantenimiento()
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js'
import { useMantenimiento } from '../composables/useMantenimiento.js'
import { fmtDate } from '../utils.js'

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
  fecha_cierre_portal: null,
  mantenimiento: false,
})

onMounted(async () => {
  const { data } = await supabase.from('config').select('*').limit(1).single()
  if (data) form.value = { ...form.value, ...data }
  loading.value = false
})

async function guardar() {
  const errores = validarCampos(form.value, [
    { campo: 'porcentaje_irpf', label: 'Porcentaje IRPF (%)', tipo: 'numero', min: 0, max: 100 },
  ])
  if (errores.length) return alert(errores.join('\n'))
  const { error } = await supabase.from('config').upsert({ ...form.value, id: 1, empresa_id: empresaId.value })
  if (error) {
    alert(traducirErrorSupabase(error))
    return
  }
  setMantenimiento(form.value.mantenimiento)
  guardado.value = true
  setTimeout(() => { guardado.value = false }, 3000)
}
</script>
