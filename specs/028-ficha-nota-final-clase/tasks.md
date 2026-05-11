# Tasks: Ficha de Inscripción — Nota Final (múltiples) y Cierre de Clase

**Input**: Design documents from `/specs/028-ficha-nota-final-clase/`  
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓  
**Actualizado**: 2026-05-11 — reemplaza implementación anterior de campo `nota_final` único por tabla `notas_finales_inscripcion`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

> El proyecto está inicializado. Esta fase reorienta el estado actual antes de los cambios.

- [x] T001 Verificar que `packages/database/schema.prisma` tiene `nota_final EstadoNota?` en `inscripciones` y que el migration `20260504000000_add_nota_final_inscripcion` existe en `packages/database/migrations/` — confirmar el punto de partida antes de modificar

---

## Phase 2: Foundational — Schema y Migración (Blocking Prerequisites)

**⚠️ CRÍTICO**: El resto de las fases depende de que la migración esté aplicada y el cliente Prisma regenerado.

- [x] T002 En `packages/database/schema.prisma`: (a) agregar enum `TipoNotaFinal { Nota_Teorica Nota_Practica Examen_Final Trabajo_Escrito }`, (b) agregar model `notas_finales_inscripcion` con campos `id UUID PK`, `inscripcion_id UUID FK→inscripciones onDelete Cascade`, `tipo_nota TipoNotaFinal`, `valor EstadoNota`, `created_at/updated_at Timestamptz`, y `@@unique([inscripcion_id, tipo_nota])`, (c) en model `inscripciones` quitar `nota_final EstadoNota?` y agregar relación `notas_finales notas_finales_inscripcion[]`
- [x] T003 Ejecutar `npx prisma migrate dev --name replace-nota-final-with-table` desde `packages/database/` para crear y aplicar la migración
- [x] T004 Ejecutar `npx prisma generate` desde `packages/database/` para regenerar el cliente Prisma con la nueva tabla y el enum eliminado de `inscripciones`

**Checkpoint**: Migración aplicada, cliente regenerado — US1 y US2 pueden comenzar.

---

## Phase 3: User Story 1 — Múltiples notas finales por inscripción (Priority: P1) 🎯 MVP

**Goal**: Desde `/admin/clases/:id`, el usuario puede agregar varias notas finales a cada inscripción (eligiendo tipo y valor), verlas como chips en la tabla, y eliminarlas individualmente. Los cambios persisten en la base de datos.

**Independent Test**: Abrir `/admin/clases/:id` con clase activa e inscritos → click en botón editar de un alumno → agregar "Nota Teórica: Aprobado" → cerrar → verificar chip en columna → reabrir → agregar "Examen Final: Sobresaliente" → verificar dos chips → eliminar uno → verificar que queda solo el otro al recargar.

### Backend

- [x] T005 [P] [US1] Crear `apps/web/src/app/api/inscripciones/[id]/notas-finales/route.ts` con handler POST que: (1) llame `requireAuth`, verifique que el actor es `Escolastico` o instructor titular de la clase de la inscripción, (2) valide `tipo_nota ∈ TipoNotaFinal` y `valor ∈ EstadoNota`, (3) llame `prisma.notas_finales_inscripcion.create` capturando error P2002 de Prisma para responder 409 si el tipo ya existe, (4) registre `auditLog` con `accion: 'CREATE'`, `tabla_afectada: 'notas_finales_inscripcion'`, (5) retorne `json(nota, 201)`
- [x] T006 [P] [US1] Crear `apps/web/src/app/api/inscripciones/[id]/notas-finales/[notaId]/route.ts` con handler DELETE que: (1) llame `requireAuth`, verifique autorización (mismo patrón que T005), (2) busque la nota verificando que `inscripcion_id` coincida con el `id` del path, (3) registre `auditLog` con `accion: 'DELETE'` y `valor_anterior` con tipo y valor, (4) elimine con `prisma.notas_finales_inscripcion.delete`, (5) retorne status 204
- [x] T007 [P] [US1] En `apps/web/src/app/api/inscripciones/[id]/conclusion/route.ts`: eliminar el bloque `...(dto.nota_final !== undefined && { nota_final: dto.nota_final })` del `data` del `prisma.inscripciones.update` y limpiar referencias a `nota_final` en `valor_anterior` y `valor_nuevo` del `auditLog`
- [x] T008 [US1] En `apps/web/src/app/api/clases/[id]/route.ts`, dentro del `include` de `inscripciones` del `prisma.clases.findUnique`, agregar `notas_finales: { select: { id: true, tipo_nota: true, valor: true }, orderBy: { created_at: 'asc' } }`

### Frontend

