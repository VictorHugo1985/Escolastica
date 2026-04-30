# Tasks: Importación CSV y Exportación Excel de Usuarios

**Input**: Design documents from `/specs/027-csv-import-export-users/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea
- Todos los paths son relativos a la raíz del monorepo

---

## Phase 1: Setup

**Goal**: Instalar dependencias necesarias para parsear CSV y generar Excel

- [X] T001 Instalar `csv-parse`, `exceljs` y `@types/multer` en `apps/api` ejecutando `npm install csv-parse exceljs @types/multer --workspace=apps/api`

**Checkpoint**: Dependencias disponibles en `apps/api/node_modules`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRÍTICO**: Ninguna historia puede comenzar hasta completar esta fase

- [X] T002 Agregar el tipo `ImportResultDto` en `packages/shared/src/schemas/user.schema.ts` — exportar la interface `{ total: number; creados: number; duplicados: number; errores: number; filas_fallidas: Array<{ fila_numero: number; nombre: string; email: string; resultado: 'creado'|'duplicado'|'error'; motivo?: string }> }` como tipo TypeScript
- [X] T003 Reconstruir el paquete shared ejecutando `npm run build --workspace=packages/shared` para que `apps/api` y `apps/web` vean los nuevos tipos

**Checkpoint**: Tipo `ImportResultDto` disponible en `@escolastica/shared`

---

## Phase 3: User Story 1 — Importación masiva de usuarios desde CSV (Priority: P1) 🎯 MVP

**Goal**: El Escolástico puede subir un CSV, seleccionar un rol, y el sistema crea los usuarios válidos reportando el resultado fila por fila.

**Independent Test**: Usando los escenarios 1, 2 y 3 de `quickstart.md` — importar CSV válido, CSV con duplicados/errores, y CSV con formato incorrecto.

### Backend — US1

- [X] T004 [US1] Agregar método `importCsv(actorId: string, buffer: Buffer, rolNombre: string): Promise<ImportResultDto>` en `apps/api/src/users/users.service.ts`:
  - Importar `csv-parse` con `parse` de `csv-parse/sync`
  - Validar que `rolNombre` corresponde a un rol existente (buscar en `prisma.roles`)
  - Parsear el buffer como CSV con `{ columns: true, skip_empty_lines: true, trim: true }`
  - Verificar que existan las columnas `nombre_completo` y `email` — si no, lanzar `BadRequestException`
  - Iterar fila por fila: si el email ya existe → resultado `duplicado`; si `nombre_completo` está vacío → resultado `error`; si todo válido → llamar a `prisma.usuarios.create` + `prisma.usuario_roles.create` + `auditoria.log`
  - Retornar el objeto `ImportResultDto` con los conteos y las `filas_fallidas`

- [X] T005 [US1] Agregar método `getImportTemplate(): string` en `apps/api/src/users/users.service.ts` que retorna el string CSV estático de la plantilla de ejemplo (ver `data-model.md`)

- [X] T006 [US1] Agregar los tres endpoints en `apps/api/src/users/users.controller.ts`:
  - `POST /users/import` con `@UseInterceptors(FileInterceptor('file'))`, `@UploadedFile() file: Express.Multer.File`, `@Body('rolNombre') rolNombre: string`, guard `@Roles(Rol.Escolastico)` — llama a `usersService.importCsv(req.user.id, file.buffer, rolNombre)` — retorna `ImportResultDto`
  - `GET /users/export` con `@Roles(Rol.Escolastico)`, `@Res() res: Response`, query params `rol`, `estado`, `search` — llama a `usersService.exportExcel(filters, res)` que escribe directamente al stream de respuesta
  - `GET /users/import-template` con `@Roles(Rol.Escolastico)`, `@Res() res: Response` — setea headers y escribe el CSV de plantilla
  - Agregar imports necesarios: `FileInterceptor`, `UseInterceptors`, `UploadedFile`, `Res` de NestJS, `Response` de express

- [X] T007 [US1] Agregar método `exportExcel(filters: { rol?: string; estado?: string; search?: string }, res: Response): Promise<void>` en `apps/api/src/users/users.service.ts`:
  - Llamar a `this.findAll(filters)` para obtener los usuarios ya filtrados
  - Crear un `workbook` y `worksheet` con `exceljs`
  - Agregar la fila de encabezados según `data-model.md` (Nombre completo, Email, CI, Teléfono, Género, Fecha nacimiento, Estado, Fecha inscripción, Fecha recibimiento, Roles, Creado el)
  - Agregar una fila por usuario mapeando todos los campos; `Roles` se forma uniendo `user.roles.map(r => r.rol.nombre).join(', ')`
  - Setear en `res` el header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y `Content-Disposition: attachment; filename="usuarios-YYYY-MM-DD.xlsx"` con la fecha actual
  - Escribir el workbook al stream con `workbook.xlsx.write(res)` y llamar `res.end()`

- [X] T008 [US1] Registrar `MulterModule` en `apps/api/src/users/users.module.ts` con `MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })` e importar `MulterModule` de `@nestjs/platform-express`

**Checkpoint US1 backend**: Los tres endpoints responden correctamente con curl/Swagger

### Frontend — US1

- [X] T009 [US1] Agregar el componente `ImportDialog` dentro de `apps/web/src/app/(admin)/admin/users/page.tsx` como componente interno:
  - Estado: `open`, `rolNombre`, `file`, `loading`, `resultado` (tipo `ImportResultDto | null`), `errorMsg`
  - Selector de rol: `Select` con opciones `['Instructor', 'Miembro', 'Probacionista', 'Escolastico', 'ExMiembro', 'ExProbacionista']`
  - Input de archivo: `<input type="file" accept=".csv,text/csv">` estilizado con `Button` que muestra el nombre del archivo seleccionado
  - Link "Descargar plantilla de ejemplo": llama a `api.get('/users/import-template', { responseType: 'blob' })` y dispara la descarga
  - Botón "Importar": disabled si no hay rol ni archivo; muestra `CircularProgress` durante el proceso
  - Al submit: `FormData` con `file` y `rolNombre`, llamar a `api.post('/users/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
  - Mostrar resultado: Alert verde/amarillo/rojo según conteos; tabla MUI con `filas_fallidas` si las hay
  - Al cerrar: llamar `onSuccess()` para recargar la lista

- [X] T010 [US1] Agregar botones "Importar CSV" y "Exportar Excel" en la sección de acciones de `apps/web/src/app/(admin)/admin/users/page.tsx`:
  - Ambos visibles solo si el usuario tiene rol `Escolastico` (leer de `useAuthStore`)
  - "Importar CSV": ícono `UploadFileIcon`, abre el `ImportDialog`
  - "Exportar Excel": ícono `DownloadIcon`, llama a `api.get('/users/export', { params: { search, rol, estado }, responseType: 'arraybuffer' })`, crea un `Blob` y dispara la descarga con un `<a>` temporal
  - Agregar estado `exportLoading` para mostrar spinner en el botón de exportar mientras se genera el archivo

**Checkpoint US1 completo**: Flujo end-to-end verificado con los 5 escenarios de `quickstart.md`

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T011 [P] Validar que el endpoint `POST /users/import` rechaza archivos no CSV (PDF, imagen) verificando `file.mimetype` — lanzar `BadRequestException('Solo se aceptan archivos CSV')` si el MIME type no es `text/csv` ni `text/plain`
- [X] T012 [P] Validar en el frontend que el archivo seleccionado tenga extensión `.csv` antes de enviarlo — mostrar mensaje de error inline si el usuario selecciona otro tipo
- [ ] T013 Verificar los 5 escenarios de `quickstart.md` end-to-end con la aplicación corriendo

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011, T012 → T013
```

T004 y T005 pueden hacerse en paralelo entre sí (métodos independientes en el mismo servicio).
T009 y T010 pueden hacerse en paralelo entre sí (ambos en el mismo archivo pero secciones distintas).
T011 y T012 pueden hacerse en paralelo entre sí.

---

## Parallel Execution Examples

**Backend (T004 + T005)**: Los métodos `importCsv` y `getImportTemplate` no tienen dependencias entre sí — pueden implementarse simultáneamente en `users.service.ts`.

**Frontend (T009 + T010)**: El componente `ImportDialog` (T009) y los botones de la página (T010) son secciones distintas del mismo archivo — pueden implementarse en paralelo si hay dos agentes.

**Polish (T011 + T012)**: Validaciones de backend y frontend son independientes.

---

## Implementation Strategy

**MVP (US1 completo)**: Implementar T001–T010 en orden. Al completar T010 el Escolástico puede importar y exportar usuarios end-to-end.

**Polish post-MVP**: T011–T013 mejoran la robustez pero no bloquean el uso de la feature.

**Orden recomendado de implementación**:
1. T001 (instalar deps) → T002–T003 (shared types)
2. T004–T005 en paralelo (métodos del service)
3. T006 (controller con los tres endpoints) → T007 (exportExcel) → T008 (MulterModule)
4. T009–T010 en paralelo (frontend)
5. T011–T012 en paralelo → T013 (validación end-to-end)
