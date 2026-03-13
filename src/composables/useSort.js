import { ref, computed } from 'vue'

export function useSort(items, defaultKey = null, defaultDir = 'asc', externalKey = null, externalDir = null) {
  const sortKey = externalKey || ref(defaultKey)
  const sortDir = externalDir || ref(defaultDir)

  function setSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const sorted = computed(() => {
    if (!sortKey.value) return items.value
    return [...items.value].sort((a, b) => {
      let va = a[sortKey.value]
      let vb = b[sortKey.value]
      // Null/undefined al final
      if (va == null) return 1
      if (vb == null) return -1
      // Numérico
      const na = Number(va), nb = Number(vb)
      if (!isNaN(na) && !isNaN(nb)) {
        return sortDir.value === 'asc' ? na - nb : nb - na
      }
      // Fecha ISO
      if (typeof va === 'string' && va.match(/^\d{4}-\d{2}-\d{2}/)) {
        return sortDir.value === 'asc'
          ? va.localeCompare(vb)
          : vb.localeCompare(va)
      }
      // Texto
      return sortDir.value === 'asc'
        ? String(va).localeCompare(String(vb), 'es')
        : String(vb).localeCompare(String(va), 'es')
    })
  })

  function thClass(key) {
    return sortKey.value === key ? `sorted-${sortDir.value}` : ''
  }

  function thIcon(key) {
    if (sortKey.value !== key) return '↕'
    return sortDir.value === 'asc' ? '↑' : '↓'
  }

  return { sortKey, sortDir, setSort, sorted, thClass, thIcon }
}
