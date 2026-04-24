---
name: Plan de sesión — Rediseño completo de la plataforma
description: Documenta todos los cambios acordados en la sesión de rediseño (abril 2026): tema claro, categorías de proyectos, mapa Leaflet, admin con empresa
type: project
---

# Rediseño completo — Sesión Abril 2026

## Resumen de cambios acordados

### Flujo de navegación
Login (`login.html`) → Inicio (`index.html`) → Dashboard del proyecto (`dashboard.html?project=NombreProyecto`)

---

## 1. Tema visual (todas las páginas)
- **De:** Oscuro (fondo #08080f, texto blanco, acento verde #4ade80)
- **A:** Claro (fondo blanco/#f8fafc, texto navy #0f172a, acento azul cielo, botones naranja)
- Referencia de estilo: diseño tipo Houlist (real estate moderno)
- Muchas animaciones: hover, entrada de sección, transición de categorías

**Paleta nueva:**
| Elemento | Color |
|---|---|
| Fondo principal | #f8fafc |
| Texto principal | #0f172a |
| Texto secundario | #64748b |
| Acento azul | #0ea5e9 |
| Botón CTA | #f97316 (naranja) |
| Card bg | #ffffff |
| Nav bg | blanco translúcido |

---

## 2. index.html — Cambios

### Navbar
- Quitar: todos los menús (Inicio, Características, Desarrollos, Contacto)
- Quitar: botones "Iniciar sesión" y "Dashboard"
- Quitar: número de teléfono
- Mantener: solo el logo "Costos&Presupuestos"

### Sección Categorías (antes "Características destacadas")
- Título cambia a: **"Proyectos"**
- De 4 tarjetas → 3 tarjetas de categoría:
  - **Casas** (ícono 🏠)
  - **Lotes** (ícono 🌿)
  - **Edificios** (ícono 🏢)
- Al hacer clic: filtra las tarjetas de proyectos Y el mapa simultáneamente
- Animación de selección (borde destacado, transición suave)

### Sección Proyectos (antes "Proyectos disponibles")
- Título: **"Proyectos en Ejecución"**
- Layout: **izquierda tarjetas | derecha mapa Leaflet**
- Tarjetas estilo Greenfield: ícono, nombre, ubicación, precio, hab/baños/m²
- **SIN badge de estado**
- Al inicio: muestra todos los proyectos
- Al seleccionar categoría: filtra y anima el cambio

### Mapa (Leaflet.js + OpenStreetMap)
- Posición: lado derecho de las tarjetas
- Al inicio: todos los proyectos visibles (todos los marcadores)
- Al seleccionar categoría: solo marcadores de esa categoría
- Clic en marcador: muestra nombre + navega a `dashboard.html?project=NombreProyecto`
- Coordenadas: ejemplo (Guatemala), reemplazables luego

---

## 3. Proyectos por categoría

### Casas (8 proyectos)
| # | Nombre | Coord. ejemplo |
|---|---|---|
| 1 | Providencia | 14.6400, -90.5100 |
| 2 | Armonía | 14.6200, -90.5300 |
| 3 | Condado Santa Elena | 16.9200, -89.8900 |
| 4 | Reserva del Bosque | 14.5800, -90.6200 |
| 5 | Bosques de Jalapa | 14.6340, -89.9880 |
| 6 | La Serenidad/Querencia | 14.6100, -90.5800 |
| 7 | Bosques de Pinula | 14.5600, -90.4700 |
| 8 | Bosques de Santa Elena | 14.6500, -90.5200 |

### Lotes (13 proyectos)
| # | Nombre | Coord. ejemplo |
|---|---|---|
| 1 | Condado La Ceiba | 14.6800, -90.4800 |
| 2 | Hacienda Jumay | 14.6340, -89.9880 |
| 3 | Condado Jutiapa | 14.2900, -89.9000 |
| 4 | Condado Zacapa (Oasis) | 14.9700, -89.5300 |
| 5 | Hacienda Sol | 14.7000, -90.4500 |
| 6 | Club Campestre Jumay | 14.6200, -89.9700 |
| 7 | Club del Bosque | 14.5900, -90.6000 |
| 8 | Hacienda Santa Lucía | 14.3500, -90.6600 |
| 9 | Celajes de Tecpán | 14.7700, -91.0000 |
| 10 | Arbolera de Santa Elena | 16.9200, -89.8700 |
| 11 | Hacienda El Cafetal | 14.4500, -90.7500 |
| 12 | Club Progreso Jutiapa | 14.2800, -89.9100 |
| 13 | Cañadas de Jalapa | 14.6200, -89.9700 |

### Edificios (1 proyecto)
| # | Nombre | Coord. ejemplo |
|---|---|---|
| 1 | Salucentro Zacapa | 14.9700, -89.5400 |

---

## 4. dashboard.html — Cambios

- **Tema:** Claro (mismo sistema de colores)
- **Identificación de proyecto:** recibe `?project=NombreProyecto` en la URL
- **Métricas principales (3 KPIs grandes):**
  - Presupuesto Inicial / RDI
  - Ejecutado
  - % de Ejecución
- Tabla y gráficas existentes se mantienen con el nuevo tema
- Datos: quemados por ahora, luego integración con SAP Business One (vía Python u otra herramienta)

---

## 5. admin.html — Cambios

- **Tema:** Claro
- **Campo nuevo en modal de usuario:** Empresa (dropdown: RV4 / CONSBA)
- **Filtro por empresa:** opción de asignar acceso por persona O por empresa
- **Tabla de usuarios:** mostrar columna "Empresa"
- Toda la lógica Supabase existente se conserva

---

## 6. login.html — Cambios

- **Tema:** Claro
- Layout de dos paneles se conserva
- Panel izquierdo: datos decorativos con nuevo tema
- Panel derecho: formulario con nuevo tema
- Toda la lógica Supabase auth se conserva
- Al autenticarse correctamente: redirige a `index.html` (no a dashboard)

**Why:** El flujo correcto es Login → Inicio → Dashboard. Antes redirigía directo al dashboard.

---

## Pendiente futuro

- Coordenadas reales de los proyectos (reemplazar las de ejemplo)
- Integración con SAP Business One para datos del dashboard
- Personalización de íconos/imágenes de cada proyecto
- Definir qué campos mostrar en tarjetas de Lotes y Edificios (diferente a Casas)
- Asignación de proyectos por usuario en admin (permisos granulares)
