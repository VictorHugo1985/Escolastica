# Feature Specification: Tech Stack Definition

**Feature Branch**: `000-define-tech-stack`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Definir que el stack a utilizar sera next.js nest.js y supabase"

## Clarifications

### Session 2026-04-06

- Q: ¿Cómo se reconciliará la estructura del proyecto (Monorepo vs Carpetas independientes)? → A: Por definir (Pendiente de análisis técnico).
- Q: ¿Cómo se gestionará la autenticación: localmente o delegada a Supabase Auth? → A: Gestión local (Nest.js + Base de Datos), alineado con 001 y 002.

### Session 2026-04-04

- Q: ¿Cómo se transmitirá el JWT de Supabase Auth al backend? → A: Mediante el header Authorization (Bearer Token).
- Q: ¿Debería el backend implementar un filtro de excepciones global estandarizado? → A: Sí, utilizando un objeto JSON estandarizado para todas las respuestas de error.

### Session 2026-04-04

- Q: ¿Qué stack de testing se utilizará? → A: Por definir (fase posterior).
- Q: ¿Qué plataforma de CI/CD se utilizará? → A: GitHub Actions.
- Q: ¿Cuál será la estrategia de fetching de datos en el frontend? → A: TanStack Query (React Query).
- Q: ¿Qué sistema de iconografía se utilizará? → A: MUI Icons (@mui/icons-material).
- Q: ¿Qué herramienta de monitoreo y tracking de errores se utilizará? → A: Sentry.
- Q: ¿Cómo se garantizará el cumplimiento del principio "Database-First" con Prisma? → A: Schema-First: El archivo schema.prisma será la única fuente de verdad, revisado y aprobado antes de cualquier desarrollo de código.
- Q: ¿Cómo se implementará la estrategia Mobile-First vs Admin Desktop? → A: Layouts de vista separados: Uso de breakpoints de MUI para renderizar vistas móviles simplificadas para instructores y dashboards densos para administración.
- Q: ¿Cómo se garantizará el crecimiento modular en Nest.js? → A: Módulos basados en dominio: Cada área funcional será un módulo autónomo, evitando la modificación de servicios core existentes.
- Q: ¿Cómo se integrarán los esquemas de Zod en el backend de Nest.js? → A: Transformación Zod-to-Class: Derivación automática de clases DTO y documentación de Swagger a partir de los esquemas de Zod compartidos para asegurar consistencia estructural.
- Q: ¿Cómo se mantendrá el diccionario de datos requerido por la Constitución? → A: Comentarios de Prisma + Swagger: Uso de la sintaxis `///` en schema.prisma para documentar campos y restricciones, exponiéndolos en Swagger UI como diccionario vivo.

### Session 2026-03-10

- Q: ¿Cuál será la estrategia de despliegue para Nest.js? → A: Serverless (Vercel/AWS Lambda).
- Q: ¿Cómo será la estructura del proyecto? → A: Monorepo (Turborepo).
- Q: ¿Qué estrategia de autenticación se utilizará? → A: Supabase Auth (Gestionado por Supabase).
- Q: ¿Cómo se gestionarán las migraciones de la base de datos? → A: Prisma Migrate (Gestionado por Prisma).
- Q: ¿Qué protocolo de documentación de API se utilizará? → A: Swagger / OpenAPI (Generación automática).
- Q: ¿Cuál será la estrategia de estilos y componentes UI? → A: Material UI.
- Q: ¿Qué estrategia de validación de datos se utilizará? → A: Zod (Esquemas compartidos).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Development Environment Standardization (Priority: P1)

Como **arquitecto del sistema**, quiero definir y documentar el stack tecnológico oficial (Next.js, Nest.js, Supabase) para asegurar que todos los desarrolladores utilicen las mismas herramientas y patrones, minimizando la fricción técnica y facilitando la integración.

**Why this priority**: Es fundamental para el inicio de cualquier desarrollo técnico. Sin un stack definido, el equipo corre el riesgo de implementar soluciones inconsistentes que violarían los principios de Clean Code y Modularidad de la Constitución.

**Independent Test**: Verificar que la documentación del stack esté presente en el repositorio y que los proyectos base (frontend/backend) puedan inicializarse usando estas tecnologías en un workspace de Turborepo.

**Acceptance Scenarios**:

1. **Given** un desarrollador nuevo, **When** consulta la documentación del stack, **Then** debe identificar claramente las versiones y herramientas requeridas para frontend, backend y base de datos.
2. **Given** la necesidad de modificar el esquema de datos, **When** se utiliza Prisma Migrate, **Then** el cambio debe propagarse de forma consistente en el monorepo y generar el cliente tipado para Nest.js.

---

### User Story 2 - Full-stack Integration Proof (Priority: P1)

Como **desarrollador principal**, quiero implementar una funcionalidad mínima de "extremo a extremo" (ej. un ping/pong o login básico) usando Next.js, Nest.js y Supabase, para validar que la integración entre los tres componentes funciona correctamente en un entorno Serverless y Monorepo.

**Why this priority**: Valida que la arquitectura propuesta es viable y que no hay bloqueadores técnicos en la comunicación entre capas bajo las restricciones de Serverless y la gestión de dependencias compartidas.

**Independent Test**: Realizar una petición desde el frontend (Next.js) al backend (Nest.js desplegado en Serverless) que interactúe con Supabase Auth y la base de datos, devolviendo un resultado exitoso.

**Acceptance Scenarios**:

1. **Given** el stack configurado, **When** el frontend solicita datos protegidos al backend enviando un JWT, **Then** el backend debe validar el token y retornar una respuesta válida.

