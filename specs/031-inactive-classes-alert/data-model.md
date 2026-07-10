# Data Model: Notificación de Clases sin Sesiones Recientes

**Feature**: 031-inactive-classes-alert | **Date**: 2026-07-10

## Cambios de esquema

**Ninguno.** Esta funcionalidad no añade tablas, columnas ni índices. Cumple el principio Data-First por extensión de datos: se introduce un nuevo valor en el campo `tipo` (VarChar(50), sin constraint de BD) de la tabla existente `notificaciones_actividad` (Spec 030).

## Nuevo valor de tipo

| Campo | Valor |
|-------|-------|
| `tipo` | `clase_inactiva` |
| `actor_id` | `null` (notificación generada por el sistema) |
| `clase_id` | `null` (la alerta agrega N clases; el detalle va en `descripcion`) |
| `usuario_afectado_id` | `null` |
| `descripcion` | Texto legible con la lista de clases y sus días de inactividad |

### Formato de `descripcion`

Multilínea (el frontend renderiza con `white-space: pre-line`), una clase por línea:

```
{N} clase{s} sin sesiones recientes:
• {Materia} — última sesión: {dd/mm/aaaa}
• {Materia} — sin sesiones registradas
```

Ejemplo:

```
2 clases sin sesiones recientes:
• Filosofía I — última sesión: 19/06/2026
• Retórica — sin sesiones registradas
```

- Las clases se ordenan de mayor a menor inactividad (las más críticas primero); el umbral se calcula como `floor((hoy − fecha_referencia) / 1 día)` en UTC.
- Clases que nunca registraron sesiones muestran "sin sesiones registradas" en lugar de fecha.

## Regla de detección

Una clase es **inactiva** cuando:

```
clase.estado = 'Activa'
AND fecha_referencia <= hoy − 15 días

donde fecha_referencia =
  MAX(sesiones.fecha) de la clase     — si tiene sesiones registradas
  clase.fecha_inicio                  — si nunca registró sesiones
```

Fuentes (todas existentes, solo lectura):
- `clases.estado`, `clases.fecha_inicio`, `clases.codigo`, `clases.materia_id → materias.nombre`
- `sesiones.clase_id`, `sesiones.fecha` (agregado `MAX` por clase vía `groupBy`)

## Ciclo de vida de la notificación (deduplicación diaria)

```
evaluarClasesInactivas():
  lista = detectar clases inactivas
  existente = notificación tipo 'clase_inactiva' con created_at >= inicio del día (UTC)

  si lista vacía            → no hacer nada (no se crea notificación vacía)
  si no existe hoy          → CREATE (tipo, descripcion)
  si existe y descripcion ≠ → UPDATE (descripcion, created_at = now())
  si existe y descripcion = → no hacer nada (no revive el contador de no leídas)
```

Invariante (SC-003): existe a lo sumo **una** notificación `clase_inactiva` por día calendario.

## Cross-reference Spec 003

No aplica inclusión en el Diccionario de Datos Maestro: no hay entidades ni campos nuevos. El valor `clase_inactiva` amplía el catálogo documentado de tipos de notificación de Spec 030 (`pase_de_lista`, `baja_inscrito`, `promocion_miembro`).
