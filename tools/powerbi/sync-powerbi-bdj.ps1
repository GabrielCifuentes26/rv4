param(
    [string]$MesA = "abr 26",
    [switch]$UploadSupabase,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

$accentUpperO = [char]0x00d3

$syncScript = Join-Path $PSScriptRoot "sync-powerbi-resumen.ps1"
$syncArgs = @{
    ReportName           = "05_DashboardPresupuesto_BDJ"
    DatasetId            = "55c99fdf-ea52-4217-8493-fd85b0ff4742"
    ProjectKey           = "bdj"
    ProjectName          = "Bosques de Jalapa"
    MesA                 = $MesA
    ModelProfile         = "hlq"
    OutputDir            = "data/powerbi/bdj"
    IncludeFilterDetail  = $true
    AreaFilterValues     = @(("CONSTRUCCI" + $accentUpperO + "N"), ("URBANIZACI" + $accentUpperO + "N"))
    SupabaseServiceKey   = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}
