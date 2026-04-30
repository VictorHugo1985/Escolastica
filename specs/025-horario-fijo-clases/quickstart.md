# Quickstart / Escenarios de prueba: Horario Fijo Obligatorio por Clase

**Branch**: `025-horario-fijo-clases` | **Date**: 2026-04-25

---

## SC-001 — Crear clase con horario obligatorio (happy path)

1. Ir a `/admin/clases` → "Nueva clase"
2. Completar todos los campos incluyendo el nuevo grupo "Horario": día=Jueves, inicio=20:00, fin=22:00
3. Guardar
4. **Verificar**: La clase aparece en el listado con el chip "Jue 20:00" visible

## SC-002 — Crear clase sin horario (validación)

1. Ir a `/admin/clases` → "Nueva clase"
2. Completar todos los campos EXCEPTO el horario (dejar día/hora vacíos)
3. Intentar guardar
4. **Verificar**: El formulario muestra error "El horario es obligatorio" y no guarda

## SC-003 — Filtro por día en Listas (instructor)

1. Iniciar sesión como instructor
2. Ir a `/admin/asistencia`
3. **Verificar**: El filtro por día muestra automáticamente el día actual y solo muestra clases de ese día

## SC-004 — Filtro por día en Listas (admin)

1. Iniciar sesión como Escolástico
2. Ir a `/admin/asistencia`
3. **Verificar**: No hay filtro preseleccionado; se muestran todas las clases activas
4. Seleccionar "Jueves" en el filtro de día
5. **Verificar**: Solo aparecen clases con `dia_semana=4` en su horario

## SC-005 — Iniciar sesión con fecha del día programado

1. Ir al hub de una clase cuyo horario es "Jueves"
2. Hacer click en "Iniciar Sesión"
3. **Verificar**: La sesión creada tiene como fecha el jueves de la semana actual (no necesariamente hoy)
4. Editar la sesión → verificar que el campo "Fecha" es editable

## SC-006 — Editar horario de clase existente (flujo separado)

1. Ir a `/admin/clases` → ícono de horarios de una clase existente
2. Eliminar el horario existente y agregar uno nuevo: Lunes 19:00–21:00
3. **Verificar**: El chip en la página de Listas cambia a "Lun 19:00"
4. Iniciar una nueva sesión para esa clase
5. **Verificar**: La sesión tiene la fecha del lunes de la semana actual

## SC-007 — Clase sin horario (fallback de sesión)

1. Si existe una clase con horario placeholder o sin horario
2. Intentar iniciar sesión para esa clase
3. **Verificar**: El sistema crea la sesión con la fecha de hoy (no bloquea la operación)
