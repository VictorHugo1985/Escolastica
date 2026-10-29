# Tasks: Registro de Pago por Material Entregado

**Input**: Design documents from `/specs/032-pago-material/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-material-clase.md, quickstart.md

**Tests**: No solicitados en la spec y el repo no tiene runner de tests → sin tareas de test; validación con `tsc --noEmit` y `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2)

---

## Phase 1: Setup (Aprobación y guardas)

**Purpose**: Cumplir la Gobernanza de la constitución antes de tocar el modelo de datos.

- [X] T001 Registrar la aprobación explícita del responsable para las 3 tablas nuevas y la ampliación de alcance: cambiar en `specs/032-pago-material/plan.md` (Complexity Tracking) "Estado: pendiente de aprobación explícita" por "Estado: aprobado por <responsable> el <fecha>". **No continuar con la Phase 2 sin esta aprobación.**

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelo de datos, validación compartida, helpers de acceso y la lista de clases reutilizable. Bloquea US1 y US2.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase. **Regla absoluta: no modificar ni borrar tablas ni datos existentes.**

- [X] T002 Agregar a `packages/database/schema.prisma` los modelos nuevos, sin tocar ninguna columna de modelos existentes:
  - `material_clase`: `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`; `clase_id String @unique @db.Uuid` (FK → `clases.id`); `comentarios String? @db.Text`; `creado_por String? @db.Uuid` (FK → `usuarios.id`, `onDelete: SetNull`); `created_at DateTime @default(now()) @db.Timestamptz(6)`; `updated_at DateTime @default(now()) @updatedAt @db.Timestamptz(6)`; relación `pagos pagos_material[]`.
  - `pagos_material`: `id` UUID PK; `material_clase_id String @db.Uuid` (FK → `material_clase.id`, `onDelete: Cascade`); `inscripcion_id String @db.Uuid` (FK → `inscripciones.id`); `fecha DateTime @db.Date`; `monto Decimal @db.Decimal(8, 1)`; `comentarios String? @db.Text`; `registrado_por String? @db.Uuid` (FK → `usuarios.id`, `onDelete: SetNull`); `created_at`/`updated_at` como arriba; relación `temas pago_material_temas[]`; `@@index([material_clase_id, inscripcion_id])`. **Sin** `@@unique` (se permiten varios pagos por alumno).
  - `pago_material_temas`: `pago_id String @db.Uuid` (FK → `pagos_material.id`, `onDelete: Cascade`); `tema_id String @db.Uuid` (FK → `temas.id`); `@@id([pago_id, tema_id])`.
  - En `clases`, `inscripciones`, `temas` y `usuarios` agregar **solo** los campos de relación inversa (ej. `material material_clase?` en `clases`, `pagos_material pagos_material[]` en `inscripciones`, `pagos_material_temas pago_material_temas[]` en `temas`, y en `usuarios` dos relaciones nombradas `@relation("MaterialCreadoPor")` / `@relation("PagoRegistradoPor")`). Estos campos no generan columnas.
