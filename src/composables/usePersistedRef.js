import { ref, watch } from 'vue'

export function usePersistedRef(key, defaultValue) {
  const stored = sessionStorage.getItem(key)
  let initial = defaultValue
  if (stored !== null) {
    try {
      initial = JSON.parse(stored)
    } catch {
      initial = stored
    }
  }
  const r = ref(initial)
  watch(r, val => sessionStorage.setItem(key, JSON.stringify(val)))
  return r
}
