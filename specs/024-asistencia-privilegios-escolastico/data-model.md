# Data Model: Escolástico con Privilegios Plenos de Asistencia

**Feature**: `024-asistencia-privilegios-escolastico`  
**Date**: 2026-04-24

## No New Entities

Esta feature no introduce nuevas tablas ni campos. Usa exclusivamente entidades ya definidas en spec 002 (Diccionario de Datos Maestro):

| Tabla         | Rol en esta feature                                       |
|---------------|-----------------------------------------------------------|
| `clases`      | Fuente de la lista de clases del día para cualquier actor |
| `horarios`    | Filtro por `dia_semana` para determinar clases de hoy     |
| `sesiones`    | Creación idempotente de sesión del día (sin cambios)      |
| `asistencias` | Registro y edición por el actor (sin cambios)             |
| `usuario_roles` | Fuente del rol Escolástico para la lógica de filtrado   |

## Cambio Lógico (no estructural)

El único cambio es en la **query de `sesiones.service.ts`**:

### Antes
```
WHERE clases.instructor_id = :userId
  AND clases.estado = 'Activa'
  AND horarios.dia_semana = :diaSemana
```

### Después (cuando roles incluye 'Escolastico')
```
WHERE clases.estado = 'Activa'
  AND horarios.dia_semana = :diaSemana
  -- sin filtro por instructor_id
```

El instructor conserva el filtro original sin ningún cambio.
