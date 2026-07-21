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
