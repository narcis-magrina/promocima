<template>
  <div class="login-shell">
    <div class="login-card">
      <div class="login-logo">
        <img src="/src/logo.png" alt="Promocima" class="login-logo-img" />
        <div class="login-brand">PROMOCIMA</div>
        <div class="login-sub">Activación de cuenta</div>
      </div>

      <div class="login-form">
        <div style="font-size:13px;color:var(--text3);margin-bottom:8px;text-align:center;">
          Bienvenido, {{ perfil?.nombre || perfil?.email }}.<br>
          Establece tu contraseña para activar tu cuenta.
        </div>

        <div class="form-group">
          <label class="form-label">Nueva contraseña</label>
          <input class="form-control" type="password" v-model="newPassword"
            placeholder="Mínimo 8 caracteres" @keydown.enter="activar" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <input class="form-control" type="password" v-model="confirmPassword"
            placeholder="Repite la contraseña" @keydown.enter="activar" />
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>
        <div v-if="success" class="login-success">{{ success }}</div>

        <button class="btn btn-primary login-btn" :disabled="saving" @click="activar">
          <span v-if="saving" class="btn-spinner"></span>
          {{ saving ? 'Activando…' : 'Activar cuenta' }}
        </button>

        <div style="text-align:center;margin-top:12px">
          <button class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--text3)" @click="$emit('logout')">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div class="login-footer">
        Sistema de gestión interno · Solo acceso autorizado
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase.js'

const props = defineProps({ perfil: Object })
const emit  = defineEmits(['activado', 'logout'])

const newPassword     = ref('')
const confirmPassword = ref('')
const saving          = ref(false)
const error           = ref(null)
const success         = ref(null)

async function activar() {
  error.value = null
  if (newPassword.value.length < 8) return error.value = 'La contraseña debe tener al menos 8 caracteres'
  if (newPassword.value !== confirmPassword.value) return error.value = 'Las contraseñas no coinciden'

  saving.value = true
  try {
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.value })
    if (updateErr) throw updateErr

    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('perfiles').update({ activo: true }).eq('id', session.user.id)

    success.value = 'Cuenta activada correctamente. Entrando…'
    setTimeout(() => emit('activado'), 1500)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.login-shell { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg1); }
.login-card { width:380px; background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:36px 32px 28px; box-shadow:0 8px 32px rgba(0,0,0,0.4); }
.login-logo { text-align:center; margin-bottom:28px; }
.login-logo-img { width:48px; height:48px; object-fit:contain; margin-bottom:10px; }
.login-brand { font-size:20px; font-weight:700; letter-spacing:0.1em; color:var(--accent); text-transform:uppercase; }
.login-sub { font-size:11px; color:var(--text3); margin-top:4px; }
.login-form { display:flex; flex-direction:column; gap:14px; margin-bottom:20px; }
.login-btn { width:100%; justify-content:center; padding:10px; font-size:14px; margin-top:4px; }
.login-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#f87171; border-radius:6px; padding:8px 12px; font-size:12px; }
.login-success { background:rgba(45,106,79,0.15); border:1px solid rgba(45,106,79,0.4); color:#7ec8a0; border-radius:6px; padding:8px 12px; font-size:12px; }
.login-footer { text-align:center; font-size:11px; color:var(--text3); border-top:1px solid var(--border); padding-top:16px; }
</style>
