# Tasks: Configuración de Enumeraciones de la Aplicación

**Input**: Design documents from `/specs/029-config-enums/`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

- [x] T001 Verificar en `packages/database/schema.prisma` que los 4 enums configurables existen: `TipoSesion`, `EstadoNota`, `TipoNotaFinal`, `MotivoBaja`, y que las 5 columnas afectadas (`sesiones.tipo`, `inscripciones.motivo_baja`, `notas.nota`, `notas_finales_inscripcion.tipo_nota`, `notas_finales_inscripcion.valor`) usan esos tipos — confirmar el punto de partida

---

## Phase 2: Foundational — Schema y Migración (Blocking Prerequisites)

**⚠️ CRÍTICO**: El resto de las fases depende de que la migración esté aplicada y el cliente Prisma regenerado.

- [x] T002 En `packages/database/schema.prisma`: (a) agregar modelo `enum_categorias` con campos `id UUID PK`, `nombre VARCHAR(50) UNIQUE`, `etiqueta VARCHAR(100)`, `descripcion VARCHAR(255)?`, `created_at/updated_at Timestamptz`; (b) agregar modelo `enum_valores` con campos `id UUID PK`, `categoria_id UUID FK→enum_categorias`, `codigo VARCHAR(50)`, `etiqueta VARCHAR(100)`, `activo Boolean default true`, `orden Int default 0`, `created_at/updated_at Timestamptz`, y `@@unique([categoria_id, codigo])`; (c) cambiar en `sesiones`: `tipo TipoSesion` → `tipo String @db.VarChar(50)`; (d) cambiar en `inscripciones`: `motivo_baja MotivoBaja?` → `motivo_baja String? @db.VarChar(50)`; (e) cambiar en `notas`: `nota EstadoNota` → `nota String @db.VarChar(50)`; (f) cambiar en `notas_finales_inscripcion`: `tipo_nota TipoNotaFinal` → `tipo_nota String @db.VarChar(50)` y `valor EstadoNota` → `valor String @db.VarChar(50)`; (g) eliminar las declaraciones `enum TipoSesion`, `enum EstadoNota`, `enum TipoNotaFinal`, `enum MotivoBaja`

- [x] T003 Crear `packages/database/migrations/20260511000000_config_enums/migration.sql` con las siguientes operaciones en orden: (1) CREATE TABLE "enum_categorias" con columnas id UUID PK, nombre VARCHAR(50) UNIQUE NOT NULL, etiqueta VARCHAR(100) NOT NULL, descripcion VARCHAR(255), created_at/updated_at TIMESTAMPTZ default now(); (2) CREATE TABLE "enum_valores" con columnas id UUID PK, categoria_id UUID FK→enum_categorias NOT NULL, codigo VARCHAR(50) NOT NULL, etiqueta VARCHAR(100) NOT NULL, activo BOOLEAN default true, orden INT default 0, created_at/updated_at TIMESTAMPTZ, y CONSTRAINT unique(categoria_id, codigo); (3) INSERT INTO "enum_categorias" los 4 registros: ('EstadoNota','Estado de Nota','Escala de calificaciones'), ('TipoNotaFinal','Tipo de Nota Final','Tipos de evaluación'), ('TipoSesion','Tipo de Sesión','Clasificación de sesiones de clase'), ('MotivoBaja','Motivo de Baja','Razón de baja de inscripción'); (4) INSERT INTO "enum_valores" los 16 valores iniciales (4 por categoría) referenciando las categorías recién creadas con sus códigos, etiquetas y orden 1-4; (5) ALTER TABLE "sesiones" ALTER COLUMN "tipo" TYPE VARCHAR(50) USING tipo::text; (6) ALTER TABLE "inscripciones" ALTER COLUMN "motivo_baja" TYPE VARCHAR(50) USING motivo_baja::text; (7) ALTER TABLE "notas" ALTER COLUMN "nota" TYPE VARCHAR(50) USING nota::text; (8) ALTER TABLE "notas_finales_inscripcion" ALTER COLUMN "tipo_nota" TYPE VARCHAR(50) USING tipo_nota::text; (9) ALTER TABLE "notas_finales_inscripcion" ALTER COLUMN "valor" TYPE VARCHAR(50) USING valor::text; (10) DROP TYPE "TipoSesion"; DROP TYPE "EstadoNota"; DROP TYPE "TipoNotaFinal"; DROP TYPE "MotivoBaja"

