param(
    [string]$WorkspaceId = "d111fc11-b7f3-4976-b74b-99f47f06bd22",
    [string]$ReportName = "06_DashboardPresupuesto_HLQ",
    [string]$OutputPath = "data/powerbi/hlq/schema.json"
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[Power BI] $Message" -ForegroundColor Cyan
}

function Invoke-PowerBIDaxQuery {
    param(
        [Parameter(Mandatory = $true)][string]$WorkspaceId,
        [Parameter(Mandatory = $true)][string]$DatasetId,
        [Parameter(Mandatory = $true)][string]$Query
    )

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
    if ($parsed.results -and $parsed.results[0].tables -and $parsed.results[0].tables[0].rows) {
        return @($parsed.results[0].tables[0].rows)
    }

    return @()
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

function Invoke-OptionalDaxQuery {
    param(
        [Parameter(Mandatory = $true)][string]$WorkspaceId,
        [Parameter(Mandatory = $true)][string]$DatasetId,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Query,
        [Parameter(Mandatory = $true)]$ErrorList
    )

    try {
        Write-Info "Consultando schema: $Name"
        return Invoke-PowerBIDaxQuery -WorkspaceId $WorkspaceId -DatasetId $DatasetId -Query $Query
    }
    catch {
        $ErrorList.Add([ordered]@{
            name = $Name
            query = $Query
            message = Get-ErrorText -ErrorRecord $_
        }) | Out-Null
        return @()
    }
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")
$resolvedOutputPath = Join-Path $repoRoot $OutputPath
$outputFolder = Split-Path -Parent $resolvedOutputPath
if ($outputFolder -and -not (Test-Path -LiteralPath $outputFolder)) {
    New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null
}

Write-Info "Iniciando sesion de Power BI."
Connect-PowerBIServiceAccount | Out-Null

Write-Info "Buscando reporte: $ReportName"
$reports = @(((Invoke-PowerBIRestMethod -Url "groups/$WorkspaceId/reports" -Method Get) | ConvertFrom-Json).value)
$report = @($reports | Where-Object { $_.name -eq $ReportName } | Select-Object -First 1)[0]
if (-not $report) {
    throw "No se encontro el reporte '$ReportName'."
}

$datasetId = $report.datasetId
Write-Info "DatasetId: $datasetId"

$schemaErrors = New-Object System.Collections.Generic.List[object]
$tables = Invoke-OptionalDaxQuery -WorkspaceId $WorkspaceId -DatasetId $datasetId -Name "INFO.TABLES" -Query "EVALUATE INFO.TABLES()" -ErrorList $schemaErrors
$columns = Invoke-OptionalDaxQuery -WorkspaceId $WorkspaceId -DatasetId $datasetId -Name "INFO.COLUMNS" -Query "EVALUATE INFO.COLUMNS()" -ErrorList $schemaErrors
$measures = Invoke-OptionalDaxQuery -WorkspaceId $WorkspaceId -DatasetId $datasetId -Name "INFO.MEASURES" -Query "EVALUATE INFO.MEASURES()" -ErrorList $schemaErrors

$schema = @{
    report = @{
        name = $report.name
        id = $report.id
        datasetId = $datasetId
    }
    tables = @($tables)
    columns = @($columns)
    measures = @($measures)
    errors = @($schemaErrors.ToArray())
}

$json = $schema | ConvertTo-Json -Depth 100
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($resolvedOutputPath, $json, $utf8NoBom)
Write-Info "Schema exportado: $resolvedOutputPath"
