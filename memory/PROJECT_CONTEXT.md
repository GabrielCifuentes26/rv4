# Contexto Vivo del Proyecto

Ultima revision amplia: 2026-04-24

## Proposito

`Costos&Presupuestos` es una aplicacion web para control presupuestario y seguimiento operativo de proyectos. Es una web estatica con paginas HTML independientes que incluyen su propio CSS y JavaScript. Supabase funciona como backend para autenticacion, usuarios, roles, solicitudes, datos de modulos y metricas de actividad.

## Regla Para Nuevas Sesiones

Para continuar rapido:

1. Leer este archivo.
2. Leer `memory/DAILY_LOG.md`.
3. Abrir solo el archivo puntual que se vaya a cambiar.
4. Consultar `manual.html` solo si se necesita documentacion extensa o texto para usuario final.

## Flujo Principal

El flujo actual del sistema es:

`login.html` -> `index.html` -> `dashboard.html?project=NombreProyecto`

`login.html` valida credenciales con Supabase. Si el usuario existe en la tabla `usuarios`, redirige a `index.html`. Desde `index.html`, las tarjetas y marcadores del mapa envian al dashboard por parametro `project`.

## Arquitectura

- Frontend: HTML, CSS y JavaScript embebidos por pagina.
- Backend: Supabase Auth + Supabase Database.
- Graficas: Chart.js en `dashboard.html` y `cierre-contable.html`.
- Mapa: Leaflet + OpenStreetMap en `index.html`.
- Hosting previsto/configurado: Firebase Hosting con `firebase.json`; el manual tambien menciona GitHub Pages.
- Assets: `imagenes de proyectos/` contiene 6 imagenes `.webp` para el slider y logos RV4.
- Tracking: `assets/js/tracker.js` registra sesiones y vistas en tablas de Supabase.

## Estructura de Carpetas

- Raiz del proyecto: paginas HTML publicas principales (`index.html`, `login.html`, `admin.html`, etc.), `firebase.json`, `package.json` y apuntador `CLAUDE.md`.
- `assets/js/`: JavaScript publico compartido. Actualmente contiene `tracker.js`.
- `database/`: scripts SQL para Supabase. Actualmente contiene `setup.sql`.
- `imagenes de proyectos/`: imagenes y logos usados por la interfaz.
- `memory/`: memoria interna, guia para asistentes y bitacora diaria.
- `tools/firebase/`: scripts locales de configuracion Firebase.
- `archive/empty-folders/`: carpetas antiguas vacias archivadas para no dejarlas sueltas en la raiz.

## Paginas y Responsabilidades

### `login.html`

Login, registro, solicitud de acceso, seleccion de empresa `RV4` / `CONSBA`, solicitud de reinicio y cambio de contraseña por recovery link. Usa tablas `usuarios`, `solicitudes` y `solicitudes_reset`. El registro publico no crea usuario en Supabase Auth; crea una solicitud pendiente para evitar errores de correo de confirmacion.

### `index.html`

Inicio despues del login. Muestra hero con slider, categorias de proyectos, tarjetas, mapa Leaflet y navegacion a modulos. Lee rol en `usuarios` para mostrar boton Admin. Tiene datos de proyectos quemados en el arreglo `PROJECTS`.

### `dashboard.html`

Dashboard presupuestario por proyecto usando `?project=`. Los KPIs, tabla y graficas estan quemados por ahora. Usa Supabase solo para validar sesion y cerrar sesion. Incluye `assets/js/tracker.js`.

### `admin.html`

Panel administrador. Valida rol `admin` en `usuarios`. Gestiona usuarios, solicitudes de acceso, solicitudes de reinicio de contraseña y metricas de uso. Usa `usuarios`, `solicitudes`, `solicitudes_reset`, `sesiones` y `page_views`. Al aprobar una solicitud, crea el usuario en Supabase Auth si todavia no existe y lo marca con email confirmado.

### `cierre-contable.html`

