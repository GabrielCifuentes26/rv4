# Power BI export

Este flujo extrae datos del modelo semantico publicado en Power BI Service y los guarda localmente en `data/powerbi`.

## Preparar Supabase

Ejecuta una sola vez el archivo:

```text
database/powerbi_summary.sql
```

en Supabase > SQL Editor.

## Uso

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\powerbi\sync-powerbi-resumen.ps1
```

La primera ejecucion puede pedir inicio de sesion de Microsoft. Usa la cuenta que tiene acceso al reporte en Power BI.

## Salidas locales

- `data/powerbi/totales.json`
- `data/powerbi/porArea.json`
- `data/powerbi/porEtapa.json`
- `data/powerbi/porSegmento.json`
- `data/powerbi/porMes.json`
- `data/powerbi/porMesResumen.json`
- `data/powerbi/resumen-powerbi.json`

Los JSON generados contienen datos financieros y estan ignorados por Git para evitar publicarlos accidentalmente en GitHub Pages.

## Subir resumen a Supabase

Define la service role key solo en tu sesion local de PowerShell:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "pegar_service_role_key_aqui"
```

Despues ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\powerbi\sync-powerbi-resumen.ps1 -UploadSupabase
```

No guardes la service role key en archivos HTML, JS, PS1 o Git.
