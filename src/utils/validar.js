// ═══════════════════════════════════════════════════════════════════════════
//  VALIDACIÓN DE FORMULARIOS — PROMOCIMA
// ═══════════════════════════════════════════════════════════════════════════

export function validarCampos(form, reglas) {
  const errores = []
  for (const r of reglas) {
    const val = form[r.campo]
    const label = r.label || r.campo
    const empty = val === null || val === undefined || String(val).trim() === ''

    // Requerido: campo vacío O numérico con valor 0 cuando min > 0
    if (r.requerido) {
      if (empty) {
        errores.push(`"${label}" es obligatorio`)
        continue
      }
      if (r.tipo === 'numero' && r.min > 0 && Number(val) <= 0) {
        errores.push(`"${label}" debe ser mayor que 0`)
        continue
      }
    }

    // Si está vacío y no es requerido, saltar
    if (empty) continue

    // Tipo numérico
    if (r.tipo === 'numero') {
      const n = Number(val)
      if (isNaN(n)) { errores.push(`"${label}" debe ser un número válido`); continue }
      if (r.min !== undefined && n < r.min) errores.push(`"${label}" debe ser mayor o igual a ${r.min}`)
      if (r.max !== undefined && n > r.max) errores.push(`"${label}" debe ser menor o igual a ${r.max}`)
    }

    // Tipo fecha
    if (r.tipo === 'fecha') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) errores.push(`"${label}" debe ser una fecha válida (AAAA-MM-DD)`)
    }

    // Tipo email
    if (r.tipo === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errores.push(`"${label}" debe ser un email válido`)
    }
  }
  return errores
}

export function traducirErrorSupabase(error) {
  if (!error?.message) return 'Error desconocido al guardar'
  const msg = error.message

  if (msg.includes('invalid input syntax for type numeric')) {
    const match = msg.match(/column "([^"]+)"/)
    return match
      ? `El campo "${match[1]}" contiene un valor que no es un número válido.`
      : 'Un campo numérico contiene un valor inválido. Revisa importes y porcentajes.'
  }
  if (msg.includes('invalid input syntax for type date') || msg.includes('invalid input syntax for type timestamp'))
    return 'Una de las fechas tiene un formato incorrecto.'
  if (msg.includes('violates not-null constraint')) {
    const match = msg.match(/column "([^"]+)"/)
    return match ? `El campo "${match[1]}" es obligatorio y no puede estar vacío.` : 'Falta un campo obligatorio.'
  }
  if (msg.includes('violates foreign key constraint')) {
    const match = msg.match(/on table "([^"]+)"/)
    return match ? `Referencia inválida en "${match[1]}".` : 'Referencia a otro registro inválida.'
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint'))
    return 'Ya existe un registro con esos datos. Revisa si ya está dado de alta.'
  if (msg.includes('value too long'))
    return 'Uno de los campos supera la longitud máxima permitida.'

  return `Error al guardar: ${msg}`
}
