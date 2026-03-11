import { ref, onMounted, watch } from 'vue'
import { supabase } from '../supabase.js'

/**
 * useCrud — composable genérico para operaciones CRUD sobre una tabla de Supabase.
 *
 * @param {string}   tabla        Nombre de la tabla en Supabase
 * @param {Function} formVacio    Función que devuelve un objeto form vacío
 * @param {Object}   opciones
 *   @param {string}   opciones.ordenPor       Campo por el que ordenar la carga (default: 'id')
 *   @param {string}   opciones.prefixId       Prefijo para IDs generados (ej: 'C', 'PT', 'G')
 *   @param {number}   opciones.idPadding      Padding del número en el ID (default: 3)
 *   @param {Function} opciones.prepararData   (form) => data — transforma el form antes del upsert
 *                                              Si no se pasa, hace spread omitiendo id y campos computed
 *   @param {Function} opciones.validar        (form) => string|null — devuelve msg de error o null
 *   @param {Function} opciones.enriquecerItems (items, secundarios) => items[] — enriquece tras carga
 *   @param {Object}   opciones.secundaria     { tabla, select, orden } — tabla adicional a cargar
 *   @param {string[]} opciones.omitirEnData   Campos a omitir del form al hacer upsert (además de 'id')
 *   @param {Function} opciones.onGuardado     Callback tras guardar exitoso (async opcional)
 */
export function useCrud(tabla, formVacio, opciones = {}) {
  const {
    ordenPor      = 'id',
    prefixId      = tabla[0].toUpperCase(),
    idPadding     = 3,
    prepararData  = null,
    validar       = null,
    enriquecerItems = null,
    secundaria    = null,
    omitirEnData  = [],
    onGuardado    = null,
  } = opciones

  // ── Estado ────────────────────────────────────────────────────────────────
  const items        = ref([])
  const secundarios  = ref([])
  const modalAbierto = ref(false)
  const form         = ref(formVacio())
  const cargando     = ref(false)

  // ── Carga ─────────────────────────────────────────────────────────────────
  async function cargarDatos() {
    cargando.value = true
    try {
      const queries = [
        supabase.from(tabla).select('*').order(ordenPor),
      ]
      if (secundaria) {
        queries.push(
          supabase.from(secundaria.tabla)
            .select(secundaria.select || '*')
            .order(secundaria.orden || 'id')
        )
      }

      const resultados = await Promise.all(queries)
      const rawItems = resultados[0].data || []
      secundarios.value = secundaria ? (resultados[1].data || []) : []

      items.value = enriquecerItems
        ? enriquecerItems(rawItems, secundarios.value)
        : rawItems
    } finally {
      cargando.value = false
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function abrirModal() {
    form.value = formVacio()
    modalAbierto.value = true
  }

  function editar(item) {
    form.value = { ...item }
    modalAbierto.value = true
  }

  function cerrarModal() {
    modalAbierto.value = false
  }

  // ── Generación de ID ──────────────────────────────────────────────────────
  // Siempre consulta la BD en el momento de crear para obtener el máximo real.
  // Esto evita duplicados tanto por race conditions como por items en memoria desactualizados.
  // Los IDs tienen formato: prefixId + número con padding, ej: 'C001', 'PT003', 'I010'.
  async function generarId() {
    const { data } = await supabase.from(tabla).select('id')
    const registros = data || []
    const nums = registros.map(x => {
      // Extraer solo los dígitos del ID (funciona con 'C001', 'PT001', 'I001', etc.)
      const digitos = String(x.id).replace(/\D/g, '')
      return digitos ? parseInt(digitos, 10) : 0
    })
    const n = (nums.length ? Math.max(...nums) : 0) + 1
    return prefixId + String(n).padStart(idPadding, '0')
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  async function guardar() {
    // Validación
    if (validar) {
      const error = validar(form.value)
      if (error) return alert(error)
    }

    // Preparar data para upsert
    let data
    if (prepararData) {
      data = prepararData(form.value)
    } else {
      // Por defecto: spread omitiendo id y campos marcados
      data = { ...form.value }
      delete data.id
      for (const campo of omitirEnData) delete data[campo]
    }

    // Upsert
    if (form.value.id) {
      const { error } = await supabase.from(tabla).update(data).eq('id', form.value.id)
      if (error) return alert('Error al guardar: ' + error.message)
    } else {
      const nuevoId = await generarId()
      const { error } = await supabase.from(tabla).insert({ id: nuevoId, ...data })
      if (error) return alert('Error al guardar: ' + error.message)
    }

    modalAbierto.value = false

    if (onGuardado) await onGuardado()

    await cargarDatos()
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  /**
   * Función de eliminación genérica.
   * En componentes que necesiten lógica de bloqueo o navigate,
   * se puede usar directamente o envolver con lógica propia.
   */
  async function eliminar(id, { confirmar = true, msgConfirm = '¿Eliminar este registro?' } = {}) {
    if (confirmar && !confirm(msgConfirm)) return false
    const { error } = await supabase.from(tabla).delete().eq('id', id)
    if (error) { alert('Error al eliminar: ' + error.message); return false }
    await cargarDatos()
    return true
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  function inicializar(viewIdRef = null) {
    onMounted(cargarDatos)
    if (viewIdRef) watch(viewIdRef, cargarDatos)
  }

  return {
    // Estado
    items,
    secundarios,
    modalAbierto,
    form,
    cargando,
    // Acciones
    cargarDatos,
    abrirModal,
    editar,
    cerrarModal,
    guardar,
    eliminar,
    generarId,
    inicializar,
  }
}
