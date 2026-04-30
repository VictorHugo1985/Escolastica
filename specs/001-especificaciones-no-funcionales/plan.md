# Plan de Implementación: Especificaciones Generales y Autenticación

**Rama**: `001-especificaciones-no-funcionales` | **Fecha**: 2026-04-15 | **Spec**: [specs/001-especificaciones-no-funcionales/spec.md](specs/001-especificaciones-no-funcionales/spec.md)
**Entrada**: Especificación de características de `/specs/001-especificaciones-no-funcionales/spec.md`

## Resumen

Establecer la estructura base del monorepo (Turborepo) e implementar el sistema de autenticación centralizado. Esto incluye la separación de responsabilidades entre el frontend (Next.js) y el backend (Nest.js), la gestión de sesiones seguras y los flujos de recuperación de contraseña, todo bajo los estándares de seguridad definidos en la Constitución.

## Contexto Técnico

**Lenguaje/Versión**: TypeScript / Node.js (Latest LTS)
**Dependencias Principales**: Next.js (App Router), Nest.js, Supabase Auth (gestionado localmente en Nest.js), Prisma, Zod, Material UI (MUI), Lucide React (iconos), bcrypt (hashing).
**Almacenamiento**: Supabase (PostgreSQL) para usuarios y tokens.
**Testing**: Vitest (Unit/Integration), Playwright (E2E).
**Plataforma Objetivo**: Serverless (Vercel/AWS Lambda).
**Tipo de Proyecto**: Aplicación Web / Monorepo (Turborepo).
**Objetivos de Rendimiento**: Login < 500ms, validación de sesión < 100ms.
**Restricciones**: HTTPS obligatorio, expiración de sesión por inactividad, protección contra fuerza bruta.
**Alcance**: Gestión de usuarios (Admin, Instructor, Miembro) y sesiones seguras.

## Verificación de la Constitución

*GATE: Debe pasar antes de la investigación de la Fase 0. Volver a verificar después del diseño de la Fase 1.*

- [x] **Data-First**: El modelo de datos de usuario y sesión debe integrarse en el esquema maestro de Prisma.
- [x] **Mobile-First**: La pantalla de login debe estar optimizada para dispositivos móviles (fricción mínima).
- [x] **Modular**: La autenticación será un módulo independiente en Nest.js (`AuthModule`).
- [x] **Auditoría**: Los intentos de login fallidos y cambios de contraseña deben registrarse en el sistema de auditoría (Spec 012).
- [x] **Sesiones**: Implementación de JWT con expiración configurable y manejo de sesiones seguras.

## Estructura del Proyecto

### Documentación (esta característica)

```text
specs/001-especificaciones-no-funcionales/
├── plan.md              # Este archivo
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── contracts/           # Salida de la Fase 1
└── tasks.md             # Salida de la Fase 2 (generado por speckit.tasks)
```

### Código Fuente (raíz del repositorio)

```text
Escolastica/
├── apps/
│   ├── web/             # Frontend: Pantallas de Login, Reset Password, Registro
│   └── api/             # Backend: AuthModule (Login, JWT, Password Hash, Reset Token)
├── packages/
│   ├── shared/          # Esquemas Zod de Login y Registro
│   └── database/        # Modelos User y Session en schema.prisma
```

**Decisión de Estructura**: Se mantiene la estructura de Monorepo (Turborepo) definida en la Spec 000, asegurando que los esquemas de validación de credenciales sean compartidos entre cliente y servidor.

## Seguimiento de Complejidad

> **Completar SOLO si el Constitution Check tiene violaciones que deben justificarse**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|-----------------------------------------|
| N/A | | |
