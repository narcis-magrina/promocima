<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Gestión de Usuarios</div>
        <div class="section-sub">Accesos y perfiles del sistema</div>
      </div>
      <button class="btn btn-primary" @click="abrirInvitar">+ Invitar Usuario</button>
    </div>

    <!-- Un bloque por empresa -->
    <template v-for="emp in empresas" :key="emp.id">
      <div v-if="usuariosPorEmpresa(emp.id).length" class="table-card" style="margin-bottom:20px">
        <div class="table-header" style="display:flex;align-items:center;justify-content:space-between">
          <h3>🏢 {{ emp.nombre }} <span style="font-size:12px;font-weight:400;color:var(--text3)">({{ usuariosPorEmpresa(emp.id).length }} usuario{{ usuariosPorEmpresa(emp.id).length !== 1 ? 's' : '' }})</span></h3>
          <span class="badge" :class="emp.activa ? 'badge-outline-green' : 'badge-outline-gray'" style="font-size:10px">{{ emp.activa ? 'Activa' : 'Inactiva' }}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th class="col-hide-mobile">Rol</th>
              <th class="col-hide-mobile">Partícipe vinculado</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuariosPorEmpresa(emp.id)" :key="u.id">
              <td style="font-weight:500">{{ u.nombre || '—' }}</td>
              <td style="font-size:12px;color:var(--text3)">{{ u.email }}</td>
              <td class="col-hide-mobile"><span class="badge" :class="rolBadge(u.rol)">{{ u.rol }}</span></td>
              <td style="font-size:12px;max-width:160px" class="col-hide-mobile">
                <template v-if="u.rol === 'participe' && u.participe_ids?.length">
                  <div style="display:flex;flex-direction:column;gap:3px">
                    <span v-for="pid in u.participe_ids" :key="pid" class="badge badge-outline-yellow" style="font-size:10px;width:fit-content">{{ nombreParticipe(pid) }}</span>
                  </div>
                </template>
                <span v-else-if="u.rol === 'participe'" style="color:var(--text3)">Sin vincular</span>
                <span v-else>—</span>
              </td>
              <td><span class="badge" :class="u.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ u.activo ? 'Activo' : 'Pendiente' }}</span></td>
              <td style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px" @click="editar(u)">✎ Editar</button>
                <button v-if="isAdmin && !u.activo" class="btn btn-sm" style="font-size:11px;padding:3px 9px;background:var(--orange);color:#fff;border-color:var(--orange)"
                  title="Reinvitar: envía una nueva invitación con nuevas credenciales"
                  @click="reinvitar(u)">↺ Reinvitar</button>
                <button v-if="isAdmin" class="btn btn-sm btn-danger" style="font-size:11px;padding:3px 9px"
                  :disabled="u.id === usuarioActualId"
                  :title="u.id === usuarioActualId ? 'No puedes desactivarte a ti mismo' : u.activo ? 'Desactivar usuario' : 'Reactivar usuario'"
                  @click="confirmarEliminar(u)">{{ u.activo ? '✕ Desactivar' : '✓ Activar' }}</button>
                <button v-if="isAdmin" class="btn btn-sm btn-danger-solid" style="font-size:11px;padding:3px 9px"
                  :disabled="u.id === usuarioActualId"
                  :title="u.id === usuarioActualId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario definitivamente'"
                  @click="eliminarUsuario(u)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <!-- Usuarios sin empresa asignada -->
    <div v-if="usuariosSinEmpresa.length" class="table-card" style="margin-bottom:20px">
      <div class="table-header"><h3>⚠️ Sin empresa asignada ({{ usuariosSinEmpresa.length }})</h3></div>
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in usuariosSinEmpresa" :key="u.id">
            <td>{{ u.nombre || '—' }}</td>
            <td style="font-size:12px;color:var(--text3)">{{ u.email }}</td>
            <td><span class="badge" :class="rolBadge(u.rol)">{{ u.rol }}</span></td>
            <td><button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px" @click="editar(u)">✎ Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

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
              <input class="form-control" v-focus v-model="form.nombre" placeholder="Nombre y apellidos">
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
                <label v-for="p in participesPorEmpresa(form.empresa_id)" :key="p.id"
                  style="display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer;font-size:13px">
                  <input type="checkbox" :value="p.id" v-model="form.participe_ids">
                  <span>{{ p.nombre }}</span>
                  <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">{{ p.id }}</span>
                </label>
                <div v-if="!participesPorEmpresa(form.empresa_id).length" style="font-size:12px;color:var(--text3);padding:4px 0">Sin partícipes en esta empresa</div>
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
          <div v-if="msgEditar" class="alert" :class="msgEditar.ok ? 'alert-success' : 'alert-danger'" style="margin-top:12px;font-size:12px">
            {{ msgEditar.text }}
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

    <!-- Modal invitar -->
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
              <input class="form-control" v-focus type="email" v-model="formInvitar.email" placeholder="usuario@ejemplo.com">
            </div>
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" v-model="formInvitar.nombre" placeholder="Nombre y apellidos">
            </div>
            <div class="form-group">
              <label class="form-label">Empresa</label>
              <select class="form-control" v-model="formInvitar.empresa_id">
                <option value="">-- Selecciona empresa --</option>
                <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
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
                <div v-if="!participesPorEmpresa(form.empresa_id).length" style="font-size:12px;color:var(--text3);padding:4px 0">Sin partícipes en esta empresa</div>
              </div>
            </div>
          </div>
          <!-- Mensaje normal -->
          <div v-if="msgInvitar && !msgInvitar.sql" class="alert" :class="msgInvitar.ok ? 'alert-success' : 'alert-danger'" style="margin-top:12px;font-size:12px">
            {{ msgInvitar.text }}
          </div>

          <!-- Instrucciones entorno local -->
          <div v-if="msgInvitar && msgInvitar.sql" style="margin-top:16px;border:1px solid var(--orange);border-radius:8px;overflow:hidden;font-size:13px">
            <div style="background:var(--orange);color:#fff;padding:10px 14px;font-weight:600">
              ⚠️ Entorno local — crea el usuario manualmente
            </div>
            <div style="padding:14px;display:flex;flex-direction:column;gap:14px">

              <div>
                <div style="font-weight:600;margin-bottom:8px">1. En Supabase → Authentication → Users → Add user</div>
                <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;font-size:12px">
                  <span style="color:var(--text3)">Email</span>
                  <code style="background:var(--bg2);padding:2px 6px;border-radius:4px">{{ msgInvitar.email }}</code>
                  <span style="color:var(--text3)">Password</span>
                  <code style="background:var(--bg2);padding:2px 6px;border-radius:4px">{{ msgInvitar.pass }}</code>
                </div>
                <div style="margin-top:8px;font-size:12px;color:var(--text3)">✓ Marca <strong style="color:var(--text2)">Auto Confirm User</strong></div>
              </div>

              <div>
                <div style="font-weight:600;margin-bottom:8px">2. Copia el UUID del usuario y ejecuta en el SQL Editor</div>
                <pre style="background:var(--bg2);padding:12px;border-radius:6px;font-size:11px;overflow-x:auto;white-space:pre-wrap;margin:0;line-height:1.6">{{ msgInvitar.sql }}</pre>
              </div>

            </div>
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
import { validarCampos, traducirErrorSupabase } from '../utils/validar.js'
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../supabase.js'

