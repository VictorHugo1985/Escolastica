# Plan de Implementación: Modelo de Datos y Diccionario Maestro

**Rama**: `002-diccionario-datos` | **Fecha**: 2026-04-15 | **Spec**: [specs/002-diccionario-datos/spec.md](specs/002-diccionario-datos/spec.md)
**Entrada**: Especificación maestra de base de datos de `/specs/002-diccionario-datos/spec.md`

## Resumen

Implementar el esquema de base de datos relacional consolidado en Prisma como la fuente única de verdad del sistema Escolastica. Este plan abarca la definición de todas las entidades (Usuarios, Materias, Clases, Sesiones, Asistencias, Notas, etc.), sus relaciones y restricciones, asegurando la integridad referencial y el soporte para auditoría y soft deletes según lo exigido por la Constitución.

## Contexto Técnico

**Lenguaje/Versión**: TypeScript / Prisma 5.x
**Dependencias Principales**: Prisma Client, Prisma Migrate, PostgreSQL (Supabase).
**Almacenamiento**: PostgreSQL en Supabase.
**Testing**: Prisma Studio (visualización), scripts de validación de esquema.
**Target Platform**: Supabase DB.
**Project Type**: Database Schema / Package (`packages/database`).
**Performance Goals**: Migraciones < 1 min, integridad referencial garantizada por DB.
**Constraints**: 3NF, UUIDs para todas las PKs, Auditoría automática (Spec 012), Soporte para sesiones académicas.
**Scale/Scope**: 15+ tablas maestras que cubren todo el MVP de Escolastica.

## Verificación de la Constitución

*GATE: Debe pasar antes de la investigación de la Fase 0. Volver a verificar después del diseño de la Fase 1.*

- [x] **Data-First**: Este es el núcleo del principio Data-First; el esquema se define antes que cualquier lógica de aplicación.
- [x] **Mobile-First**: N/A (Capa de datos), pero soporta la rapidez requerida para registros móviles mediante índices.
- [x] **Modular**: El esquema se organiza para permitir extensiones futuras sin modificar el núcleo (ej. tablas de logs separadas).
- [x] **Auditoría**: Se incluye la tabla `logs_auditoria` con soporte para JSONB (valor_anterior/nuevo).
- [x] **Sesiones**: Implementación explícita de la tabla `sesiones` vinculada a `clases` y `asistencias`.

## Estructura del Proyecto

### Documentación (esta característica)

```text
specs/002-diccionario-datos/
├── plan.md              # Este archivo
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── contracts/           # N/A (Esquema de DB)
└── tasks.md             # Salida de la Fase 2 (generado por speckit.tasks)
```

### Código Fuente (raíz del repositorio)

```text
Escolastica/
├── packages/
│   └── database/
│       ├── schema.prisma    # Definición central del esquema
│       ├── seed.ts          # Datos iniciales (Roles, Admin base)
│       └── migrations/      # Historial de cambios en la base de datos
```

**Decisión de Estructura**: Centralizar el esquema en `packages/database` para que todas las aplicaciones del monorepo (API, Web) consuman un cliente de Prisma tipado y consistente.

## Seguimiento de Complejidad

> **Completar SOLO si el Constitution Check tiene violaciones que deben justificarse**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|-----------------------------------------|
| N/A | | |