- [X] T003 Crear `packages/database/migrations/20261028000000_material_clase/migration.sql` con **exactamente** el SQL de la sección "SQL de la migración" de `specs/032-pago-material/data-model.md`: 3 `CREATE TABLE`, `CREATE UNIQUE INDEX "material_clase_clase_id_key"`, `CREATE INDEX "pagos_material_material_clase_id_inscripcion_id_idx"`, `CHECK ("monto" >= 0)` y 7 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` **solo sobre `material_clase`, `pagos_material` y `pago_material_temas`** (FKs a `clases`/`inscripciones`/`temas` con `ON DELETE RESTRICT`; a `usuarios` con `ON DELETE SET NULL`; internas con `ON DELETE CASCADE`). Generarla a mano o con `npx prisma migrate diff --from-schema-datasource packages/database/schema.prisma --to-schema-datamodel packages/database/schema.prisma --script`; **nunca** con `db push`, `migrate reset` ni `--accept-data-loss`.
- [X] T004 Revisar `packages/database/migrations/20261028000000_material_clase/migration.sql` línea por línea: debe contener solo `CREATE TABLE`, `CREATE INDEX`/`CREATE UNIQUE INDEX` y `ALTER TABLE "material_clase"|"pagos_material"|"pago_material_temas" ADD CONSTRAINT`. Cualquier `ALTER`/`DROP`/`UPDATE`/`DELETE` sobre otra tabla → eliminar la sentencia y revisar T002. Luego ejecutar `npx prisma generate --schema packages/database/schema.prisma`.
- [X] T005 [P] Crear `packages/shared/src/schemas/material.schema.ts` con Zod: `MontoSchema = z.number().min(0).max(9999999.9).refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9, 'El monto admite como máximo un decimal')`; `CreatePagoMaterialSchema = { inscripcion_id: uuid, fecha: string YYYY-MM-DD, monto: MontoSchema, tema_ids: uuid[] opcional (default []), comentarios: string opcional nullable }`; `UpdatePagoMaterialSchema` = mismos campos excepto `inscripcion_id`, todos opcionales; `UpdateMaterialClaseSchema = { comentarios: string nullable }`; exportar tipos `CreatePagoMaterialDto`, `UpdatePagoMaterialDto`, `UpdateMaterialClaseDto`. Agregar `export * from './schemas/material.schema';` en `packages/shared/src/index.ts`.
- [X] T006 [P] Crear `apps/web/src/lib/material-clase.ts` con: `assertAccesoMaterial(actor, claseId)` → `requireRole(actor, 'Instructor', 'Escolastico')`; carga la clase (404 `Clase no encontrada`); si `estado === 'Inactiva'` → `ApiError('La clase está inactiva', 409)`; si el actor no tiene rol `Escolastico` y `clase.instructor_id !== actor.sub` → `ApiError('Sin permisos suficientes', 403)`; devuelve la clase con `materia_id`. Además `serializarPago(pago)` (convierte `monto` Decimal → `number`, `fecha` → `YYYY-MM-DD`, aplana `temas` a `{id, titulo}[]`) y `snapshotPago(pago)` para auditoría (`{ id, clase_id, inscripcion_id, fecha, monto, comentarios, tema_ids }`).
- [X] T007 [P] Extraer la lista de clases de `apps/web/src/app/(admin)/admin/asistencia/page.tsx` a `apps/web/src/components/clases/ClasesVigentesList.tsx`: mover tipos `Horario`/`Clase`, carga de clases `Activa` + `Finalizada` (con `instructor_id` si no es Escolástico), carga de instructores, filtros (instructor, día `ToggleButtonGroup`, chip "Finalizadas (N)"), mensajes vacíos y la grilla de tarjetas. Props: `title: string`, `hrefFor: (clase) => string`. El subtítulo y textos deben quedar idénticos a los actuales.
- [X] T008 Reemplazar el cuerpo de `apps/web/src/app/(admin)/admin/asistencia/page.tsx` por `<ClasesVigentesList title="Listas" hrefFor={(c) => `/admin/asistencia/${c.id}`} />` (depende de T007) y verificar con `cd apps/web && npx tsc --noEmit -p .` que no hay errores. Comportamiento visible sin cambios.

**Checkpoint**: Tablas creadas sin tocar lo vigente, Zod y helpers listos, Listas funcionando igual que antes.

---

## Phase 3: User Story 1 - Registrar pagos desde la lista fija de inscritos (Priority: P1) 🎯 MVP

**Goal**: Menú "Materiales" → clase → lista fija de inscritos con total y detalle; botón **+** para agregar pagos (incluidas cuotas sucesivas del mismo material).

**Independent Test**: En una clase activa, registrar a VH un pago de 10 (temas 1–2) y otro de 10 una semana después; la fila de VH muestra total 20 y 2 pagos en el detalle; la cabecera de la clase se crea sola con el primer pago (quickstart, Escenario 1).

### Implementation for User Story 1

- [X] T009 [US1] Crear `apps/web/src/app/api/clases/[id]/material/route.ts` con `GET`: `assertAccesoMaterial`; buscar `material_clase` por `clase_id` (puede no existir → `cabecera: null`); inscripciones de la clase donde `estado = 'Activo'` **o** tengan al menos un pago en la cabecera, con `usuario { id, nombre_completo }`; pagos con temas y `registrado_por { id, nombre_completo }` ordenados `fecha desc, created_at desc`. Responder según `contracts/api-material-clase.md`: `{ cabecera, filas: [{ inscripcion_id, usuario, estado_inscripcion, total_pagado, temas_sugeridos (temas del pago más reciente), pagos }], total_clase, alumnos_con_pagos (activos con ≥1 pago), total_inscritos (activos) }`. Orden de filas: activos primero, luego alfabético por `nombre_completo` (`localeCompare('es')`). Montos con `serializarPago`.
- [X] T010 [US1] Crear `apps/web/src/app/api/clases/[id]/material/pagos/route.ts` con `POST`: `assertAccesoMaterial`; validar body con `CreatePagoMaterialSchema` (400 con mensajes de Zod); verificar que la inscripción pertenece a la clase y está `Activo` (400 `La inscripción no está activa en esta clase`); verificar que todos los `tema_ids` son de `clase.materia_id` (400 `Tema no pertenece a la materia`); en `prisma.$transaction`: `material_clase.upsert({ where: { clase_id }, create: { clase_id, creado_por: actor.sub }, update: {} })` y `pagos_material.create({ material_clase_id, inscripcion_id, fecha: new Date(fecha), monto, comentarios, registrado_por: actor.sub, temas: { create: tema_ids.map(...) } })`. Luego `auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'pagos_material', valor_nuevo: snapshotPago(pago) })`. Responder `201` con `serializarPago(pago)`.
- [X] T011 [P] [US1] Agregar al `Sidebar` en `apps/web/src/components/layout/Sidebar.tsx` el ítem `{ label: 'Materiales', href: '/admin/materiales', icon: <Inventory2Icon />, roles: ['Instructor', 'Escolastico'] }` justo después de `Listas`, importando `Inventory2Icon` de `@mui/icons-material/Inventory2`.
- [X] T012 [P] [US1] Crear `apps/web/src/app/(admin)/admin/materiales/page.tsx`: `'use client'`, `<ClasesVigentesList title="Materiales" hrefFor={(c) => `/admin/materiales/${c.id}`} />`.
- [X] T013 [P] [US1] Crear `apps/web/src/components/materiales/PagoMaterialDialog.tsx`: `Dialog` (`fullScreen` en `xs` vía `useMediaQuery`) con props `{ open, onClose, onSaved, claseId, temasMateria, alumno: { inscripcion_id, nombre_completo }, inicial?: { id, fecha, monto, tema_ids, comentarios } }`. Campos: Fecha (`type="date"`, default hoy), Monto (`TextField` con `inputMode="decimal"`, acepta coma o punto, valida con `MontoSchema` mostrando "Solo números ≥ 0 con un decimal como máximo"), Temas (`Select multiple` con `renderValue` de títulos, igual que "Temas cursados" en `apps/web/src/app/(admin)/admin/asistencia/[claseId]/sesiones/[sesionId]/page.tsx`), Comentarios (multiline opcional). Guardar: si no hay `inicial` → `POST /clases/:id/material/pagos`; muestra errores de la API en un `Alert`; no cierra ni pierde datos si falla.
- [X] T014 [US1] Crear `apps/web/src/app/(admin)/admin/materiales/[claseId]/page.tsx`: carga `GET /clases/:id` (materia, instructor) y `GET /clases/:id/material`, y `GET /materias/:materiaId/temas`. Encabezado con `PageHeader` (materia + instructor) y chip resumen "`{alumnos_con_pagos}/{total_inscritos}` con pagos · Total `{total_clase}`". Lista (una `Card`/fila por alumno, mobile-first): nombre (tachado/gris + chip "Baja" si `estado_inscripcion !== 'Activo'`), total pagado o "sin pagos", `IconButton` **+** (oculto para "Baja") que abre `PagoMaterialDialog` con `temas_sugeridos` precargados; detalle de pagos expandible (`Collapse`) con fecha `dd/mm`, monto con 1 decimal, títulos de temas y comentario. Tras guardar, recargar `GET /material`. Etiquetas con `estado` "Finalizada" si la clase lo está.
- [ ] T015 [US1] Validar US1 con `cd apps/web && npx tsc --noEmit -p .` y el Escenario 1 de `specs/032-pago-material/quickstart.md` (incluye cabecera creada con el primer pago, precarga de temas y rechazo de `10.55` y `-2`).

**Checkpoint**: US1 funcional y demostrable por sí sola (MVP).

---

## Phase 4: User Story 2 - Corregir o eliminar un pago (Priority: P2)

**Goal**: Editar fecha/monto/temas/comentario de un pago, eliminarlo con confirmación y editar el comentario general de la cabecera; todo auditado.

**Independent Test**: Editar un pago de VH de 10 a 12 y eliminar otro; totales del alumno y de la clase se recalculan; `logs_auditoria` tiene `UPDATE` y `DELETE` en `pagos_material` (quickstart, Escenario 2).

### Implementation for User Story 2

- [X] T016 [US2] Crear `apps/web/src/app/api/clases/[id]/material/pagos/[pagoId]/route.ts` con `PATCH` y `DELETE`: `assertAccesoMaterial`; cargar el pago con su cabecera y temas y verificar que `material_clase.clase_id === params.id` (404 `Pago no encontrado` si no). `PATCH`: validar con `UpdatePagoMaterialSchema`; validar `tema_ids` contra la materia; actualizar campos presentes y, si viene `tema_ids`, `temas: { deleteMany: {}, create: [...] }`; se permite editar pagos de inscripciones en `Baja`; `auditLog` `UPDATE` con `valor_anterior`/`valor_nuevo` = `snapshotPago`. `DELETE`: borrar el pago (temas por cascade), `auditLog` `DELETE` con `valor_anterior`, responder `204`.
- [X] T017 [US2] Agregar `PATCH` en `apps/web/src/app/api/clases/[id]/material/route.ts`: `assertAccesoMaterial`; validar con `UpdateMaterialClaseSchema`; `material_clase.upsert` por `clase_id` actualizando `comentarios` (crea con `creado_por: actor.sub` si no existe); `auditLog({ accion: 'UPDATE', tabla_afectada: 'material_clase', valor_anterior: { comentarios }, valor_nuevo: { comentarios } })`; responder `200` con la cabecera.
- [X] T018 [US2] Extender `apps/web/src/components/materiales/PagoMaterialDialog.tsx`: con `inicial` precarga los campos y guarda con `PATCH /clases/:id/material/pagos/:pagoId`; agregar botón "Eliminar" (solo en edición) que pide confirmación ("¿Eliminar el pago de {monto} del {fecha}?") y llama `DELETE`; tras éxito llama `onSaved`.
- [X] T019 [US2] En `apps/web/src/app/(admin)/admin/materiales/[claseId]/page.tsx`: cada pago del detalle abre `PagoMaterialDialog` en modo edición (también para alumnos en "Baja"); agregar bajo el encabezado un campo "Comentario general" editable (guardar con `PATCH /clases/:id/material`, deshabilitado mientras guarda).
- [ ] T020 [US2] Validar US2 con `cd apps/web && npx tsc --noEmit -p .` y el Escenario 2 de `specs/032-pago-material/quickstart.md` (incluye revisar `logs_auditoria`).

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T021 [P] Crear el módulo espejo NestJS en `apps/api/src/materiales/` (`materiales.module.ts`, `materiales.controller.ts`, `materiales.service.ts`) con las mismas 5 rutas del contrato (`GET`/`PATCH clases/:id/material`, `POST clases/:id/material/pagos`, `PATCH`/`DELETE clases/:id/material/pagos/:pagoId`), `@UseGuards(RolesGuard)` + `@Roles(Rol.Instructor, Rol.Escolastico)`, la misma validación de acceso/estado/Zod y auditoría con `AuditoriaService.log`, siguiendo el patrón de `apps/api/src/sesiones/`. Registrar `MaterialesModule` en `apps/api/src/app.module.ts`. Verificar con `cd apps/api && npx tsc --noEmit -p .`.
- [X] T022 [P] Documentar las 3 tablas nuevas (`material_clase`, `pagos_material`, `pago_material_temas`) en `specs/002-diccionario-datos/data-model.md`, copiando campos, tipos y restricciones de `specs/032-pago-material/data-model.md`.
- [ ] T023 Ejecutar los Escenarios 3 (permisos y estados) y 4 (casos borde, incluida la no regresión de Listas) de `specs/032-pago-material/quickstart.md` y corregir lo que falle.
- [ ] T024 Antes de desplegar: confirmar otra vez que la migración solo crea las 3 tablas (T004) y aplicarla en producción **solo** con `npx prisma migrate deploy --schema packages/database/schema.prisma`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 (aprobación) bloquea todo lo demás.
- **Foundational (Phase 2)**: T002 → T003 → T004 en secuencia; T005, T006, T007 en paralelo tras T004 (T006 usa el cliente Prisma generado); T008 tras T007.
- **US1 (Phase 3)**: depende de toda la Phase 2.
- **US2 (Phase 4)**: depende de la Phase 2; en la práctica se apoya en T009 (GET), T013 (diálogo) y T014 (página) de US1 para la UI. Las rutas T016/T017 pueden hacerse en paralelo a US1.
- **Polish (Phase 5)**: T021 y T022 pueden empezar tras la Phase 2; T023 y T024 al final.

### Within User Story 1

- T009, T010 (API) y T011, T012, T013 (UI) son independientes entre sí → T014 integra GET + diálogo → T015 valida.

### Within User Story 2

- T016 y T017 (API, archivos distintos) en paralelo → T018 → T019 → T020.

---

## Parallel Example: User Story 1

```text
# Tras completar la Phase 2, en paralelo:
T009 GET /clases/:id/material            (apps/web/src/app/api/clases/[id]/material/route.ts)
T010 POST /clases/:id/material/pagos     (apps/web/src/app/api/clases/[id]/material/pagos/route.ts)
T011 Ítem "Materiales" en Sidebar        (apps/web/src/components/layout/Sidebar.tsx)
T012 Página lista de clases              (apps/web/src/app/(admin)/admin/materiales/page.tsx)
T013 PagoMaterialDialog (alta)           (apps/web/src/components/materiales/PagoMaterialDialog.tsx)
# Luego:
T014 Página de control de material → T015 validación
```

## Parallel Example: User Story 2

```text
T016 PATCH/DELETE pago   (apps/web/src/app/api/clases/[id]/material/pagos/[pagoId]/route.ts)
T017 PATCH cabecera      (apps/web/src/app/api/clases/[id]/material/route.ts)
# Luego T018 → T019 → T020
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 aprobación → Phase 2 (migración revisada, Zod, helpers, Listas extraída).
2. Phase 3 (US1) → validar con quickstart Escenario 1.
3. **STOP**: ya se pueden registrar pagos y cuotas; desplegable como MVP.

### Incremental Delivery

1. Setup + Foundational → base lista, Listas sin regresión.
2. US1 → registrar pagos (MVP).
3. US2 → corregir/eliminar pagos y comentario general.
4. Polish → espejo NestJS, diccionario de datos, validación completa, deploy con `migrate deploy`.

---

## Notes

- **Regla absoluta**: ninguna tarea modifica ni borra tablas o datos existentes; los únicos cambios en modelos existentes de `schema.prisma` son campos de relación inversa (sin columnas).
- [P] = archivos distintos, sin dependencias pendientes.
- Hacer commit al terminar cada fase o grupo lógico.
