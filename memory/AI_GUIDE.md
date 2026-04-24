# Guia Para Claude, Codex y Otros Asistentes

Este proyecto usa la carpeta `memory/` como memoria interna. La idea es no releer toda la carpeta en cada sesion.

## Arranque Rapido

Antes de analizar o modificar codigo:

1. Lee `memory/README.md`.
2. Lee `memory/PROJECT_CONTEXT.md`.
3. Lee `memory/DAILY_LOG.md`.
4. Abre solo los archivos relacionados con la tarea actual.

No escanees `node_modules`, `.git` ni archivos generados salvo que la tarea lo pida.

## Como Trabajar

- El proyecto es una web estatica: HTML, CSS y JavaScript embebidos por pagina.
- Supabase es el backend real: autenticacion, usuarios, roles, solicitudes y tablas de modulos.
- Mantener el estilo actual de cada pagina.
- No introducir frameworks nuevos sin aprobacion.
- Si agregas una pagina o modulo nuevo, documentalo en `memory/PROJECT_CONTEXT.md`.
- Si cambias flujo, tablas, permisos, rutas, credenciales usadas o comportamiento importante, actualiza la memoria.

## Seguridad

- No pegar claves, tokens ni contraseñas nuevas en la documentacion.
- Si encuentras claves sensibles expuestas, mencionarlo como riesgo y proponer moverlo a backend, Supabase Edge Function o servidor seguro.
- No borrar trabajo existente sin confirmar.

## Cierre de Jornada

Antes de terminar una sesion larga:

1. Registrar cambios realizados.
2. Registrar archivos tocados.
3. Registrar decisiones.
4. Registrar pendientes y riesgos.
5. Actualizar `memory/PROJECT_CONTEXT.md` si cambio la arquitectura o la logica.
6. Actualizar `memory/DAILY_LOG.md` con la fecha del dia.
