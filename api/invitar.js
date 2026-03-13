import { createSupabaseAdmin, verificarAdmin } from './_supabase.js'
import crypto from 'crypto'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  try {
    await verificarAdmin(req)
    const { email, nombre, rol, participe_ids } = req.body
    if (!email) return res.status(400).json({ error: 'Email requerido' })

    const supabase = createSupabaseAdmin()
    const tempPassword = crypto.randomBytes(6).toString('hex') + 'A1!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })
    if (authError) throw authError

    await supabase.from('perfiles').insert({
      id: authData.user.id,
      email,
      nombre: nombre || '',
      rol: rol || 'interno',
      participe_ids: rol === 'participe' ? (participe_ids || []) : [],
      activo: false
    })

    const { data: template } = await supabase.from('email_templates').select('asunto').eq('nombre', 'invitacion').single()
    const asunto = template?.asunto || 'Invitación para acceder a PROMO CIMA'
    const appUrl = `https://${req.headers.host}/bienvenida.html`

    await supabase.from('emails_pendientes').insert({
      para: email,
      asunto,
      nombre: nombre || '',
      password: tempPassword,
      url: appUrl,
      enviado: false,
      template_nombre: 'invitacion'
    })

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Error en /api/invitar:', e.message)
    return res.status(400).json({ error: e.message })
  }
}
