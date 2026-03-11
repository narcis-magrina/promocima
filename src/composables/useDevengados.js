/**
 * useDevengados — operaciones sobre pagos reales a partícipes.
 *
 * Los devengados son ahora virtuales (calculados al vuelo en calcularLineasCCP).
 * Esta librería solo gestiona los pagos REALES registrados en pagos_reales_participe.
 *
 * Funciones exportadas:
 *   marcarPagado(pago)     → marca un pago real como pagado (actualiza fecha_pago_real)
 *   marcarPagados(ids, fecha?) → marca varios pagos como pagados
 *   retrocederPago(pago)   → elimina un pago real (retrocede a devengado virtual)
 *   retrocederPagos(ids)   → elimina varios pagos reales
 */

import { supabase } from '../supabase.js'
import { today } from '../utils.js'

// ── marcarPagado ──────────────────────────────────────────────────────────────
// Ya no existe "marcar como pagado" sobre un devengado virtual.
// Esta función se mantiene por compatibilidad pero en la nueva arquitectura
// los pagos se INSERTAN directamente (ver guardarPago en ContratoCCPDetalle).
export async function marcarPagado(pago) {
  // En la nueva arquitectura todos los registros son pagos reales — no hay campo pagado/estado
  // Esta función se mantiene como stub por compatibilidad
  return true
}

// ── marcarPagados ─────────────────────────────────────────────────────────────
export async function marcarPagados(ids, fecha) {
  // Stub por compatibilidad — en nueva arquitectura no hay campo pagado
  return true
}

// ── eliminarPago ──────────────────────────────────────────────────────────────
// Elimina un pago real. El devengado virtual vuelve a aparecer automáticamente.
export async function eliminarPago(pago, msg) {
  const confirmMsg = msg ?? '¿Eliminar este pago? El importe volverá a aparecer como devengado pendiente.'
  if (!confirm(confirmMsg)) return false
  const { error } = await supabase
    .from('pagos_reales_participe')
    .delete()
    .eq('id', pago.id)
  if (error) { alert('Error al eliminar pago: ' + error.message); return false }
  return true
}

// ── eliminarPagos ─────────────────────────────────────────────────────────────
export async function eliminarPagos(ids) {
  if (!ids.length) return true
  const { error } = await supabase
    .from('pagos_reales_participe')
    .delete()
    .in('id', ids)
  if (error) { alert('Error al eliminar pagos: ' + error.message); return false }
  return true
}

// ── retrocederPago (alias de eliminarPago para compatibilidad) ────────────────
export async function retrocederPago(pago, msg) {
  return eliminarPago(pago, msg)
}

// ── retrocederPagos (alias de eliminarPagos para compatibilidad) ──────────────
export async function retrocederPagos(ids) {
  return eliminarPagos(ids)
}
