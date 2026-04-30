# Data Model: Horario Fijo Obligatorio por Clase

**Branch**: `025-horario-fijo-clases` | **Date**: 2026-04-25

---

## Entidades afectadas

### horarios (sin cambios de esquema — ya existe)

```
horarios
├── id          UUID PK
├── clase_id    UUID FK → clases.id (required)
├── aula_id     UUID FK → aulas.id (nullable)
├── dia_semana  Int  — 0=Domingo, 1=Lunes, ..., 6=Sábado
├── hora_inicio Time — formato HH:MM:SS (almacenado como Time en Postgres)
├── hora_fin    Time — formato HH:MM:SS
└── created_at  Timestamptz
```

**Restricciones**:
- No hay migración: la tabla ya existe con estos campos exactos.
- Invariante nueva (solo para creación): toda clase nueva DEBE tener al menos un horario al momento de creación.
- Se permite un único horario por `(clase_id, dia_semana)` — el `createHorario` del servicio no tiene unique constraint en BD, se valida a nivel de servicio.

---

### clases (cambio en DTOs, no en tabla)

No hay cambios de columnas en la tabla `clases`. El cambio es en la capa de validación:

**Cambio en `CreateClaseDto`** (packages/shared):

```
Antes:
  materia_id, instructor_id, aula_id (opcional), mes_inicio, anio_inicio,
  celador, fecha_inicio, fecha_fin, paralelo (opcional)

Después:
  materia_id, instructor_id, mes_inicio, anio_inicio, celador,
  fecha_inicio, fecha_fin, paralelo (opcional),
  horario: {                   ← NUEVO, requerido
    dia_semana: Int (0-6),
    hora_inicio: String HH:MM,
    hora_fin:    String HH:MM,
    aula_id:     UUID (opcional)
  }
```

**Cambio en `UpdateClaseDto`**: Se elimina `aula_id` del nivel superior. La edición de horarios usa los endpoints `POST/DELETE /clases/:id/horarios`.

---

## Flujo de creación de clase (nuevo)

```
POST /clases
Body: { ..., horario: { dia_semana, hora_inicio, hora_fin, aula_id? } }

Service.create():
  1. Valida campos de clase (sin aula_id)
  2. Genera código
  3. crea registro en clases (sin aula_id)
  4. crea registro en horarios con clase_id + dia_semana + hora_inicio + hora_fin + aula_id?
  5. registra auditoría
```

---

## Entidades no modificadas

| Entidad   | Estado    | Razón                                       |
|-----------|-----------|---------------------------------------------|
| sesiones  | Sin cambio | La fecha pre-cargada ya usa horarios[0]     |
| aulas     | Sin cambio | Solo se referencia como FK en horarios      |
| asistencias | Sin cambio | No afectada por este feature               |
| inscripciones | Sin cambio | No afectada                              |

---

## Referencia cruzada con Spec 003

La tabla `horarios` y su relación con `clases` ya están documentadas en el Diccionario de Datos (Spec 003). Este feature no agrega entidades nuevas — solo formaliza como obligatorio un dato que ya existía en el esquema.

**Actualización recomendada en Spec 003**: Marcar `horarios` como relación obligatoria (min 1) para nuevas clases.
