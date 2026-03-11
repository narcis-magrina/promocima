/**
 * useRouter — Hash-based router sin vue-router.
 *
 * URL format:  /#/{page}/{id?}
 * Examples:
 *   /#/dashboard
 *   /#/prestamos
 *   /#/prestamos/P001
 *   /#/contratos-ccp/CCP001
 *
 * API:
 *   router.page     — computed string  (current page)
 *   router.id       — computed string  (current id or null)
 *   router.navigate(page, id?) — change hash
 *   router.back()   — window.history.back()
 */

import { ref, computed, onMounted } from 'vue'

// ── Singleton state (shared across all useRouter() calls) ────────────────────
const rawHash = ref(window.location.hash || '#/dashboard')

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '') || 'dashboard'
  const parts = clean.split('/')
  return { page: parts[0] || 'dashboard', id: parts[1] || null }
}

function onHashChange() {
  rawHash.value = window.location.hash || '#/dashboard'
}

// ── Listener global (una sola vez, nunca se elimina) ────────────────────────
// Usar un listener global evita el problema de que onUnmounted de un componente
// hijo desregistre el evento y deje de actualizarse el router (causa "todo a 0").
let _listenerRegistered = false
function ensureListener() {
  if (_listenerRegistered) return
  _listenerRegistered = true
  window.addEventListener('hashchange', onHashChange)
  // También escuchar popstate para mayor compatibilidad con el historial
  window.addEventListener('popstate', onHashChange)
}
// Registrar inmediatamente al importar el módulo
ensureListener()

// ── Composable ───────────────────────────────────────────────────────────────
export function useRouter() {
  const parsed = computed(() => parseHash(rawHash.value))
  const page   = computed(() => parsed.value.page)
  const id     = computed(() => parsed.value.id)

  function navigate(newPage, newId = null) {
    const hash = newId ? `#/${newPage}/${newId}` : `#/${newPage}`
    window.location.hash = hash
  }

  function back() {
    window.history.back()
  }

  // Sync on mount por si el hash cambió antes de montar
  onMounted(() => {
    rawHash.value = window.location.hash || '#/dashboard'
  })

  // NO llamamos onUnmounted para no desregistrar el listener global

  return { page, id, navigate, back }
}
