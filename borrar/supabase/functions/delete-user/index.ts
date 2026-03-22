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

    // 1. Verificar que el llamante es admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !user) return json({ error: 'No autorizado' }, 401)

    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin') return json({ error: 'Solo administradores pueden eliminar usuarios' }, 403)

    // 2. Leer body
    const { user_id } = await req.json()
    if (!user_id) return json({ error: 'user_id requerido' }, 400)

    // 3. No permitir que el admin se borre a sí mismo
    if (user_id === user.id) return json({ error: 'No puedes eliminar tu propio usuario' }, 400)

    // 4. Borrar perfil primero (FK), luego usuario en Auth
    await supabaseAdmin.from('perfiles').delete().eq('id', user_id)
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (delErr) return json({ error: delErr.message }, 400)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
