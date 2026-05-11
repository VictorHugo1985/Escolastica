# Data Model: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-09 (actualizado)

> **Nota**: Este documento reemplaza la versión del 2026-05-04. El campo `nota_final` único en `inscripciones` es reemplazado por la tabla `notas_finales_inscripcion`.

## Cambios al Schema

### 1. Nuevo enum `TipoNotaFinal`

```prisma
enum TipoNotaFinal {
  Nota_Teorica
  Nota_Practica
  Examen_Final
  Trabajo_Escrito
}
```

### 2. Nueva tabla `notas_finales_inscripcion`

```prisma
model notas_finales_inscripcion {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  inscripcion_id String         @db.Uuid
  tipo_nota      TipoNotaFinal
  valor          EstadoNota
  created_at     DateTime       @default(now()) @db.Timestamptz(6)
  updated_at     DateTime       @default(now()) @updatedAt @db.Timestamptz(6)

  inscripcion    inscripciones  @relation(fields: [inscripcion_id], references: [id], onDelete: Cascade)

  @@unique([inscripcion_id, tipo_nota])
}
```

### 3. Modificación en `inscripciones`

Eliminar el campo agregado en migración `20260504000000`:

```prisma
// REMOVER esta línea:
nota_final  EstadoNota?

// AGREGAR relación inversa:
notas_finales  notas_finales_inscripcion[]
```

### Migración SQL equivalente

```sql
-- 1. Nuevo enum
CREATE TYPE "TipoNotaFinal" AS ENUM (
  'Nota_Teorica', 'Nota_Practica', 'Examen_Final', 'Trabajo_Escrito'
);

-- 2. Nueva tabla
CREATE TABLE notas_finales_inscripcion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
  tipo_nota      "TipoNotaFinal" NOT NULL,
  valor          "EstadoNota" NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inscripcion_id, tipo_nota)
);

-- 3. Eliminar campo anterior (agregado en esta misma rama)
ALTER TABLE inscripciones DROP COLUMN nota_final;
```

---

## Entidad: `notas_finales_inscripcion` (nueva)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | No | PK generada por DB |
| `inscripcion_id` | UUID | No | FK → inscripciones (CASCADE delete) |
| `tipo_nota` | TipoNotaFinal | No | Tipo de evaluación final |
| `valor` | EstadoNota | No | Calificación obtenida |
| `created_at` | Timestamptz | No | Fecha de creación |
| `updated_at` | Timestamptz | No | Última modificación |

**Restricción de unicidad**: `(inscripcion_id, tipo_nota)` — un solo valor por tipo por inscripción.

## Entidad: `inscripciones` (modificada)

| Campo | Cambio |
|-------|--------|
| `nota_final EstadoNota?` | **ELIMINADO** — reemplazado por relación `notas_finales` |
| `notas_finales notas_finales_inscripcion[]` | **AGREGADO** — relación 1:N |

Todos los demás campos permanecen sin cambio.

## Enum: `TipoNotaFinal`

| Valor | Etiqueta UI |
|-------|-------------|
| `Nota_Teorica` | Nota Teórica |
| `Nota_Practica` | Nota Práctica |
| `Examen_Final` | Examen Final |
| `Trabajo_Escrito` | Trabajo Escrito |

## Enum: `EstadoNota` (sin cambio)

| Valor | Descripción |
|-------|-------------|
| `Sobresaliente` | Calificación máxima |
| `Solido` | Calificación alta |
| `Aprobado` | Calificación aprobatoria |
| `Reprobado` | Calificación reprobatoria |

## Transiciones de Estado

### Notas finales (colección por inscripción)

```
[] ──[POST nota]──► [{ tipo, valor }, ...]
[{ tipo, valor }] ──[DELETE nota]──► lista reducida
Intento POST con tipo duplicado ──► 409 Conflict (rechazado)
```

La colección no tiene orden obligatorio; el frontend puede mostrarlas ordenadas por tipo.

### Clase (sin cambio)

```
Activa ──[Finalizar clase]──► Finalizada
```

## Reglas de Validación

- `(inscripcion_id, tipo_nota)` es única: el backend rechaza duplicados con 409.
- `valor` debe ser un valor del enum `EstadoNota`; Prisma garantiza esto a nivel de schema.
- `ON DELETE CASCADE` en `inscripcion_id`: si se elimina una inscripción, sus notas finales se eliminan automáticamente.
- La existencia (o ausencia) de notas finales no bloquea el cierre de la clase.
