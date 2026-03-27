import { createSupabaseAdmin, verificarAdmin } from '../_supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    await verificarAdmin(req)
    const supabase = createSupabaseAdmin()

    if (req.method === 'PUT') {
      const { nombre, rol, activo, participe_ids } = req.body
      const ids = rol === 'participe'
        ? (Array.isArray(participe_ids) ? participe_ids : []).map(String).filter(Boolean)
        : []
      const { error } = await supabase.from('perfiles').update({
        nombre,
        rol,
        activo,
        participe_ids: ids,
      }).eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      console.log('Eliminando user_id:', id)
      // Borrar perfil siempre (aunque el usuario Auth no exista)
      await supabase.from('perfiles').delete().eq('id', id)
      // Intentar borrar de Auth — si no existe, no es error crítico
      const { error } = await supabase.auth.admin.deleteUser(id)
      if (error && error.message !== 'User not found') throw error
      return res.status(200).json({ ok: true })
    }
    
    return res.status(405).json({ error: 'Método no permitido' })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}
