# API — Costos & Presupuestos

Base URL: `https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1`

Todas las peticiones requieren el header:
```
x-api-key: [clave proporcionada por el administrador]
```

---

## 1. Costo por M² por Tipología

**GET** `/costo-m2`

Devuelve el costo por m² de construcción agrupado por metros y tipo de casa (Duplex / Individual / Apartamento), con comparativa entre proyectos.

### Proyectos disponibles en esta API

| Código | Proyecto |
|--------|----------|
| BDJ | Bosques de Jalapa |
| CSE | Condado Santa Elena |
| HLQ | Hacienda La Querencia |
| RDB | Reserva del Bosque |

> BDP y BSE aún no tienen datos de tipología cargados.

### Respuesta — estructura

```json
{
  "sistema": "Costo por M² por Tipología — Costos&Presupuestos",
  "generadoEn": "2025-01-15T10:30:00.000Z",
  "moneda": "GTQ",
  "tipo_cambio_referencia": "GTQ/USD ≈ 7.80",
  "ultima_actualizacion": "2025-01-01",
  "proyectos_disponibles": [
    { "codigo": "BDJ", "nombre": "Bosques de Jalapa" },
    { "codigo": "CSE", "nombre": "Condado Santa Elena" },
    { "codigo": "HLQ", "nombre": "Hacienda La Querencia" },
    { "codigo": "RDB", "nombre": "Reserva del Bosque" }
  ],
  "tipologias": [
    {
      "metros_construccion": 240,
      "tipologia": "Duplex",
      "moneda": "GTQ",
      "promedio_costo_m2_gtq": 3500.00,
      "ibc_pct": 6.86,
      "incluye": "Costo directo de construcción de la unidad habitacional. No incluye urbanización, indirectos, licencias ni equipamiento.",
      "proyectos": {
        "BDJ": {
          "codigo_proyecto": "BDJ",
          "nombre_proyecto": "Bosques de Jalapa",
          "costo_m2_gtq": 3371,
          "fecha_vigencia": "2025-01-01"
        },
        "CSE": {
          "codigo_proyecto": "CSE",
          "nombre_proyecto": "Condado Santa Elena",
          "costo_m2_gtq": 3629,
          "fecha_vigencia": "2025-01-01"
        },
        "HLQ": null,
        "RDB": null
      }
    }
  ],
  "masConveniente": {
    "metros_construccion": 240,
    "tipologia": "Duplex",
    "promedio_costo_m2_gtq": 3500.00,
    "ibc_pct": 6.86
  },
  "menosConveniente": {
    "metros_construccion": 85,
    "tipologia": "Individual",
    "promedio_costo_m2_gtq": 5100.00,
    "ibc_pct": 1.67
  }
}
```

### Campos — referencia a los 9 requisitos

| Requisito | Campo en la respuesta |
|-----------|----------------------|
| 1. Proyecto | `proyectos.BDJ.nombre_proyecto` / `proyectos_disponibles[].nombre` |
| 2. Tipo/modelo | `tipologia` (ej. "Duplex", "Individual") |
| 3. Metros cuadrados | `metros_construccion` |
| 4. Costo por m² | `proyectos.BDJ.costo_m2_gtq` (por proyecto) / `promedio_costo_m2_gtq` (promedio) |
| 5. Costo unitario total | **No viene directo** — calcular: `metros_construccion × costo_m2_gtq` |
| 6. Moneda | `moneda` = "GTQ" / `tipo_cambio_referencia` = "GTQ/USD ≈ 7.80" |
| 7. Fecha de vigencia | `proyectos.BDJ.fecha_vigencia` |
| 8. Qué incluye | `incluye` — viene en cada tipología |
| 9. Código para cruzar | `proyectos.BDJ.codigo_proyecto` = "BDJ" (mismo código en ambas APIs) |

### Nota sobre `null` en proyectos

Si un proyecto aparece como `null` dentro de `proyectos`, significa que no tiene datos de esa tipología en el período actual. Los proyectos disponibles siempre están listados en `proyectos_disponibles`.

### IBC M² (`ibc_pct`)

Índice de Balance Construcción: `(metros / promedio_costo_m2) × 100`. Mayor = más metros por quetzal = más conveniente.

---

