# Tareas: Modelo de Datos y Diccionario Maestro (002)

**Entrada**: Documentos de diseño de `/specs/002-diccionario-datos/`
**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (diferentes archivos, sin dependencias)
- **[Story]**: A qué historia de usuario pertenece esta tarea (e.g., US1, US2, US3)

---

## Fase 1: Configuración (Infraestructura Compartida)

- [x] T001 Inicializar el paquete de base de datos en `packages/database/package.json`
- [x] T002 Configurar Prisma con el generador y el provider en `packages/database/schema.prisma`
- [x] T003 [P] Configurar scripts de Turborepo para comandos de base de datos en `turbo.json` y `package.json` raíz

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**⚠️ CRÍTICO**: No puede comenzar el trabajo en historias de usuario hasta que esta fase esté completa.

- [x] T004 Configurar la conexión a Supabase PostgreSQL en `packages/database/.env`
- [x] T005 Definir Enums globales (EstadoAsistencia, EstadoNota, Roles) en `packages/database/schema.prisma`
- [x] T006 [P] Configurar el motor de UUID (`gen_random_uuid`) en el esquema de Prisma

**Punto de control**: Base lista - la implementación del modelo de datos por historia puede comenzar.

---

## Fase 3: Historia de Usuario 1 - Definición de Entidades Core (Prioridad: P1) 🎯 MVP

**Objetivo**: Establecer el esquema relacional completo que servirá como fuente única de verdad para el sistema Escolastica.

**Prueba Independiente**: Ejecutar `npx prisma validate` y verificar que el esquema compile sin errores y que las relaciones (1:N, N:M) sean coherentes.

### Implementación para la Historia de Usuario 1

- [x] T007 [P] [US1] Definir tabla `roles` y `usuarios` en `packages/database/schema.prisma`
- [x] T008 [P] [US1] Definir tablas de Pensum (`materias`, `temas`) en `packages/database/schema.prisma`
- [x] T009 [P] [US1] Definir tablas de Infraestructura (`aulas`, `horarios`) en `packages/database/schema.prisma`
- [x] T010 [P] [US1] Definir tablas de Instancia Académica (`clases`, `sesiones`) en `packages/database/schema.prisma`
- [x] T011 [P] [US1] Definir tablas de Seguimiento (`inscripciones`, `asistencias`, `notas`) en `packages/database/schema.prisma`
- [x] T012 [P] [US1] Definir tabla de Auditoría (`logs_auditoria`) con soporte JSONB en `packages/database/schema.prisma`
- [x] T013 [US1] Ejecutar migración inicial para sincronizar con Supabase usando `npx prisma migrate dev`
- [x] T014 [US1] Implementar script de Seed idempotente en `packages/database/seed.ts` para roles y admin base
- [x] T015 [US1] Validar la integridad referencial mediante `npx prisma db seed` y verificación en Prisma Studio

**Punto de control**: Historia de Usuario 1 funcional y esquema validado en base de datos.

---

## Fase 4: Pulido y Temas Transversales

- [x] T016 [P] Generar el Cliente de Prisma tipado en `packages/database` para uso en el monorepo
- [x] T017 [P] Actualizar `GEMINI.md` con las rutas de las entidades de base de datos
- [x] T018 Ejecutar validación final de `quickstart.md` para asegurar que los comandos funcionen en un entorno limpio
