import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export async function verificarAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) throw new Error('No autorizado')

  const supabase = createSupabaseAdmin()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Token inválido')

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') throw new Error('Solo administradores')

  return user
}
