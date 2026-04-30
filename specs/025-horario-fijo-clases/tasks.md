# Tasks: Horario Fijo Obligatorio por Clase

**Input**: Design documents from `/specs/025-horario-fijo-clases/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to
- Exact file paths included in every description

---

## Phase 1: Setup

No project initialization required — monorepo already configured. Schema changes to `packages/shared` are the only foundation needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: US1, US2, and US3 all depend on the updated shared DTO. Complete before proceeding.

- [X] T001 Update `CreateClaseSchema` in `packages/shared/src/schemas/clase.schema.ts`: eliminar `aula_id` del nivel raíz y agregar campo `horario` requerido con subfields `dia_semana` (z.number().int().min(0).max(6)), `hora_inicio` (z.string().regex(/^\d{2}:\d{2}$/)), `hora_fin` (z.string().regex(/^\d{2}:\d{2}$/)), `aula_id` (z.string().uuid().optional())
- [X] T002 Update `UpdateClaseSchema` en `packages/shared/src/schemas/clase.schema.ts`: eliminar `aula_id` del schema (la edición de horarios usa endpoints dedicados `POST/DELETE /clases/:id/horarios`)
- [X] T003 Rebuild shared package ejecutando `npm run build --workspace=packages/shared` para que el API pueda importar los DTOs actualizados

**Checkpoint**: DTO compilado — implementación de US1 puede comenzar

---

## Phase 3: User Story 1 — Horario obligatorio al crear clase (Priority: P1) 🎯 MVP

**Goal**: Toda clase nueva requiere un horario fijo (día + hora inicio/fin). El formulario de creación captura estos datos, el servicio los persiste correctamente en la tabla `horarios`, y el listado de clases los muestra como referencia visible.

**Independent Test** (SC-001 + SC-002 de quickstart.md): Crear clase sin horario → error de validación. Crear clase con horario → aparece en listado con día y rango horario. Intentar crear con `hora_fin` anterior a `hora_inicio` → error.

### Backend (apps/api)

- [X] T004 [P] [US1] Update método `create()` en `apps/api/src/clases/clases.service.ts`: reemplazar el bloque `if (data.aula_id) { this.prisma.horarios.create({ dia_semana: 1, hora_inicio: hardcoded... }) }` por `await this.prisma.horarios.create({ data: { clase_id: clase.id, dia_semana: data.horario.dia_semana, hora_inicio: new Date(\`1970-01-01T${data.horario.hora_inicio}:00\`), hora_fin: new Date(\`1970-01-01T${data.horario.hora_fin}:00\`), aula_id: data.horario.aula_id ?? null } })`. Incluir `horario` en el `valor_nuevo` del log de auditoría.
- [X] T005 [US1] Update método `update()` en `apps/api/src/clases/clases.service.ts`: eliminar el bloque que maneja `data.aula_id` (líneas ~162–177 que actualizan o crean un horario desde `aula_id`). La actualización de horarios queda exclusivamente en los endpoints `POST/DELETE /clases/:id/horarios`.

### Frontend — Formulario de clases (apps/web)

- [X] T006 [P] [US1] Update interfaz `Clase` en `apps/web/src/app/(admin)/admin/clases/page.tsx`: cambiar `horarios?: { aula: Aula | null }[]` por `horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string; aula: Aula | null }[]`
- [X] T007 [US1] Update `handleOpenCreate()` en `apps/web/src/app/(admin)/admin/clases/page.tsx`: en el objeto pasado a `reset()`, eliminar `aula_id: ''` y agregar `horario: { dia_semana: 1, hora_inicio: '18:00', hora_fin: '20:00', aula_id: '' }`
- [X] T008 [US1] Update `handleOpenEdit()` en `apps/web/src/app/(admin)/admin/clases/page.tsx`: eliminar `aula_id: clase.horarios?.[0]?.aula?.id || ''` y agregar extracción del horario: `horario: { dia_semana: clase.horarios?.[0]?.dia_semana ?? 1, hora_inicio: clase.horarios?.[0]?.hora_inicio ? new Date(clase.horarios[0].hora_inicio).toISOString().substring(11, 16) : '18:00', hora_fin: clase.horarios?.[0]?.hora_fin ? new Date(clase.horarios[0].hora_fin).toISOString().substring(11, 16) : '20:00', aula_id: clase.horarios?.[0]?.aula?.id || '' }`
- [X] T009 [US1] Add horario form fields en el `<DialogContent>` de `apps/web/src/app/(admin)/admin/clases/page.tsx`: reemplazar el `<Grid item xs={12} sm={6}>` de "Aula (opcional)" con una sección de horario que incluya: (a) `Controller name="horario.dia_semana"` con `<Select>` de días Lunes–Sábado (values 1–6, labels DIAS array local), (b) `<TextField type="time" label="Hora inicio" {...register('horario.hora_inicio')}` xs=6, (c) `<TextField type="time" label="Hora fin" {...register('horario.hora_fin')}` xs=6, (d) `Controller name="horario.aula_id"` con `<Select>` de aulas incluyendo opción vacía "Ninguna" xs=12 sm=6. Asegurarse que los errores de cada subcampo se muestren con `errors.horario?.dia_semana`, `errors.horario?.hora_inicio`, etc.
- [X] T010 [US1] Replace columna "Aula" en `DataGrid` de `apps/web/src/app/(admin)/admin/clases/page.tsx`: cambiar el campo `field: 'aula'` por columna `field: 'horario'` con `headerName: 'Horario'`, `width: 160`, `valueGetter: (_, row: Clase) => { const h = row.horarios?.[0]; if (!h) return 'Sin horario'; const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']; const inicio = new Date(h.hora_inicio).toISOString().substring(11,16); const fin = new Date(h.hora_fin).toISOString().substring(11,16); return \`${dias[h.dia_semana]} ${inicio}–${fin}\`; }`. Agregar el array `const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']` en el nivel del módulo.

**Checkpoint**: US1 funcional — crear clase muestra error sin horario; con horario lo persiste y el DataGrid muestra "Jue 20:00–22:00"

---

## Phase 4: User Story 2 — Filtro por día en listado de asistencia (Priority: P2)

**Goal**: El listado de asistencia (`/admin/asistencia`) permite filtrar clases por día de la semana. Para instructores, el filtro se preselecciona con el día actual; para admins/escolásticos, sin preselección.

**Independent Test** (SC-003 + SC-004 de quickstart.md): Instructor entra a `/admin/asistencia` → solo ve clases del día actual. Admin selecciona "Jueves" → solo ve clases con `horarios[].dia_semana === 4`. Seleccionar "Todos" muestra todo.

- [X] T011 [US2] Add `filtroDia` state en `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: declarar `const [filtroDia, setFiltroDia] = useState<number | null>(null)` DESPUÉS del `useState` de `filtroInstructor`. En el `useEffect` que carga clases, una vez que `esEscol` esté resuelto, inicializar: si `!esEscol` setear `filtroDia` con `new Date().getDay()` (preselección automática para instructores); si `esEscol` dejar `null`.
- [X] T012 [US2] Update `clasesFiltradas` useMemo en `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: agregar segundo filtro: `if (filtroDia !== null) result = result.filter(c => c.horarios.some(h => h.dia_semana === filtroDia))`. Agregar `filtroDia` al array de dependencias del `useMemo`.
- [X] T013 [US2] Add día filter Select en JSX de `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: dentro del `<Box sx={{ mb: 3 ... }}>` que ya contiene el filtro de instructor, agregar un segundo `<FormControl size="small" sx={{ minWidth: 180 }}>` con `<InputLabel>Día de la semana</InputLabel>` y `<Select value={filtroDia ?? ''} onChange={e => setFiltroDia(e.target.value === '' ? null : Number(e.target.value))}>` con `<MenuItem value=""><em>Todos los días</em></MenuItem>` más un `MenuItem` por cada día Lun–Sáb (values 1–6, labels de `DIAS_CORTO` ya definido en ese archivo). Envolver ambos filtros en un `<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>`.

**Checkpoint**: US2 funcional — filtro por día activo y preselección automática para instructores

---

## Phase 5: User Story 3 — Verificación fecha de sesión desde horario (Priority: P3)

**Goal**: Confirmar que la creación de sesiones ya usa el `dia_semana` del horario de la clase. No se esperan cambios de código — es verificación del estado actual.

**Independent Test** (SC-005 de quickstart.md): Iniciar sesión para clase de Jueves → sesión tiene fecha del jueves de la semana actual.

- [X] T014 [P] [US3] Verificar en `apps/web/src/app/(admin)/admin/asistencia/[claseId]/page.tsx` que `handleIniciarHoy` lee `clase?.horarios?.[0]?.dia_semana` y lo pasa a `getFechaParaSemana()`. Si el GET de clase no incluye `dia_semana` en la interfaz `ClaseInfo`, agregar `horarios: { dia_semana: number }[]` a la interfaz local.
- [X] T015 [P] [US3] Verificar en `apps/web/src/app/(instructor)/asistencia/[claseId]/page.tsx` que `iniciarSesion()` usa `clase?.horarios?.[0]?.dia_semana` con `getFechaParaSemana()`. Confirmar que el endpoint `GET /clases/${claseId}` retorna `horarios` con `dia_semana` (ya incluido en `findOne` del servicio). No se esperan cambios.

**Checkpoint**: US3 confirmado — sesiones creadas con fecha correcta del día programado

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 Update subtitle del PageHeader en `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: cambiar el texto del subtitle para reflejar el día activo cuando hay filtro: `subtitle={filtroDia !== null ? \`${clasesFiltradas.length} clase(s) el ${DIAS_LARGO[filtroDia]}\` : \`${clasesFiltradas.length} clase(s) activa(s)\`}`. Agregar `DIAS_LARGO` array si no existe.
- [ ] T017 (manual validation) Run quickstart.md validation: ejecutar manualmente los escenarios SC-001 (crear con horario), SC-002 (crear sin horario → error), SC-003 (instructor ve clases del día), SC-004 (admin filtra por día), SC-005 (sesión con fecha del día programado), SC-006 (editar horario de clase existente), SC-007 (clase sin horario → fallback a hoy)

---

## Dependencies

```
T001 → T002 → T003 → T004, T006 (paralelo)
T004 → T005 (mismo archivo)
T006 → T007 → T008 → T009 → T010 (mismo archivo)
T010 → T011 → T012 → T013
T014, T015 (paralelo, verificación)
T016 → T017
```

## Parallel Execution Examples

**Después de T003** (shared rebuild completo):
```
Agente A: T004 → T005  (apps/api/src/clases/clases.service.ts)
Agente B: T006 → T007 → T008 → T009 → T010  (apps/web/admin/clases/page.tsx)
```

**US3 (verificación)**:
```
Agente A: T014  (admin hub page)
Agente B: T015  (instructor page)
```

## Implementation Strategy

**MVP = Phase 2 + Phase 3 (T001–T010)**

- T001–T003 en secuencia (schema → build)
- T004/T005 y T006–T010 en paralelo (API vs UI)
- Una vez US1 funciona, agregar filtro (T011–T013) de forma independiente
- US3 es verificación sin riesgo, puede hacerse en cualquier momento

**Total: 17 tareas** | US1: 10 | US2: 3 | US3: 2 | Polish: 2
