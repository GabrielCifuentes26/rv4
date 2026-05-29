import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

const RATE = 7.8

const PROYECTOS: Record<string, string> = {
  bdj: 'Bosques de Jalapa',
  bdp: 'Bosques de Pinula',
  bse: 'Bosques de Santa Elena',
  cse: 'Condado Santa Elena',
  hlq: 'Hacienda La Querencia',
  rdb: 'Reserva del Bosque',
}

const M2_FALLBACK: Record<string, { casas: number; urbanizacion: number; total: number }> = {
  bdj: { casas: 16566.48, urbanizacion: 36248.76, total: 52815.24 },
  bdp: { casas: 30715.06, urbanizacion: 23331.69, total: 54046.75 },
  bse: { casas: 41272.94, urbanizacion: 27442.78, total: 68715.72 },
  cse: { casas: 42630.21, urbanizacion: 19427.66, total: 62057.87 },
  hlq: { casas: 10388.90, urbanizacion: 7282.77,  total: 17671.67 },
  rdb: { casas: 29940.56, urbanizacion: 33784.09, total: 63724.65 },
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// deno-lint-ignore no-explicit-any
function getAreaName(row: any): string {
  return String(
    row['dimSegmentación[Area]'] ??
    row['dimSegmentacion[Area]'] ??
    row['Rubros[Area]'] ??
    row['Area'] ?? row['area'] ?? ''
  )
}

// deno-lint-ignore no-explicit-any
function getPresupuesto(row: any): number {
  return Number(row['[PresupuestoErequester]'] ?? row['PresupuestoErequester'] ?? 0)
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

    // Cargar caché de Power BI
    const cacheRes = await admin
      .from('powerbi_resumen_cache')
      .select('project_key, payload, updated_at')
      .order('updated_at', { ascending: false })

    if (cacheRes.error) throw new Error(`powerbi_resumen_cache: ${cacheRes.error.message}`)

    // Índice de costos por proyecto (más reciente primero)
    const costosMap: Record<string, { construccion: number; urbanizacion: number; total: number; updatedAt: string }> = {}
    for (const r of cacheRes.data ?? []) {
      if (costosMap[r.project_key]) continue // ya tenemos la más reciente
      // deno-lint-ignore no-explicit-any
      const porArea: any[] = r.payload?.datasets?.porArea ?? []
      let construccion = 0, urbanizacion = 0
      for (const fila of porArea) {
        const nombre = norm(getAreaName(fila))
        const monto  = getPresupuesto(fila)
        if (nombre.includes('construcc')) construccion = monto
        if (nombre.includes('urbaniz'))   urbanizacion = monto
      }
      costosMap[r.project_key] = {
        construccion,
        urbanizacion,
        total: construccion + urbanizacion,
        updatedAt: r.updated_at,
      }
    }

    // Construir respuesta por proyecto
    const proyectos = Object.entries(PROYECTOS).map(([key, nombre]) => {
      const m2    = M2_FALLBACK[key] ?? { casas: 0, urbanizacion: 0, total: 0 }
      const costo = costosMap[key] ?? { construccion: 0, urbanizacion: 0, total: 0, updatedAt: '' }

      const qm2Casa = m2.casas        > 0 ? costo.construccion / m2.casas        : 0
      const qm2Urb  = m2.urbanizacion > 0 ? costo.urbanizacion / m2.urbanizacion : 0
      const qm2Tot  = m2.total        > 0 ? costo.total        / m2.total        : 0

      const pctCasas = costo.total > 0 ? Number(((costo.construccion / costo.total) * 100).toFixed(1)) : 0
      const pctUrb   = costo.total > 0 ? Number(((costo.urbanizacion / costo.total) * 100).toFixed(1)) : 0

      return {
        key,
        nombre,
        costo_m2_total_q:   Math.round(qm2Tot),
        costo_m2_total_usd: Math.round(qm2Tot / RATE),
        casas: {
          costos_q:     Math.round(costo.construccion),
          m2:           Math.round(m2.casas),
          costo_m2_q:   Math.round(qm2Casa),
          costo_m2_usd: Math.round(qm2Casa / RATE),
        },
        urbanizacion: {
          costos_q:     Math.round(costo.urbanizacion),
          m2:           Math.round(m2.urbanizacion),
          costo_m2_q:   Math.round(qm2Urb),
          costo_m2_usd: Math.round(qm2Urb / RATE),
        },
        total: {
          costos_q:     Math.round(costo.total),
          m2:           Math.round(m2.total),
          costo_m2_q:   Math.round(qm2Tot),
          costo_m2_usd: Math.round(qm2Tot / RATE),
        },
        pct_casas:        pctCasas,
        pct_urbanizacion: pctUrb,
        ultima_actualizacion: costo.updatedAt || null,
      }
    })

    return new Response(JSON.stringify({
      sistema: 'Costo por M² por Proyecto — Costos&Presupuestos',
      generadoEn: new Date().toISOString(),
      tipo_cambio_usd: RATE,
      proyectos,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('proyectos-m2 error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
