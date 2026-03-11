# Feature Specification: System Configuration

**Feature Branch**: `010-system-configuration`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "System Configuration (Management of academic periods, global settings, and foundational data)"

## Clarifications

### Session 2026-03-10

- Q: ¿Cómo debe el sistema auditar los cambios en la configuración? → A: Auditar solo cambios críticos (ej. nota mínima, cierre de periodo).
- Q: ¿Qué política de complejidad de contraseñas debe aplicarse? → A: Estándar fijo (8+ caracteres, mayúsculas y números).
- Q: ¿Cómo se determina la identificación del periodo académico? → A: Año curso.
- Q: ¿Cómo debe el sistema manejar la inactividad de los usuarios? → A: Cambio de rol automático a "Ex-miembro" (no tiene mas acceso a la aplicacion, si tenemos toda la visibilidad desde adminitracion/instructor).
- Q: ¿Cuál es la nomenclatura oficial para la identificación de materias? → A: Materia-MM-YYYY (MM es el mes de inicio).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Academic Period Management (Priority: P1)

Como **administrador de Escolástica**, quiero definir los periodos académicos identificados por el año en curso y un correlativo (ej. "2026-01", "2026-02"), para organizar cronológicamente las materias y movimientos.

**Why this priority**: Es la base cronológica del sistema. Sin periodos definidos, no se pueden registrar materias ni inscripciones válidas.

**Independent Test**: Crear un nuevo periodo académico siguiendo el formato "YYYY-Correlativo", activarlo y verificar que al crear una materia (Spec 004) este periodo aparezca como opción disponible.

**Acceptance Scenarios**:

1. **Given** un administrador en el panel de configuración, **When** crea un periodo académico siguiendo la nomenclatura de año y correlativo, **Then** el sistema guarda el periodo y lo permite seleccionar en la gestión de materias.
2. **Given** un periodo activo, **When** el administrador lo marca como "Cerrado", **Then** el sistema restringe la edición de notas (Spec 006) y nuevas inscripciones (Spec 007) asociadas a ese periodo.

---

### User Story 2 - Global Grading Scale and Minimum Passing Grade (Priority: P1)

Como **administrador**, quiero configurar globalmente la nota mínima aprobatoria y el rango de la escala de calificación, para asegurar que todas las materias sigan el mismo estándar académico.

**Why this priority**: Centraliza las reglas de negocio académicas y evita inconsistencias entre diferentes módulos del sistema.

**Independent Test**: Cambiar la nota mínima aprobatoria en la configuración y verificar que los cálculos de "Aprobado/Reprobado" en el Kardex y reportes se actualicen automáticamente.

**Acceptance Scenarios**:

1. **Given** la configuración global de evaluación, **When** el administrador define la escala (ej. 0-100) y el mínimo (ej. 70), **Then** el sistema aplica estas validaciones en el registro de notas de todos los instructores.

---

### User Story 3 - Predefined Lists Management (Priority: P2)

Como **personal administrativo**, quiero gestionar las listas de opciones para motivos de baja, tipos de evaluación y otros catálogos, para mantener el sistema organizado y facilitar la generación de estadísticas precisas.

**Why this priority**: Mejora la calidad de los datos recolectados y permite adaptar el sistema a cambios organizacionales sin modificar código.

**Independent Test**: Agregar un nuevo "Motivo de Baja" en la configuración y verificar que aparezca inmediatamente en el flujo de registro de bajas (Spec 007).

**Acceptance Scenarios**:

1. **Given** el gestor de catálogos, **When** el administrador agrega o renombra un motivo de baja, **Then** el sistema actualiza las opciones disponibles en los formularios operativos correspondientes.

---

### Edge Cases

- **Periodos Solapados**: El sistema permite que dos o más periodos académicos se solapen en sus fechas (ej. Cursos de Verano coexistiendo con el Semestre Regular). El administrador es responsable de asignar las materias al periodo correcto.
- **Eliminación de Periodos con Datos**: El sistema debe impedir borrar periodos que ya tengan materias o alumnos inscritos para garantizar la integridad referencial.
- **Seguridad**: Solo los usuarios con rol de Administrador tienen acceso a esta sección de configuración crítica. La política de contraseñas exige un mínimo de 8 caracteres, incluyendo al menos una mayúscula y un número.
- **Usuarios Inactivos**: Los usuarios que dejan de participar en la escuela son asignados al rol de "Ex-miembro", lo que les otorga acceso de solo lectura a su historial académico pero les impide realizar nuevas acciones operativas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el CRUD de Periodos Académicos, utilizando una nomenclatura basada en el año actual y un correlativo (ej. YYYY-NN).
- **FR-002**: El sistema MUST permitir configurar el parámetro global de `Nota Mínima Aprobatoria`.
- **FR-003**: El sistema MUST permitir configurar el rango de `Escala de Calificación` (mínimo y máximo).
- **FR-004**: El sistema MUST proveer una interfaz para gestionar los motivos de baja predefinidos.
- **FR-005**: El sistema MUST permitir configurar el tiempo de expiración de sesión por inactividad.
- **FR-006**: El sistema MUST validar que solo exista un periodo marcado como "Activo por Defecto" para nuevas operaciones.
- **FR-007**: El sistema MUST registrar en un log de auditoría los cambios en parámetros críticos (ej. nota mínima, estado de periodos).
- **FR-008**: El sistema MUST aplicar una política de contraseñas de 8+ caracteres, mayúsculas y números para todos los usuarios.
- **FR-009**: El sistema MUST permitir asignar el rol de "Ex-miembro" a usuarios inactivos, restringiendo su acceso a modo de solo lectura.
- **FR-010**: El sistema MUST aplicar la nomenclatura `Materia-MM-YYYY` (donde MM es el mes de inicio) para la identificación única de cada materia creada.

### Key Entities *(include if feature involves data)*

- **Periodo Académico**: ID, Nomenclatura (Año-Correlativo), Fecha Inicio, Fecha Fin, Estado (Activo/Cerrado/Inactivo).
- **Configuración Global**: Tabla de clave-valor para parámetros del sistema (nota_minima, escala_max, session_timeout).
- **Catálogo de Motivos**: Lista de opciones para bajas y otros movimientos.
- **Rol**: Catálogo de roles (Admin, Instructor, Miembro, Ex-miembro).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las validaciones de notas en el sistema deben consumir el valor configurado en este módulo (sin "hardcoding").
- **SC-002**: Los cambios en la configuración global deben propagarse a todo el sistema en menos de 1 segundo tras guardar.
- **SC-003**: El sistema bloquea el borrado de cualquier periodo académico que posea al menos una materia vinculada.
- **SC-004**: Solo los usuarios con rol `Administrador` tienen acceso a las rutas de `/admin/config`.
- **SC-005**: El log de auditoría registra el 100% de los cambios en parámetros críticos con marca de tiempo y usuario responsable.

### Assumptions

- **A-001**: Se asume que los periodos académicos son la unidad de tiempo más grande del sistema (ej. Cuatrimestre, Semestre).
- **A-002**: Se asume que cambiar la nota mínima no afecta retroactivamente a periodos ya "Cerrados".