- [x] T004 Aplicar la migración ejecutando `npx prisma migrate deploy` desde `packages/database/` — verificar que la migración se aplica sin errores y que las tablas `enum_categorias` y `enum_valores` existen con los 4+16 registros de seed

- [x] T005 Regenerar el cliente Prisma ejecutando `npx prisma generate` desde `packages/database/` — verificar que los tipos `TipoSesion`, `EstadoNota`, `TipoNotaFinal`, `MotivoBaja` ya NO se exportan desde `@prisma/client`, y que los modelos `enum_categorias` y `enum_valores` SÍ están disponibles

**Checkpoint**: Migración aplicada, cliente regenerado — US1 y US2 pueden comenzar.

---

## Phase 3: User Story 1 — Gestionar valores de enumeración (Priority: P1) 🎯 MVP

**Goal**: El Escolástico accede a `/admin/configuracion/enums`, ve las 4 categorías configurables, y puede agregar un nuevo valor, renombrar su etiqueta, desactivarlo o reactivarlo. Los cambios se reflejan de inmediato en los selectores de toda la aplicación.

**Independent Test**: Ir a `/admin/configuracion/enums` → seleccionar "Tipo de Sesión" → agregar valor con código `Taller` y etiqueta `Taller` → ir a `/admin/clases/:id` → abrir formulario de registrar sesión → verificar que "Taller" aparece como opción en el selector de tipo. Luego desactivar "Repaso" → verificar que ya no aparece en el selector.

### Backend — Nuevos endpoints

- [x] T006 [P] [US1] Crear `apps/web/src/app/api/config/enums/route.ts` con handler GET que: (1) llame `requireAuth`, (2) consulte `prisma.enum_categorias.findMany` incluyendo `_count` de valores y valores activos, (3) mapee a `{ nombre, etiqueta, descripcion, total_valores, valores_activos }`, (4) retorne `json(result)`

- [x] T007 [P] [US1] Crear `apps/web/src/app/api/config/enums/[categoria]/route.ts` con handler GET que: (1) llame `requireAuth`, (2) lea query param `activos` (boolean string), (3) busque `prisma.enum_categorias.findUnique({ where: { nombre: params.categoria }, include: { valores: { where: activos ? { activo: true } : {}, orderBy: { orden: 'asc' } } } })`, (4) retorne 404 si no existe, (5) retorne `json(result)` con la categoría y sus valores

- [x] T008 [P] [US1] Crear `apps/web/src/app/api/config/enums/[categoria]/valores/route.ts` con handler POST que: (1) llame `requireAuth`, verifique rol `Escolastico`; (2) valide body: `codigo` requerido 1-50 chars, `etiqueta` requerida 1-100 chars, `orden` opcional int≥0; (3) busque la categoría por nombre, retorne 404 si no existe; (4) verifique unicidad de `codigo` y `etiqueta` (case-insensitive) dentro de la categoría, retorne 409 si duplicado; (5) calcule orden = max(orden_existente)+1 si no se provee; (6) llame `prisma.enum_valores.create`; (7) registre `auditLog` con `accion:'CREATE'`, `tabla_afectada:'enum_valores'`, `valor_nuevo:{ categoria: params.categoria, codigo, etiqueta }`; (8) retorne `json(nuevoValor, 201)`

