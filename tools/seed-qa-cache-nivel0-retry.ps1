# SEED QA_CACHE - NIVEL 0 RETRY FINAL (5 preguntas restantes)
# Delay: 120s entre llamadas (~10 min total)

$ErrorActionPreference = "Stop"

$SUPABASE_URL = "https://iipgrojliqeyycvgnkrc.supabase.co"
$EDGE_URL     = "$SUPABASE_URL/functions/v1/ai-agent"
$ANON_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg"
$SEED_SECRET  = "rv4seedd0a152b8aa1f4514"

$agentHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $ANON_KEY"
    "apikey"        = $ANON_KEY
    "X-Seed-Key"    = $SEED_SECRET
}

$PREGUNTAS = @(
    "como se compara el avance de Bosques de Jalapa vs Bosques de Pinula",
    "como va Bosques de Pinula",
    "como va Bosques de Santa Elena",
    "como va Hacienda La Querencia",
    "como va Reserva del Bosque"
)

$total   = $PREGUNTAS.Count
$ok      = 0
$fallido = 0

Write-Host "Retry Final - $total preguntas, delay 120s"
Write-Host ""

for ($i = 0; $i -lt $PREGUNTAS.Count; $i++) {
    $pregunta = $PREGUNTAS[$i]
    $num      = $i + 1

    Write-Host "[$num/$total] $pregunta"

    $body = @{
        message     = $pregunta
        project_key = ""
        history     = @()
    } | ConvertTo-Json -Depth 3

    try {
        $res = Invoke-RestMethod -Uri $EDGE_URL -Method POST -Headers $agentHeaders -Body $body -TimeoutSec 90
        if ($res.reply -and -not $res.reply.StartsWith("No se pudo")) {
            $len     = $res.reply.Length
            $preview = $res.reply.Substring(0, [Math]::Min(120, $len))
            Write-Host "  OK - $preview..." -ForegroundColor Green
            $ok++
        } elseif ($res.reply) {
            Write-Host "  RATE LIMIT - $($res.reply.Substring(0,60))" -ForegroundColor Yellow
            $fallido++
        } else {
            Write-Host "  WARN - respuesta vacia" -ForegroundColor Yellow
            $fallido++
        }
    } catch {
        Write-Host "  ERROR - $($_.Exception.Message)" -ForegroundColor Red
        $fallido++
    }

    if ($i -lt ($PREGUNTAS.Count - 1)) {
        Write-Host "  Esperando 120s..."
        Start-Sleep -Seconds 120
    }
}

Write-Host ""
Write-Host "RESULTADO: $ok OK / $fallido fallidos / $total total"
Write-Host ""
