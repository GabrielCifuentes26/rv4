# Manual de Integración — Tablero Ejecución de Costos
**Sistema:** RV4 Hub Portal  
**Versión:** 1.0 — Mayo 2026

---

## ¿Qué hace esta integración?

Permite que el Hub Central:
1. **Inicie sesión automáticamente** al usuario en el tablero (sin que el usuario escriba usuario/contraseña)
2. **Consulte la lista de usuarios** con acceso al tablero
3. **Muestre métricas en tiempo real** en la tarjeta del Hub

---

## Datos de conexión

| Campo | Valor |
|---|---|
| URL del tablero | `https://gabrielcifuentes26.github.io/rv4/index.html` |
| Base URL endpoints | `https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/` |
| HUB_SECRET (SSO) | `8d98ed6a141f8a44ab565ac5200b89fbc178c2252778bed216b5d8b1a0b45858` |
| HUB_API_KEY (users/métricas) | `dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6` |

---

## Endpoint 1 — SSO (Login automático)

### Cómo funciona

```
Usuario hace clic en "Abrir tablero"
        ↓
Hub llama POST /sso con email del usuario
        ↓
El sistema devuelve un redirectUrl
        ↓
Hub redirige al usuario a ese redirectUrl
        ↓
Usuario entra al tablero sin escribir contraseña ✓
```

### Llamada

```
POST https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/sso
Content-Type: application/json

{
  "email":    "correo@rvcuatro.com",
  "nombre":   "Nombre Apellido",
  "hubToken": "8d98ed6a141f8a44ab565ac5200b89fbc178c2252778bed216b5d8b1a0b45858"
}
```

### Respuesta exitosa

```json
{
  "success": true,
  "token": null,
  "redirectUrl": "https://iipgrojliqeyycvgnkrc.supabase.co/auth/v1/verify?token=xxx..."
}
```

### Respuesta con error

```json
{ "error": "Token inválido." }        // hubToken incorrecto → HTTP 401
{ "error": "email y hubToken son requeridos." }  // faltan campos → HTTP 400
```

### ⚠️ Regla importante
El `redirectUrl` **expira en 1 hora** y **es de un solo uso**.  
El Hub debe llamar `/sso` justo cuando el usuario hace clic — nunca guardar el link en caché.

---

## Endpoint 2 — Lista de usuarios

### Llamada

```
GET https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg
x-api-key: dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6
```

### Respuesta

```json
[
  { "email": "gcifuentes@rvcuatro.com", "nombre": "Gabriel Cifuentes", "activo": true },
  { "email": "usuario2@rvcuatro.com",   "nombre": "Otro Usuario",      "activo": false }
]
```

---

## Endpoint 3 — Métricas para tarjeta del Hub

### Llamada

```
GET https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/metricas
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg
x-api-key: dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6
```

### Respuesta

```json
{
  "sistema": "Ejecución de Costos",
  "generadoEn": "2026-05-05T14:30:00.000Z",
  "metricas": [
    { "label": "Proyectos activos", "value": "6",         "trend": "abr 26"      },
    { "label": "Presupuesto total", "value": "Q 723.25M", "trend": null          },
    { "label": "Asignado",          "value": "Q 476.93M", "trend": "65.9%"       },
    { "label": "Disponible",        "value": "Q 246.32M", "trend": "34.1% libre" }
  ]
}
```

> Los datos se actualizan cada vez que se sincroniza Power BI.

---

## Pruebas rápidas con curl

```bash
# Probar SSO
curl -X POST https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/sso \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@rvcuatro.com","nombre":"Test","hubToken":"8d98ed6a141f8a44ab565ac5200b89fbc178c2252778bed216b5d8b1a0b45858"}'

# Probar usuarios
curl https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/users \
  -H "x-api-key: dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6"

# Probar métricas
curl https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1/metricas \
  -H "x-api-key: dba354b3d0fa795bfe0501b4d91123287c1a164fa6bfc99dffcf62372c879ad6"
```

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| HTTP 401 | API key o hubToken incorrecto | Verificar que el header/token no tenga espacios extra |
| HTTP 400 | Falta email o hubToken en el body | Revisar que el JSON tenga los 3 campos |
| HTTP 500 | Error interno | Contactar a Gabriel Cifuentes |
| redirectUrl no funciona | El link ya fue usado o expiró | Llamar `/sso` de nuevo |

---

## Contacto

**Responsable del tablero:** Gabriel Cifuentes  
**Correo:** gcifuentes@rvcuatro.com
