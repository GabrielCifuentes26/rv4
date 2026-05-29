import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

const NOMBRES: Record<string, string> = {
  BDJ: 'Bosques de Jalapa',
  BDP: 'Bosques de Pinula',
  BSE: 'Bosques de Santa Elena',
  CSE: 'Condado Santa Elena',
  HLQ: 'Hacienda La Querencia',
  RDB: 'Reserva del Bosque',
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

    // Proyectos únicos presentes
    const todosProyectos = Array.from(
      new Set((rows ?? []).map(r => r.project_key.toUpperCase()))
    ).sort()

    // Agrupar por (m2, tipologia), guardando costo_m2 y fecha por proyecto
    const grupos = new Map<string, {
      m2: number
      tipologia: string
      proyectos: Record<string, { costo_m2: number | null; fecha: string | null; costo_unitario_gtq: number | null }>
    }>()

    for (const row of rows ?? []) {
      const key = `${row.m2}__${row.tipologia}`
      if (!grupos.has(key)) {
        const init: Record<string, { costo_m2: number | null; fecha: string | null; costo_unitario_gtq: number | null }> = {}
        for (const p of todosProyectos) init[p] = { costo_m2: null, fecha: null, costo_unitario_gtq: null }
        grupos.set(key, { m2: row.m2, tipologia: row.tipologia, proyectos: init })
      }
      const costo = Number(row.costo_m2)
      const m2val = Number(row.m2)
      grupos.get(key)!.proyectos[row.project_key.toUpperCase()] = {
        costo_m2:         costo,
        fecha:            row.fecha ?? null,
        costo_unitario_gtq: Math.round(costo * m2val),
      }
    }

    // Calcular promedio, IBC y costo unitario promedio por grupo
    const tipologias = Array.from(grupos.values()).map((g) => {
      const vals = Object.values(g.proyectos).filter(v => v.costo_m2 !== null)
      const costos = vals.map(v => v.costo_m2 as number)
      const promedio = costos.length > 0
        ? costos.reduce((a, b) => a + b, 0) / costos.length : 0
      const ibc_pct = promedio > 0
        ? Number(((g.m2 / promedio) * 100).toFixed(2)) : 0

      return {
        metros_construccion:        g.m2,
        tipologia:                  g.tipologia,
        moneda:                     'GTQ',
        promedio_costo_m2_gtq:      Number(promedio.toFixed(2)),
        costo_unitario_promedio_gtq: Math.round(promedio * g.m2),
        ibc_pct,
        incluye: 'Costo directo de construcción de la unidad habitacional. No incluye urbanización, indirectos, licencias ni equipamiento.',
        proyectos: Object.fromEntries(
          Object.entries(g.proyectos).map(([codigo, v]) => [
            codigo,
            v.costo_m2 !== null ? {
              codigo_proyecto:     codigo,
              nombre_proyecto:     NOMBRES[codigo] ?? codigo,
              costo_m2_gtq:        v.costo_m2,
              costo_unitario_gtq:  v.costo_unitario_gtq,
              fecha_vigencia:      v.fecha,
            } : null,
          ])
        ),
      }
    })

    const conIbc = tipologias.filter(t => t.ibc_pct > 0)
    const masConveniente   = conIbc.length > 0 ? conIbc.reduce((a, b) => a.ibc_pct > b.ibc_pct ? a : b) : null
    const menosConveniente = conIbc.length > 0 ? conIbc.reduce((a, b) => a.ibc_pct < b.ibc_pct ? a : b) : null

    const ultimaFecha = (rows ?? []).reduce((latest, r) => {
      return r.fecha && r.fecha > latest ? r.fecha : latest
    }, '')

    return new Response(JSON.stringify({
      sistema:              'Costo por M² por Tipología — Costos&Presupuestos',
      generadoEn:           new Date().toISOString(),
      moneda:               'GTQ',
      tipo_cambio_referencia: 'GTQ/USD ≈ 7.80',
      ultima_actualizacion: ultimaFecha || null,
      proyectos_disponibles: todosProyectos.map(c => ({ codigo: c, nombre: NOMBRES[c] ?? c })),
      tipologias,
      masConveniente:  masConveniente  ? { metros_construccion: masConveniente.metros_construccion,  tipologia: masConveniente.tipologia,  promedio_costo_m2_gtq: masConveniente.promedio_costo_m2_gtq,  costo_unitario_promedio_gtq: masConveniente.costo_unitario_promedio_gtq,  ibc_pct: masConveniente.ibc_pct  } : null,
      menosConveniente: menosConveniente ? { metros_construccion: menosConveniente.metros_construccion, tipologia: menosConveniente.tipologia, promedio_costo_m2_gtq: menosConveniente.promedio_costo_m2_gtq, costo_unitario_promedio_gtq: menosConveniente.costo_unitario_promedio_gtq, ibc_pct: menosConveniente.ibc_pct } : null,
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
