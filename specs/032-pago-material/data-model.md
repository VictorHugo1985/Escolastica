# Data Model: Registro de Pago por Material Entregado (032)

Extensión del diccionario de datos (spec 002). Tres tablas nuevas; **ninguna tabla existente cambia de estructura ni de datos** (solo se agregan las relaciones inversas en los modelos Prisma, que no generan columnas).

## Garantía de no modificación de lo vigente

- La migración `20261028000000_material_clase` contiene **únicamente** `CREATE TABLE`, `CREATE INDEX` / `CREATE UNIQUE INDEX` y `ALTER TABLE ... ADD CONSTRAINT` **sobre las 3 tablas nuevas**. Cualquier otra sentencia (sobre `clases`, `inscripciones`, `temas`, `usuarios` u otra tabla) es motivo de rechazo en la revisión.
- Las FKs viven en las tablas nuevas; las tablas referenciadas no reciben columnas ni restricciones.
- Efecto indirecto único: una clase/inscripción/tema/usuario referenciado por un pago no puede borrarse físicamente. La aplicación hoy no hace borrados físicos de esas entidades (temas → `Inactivo`, inscripciones → `Baja`, clases → cambio de estado), por lo que no hay impacto funcional.
- Aplicación solo con `prisma migrate deploy`. Prohibido `prisma db push`, `prisma migrate reset` y `--accept-data-loss`.

## material_clase

Cabecera única de material por clase.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK, `gen_random_uuid()` | |
| `clase_id` | UUID | FK → `clases.id`, NOT NULL, **UNIQUE** | Una sola cabecera por clase |
| `comentarios` | TEXT | NULL | Comentario general del material de la clase |
| `creado_por` | UUID | FK → `usuarios.id`, NULL | Quién la creó (al registrar el primer pago) |
| `created_at` | TIMESTAMPTZ(6) | default `now()` | |
| `updated_at` | TIMESTAMPTZ(6) | default `now()`, `@updatedAt` | |

## pagos_material

Cada pago de un alumno. Un alumno puede tener muchos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | |
| `material_clase_id` | UUID | FK → `material_clase.id` ON DELETE CASCADE, NOT NULL | Cabecera de la clase |
| `inscripcion_id` | UUID | FK → `inscripciones.id`, NOT NULL | Alumno en esa clase |
| `fecha` | DATE | NOT NULL | Fecha del pago (por defecto hoy en la UI) |
| `monto` | DECIMAL(8,1) | NOT NULL, `CHECK (monto >= 0)` | 0 – 9 999 999.9 |
| `comentarios` | TEXT | NULL | Ej. "saldo", "pagó con QR" |
| `registrado_por` | UUID | FK → `usuarios.id`, NULL | Quién cargó el pago |
| `created_at` | TIMESTAMPTZ(6) | default `now()` | |
| `updated_at` | TIMESTAMPTZ(6) | default `now()`, `@updatedAt` | |

Índice: `(material_clase_id, inscripcion_id)` para armar la lista por alumno. **Sin** restricción de unicidad: se permiten varios pagos por alumno, incluso el mismo día.

## pago_material_temas

Temas (material) a los que corresponde cada pago (N:M). Análoga a `sesion_temas`.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| `pago_id` | UUID | FK → `pagos_material.id` ON DELETE CASCADE |
| `tema_id` | UUID | FK → `temas.id` ON DELETE RESTRICT |

PK compuesta: `(pago_id, tema_id)`.

## Relaciones

```text
clases 1 ──── 0..1 material_clase 1 ──< pagos_material >── 1 inscripciones
                                              │
                                              └──< pago_material_temas >── 1 temas
```

## Reglas de validación

