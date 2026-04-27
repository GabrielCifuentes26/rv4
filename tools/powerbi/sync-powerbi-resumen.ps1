param(
    [string]$WorkspaceId = "d111fc11-b7f3-4976-b74b-99f47f06bd22",
    [string]$ReportId = "f3fdef8d-947a-4e1a-9188-c774420fde9c",
    [string]$DatasetId = "",
    [string]$ProjectKey = "bse",
    [string]$ProjectName = "Bosques de Santa Elena",
    [string]$MesA = "abr 26",
    [string]$OutputDir = "data/powerbi",
    [switch]$UploadSupabase,
    [string]$SupabaseUrl = "https://iipgrojliqeyycvgnkrc.supabase.co",
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[Power BI] $Message" -ForegroundColor Cyan
}

function ConvertTo-Utf8JsonFile {
    param(
        [Parameter(Mandatory = $true)]$InputObject,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $json = $InputObject | ConvertTo-Json -Depth 100
    $folder = Split-Path -Parent $Path
    if ($folder -and -not (Test-Path -LiteralPath $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
    }
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $folder).Path + "\" + (Split-Path -Leaf $Path), $json, [System.Text.Encoding]::UTF8)
}

function Invoke-PowerBIDaxQuery {
    param(
        [Parameter(Mandatory = $true)][string]$WorkspaceId,
        [Parameter(Mandatory = $true)][string]$DatasetId,
        [Parameter(Mandatory = $true)][string]$Query,
        [Parameter(Mandatory = $true)][string]$Name
    )

    Write-Info "Ejecutando consulta: $Name"
    $body = @{
        queries = @(
            @{
                query = $Query
            }
        )
        serializerSettings = @{
            includeNulls = $true
        }
    } | ConvertTo-Json -Depth 20

    $response = Invoke-PowerBIRestMethod `
        -Url "groups/$WorkspaceId/datasets/$DatasetId/executeQueries" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    $parsed = $response | ConvertFrom-Json
    $rows = @()
    if ($parsed.results -and $parsed.results[0].tables -and $parsed.results[0].tables[0].rows) {
        $rows = @($parsed.results[0].tables[0].rows)
    }

    return @{
        name = $Name
        query = $Query
        rows = $rows
        raw = $parsed
    }
}

function Get-ErrorText {
    param([Parameter(Mandatory = $true)]$ErrorRecord)

    $parts = New-Object System.Collections.Generic.List[string]
    $parts.Add($ErrorRecord.Exception.Message)

    if ($ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        $parts.Add($ErrorRecord.ErrorDetails.Message)
    }

    $exception = $ErrorRecord.Exception
    while ($exception.InnerException) {
        $exception = $exception.InnerException
        $parts.Add($exception.Message)
    }

    $parts.Add(($ErrorRecord | Format-List * -Force | Out-String))
    return ($parts | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join "`n"
}

function Publish-SupabaseResumen {
    param(
        [Parameter(Mandatory = $true)]$Payload,
        [Parameter(Mandatory = $true)][string]$SupabaseUrl,
        [Parameter(Mandatory = $true)][string]$SupabaseServiceKey,
        [Parameter(Mandatory = $true)][string]$ProjectKey,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$MesA,
        [Parameter(Mandatory = $true)][string]$WorkspaceId,
        [Parameter(Mandatory = $true)][string]$ReportId,
        [Parameter(Mandatory = $true)][string]$DatasetId
    )

    if ([string]::IsNullOrWhiteSpace($SupabaseServiceKey)) {
        throw "Falta SUPABASE_SERVICE_ROLE_KEY. Define la variable de entorno o pasa -SupabaseServiceKey."
    }

    $row = @(
        [ordered]@{
            project_key = $ProjectKey
            project_name = $ProjectName
            mes_a = $MesA
            generated_at = $Payload.metadata.generatedAt
            workspace_id = $WorkspaceId
            report_id = $ReportId
            dataset_id = $DatasetId
            source = "Power BI Service"
            payload = $Payload
            updated_at = (Get-Date).ToUniversalTime().ToString("o")
        }
    )

    $headers = @{
        apikey = $SupabaseServiceKey
        Authorization = "Bearer $SupabaseServiceKey"
        Prefer = "resolution=merge-duplicates,return=minimal"
    }

    $uri = "$SupabaseUrl/rest/v1/powerbi_resumen_cache"
    $body = $row | ConvertTo-Json -Depth 100
    Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ContentType "application/json" -Body $body | Out-Null
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
$outputPath = Join-Path $repoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

Write-Info "Iniciando sesion. Usa tu cuenta de Microsoft con acceso al reporte."
Connect-PowerBIServiceAccount | Out-Null

if ([string]::IsNullOrWhiteSpace($DatasetId)) {
    Write-Info "Resolviendo dataset desde el reporte $ReportId"
    $reportResponse = Invoke-PowerBIRestMethod -Url "groups/$WorkspaceId/reports/$ReportId" -Method Get
    $report = $reportResponse | ConvertFrom-Json
    $DatasetId = $report.datasetId
}

if ([string]::IsNullOrWhiteSpace($DatasetId)) {
    throw "No se pudo resolver el DatasetId. Ejecuta el script pasando -DatasetId."
}

Write-Info "WorkspaceId: $WorkspaceId"
Write-Info "ReportId: $ReportId"
Write-Info "DatasetId: $DatasetId"

$metadata = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    workspaceId = $WorkspaceId
    reportId = $ReportId
    datasetId = $DatasetId
    projectKey = $ProjectKey
    projectName = $ProjectName
    filters = [ordered]@{
        areas = @("Construccion", "Urbanizacion")
        mesA = $MesA
    }
    source = "Power BI Service"
}

$areaFilterDax = 'TREATAS({"Construcci" & UNICHAR(243) & "n", "Urbanizaci" & UNICHAR(243) & "n"}, ''Rubros''[Area])'
$monthFilterDax = "TREATAS({`"$MesA`"}, 'Calendario'[MesA])"

$queries = [ordered]@{
    totales = @"
EVALUATE
SUMMARIZECOLUMNS(
    $areaFilterDax,
    $monthFilterDax,
    "RdiTotal", 'Medidas'[RDI Total],
    "PresupuestoErequester", 'Medidas'[Presupuesto Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester],
    "ComprometidoErequester", 'Medidas'[Comprometido Erequester],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "DisponibleErequester", 'Medidas'[Disponible Erequester],
    "PorcentajeAsignado", 'Medidas'[% Asignado],
    "PorcentajeDisponible", 'Medidas'[% Disponible]
)
"@
    porArea = @"
EVALUATE
SUMMARIZECOLUMNS(
    'Rubros'[Area],
    $areaFilterDax,
    $monthFilterDax,
    "RdiTotal", 'Medidas'[RDI Total],
    "PresupuestoErequester", 'Medidas'[Presupuesto Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester],
    "ComprometidoErequester", 'Medidas'[Comprometido Erequester],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "DisponibleErequester", 'Medidas'[Disponible Erequester],
    "PorcentajeAsignado", 'Medidas'[% Asignado],
    "PorcentajeDisponible", 'Medidas'[% Disponible]
)
ORDER BY 'Rubros'[Area]
"@
    porEtapa = @"
EVALUATE
SUMMARIZECOLUMNS(
    'Rubros'[Etapa],
    $areaFilterDax,
    $monthFilterDax,
    "RdiTotal", 'Medidas'[RDI Total],
    "PresupuestoErequester", 'Medidas'[Presupuesto Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester],
    "ComprometidoErequester", 'Medidas'[Comprometido Erequester],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "DisponibleErequester", 'Medidas'[Disponible Erequester],
    "PorcentajeAsignado", 'Medidas'[% Asignado],
    "PorcentajeDisponible", 'Medidas'[% Disponible]
)
ORDER BY 'Rubros'[Etapa]
"@
    porSegmento = @"
EVALUATE
SUMMARIZECOLUMNS(
    'Rubros'[Segmento],
    $areaFilterDax,
    $monthFilterDax,
    "RdiTotal", 'Medidas'[RDI Total],
    "PresupuestoErequester", 'Medidas'[Presupuesto Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester],
    "ComprometidoErequester", 'Medidas'[Comprometido Erequester],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "DisponibleErequester", 'Medidas'[Disponible Erequester],
    "PorcentajeAsignado", 'Medidas'[% Asignado],
    "PorcentajeDisponible", 'Medidas'[% Disponible]
)
ORDER BY 'Rubros'[Segmento]
"@
    porMes = @"
EVALUATE
SUMMARIZECOLUMNS(
    'Calendario'[MesA],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester]
)
ORDER BY 'Calendario'[MesA]
"@
    porMesResumen = @"
EVALUATE
SUMMARIZECOLUMNS(
    'Calendario'[MesA],
    $areaFilterDax,
    "RdiTotal", 'Medidas'[RDI Total],
    "PresupuestoErequester", 'Medidas'[Presupuesto Erequester],
    "EjecutadoErequester", 'Medidas'[Ejecutado Erequester],
    "ComprometidoErequester", 'Medidas'[Comprometido Erequester],
    "AsignadoErequester", 'Medidas'[Asignado Erequester],
    "DisponibleErequester", 'Medidas'[Disponible Erequester],
    "PorcentajeAsignado", 'Medidas'[% Asignado],
    "PorcentajeDisponible", 'Medidas'[% Disponible]
)
ORDER BY 'Calendario'[MesA]
"@
}

$results = [ordered]@{
    metadata = $metadata
    datasets = [ordered]@{}
    errors = @()
}

foreach ($entry in $queries.GetEnumerator()) {
    try {
        $queryResult = Invoke-PowerBIDaxQuery -WorkspaceId $WorkspaceId -DatasetId $DatasetId -Query $entry.Value -Name $entry.Key
        $results.datasets[$entry.Key] = $queryResult.rows
        ConvertTo-Utf8JsonFile -InputObject @{
            metadata = $metadata
            name = $entry.Key
            rows = $queryResult.rows
        } -Path (Join-Path $outputPath "$($entry.Key).json")
    }
    catch {
        $message = Get-ErrorText -ErrorRecord $_
        $results.errors += @{
            name = $entry.Key
            message = $message
        }
        Write-Host "[Power BI] Error en $($entry.Key): $message" -ForegroundColor Yellow
    }
}

ConvertTo-Utf8JsonFile -InputObject $results -Path (Join-Path $outputPath "resumen-powerbi.json")
Write-Info "Exportacion finalizada: $outputPath"

if ($UploadSupabase) {
    Write-Info "Subiendo resumen a Supabase: $ProjectKey"
    Publish-SupabaseResumen `
        -Payload $results `
        -SupabaseUrl $SupabaseUrl `
        -SupabaseServiceKey $SupabaseServiceKey `
        -ProjectKey $ProjectKey `
        -ProjectName $ProjectName `
        -MesA $MesA `
        -WorkspaceId $WorkspaceId `
        -ReportId $ReportId `
        -DatasetId $DatasetId
    Write-Info "Supabase actualizado correctamente."
}
