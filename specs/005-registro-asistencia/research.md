# Research: Registro de Asistencia — 005

**Date**: 2026-04-24 | **Branch**: `005-attendance-tracking`

---

## Decisión 1: Modelo de sesión-based vs. asistencia directa por fecha

**Decision**: Cada asistencia se vincula a una `sesion` (no directamente a una fecha en la tabla `asistencias`).

**Rationale**: La Constitución (v1.2.0) establece explícitamente "El sistema utiliza un modelo basado en **sesiones académicas** para el seguimiento preciso de asistencia y avance de temas." Además, `sesiones` permite vincular asistencias con el tema trabajado en ese día (`tema_id`), y diferencia tipos de encuentro (`Clase`, `Examen`, `Practica`, `Repaso`).

**Alternatives considered**:
- Asistencia con campo `fecha` directo → rechazado porque no permite distinguir tipo de sesión ni vincular temas.

---

## Decisión 2: `getOrCreateToday()` — creación idempotente de sesión

**Decision**: `POST /clases/:id/sesiones` llama a `getOrCreateToday()`: si ya existe una sesión del día para esa clase, la retorna en lugar de crear un duplicado.

**Rationale**: Evita sesiones duplicadas cuando el Instructor o Escolástico accede varias veces al pase de lista en el mismo día. El endpoint se puede llamar desde múltiples puntos de entrada (sidebar, detalle de clase) sin efectos secundarios.

**Alternatives considered**:
- Crear siempre una nueva sesión → rechazado por riesgo de duplicados y pérdida de datos previos.
- Verificar sesión existente en el frontend → rechazado por duplicar lógica de negocio fuera del backend.

---

## Decisión 3: `bulkUpsert` — upsert masivo con default `Ausente`

**Decision**: `POST /clases/:id/sesiones/:sesionId/asistencias/bulk` hace upsert de **todos** los inscritos activos: los incluidos en el payload con su estado indicado; los no incluidos con `'Ausente'` como default.

**Rationale**: Garantiza que todos los alumnos tengan registro de asistencia al guardar, sin requerir que el instructor marque explícitamente a los ausentes. Reduce fricción en el flujo mobile-first.

**Alternatives considered**:
- Solo registrar los marcados → rechazado porque deja alumnos sin registro, complicando el cálculo de porcentajes.
- Operación separada para ausentes → rechazado por agregar complejidad y latencia.

---

## Decisión 4: Filtrado de clases por rol (`findClasesHoy`)

**Decision**: `GET /clases/hoy` diferencia el comportamiento según el rol del usuario autenticado:
- **Instructor**: solo clases donde `instructor_id == userId` con `horario.dia_semana == hoy`.
- **Escolástico**: todas las clases con `estado == 'Activa'` sin filtro por instructor ni horario.

**Rationale**: Spec 024 establece paridad de privilegios para el Escolástico. El filtro por día aplica solo al Instructor porque su responsabilidad está acotada a sus propias clases programadas.

**Alternatives considered**:
- Endpoint separado para Escolástico → rechazado para mantener un único punto de entrada por claridad y menor superficie de API.
- Enviar todas las clases al Instructor → rechazado por no ser mobile-first (muestra clases irrelevantes).

---

## Decisión 5: Rutas duales (`(instructor)` + `(admin)`)

**Decision**: Se implementan dos familias de rutas para la misma funcionalidad:
- `(instructor)/asistencia/*` → layout mobile-only, sin sidebar.
- `(admin)/admin/asistencia/*` → layout desktop con sidebar, accesible para Instructor y Escolástico.

**Rationale**: El Instructor usa preferentemente la vista móvil cuando está en clase. El Escolástico opera desde escritorio con contexto administrativo. Ambas rutas consumen los mismos endpoints del backend.

**Alternatives considered**:
- Una sola ruta responsive → rechazado porque el layout con sidebar no es óptimo para mobile touch.

---

## Decisión 6: Auditoría solo en `updateOne`, no en `bulkUpsert`

**Decision**: `bulkUpsert` no registra en `logs_auditoria` (crea/actualiza silenciosamente); `updateOne` sí registra valor anterior y nuevo.

**Rationale**: El bulk es la operación primaria de registro inicial — auditar cada upsert individual generaría cientos de registros por sesión sin valor práctico. La auditoría se aplica a correcciones posteriores de estados ya registrados, que son las acciones con impacto en decisiones administrativas.

**Alternatives considered**:
- Auditar bulk completo → rechazado por volumen excesivo de logs sin valor.
- No auditar nada → rechazado por requerimiento SC-002 (100% de cambios en asistencias pasadas deben quedar auditados).
