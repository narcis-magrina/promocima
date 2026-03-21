/**
 * useAuth — Supabase Auth + gestión de roles.
 *
 * Roles:
 *   admin      → acceso total + gestión de usuarios/configuración
 *   interno    → acceso total funcional, sin gestión de usuarios
 *   participe  → solo dashboard propio + contratos CCP + pagos propios
 *
 * La tabla `perfiles` en Supabase:
 *   id          uuid  (FK → auth.users.id)
 *   email       text
 *   nombre      text
 *   rol         text  ('admin' | 'interno' | 'participe')
 *   participe_ids text[]  (solo para rol 'participe', FK → participes.id)
 *   activo      bool
 *
 * SQL para crear la tabla (ejecutar en Supabase SQL Editor):
 * ─────────────────────────────────────────────────────────
 * create table public.perfiles (
 *   id           uuid primary key references auth.users(id) on delete cascade,
 *   email        text not null,
 *   nombre       text not null default '',
 *   rol          text not null default 'interno' check (rol in ('admin','interno','participe')),
 *   participe_ids text[] default '{}',
 *   activo       boolean not null default true,
 *   created_at   timestamptz default now()
 * );
 * alter table public.perfiles enable row level security;
 * create policy "Usuarios ven su propio perfil"
 *   on public.perfiles for select using (auth.uid() = id);
 * create policy "Admins ven todos los perfiles"
 *   on public.perfiles for all using (
 *     exists (select 1 from public.perfiles p where p.id = auth.uid() and p.rol = 'admin')
 *   );
 */

import { ref, computed } from 'vue'
import { supabase } from '../supabase.js'

// ── Singleton state ──────────────────────────────────────────────────────────
const session  = ref(null)   // Supabase session
const perfil   = ref(null)   // Row from `perfiles` table
const loading  = ref(true)   // true while initial session check is running
const authError = ref(null)
const isRecoveryMode = ref(false)

// ── Init: called once from main.js / App.vue ─────────────────────────────────
export async function initAuth() {
  loading.value = true
  try {
    const { data: { session: s } } = await supabase.auth.getSession()
    session.value = s
    if (s) await cargarPerfil(s.user.id)
  } finally {
    loading.value = false
  }

  // Escuchar cambios de auth:
  // - TOKEN_REFRESHED: actualizar session sin tocar perfil (ya está cargado)
  // - SIGNED_IN: cargar perfil si no está
  // - SIGNED_OUT: solo limpiar si realmente no hay sesión en localStorage
  supabase.auth.onAuthStateChange(async (event, s) => {
    if (event === 'TOKEN_REFRESHED') {
      session.value = s
      return
    }
    if (event === 'SIGNED_OUT') {
      session.value = null
      perfil.value  = null
      isRecoveryMode.value = false
      return
    }
    // Si es una invitación pendiente (no ha establecido contraseña aún),
    // guardamos la sesión pero NO cargamos perfil ni redirigimos.
    // LoginView detectará el sessionStorage y mostrará el formulario de contraseña.
    if (event === 'SIGNED_IN' && sessionStorage.getItem('supabase_auth_type') === 'invite') {
      session.value = s
      return
    }
    // Durante recovery: activar modo recovery para que App.vue muestre LoginView
    if (event === 'PASSWORD_RECOVERY') {
      session.value = s
      isRecoveryMode.value = true
      sessionStorage.setItem('supabase_auth_type', 'recovery')
      return
    }
    // SIGNED_IN, USER_UPDATED y otros eventos normales
    session.value = s
    if (s && !perfil.value) {
      loading.value = true
      await cargarPerfil(s.user.id)
      loading.value = false
    }
  })
}

async function cargarPerfil(userId) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    perfil.value = null
  } else {
    perfil.value = data
  }
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useAuth() {
  const user      = computed(() => session.value?.user || null)
  const rol       = computed(() => perfil.value?.rol || null)
  const nombre    = computed(() => perfil.value?.nombre || user.value?.email || '')
  const initiales = computed(() => {
    const n = nombre.value
    if (!n) return '?'
    const parts = n.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase()
  })

  const isAdmin    = computed(() => rol.value === 'admin')
  const isInterno  = computed(() => rol.value === 'admin' || rol.value === 'interno')
  const isParticipe  = computed(() => rol.value === 'participe')
  const participeIds = computed(() => perfil.value?.participe_ids || [])
  const participeId  = computed(() => participeIds.value[0] || null)  // primer partícipe (compatibilidad)
  const empresaId    = computed(() => perfil.value?.empresa_id || null)

  async function login(email, password, recordar = false) {
    authError.value = null
    loading.value = true
    try {
      // Limpiar storage de Supabase por si quedó basura de un flujo de invitación
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { persistSession: recordar }
      })
      if (error) {
        // Traducir mensajes técnicos a mensajes comprensibles
        if (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
          authError.value = 'Email o contraseña incorrectos'
        } else if (error.message.includes('Email not confirmed')) {
          authError.value = 'El email no ha sido confirmado. Revisa tu bandeja de entrada.'
        } else {
          authError.value = error.message
        }
      }
      return !error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
    perfil.value  = null
  }

  // Admin: create/update user profile
  async function guardarPerfil(data) {
    const { error } = await supabase.from('perfiles').upsert(data)
    if (error) throw error
  }

  async function listarUsuarios() {
    const { data, error } = await supabase.from('perfiles').select('*').order('nombre')
    if (error) throw error
    return data || []
  }

  return {
    // State
    session, perfil, loading, authError,
    // Derived
    user, rol, nombre, initiales,
    isAdmin, isInterno, isParticipe, participeId, participeIds, empresaId,
    // Actions
    login, logout, guardarPerfil, listarUsuarios,
    isRecoveryMode,
  }
}
