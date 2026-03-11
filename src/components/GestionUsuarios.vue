<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Gestión de Usuarios</div>
        <div class="section-sub">Accesos y perfiles del sistema</div>
      </div>
      <button class="btn btn-primary" @click="abrirInvitar">+ Invitar Usuario</button>
    </div>

    <!-- Tabla -->
    <div class="table-card">
      <div class="table-header"><h3>Usuarios ({{ usuarios.length }})</h3></div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Partícipe vinculado</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td style="font-weight:500">{{ u.nombre || '—' }}</td>
            <td style="font-size:12px;color:var(--text3)">{{ u.email }}</td>
            <td><span class="badge" :class="rolBadge(u.rol)">{{ u.rol }}</span></td>
            <td style="font-size:12px">
              <template v-if="u.rol === 'participe' && u.participe_ids?.length">
                <span v-for="pid in u.participe_ids" :key="pid" class="badge badge-outline-yellow" style="font-size:10px;margin-right:3px">{{ nombreParticipe(pid) }}</span>
              </template>
              <span v-else-if="u.rol === 'participe'" style="color:var(--text3)">Sin vincular</span>
              <span v-else>—</span>
            </td>
            <td><span class="badge" :class="u.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px"
                @click="editar(u)">✎ Editar</button>
              <button v-if="isAdmin" class="btn btn-sm" style="font-size:11px;padding:3px 9px;background:var(--blue);color:#fff"
                :disabled="reenviadoId === u.id"
                :title="'Reenviar email de invitación a ' + u.email"
                @click="reenviarInvitacion(u)">{{ reenviadoId === u.id ? '✓ Enviado' : '✉ Reenviar' }}</button>
              <button v-if="isAdmin" class="btn btn-sm btn-danger" style="font-size:11px;padding:3px 9px"
                :disabled="u.id === usuarioActualId"
                :title="u.id === usuarioActualId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'"
                @click="confirmarEliminar(u)">✕ Eliminar</button>
            </td>
          </tr>
          <tr v-if="!usuarios.length">
            <td colspan="6" class="table-empty">Sin usuarios registrados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Nota SQL -->


    <!-- Modal editar -->
    <div class="modal-overlay" v-if="modalAbierto">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar Usuario</h2>
          <button class="btn btn-ghost btn-sm" @click="modalAbierto = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid cols-1" style="gap:12px">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" v-model="form.nombre" placeholder="Nombre y apellidos">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" :value="form.email" disabled style="opacity:0.6">
            </div>
            <div class="form-group">
              <label class="form-label">Rol <span class="req">*</span></label>
              <select class="form-control" v-model="form.rol">
                <option value="admin">Administrador</option>
                <option value="interno">Usuario Interno</option>
                <option value="participe">Partícipe</option>
              </select>
            </div>
            <div v-if="form.rol === 'participe'" class="form-group">
              <label class="form-label">Partícipes vinculados</label>
              <div style="border:1px solid var(--border);border-radius:6px;max-height:160px;overflow-y:auto;padding:6px 8px;background:var(--bg2)">
                <label v-for="p in participes" :key="p.id"
                  style="display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer;font-size:13px">
                  <input type="checkbox" :value="p.id" v-model="form.participe_ids">
                  <span>{{ p.nombre }}</span>
                  <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">{{ p.id }}</span>
                </label>
                <div v-if="!participes.length" style="font-size:12px;color:var(--text3);padding:4px 0">Sin partícipes disponibles</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-control" v-model="form.activo">
                <option :value="true">Activo</option>
                <option :value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="modalAbierto = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="saving" @click="guardar">
            <span v-if="saving" class="btn-spinner"></span>
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal invitar usuario -->
    <div class="modal-overlay" v-if="modalInvitar">
      <div class="modal">
        <div class="modal-header">
          <h2>Invitar Usuario</h2>
          <button class="btn btn-ghost btn-sm" @click="modalInvitar = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid cols-1" style="gap:12px">
            <div class="form-group">
              <label class="form-label">Email <span class="req">*</span></label>
              <input class="form-control" type="email" v-model="formInvitar.email" placeholder="usuario@ejemplo.com">
            </div>
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" v-model="formInvitar.nombre" placeholder="Nombre y apellidos">
            </div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select class="form-control" v-model="formInvitar.rol">
                <option value="interno">Interno</option>
                <option value="admin">Administrador</option>
                <option value="participe">Partícipe</option>
              </select>
            </div>
            <div v-if="formInvitar.rol === 'participe'" class="form-group">
              <label class="form-label">Partícipes vinculados</label>
              <div style="max-height:140px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:8px;display:flex;flex-direction:column;gap:4px">
                <label v-for="p in participes" :key="p.id"
                  style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                  <input type="checkbox" :value="p.id" v-model="formInvitar.participe_ids">
                  {{ p.nombre }}
                </label>
                <div v-if="!participes.length" style="font-size:12px;color:var(--text3);padding:4px 0">Sin partícipes disponibles</div>
              </div>
            </div>
          </div>
          <div v-if="msgInvitar" class="alert" :class="msgInvitar.ok ? 'alert-success' : 'alert-danger'" style="margin-top:12px;font-size:12px">
            {{ msgInvitar.text }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="modalInvitar = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="savingInvitar" @click="enviarInvitacion">
            <span v-if="savingInvitar" class="btn-spinner"></span>
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../supabase.js'

const { listarUsuarios, guardarPerfil, user, isAdmin } = useAuth()

const usuarios     = ref([])
const participes   = ref([])
const modalAbierto = ref(false)
const saving       = ref(false)
const form         = ref(formVacio())

function formVacio() {
  return { id: null, email: '', nombre: '', rol: 'interno', participe_ids: [], activo: true }
}

onMounted(cargar)

async function cargar() {
  try { usuarios.value = await listarUsuarios() } catch { usuarios.value = [] }
  const { data } = await supabase.from('participes').select('id, nombre').eq('activo', true).order('nombre')
  participes.value = data || []
}

function nombreParticipe(id) {
  return participes.value.find(p => p.id === id)?.nombre || id
}

function abrirNuevo() {
  form.value = formVacio()
  modalAbierto.value = true
}
function editar(u) {
  form.value = { ...u, participe_ids: [...(u.participe_ids || [])] }
  modalAbierto.value = true
}

async function guardar() {
  if (!form.value.id) return alert('No se puede guardar: el usuario no tiene ID asignado.')
  if (!form.value.rol) return alert('El rol es obligatorio')
  saving.value = true
  try {
    await guardarPerfil({
      id: form.value.id,
      email: form.value.email,
      nombre: form.value.nombre,
      rol: form.value.rol,
      participe_ids: form.value.rol === 'participe' ? (form.value.participe_ids || []) : [],
      activo: form.value.activo,
    })
    modalAbierto.value = false
    await cargar()
  } catch (e) {
    alert('Error: ' + e.message)
  } finally {
    saving.value = false
  }
}

function rolBadge(rol) {
  return { admin: 'badge-outline-red', interno: 'badge-outline-blue', participe: 'badge-outline-yellow' }[rol] || 'badge-outline-gray'
}

// ── Eliminar usuario ──────────────────────────────────────────────────────────
const usuarioActualId = computed(() => user.value?.id)

const reenviadoId = ref(null)

async function reenviarInvitacion(u) {
  if (!confirm(`¿Reenviar invitación a "${u.email}"?`)) return
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const fnUrl = 'https://lsdmmnxkrrliutleyehp.supabase.co/functions/v1/invite-user'
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ email: u.email, nombre: u.nombre, rol: u.rol, participe_ids: u.participe_ids || [], redirectTo: window.location.origin + '/callback.html' })
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      alert('Error al reenviar: ' + (data.error || 'Error desconocido'))
    } else {
      reenviadoId.value = u.id
      setTimeout(() => { reenviadoId.value = null }, 3000)
    }
  } catch (e) {
    alert('Error: ' + e.message)
  }
}