## 2. Costo por M² por Proyecto

**GET** `/proyectos-m2`

Devuelve el costo total por m² de cada proyecto (casas + urbanización + total), en GTQ y USD.

### Proyectos disponibles en esta API

| Código | Proyecto |
|--------|----------|
| bdj | Bosques de Jalapa |
| bdp | Bosques de Pinula |
| bse | Bosques de Santa Elena |
| cse | Condado Santa Elena |
| hlq | Hacienda La Querencia |
| rdb | Reserva del Bosque |

### Respuesta — estructura

```json
{
  "sistema": "Costo por M² por Proyecto — Costos&Presupuestos",
  "generadoEn": "2025-01-15T10:30:00.000Z",
  "tipo_cambio_usd": 7.8,
  "proyectos": [
    {
      "key": "bdj",
      "nombre": "Bosques de Jalapa",
      "costo_m2_total_q": 5200,
      "costo_m2_total_usd": 667,
      "casas": {
        "costos_q": 85000000,
        "m2": 16566,
        "costo_m2_q": 5130,
        "costo_m2_usd": 658
      },
      "urbanizacion": {
        "costos_q": 190000000,
        "m2": 36248,
        "costo_m2_q": 5241,
        "costo_m2_usd": 672
      },
      "total": {
        "costos_q": 275000000,
        "m2": 52815,
        "costo_m2_q": 5200,
        "costo_m2_usd": 667
      },
      "pct_casas": 30.9,
      "pct_urbanizacion": 69.1,
      "ultima_actualizacion": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

### Campos — referencia a los 9 requisitos

| Requisito | Campo en la respuesta |
|-----------|----------------------|
| 1. Proyecto | `nombre` / `key` |
| 2. Tipo/modelo | Esta API es a nivel proyecto completo, no por tipología. Usar `/costo-m2` para tipologías |
| 3. Metros cuadrados | `casas.m2`, `urbanizacion.m2`, `total.m2` |
| 4. Costo por m² | `casas.costo_m2_q`, `urbanizacion.costo_m2_q`, `total.costo_m2_q` (y `_usd`) |
| 5. Costo unitario total | `total.costos_q` = costo total del proyecto en GTQ |
| 6. Moneda | GTQ (campo `_q`) y USD (campo `_usd`), tipo de cambio en `tipo_cambio_usd` |
| 7. Fecha de vigencia | `ultima_actualizacion` — fecha del dato más reciente en Power BI |
| 8. Qué incluye | Costo directo de construcción + urbanización. No incluye indirectos, licencias ni equipamiento |
| 9. Código para cruzar | `key` (ej. "bdj") — mismo proyecto que `codigo_proyecto` en `/costo-m2` en minúsculas |

---

## Cómo cruzar ambas APIs

El campo `key` en `/proyectos-m2` (ej. `"bdj"`) equivale al `codigo_proyecto` en `/costo-m2` (ej. `"BDJ"`) — solo difieren en mayúsculas/minúsculas.

```js
// Ejemplo de cruce
const codigo = proyecto.key.toUpperCase() // "bdj" → "BDJ"
const tipologia = tipologias.find(t => t.proyectos[codigo] !== null)
```

---

## Actualización automática

Ambas APIs leen datos en tiempo real desde la base de datos:
- `/costo-m2` → actualiza cuando cambian los datos en la tabla de tipologías (mensual)
- `/proyectos-m2` → actualiza cuando cambia el caché de Power BI (sincronización automática)

**No requiere ningún cambio de código para reflejar nuevos datos.**

---

## Ejemplo de llamada (JavaScript)

```js
const BASE = 'https://iipgrojliqeyycvgnkrc.supabase.co/functions/v1'
const KEY  = 'tu-api-key-aqui'

async function getCostoM2() {
  const res = await fetch(`${BASE}/costo-m2`, {
    headers: { 'x-api-key': KEY }
  })
  return res.json()
}

async function getProyectosM2() {
  const res = await fetch(`${BASE}/proyectos-m2`, {
    headers: { 'x-api-key': KEY }
  })
  return res.json()
}
```

---

## Errores

| Status | Significado |
|--------|-------------|
| 401 | API key inválida o ausente |
| 500 | Error interno — contactar al administrador |
