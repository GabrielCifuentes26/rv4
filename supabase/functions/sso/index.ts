import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, nombre, hubToken } = await req.json()
    const hubSecret  = Deno.env.get('HUB_SECRET')
    const tableroUrl = Deno.env.get('TABLERO_URL') ?? 'https://tu-tablero.web.app'

    if (!email || !hubToken) {
      return new Response(JSON.stringify({ error: 'email y hubToken son requeridos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (hubToken !== hubSecret) {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar si el usuario ya existe en Auth
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existing = users?.find(u => u.email === email)

    if (!existing) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nombre: nombre ?? '' },
      })
      if (createErr) throw createErr
    }

    // Generar magic link de un solo uso
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${tableroUrl}/index.html` },
    })
    if (linkErr) throw linkErr

    return new Response(JSON.stringify({
      success: true,
      token: null,
      redirectUrl: linkData.properties?.action_link,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
