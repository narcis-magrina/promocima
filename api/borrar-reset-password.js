import { createSupabaseAdmin } from './_supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { accion, email } = req.body
  const supabase = createSupabaseAdmin()
  const appUrl   = process.env.APP_URL || 'https://prestamos.promocima.com'

  try {
    if (accion === 'solicitar') {
      if (!email) return res.status(400).json({ error: 'Email requerido' })

      // Verificar que el email existe en perfiles antes de enviar
      const { data: perfil } = await supabase
        .from('perfiles').select('nombre').eq('email', email).single()
      if (!perfil) return res.status(400).json({ error: 'No existe ninguna cuenta con ese email' })

      // Supabase envía el email de recuperación directamente
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/`
      })
      if (error) throw error

      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Acción no reconocida' })
  } catch (e) {
    console.error('Error en /api/reset-password:', e.message)
    return res.status(400).json({ error: e.message })
  }
}
