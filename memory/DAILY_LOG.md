# Bitacora Diaria

Usar este archivo al final de cada dia de trabajo. La entrada mas reciente debe quedar arriba.

## Plantilla

### YYYY-MM-DD

Resumen:
- 

Archivos modificados:
- 

Decisiones:
- 

Pendientes:
- 

Riesgos/notas:
- 

---

### 2026-04-24

Resumen:
- Se reviso la carpeta completa del proyecto sin modificar codigo funcional.
- Se leyo `manual.html` y se comparo contra las paginas reales.
- Se creo memoria interna para que Claude, Codex u otro asistente pueda retomar rapido sin releer todo.
- Se ordeno la estructura del proyecto moviendo soporte interno a carpetas dedicadas.
- Se corrigio el registro publico para que no dependa del correo de confirmacion de Supabase.

Archivos modificados:
- `CLAUDE.md`
- `admin.html`
- `cierre-contable.html`
- `dashboard.html`
- `login.html`
- `firebase.json`
- `assets/js/tracker.js`
- `database/setup.sql`
- `tools/firebase/auto-setup.js`
- `tools/firebase/setup-firebase.js`
- `tools/firebase/INICIAR-FIREBASE.bat`
- `archive/empty-folders/`
- `memory/README.md`
- `memory/AI_GUIDE.md`
- `memory/PROJECT_CONTEXT.md`
- `memory/DAILY_LOG.md`

Decisiones:
- Usar `memory/PROJECT_CONTEXT.md` como fuente rapida de contexto tecnico.
- Usar `memory/DAILY_LOG.md` como registro diario de avances.
- Mantener `manual.html` como documentacion formal/imprimible, pero no como memoria operativa principal.
- Mantener las paginas HTML principales en la raiz para no romper URLs ni navegacion.
- Mover `tracker.js` a `assets/js/` y actualizar referencias.
- Mover `setup.sql` a `database/`.
- Mover scripts Firebase a `tools/firebase/`.
- El registro publico crea solo una fila pendiente en `solicitudes`; la aprobacion admin crea el usuario en Supabase Auth.

Pendientes:
- Actualizar `manual.html` para incluir el modulo `avance-lotes.html`.
- Documentar SQL faltante para tablas `ct_*`, `al_proyectos`, `sesiones` y `page_views`.
- Revisar exposicion de claves sensibles y uso de `password_text`.

Riesgos/notas:
- Hay claves sensibles y operaciones privilegiadas en codigo de navegador.
- El manual esta parcialmente desactualizado frente al codigo actual.
