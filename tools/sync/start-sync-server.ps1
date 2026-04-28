$port       = 8765
$statusFile = "$env:TEMP\rv4-sync-status.json"
$syncScript = Join-Path $PSScriptRoot "sync-all-projects.ps1"

function Write-Status {
    param([string]$State, [string]$Message)
    @{ state = $State; message = $Message; updatedAt = (Get-Date -Format "dd/MM/yyyy HH:mm") } |
        ConvertTo-Json | Set-Content $statusFile -Encoding UTF8
}

function Get-StatusJson {
    if (Test-Path $statusFile) { return Get-Content $statusFile -Raw -Encoding UTF8 }
    return '{"state":"idle","message":"Servidor listo","updatedAt":""}'
}

Write-Status -State "idle" -Message "Servidor listo"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "[RV4 Server] Escuchando en http://localhost:$port/" -ForegroundColor Cyan

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $res.Headers.Add("Access-Control-Allow-Origin",  "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $res.ContentType = "application/json; charset=utf-8"

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 204
            $res.Close()
            continue
        }

        $path = $req.Url.LocalPath

        $json = switch ($path) {

            "/health" { '{"state":"ok"}' }

            "/status" { Get-StatusJson }

            "/sync" {
                $cur = Get-StatusJson | ConvertFrom-Json
                if ($cur.state -eq "running") {
                    '{"state":"running","message":"Ya hay una sincronizacion en progreso"}'
                } else {
                    Write-Status -State "running" -Message "Iniciando sincronizacion..."

                    Start-Job -ScriptBlock {
                        param($script, $file, $key)
                        $env:SUPABASE_SERVICE_ROLE_KEY = $key
                        try {
                            & $script
                            @{ state="completed"; message="Dashboards actualizados correctamente"; updatedAt=(Get-Date -Format "dd/MM/yyyy HH:mm") } |
                                ConvertTo-Json | Set-Content $file -Encoding UTF8
                        } catch {
                            @{ state="error"; message=$_.Exception.Message; updatedAt=(Get-Date -Format "dd/MM/yyyy HH:mm") } |
                                ConvertTo-Json | Set-Content $file -Encoding UTF8
                        }
                    } -ArgumentList $syncScript, $statusFile, $env:SUPABASE_SERVICE_ROLE_KEY | Out-Null

                    '{"state":"running","message":"Sincronizacion iniciada"}'
                }
            }

            default {
                $res.StatusCode = 404
                '{"error":"Not found"}'
            }
        }

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()

    } catch {
        Write-Warning "[RV4 Server] Error: $_"
        try { $ctx.Response.Close() } catch {}
    }
}