- [x] T009 [P] [US1] Crear `apps/web/src/app/api/config/enums/[categoria]/valores/[id]/route.ts` con handler PATCH que: (1) llame `requireAuth`, verifique rol `Escolastico`; (2) valide body: al menos uno de `etiqueta`, `activo`, `orden` debe estar presente; `codigo` se ignora aunque se envíe; (3) busque el valor por `id` y verifique que pertenece a `params.categoria`, retorne 404 si no; (4) si se cambia `etiqueta`, verifique que no hay duplicado en la misma categoría (excluyendo el registro actual), retorne 409; (5) capture `valor_anterior` antes de actualizar; (6) llame `prisma.enum_valores.update`; (7) registre `auditLog` con `accion:'UPDATE'`, `tabla_afectada:'enum_valores'`, `valor_anterior` y `valor_nuevo`; (8) retorne `json(actualizado)`

### Backend — Actualización de validación en endpoints existentes

- [x] T010 [P] [US1] En `apps/web/src/app/api/clases/[id]/sesiones/route.ts`, en el handler POST: agregar validación del campo `tipo` — si `body.tipo` está presente, verificar que existe un `enum_valores` activo con `codigo === body.tipo` en la categoría `TipoSesion`; si no existe, retornar `ApiError('Tipo de sesión no válido', 400)`

- [x] T011 [P] [US1] En `apps/web/src/app/api/clases/[id]/inscripciones/[inscripcionId]/baja/route.ts`, en el handler PATCH: si `dto.motivo_baja` está presente, verificar que existe un `enum_valores` activo con `codigo === dto.motivo_baja` en la categoría `MotivoBaja`; si no existe, retornar `ApiError('Motivo de baja no válido', 400)`

- [x] T012 [P] [US1] En `apps/web/src/app/api/inscripciones/[id]/notas-finales/route.ts`, reemplazar las constantes `TIPOS_VALIDOS` y `VALORES_VALIDOS` por validación dinámica contra la DB: consultar `prisma.enum_valores.findFirst({ where: { categoria: { nombre: 'TipoNotaFinal' }, codigo: body.tipo_nota, activo: true } })` y lo mismo para `body.valor` en `EstadoNota`; retornar 400 si no son válidos

### Frontend — Nueva página de gestión

- [x] T013 [US1] Crear `apps/web/src/app/(admin)/admin/configuracion/enums/page.tsx` con: (a) `interface EnumValor { id: string; codigo: string; etiqueta: string; activo: boolean; orden: number }` e `interface EnumCategoria { nombre: string; etiqueta: string; descripcion?: string; total_valores: number; valores_activos: number }`; (b) estado `categorias`, `categoriaSeleccionada`, `valores`, `loading`, `error`; (c) `useEffect` que cargue `GET /api/config/enums` al montar; (d) función `loadValores(nombre)` que llame `GET /api/config/enums/:nombre`; (e) función `addValor(codigo, etiqueta)` que llame `POST /api/config/enums/:categoria/valores` y refresque la lista; (f) función `toggleActivo(id, activo)` que llame `PATCH /api/config/enums/:categoria/valores/:id` con `{ activo: !activo }` y refresque; (g) función `renameValor(id, etiqueta)` que llame `PATCH` con `{ etiqueta }` y refresque; (h) UI: dos columnas — izquierda: lista de categorías con `ListItemButton` seleccionable; derecha: tabla MUI con columnas "Código", "Etiqueta" (editable inline con TextField), "Estado" (Chip Activo/Inactivo), "Orden", acciones (toggle activo); formulario de agregar nuevo valor (TextField código + TextField etiqueta + botón Agregar); manejo de error 409 con mensaje "Ya existe ese código o etiqueta en la categoría"

### Frontend — Actualizar selectores existentes

