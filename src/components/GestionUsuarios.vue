<template>
  <div>
    <div class="section-header">
      <div>
        <div class="section-title">Gestión de Usuarios</div>
        <div class="section-sub">Accesos y perfiles del sistema</div>
      </div>
      <button class="btn btn-primary" @click="abrirInvitar">+ Invitar Usuario</button>
    </div>

    <!-- Lista única de usuarios -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th class="col-hide-mobile">Rol</th>
            <th class="col-hide-mobile">Empresas</th>
            <th class="col-hide-mobile">Partícipe vinculado</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td style="font-weight:500">{{ u.nombre || '—' }}</td>
            <td style="font-size:12px;color:var(--text3)">{{ u.email }}</td>
            <td class="col-hide-mobile"><span class="badge" :class="rolBadge(u.rol)">{{ u.rol }}</span></td>
            <td class="col-hide-mobile" style="font-size:12px;max-width:180px">
              <div style="display:flex;flex-direction:column;gap:2px">
                <span v-for="(eid, idx) in empresasDe(u.id)"
                  :key="eid"
                  class="badge badge-outline-blue"
                  style="font-size:10px;width:fit-content">
                  <span v-if="idx === 0" style="color:var(--accent);margin-right:2px">★</span>
                  {{ empresas.find(e => e.id === eid)?.nombre || eid }}
                </span>
                <span v-if="!empresasDe(u.id).length" style="color:var(--text3)">Sin empresa</span>
              </div>
            </td>
            <td style="font-size:12px;max-width:200px" class="col-hide-mobile">
              <template v-if="u.rol === 'participe'">
                <div v-for="acceso in accesosDe(u.id)" :key="acceso.empresa_id" style="margin-bottom:4px">
                  <div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:2px">
                    {{ empresas.find(e => e.id === acceso.empresa_id)?.nombre || acceso.empresa_id }}
                  </div>
                  <div v-if="acceso.participe_ids?.length" style="display:flex;flex-direction:column;gap:2px;padding-left:8px">
                    <span v-for="pid in acceso.participe_ids" :key="pid"
                      class="badge badge-outline-yellow"
                      style="font-size:10px;width:fit-content">
                      {{ nombreParticipe(pid) }}
                    </span>
                  </div>
                  <span v-else style="padding-left:8px;color:var(--text3)">Sin vincular</span>
                </div>
                <span v-if="!accesosDe(u.id).length" style="color:var(--text3)">Sin vincular</span>
              </template>
              <span v-else>—</span>
            </td>
            <td><span class="badge" :class="u.activo ? 'badge-outline-green' : 'badge-outline-gray'">{{ u.activo ? 'Activo' : 'Pendiente' }}</span></td>
            <td style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-registrar" style="font-size:11px;padding:3px 9px" @click="editar(u)">✎ Editar</button>
              <button v-if="isAdmin && !u.activo" class="btn btn-sm" style="font-size:11px;padding:3px 9px;background:var(--orange);color:#fff;border-color:var(--orange)"
                title="Reinvitar: envía una nueva invitación con nuevas credenciales"
                @click="reinvitar(u)">↺ Reinvitar</button>
              <button v-if="isAdmin" class="btn btn-sm btn-danger-solid" style="font-size:11px;padding:3px 9px"
                :disabled="u.id === usuarioActualId"
                :title="u.id === usuarioActualId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario definitivamente'"
                @click="eliminarUsuario(u)">✕</button>
            </td>
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
            <div class="form-group">
              <label class="form-label">Empresas y accesos</label>
              <div style="display:flex;flex-direction:column;gap:8px">
                <div v-for="(acceso, idx) in form.accesos" :key="acceso.empresa_id"
                  style="border:1px solid var(--border);border-radius:6px;overflow:hidden">
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--bg3)">
                    <div style="display:flex;align-items:center;gap:6px">
                      <span style="font-size:10px;font-weight:700;" :style="idx === 0 ? 'color:var(--accent)' : 'color:var(--border2)'">★</span>
                      <span style="font-size:13px;font-weight:600;color:var(--text)">{{ empresas.find(e => e.id === acceso.empresa_id)?.nombre || acceso.empresa_id }}</span>
                    </div>
                    <div style="display:flex;gap:4px">
                      <button type="button" class="btn btn-sm" style="padding:2px 6px;font-size:11px" :disabled="idx === 0" @click="moverAcceso(idx, -1)">▲</button>
                      <button type="button" class="btn btn-sm" style="padding:2px 6px;font-size:11px" :disabled="idx === form.accesos.length - 1" @click="moverAcceso(idx, 1)">▼</button>
                      <button type="button" class="btn btn-sm btn-danger" style="padding:2px 6px;font-size:11px" @click="quitarAcceso(acceso.empresa_id)">✕</button>
                    </div>
                  </div>
                  <div v-if="form.rol === 'participe'" style="padding:8px;background:var(--bg2)">
                    <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Partícipes visibles:</div>
                    <div style="max-height:120px;overflow-y:auto">
                      <label v-for="p in participesPorEmpresa(acceso.empresa_id)" :key="p.id"
                        style="display:flex;align-items:center;gap:8px;padding:2px 0;cursor:pointer;font-size:12px">
                        <input type="checkbox" :value="p.id" v-model="acceso.participe_ids">
                        <span>{{ p.nombre }}</span>
                      </label>
                      <div v-if="!participesPorEmpresa(acceso.empresa_id).length" style="font-size:12px;color:var(--text3)">Sin partícipes en esta empresa</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="margin-top:6px">
                <select class="form-control" style="font-size:12px" @change="agregarAcceso($event.target.value); $event.target.value = ''">
                  <option value="">+ Añadir empresa...</option>
                  <option v-for="e in empresas.filter(e => !form.accesos.find(a => a.empresa_id === e.id))" :key="e.id" :value="e.id">{{ e.nombre }}</option>
                </select>
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:4px">La primera es la empresa principal (★)</div>
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
                <label v-for="p in participesPorEmpresa(formInvitar.empresa_id)" :key="p.id"
                  style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                  <input type="checkbox" :value="p.id" v-model="formInvitar.participe_ids">
                  {{ p.nombre }}
                </label>
                <div v-if="!participesPorEmpresa(formInvitar.empresa_id).length" style="font-size:12px;color:var(--text3);padding:4px 0">Sin partícipes en esta empresa</div>
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
import { validarCampos } from '../utils/validar.js'
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../supabase.js'

