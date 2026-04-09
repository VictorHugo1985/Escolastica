# Feature Specification: Class Topics Tracking (Seguimiento Académico)

**Feature Branch**: `009-temas-por-clase`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Crear la tabla `clase_temas` para tener el seguimiento de los temas avanzados por curso"

## Clarifications

### Session 2026-04-06

- Q: ¿Se puede registrar más de un tema por sesión/día para una misma clase? → A: Solo se permite registrar un único tema por sesión.
- Q: ¿Los instructores pueden editar o eliminar sus registros de avance? → A: Sí, los instructores tienen flexibilidad total para editar o eliminar sus propios registros en cualquier momento.
- Q: ¿Quién puede registrar el avance de temas en una clase? → A: Cualquier instructor autorizado o administrador puede realizar el registro (ej: suplentes), quedando constancia de su ID en el campo `instructor_id`.
- Q: ¿Este módulo forma parte del MVP inicial? → A: Sí, se ha ratificado que el seguimiento académico de temas es esencial para el MVP y debe incluirse en la Constitución.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Progress Tracking (Priority: P1)

Como **Instructor**, quiero registrar el tema del programa oficial que he avanzado en una sesión específica de clase como el "tema del día", para mantener un control detallado del progreso académico del grupo e incluir un flag en el registro de asistencia de esa clase si el tema se concluyo.

**Why this priority**: Es la base del seguimiento académico y permite saber qué contenido falta cubrir antes del fin del curso.

**Independent Test**: En una clase activa con temas definidos, seleccionar un tema como tema del día. Intentar registrar un segundo tema para la misma fecha y verificar que sea bloqueado.

**Acceptance Scenarios**:

1. **Given** una clase con temas asociados, **When** el instructor selecciona un tema y lo marca como el tema del día, **Then** el sistema debe guardar el registro en la tabla `clase_temas` con la fecha actual.

---

### User Story 2 - Academic Audit (Priority: P2)

Como **Escolastico**, quiero consultar el avance de temas de cualquier clase abierta, para auditar que el instructor esté cumpliendo con el cronograma y el contenido del pensum.

**Why this priority**: Garantiza la calidad educativa y permite intervenir si una clase está muy atrasada respecto a su fecha de finalización.

**Independent Test**: Consultar el reporte de avance de una clase y verificar que coincida con los registros realizados por el instructor.

**Acceptance Scenarios**:

1. **Given** una consulta de auditoría, **When** se solicita el estado de una clase, **Then** el sistema debe mostrar el porcentaje de temas avanzados vs temas totales de la materia.

### Edge Cases

- **Registro duplicado**: El sistema debe impedir que se registre más de un tema para la misma clase en la misma fecha calendario.
- **Integridad de materia**: El sistema debe impedir que se marque un tema que no pertenezca a la materia asignada a la clase.
- **Edición de historial**: El sistema debe permitir al instructor modificar comentarios o cambiar el tema registrado incluso en fechas pasadas, manteniendo la integridad de un solo registro por día.
- **Suplencia**: El sistema debe permitir que un instructor distinto al titular de la clase registre el avance, almacenando correctamente quién realizó la entrada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST definir una tabla `clase_temas` para el seguimiento de avance.
- **FR-002**: Cada registro MUST vincularse a una `clase` y a un `tema` específico.
- **FR-003**: El sistema MUST registrar automáticamente la `fecha_completado` al marcar un tema como avanzado.
- **FR-004**: El sistema MUST permitir añadir, editar y eliminar observaciones o comentarios en cada tema avanzado.
- **FR-005**: El sistema MUST impedir que se marquen temas de una materia distinta a la que pertenece la clase.
- **FR-006**: El sistema MUST restringir el registro a un máximo de un (1) tema por clase por día.
- **FR-007**: El sistema MUST permitir a los instructores editar o eliminar sus propios registros de `clase_temas` sin restricciones de tiempo.
- **FR-008**: El sistema MUST permitir que cualquier usuario con rol de instructor o administrador registre el avance, capturando su `instructor_id` de forma independiente al titular de la clase.

### Key Entities *(include if feature involves data)*

- **Clase_Tema**: Registro de ejecución de un tema en una instancia de clase. Atributos: ID Clase, ID Tema, Fecha, Comentarios, ID Instructor (quien registra).

## Data Dictionary *(Conceptual Model)*

### 1. Seguimiento Académico
- **Tabla: `clase_temas`**
    - `id`: UUID (PK)
    - `clase_id`: UUID (FK -> clases) - Definida en Spec 003.
    - `tema_id`: UUID (FK -> temas) - Definida en Spec 012.
    - `fecha_completado`: Date (Not Null, Default CURRENT_DATE) - Única por clase/día.
    - `instructor_id`: UUID (FK -> usuarios) - El instructor o administrador que registró el avance.
    - `comentarios`: Text (Opcional)
    - `created_at`: Timestamp (Auditoría)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tabla `clase_temas` operativa y vinculada a `clases` y `temas`.
- **SC-002**: Restricción de integridad que impida temas duplicados por día para la misma clase.
- **SC-003**: Tiempo de respuesta de la consulta de avance por clase < 500ms.
- **SC-004**: Reporte de avance académico (porcentaje) verificable mediante consultas SQL.
