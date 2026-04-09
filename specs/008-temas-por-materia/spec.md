# Feature Specification: Subject Topics Table

**Feature Branch**: `008-Temas por Materia`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Añadir la tabla de temas por materia a la especificación de diseño del modelo de base de datos (003)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definition of Subject Topics (Priority: P1)

Como **arquitecto de software o desarrollador**, quiero definir la entidad de "Temas por Materia" en el modelo relacional, para que cada materia del pensum pueda tener un desglose detallado y cronológico de su contenido programático.

**Why this priority**: Es fundamental para la planificación académica y asegura que todas las clases de una misma materia sigan el mismo temario base.

**Independent Test**: Verificar que la nueva tabla `temas` esté correctamente relacionada con la tabla `materias` (1:N) y que permita ordenar los temas cronológicamente.

**Acceptance Scenarios**:

1. **Given** una materia existente, **When** se definen sus temas, **Then** el sistema debe permitir registrar múltiples temas vinculados a esa materia con un orden específico.

---

### User Story 2 - Curriculum Content Management (Priority: P2)

Como **Escolastico**, quiero gestionar el contenido detallado de cada materia, añadiendo, editando o eliminando temas, para mantener actualizado el programa de estudios de la institución.

**Why this priority**: Permite la mejora continua del pensum académico y proporciona claridad sobre lo que se debe enseñar en cada sesión.

**Independent Test**: Crear una materia y añadirle 3 temas con diferentes números de orden, luego verificar que se recuperen en el orden correcto.

**Acceptance Scenarios**:

1. **Given** un Escolastico en el módulo de gestión de pensum, **When** accede a una materia, **Then** debe poder visualizar y gestionar la lista de temas asociados.

### Edge Cases

- ¿Qué sucede si se intenta eliminar un tema que ya ha sido marcado como "completado" en una clase activa?
- ¿Cómo maneja el sistema la reordenación de temas si se inserta uno en medio de una lista existente?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST definir una tabla `temas` vinculada a la tabla `materias`.
- **FR-002**: Cada tema MUST tener un título y una descripción opcional del contenido.
- **FR-003**: El sistema MUST permitir definir un orden cronológico (secuencia) para los temas de una materia.
- **FR-004**: La relación entre `materias` y `temas` MUST ser de uno a muchos (1:N).
- **FR-005**: El sistema MUST soportar la desactivación lógica (Soft Delete) de temas para preservar el historial de clases pasadas.

### Key Entities *(include if feature involves data)*

- **Tema**: Representa una unidad de contenido dentro de una materia. Atributos: Título, descripción, orden de secuencia, referencia a la materia.

## Data Dictionary *(Conceptual Model)*

### 1. Estructura de Temarios
- **Tabla: `temas`**
    - `id`: UUID (PK)
    - `materia_id`: UUID (FK -> materias)
    - `titulo`: String (Not Null) - ej. 'Introducción a la Psicología General'
    - `descripcion`: Text (Contenido detallado del tema)
    - `orden`: Integer (Not Null) - Define la secuencia cronológica.
    - `estado`: Enum ('Activo', 'Inactivo')
    - `created_at`, `updated_at`: Timestamp (Auditoría)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tabla `temas` creada y vinculada correctamente a `materias`.
- **SC-002**: Integridad referencial garantizada (FK `materia_id`).
- **SC-003**: Capacidad de recuperar temas de una materia ordenados por el campo `orden`.
- **SC-004**: Diccionario de datos actualizado al 100% para la nueva entidad.