const { listarUsuarios, user, isAdmin , empresaId } = useAuth()

const usuarios          = ref([])
const todosParticipes   = ref([])
const empresas          = ref([])

// Partícipes filtrados por la empresa del usuario que se está editando/invitando
const participesPorEmpresa = (empresaId) =>
  todosParticipes.value.filter(p => p.empresa_id === empresaId)
const modalAbierto = ref(false)
const saving       = ref(false)
const msgEditar    = ref(null)
const form         = ref(formVacio())

function formVacio() {
  return { id: null, email: '', nombre: '', rol: 'interno', participe_ids: [], activo: true, empresa_id: '' }
}

onMounted(cargar)

async function cargar() {
  try { usuarios.value = await listarUsuarios() } catch { usuarios.value = [] }
  const [{ data: pts }, { data: emps }] = await Promise.all([
    supabase.from('participes').select('id, nombre, empresa_id').eq('activo', true).order('nombre'),
    supabase.from('empresas').select('id, nombre, activa').eq('activa', true).order('id'),
  ])
  todosParticipes.value = pts || []
  empresas.value        = emps || []
}

function nombreParticipe(id) {
  return todosParticipes.value.find(p => p.id === id)?.nombre || id
}

function editar(u) {
  form.value = { ...u, participe_ids: [...(u.participe_ids || [])] }
  msgEditar.value = null
  modalAbierto.value = true
}

async function guardar() {
  const errores = validarCampos(form.value, [
    { campo: 'nombre',     label: 'Nombre',   requerido: true },
    { campo: 'rol',        label: 'Rol',      requerido: true },
    { campo: 'empresa_id', label: 'Empresa',  requerido: true },
  ])
  if (errores.length) return (msgEditar.value = { ok: false, text: errores.join('\n') })
  if (!form.value.id) return
  saving.value = true
  msgEditar.value = null
  try {
    const ids = form.value.rol === 'participe'
      ? (form.value.participe_ids || []).map(String).filter(Boolean)
      : []
    const { error } = await supabase.from('perfiles').update({
      nombre:        form.value.nombre,
      rol:           form.value.rol,
      activo:        form.value.activo,
      participe_ids: ids,
      empresa_id:    form.value.empresa_id || empresaId.value,
    }).eq('id', form.value.id)
    if (error) throw error
    modalAbierto.value = false
    await cargar()
  } catch (e) {
    msgEditar.value = { ok: false, text: 'Error: ' + e.message }
  } finally {
    saving.value = false
  }
}

