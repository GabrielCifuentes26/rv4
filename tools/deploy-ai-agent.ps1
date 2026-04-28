param(
    [Parameter(Mandatory = $true)]
    [string]$GroqApiKey
)

$ErrorActionPreference = "Stop"
$ProjectRef = "iipgrojliqeyycvgnkrc"

Write-Host "[1/4] Verificando Supabase CLI..." -ForegroundColor Cyan
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host "[2/4] Vinculando proyecto Supabase..." -ForegroundColor Cyan
supabase link --project-ref $ProjectRef

Write-Host "[3/4] Configurando secreto GROQ_API_KEY..." -ForegroundColor Cyan
supabase secrets set GROQ_API_KEY=$GroqApiKey --project-ref $ProjectRef

Write-Host "[4/4] Desplegando Edge Function ai-agent..." -ForegroundColor Cyan
supabase functions deploy ai-agent --project-ref $ProjectRef

Write-Host ""
Write-Host "Listo. Edge Function desplegada en:" -ForegroundColor Green
Write-Host "https://$ProjectRef.supabase.co/functions/v1/ai-agent" -ForegroundColor White
