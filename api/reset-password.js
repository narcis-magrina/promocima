import { createSupabaseAdmin } from './_supabase.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { accion, email, token, nuevaPassword } = req.body
  const supabase = createSupabaseAdmin()

  try {
    if (accion === 'solicitar') {
      if (!email) return res.status(400).json({ error: 'Email requerido' })

      const { data: perfil } = await supabase.from('perfiles').select('nombre').eq('email', email).single()
      if (!perfil) return res.status(400).json({ error: 'No existe ninguna cuenta con ese email' })

      const token = crypto.randomBytes(32).toString('hex')
      const appUrl = `https://${req.headers.host}/reset.html?token=${token}`

      const { data: template } = await supabase.from('email_templates').select('asunto').eq('nombre', 'reset_password').single()
      const asunto = template?.asunto || 'Restablecer contraseña – PROMO CIMA'

      await supabase.from('emails_pendientes').insert({
        para: email,
        asunto,
        nombre: perfil.nombre || '',
        password: token,
        url: appUrl,
        enviado: false,
        template_nombre: 'reset_password'
      })

      return res.status(200).json({ ok: true })
    }

    if (accion === 'resetear') {
      if (!token || !nuevaPassword) return res.status(400).json({ error: 'Datos incompletos' })
      if (nuevaPassword.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' })

      const { data: rows } = await supabase.from('emails_pendientes')
        .select('para, created_at')
        .eq('password', token)
        .eq('enviado', true)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (!rows || rows.length === 0) return res.status(400).json({ error: 'El enlace no es válido o ha expirado' })

      const { data: perfil } = await supabase.from('perfiles').select('id').eq('email', rows[0].para).single()
      if (!perfil?.id) return res.status(400).json({ error: 'Usuario no encontrado' })

      await supabase.auth.admin.updateUserById(perfil.id, { password: nuevaPassword })
      await supabase.from('perfiles').update({ activo: true }).eq('email', rows[0].para)
      await supabase.from('emails_pendientes').update({ password: 'usado' }).eq('password', token)

      return res.status(200).json({ ok: true, email: rows[0].para })
    }

    return res.status(400).json({ error: 'Acción no reconocida' })
  } catch (e) {
    console.error('Error en /api/reset-password:', e.message)
    return res.status(400).json({ error: e.message })
  }
}
