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

    const body = await req.json()
    const { email, nombre, redirectTo, rol, participe_ids } = body

    if (!email) return json({ error: 'Email requerido' }, 400)

    // 1. Invitar usuario en Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nombre: nombre || '' },
      redirectTo: redirectTo || 'https://promocima-prestamos.vercel.app/callback.html'
    })

    if (error) return json({ error: error.message }, 400)

    const userId = data.user.id

    // 2. Crear/actualizar perfil — solo si el rol viene informado para no machacar perfiles existentes
    if (rol) {
      const { error: perfilError } = await supabaseAdmin
        .from('perfiles')
        .upsert({
          id: userId,
          email: email,
          nombre: nombre || '',
          rol: rol,
          participe_ids: rol === 'participe' ? (participe_ids || []) : [],
          activo: true
        }, { onConflict: 'id' })

      if (perfilError) console.log('perfil upsert error:', perfilError.message)
    }

    return json({ ok: true, user: { id: userId } })

  } catch (e) {
    console.log('exception:', String(e))
    return json({ error: String(e) }, 500)
  }
})

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
