# Research: Horario Fijo Obligatorio por Clase

**Branch**: `025-horario-fijo-clases` | **Date**: 2026-04-25

---

## Estado actual del sistema

### Decision: La tabla `horarios` ya existe y está estructurada correctamente
- **Rationale**: La tabla ya tiene `dia_semana` (Int, 0-6), `hora_inicio` (Time), `hora_fin` (Time), `aula_id` (nullable FK), `clase_id` (FK requerido). No se requiere ninguna migración de base de datos.
- **Alternatives considered**: Agregar columnas directamente en `clases` — rechazado porque la relación 1:N ya existe y soporta múltiples horarios por clase.

### Decision: La creación actual de horarios está incompleta
- **Rationale**: Al crear una clase con `aula_id`, el servicio crea un horario con `dia_semana=1` (lunes) y tiempos 18:00-20:00 hardcodeados. El formulario nunca solicita el día ni el rango horario real. `CreateHorarioSchema` ya existe en `packages/shared` con los campos correctos.
- **Implication**: El campo `aula_id` en `CreateClaseSchema` debe reemplazarse por un objeto `horario` completo (dia_semana, hora_inicio, hora_fin, aula_id opcional).

### Decision: `CreateHorarioSchema` ya define la validación correcta
- **Rationale**: Existe en `packages/shared/src/schemas/horario.schema.ts` con `dia_semana` (0-6), `hora_inicio` (HH:MM regex), `hora_fin` (HH:MM regex), `aula_id` (uuid opcional). Se reutiliza como tipo embebido en el nuevo `CreateClaseSchema`.
- **Alternatives considered**: Crear un nuevo schema para horario embebido — rechazado porque el schema existente ya cubre todos los campos necesarios.

### Decision: Los endpoints de horarios por clase ya existen
- **Rationale**: `GET /clases/:id/horarios`, `POST /clases/:id/horarios`, `DELETE /clases/:id/horarios/:id` ya están implementados. Para la edición de horarios de clases existentes, se continúa usando estos endpoints sin cambios.
- **Implication**: El flujo de creación necesita cambios; el flujo de edición de horarios queda igual.

---

## Impacto en el esquema de datos compartido

### Decision: `aula_id` se elimina del nivel superior de `CreateClaseSchema`
- **Rationale**: `aula_id` nunca perteneció al nivel de clase — siempre fue un atributo del horario (un aula se asigna a un bloque horario específico, no a la clase en abstracto). Consolidar en el objeto `horario` elimina la ambigüedad.
- **Alternatives considered**: Mantener `aula_id` duplicado — rechazado por inconsistencia con el modelo de datos real.
- **Migration**: El campo `horario` reemplaza a `aula_id` en `CreateClaseSchema`. `UpdateClaseSchema` no necesita `aula_id` (la edición de horarios usa los endpoints específicos).

---

## Filtro por día en el listado de asistencia

### Decision: Filtro en frontend sobre datos ya disponibles
- **Rationale**: El endpoint `GET /clases?estado=Activa` ya retorna `horarios[].dia_semana`. El filtro puede aplicarse en el cliente sin nuevo endpoint. Para instructores, el filtro se preselecciona con `new Date().getDay()` al cargar la página.
- **Alternatives considered**: Filtro en backend via `?dia_semana=4` — no necesario dado el volumen de datos esperado y que los datos ya se cargan.

### Decision: El filtro por día se suma al filtro por instructor existente (no lo reemplaza)
- **Rationale**: Los administradores pueden necesitar cruzar ambos filtros. Para instructores, el filtro por instructor ya es implícito (solo ven sus propias clases), por lo que solo se muestra el filtro por día.
- **Alternatives considered**: Reemplazar el filtro de instructor con el de día — rechazado, la combinación da más flexibilidad al admin.

---

## Sesión con fecha derivada del horario

### Decision: Implementación ya completa, se mantiene sin cambios
- **Rationale**: `getFechaParaSemana(dia_semana)` ya está implementado en la página del instructor y en el hub admin. Calcula el día de la semana del horario dentro de la semana actual. El endpoint `POST /clases/:id/sesiones` ya acepta `fecha` opcional.
- **Status**: US3 del spec ya está operativo. Solo se verifica que funcione correctamente con el nuevo horario obligatorio.

---

## Compatibilidad con datos existentes

### Decision: No se aplica retroactividad a clases sin horario
- **Rationale**: La Constitución indica que el esquema base no debe modificarse para romper datos existentes. Las clases existentes sin horario (o con horario placeholder) no son afectadas. Solo nuevas clases quedan sujetas a la validación del horario obligatorio.
- **Alternatives considered**: Migración de datos para actualizar horarios placeholder — fuera de alcance de esta spec.
