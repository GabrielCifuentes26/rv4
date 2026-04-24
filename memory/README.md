# Memoria del Proyecto

Esta carpeta es el unico lugar donde debe vivir la memoria interna del proyecto.

## Leer Primero

Para retomar rapido una sesion, leer en este orden:

1. `README.md` - indice y reglas de esta carpeta.
2. `AI_GUIDE.md` - instrucciones para Claude, Codex u otro asistente.
3. `PROJECT_CONTEXT.md` - mapa tecnico vivo del sistema.
4. `DAILY_LOG.md` - ultima bitacora de trabajo.
5. `project_session_plan.md` - contexto historico del rediseño, solo si hace falta.

## Archivos

- `AI_GUIDE.md`: como debe trabajar cualquier asistente en este proyecto.
- `PROJECT_CONTEXT.md`: arquitectura, paginas, tablas, flujo y riesgos.
- `DAILY_LOG.md`: cierre diario de trabajo.
- `project_session_plan.md`: plan historico del rediseño de abril 2026.

## Estructura Ordenada del Proyecto

- `assets/js/`: scripts publicos compartidos.
- `database/`: scripts SQL.
- `tools/firebase/`: herramientas locales de Firebase.
- `archive/`: elementos antiguos o vacios que no deben estar sueltos en la raiz.
- `imagenes de proyectos/`: imagenes y logos usados por la pagina.

## Regla Principal

Cuando se haga un cambio importante, actualizar aqui:

- `PROJECT_CONTEXT.md` si cambio la logica, estructura, tablas, paginas, rutas o flujo.
- `DAILY_LOG.md` al final del dia con resumen, archivos tocados, decisiones y pendientes.

No guardar claves, tokens ni contraseñas en estos archivos.