const { listarUsuarios, user, isAdmin, empresaId } = useAuth()

const usuarios        = ref([])
const todosParticipes = ref([])
const empresas        = ref([])
const accesosMap      = ref({})  // perfil_id -> [{empresa_id, participe_ids, orden}]

const participesPorEmpresa = (eid) =>
  todosParticipes.value.filter(p => p.empresa_id === eid)

const modalAbierto = ref(false)
const saving       = ref(false)
const msgEditar    = ref(null)
const form         = ref(formVacio())

function formVacio() {
  return { id: null, email: '', nombre: '', rol: 'interno', activo: true, accesos: [] }
  // accesos: [{empresa_id, participe_ids, orden}]
}

onMounted(cargar)

async function cargar() {
  try { usuarios.value = await listarUsuarios() } catch { usuarios.value = [] }

  // Cargar partícipes de todas las empresas via función SECURITY DEFINER (bypasa RLS)
  const { data: pts } = await supabase.rpc('get_all_participes')
  todosParticipes.value = pts || []

  const [{ data: emps }, { data: acc }] = await Promise.all([
    supabase.from('empresas').select('id, nombre, activa').eq('activa', true).order('id'),
    supabase.from('perfiles_empresas').select('perfil_id, empresa_id, participe_ids, orden').order('orden'),
  ])
  empresas.value = emps || []

  // Agrupar accesos por perfil
  const map = {}
  for (const a of (acc || [])) {
    if (!map[a.perfil_id]) map[a.perfil_id] = []
    map[a.perfil_id].push(a)
  }
  accesosMap.value = map
}

function nombreParticipe(id) {
  return todosParticipes.value.find(p => p.id === id)?.nombre || id
}

function accesosDe(userId) {
  return accesosMap.value[userId] || []
}

function empresasDe(userId) {
  return accesosDe(userId).map(a => a.empresa_id)
}

function moverAcceso(idx, dir) {
  const arr = [...form.value.accesos]
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= arr.length) return
  ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
  arr.forEach((a, i) => a.orden = i)
  form.value.accesos = arr
}

function agregarAcceso(empresaId) {
  if (!empresaId || form.value.accesos.find(a => a.empresa_id === empresaId)) return
  form.value.accesos = [...form.value.accesos, {
    empresa_id: empresaId,
    participe_ids: [],
    orden: form.value.accesos.length
  }]
}

function quitarAcceso(empresaId) {
  form.value.accesos = form.value.accesos
    .filter(a => a.empresa_id !== empresaId)
    .map((a, i) => ({ ...a, orden: i }))
}

