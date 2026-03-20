import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verificar que el llamante es admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return json({ error: 'No autorizado' }, 401)
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !caller) return json({ error: 'Token inválido' }, 401)
    const { data: perfil } = await supabaseAdmin.from('perfiles').select('rol').eq('id', caller.id).single()
    if (!perfil || perfil.rol !== 'admin') return json({ error: 'Solo administradores' }, 403)

    const { email, nombre, rol, participe_ids } = await req.json()
    if (!email) return json({ error: 'Email requerido' }, 400)

    // Generar password temporal robusto
    const arr = new Uint8Array(12)
    crypto.getRandomValues(arr)
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
    const tempPassword = hex.slice(0, 4).toUpperCase() + hex.slice(4) + 'A1!'

    // Verificar si ya existe
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    if (users?.some((u: any) => u.email === email)) {
      return json({ error: `Ya existe un usuario con el email ${email}` }, 400)
    }

    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) return json({ error: authError.message }, 400)

    const userId = authData.user.id

    // Crear perfil
    await supabaseAdmin.from('perfiles').insert({
      id: userId,
      email,
      nombre: nombre || '',
      rol: rol || 'interno',
      participe_ids: rol === 'participe' ? (participe_ids || []) : [],
      activo: false,
    })

    // Leer asunto del template
    const { data: template } = await supabaseAdmin
      .from('email_templates').select('asunto').eq('nombre', 'invitacion').single()
    const asunto = template?.asunto || 'Invitación para acceder a PROMO CIMA'
    const appUrl = 'https://promocima-prestamos.vercel.app/bienvenida.html'

    // Insertar en emails_pendientes para que Apps Script lo envíe
    await supabaseAdmin.from('emails_pendientes').insert({
      para: email,
      asunto,
      nombre: nombre || '',
      password: tempPassword,
      url: appUrl,
      enviado: false,
      template_nombre: 'invitacion',
    })

    return json({ ok: true })

  } catch (e) {
    console.error('exception:', String(e))
    return json({ error: String(e) }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
