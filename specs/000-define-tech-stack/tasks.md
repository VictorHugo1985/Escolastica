# Tareas: Definición del Tech Stack (000)

**Entrada**: Documentos de diseño de `/specs/000-define-tech-stack/`
**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (diferentes archivos, sin dependencias)
- **[Story]**: A qué historia de usuario pertenece esta tarea (e.g., US1, US2, US3)

---

## Fase 1: Configuración (Inicialización del Monorepo)

- [ ] T001 Inicializar el workspace de Turborepo en la raíz del proyecto `Escolastica/`
- [ ] T002 Configurar `turbo.json` con los pipelines básicos (build, dev, lint, test)
- [ ] T003 [P] Crear estructura de carpetas `apps/` y `packages/`
- [ ] T004 [P] Configurar Eslint y Prettier compartidos en `packages/config/`
- [ ] T005 [P] Configurar TypeScript base en `packages/config/tsconfig.base.json`

---

## Fase 2: Fundacional (Estructura de Paquetes y Apps)

**⚠️ CRÍTICO**: No puede comenzar el trabajo en historias de usuario hasta que esta fase esté completa.

- [ ] T006 Inicializar aplicación Next.js en `apps/web/` con Material UI
- [ ] T007 Inicializar aplicación Nest.js en `apps/api/`
- [ ] T008 Crear paquete compartido para esquemas Zod en `packages/shared/`
- [ ] T009 Crear paquete de base de datos con Prisma en `packages/database/`
- [ ] T010 Configurar Sentry para reporte de errores en `apps/web/` y `apps/api/`

**Punto de control**: Base lista - la validación del stack puede comenzar.

---

## Fase 3: Historia de Usuario 1 - Estandarización del Entorno (Prioridad: P1) 🎯 MVP

**Objetivo**: Asegurar que todos los desarrolladores utilicen las mismas herramientas y patrones mediante la documentación y configuración del stack oficial.

**Prueba Independiente**: Verificar que se puedan ejecutar simultáneamente las apps de frontend y backend usando `npm run dev` desde la raíz.

### Implementación para la Historia de Usuario 1

- [ ] T011 [US1] Documentar versiones de herramientas y variables de entorno necesarias en `quickstart.md`
- [ ] T012 [P] [US1] Configurar scripts de inicialización en `package.json` raíz para orquestar el monorepo
- [ ] T013 [US1] Validar que `packages/database` genere el cliente de Prisma correctamente para el backend
- [ ] T014 [US1] Implementar un endpoint de "health check" en `apps/api/src/app.controller.ts` para validar el backend

**Punto de control**: Entorno estandarizado y funcional.

---

## Fase 4: Historia de Usuario 2 - Prueba de Integración Full-stack (Prioridad: P1)

**Objetivo**: Validar la comunicación extremo a extremo entre Next.js, Nest.js y Supabase en un entorno monorepo.

**Prueba Independiente**: Realizar una petición desde el frontend al backend que consulte la base de datos y retorne un resultado exitoso.

### Implementación para la Historia de Usuario 2

- [ ] T015 [US2] Definir un esquema Zod de prueba en `packages/shared/src/schemas/test.schema.ts`
- [ ] T016 [US2] Implementar endpoint de prueba "ping" en el backend que use el esquema Zod y valide la conexión a DB
- [ ] T017 [US2] Crear página de validación en `apps/web/src/app/debug/page.tsx` que consuma el endpoint "ping" vía TanStack Query
- [ ] T018 [US2] Configurar GitHub Actions en `.github/workflows/ci.yml` para validar el build de todo el monorepo

**Punto de control**: Integración full-stack validada.

---

## Fase 5: Pulido y Temas Transversales

- [ ] T019 [P] Configurar el diccionario de datos vivo mediante comentarios de Prisma (`///`) expuestos en Swagger
- [ ] T020 Configurar Vitest básico en el monorepo para pruebas unitarias rápidas
- [ ] T021 Ejecutar validación final de todos los pasos en `quickstart.md`
