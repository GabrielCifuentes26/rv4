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
    DatasetId            = "245c5962-1238-43bb-88ba-5dce10fbbfab"
    ProjectKey           = "bdp"
    ProjectName          = "Bosques de Pinula"
    MesA                 = $MesA
    ModelProfile         = "bse"
    OutputDir            = "data/powerbi/bdp"
    IncludeFilterDetail  = $true
    AreaFilterValues     = @(("CONSTRUCCI" + $accentUpperO + "N"), ("URBANIZACI" + $accentUpperO + "N"), "COSTO INDIRECTO", "PRELIMINAR")
    SupabaseServiceKey   = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}

