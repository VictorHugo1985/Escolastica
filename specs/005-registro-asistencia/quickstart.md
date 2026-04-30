# Quickstart: Registro de Asistencia — 005

**Date**: 2026-04-24 | Escenarios de integración y flujos de usuario completos.

---

## Escenario 1: Instructor — Pase de lista desde móvil (US1 — MVP)

**Prerrequisitos**: Si el instructor abre la aplicacion y hoy dia tiene una clases programada, proponer la apertura de la misma. Si al menos tiene 1 alumno inscrito con estado `'Activo'`.

### Flujo

```
1. GET  /clases/hoy
   → Retorna la(s) clase(s) del instructor para el día actual

2. Usuario selecciona una clase

3. POST /clases/{claseId}/sesiones  (body: {})
   → Crea o retorna la sesión del día — incluye el id de sesión

4. GET  /clases/{claseId}/sesiones/{sesionId}/asistencias
   → Retorna lista de alumnos con estado default "Ausente"

5. Usuario marca estados en la UI (toggle Presente/Ausente/Licencia)
   → Opcionalmente usa "Todos presentes" para marcar bulk inicial

6. POST /clases/{claseId}/sesiones/{sesionId}/asistencias/bulk
   Body: { "asistencias": [{ "inscripcion_id": "...", "estado": "Presente" }, ...] }
   → Guarda todos los estados — alumnos no incluidos quedan como "Ausente"
```

**Resultado esperado**: Todos los alumnos tienen registro en `asistencias` para esa sesión.

---

## Escenario 2: Escolástico — Pase de lista en clase de otro instructor

**Prerrequisitos**: El Escolástico está autenticado. Hay una clase activa asignada a otro instructor.

### Flujo

```
1. GET  /clases/hoy  (Escolástico)
   → Retorna TODAS las clases activas del sistema (no filtradas por instructor ni día)

2. Escolástico selecciona la clase del instructor ausente

3. POST /clases/{claseId}/sesiones
   → Crea sesión del día como el instructor haría

4–6. Idéntico al Escenario 1

7. PATCH /clases/{claseId}/sesiones/{sesionId}/asistencias/{asistenciaId}
   Body: { "estado": "Licencia" }
   → Corrección posterior de un estado individual
   → logs_auditoria: { actor: escolastico_id, tabla: "asistencias", ... }
```

**Resultado esperado**: La sesión queda creada con el Escolástico como actor en auditoría.

---

## Escenario 3: Historial de asistencias (US2)

**Prerrequisitos**: Clase con múltiples sesiones y registros de asistencia.

### Flujo

```
1. GET /clases/{claseId}/sesiones
   → Lista de sesiones ordenadas por fecha desc con _count.asistencias

2. GET /clases/{claseId}/asistencias/resumen
   → Array de alumnos con { presentes, ausentes, licencias, porcentaje }

3. Frontend construye tabla + línea de tiempo con estos datos
```

---

## Escenario 4: Alumno consulta su Kardex (US3)

```
1. GET /users/me/asistencias?claseId={claseId}
   → { presentes: 8, ausentes: 2, licencias: 0, porcentaje: 80 }

2. Frontend muestra resumen en la página de Kardex
```

---

## Estados de asistencia y transiciones

```
Presente ──→ Ausente ──→ Licencia ──→ Presente (ciclo en UI toggle)
```

En el pase de lista mobile, hacer tap en un alumno avanza al siguiente estado en este ciclo.

---

## Puntos de entrada por rol

| Rol         | Ruta web                         | Descripción                              |
|-------------|----------------------------------|------------------------------------------|
| Instructor  | `/asistencia`                    | Vista móvil — clases del día propias     |
| Instructor  | `/admin/asistencia`              | Vista desktop con sidebar                |
| Escolástico | `/admin/asistencia`              | Vista desktop — todas las clases activas |
| Alumno      | `/admin/kardex`                  | Su propio resumen de asistencias         |
| Admin       | `/admin/clases/{id}` → "Pase de lista" | Acceso desde detalle de clase      |

---

## Idempotencia — Resumen

| Operación            | Comportamiento si ya existe                            |
|---------------------|--------------------------------------------------------|
| `POST /sesiones`    | Retorna la sesión existente del día (no crea duplicado) |
| `POST /bulk`        | Upsert — sobreescribe estados previos                   |
| `PATCH /asistencias` | Actualiza siempre, registra en auditoría              |
