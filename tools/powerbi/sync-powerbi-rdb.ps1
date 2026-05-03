param(
    [string]$MesA = "abr 26",
    [switch]$UploadSupabase,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

$accentUpperO = [char]0x00d3

$syncScript = Join-Path $PSScriptRoot "sync-powerbi-resumen.ps1"
$syncArgs = @{
    DatasetId            = "c794678f-11ea-40eb-ad76-bdf4603191be"
    ProjectKey           = "rdb"
    ProjectName          = "Reserva del Bosque"
    MesA                 = $MesA
    ModelProfile         = "hlq"
    OutputDir            = "data/powerbi/rdb"
    IncludeFilterDetail  = $true
    AreaFilterValues     = @(("CONSTRUCCI" + $accentUpperO + "N"), ("URBANIZACI" + $accentUpperO + "N"))
    SupabaseServiceKey   = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}
