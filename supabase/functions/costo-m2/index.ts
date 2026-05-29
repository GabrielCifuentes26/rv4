import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validar API key
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== Deno.env.get('HUB_API_KEY')) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Leer datos vigentes de tipología (is_current = true)
    const { data: rows, error } = await admin
      .from('casas_tipologia')
      .select('project_key, m2, tipologia, costo_m2, fecha')
      .eq('is_current', true)
      .order('m2', { ascending: false })

    if (error) throw error

    // Agrupar por (m2, tipologia)
    const grupos = new Map<string, {
      m2: number
      tipologia: string
      proyectos: Record<string, number>
    }>()

    for (const row of rows ?? []) {
      const key = `${row.m2}__${row.tipologia}`
      if (!grupos.has(key)) {
        grupos.set(key, { m2: row.m2, tipologia: row.tipologia, proyectos: {} })
      }
      grupos.get(key)!.proyectos[row.project_key.toUpperCase()] = Number(row.costo_m2)
    }

    // Calcular promedio e IBC por grupo
    const tipologias = Array.from(grupos.values()).map((g) => {
      const costos = Object.values(g.proyectos)
      const promedio = costos.length > 0
        ? costos.reduce((a, b) => a + b, 0) / costos.length
        : 0
      const ibc_pct = promedio > 0
        ? Number(((g.m2 / promedio) * 100).toFixed(2))
        : 0

      return {
        m2: g.m2,
        tipologia: g.tipologia,
        proyectos: g.proyectos,
        promedio: Number(promedio.toFixed(2)),
        ibc_pct,
      }
    })

    // Calcular más y menos conveniente (por IBC)
    const conIbc = tipologias.filter(t => t.ibc_pct > 0)
    const masConveniente  = conIbc.length > 0
      ? conIbc.reduce((a, b) => a.ibc_pct > b.ibc_pct ? a : b)
      : null
    const menosConveniente = conIbc.length > 0
      ? conIbc.reduce((a, b) => a.ibc_pct < b.ibc_pct ? a : b)
      : null

    // Fecha de última actualización
    const ultimaFecha = (rows ?? []).reduce((latest, r) => {
      return r.fecha && r.fecha > latest ? r.fecha : latest
    }, '')

    return new Response(JSON.stringify({
      sistema: 'Costo por M² — Costos&Presupuestos',
      generadoEn: new Date().toISOString(),
      ultimaActualizacion: ultimaFecha || null,
      tipologias,
      masConveniente: masConveniente
        ? { m2: masConveniente.m2, tipologia: masConveniente.tipologia, promedio: masConveniente.promedio, ibc_pct: masConveniente.ibc_pct }
        : null,
      menosConveniente: menosConveniente
        ? { m2: menosConveniente.m2, tipologia: menosConveniente.tipologia, promedio: menosConveniente.promedio, ibc_pct: menosConveniente.ibc_pct }
        : null,
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
