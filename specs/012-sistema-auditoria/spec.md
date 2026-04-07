# Feature Specification: Sistema de Auditoría y Trazabilidad

**Feature Branch**: `012-sistema-auditoria`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Definir disparadores y vistas de logs para el sistema de auditoría"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Action Logging (Priority: P1)

Como **Arquitecto del Sistema**, quiero que cada acción crítica (creación, modificación o eliminación) sobre entidades clave sea registrada automáticamente en la base de datos, para garantizar la integridad y trazabilidad de la información académica.

**Why this priority**: Es un requisito de seguridad y cumplimiento administrativo no negociable para la Secretaría de Escolástica.

**Independent Test**: Realizar una actualización en el estado de un alumno y verificar que aparezca un nuevo registro en la tabla `logs_auditoria` con los valores anterior y nuevo.

**Acceptance Scenarios**:

1. **Given** un cambio en una nota, **When** se guarda la transacción, **Then** el sistema debe registrar quién realizó el cambio, qué tabla se afectó y el valor anterior/nuevo en formato JSON.

---

### User Story 2 - Audit Log Consultation (Priority: P2)

Como **Administrador de Escolástica**, quiero consultar el historial de cambios de una entidad específica (ej: una materia o un alumno), para investigar discrepancias o errores en el registro de datos.

**Why this priority**: Facilita la resolución de conflictos y auditorías internas.

**Independent Test**: Filtrar la tabla de logs por `tabla_afectada` y `usuario_id` y verificar que los resultados sean precisos.

**Acceptance Scenarios**:

1. **Given** una búsqueda por materia, **When** el administrador aplica el filtro, **Then** el sistema muestra cronológicamente todos los cambios realizados a esa materia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST registrar automáticamente acciones en las siguientes tablas: `usuarios`, `roles`, `materias`, `clases`, `sesiones`, `inscripciones`, `asistencias` y `notas`.
- **FR-002**: Cada log MUST incluir el ID del usuario que realizó la acción, el tipo de acción (INSERT, UPDATE, DELETE), la tabla afectada y la marca de tiempo.
- **FR-003**: En acciones de tipo UPDATE, el sistema MUST capturar el estado anterior y el estado nuevo del registro en campos `JSONB`.
- **FR-004**: Los logs de auditoría MUST ser de solo lectura una vez creados (inmutabilidad).
- **FR-005**: El sistema MUST permitir filtrar logs por fecha, usuario, acción y tabla afectada.

### Key Entities *(include if feature involves data)*

- **Log_Auditoria**: Representa un evento único de cambio en el sistema. Vinculado al usuario ejecutor y a la entidad afectada.

## Data Dictionary *(Referencia a Spec 003)*

Se utiliza la tabla `logs_auditoria` definida en la especificación maestra 003.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de las acciones críticas registradas sin intervención manual.
- **SC-002**: Capacidad de reconstrucción de cualquier estado anterior de un registro mediante el campo `valor_anterior`.
- **SC-003**: Tiempo de persistencia del log < 100ms adicional a la transacción original.
