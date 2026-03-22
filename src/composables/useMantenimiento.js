import { ref } from 'vue'
import { supabase } from '../supabase.js'

// Singleton — compartido entre App.vue y Configuracion.vue
const mantenimiento = ref(false)

export function useMantenimiento() {
  async function cargarMantenimiento() {
    const { data } = await supabase.from('config').select('mantenimiento').limit(1).single()
    if (data) mantenimiento.value = data.mantenimiento || false
  }

  function setMantenimiento(val) {
    mantenimiento.value = val
  }

  return { mantenimiento, cargarMantenimiento, setMantenimiento }
}