Modulo de cierre contable. Maneja periodos, sociedades y 4 etapas por sociedad: Entrega de EEFF, Integraciones / ID Jobs, Revision y Cuadre Finalizado. Tiene vista tablero y vista analitica con Chart.js. Usa `cc_periodos`, `cc_sociedades`, `cc_cierres` y `usuarios`.

### `creacion-tableros.html`

Modulo para crear proyectos, fases, tareas, dependencias y cronograma tipo Gantt. Admin puede crear/editar/eliminar; usuario puede visualizar. Usa `ct_proyectos`, `ct_fases`, `ct_tareas` y `usuarios`.

### `avance-lotes.html`

Modulo de seguimiento de lotes. Maneja status de receta, fechas, responsables, carga en sistema, alertas, tabla, Gantt y exportacion CSV. Usa `al_proyectos` y `usuarios`. Si la tabla esta vacia y el usuario es admin, inserta datos seed.

### `manual.html`

Manual tecnico visual/imprimible. Explica el sistema, Supabase, roles, admin, login, diseño y modulos. Esta parcialmente desactualizado: habla de 6 modulos, pero el proyecto actual tambien tiene `avance-lotes.html`.

## Tablas Supabase Detectadas

- `usuarios`: perfiles, rol, empresa, nivel, estado y otros campos usados por admin/login.
- `solicitudes`: solicitudes de registro/aprobacion.
- `solicitudes_reset`: solicitudes de reinicio de contraseña.
- `cc_periodos`: periodos de cierre contable.
- `cc_sociedades`: sociedades por periodo.
- `cc_cierres`: etapas de cierre por sociedad.
- `ct_proyectos`: proyectos del modulo creacion de tableros.
- `ct_fases`: fases por proyecto.
- `ct_tareas`: tareas por fase/proyecto.
- `al_proyectos`: seguimiento de avance de lotes.
- `sesiones`: sesiones registradas por `tracker.js`.
- `page_views`: vistas de paginas registradas por `tracker.js`.

`database/setup.sql` crea/ajusta `usuarios`, `solicitudes`, `solicitudes_reset`, `cc_periodos`, `cc_sociedades` y `cc_cierres`. No contiene SQL para `ct_*`, `al_proyectos`, `sesiones` ni `page_views`.

## Roles

- `usuario`: puede entrar a paginas autenticadas y visualizar datos.
- `admin`: ve boton Admin y puede crear/editar/eliminar en modulos administrativos.

Las paginas consultan `usuarios.rol` para activar controles admin.

## Convenciones de Edicion

- Mantener CSS/JS embebido salvo que se acuerde refactor.
- Respetar navegacion compartida: logo, Presupuesto, Cronograma, Cierre Contable, Creacion de Tableros, Avance Lotes, Admin, Cerrar sesion.
- Si se agrega un modulo, actualizar:
  - navegacion en paginas relevantes;
  - este archivo;
  - `manual.html` si el cambio debe aparecer en documentacion formal;
  - SQL si requiere tablas nuevas.

## Riesgos Tecnicos Importantes

- Hay claves sensibles de Supabase expuestas en HTML/JS del navegador, incluyendo uso de `service_role` en algunas paginas/scripts.
- Hay logica que guarda o muestra `password_text`.
- Varias tablas usadas por el codigo no estan documentadas en `database/setup.sql`.
- `manual.html` y `memory/project_session_plan.md` no reflejan completamente el estado actual.

No repetir claves ni contraseñas en documentacion nueva. Si se corrige seguridad, mover operaciones privilegiadas a backend seguro, Supabase Edge Functions o servidor intermedio.

## Pendientes Conocidos

- Actualizar `manual.html` para incluir `avance-lotes.html`.
- Documentar o crear SQL de tablas faltantes: `ct_*`, `al_proyectos`, `sesiones` y `page_views`.
- Definir integracion futura con SAP Business One para `dashboard.html`.
- Reemplazar coordenadas de ejemplo por coordenadas reales de proyectos.
- Revisar seguridad de service keys y `password_text`.
