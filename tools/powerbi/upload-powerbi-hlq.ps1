param(
    [string]$InputPath = "data/powerbi/hlq/resumen-powerbi.json",
    [string]$SupabaseUrl = "https://iipgrojliqeyycvgnkrc.supabase.co",
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

function Read-JsonFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolvedPath = Resolve-Path -LiteralPath $Path
    $json = [System.IO.File]::ReadAllText($resolvedPath.Path, [System.Text.Encoding]::UTF8)
    $json = $json.TrimStart([char]0xFEFF)
    return $json | ConvertFrom-Json
}

if ([string]::IsNullOrWhiteSpace($SupabaseServiceKey)) {
    $secureKey = Read-Host "Pega SUPABASE_SERVICE_ROLE_KEY" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try {
        $SupabaseServiceKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

if ([string]::IsNullOrWhiteSpace($SupabaseServiceKey)) {
    throw "Falta SUPABASE_SERVICE_ROLE_KEY."
}

$payload = Read-JsonFile -Path $InputPath
$metadata = $payload.metadata

$row = @(
    [ordered]@{
        project_key = $metadata.projectKey
        project_name = $metadata.projectName
        mes_a = $metadata.filters.mesA
        generated_at = $metadata.generatedAt
        workspace_id = $metadata.workspaceId
        report_id = $metadata.reportId
        dataset_id = $metadata.datasetId
        source = "Power BI Service"
        payload = $payload
        updated_at = (Get-Date).ToUniversalTime().ToString("o")
    }
)

$headers = @{
    apikey = $SupabaseServiceKey
    Authorization = "Bearer $SupabaseServiceKey"
    Prefer = "resolution=merge-duplicates,return=minimal"
}

$uri = "$SupabaseUrl/rest/v1/powerbi_resumen_cache?on_conflict=project_key"
$body = $row | ConvertTo-Json -Depth 100 -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bodyBytes | Out-Null

Write-Host "Supabase actualizado: $($metadata.projectKey) - $($metadata.projectName)" -ForegroundColor Green