---

## Edge Cases

- **Cold Starts (Serverless)**: El primer acceso tras inactividad puede ser lento. Se deben configurar estrategias de "warm-up" o aceptar la latencia inicial en el MVP.
- **Gestión de Dependencias Compartidas**: En un monorepo, cambios en una librería común pueden afectar a múltiples apps. Se deben implementar tests de integración en el CI.
- **Sincronización de Esquema**: Al usar Prisma Migrate con Supabase remoto, se deben manejar correctamente los permisos de usuario de la base de datos para permitir cambios estructurales.
- **Compatibilidad de Versiones**: ¿Qué sucede si una actualización de Supabase rompe la integración con Nest.js? Se deben definir versiones "estables" o "locked" en el package.json.
- **Latencia de Red**: Dado que Supabase es un servicio en la nube y Nest.js corre en Serverless, se debe monitorear la latencia para asegurar el cumplimiento de los tiempos de respuesta (< 500ms).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El frontend del sistema MUST ser desarrollado exclusivamente con Next.js utilizando **App Router**.
- **FR-002**: El backend del sistema MUST ser desarrollado with Nest.js siguiendo una arquitectura por capas.
- **FR-003**: La base de datos relacional y el almacenamiento de archivos MUST ser provistos por Supabase (PostgreSQL).
- **FR-004**: La comunicación entre Next.js y Nest.js MUST realizarse a través de **REST API**.
- **FR-005**: El acceso a datos en Nest.js MUST realizarse mediante **Prisma**.
- **FR-006**: El backend MUST ser desplegado en un entorno **Serverless** (Vercel Functions o AWS Lambda).
- **FR-007**: El proyecto MUST utilizar una estructura de **Monorepo** gestionada con **Turborepo** para compartir tipos y lógica común.
- **FR-008**: El sistema MUST implementar la autenticación de forma local en el backend (Nest.js), gestionando el hashing de contraseñas y la generación de JWTs de forma autónoma.
- **FR-009**: Las migraciones de base de datos MUST ser gestionadas exclusively mediante **Prisma Migrate**.
- **FR-010**: El backend MUST exponer una documentación interactiva utilizando **Swagger / OpenAPI**.
- **FR-011**: El frontend MUST utilizar la librería **Material UI** para el sistema de componentes y diseño visual.
- **FR-012**: El sistema MUST utilizar **Zod** para la definición de esquemas de validación compartidos entre el frontend y el backend.
- **FR-013**: El sistema MUST utilizar **GitHub Actions** para la orquestación de CI/CD.
- **FR-014**: El frontend MUST utilizar **TanStack Query** para la gestión de estado del servidor y fetching de datos.
- **FR-015**: El frontend MUST utilizar **MUI Icons** para la iconografía del sistema.
- **FR-016**: El sistema MUST integrar **Sentry** para el monitoreo de errores y rendimiento en frontend y backend.
- **FR-017**: Las herramientas de testing (Unit/Integration/E2E) quedan **por definir** en una fase posterior.
- **FR-018**: El desarrollo MUST seguir un flujo **Schema-First**; el esquema de Prisma debe ser validado y aprobado antes de implementar lógica de negocio en backend o frontend.
- **FR-019**: El frontend MUST implementar layouts diferenciados por rol/dispositivo: móvil para registro de asistencia y escritorio optimizado para la Secretaría de Escolástica.
- **FR-020**: El backend MUST seguir una estructura de módulos basados en dominio para asegurar el desacoplamiento y facilitar la extensión modular sin modificar el código existente.
- **FR-021**: El sistema MUST utilizar una estrategia de transformación **Zod-to-Class** para derivar automáticamente los DTOs de Nest.js a partir de los esquemas de Zod compartidos, manteniendo el modelo de datos como fuente única de verdad.
- **FR-022**: El sistema MUST utilizar comentarios de triple barra (`///`) en el esquema de Prisma para documentar el diccionario de datos, el cual deberá ser expuesto automáticamente en la documentación de Swagger.

### Key Entities *(include if feature involves data)*

- **Turborepo Workspace**: Estructura que organiza las aplicaciones (apps/web, apps/api) y los paquetes compartidos (packages/shared, packages/database).
- **Prisma Schema**: Definición centralizada del modelo de datos que actúa como contrato para la base de datos Supabase.
- **Shared Validation Schemas**: Paquete dentro del monorepo que contiene las reglas de Zod reutilizables por el cliente y el servidor.
- **API Swagger Document**: Contrato dinámico que describe todos los endpoints, DTOs y esquemas de seguridad del backend.
- **Configuración del Proyecto**: Documentación de versiones, variables de entorno (.env) y scripts de despliegue para Serverless.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los componentes del sistema (Frontend, Backend, DB) deben estar operativos y comunicados en el entorno de desarrollo local dentro del monorepo.
- **SC-002**: El tiempo de respuesta de una petición simple (Hello World) desde Next.js a Nest.js debe ser inferior a 100ms en local y aceptable en producción (contemplando cold starts).
- **SC-003**: La documentación del stack debe ser aprobada por el 100% de los leads técnicos antes de proceder con el desarrollo de features.
- **SC-004**: El sistema debe permitir aplicar migraciones de esquema en menos de 1 minuto en entornos de staging/producción.
- **SC-005**: El backend debe rechazar el 100% de las peticiones a rutas protegidas que no incluyan un JWT válido.
- **SC-006**: El 100% de los endpoints públicos y privados deben estar documentados y ser probables vía Swagger UI.
- **SC-007**: El 100% de los formularios del frontend deben utilizar los mismos esquemas de Zod que el backend para validación de datos.