| Regla | Dónde | Origen |
|-------|-------|--------|
| `monto` es número, `>= 0`, `<= 9999999.9`, máximo 1 decimal | Zod (`MontoSchema`) en UI y API; `DECIMAL(8,1)` + CHECK en BD | FR-005 |
| Una sola cabecera por clase | UNIQUE `clase_id`; la API hace upsert al registrar el primer pago | FR-001 |
| `inscripcion_id` debe pertenecer a la clase | API (400) | FR-002 |
| Solo se **agregan** pagos a inscripciones `Activo`; los pagos de inscripciones en `Baja` se pueden editar/eliminar | API (400) | Edge case "Alumno dado de baja" |
| `tema_ids` deben pertenecer a la materia de la clase | API (400) | FR-004 |
| Clase en estado `Activa` o `Finalizada` | API (409 si `Inactiva`) | FR-009 |
| Instructor solo en clases donde `clases.instructor_id = actor` | API (403) | FR-008 |

## Lista fija de inscritos (vista)

Unión de:
1. Inscripciones `Activo` de la clase (con o sin pagos).
2. Inscripciones no activas que **tienen** al menos un pago (marcadas "Baja").

Orden: el mismo que el pase de lista (activos primero, alfabético). Detalle de pagos por alumno: `fecha DESC, created_at DESC`.

## Datos derivados (no persistidos)

- `total_pagado` por alumno = `SUM(monto)` de sus pagos.
- `total_clase` = `SUM(monto)` de todos los pagos de la cabecera.
- `alumnos_con_pagos` = inscritos activos con al menos un pago.
- `temas_sugeridos` por alumno = temas de su pago más reciente (precarga del formulario).

## Auditoría (`logs_auditoria`)

| Acción | `tabla_afectada` | `valor_anterior` | `valor_nuevo` |
|--------|------------------|------------------|---------------|
| `CREATE` | `pagos_material` | — | `{ id, clase_id, inscripcion_id, fecha, monto, comentarios, tema_ids }` |
| `UPDATE` | `pagos_material` | snapshot previo | snapshot nuevo |
| `DELETE` | `pagos_material` | snapshot previo | — |
| `UPDATE` | `material_clase` | `{ comentarios }` previo | `{ comentarios }` nuevo |

## SQL de la migración

`packages/database/migrations/20261028000000_material_clase/migration.sql` — solo crea; ninguna sentencia sobre tablas existentes.

```sql
CREATE TABLE "material_clase" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "clase_id"    UUID NOT NULL,
  "comentarios" TEXT,
  "creado_por"  UUID,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "material_clase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "material_clase_clase_id_key" ON "material_clase"("clase_id");

CREATE TABLE "pagos_material" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "material_clase_id" UUID NOT NULL,
  "inscripcion_id"    UUID NOT NULL,
  "fecha"             DATE NOT NULL,
  "monto"             DECIMAL(8,1) NOT NULL,
  "comentarios"       TEXT,
  "registrado_por"    UUID,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "pagos_material_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pagos_material_monto_check" CHECK ("monto" >= 0)
);
CREATE INDEX "pagos_material_material_clase_id_inscripcion_id_idx"
  ON "pagos_material"("material_clase_id", "inscripcion_id");

CREATE TABLE "pago_material_temas" (
  "pago_id" UUID NOT NULL,
  "tema_id" UUID NOT NULL,
  CONSTRAINT "pago_material_temas_pkey" PRIMARY KEY ("pago_id", "tema_id")
);

ALTER TABLE "material_clase" ADD CONSTRAINT "material_clase_clase_id_fkey"
  FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_clase" ADD CONSTRAINT "material_clase_creado_por_fkey"
  FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_material_clase_id_fkey"
  FOREIGN KEY ("material_clase_id") REFERENCES "material_clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_registrado_por_fkey"
  FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pago_material_temas" ADD CONSTRAINT "pago_material_temas_pago_id_fkey"
  FOREIGN KEY ("pago_id") REFERENCES "pagos_material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pago_material_temas" ADD CONSTRAINT "pago_material_temas_tema_id_fkey"
  FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```
