import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { message, project_key = 'hlq', history = [] } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Mensaje vacío.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Verificar sesión del usuario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida. Inicia sesión nuevamente.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Obtener datos del proyecto (service role para saltarse RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data, error } = await admin
      .from('powerbi_resumen_cache')
      .select('payload, project_name, mes_a, updated_at')
      .eq('project_key', project_key)
      .single()

    if (error || !data?.payload) {
      return new Response(
        JSON.stringify({ reply: 'No encontré datos para este proyecto. Por favor sincroniza primero desde Power BI.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const datasets = data.payload?.datasets || {}
    const totales: Record<string, number> = datasets.totales?.[0] || {}
    const porArea: Record<string, number>[] = datasets.porArea || []
    const porEtapa: Record<string, number>[] = datasets.porEtapa || []
    const porSegmento: Record<string, number>[] = datasets.porSegmento || []
    const projectName: string = data.project_name
    const mesA: string = data.mes_a

    const fmt = (n: number | null | undefined) =>
      n != null ? `Q ${(n / 1_000_000).toFixed(2)}M` : 'N/D'
    const fmtPct = (n: number | null | undefined) =>
      n != null ? `${(n * 100).toFixed(1)}%` : 'N/D'

    const areaLines = porArea.map(r =>
      `  ${r['Rubros[Area]'] ?? 'Área'}: Ejecutado ${fmt(r.EjecutadoErequester)}, Asignado ${fmt(r.AsignadoErequester)}, Disponible ${fmt(r.DisponibleErequester)}`
    ).join('\n') || '  No disponible'

    const etapaLines = [...porEtapa]
      .sort((a, b) => (b.AsignadoErequester ?? 0) - (a.AsignadoErequester ?? 0))
      .slice(0, 10)
      .map(r =>
        `  ${r['Rubros[Etapa]'] ?? 'Etapa'}: Presupuesto ${fmt(r.PresupuestoErequester)}, Ejecutado ${fmt(r.EjecutadoErequester)}, Asignado ${fmt(r.AsignadoErequester)}`
      ).join('\n') || '  No disponible'

    const segmentoLines = porSegmento.map(r =>
      `  ${r['Rubros[Segmento]'] ?? 'Segmento'}: Presupuesto ${fmt(r.PresupuestoErequester)}, Ejecutado ${fmt(r.EjecutadoErequester)}`
    ).join('\n') || '  No disponible'

    const systemPrompt = `Eres un asistente financiero para el proyecto "${projectName}".
Tienes acceso a datos actualizados desde Power BI correspondientes al mes ${mesA}.
Responde siempre en español, de forma clara, concisa y profesional.
Cuando menciones montos usa el formato Q X.XXM (millones de Quetzales).
Si no tienes el dato solicitado, indícalo claramente y sugiere consultar el dashboard.

RESUMEN GENERAL (${mesA}):
- RDI Total: ${fmt(totales.RdiTotal)}
- Presupuesto ER: ${fmt(totales.PresupuestoErequester)}
- Ejecutado: ${fmt(totales.EjecutadoErequester)}
- Comprometido: ${fmt(totales.ComprometidoErequester)}
- Asignado: ${fmt(totales.AsignadoErequester)}
- Disponible: ${fmt(totales.DisponibleErequester)}
- % Asignado: ${fmtPct(totales.PorcentajeAsignado)}
- % Disponible: ${fmtPct(totales.PorcentajeDisponible)}

DESGLOSE POR ÁREA (Construcción / Urbanización):
${areaLines}

DESGLOSE POR ETAPA (top 10 por asignado):
${etapaLines}

DESGLOSE POR SEGMENTO:
${segmentoLines}`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: message },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    })

    const groqData = await groqRes.json()
    const reply: string = groqData.choices?.[0]?.message?.content
      ?? 'No pude generar una respuesta. Intenta de nuevo.'

    return new Response(JSON.stringify({ reply }), {
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