- [x] T014 [P] [US1] En `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx`: (a) eliminar `type TipoSesion`, `type TipoNotaFinal`, `type EstadoNota` (reemplazar por `string`), `const TIPOS`, `const TIPOS_LABEL`, `const TIPOS_NOTA`, `const ESTADOS_NOTA`, `const MOTIVOS`, `const TIPO_NOTA_LABELS`; (b) agregar `interface EnumValor { codigo: string; etiqueta: string }` y 4 estados: `tipoSesionOpts`, `tipoNotaOpts`, `estadoNotaOpts`, `motivoBajaOpts` (todos `EnumValor[]`); (c) en el `useEffect` principal o en uno nuevo, cargar las 4 categorías llamando `GET /api/config/enums/:categoria?activos=true` para `TipoSesion`, `TipoNotaFinal`, `EstadoNota`, `MotivoBaja`; (d) actualizar el Select de tipo de sesión para iterar `tipoSesionOpts` mostrando `opt.etiqueta`; (e) actualizar los Select de tipo y valor de nota final para iterar `tipoNotaOpts` y `estadoNotaOpts`; (f) actualizar el Select de motivo de baja para iterar `motivoBajaOpts`; (g) actualizar los chips de notas (`n.tipo_nota` y `n.valor`) para buscar la etiqueta en `tipoNotaOpts`/`estadoNotaOpts` en lugar de `TIPO_NOTA_LABELS`; (h) actualizar el estado inicial de `notasTipo` y `notasValor` para usar el primer elemento de las listas cargadas

- [x] T015 [P] [US1] En `apps/web/src/app/(admin)/admin/asistencia/[claseId]/sesiones/[sesionId]/page.tsx`: eliminar `type TipoSesion`, `const TIPOS`, `const TIPOS_LABEL`; agregar `interface EnumValor { codigo: string; etiqueta: string }` y estado `tipoSesionOpts: EnumValor[]`; en `useEffect` llamar `GET /api/config/enums/TipoSesion?activos=true` y setear el estado; actualizar el Select de tipo de sesión para iterar `tipoSesionOpts`; actualizar el estado inicial de `tipo` para usar el primer elemento de la lista cargada

- [x] T016 [US1] En `apps/web/src/components/layout/Sidebar.tsx`: agregar `import TuneIcon from '@mui/icons-material/Tune'`; agregar al array `navItems` la entrada `{ label: 'Enumeraciones', href: '/admin/configuracion/enums', icon: <TuneIcon />, roles: ['Escolastico'] }` después de la entrada de Kardex

**Checkpoint**: US1 funcional — pantalla de gestión accesible, add/rename/toggle funcionan, selectores de toda la app cargan desde API.

---

## Phase 4: User Story 2 — Visualizar enumeraciones no configurables (Priority: P2)

**Goal**: El Escolástico puede ver las 5 enumeraciones no configurables (Rol, EstadoGeneral, EstadoClase, EstadoInscripcion, EstadoAsistencia) en la misma pantalla, en modo solo lectura con ícono de candado.

**Independent Test**: Ir a `/admin/configuracion/enums` → hacer scroll a la sección "Enumeraciones del sistema" → verificar que aparecen las 5 categorías con sus valores hardcodeados → verificar que no hay botones de edición → verificar el ícono de candado en cada categoría.

- [x] T017 [US2] En `apps/web/src/app/(admin)/admin/configuracion/enums/page.tsx`: agregar `import LockIcon from '@mui/icons-material/Lock'`; agregar constante `NON_CONFIGURABLE_ENUMS` con los 5 objetos `{ nombre, etiqueta, valores: string[] }`: (1) `{ nombre:'Rol', etiqueta:'Rol', valores:['Escolastico','Instructor','Miembro','Probacionista','ExProbacionista','ExMiembro'] }`, (2) `{ nombre:'EstadoGeneral', etiqueta:'Estado General', valores:['Activo','Inactivo'] }`, (3) `{ nombre:'EstadoClase', etiqueta:'Estado de Clase', valores:['Activa','Inactiva','Finalizada'] }`, (4) `{ nombre:'EstadoInscripcion', etiqueta:'Estado de Inscripción', valores:['Activo','Baja','Finalizado'] }`, (5) `{ nombre:'EstadoAsistencia', etiqueta:'Estado de Asistencia', valores:['Presente','Ausente','Licencia'] }`; debajo de la sección de categorías configurables, renderizar una nueva sección con título "Enumeraciones del sistema" y para cada categoría no configurable: un Card con `LockIcon`, el nombre/etiqueta, un `Alert severity="info"` con texto "Solo lectura — controlado por el sistema", y los valores listados como `<Chip>` deshabilitados sin ningún control de edición

