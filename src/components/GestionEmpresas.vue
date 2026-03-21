<template>
  <div>
    <div class="section-header">
      <div>
        <div style="font-size:15px;font-weight:600">Empresas</div>
        <div class="section-sub">Gestión de empresas / entornos de datos</div>
      </div>
      <button class="btn btn-primary" @click="abrirModal">+ Nueva Empresa</button>
    </div>

    <div class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in empresas" :key="e.id">
            <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">{{ e.id }}</td>
            <td style="font-weight:500">{{ e.nombre }}</td>
            <td style="color:var(--text2);font-size:12px">{{ e.descripcion || '—' }}</td>
            <td>
              <span class="badge" :class="e.activa ? 'badge-outline-green' : 'badge-outline-gray'">
                {{ e.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td style="display:flex;gap:6px">
              <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px" @click="editar(e)">✎ Editar</button>
            </td>
          </tr>
          <tr v-if="!empresas.length">
            <td colspan="5" class="table-empty">Sin empresas registradas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrar">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ form.id ? 'Editar Empresa' : 'Nueva Empresa' }}</h2>
          <button class="btn btn-ghost btn-sm" @click="cerrar">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group">
              <label class="form-label">ID <span style="color:var(--text3);font-size:10px">(no editable)</span></label>
              <input class="form-control" v-model="form.id" :disabled="!!editando"
                placeholder="Ej: PROMOCIMA, PRUEBAS"
                style="text-transform:uppercase"
                @input="form.id = form.id.toUpperCase()" />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" v-model="form.nombre" placeholder="Nombre descriptivo" />
            </div>
          </div>
          <div class="form-group" style="margin-top:14px">
            <label class="form-label">Descripción</label>
            <input class="form-control" v-model="form.descripcion" placeholder="Descripción opcional" />
          </div>
          <div class="form-group" style="margin-top:14px;display:flex;align-items:center;gap:8px">
            <input type="checkbox" v-model="form.activa" id="activa" style="width:14px;height:14px;accent-color:var(--green)" />
            <label for="activa" style="font-size:13px;cursor:pointer">Empresa activa</label>
          </div>
          <div v-if="error" class="alert alert-danger" style="margin-top:14px">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="cerrar">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardando" @click="guardar">
            <span v-if="guardando" class="btn-spinner"></span>
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js'

const empresas   = ref([])
const modalAbierto = ref(false)
const editando   = ref(false)
const guardando  = ref(false)
const error      = ref(null)
const form       = ref({ id: '', nombre: '', descripcion: '', activa: true })

onMounted(cargar)

async function cargar() {
  const { data } = await supabase.from('empresas').select('*').order('id')
  empresas.value = data || []
}

function abrirModal() {
  form.value = { id: '', nombre: '', descripcion: '', activa: true }
  editando.value = false
  error.value = null
  modalAbierto.value = true
}

function editar(e) {
  form.value = { ...e }
  editando.value = true
  error.value = null
  modalAbierto.value = true
}

function cerrar() {
  modalAbierto.value = false
}

async function guardar() {
  if (!form.value.id || !form.value.nombre) return (error.value = 'ID y nombre son obligatorios')
  guardando.value = true
  error.value = null
  try {
    if (editando.value) {
      const { error: e } = await supabase.from('empresas')
        .update({ nombre: form.value.nombre, descripcion: form.value.descripcion, activa: form.value.activa })
        .eq('id', form.value.id)
      if (e) throw e
    } else {
      const { error: e } = await supabase.from('empresas')
        .insert({ id: form.value.id, nombre: form.value.nombre, descripcion: form.value.descripcion, activa: form.value.activa })
      if (e) throw e
    }
    modalAbierto.value = false
    await cargar()
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}
</script>
