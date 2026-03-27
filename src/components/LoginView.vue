<template>
  <div class="login-shell">
    <div class="login-card" style="background:#e5e7eb;">
      <div class="local-notice">⚠️ Entorno local · Solo desarrollo</div>
      <div class="login-logo">
        <div class="login-brand">
          <span style="color:#002147;">PROMO</span><span style="color:#D2B48C;">CIMA</span>
        </div>
        <div class="login-sub">Capital Privado · Gestión Interna</div>
      </div>

      <div class="login-form">
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
              <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
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
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { supabase } from '../supabase.js'

const { login, authError, loading } = useAuth()

const email    = ref('')
const password = ref('')
const showPass = ref(false)
const recordar = ref(false)
const error    = ref(null)

async function handleLogin() {
  if (!email.value || !password.value) return
  error.value = null
  const ok = await login(email.value, password.value, recordar.value)
  if (!ok) {
    error.value = authError.value || 'Email o contraseña incorrectos'
  }
}

const mostrarRecuperar = ref(false)
const emailRecuperar   = ref('')
const msgRecuperar     = ref(null)
const loadingRecuperar = ref(false)

async function enviarRecuperar() {
  if (!emailRecuperar.value) return
  loadingRecuperar.value = true
  msgRecuperar.value = null
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(emailRecuperar.value, {
      redirectTo: `${window.location.origin}/reset-password.html`
    })
    if (err) throw err
    msgRecuperar.value = { ok: true, text: 'Email enviado. Revisa tu bandeja de entrada.' }
    emailRecuperar.value = ''
  } catch (e) {
    msgRecuperar.value = { ok: false, text: 'Error de conexión' }
  } finally {
    loadingRecuperar.value = false
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
.local-notice {
  background: #e5e7eb;
  border: 1px dashed #9ca3af;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 16px;
}
.login-card {
  width: 380px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 32px 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.login-logo { text-align: center; margin-bottom: 28px; }
.login-brand {
  font-family: Impact, 'Barlow Condensed', sans-serif;
  font-size: 28px;
  letter-spacing: 2px;
}
.login-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }
.login-form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.login-btn { width: 100%; justify-content: center; padding: 10px; font-size: 14px; margin-top: 4px; }
.login-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
}
.login-success {
  background: rgba(45,106,79,0.15);
  border: 1px solid rgba(45,106,79,0.4);
  color: #7ec8a0;
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
</style>