async function confirmarEliminar(u) {
  if (!confirm(`¿Eliminar el usuario "${u.nombre || u.email}"?\nEsto eliminará su acceso de forma permanente.`)) return
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const fnUrl = 'https://lsdmmnxkrrliutleyehp.supabase.co/functions/v1/delete-user'
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ user_id: u.id })
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      alert('Error al eliminar: ' + (data.error || 'Error desconocido'))
    } else {
      await cargar()
    }
  } catch (e) {
    alert('Error: ' + e.message)
  }
}

// ── Invitar usuario ───────────────────────────────────────────────────────────
const modalInvitar  = ref(false)
const savingInvitar = ref(false)
const msgInvitar    = ref(null)
const formInvitar   = ref({ email: '', nombre: '', rol: 'interno', participe_ids: [] })

function abrirInvitar() {
  formInvitar.value  = { email: '', nombre: '', rol: 'interno', participe_ids: [] }
  msgInvitar.value   = null
  modalInvitar.value = true
}

async function enviarInvitacion() {
  if (!formInvitar.value.email) return alert('El email es obligatorio')
  savingInvitar.value = true
  msgInvitar.value    = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const fnUrl = 'https://lsdmmnxkrrliutleyehp.supabase.co/functions/v1/invite-user'
    const fnRes = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        email: formInvitar.value.email,
        nombre: formInvitar.value.nombre,
        rol: formInvitar.value.rol,
        participe_ids: formInvitar.value.rol === 'participe' ? formInvitar.value.participe_ids : [],
        redirectTo: window.location.origin + '/callback.html'
      })
    })
    const res = await fnRes.json()
    if (!fnRes.ok || res.error) {
      msgInvitar.value = { ok: false, text: res.error || 'Error desconocido' }
    } else {
      // Actualizar perfil con rol y partícipes si el usuario ya fue creado
      const userId = res.user?.id || res.data?.user?.id
      if (userId) {
        await supabase.from('perfiles').upsert({
          id: userId,
          email: formInvitar.value.email,
          nombre: formInvitar.value.nombre,
          rol: formInvitar.value.rol,
          participe_ids: formInvitar.value.rol === 'participe' ? formInvitar.value.participe_ids : [],
          activo: true
        })
      }
      msgInvitar.value = { ok: true, text: `Invitación enviada a ${formInvitar.value.email}.` }
      formInvitar.value = { email: '', nombre: '', rol: 'interno', participe_ids: [] }
      await cargar()
    }
  } catch (e) {
    msgInvitar.value = { ok: false, text: e.message }
  } finally {
    savingInvitar.value = false
  }
}

</script>
