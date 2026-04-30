# Research: Importación CSV y Exportación Excel de Usuarios

**Feature**: 027-csv-import-export-users
**Date**: 2026-04-28

---

## Decision 1: Librería de parsing CSV en el backend

**Decision**: `csv-parse` (paquete `csv-parse` del ecosistema `csv`)

**Rationale**:
- API streaming y callback nativas para Node.js
- Soporte TypeScript sin tipos externos
- Manejo robusto de encoding, delimitadores y comillas
- Permite procesar fila por fila sin cargar el CSV completo en memoria
- Activamente mantenida (>20M descargas semanales)

**Alternatives considered**:
- `papaparse`: excelente para browser, overhead innecesario en server-side
- `fast-csv`: similar feature set, pero `csv-parse` tiene mejor documentación y más adopción en NestJS

---

## Decision 2: Librería de generación Excel en el backend

**Decision**: `exceljs`

**Rationale**:
- Pure JavaScript, sin bindings nativos C++ (no requiere `node-gyp`)
- API de alto nivel para formatear celdas, columnas y hojas
- Soporta streaming write (no carga todo en memoria para archivos grandes)
- Licencia MIT — sin restricciones comerciales
- Compatible con `.xlsx` estándar (Office Open XML)

**Alternatives considered**:
- `xlsx` (SheetJS): muy popular pero la versión community tiene limitaciones; la versión Pro es comercial
- `json2csv` + `xlsx`: más pasos, más dependencias
- `node-xlsx`: más simple pero menos control sobre formato

---

## Decision 3: Manejo de upload de archivos en NestJS

**Decision**: `FileInterceptor` de `@nestjs/platform-express` (ya incluido como dependencia)

**Rationale**:
- `multer` ya está disponible a través de `@nestjs/platform-express` (dependencia existente)
- `FileInterceptor` proporciona el archivo como buffer en memoria — adecuado para CSV pequeños/medianos
- No requiere instalación de dependencias adicionales para upload
- Se valida extensión y MIME type en el interceptor antes de procesar

**Alternatives considered**:
- Guardar archivo en disco temporalmente: innecesario para archivos CSV (bajo peso)
- Streaming de upload: sobre-ingeniería para el volumen esperado (<1MB por CSV)

---

## Decision 4: Entrega del Excel al frontend (download)

**Decision**: Stream directo como `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` con headers `Content-Disposition: attachment`

**Rationale**:
- El backend escribe el workbook directamente al `Response` stream de Express
- El frontend crea un `Blob` desde el `ArrayBuffer` de la respuesta axios y dispara un `<a>` invisible con `URL.createObjectURL`
- Sin almacenamiento temporal en servidor
- Patrón estándar para descargas de archivos en NestJS + axios

**Alternatives considered**:
- Generar archivo, guardar en S3 y devolver URL firmada: complejidad innecesaria para archivos pequeños
- Base64 en JSON: ineficiente para archivos binarios

---

## Decision 5: Ubicación de la lógica en el código

**Decision**: Extender el módulo `users` existente — nuevos métodos en `UsersService` y nuevos endpoints en `UsersController`

**Rationale**:
- La importación y exportación son operaciones sobre la entidad `Usuario` — cohesión natural con el módulo existente
- Evita crear un nuevo módulo/servicio que aumentaría el acoplamiento
- El `UsersService.create()` existente ya contiene las validaciones de email duplicado y CI — se reutiliza esa lógica

**Alternatives considered**:
- Módulo `ImportExportModule` separado: justificable solo si la lógica fuera compleja o reutilizable en otros contextos

---

## Decision 6: Validaciones de formato CSV

**Decision**: Validar en dos pasadas — primero estructura (headers), luego datos fila por fila

**Rationale**:
- Si los headers son incorrectos, se rechaza todo el archivo con mensaje claro antes de procesar
- Si los headers son válidos, se procesan fila por fila: las filas válidas se crean, las inválidas se reportan
- El proceso nunca se interrumpe por una fila mala individual

**Required columns**: `nombre_completo`, `email`
**Optional columns**: `telefono`, `ci`, `fecha_nacimiento`, `genero`

---

## Decision 7: Auditoría de importaciones

**Decision**: Cada usuario creado via importación genera un registro en `auditoria` igual que la creación manual

**Rationale**:
- La constitución requiere auditoría de acciones críticas
- El `AuditoriaService` ya existe y se usa en `UsersService.create()`
- Actor: el ID del Escolástico que ejecuta la importación

---

## Nuevas dependencias necesarias

| Paquete     | Workspace | Versión recomendada | Propósito         |
|-------------|-----------|---------------------|-------------------|
| `csv-parse` | `apps/api` | `^5.x`             | Parsing CSV       |
| `exceljs`   | `apps/api` | `^4.x`             | Generación .xlsx  |
| `@types/multer` | `apps/api` | `^1.x`         | Tipos TypeScript para upload |

No se requieren nuevas dependencias en el frontend (`apps/web`).
