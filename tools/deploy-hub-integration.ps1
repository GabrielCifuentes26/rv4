$ErrorActionPreference = "Stop"
$ProjectRef  = "iipgrojliqeyycvgnkrc"
$SupabaseCLI = "$env:USERPROFILE\bin\supabase.exe"
$HUB_SECRET  = "8d98ed6a141f8a44ab565ac5200b89fbc178c2252778bed216b5d8b1a0b45858"
$HUB_API_KEY = "dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6"
# Actualiza esta URL cuando tengas el Firebase project ID
$TABLERO_URL = "https://tu-tablero.web.app"

Write-Host "[1/4] Configurando secretos en Supabase..." -ForegroundColor Cyan
& $SupabaseCLI secrets set HUB_SECRET=$HUB_SECRET     --project-ref $ProjectRef
& $SupabaseCLI secrets set HUB_API_KEY=$HUB_API_KEY   --project-ref $ProjectRef
& $SupabaseCLI secrets set TABLERO_URL=$TABLERO_URL    --project-ref $ProjectRef

Write-Host "[2/4] Desplegando funcion SSO..." -ForegroundColor Cyan
& $SupabaseCLI functions deploy sso      --project-ref $ProjectRef

Write-Host "[3/4] Desplegando funcion users..." -ForegroundColor Cyan
& $SupabaseCLI functions deploy users    --project-ref $ProjectRef

Write-Host "[4/4] Desplegando funcion metricas..." -ForegroundColor Cyan
& $SupabaseCLI functions deploy metricas --project-ref $ProjectRef

Write-Host ""
Write-Host "Integracion desplegada exitosamente." -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints para el equipo del Hub:" -ForegroundColor Yellow
Write-Host "  SSO:      POST https://$ProjectRef.supabase.co/functions/v1/sso"
Write-Host "  Usuarios: GET  https://$ProjectRef.supabase.co/functions/v1/users"
Write-Host "  Metricas: GET  https://$ProjectRef.supabase.co/functions/v1/metricas"
Write-Host ""
Write-Host "Secretos para compartir con el Hub (por canal seguro):" -ForegroundColor Yellow
Write-Host "  HUB_SECRET  (para SSO):  $HUB_SECRET"
Write-Host "  HUB_API_KEY (para APIs): $HUB_API_KEY"
Write-Host ""
Write-Host "PENDIENTE: Actualiza TABLERO_URL en este script con tu URL de Firebase." -ForegroundColor Red
