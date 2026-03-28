/**
 * useAuth — Supabase Auth + gestión de roles + multi-empresa.
 * Los accesos empresa/partícipes se gestionan en perfiles_empresas.
 */

import { ref, computed } from 'vue'
import { supabase, empresaActivaHeader } from '../supabase.js'

// ── Singleton state ──────────────────────────────────────────────────────────
const session        = ref(null)
const perfil         = ref(null)
const accesos        = ref([])    // rows de perfiles_empresas [{empresa_id, participe_ids, orden}]
const loading        = ref(true)
const authError      = ref(null)
const isRecoveryMode = ref(false)
const empresaActiva  = ref(null)
const empresaKey     = ref(0)

// ── Init ─────────────────────────────────────────────────────────────────────
export async function initAuth() {
  loading.value = true
  try {
    const { data: { session: s } } = await supabase.auth.getSession()
    session.value = s
    if (s) await cargarPerfil(s.user.id)
  } finally {
    loading.value = false
  }

  supabase.auth.onAuthStateChange(async (event, s) => {
    if (event === 'TOKEN_REFRESHED') {
      session.value = s
      return
    }
    if (event === 'SIGNED_OUT') {
      session.value        = null
      perfil.value         = null
      accesos.value        = []
      empresaActiva.value  = null
      empresaActivaHeader.value = null
      isRecoveryMode.value = false
      return
    }
    const isInviteSession = sessionStorage.getItem('supabase_auth_type') === 'invite'
    if (event === 'SIGNED_IN' && isInviteSession) {
      sessionStorage.removeItem('supabase_auth_type')
      session.value = s
      return
    }
    if (event === 'PASSWORD_RECOVERY') {
      session.value = s
      isRecoveryMode.value = true
      sessionStorage.setItem('supabase_auth_type', 'recovery')
      return
    }
    session.value = s
    if (s && !perfil.value) {
      loading.value = true
      await cargarPerfil(s.user.id)
      loading.value = false
    }
  })
}

async function cargarPerfil(userId) {
  const [{ data: perfilData }, { data: accesosData }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', userId).single(),
    supabase.from('perfiles_empresas')
      .select('empresa_id, participe_ids, orden')
      .eq('perfil_id', userId)
      .order('orden', { ascending: true })
  ])

  if (!perfilData) {
    perfil.value  = null
    accesos.value = []
    return
  }

  perfil.value  = perfilData
  accesos.value = accesosData || []

  // Empresa principal = la de menor orden
  const principal = accesos.value[0]?.empresa_id || null
  empresaActiva.value       = principal
  empresaActivaHeader.value = principal
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

  const isAdmin     = computed(() => rol.value === 'admin')
  const isInterno   = computed(() => rol.value === 'admin' || rol.value === 'interno' || rol.value === 'dirección')
  const isDireccion = computed(() => rol.value === 'admin' || rol.value === 'dirección')
  const isParticipe = computed(() => rol.value === 'participe')

  const empresaId = empresaActiva

  const empresaIds = computed(() => accesos.value.map(a => a.empresa_id))
  const tieneMultiEmpresa = computed(() => empresaIds.value.length > 1)

  const participeIds = computed(() => {
    const acceso = accesos.value.find(a => a.empresa_id === empresaActiva.value)
    return acceso?.participe_ids || []
  })
  const participeId = computed(() => participeIds.value[0] || null)

  function cambiarEmpresa(id) {
    if (empresaIds.value.includes(id)) {
      empresaActiva.value       = id
      empresaActivaHeader.value = id
      empresaKey.value++
    }
  }

  async function login(email, password, recordar = false) {
    authError.value = null
    loading.value   = true
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email, password, options: { persistSession: recordar }
      })
      if (error) {
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
    session.value             = null
    perfil.value              = null
    accesos.value             = []
    empresaActiva.value       = null
    empresaActivaHeader.value = null
    window.location.href      = '/'
  }

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
    session, perfil, accesos, loading, authError,
    user, rol, nombre, initiales,
    isAdmin, isInterno, isDireccion, isParticipe, participeId, participeIds,
    empresaId, empresaIds, tieneMultiEmpresa, cambiarEmpresa, empresaKey,
    login, logout, guardarPerfil, listarUsuarios,
    isRecoveryMode,
  }
}
