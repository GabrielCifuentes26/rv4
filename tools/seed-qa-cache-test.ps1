# ── SEED QA_CACHE — PRUEBA 5 PREGUNTAS ──────────────────────────────────────
# Llama al ai-agent con cada pregunta; el agente genera embedding + respuesta
# y los guarda automáticamente en qa_cache.
# Delay de 12s entre llamadas para respetar rate limit de Groq.

$ErrorActionPreference = "Stop"

$EDGE_URL = "https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/ai-agent"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg"

$PREGUNTAS = @(
    @{ project_key = "bdj"; message = "¿Cuánto es el presupuesto de Bosques de Jalapa y cuánto llevamos asignado?" },
    @{ project_key = "bdp"; message = "¿Cuál es el porcentaje de avance de Bosques de Pinula?" },
    @{ project_key = "clc"; message = "¿Cuánto llevamos asignado en Condado La Ceiba?" },
    @{ project_key = "hlq"; message = "¿Qué etapa tiene más gasto en Hacienda La Querencia?" },
    @{ project_key = "rdb"; message = "¿Cómo va la Reserva del Bosque? Dame el resumen financiero." }
)

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $ANON_KEY"
    "apikey"        = $ANON_KEY
}

$total   = $PREGUNTAS.Count
$ok      = 0
$fallido = 0

Write-Host "`n── SEED QA_CACHE — $total preguntas de prueba ──`n"

for ($i = 0; $i -lt $PREGUNTAS.Count; $i++) {
    $q = $PREGUNTAS[$i]
    $num = $i + 1

    Write-Host "[$num/$total] $($q.project_key.ToUpper()) — $($q.message)"

    $body = @{
        message     = $q.message
        project_key = $q.project_key
        history     = @()
    } | ConvertTo-Json -Depth 3

    try {
        $res = Invoke-RestMethod -Uri $EDGE_URL -Method POST -Headers $headers -Body $body -TimeoutSec 60
        if ($res.reply) {
            Write-Host "  OK — $(($res.reply).Substring(0, [Math]::Min(80, $res.reply.Length)))..." -ForegroundColor Green
            $ok++
        } else {
            Write-Host "  WARN — respuesta vacía" -ForegroundColor Yellow
            $fallido++
        }
    } catch {
        Write-Host "  ERROR — $($_.Exception.Message)" -ForegroundColor Red
        $fallido++
    }

    if ($i -lt ($PREGUNTAS.Count - 1)) {
        Write-Host "  Esperando 12s (rate limit Groq)..."
        Start-Sleep -Seconds 12
    }
}

Write-Host "`n── RESULTADO: $ok OK / $fallido fallidos / $total total ──`n"
