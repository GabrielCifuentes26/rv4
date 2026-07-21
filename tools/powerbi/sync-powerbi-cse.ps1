param(
    [string]$MesA = ( & {
        $meses = 'ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'
        $hoy = Get-Date
        '{0} {1}' -f $meses[$hoy.Month - 1], $hoy.ToString('yy')
    } ),
    [switch]$UploadSupabase,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

$accentUpperO = [char]0x00d3

$syncScript = Join-Path $PSScriptRoot "sync-powerbi-resumen.ps1"
$syncArgs = @{
    DatasetId            = "97aab5b3-d3a0-47c9-92c3-a5ceb4cd1d39"
    ProjectKey           = "cse"
    ProjectName          = "Condado Santa Elena"
    MesA                 = $MesA
    ModelProfile         = "hlq"
    OutputDir            = "data/powerbi/cse"
    IncludeFilterDetail  = $true
    AreaFilterValues     = @(("CONSTRUCCI" + $accentUpperO + "N"), ("URBANIZACI" + $accentUpperO + "N"))
    SupabaseServiceKey   = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}
