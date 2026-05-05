# Data Model: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-04

## Cambios al Schema

### `inscripciones` — Campo nuevo

```prisma
model inscripciones {
  // ... campos existentes ...
  nota_final                EstadoNota?       // NUEVO — nullable hasta cierre formal
  concluyo_temario_materia  Boolean           @default(false)  // existente, sin cambio
  fecha_conclusion_temario  DateTime?         @db.Date          // existente, sin cambio
  // ...
}
```

**Migración SQL equivalente**:

```sql
ALTER TABLE inscripciones
ADD COLUMN nota_final "EstadoNota" NULL;
```

El enum `EstadoNota` ya existe en PostgreSQL: `Sobresaliente | Solido | Aprobado | Reprobado`.

### Sin cambios en otros modelos

- `clases` — no requiere cambio de schema. `EstadoClase.Finalizada` ya existe.
- `notas` — sin cambio. La nota final no se almacena aquí.

## Entidades relevantes (sin cambio estructural)

### `inscripciones` (actualizada)

| Campo                       | Tipo               | Nullable | Descripción                                        |
|-----------------------------|--------------------|----------|----------------------------------------------------|
| `id`                        | UUID               | No       | PK                                                 |
| `usuario_id`                | UUID               | No       | FK → usuarios                                      |
| `clase_id`                  | UUID               | No       | FK → clases                                        |
| `fecha_inscripcion`         | Timestamptz        | No       | Fecha de alta                                      |
| `estado`                    | EstadoInscripcion  | No       | Activo / Baja / Finalizado                         |
| `nota_final`                | EstadoNota         | **Sí**   | **NUEVO** — nota global del alumno en la clase     |
| `concluyo_temario_materia`  | Boolean            | No       | Si el alumno concluyó el temario                   |
| `fecha_conclusion_temario`  | Date               | Sí       | Fecha de conclusión del temario                    |
| `motivo_baja`               | MotivoBaja         | Sí       | Motivo si estado = Baja                            |
| `fecha_baja`                | Timestamptz        | Sí       | Fecha de baja si aplica                            |
| `comentarios`               | Text               | Sí       | Notas internas                                     |

### `clases` (sin cambio de schema)

| Campo    | Tipo        | Valores           | Notas                                                    |
|----------|-------------|-------------------|----------------------------------------------------------|
| `estado` | EstadoClase | Activa / Inactiva / **Finalizada** | Transición Activa → Finalizada habilitada en UI |

## Transiciones de Estado

### Clase

```
Activa ──[Finalizar clase]──► Finalizada
Activa ──[Desactivar]────────► Inactiva
Inactiva → Finalizada         ✗ No permitido desde UI
Finalizada → cualquier        ✗ No permitido desde UI
```

### Inscripción (nota_final)

```
null ──[seleccionar nota]──► Sobresaliente | Solido | Aprobado | Reprobado
[cualquier valor] ──[editar]──► nuevo valor
```

La nota final es editable en cualquier momento (clase Activa o Finalizada).

## Reglas de Validación

- `nota_final` es opcional; no bloquea el cierre de la clase.
- Al marcar `concluyo_temario_materia = true` sin proporcionar `fecha_conclusion_temario`, el sistema asigna la fecha actual (comportamiento ya implementado en endpoint `conclusion`).
- La acción de finalizar clase (`PATCH /status`) solo es válida si `estado === 'Activa'`. El backend valida esto.
