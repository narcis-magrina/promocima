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
        participe_id: ids.length > 0 ? ids[0] : null,
      }).eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      console.log('Eliminando user_id:', id)
      const { data, error } = await supabase.auth.admin.deleteUser(id)
      console.log('Resultado:', JSON.stringify({ data, error }))
      if (error) throw error
      return res.status(200).json({ ok: true })
    }
    
    return res.status(405).json({ error: 'Método no permitido' })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}
