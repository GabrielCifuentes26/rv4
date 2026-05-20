# SESION_INICIO — Arranque rápido de sesión

**Leer este archivo primero.** Tiene todo lo necesario para retomar en menos de 2 minutos.

---

## REGLAS DE COMPORTAMIENTO

1. Respuestas ultra cortas — solo confirmar qué cambió + git push.
2. No mostrar código en el chat.
3. No dar explicaciones largas — sin tablas, sin listas de "qué hice".
4. Ejecutar directo — sin pedir confirmación innecesaria.
5. Siempre commit + push después de cada cambio, sin que el usuario lo pida.
6. Rol UI/UX expert — aplicar criterios de diseño moderno en todo lo visual.

---

## FRASES CLAVE

**Para iniciar sesión:**
> Lee memory/SESION_INICIO.md y memory/PROJECT_CONTEXT.md y dime en dónde nos quedamos

**Para cerrar sesión:**
> Actualiza memory/SESION_INICIO.md, memory/DAILY_LOG.md y memory/MAP.md con todo lo que hicimos hoy y haz commit + push

---

## FLUJO DE TRABAJO — DOS REPOSITORIOS

- **`rv4-dev`** → desarrollo activo. Aquí se hacen TODOS los cambios y pruebas.
  - GitHub Pages: `https://gabrielcifuentes26.github.io/rv4-dev/`
  - Repo: `https://github.com/GabrielCifuentes26/rv4-dev`
- **`rv4`** → producción. Solo recibe cambios cuando el usuario los aprueba desde dev.
  - GitHub Pages: `https://gabrielcifuentes26.github.io/rv4/`
  - Repo: `https://github.com/GabrielCifuentes26/rv4`

**Regla:** Nunca trabajar directo en `rv4`. Todo pasa primero por `rv4-dev`.

**Deploy ai-agent (cuando hay cambio en la Edge Function):**
```powershell
# El token está guardado como variable de entorno del sistema (SUPABASE_ACCESS_TOKEN)
npx supabase functions deploy ai-agent --project-ref iipgrojliqeyycvgnkrc
```

---

## ESTADO ACTUAL DEL PROYECTO — 2026-05-20

### Repositorio
- Path local: `c:\Users\gcifuentes\OneDrive - rvcuatro.com\Documentos\12. Paginas Web\01.Pagina Web C&P`
- Branch activo: `dev-work` (push a rv4-dev con `git push rv4-dev HEAD:main`)
- GitHub producción: `https://github.com/GabrielCifuentes26/rv4` (push con `git push origin HEAD:master`)
- Producción: `https://gabrielcifuentes26.github.io/rv4/index.html`
- Supabase project ref: `iipgrojliqeyycvgnkrc`

### Estructura de páginas (todo en producción al 2026-05-19)

| Archivo | Descripción |
|---|---|
| `index.html` | Dashboard principal con tarjetas CASAS y LOTES |
| `costo-m2-casas.html` | Costos por M² — 6 tarjetas + tabla tipología + gráfico comparativo |
| `costo-m2-lotes.html` | Costos por M² Lotes — placeholder |
| `ver-analisis-casas.html` | Ver análisis Casas — placeholder |
| `ver-analisis-lotes.html` | Ver análisis Lotes — placeholder |

### Tabla Supabase nueva: `casas_tipologia`
- Columnas: `project_key`, `m2`, `tipologia`, `costo_m2`, `fecha`, `is_current`
- Datos cargados: RDB y CSE (9 filas)
- Se actualiza 2-3 veces/mes — ingresar directo en Supabase table editor
- RLS: anon puede leer (`is_current=true`), authenticated puede escribir

### Lo que ya funciona

**Dashboard individual por proyecto:**
`dashboard-bdj.html`, `dashboard-bdp.html`, `dashboard-bse.html`, `dashboard-clc.html`, `dashboard-cse.html`, `dashboard-hlq.html`, `dashboard-hsl.html`, `dashboard-rdb.html`

**Página Costos por M² — `costo-m2-casas.html`:**
- Grid 3×2 de tarjetas por proyecto (datos desde Supabase + fallback JSON)
- Tabla "Costo de M² por Tipología" — columnas dinámicas por proyecto, IBC M² calculado
- Insight cards: "Más conveniente" y "Menos conveniente" (calculado automáticamente)
- Gráfico barras horizontales: Casas vs Urbanización, ordenado por costo, opacidad por promedio
- Chart.js + chartjs-plugin-datalabels + chartjs-plugin-annotation

**Agente de IA (ai-agent) — OPERATIVO y DEPLOYADO:**
- Edge Function en Supabase: `ai-agent`
- Caché semántico con pgvector (`qa_cache`)
- Fallback de modelos: llama-3.3-70b → llama-3.1-8b → gemma2-9b

**Chat widget:** `assets/js/chat-widget.js` — panel flotante dorado

**Sincronización Power BI:** `tools/powerbi/sync-powerbi-*.ps1`

### Pendientes conocidos

- **Agente IA — mejora real pendiente:** reemplazar el fix de "proyecto activo primero" por la solución correcta: si se detecta `activeKey`, hacer SELECT solo de ese proyecto (no los 8). Elimina el problema de truncado de raíz.
- **`ver-analisis-casas.html`** — contenido pendiente de construir (placeholder)
- **`ver-analisis-lotes.html`** — contenido pendiente de construir (placeholder)
- **`costo-m2-lotes.html`** — contenido pendiente de construir (placeholder)
- Coordenadas reales de proyectos en el mapa
- Seed de qa_cache — banco de preguntas frecuentes
- Integración SAP Business One (largo plazo)
