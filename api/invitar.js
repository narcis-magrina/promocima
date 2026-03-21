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
    const { email, nombre, rol, participe_ids, empresa_id } = req.body
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' })
    if (!email) return res.status(400).json({ error: 'Email requerido' })
    console.log('[invitar] Inicio para:', email)

    const supabase = createSupabaseAdmin()
    const base = crypto.randomBytes(12).toString('hex')
    const upper = base.slice(0, 4).toUpperCase()
    const tempPassword = upper + base.slice(4) + 'A1!'

    // Verificar si ya existe — permitir reinvitar si está inactivo
    console.log('[invitar] Comprobando si existe...')
    const { data: existing } = await supabase.auth.admin.listUsers()
    const existingUser = existing?.users?.find(u => u.email === email)
    if (existingUser) {
      const { data: perfilExistente } = await supabase.from('perfiles').select('activo').eq('id', existingUser.id).single()
      if (perfilExistente?.activo) {
        return res.status(400).json({ error: `Ya existe un usuario activo con el email ${email}` })
      }
      console.log('[invitar] Usuario inactivo existente — borrando para reinvitar...')
      await supabase.from('perfiles').delete().eq('id', existingUser.id)
      await supabase.auth.admin.deleteUser(existingUser.id)
    }

    console.log('[invitar] Creando usuario en Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) {
      console.error('[invitar] Error createUser:', authError.message)
      throw authError
    }
    console.log('[invitar] Usuario Auth creado:', authData.user.id)

    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: authData.user.id,
      email,
      nombre: nombre || '',
      rol: rol || 'interno',
      participe_ids: rol === 'participe' ? (participe_ids || []) : [],
      empresa_id,
      activo: false
    })
    if (perfilError) {
      console.error('[invitar] Error perfil:', perfilError.message)
      throw perfilError
    }
    console.log('[invitar] Perfil creado OK')

    const { data: template } = await supabase.from('email_templates').select('asunto').eq('nombre', 'invitacion').single()
    const asunto = template?.asunto || 'Invitación para acceder a PROMO CIMA'
    const appUrl = `https://${req.headers.host}/bienvenida.html`
    console.log('[invitar] Asunto:', asunto, '| URL:', appUrl)

    const { error: emailError } = await supabase.from('emails_pendientes').insert({
      para: email,
      asunto,
      nombre: nombre || '',
      password: tempPassword,
      url: appUrl,
      enviado: false,
      template_nombre: 'invitacion'
    })
    if (emailError) {
      console.error('[invitar] Error emails_pendientes:', emailError.message)
      throw emailError
    }
    console.log('[invitar] emails_pendientes OK')

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[invitar] Error:', e.message)
    return res.status(400).json({ error: e.message })
  }
}
