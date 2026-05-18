# SEED QA_CACHE - NIVEL 0 (Portafolio) - 50 preguntas
# 1. Login con usuario real para obtener JWT valido
# 2. Borra todas las entradas actuales de qa_cache
# 3. Seedea 50 preguntas de nivel portafolio
# Tiempo estimado: ~10 minutos

$ErrorActionPreference = "Stop"

$SUPABASE_URL    = "https://iipgrojliqeyycvgnkrc.supabase.co"
$EDGE_URL        = "$SUPABASE_URL/functions/v1/ai-agent"
$ANON_KEY        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg"
$SERVICE_KEY     = $env:SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
Write-Host "[1/3] Verificando service role key..." -NoNewline
if (-not $SERVICE_KEY) {
    Write-Host " FALLO" -ForegroundColor Red
    Write-Error "Variable de entorno SUPABASE_SERVICE_ROLE_KEY no encontrada."
    exit 1
}
Write-Host " OK" -ForegroundColor Green

# PASO 2: LIMPIAR QA_CACHE
Write-Host "[2/3] Limpiando qa_cache..." -NoNewline

$restHeaders = @{
    "apikey"        = $ANON_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

try {
    Invoke-RestMethod `
        -Uri     "$SUPABASE_URL/rest/v1/qa_cache?id=not.is.null" `
        -Method  DELETE `
        -Headers $restHeaders | Out-Null
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " WARN - $($_.Exception.Message)" -ForegroundColor Yellow
}

# PASO 3: PREGUNTAS NIVEL 0
$PREGUNTAS = @(
    "cual es el proyecto mas avanzado financieramente",
    "cual es el proyecto mas atrasado en asignacion",
    "cual proyecto tiene mayor presupuesto disponible",
    "cual proyecto tiene menor presupuesto disponible",
    "cual es el proyecto con mayor presupuesto total",
    "cual es el proyecto con menor presupuesto total",
    "cual proyecto tiene mayor monto ejecutado",
    "cual proyecto tiene mayor monto comprometido",
    "cuales son los 3 proyectos mas avanzados",
    "cuales son los 3 proyectos mas atrasados",
    "cuanto suman los presupuestos de todos los proyectos",
    "cuanto se ha asignado en total en todos los proyectos",
    "cuanto presupuesto disponible queda en el portafolio",
    "cuanto se ha ejecutado en total entre todos los proyectos",
    "cuanto esta comprometido en total en el portafolio",
    "cual es el porcentaje de asignacion global del portafolio",
    "cuantos proyectos estan activos actualmente",
    "cuanto suma el presupuesto de los proyectos de casas",
    "que proyectos estan en riesgo de agotar su presupuesto",
    "cuales proyectos llevan mas del 90% de asignacion",
    "cuales proyectos llevan menos del 50% de asignacion",
    "cuales proyectos tienen menos de Q10M disponible",
    "cuales proyectos tienen mas de Q50M disponible",
    "que proyecto necesita atencion inmediata por presupuesto",
    "hay algun proyecto que haya superado su presupuesto",
    "que proyecto acaba de iniciar operaciones",
    "cuales son los proyectos de casas de RV4",
    "cuales son los proyectos de lotes de RV4",
    "cuanto suma el presupuesto de los proyectos de lotes",
    "cual es el proyecto de casas mas avanzado",
    "cual es el proyecto de lotes mas avanzado",
    "como se compara el avance de los proyectos de lotes vs los de casas",
    "como se compara el avance de Bosques de Jalapa vs Bosques de Pinula",
    "como se compara el avance de Condado La Ceiba vs Hacienda El Sol",
    "como van los proyectos de la familia Bosques",
    "como van los proyectos de la familia Condado",
    "como van los proyectos de la familia Hacienda",
    "cual es el proyecto de RV4 con mayor inversion total",
    "dame un resumen del estado actual de todos los proyectos",
    "como va el portafolio de RV4 en general",
    "en que proyectos deberia enfocarme esta semana",
    "que proyectos necesitan atencion inmediata",
    "cual es la situacion financiera general de RV4",
    "cuanto representa lo comprometido sobre el presupuesto total",
    "que tan eficiente ha sido la ejecucion del portafolio",
    "como va Bosques de Pinula",
    "como va Bosques de Santa Elena",
    "como va Hacienda El Sol",
    "como va Hacienda La Querencia",
    "como va Reserva del Bosque"
)

$agentHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $SERVICE_KEY"
    "apikey"        = $ANON_KEY
}

$total   = $PREGUNTAS.Count
$ok      = 0
$fallido = 0

Write-Host "[3/3] Seeding $total preguntas (~10 min)..."
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
        $res = Invoke-RestMethod -Uri $EDGE_URL -Method POST -Headers $agentHeaders -Body $body -TimeoutSec 60
        if ($res.reply) {
            $len     = $res.reply.Length
            $preview = $res.reply.Substring(0, [Math]::Min(120, $len))
            Write-Host "  OK - $preview..." -ForegroundColor Green
            $ok++
        } else {
            Write-Host "  WARN - respuesta vacia" -ForegroundColor Yellow
            $fallido++
        }
    } catch {
        Write-Host "  ERROR - $($_.Exception.Message)" -ForegroundColor Red
        $fallido++
    }

    if ($i -lt ($PREGUNTAS.Count - 1)) {
        Write-Host "  Esperando 12s..."
        Start-Sleep -Seconds 12
    }
}

Write-Host ""
Write-Host "RESULTADO: $ok OK  /  $fallido fallidos  /  $total total"
Write-Host ""
