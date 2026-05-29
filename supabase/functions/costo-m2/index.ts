import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const { data: rows, error } = await admin
      .from('casas_tipologia')
      .select('project_key, m2, tipologia, costo_m2, fecha')
      .eq('is_current', true)
      .order('m2', { ascending: false })

    if (error) throw error

    // Recopilar todos los proyectos únicos presentes en los datos
    const todosProyectos = Array.from(
      new Set((rows ?? []).map(r => r.project_key.toUpperCase()))
    ).sort()

    // Agrupar por (m2, tipologia)
    const grupos = new Map<string, {
      m2: number
      tipologia: string
      proyectos: Record<string, number | null>
    }>()

    for (const row of rows ?? []) {
      const key = `${row.m2}__${row.tipologia}`
      if (!grupos.has(key)) {
        // Inicializar con null para TODOS los proyectos
        const proyectosVacios: Record<string, number | null> = {}
        for (const p of todosProyectos) proyectosVacios[p] = null
        grupos.set(key, { m2: row.m2, tipologia: row.tipologia, proyectos: proyectosVacios })
      }
      grupos.get(key)!.proyectos[row.project_key.toUpperCase()] = Number(row.costo_m2)
    }

    // Calcular promedio e IBC por grupo
    const tipologias = Array.from(grupos.values()).map((g) => {
      const costos = Object.values(g.proyectos).filter(v => v !== null) as number[]
      const promedio = costos.length > 0
        ? costos.reduce((a, b) => a + b, 0) / costos.length
        : 0
      const ibc_pct = promedio > 0
        ? Number(((g.m2 / promedio) * 100).toFixed(2))
        : 0

      return {
        metros: g.m2,
        tipologia: g.tipologia,
        proyectos: g.proyectos,
        promedio_costo_m2: Number(promedio.toFixed(2)),
        ibc_pct,
      }
    })

    const conIbc = tipologias.filter(t => t.ibc_pct > 0)
    const masConveniente   = conIbc.length > 0 ? conIbc.reduce((a, b) => a.ibc_pct > b.ibc_pct ? a : b) : null
    const menosConveniente = conIbc.length > 0 ? conIbc.reduce((a, b) => a.ibc_pct < b.ibc_pct ? a : b) : null

    const ultimaFecha = (rows ?? []).reduce((latest, r) => {
      return r.fecha && r.fecha > latest ? r.fecha : latest
    }, '')

    return new Response(JSON.stringify({
      sistema: 'Costo por M² — Costos&Presupuestos',
      generadoEn: new Date().toISOString(),
      ultimaActualizacion: ultimaFecha || null,
      proyectos: todosProyectos,
      tipologias,
      masConveniente: masConveniente
        ? { metros: masConveniente.metros, tipologia: masConveniente.tipologia, promedio_costo_m2: masConveniente.promedio_costo_m2, ibc_pct: masConveniente.ibc_pct }
        : null,
      menosConveniente: menosConveniente
        ? { metros: menosConveniente.metros, tipologia: menosConveniente.tipologia, promedio_costo_m2: menosConveniente.promedio_costo_m2, ibc_pct: menosConveniente.ibc_pct }
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
