# Tareas: Escolástico con Privilegios Plenos de Asistencia — 024

**Entrada**: Documentos de diseño de `/specs/024-asistencia-privilegios-escolastico/`
**Prerrequisitos**: spec.md, plan.md, quickstart.md | **Depende de**: spec 005 (sesiones y asistencias ya implementadas)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (archivos diferentes, sin dependencias entre sí)
- **[Story]**: Historia de usuario a la que pertenece la tarea

---

## Fase 1: Setup (Infraestructura del Módulo)

Sin cambios de infraestructura — se extienden módulos existentes.

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

- [x] T001 Extender `findClasesHoy(userId: string, roles: string[])` en `apps/api/src/sesiones/sesiones.service.ts`: omitir filtro `instructor_id` cuando `roles.includes('Escolastico')`
- [x] T002 Actualizar llamada en `apps/api/src/sesiones/sesiones.controller.ts`: pasar `req.user.roles` a `findClasesHoy`

**Punto de control**: `GET /clases/hoy` devuelve todas las clases del día para Escolástico y solo las propias para Instructor.

---

## Fase 3: Historia de Usuario 1 — Escolástico crea sesión y toma asistencia (P1) 🎯 MVP

**Objetivo**: El Escolástico accede al pase de lista de cualquier clase del día y ve exactamente la misma interfaz que el instructor titular, incluyendo información del instructor asignado para poder identificar la clase que está cubriendo.

**Prueba Independiente**: Login como Escolástico → abrir pase de lista → ver lista de clases del día con nombre del instructor → seleccionar clase ajena → registrar asistencias → verificar auditoría con UUID del Escolástico.

### Implementación — Historia de Usuario 1

- [x] T003 [US1] Agregar campo `instructor` al include de `findClasesHoy` en `apps/api/src/sesiones/sesiones.service.ts`: para Escolástico devuelve todas las clases activas (sin filtro de día ni instructor); para Instructor mantiene filtro original
- [x] T004 [P] [US1] Actualizar interfaz `ClaseHoy` en `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: agregar campo `instructor: { id: string; nombre_completo: string }` al tipo
- [x] T005 [US1] Mostrar nombre del instructor + día en chips + subtítulo diferenciado en `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: Escolástico ve "Todas las clases activas del sistema", Instructor ve fecha del día

**Punto de control**: El Escolástico ve todos los cards de clases del día con el nombre del instructor asignado. El instructor ve solo sus propias clases (con su propio nombre, lo cual es redundante pero consistente).

---

## Fase 4: Verificación

- [ ] T006 [P] Verificar con browser/Swagger: login como Instructor → `GET /clases/hoy` devuelve solo sus clases, cards sin cambio visible
- [ ] T007 [P] Verificar con browser: login como Escolástico → `GET /clases/hoy` devuelve todas las clases del día, cada card muestra el nombre del instructor asignado
- [ ] T008 [P] Verificar auditoría: Escolástico registra asistencia en clase ajena → log de auditoría contiene UUID del Escolástico como actor, no el del instructor titular

---

## Dependencias entre Historias

```
T001 → T002 (fundacional, ya completo)
T003 → T004, T005 (T004 y T005 pueden ir en paralelo entre sí una vez T003 esté listo)
T005 → T006, T007, T008 (verificación manual al final)
```

## Estrategia de Implementación

**MVP mínimo** (ya implementado): T001 + T002 — el Escolástico ya recibe todas las clases del día.  
**Incremento pendiente**: T003 + T004 + T005 — agregar contexto de instructor en el card para UX completa.