function rolBadge(rol) {
  return { admin: 'badge-outline-red', interno: 'badge-outline-blue', participe: 'badge-outline-yellow' }[rol] || 'badge-outline-gray'
}

const usuarioActualId = computed(() => user.value?.id)

const usuariosPorEmpresa = (empresaId) =>
  usuarios.value.filter(u => u.empresa_id === empresaId)

const usuariosSinEmpresa = computed(() =>
  usuarios.value.filter(u => !u.empresa_id)
)

async function confirmarEliminar(u) {
  const activar = !u.activo
  const msg = activar
    ? `¿Reactivar el usuario "${u.nombre || u.email}"?`
    : `¿Desactivar el usuario "${u.nombre || u.email}"?\nEl usuario perderá el acceso de forma inmediata.`
  if (!confirm(msg)) return
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ activo: activar })
      .eq('id', u.id)
    if (error) throw error
    await cargar()
  } catch (e) {
    alert(`Error al ${activar ? 'reactivar' : 'desactivar'}: ` + e.message)
  }
}

async function eliminarUsuario(u) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return alert('⚠️ Eliminar usuarios solo funciona en producción.')
  }
  if (!confirm(`¿Eliminar definitivamente a "${u.nombre || u.email}"?\nEsta acción no se puede deshacer.`)) return
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    await cargar()
  } catch (e) {
    alert('Error al eliminar: ' + e.message)
  }
}

async function reinvitar(u) {
  if (!confirm(`¿Reinvitar a "${u.nombre || u.email}"?\nSe enviará una nueva invitación con nuevas credenciales.`)) return
  // Abre el modal con el email precargado — la Edge Function gestiona el borrado del anterior
  formInvitar.value = { email: u.email, nombre: u.nombre || '', rol: u.rol || 'interno', participe_ids: u.participe_ids || [] }
  msgInvitar.value  = null
  modalInvitar.value = true
}

const modalInvitar  = ref(false)
const savingInvitar = ref(false)
const msgInvitar    = ref(null)
const formInvitar   = ref({ email: '', nombre: '', rol: 'interno', participe_ids: [], empresa_id: '' })

function abrirInvitar() {
  formInvitar.value  = { email: '', nombre: '', rol: 'interno', participe_ids: [], empresa_id: empresaId.value || '' }
  msgInvitar.value   = null
  modalInvitar.value = true
}

async function enviarInvitacion() {
  const erroresInv = validarCampos(formInvitar.value, [
    { campo: 'email',      label: 'Email',   requerido: true, tipo: 'email' },
    { campo: 'nombre',     label: 'Nombre',  requerido: true },
    { campo: 'empresa_id', label: 'Empresa', requerido: true },
    { campo: 'rol',        label: 'Rol',     requerido: true },
  ])
  if (erroresInv.length) return (msgInvitar.value = { ok: false, text: erroresInv.join('\n') })
  // En local no hay API routes — solo funciona en producción
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const f = formInvitar.value
    const pass = 'Temp' + Math.random().toString(36).slice(2, 8) + 'A1!'
    const sql = `INSERT INTO public.perfiles (id, email, nombre, rol, activo, created_at, participe_ids, empresa_id)
VALUES (
  'id_user',          -- ⚠ sustituir por el UUID de Supabase Auth
  'usuario@empresa.com',  -- ⚠ sustituir por el email real
  'Nombre del usuario',   -- ⚠ sustituir por el nombre real
  '${f.rol}',
  true,
  now(),
  '{}',
  '${f.empresa_id || empresaId.value}'  -- ⚠ verificar empresa
);`
    msgInvitar.value = { ok: false, sql, email: f.email, pass }
    return
  }
  savingInvitar.value = true
  msgInvitar.value    = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/invitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({
        email:        formInvitar.value.email,
        nombre:       formInvitar.value.nombre,
        rol:          formInvitar.value.rol,
        participe_ids: formInvitar.value.rol === 'participe' ? formInvitar.value.participe_ids : [],
        empresa_id:   formInvitar.value.empresa_id || empresaId.value,
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    msgInvitar.value = { ok: true, text: `Invitación enviada a ${formInvitar.value.email}.` }
    formInvitar.value = { email: '', nombre: '', rol: 'interno', participe_ids: [] }
    await cargar()
  } catch (e) {
    msgInvitar.value = { ok: false, text: e.message }
  } finally {
    savingInvitar.value = false
  }
}
</script>
