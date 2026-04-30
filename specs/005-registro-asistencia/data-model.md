# Data Model: Registro de Asistencia — 005

**Date**: 2026-04-24 | **Source**: `packages/database/schema.prisma`

---

## Entidades principales

### `sesiones`

| Campo        | Tipo             | Restricciones                      | Descripción                               |
|-------------|------------------|------------------------------------|-------------------------------------------|
| `id`        | UUID             | PK, gen_random_uuid()              | Identificador único                        |
| `clase_id`  | UUID             | FK → `clases.id`, NOT NULL         | Clase a la que pertenece la sesión         |
| `fecha`     | Date             | NOT NULL                           | Fecha de la sesión (sin hora)             |
| `tipo`      | TipoSesion       | NOT NULL                           | `Clase` \| `Examen` \| `Practica` \| `Repaso` |
| `tema_id`   | UUID?            | FK → `temas.id`, nullable          | Tema trabajado en la sesión (opcional)    |
| `comentarios` | Text?          | nullable                           | Notas adicionales                          |
| `created_at` | Timestamptz     | DEFAULT now()                      | Timestamp de creación                      |

**Invariantes**:
- Una clase puede tener múltiples sesiones en la misma fecha (bloques dobles, reposiciones).
- La unicidad de "sesión del día" se gestiona por lógica de negocio en `getOrCreateToday()`, no por constraint de BD.

---

### `asistencias`

| Campo           | Tipo              | Restricciones                              | Descripción                            |
|----------------|-------------------|--------------------------------------------|----------------------------------------|
| `id`           | UUID              | PK, gen_random_uuid()                      | Identificador único                     |
| `inscripcion_id` | UUID            | FK → `inscripciones.id`, NOT NULL         | Alumno inscrito                         |
| `sesion_id`    | UUID              | FK → `sesiones.id`, NOT NULL              | Sesión a la que corresponde             |
| `estado`       | EstadoAsistencia  | NOT NULL                                   | `Presente` \| `Ausente` \| `Licencia`  |
| `created_at`   | Timestamptz       | DEFAULT now()                              | Timestamp de creación                   |
| `updated_at`   | Timestamptz       | DEFAULT now(), @updatedAt                  | Última modificación                     |

**Constraint único**: `@@unique([inscripcion_id, sesion_id])` — un alumno tiene exactamente un registro de asistencia por sesión.

---

## Enums

### `TipoSesion`
```
Clase | Examen | Practica | Repaso
```

### `EstadoAsistencia`
```
Presente | Ausente | Licencia
```

---

## Entidades de soporte (no propias de esta spec)

| Entidad        | Relación con asistencia                              |
|----------------|------------------------------------------------------|
| `clases`       | Agrupa sesiones. Tiene `instructor_id`, `estado`, `horarios` |
| `inscripciones`| Vínculo alumno-clase. Solo `estado='Activo'` aparece en pase de lista |
| `horarios`     | `dia_semana` (0=Dom..6=Sáb) + `hora_inicio`/`hora_fin` por clase |
| `usuarios`     | `nombre_completo` se muestra en la lista de pase de lista |

---

## Relaciones clave

```
clases
  └──< sesiones (1:N por clase_id)
         └──< asistencias (1:N por sesion_id)
                 └── inscripciones (N:1 por inscripcion_id)
                         └── usuarios (N:1 por usuario_id)
```

---

## Cálculo de porcentaje de asistencia

No hay campo calculado en BD. `AsistenciasService.calcularPorcentajePorAlumno(claseId)` computa en memoria:

```
porcentaje = (count(asistencias WHERE estado='Presente') / count(sesiones WHERE clase_id=X)) * 100
```

Redondea al entero más cercano con `Math.round()`.
