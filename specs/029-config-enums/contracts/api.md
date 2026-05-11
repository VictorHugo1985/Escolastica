# API Contracts: Configuración de Enumeraciones

**Branch**: `029-config-enums` | **Date**: 2026-05-11

Base URL: `/api/config/enums`
Autenticación: requerida en todos los endpoints. Escritura (POST/PATCH) requiere rol `Escolastico`.

---

## GET /api/config/enums

Lista todas las categorías configurables con conteo de valores activos.

**Acceso**: cualquier usuario autenticado

**Respuesta 200**:
```json
[
  {
    "nombre": "TipoSesion",
    "etiqueta": "Tipo de Sesión",
    "descripcion": "Clasificación de las sesiones de clase",
    "total_valores": 4,
    "valores_activos": 4
  },
  {
    "nombre": "EstadoNota",
    "etiqueta": "Estado de Nota",
    "descripcion": "Escala de calificaciones usada en notas de inscripciones",
    "total_valores": 4,
    "valores_activos": 4
  }
]
```

---

## GET /api/config/enums/:categoria

Devuelve el detalle de una categoría y todos sus valores (activos e inactivos), opcionalmente filtrado.

**Acceso**: cualquier usuario autenticado

**Path params**: `categoria` — nombre de la categoría (ej: `TipoSesion`)

**Query params**:
- `activos=true` — devuelve solo valores activos (para alimentar selectores en formularios)

**Respuesta 200**:
```json
{
  "nombre": "TipoSesion",
  "etiqueta": "Tipo de Sesión",
  "descripcion": "Clasificación de las sesiones de clase",
  "valores": [
    { "id": "uuid", "codigo": "Clase", "etiqueta": "Clase", "activo": true, "orden": 1 },
    { "id": "uuid", "codigo": "Examen", "etiqueta": "Examen", "activo": true, "orden": 2 },
    { "id": "uuid", "codigo": "Practica", "etiqueta": "Práctica", "activo": true, "orden": 3 },
    { "id": "uuid", "codigo": "Repaso", "etiqueta": "Repaso", "activo": true, "orden": 4 }
  ]
}
```

**Errores**:
- `404` — categoría no encontrada

---

## POST /api/config/enums/:categoria/valores

Crea un nuevo valor en la categoría indicada.

**Acceso**: solo `Escolastico`

**Path params**: `categoria`

**Body**:
```json
{
  "codigo": "Taller",
  "etiqueta": "Taller",
  "orden": 5
}
```

**Validaciones**:
- `codigo`: requerido, 1–50 chars, único por categoría (case-insensitive)
- `etiqueta`: requerida, 1–100 chars, única por categoría (case-insensitive)
- `orden`: opcional, entero ≥ 0 (default = max_orden_actual + 1)

**Respuesta 201**:
```json
{
  "id": "uuid",
  "codigo": "Taller",
  "etiqueta": "Taller",
  "activo": true,
  "orden": 5
}
```

**Errores**:
- `400` — body inválido
- `404` — categoría no encontrada
- `409` — código o etiqueta duplicado en la misma categoría
- `403` — usuario sin rol Escolastico

**Audit**: `accion: 'CREATE'`, `tabla_afectada: 'enum_valores'`, `valor_nuevo: { categoria, codigo, etiqueta }`

---

## PATCH /api/config/enums/:categoria/valores/:id

Actualiza la etiqueta, estado activo u orden de un valor existente.

**Acceso**: solo `Escolastico`

**Path params**: `categoria`, `id` (UUID del valor)

**Body** (todos opcionales, al menos uno requerido):
```json
{
  "etiqueta": "Clase de Repaso",
  "activo": false,
  "orden": 3
}
```

**Validaciones**:
- `etiqueta`: 1–100 chars, única por categoría si se cambia
- `activo`: boolean
- `orden`: entero ≥ 0
- `codigo` NO es editable — se ignora si se envía

**Respuesta 200**:
```json
{
  "id": "uuid",
  "codigo": "Repaso",
  "etiqueta": "Clase de Repaso",
  "activo": false,
  "orden": 3
}
```

**Errores**:
- `400` — body inválido o vacío
- `404` — valor no encontrado en la categoría indicada
- `409` — etiqueta duplicada en la misma categoría
- `403` — usuario sin rol Escolastico

**Audit**: `accion: 'UPDATE'`, `tabla_afectada: 'enum_valores'`, `valor_anterior: { etiqueta, activo, orden }`, `valor_nuevo: { etiqueta, activo, orden }`

---

## Enumeraciones no configurables (solo frontend)

Las categorías no configurables (Rol, EstadoGeneral, EstadoClase, EstadoInscripcion, EstadoAsistencia) no tienen endpoints — sus valores están hardcodeados en el frontend de la página de configuración. No se expone API para ellas.
