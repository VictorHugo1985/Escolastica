# Tasks: Ficha de Inscripción — Nota Final y Cierre de Clase

**Input**: Design documents from `/specs/028-ficha-nota-final-clase/`  
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

> El proyecto ya está inicializado. Esta fase verifica el punto de partida.

- [x] T001 Confirmar que el branch activo es `028-ficha-nota-final-clase` con `git branch --show-current` y revisar los archivos a modificar: `prisma/schema.prisma`, `apps/web/src/app/api/inscripciones/[id]/conclusion/route.ts`, `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRÍTICO**: El resto de las fases depende de que la migración esté aplicada y el cliente Prisma regenerado.

- [x] T002 Agregar campo `nota_final  EstadoNota?` en el model `inscripciones` en `apps/web/prisma/schema.prisma`, entre `concluyo_temario_materia` y `fecha_conclusion_temario`
- [x] T003 Ejecutar `cd apps/web && npx prisma migrate dev --name add-nota-final-inscripcion` para crear y aplicar la migración en la base de datos local
- [x] T004 Ejecutar `cd apps/web && npx prisma generate` para actualizar el cliente Prisma con el nuevo campo `nota_final`
- [x] T005 [P] Verificar que la migración generada en `apps/web/prisma/migrations/` contiene la sentencia `ALTER TABLE "inscripciones" ADD COLUMN "nota_final" "EstadoNota";`

**Checkpoint**: Migración aplicada y cliente regenerado — las fases de US1 y US2 pueden comenzar.

---

## Phase 3: User Story 1 — Registrar nota final del miembro inscrito (Priority: P1) 🎯 MVP

**Goal**: El usuario puede seleccionar la nota final de un miembro inscrito directamente desde la tabla de inscritos en `/admin/clases/[id]`. El valor persiste en la base de datos y se muestra al recargar la página.

**Independent Test**: Abrir `/admin/clases/[id]` con una clase activa que tenga inscritos → seleccionar una nota en el Select de la columna "Nota final" de cualquier alumno → recargar la página → verificar que la nota seleccionada se muestra correctamente.

### Backend

- [x] T006 [P] [US1] Extender el handler `PATCH` en `apps/web/src/app/api/inscripciones/[id]/conclusion/route.ts`: añadir `nota_final: dto.nota_final !== undefined ? dto.nota_final : undefined` dentro del objeto `data` del `prisma.inscripciones.update()`; incluir `nota_final: before.nota_final` en `valor_anterior` del `auditLog` y `nota_final: dto.nota_final` en `valor_nuevo`

### Frontend

- [x] T007 [US1] Agregar `nota_final: 'Sobresaliente' | 'Solido' | 'Aprobado' | 'Reprobado' | null` al interface `Inscripcion` en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [x] T008 [US1] Agregar la constante `NOTAS_FINALES` con los valores del enum como array, y la función async `updateNotaFinal(insc: Inscripcion, nota: string | null)` que llama `api.patch('/inscripciones/${insc.id}/conclusion', { nota_final: nota || null })` seguido de `loadClase()`, en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [x] T009 [US1] Agregar columna `nota_final` al array `columns` del DataGrid en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: usar `Select` de MUI con `size="small"`, opciones de `NOTAS_FINALES` más una opción vacía (`""`), `value={(row as Inscripcion).nota_final ?? ''}`, `onChange={(e) => updateNotaFinal(row as Inscripcion, e.target.value || null)}`, con `width: 170` y `sortable: false`

**Checkpoint**: US1 funcional — la columna nota final es visible, editable y persistente.

---

## Phase 4: User Story 2 — Concluir la vigencia de una clase (Priority: P1)

**Goal**: El usuario Escolástico puede finalizar una clase activa desde `/admin/clases/[id]`. La acción requiere confirmación y cambia el estado a `Finalizada`, reflejándose inmediatamente en el Chip de estado y ocultando el botón.

**Independent Test**: Abrir `/admin/clases/[id]` con una clase en estado `Activa` → hacer clic en "Finalizar clase" → confirmar en el diálogo → verificar que el Chip cambia a `Finalizada`, el botón "Finalizar clase" desaparece, y el botón "Pase de lista" también desaparece.

### Frontend

- [x] T010 [US2] Agregar estado `const [finalizarOpen, setFinalizarOpen] = useState(false)` y la función async `finalizarClase()` que llama `api.patch('/clases/${id}/status', { estado: 'Finalizada' })` seguido de `setFinalizarOpen(false)` y `loadClase()`, manejando error con `setError(...)`, en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [x] T011 [US2] Agregar botón "Finalizar clase" dentro del `<Box sx={{ display: 'flex', gap: 1 }}>` del `PageHeader action`, visible solo cuando `clase.estado === 'Activa'`, usando `variant="outlined"` y `color="error"` con ícono `CheckCircleOutlineIcon` de `@mui/icons-material`, en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [x] T012 [US2] Agregar `Dialog` de confirmación al final del componente (antes del último `</>`) en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: `open={finalizarOpen}`, `maxWidth="xs"`, `fullWidth`, con `DialogTitle` "Finalizar clase", `DialogContent` con texto explicativo ("Esta acción cambiará el estado de la clase a Finalizada y no podrá revertirse."), y `DialogActions` con botón "Cancelar" y botón "Confirmar" de `color="error"` que llama `finalizarClase()`

**Checkpoint**: US2 funcional — el flujo completo de cierre de clase está operativo con confirmación.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T013 [P] Verificar que la columna `nota_final` en el DataGrid no rompe el layout en pantallas móviles (scroll horizontal habilitado por defecto en DataGrid de MUI); si fuera necesario, establecer `minWidth: 140` en la definición de la columna en `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`
- [ ] T014 Ejecutar el flujo de prueba completo descrito en `specs/028-ficha-nota-final-clase/quickstart.md`: registro de nota final, edición, checkbox de conclusión de temario, finalizar clase, verificar auditoría en `/admin/audit-logs`
- [ ] T015 Marcar los ítems del checklist en `specs/028-ficha-nota-final-clase/checklists/requirements.md` como completados tras validar el flujo

---

## Dependencies

```
T001 (orientación)
  └─► T002 (schema)
        └─► T003 (migración)
              └─► T004 (generate)
                    ├─► T005 [P] (verificar migración)
                    ├─► T006 [P] (backend: conclusion route)   ← independiente de T007-T009
                    ├─► T007 (interface TS)
                    │     └─► T008 (NOTAS_FINALES + updateNotaFinal)
                    │           └─► T009 (columna DataGrid)    ← checkpoint US1
                    │                 └─► T010 (estado + finalizarClase)
                    │                       └─► T011 (botón Finalizar)
                    │                             └─► T012 (dialog confirmación) ← checkpoint US2
                    └─► T013 [P] (polish mobile)
                          T014 (validación quickstart)
                          T015 (checklist)
```

## Parallel Execution Opportunities

- **T005 + T006**: Se pueden ejecutar en paralelo con T007-T009 (diferentes archivos)
- **T013**: Puede ejecutarse en paralelo con T014-T015

## Implementation Strategy

**MVP mínimo** (US1 solamente): T001 → T002 → T003 → T004 → T006 → T007 → T008 → T009  
**Completo** (US1 + US2): Todo el plan en orden  
**Archivos impactados**: 3 archivos (`schema.prisma`, `conclusion/route.ts`, `clases/[id]/page.tsx`)  
**Total de tareas**: 15 | **US1**: 4 tareas frontend + 1 backend | **US2**: 3 tareas frontend
