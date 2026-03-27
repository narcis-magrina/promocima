import { createSupabaseAdmin, verificarAdmin } from './_supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  try {
    await verificarAdmin(req)
    const { email, nombre, rol, participe_ids, empresa_id, accesos } = req.body
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' })
    if (!email)     return res.status(400).json({ error: 'Email requerido' })
    console.log('[invitar] Inicio para:', email)

    const supabase = createSupabaseAdmin()
    const appUrl   = process.env.APP_URL || 'https://prestamos.promocima.com'

    // Verificar si ya existe — permitir reinvitar si está inactivo
    console.log('[invitar] Comprobando si existe...')
    const { data: existing } = await supabase.auth.admin.listUsers()
    const existingUser = existing?.users?.find(u => u.email === email)
    if (existingUser) {
      const { data: perfilExistente } = await supabase
        .from('perfiles').select('activo').eq('id', existingUser.id).single()
      if (perfilExistente?.activo) {
        return res.status(400).json({ error: `Ya existe un usuario activo con el email ${email}` })
      }
      console.log('[invitar] Usuario inactivo existente — borrando para reinvitar...')
      await supabase.from('perfiles').delete().eq('id', existingUser.id)
      await supabase.auth.admin.deleteUser(existingUser.id)
    }

    // Enviar invitación oficial de Supabase (igual que la PoC)
    console.log('[invitar] Enviando invitación Supabase...')
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/activar-cuenta.html`,
      data: { nombre: nombre || '', origen: 'invitacion' }
    })
    if (authError) {
      console.error('[invitar] Error inviteUserByEmail:', authError.message)
      throw authError
    }
    console.log('[invitar] Invitación enviada. Usuario:', authData.user.id)

    // Crear perfil (activo: false hasta que establezca contraseña)
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id:         authData.user.id,
      email,
      nombre:     nombre || '',
      rol:        rol || 'interno',
      empresa_id: empresa_id || accesos?.[0]?.empresa_id,
      activo:     false
    })
    if (perfilError) {
      console.error('[invitar] Error perfil:', perfilError.message)
      throw perfilError
    }
    console.log('[invitar] Perfil creado OK')

    // Crear accesos en perfiles_empresas
    const accesosPayload = accesos?.length
      ? accesos.map((a, i) => ({
          perfil_id:     authData.user.id,
          empresa_id:    a.empresa_id,
          participe_ids: rol === 'participe' ? (a.participe_ids || []) : [],
          orden:         i,
        }))
      : [{ perfil_id: authData.user.id, empresa_id, participe_ids: rol === 'participe' ? (participe_ids || []) : [], orden: 0 }]

    const { error: accesosError } = await supabase.from('perfiles_empresas').insert(accesosPayload)
    if (accesosError) {
      console.error('[invitar] Error accesos:', accesosError.message)
      throw accesosError
    }
    console.log('[invitar] Accesos creados OK')

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[invitar] Error:', e.message)
    return res.status(400).json({ error: e.message })
  }
}
