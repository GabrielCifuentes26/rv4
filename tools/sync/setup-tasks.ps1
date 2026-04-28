#Requires -RunAsAdministrator
param(
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

$syncScript   = Resolve-Path (Join-Path $PSScriptRoot "sync-all-projects.ps1")
$serverScript = Resolve-Path (Join-Path $PSScriptRoot "start-sync-server.ps1")
$psExe        = "powershell.exe"
$psArgs       = "-WindowStyle Hidden -ExecutionPolicy Bypass -File"

# ── Guardar clave de Supabase ────────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($SupabaseServiceKey)) {
    $SupabaseServiceKey = Read-Host "Ingresa el SUPABASE_SERVICE_ROLE_KEY"
}
[System.Environment]::SetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", $SupabaseServiceKey, "User")
Write-Host "✓ SUPABASE_SERVICE_ROLE_KEY guardado como variable de entorno de usuario." -ForegroundColor Green

# ── Helper para crear/reemplazar tarea ──────────────────────────────────────
function Register-SyncTask {
    param(
        [string]$Name,
        [string]$ScriptPath,
        $Trigger
    )
    $action   = New-ScheduledTaskAction -Execute $psExe -Argument "$psArgs `"$ScriptPath`""
    $settings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew

    Unregister-ScheduledTask -TaskName $Name -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask `
        -TaskName $Name `
        -Action   $action `
        -Trigger  $Trigger `
        -Settings $settings `
        -RunLevel Highest `
        -Force | Out-Null

    Write-Host "  ✓ $Name" -ForegroundColor Green
}

Write-Host ""
Write-Host "Registrando tareas en el Programador de tareas de Windows..." -ForegroundColor Cyan
Write-Host ""

# Servidor local — arranca con el inicio de sesion de Windows
Register-SyncTask `
    -Name       "RV4 Sync Server" `
    -ScriptPath $serverScript `
    -Trigger    (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME)

# 8:30 AM — Lunes a Viernes
Register-SyncTask `
    -Name       "RV4 Sync 08:30" `
    -ScriptPath $syncScript `
    -Trigger    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "08:30")

# 3:00 PM — Lunes a Viernes
Register-SyncTask `
    -Name       "RV4 Sync 15:00" `
    -ScriptPath $syncScript `
    -Trigger    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "15:00")

# 6:00 PM — Lunes a Jueves
Register-SyncTask `
    -Name       "RV4 Sync 18:00" `
    -ScriptPath $syncScript `
    -Trigger    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday -At "18:00")

# 3:30 PM — Viernes
Register-SyncTask `
    -Name       "RV4 Sync Viernes 15:30" `
    -ScriptPath $syncScript `
    -Trigger    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At "15:30")

Write-Host ""
Write-Host "Configuracion completada." -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de tareas registradas:"
Get-ScheduledTask | Where-Object { $_.TaskName -like "RV4 Sync*" } |
    Select-Object TaskName, State |
    Format-Table -AutoSize

Write-Host "IMPORTANTE: El servidor RV4 arrancara la proxima vez que inicies sesion."
Write-Host "Para iniciarlo ahora sin reiniciar, ejecuta:"
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$serverScript`"" -ForegroundColor Yellow
