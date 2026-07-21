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

$syncScript = Join-Path $PSScriptRoot "sync-powerbi-resumen.ps1"
$syncArgs = @{
    ReportName  = "DashboardPresupuesto_CLC"
    DatasetId   = "c6f440f9-0bef-4c32-b6d0-d0b1ffe992de"
    ProjectKey  = "clc"
    ProjectName = "Condado La Ceiba"
    MesA        = $MesA
    ModelProfile        = "hsl"
    OutputDir           = "data/powerbi/clc"
    IncludeFilterDetail = $true
    AreaFilterValues    = @("CONSTRUCCION", "URBANIZACION")
    SupabaseServiceKey  = $SupabaseServiceKey
}

if ($UploadSupabase) {
    & $syncScript @syncArgs -UploadSupabase
} else {
    & $syncScript @syncArgs
}
