param(
    [string]$MesA = "abr 26",
    [switch]$UploadSupabase,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

$syncScript = Join-Path $PSScriptRoot "sync-powerbi-resumen.ps1"
$syncArgs = @{
    ReportName = "06_DashboardPresupuesto_HLQ"
    ProjectKey = "hlq"
    ProjectName = "Hacienda La Querencia"
    MesA = $MesA
    ModelProfile = "hlq"
    OutputDir = "data/powerbi/hlq"
    IncludeFilterDetail = $true
    SupabaseServiceKey = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}
