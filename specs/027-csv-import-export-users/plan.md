# Implementation Plan: Importación CSV y Exportación Excel de Usuarios

**Branch**: `027-csv-import-export-users` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-csv-import-export-users/spec.md`

## Summary

Extensión del módulo `users` existente para agregar dos nuevos endpoints REST (`POST /users/import` y `GET /users/export`) y sus correspondientes controles en la UI de la sección de usuarios, accesibles exclusivamente para el rol Escolástico. El backend usa `csv-parse` para procesar el archivo CSV fila por fila y `exceljs` para generar el Excel en streaming. El upload se maneja con el `FileInterceptor` de NestJS (multer, ya disponible). No se modifica el esquema de base de datos.

## Technical Context

**Language/Version**: TypeScript 5.4 / Node.js 20
**Primary Dependencies (nuevas)**: `csv-parse ^5.x`, `exceljs ^4.x`, `@types/multer ^1.x` (solo en `apps/api`)
**Primary Dependencies (existentes)**: NestJS 10, Prisma 5, MUI 5, Next.js 14, axios
**Storage**: PostgreSQL vía Prisma (tablas existentes: `usuarios`, `usuario_roles`, `roles`)
**Target Platform**: Web (desktop-first para funcionalidades admin del Escolástico)
**Performance Goals**: Importación de 100 filas < 30s; exportación de 1000 usuarios < 10s
**Constraints**: Archivos CSV máx. 5MB en memoria (sin escritura a disco); sin nuevas tablas DB
**Scale/Scope**: Hasta ~1000 usuarios por lote de importación / exportación

## Constitution Check

- [X] **Data-First**: No se agregan ni modifican tablas. Se usan `usuarios` y `usuario_roles` con el mismo flujo de creación existente. Compatible con el Diccionario de Datos Maestro (Spec 003).
- [X] **Mobile-First**: Feature administrativa (Escolástico) — la constitución indica que funcionalidades de configuración/análisis están optimizadas para desktop. El dialog de importación es funcional en desktop.
- [X] **Modular**: Se extiende el módulo `users` existente con nuevos métodos y endpoints. No se modifica lógica de otros módulos (auth, sesiones, auditoria).
- [X] **Audit**: Cada usuario creado vía importación genera un log en `auditoria` usando el `AuditoriaService` existente, igual que la creación manual.
- [X] **Sessions**: No aplica — esta feature no involucra sesiones académicas.

## Project Structure

### Documentation (this feature)

```text
specs/027-csv-import-export-users/
├── plan.md              ✅ este archivo
├── research.md          ✅ decisiones de librería y arquitectura
├── data-model.md        ✅ entidades usadas y estructuras en memoria
├── quickstart.md        ✅ escenarios de integración y prueba
├── contracts/
│   ├── api.md           ✅ contratos de los 3 endpoints REST
│   └── ui.md            ✅ contrato del dialog de importación y botones
└── tasks.md             ✅ plan de tareas generado
```

### Source Code — archivos afectados

```text
apps/api/
├── src/users/
│   ├── users.service.ts       MODIFICAR — agregar importCsv() y exportExcel()
│   └── users.controller.ts    MODIFICAR — agregar POST /import, GET /export, GET /import-template
└── package.json               MODIFICAR — agregar csv-parse, exceljs, @types/multer

apps/web/
└── src/app/(admin)/admin/users/
    └── page.tsx               MODIFICAR — agregar botones Import/Export y Dialog de importación

packages/shared/
└── src/schemas/user.schema.ts  MODIFICAR — agregar tipo ImportResultDto
```

### Decisión de estructura

Se extiende el módulo `users` existente (no se crea módulo nuevo). La lógica de parsing CSV y generación Excel vive en `UsersService` como métodos `importCsv(actorId, file, rolNombre)` y `exportExcel(filters, res)`. El controller expone los endpoints con decoradores de rol y el `FileInterceptor` de multer para el upload.
