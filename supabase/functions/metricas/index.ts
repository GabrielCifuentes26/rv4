import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

const fmt = (n: number): string => {
  if (n >= 1_000_000) return `Q ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `Q ${(n / 1_000).toFixed(0)}K`
  return `Q ${n.toFixed(0)}`
}

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`

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
      .from('powerbi_resumen_cache')
      .select('payload, mes_a, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error

    let presupuesto = 0, asignado = 0, disponible = 0
    let mesRef = ''

    for (const row of rows ?? []) {
      // Los campos en el JSON vienen con corchetes: [PresupuestoErequester]
      const t = (row.payload?.datasets?.totales?.[0]) ?? {}
      presupuesto += (t['[PresupuestoErequester]'] ?? t.PresupuestoErequester ?? 0) as number
      asignado    += (t['[AsignadoErequester]']    ?? t.AsignadoErequester    ?? 0) as number
      disponible  += (t['[DisponibleErequester]']  ?? t.DisponibleErequester  ?? 0) as number
      if (!mesRef && row.mes_a) mesRef = row.mes_a
    }

    const pctAsignado   = presupuesto > 0 ? asignado   / presupuesto : 0
    const pctDisponible = presupuesto > 0 ? disponible / presupuesto : 0
    const proyectos     = (rows ?? []).length

    return new Response(JSON.stringify({
      sistema:    'Ejecución de Costos',
      generadoEn: new Date().toISOString(),
      metricas: [
        { label: 'Proyectos activos', value: `${proyectos}`,   trend: mesRef },
        { label: 'Presupuesto total', value: fmt(presupuesto), trend: null },
        { label: 'Asignado',          value: fmt(asignado),    trend: fmtPct(pctAsignado) },
        { label: 'Disponible',        value: fmt(disponible),  trend: `${fmtPct(pctDisponible)} libre` },
      ],
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