function editar(u) {
  const accesos = accesosDe(u.id).map(a => ({ ...a, participe_ids: [...(a.participe_ids || [])] }))
  form.value = { id: u.id, email: u.email, nombre: u.nombre || '', rol: u.rol || 'interno', activo: u.activo, accesos }
  msgEditar.value = null
  modalAbierto.value = true
}

async function guardar() {
  const errores = validarCampos(form.value, [
    { campo: 'nombre', label: 'Nombre', requerido: true },
    { campo: 'rol',    label: 'Rol',    requerido: true },
  ])
  if (!form.value.accesos.length) errores.push('Debe tener al menos una empresa asignada')
  if (errores.length) return (msgEditar.value = { ok: false, text: errores.join('\n') })
  if (!form.value.id) return

  saving.value = true
  msgEditar.value = null
  try {
    // 1. Actualizar perfil
    const { error: perfilErr } = await supabase.from('perfiles').update({
      nombre: form.value.nombre,
      rol:    form.value.rol,
      activo: true,
    }).eq('id', form.value.id)
    if (perfilErr) throw perfilErr

    // 2. Reemplazar accesos: borrar los existentes e insertar los nuevos
    const { error: delErr } = await supabase
      .from('perfiles_empresas')
      .delete()
      .eq('perfil_id', form.value.id)
    if (delErr) throw delErr

    if (form.value.accesos.length) {
      const rows = form.value.accesos.map((a, i) => ({
        perfil_id:     form.value.id,
        empresa_id:    a.empresa_id,
        participe_ids: form.value.rol === 'participe' ? (a.participe_ids || []) : [],
        orden:         i,
      }))
      const { error: insErr } = await supabase.from('perfiles_empresas').insert(rows)
      if (insErr) throw insErr
    }

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
  if (!confirm(`¿Reinvitar a "${u.nombre || u.email}"?`)) return
  formInvitar.value = { email: u.email, nombre: u.nombre || '', rol: u.rol || 'interno', accesos: accesosDe(u.id).map(a => ({ ...a })) }
  msgInvitar.value  = null
  modalInvitar.value = true
}

const modalInvitar  = ref(false)
const savingInvitar = ref(false)
const msgInvitar    = ref(null)
const formInvitar   = ref({ email: '', nombre: '', rol: 'interno', accesos: [] })

function abrirInvitar() {
  formInvitar.value  = { email: '', nombre: '', rol: 'interno', accesos: empresaId.value ? [{ empresa_id: empresaId.value, participe_ids: [], orden: 0 }] : [] }
  msgInvitar.value   = null
  modalInvitar.value = true
}

function agregarAccesoInvitar(eid) {
  if (!eid || formInvitar.value.accesos.find(a => a.empresa_id === eid)) return
  formInvitar.value.accesos = [...formInvitar.value.accesos, { empresa_id: eid, participe_ids: [], orden: formInvitar.value.accesos.length }]
}

function quitarAccesoInvitar(eid) {
  formInvitar.value.accesos = formInvitar.value.accesos
    .filter(a => a.empresa_id !== eid)
    .map((a, i) => ({ ...a, orden: i }))
}

function moverAccesoInvitar(idx, dir) {
  const arr = [...formInvitar.value.accesos]
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= arr.length) return
  ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
  arr.forEach((a, i) => a.orden = i)
  formInvitar.value.accesos = arr
}

async function enviarInvitacion() {
  const erroresInv = validarCampos(formInvitar.value, [
    { campo: 'email',  label: 'Email',  requerido: true, tipo: 'email' },
    { campo: 'nombre', label: 'Nombre', requerido: true },
    { campo: 'rol',    label: 'Rol',    requerido: true },
  ])
  if (!formInvitar.value.accesos.length) erroresInv.push('Debe tener al menos una empresa asignada')
  if (erroresInv.length) return (msgInvitar.value = { ok: false, text: erroresInv.join('\n') })

  savingInvitar.value = true
  msgInvitar.value    = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const empresaPrincipal = formInvitar.value.accesos[0]?.empresa_id
    const res = await fetch('/api/invitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({
        email:   formInvitar.value.email,
        nombre:  formInvitar.value.nombre,
        rol:     formInvitar.value.rol,
        empresa_id: empresaPrincipal,
        accesos: formInvitar.value.accesos,
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    msgInvitar.value = { ok: true, text: `Invitación enviada a ${formInvitar.value.email}.` }
    formInvitar.value = { email: '', nombre: '', rol: 'interno', accesos: [] }
    await cargar()
  } catch (e) {
    msgInvitar.value = { ok: false, text: e.message }
  } finally {
    savingInvitar.value = false
  }
}
</script>