**Checkpoint**: US2 íntegro — enumeraciones no configurables visibles en modo lectura.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T018 [P] En `apps/web/src/app/(admin)/admin/kardex/page.tsx`: reemplazar la constante `TIPO_NOTA_LABELS` y la declaración `type TipoNotaFinal` por un estado `tipoNotaOpts: { codigo: string; etiqueta: string }[]`; en el `useEffect` de carga inicial agregar una llamada a `GET /api/config/enums/TipoNotaFinal` (sin filtro activos para incluir todos los valores para el lookup histórico); actualizar el renderizado de chips de notas para buscar etiqueta en `tipoNotaOpts.find(o => o.codigo === n.tipo_nota)?.etiqueta ?? n.tipo_nota`

- [x] T019 [P] En `apps/web/src/app/(app)/kardex/page.tsx`: mismos cambios que T018 — reemplazar `TIPO_NOTA_LABELS` y `type TipoNotaFinal` por fetch a `GET /api/config/enums/TipoNotaFinal` y lookup dinámico en el renderizado de chips

- [x] T020 Ejecutar el flujo de prueba completo de `specs/029-config-enums/quickstart.md` — los 7 escenarios: agregar valor, desactivar, renombrar, reactivar, validar duplicados, ver no configurables, auditoría

- [x] T021 Ejecutar `npx tsc --noEmit` desde `apps/web/` — verificar que no hay errores de TypeScript tras eliminar los 4 enums del schema y actualizar los archivos afectados

---

## Dependencies

```
T001 (verificar estado)
  └─► T002 (schema.prisma)
        └─► T003 (migration.sql)
              └─► T004 (migrate deploy)
                    └─► T005 (prisma generate)
                          ├─► T006 [P] (GET /enums)
                          ├─► T007 [P] (GET /enums/:categoria)
                          ├─► T008 [P] (POST valores)
                          ├─► T009 [P] (PATCH valor)
                          ├─► T010 [P] (validar sesiones POST)
                          ├─► T011 [P] (validar baja PATCH)
                          ├─► T012 [P] (validar notas-finales POST)
                          ├─► T013    (admin/configuracion/enums/page.tsx)
                          │     └─► T017 [US2] (sección no configurables)
                          ├─► T014 [P] (clases/[id]/page.tsx selectores)
                          ├─► T015 [P] (asistencia sesion page selectores)
                          └─► T016    (Sidebar link)
                                T018 [P] (kardex admin)
                                T019 [P] (kardex user)
                                T020    (quickstart validation)
                                T021    (tsc --noEmit)
```

## Parallel Execution Opportunities

- **T006 + T007 + T008 + T009 + T010 + T011 + T012 + T014 + T015**: archivos distintos, dependen solo de T005
- **T018 + T019**: archivos distintos, independientes entre sí
- **T013 vs T014/T015/T016**: archivos distintos, pueden ejecutarse en paralelo

## Implementation Strategy

**MVP (US1)**: T001 → T002 → T003 → T004 → T005 → T006/T007/T008/T009 (paralelo) + T010/T011/T012 (paralelo) + T013 + T014/T015/T016 (paralelo)  
**Completo (US1 + US2 + Polish)**: secuencia completa incluyendo T017 → T018/T019/T020/T021  
**Archivos nuevos**: 5 (`config/enums/route.ts`, `config/enums/[categoria]/route.ts`, `config/enums/[categoria]/valores/route.ts`, `config/enums/[categoria]/valores/[id]/route.ts`, `admin/configuracion/enums/page.tsx`)  
**Archivos modificados**: 8 (`schema.prisma`, `sesiones/route.ts`, `baja/route.ts`, `notas-finales/route.ts`, `clases/[id]/page.tsx`, `asistencia/sesion/page.tsx`, `Sidebar.tsx`, `kardex×2`)  
**Total tareas**: 21 | US1: 14 tareas | US2: 1 tarea | Foundational: 5 | Setup: 1 | Polish: 4
