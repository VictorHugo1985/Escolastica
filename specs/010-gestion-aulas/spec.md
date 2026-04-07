# Feature Specification: Gestión de Infraestructura (Aulas)

**Feature Branch**: `010-gestion-aulas`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Definir el CRUD de aulas y control de capacidad"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classroom Registration (Priority: P1)

Como **Administrador de Escolástica**, quiero registrar las aulas físicas disponibles en el centro, incluyendo su nombre y capacidad, para poder asignarlas a los horarios de las clases.

**Why this priority**: Es un requisito previo para la configuración de horarios de clases en el sistema.

**Independent Test**: Crear una nueva aula, verificar que aparezca en el listado y que esté disponible para ser seleccionada al crear un horario.

**Acceptance Scenarios**:

1. **Given** un nuevo espacio físico, **When** el administrador ingresa el nombre y capacidad, **Then** el sistema guarda el registro y valida que el nombre no sea duplicado.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el CRUD (Crear, Leer, Actualizar, Borrar) de aulas.
- **FR-002**: Cada aula MUST tener un nombre único obligatorio.
- **FR-003**: El sistema MUST permitir registrar la capacidad numérica de alumnos por aula.
- **FR-004**: El sistema MUST permitir registrar una descripción de la ubicación física (ej: Edificio, Piso).
- **FR-005**: Al eliminar un aula, el sistema MUST validar que no tenga horarios activos vinculados (integridad referencial).

### Key Entities *(include if feature involves data)*

- **Aula**: Espacio físico destinado a la enseñanza. Atributos: Nombre, Capacidad, Ubicación.

## Data Dictionary *(Referencia a Spec 003)*

Se utiliza la tabla `aulas` definida en la especificación maestra 002.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Disponibilidad del catálogo de aulas en el 100% de los formularios de horarios.
- **SC-002**: Validación de unicidad de nombre de aula en tiempo real (< 200ms).
- **SC-003**: Reducción de errores de asignación de espacios físicos mediante selección de catálogo predefinido.
