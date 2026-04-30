# Tareas: Instructor Dashboard — 008

**Entrada**: Documentos de diseño de `/specs/008-instructor-dashboard/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 004 (clases, horarios), spec 005 T007 (`GET /clases/hoy`), spec 006 T005 (`GET /clases/:id/notas`)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [ ] T001 Crear `DashboardModule` en `apps/api/src/dashboard/dashboard.module.ts` con imports de PrismaModule y AuthModule
- [ ] T002 [P] Crear layout diferenciado por rol en `apps/web/src/app/(instructor)/layout.tsx`: sidebar con navegación para Instructor (Mis Clases, Calendario, Asistencia)
- [ ] T003 [P] Crear layout admin diferenciado en `apps/web/src/app/(admin)/layout.tsx`: sidebar con navegación para Escolástico (Usuarios, Materias, Clases, Reportes)

---

## Fase 2: Fundacional

- [ ] T004 Implementar `DashboardService` en `apps/api/src/dashboard/dashboard.service.ts`: `getMisClases(instructorId)`, `getCalendarioSemanal(instructorId, fecha)`, `getCalendarioGlobal(fecha)` (para Escolástico)
- [ ] T005 Verificar que `GET /clases/hoy` (spec 005 T007) y `GET /users/eligible-instructors` (spec 003 T025) están disponibles

**Punto de control**: Servicios de agregación listos.

---

## Fase 3: Historia de Usuario 1 — Calendario Instructor (P1) 🎯 MVP

**Objetivo**: El instructor ve un calendario semanal de sus clases y puede acceder directamente a la gestión de cada sesión con un solo toque.

**Prueba Independiente**: Login como instructor, abrir calendario, verificar que solo aparecen sus clases con horario correcto. Tocar un evento → modal con accesos "Pasar Asistencia" y "Registrar Notas".

### Implementación — Historia de Usuario 1

- [X] T006 [US1] Página de calendario unificada en `apps/web/src/app/(admin)/admin/calendario/page.tsx`: consume `GET /clases?estado=Activa` (con `instructor_id` para instructor). No se creó DashboardController — datos provistos por endpoint existente.
- [X] T007 [US1] Grilla semanal fría (Lun–Sáb, 18:00–22:30) con bloques posicionados por CSS. Modal de acciones al tocar: "Ir a pase de lista", "Ir a calificaciones", "Ver detalle de la clase".
- [X] T008 [P] [US1] Modal integrado en la página. Leyenda de instructores con colores para el rol Escolástico. Sidebar actualizado con ítem "Calendario" (roles: Instructor + Escolástico).

**Punto de control**: US1 funcional — calendario semanal operativo con accesos rápidos.

---

## Fase 4: Historia de Usuario 1b — Calendario Escolástico (P1)

**Objetivo**: El Escolástico ve un calendario global de TODAS las clases activas en vista semanal/mensual desde escritorio.

**Prueba Independiente**: Login como Escolástico, abrir calendario global, verificar que muestra todas las clases activas con sus instructores. Tocar evento → mismas opciones de gestión.

### Implementación — Historia de Usuario 1b

- [X] T009 [US1] Implementar `GET /dashboard/admin/calendario?fecha=:iso` en `DashboardController`: retorna TODAS las clases activas con horarios proyectados para la semana (sin filtro por instructor)
- [X] T010 [P] [US1] Crear página de calendario global en `apps/web/src/app/(admin)/calendario/page.tsx`: misma vista de calendario pero con todas las clases, colores diferenciados por materia

**Punto de control**: US1b funcional — vista global de calendario para Escolástico.

---

## Fase 5: Historia de Usuario 3 — Acceso Rápido a Asistencia y Notas (P1)

**Objetivo**: El instructor accede a asistencia o notas con máximo 2 clics desde la pantalla principal.

**Prueba Independiente**: Desde la pantalla principal (lista de clases), hacer clic en "Pasar Asistencia" de una materia → navegación directa a `/asistencia/[claseId]` sin pasos intermedios.

### Implementación — Historia de Usuario 3

- [ ] T011 [US3] Implementar `GET /dashboard/instructor/clases` en `DashboardController`: lista de clases activas del instructor con meta-datos de última sesión y % de asistencia global
- [ ] T012 [US3] Crear página de lista de clases del instructor en `apps/web/src/app/(instructor)/mis-clases/page.tsx`: tarjetas MUI por clase con botones inline "Pasar Asistencia" y "Notas" (SC-002: máx 2 clics)

**Punto de control**: US3 funcional — acceso a funciones críticas en ≤ 2 clics.

---

## Fase 6: Historia de Usuario 4 — Lista de Alumnos y Perfiles (P2)

**Objetivo**: El instructor puede ver el listado de alumnos de su clase con su estado y % de asistencia acumulado.

**Prueba Independiente**: Abrir "Ver Alumnos" de una clase → lista con nombre, estado (Activo/Baja) y porcentaje de asistencia calculado en tiempo real.

### Implementación — Historia de Usuario 4

- [ ] T013 [US4] Implementar `GET /dashboard/instructor/clases/:id/alumnos` en `DashboardController`: agrega inscripciones activas con datos del usuario y porcentaje de asistencia (consume `AsistenciasService.calcularPorcentajePorAlumno()` de spec 005)
- [ ] T014 [P] [US4] Crear página de alumnos de clase en `apps/web/src/app/(instructor)/clases/[id]/alumnos/page.tsx`: tabla MUI con nombre, estado e indicador visual de % asistencia (chip de color según umbral)

**Punto de control**: US4 funcional — instructor ve situación de cada alumno.

---

## Fase 7: Pulido

- [ ] T015 [P] Documentar endpoints de `DashboardController` con decoradores Swagger
- [ ] T016 Verificar SC-001 (lista de clases < 1 seg), SC-002 (funciones críticas ≤ 2 clics), SC-004 (PageSpeed > 90 en móvil) según `spec.md`

---

## Dependencias

```
spec 004 (clases/horarios) + spec 005 (sesiones) + spec 006 (notas)
  └── Fase 1–2
        ├── Fase 3 (US1 — Calendario Instructor) 🎯 MVP
        ├── Fase 4 (US1b — Calendario Escolástico)
        ├── Fase 5 (US3 — Acceso Rápido)
        └── Fase 6 (US4 — Lista Alumnos)
```

## Alcance MVP
Fases 1–3 + Fase 5: calendario semanal del instructor + acceso rápido a asistencia/notas.