- [x] T009 [US1] En `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: (a) reemplazar `interface NotaFinal` con `{ id: string; tipo_nota: TipoNotaFinal; valor: EstadoNota }`, (b) en interface `Inscripcion` cambiar `nota_final: '...' | null` por `notas_finales: NotaFinal[]`, (c) agregar constante `TIPO_NOTA_LABELS: Record<TipoNotaFinal, string>` con etiquetas en español (`Nota_Teorica: 'Nota Teórica'`, etc.), (d) quitar constante `NOTAS_FINALES` y función `updateNotaFinal`, (e) agregar tipos `type TipoNotaFinal = ...` y `type EstadoNota = ...`
- [x] T010 [US1] En `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: agregar estado `const [notasTarget, setNotasTarget] = useState<Inscripcion | null>(null)` y funciones `addNota(tipo: TipoNotaFinal, valor: EstadoNota)` que llame `api.post('/inscripciones/${notasTarget!.id}/notas-finales', { tipo_nota: tipo, valor })` + `loadClase()`, y `deleteNota(notaId: string)` que llame `api.delete('/inscripciones/${notasTarget!.id}/notas-finales/${notaId}')` + refresque el diálogo vía `loadClase()`
- [x] T011 [US1] En `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: reemplazar la columna `nota_final` del array `columns` del DataGrid por columna `notas_finales` con `width: 220`, `sortable: false`, `renderCell` que muestre chips compactos (`<Chip size="small" label={TIPO_NOTA_LABELS[n.tipo_nota] + ': ' + n.valor}/>`) por cada nota en `row.notas_finales` más un `IconButton` con `EditIcon` que ejecute `setNotasTarget(row as Inscripcion)`
- [x] T012 [US1] En `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: agregar `Dialog` de gestión de notas (abre cuando `notasTarget !== null`, `onClose={() => setNotasTarget(null)}`, `fullScreen` en `xs` con `useMediaQuery(theme.breakpoints.down('sm'))`), con: lista de notas existentes con chip + `IconButton` `DeleteIcon` que llame `deleteNota(n.id)`, y formulario de agregar con dos `Select` (tipo y valor) + botón "Agregar" que llame `addNota(tipoSel, valorSel)` manejando error 409 con mensaje "Ya existe una nota de ese tipo"

**Checkpoint**: US1 funcional — chips de notas visibles en DataGrid, diálogo permite agregar y eliminar.

---

## Phase 4: User Story 2 — Concluir vigencia de clase (Priority: P1)

**Goal**: El botón "Finalizar clase" (ya existente en UI) solo acepta la transición desde estado `Activa`, con validación en el backend.

**Independent Test**: Intentar `PATCH /api/clases/:id/status { estado: 'Finalizada' }` sobre una clase ya `Finalizada` → debe responder 400. El mismo request sobre clase `Activa` → responde 200.

> La UI del botón y el diálogo de confirmación ya están implementados en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`.

### Backend

- [x] T013 [US2] En `apps/web/src/app/api/clases/[id]/status/route.ts`: después de obtener `before`, agregar validación: si `estado === 'Finalizada'` y `before.estado !== 'Activa'`, lanzar `new ApiError('Solo se puede finalizar una clase en estado Activa', 400)`

**Checkpoint**: US2 íntegro — transición Activa→Finalizada protegida en backend; UI ya funcional.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T014 [P] Verificar en mobile que la columna `notas_finales` es legible (chips truncados si es necesario con `sx={{ maxWidth: 180, overflow: 'hidden' }}`) en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [x] T015 Ejecutar el flujo de prueba completo descrito en `specs/028-ficha-nota-final-clase/quickstart.md`: agregar notas, verificar unicidad por tipo, eliminar, marcar conclusión de temario, finalizar clase, verificar entradas en `logs_auditoria`
- [x] T016 Actualizar checklist en `specs/028-ficha-nota-final-clase/checklists/requirements.md` marcando todos los ítems como completados

---

## Dependencies

```
T001 (verificar estado)
  └─► T002 (schema)
        └─► T003 (migración)
              └─► T004 (prisma generate)
                    ├─► T005 [P] (POST notas-finales)          ─┐
                    ├─► T006 [P] (DELETE notas-finales)         ├─ paralelos
                    ├─► T007 [P] (limpiar conclusion route)      ─┘
                    ├─► T008 (GET clases incluye notas_finales)
                    │     └─► T009 (interfaces + types en page.tsx)
                    │           └─► T010 (estado + handlers add/delete)
                    │                 └─► T011 (columna chips + botón)
                    │                       └─► T012 (Dialog gestión) ── checkpoint US1
                    └─► T013 [P] (validación transición status)    ── checkpoint US2
                          T014 [P] (polish mobile)
                          T015 (validación quickstart)
                          T016 (checklist)
```

## Parallel Execution Opportunities

- **T005 + T006 + T007**: Distintos archivos, dependen solo de T004 — ejecutar en paralelo
- **T013 + T014**: Independientes entre sí y de US1 a partir de T004

## Implementation Strategy

**MVP mínimo (US1)**: T001 → T002 → T003 → T004 → T005/T006/T007 → T008 → T009 → T010 → T011 → T012  
**Completo (US1 + US2 + polish)**: secuencia completa  
**Archivos nuevos**: 2 (`notas-finales/route.ts`, `notas-finales/[notaId]/route.ts`)  
**Archivos modificados**: 4 (`schema.prisma`, `conclusion/route.ts`, `clases/[id]/route.ts`, `clases/[id]/page.tsx`, `status/route.ts`)  
**Total tareas**: 16 | US1: 8 tareas | US2: 1 tarea | Foundational: 4 | Setup: 1 | Polish: 3
