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
