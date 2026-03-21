<template>
  <div class="login-shell">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <img src="/src/logo.png" alt="Promocima" class="login-logo-img" />
        <div class="login-brand">PROMOCIMA</div>
        <div class="login-sub">{{ isInvite ? 'Activación de cuenta' : isRecovery ? 'Restablecer contraseña' : 'Capital Privado · Gestión Interna' }}</div>
      </div>

      <!-- Formulario activación cuenta (invitación) o recuperación -->
      <div v-if="isInvite || isRecovery" class="login-form">
        <div style="font-size:13px;color:var(--text3);margin-bottom:8px;text-align:center;">
          {{ isRecovery ? 'Introduce tu nueva contraseña' : 'Establezca su contraseña para activar su cuenta' }}
        </div>
        <div class="form-group">
          <label class="form-label">Nueva contraseña</label>
          <div style="position:relative">
            <input
              class="form-control"
              :type="showPass ? 'text' : 'password'"
              v-model="newPassword"
              placeholder="Mínimo 6 caracteres"
              @keydown.enter="handleSetPassword"
              style="padding-right:38px"
            />
            <button type="button" @click="showPass=!showPass"
              style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px">
              <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <div style="position:relative">
            <input
              class="form-control"
              :type="showPass ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="Repita la contraseña"
              @keydown.enter="handleSetPassword"
              style="padding-right:38px"
            />
          </div>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>
        <div v-if="success" class="login-success">{{ success }}</div>

        <button
          class="btn btn-primary login-btn"
          :disabled="settingPassword || !newPassword || !confirmPassword"
          @click="handleSetPassword"
        >
          <span v-if="settingPassword" class="btn-spinner"></span>
          {{ settingPassword ? 'Activando…' : 'Activar cuenta' }}
        </button>
      </div>

      <!-- Formulario login normal -->
      <div v-else class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            class="form-control"
            type="email"
            v-model="email"
            placeholder="usuario@promocima.com"
            autocomplete="username"
            @keydown.enter="handleLogin"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <div style="position:relative">
            <input
              class="form-control"
              :type="showPass ? 'text' : 'password'"
              v-model="password"
              placeholder="••••••••"
              autocomplete="current-password"
              @keydown.enter="handleLogin"
              style="padding-right:38px"
            />
            <button type="button" @click="showPass=!showPass"
              style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px">
              <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-top:-4px">
          <input id="recordar" type="checkbox" v-model="recordar" style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer" />
          <label for="recordar" style="font-size:12px;color:var(--text3);cursor:pointer">Recordar sesión</label>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button
          class="btn btn-primary login-btn"
          :disabled="loading || !email || !password"
          @click="handleLogin"
        >
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>

        <div style="text-align:center;margin-top:12px">
          <button class="btn btn-ghost btn-sm" style="font-size:12px;color:var(--text3)" @click="mostrarRecuperar = true">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      <div class="login-footer">
        Sistema de gestión interno · Solo acceso autorizado
      </div>
    </div>

    <!-- Modal recuperar contraseña -->
    <div v-if="mostrarRecuperar" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000">
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:28px;width:360px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.6)">
        <div style="font-size:16px;font-weight:700;margin-bottom:6px">Recuperar contraseña</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:16px">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">Email</label>
          <input class="form-control" type="email" v-model="emailRecuperar" placeholder="usuario@promocima.com" @keydown.enter="enviarRecuperar" />
        </div>
        <div v-if="msgRecuperar" :class="msgRecuperar.ok ? 'login-success' : 'login-error'" style="margin-bottom:10px">
          {{ msgRecuperar.text }}
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-sm" @click="mostrarRecuperar = false; msgRecuperar = null">Cancelar</button>
          <button class="btn btn-sm btn-primary" :disabled="loadingRecuperar || !emailRecuperar" @click="enviarRecuperar">
            <span v-if="loadingRecuperar" class="btn-spinner"></span>
            {{ loadingRecuperar ? 'Enviando…' : 'Enviar enlace' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../supabase.js'

const { login, authError, loading, isRecoveryMode } = useAuth()

const email           = ref('')
const password        = ref('')
const showPass        = ref(false)
const recordar        = ref(false)
const newPassword     = ref('')
const confirmPassword = ref('')
const error           = ref(null)
const success         = ref(null)
const settingPassword = ref(false)
const isInvite        = ref(false)
const isRecovery      = ref(false)

onMounted(async () => {
  // Detectar error de enlace expirado
  const authError = sessionStorage.getItem('supabase_auth_error')
  if (authError) {
    error.value = authError
    sessionStorage.removeItem('supabase_auth_error')
    return
  }

  const authType  = sessionStorage.getItem('supabase_auth_type')
  const tokenHash = sessionStorage.getItem('supabase_token_hash')
  const authHash  = sessionStorage.getItem('supabase_auth_hash')

  if (!authType) return

  // Limpiar sessionStorage
  sessionStorage.removeItem('supabase_auth_type')
  sessionStorage.removeItem('supabase_token_hash')
  sessionStorage.removeItem('supabase_auth_hash')

  const isInviteFlow = authType === 'invite'
  if (isInviteFlow) isInvite.value = true
  else isRecovery.value = true

  if (tokenHash) {
    // Flujo PKCE con token_hash (invite o recovery)
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: isInviteFlow ? 'invite' : 'recovery'
    })
    if (verifyErr) {
      error.value = 'El enlace no es válido o ha expirado. Solicita uno nuevo.'
      isInvite.value = false
      isRecovery.value = false
      isRecoveryMode.value = false
    }
  } else if (authHash) {
    // Flujo implícito con access_token en hash
    const params = new URLSearchParams(authHash.replace(/^[#?]/, ''))
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (accessToken && refreshToken) {
      const { error: setErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      if (setErr) {
        error.value = 'El enlace no es válido o ha expirado. Solicita uno nuevo.'
        isInvite.value = false
        isRecovery.value = false
      }
    } else {
      error.value = 'El enlace no es válido o ha expirado.'
      isInvite.value = false
      isRecovery.value = false
    }
  }
})

async function handleSetPassword() {
  error.value = null
  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  settingPassword.value = true
  try {
    // Esperar a que la sesión esté disponible (flujo PKCE puede tardar)
    let { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      // Esperar hasta 3 segundos
      await new Promise(resolve => setTimeout(resolve, 2000))
      const { data: { session: retrySession } } = await supabase.auth.getSession()
      currentSession = retrySession
    }
    if (!currentSession) {
      error.value = 'La sesión ha expirado. Por favor solicita un nuevo enlace.'
      return
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.value })
    if (updateErr) {
      error.value = updateErr.message
    } else {
      success.value = 'Contraseña establecida correctamente. Redirigiendo…'
      isRecoveryMode.value = false
      window.history.replaceState(null, '', window.location.pathname)
      setTimeout(() => { window.location.reload() }, 1500)
    }
  } finally {
    settingPassword.value = false
  }
}

// ── Recuperar contraseña ──────────────────────────────────────────────────────
const mostrarRecuperar  = ref(false)
const emailRecuperar    = ref('')
const msgRecuperar      = ref(null)
const loadingRecuperar  = ref(false)

async function enviarRecuperar() {
  if (!emailRecuperar.value) return
  loadingRecuperar.value = true
  msgRecuperar.value = null
  try {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'solicitar', email: emailRecuperar.value })
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      msgRecuperar.value = { ok: false, text: data.error || 'Error al enviar el email' }
    } else {
      msgRecuperar.value = { ok: true, text: 'Email enviado. Revisa tu bandeja de entrada.' }
      emailRecuperar.value = ''
    }
  } catch (e) {
    msgRecuperar.value = { ok: false, text: 'Error de conexión' }
  } finally {
    loadingRecuperar.value = false
  }
}

async function handleLogin() {
  if (!email.value || !password.value) return
  error.value = null
  const ok = await login(email.value, password.value, recordar.value)
  if (!ok) {
    error.value = authError.value || 'Email o contraseña incorrectos'
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg1);
}
.login-card {
  width: 380px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 32px 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.login-logo {
  text-align: center;
  margin-bottom: 28px;
}
.login-logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 10px;
}
.login-brand {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
  text-transform: uppercase;
}
.login-sub {
  font-size: 11px;
  color: var(--text3);
  margin-top: 4px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}
.login-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: 14px;
  margin-top: 4px;
}
.login-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--green);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
}

.login-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
}
.login-footer {
  text-align: center;
  font-size: 11px;
  color: var(--text3);
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.login-success {
  background: rgba(45,106,79,0.15);
  border: 1px solid rgba(45,106,79,0.4);
  color: #7ec8a0;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
}
</style>
