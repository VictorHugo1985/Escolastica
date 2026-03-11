# Feature Specification: Database Model and Data Dictionary

**Feature Branch**: `003-database-model-design`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Relational Model and Data Dictionary. Define tables for users, roles, subjects, enrollments, attendance, and grades as the source of truth for the project."

## Clarifications

### Session 2026-03-10

- Q: ¿Cómo se debe representar el estado de "Probacionista" y su transición a "Miembro"? → A: Se define un nuevo Rol "Probacionista" en la tabla `roles`. Los probacionistas no tienen acceso a la aplicación hasta convertirse en "Miembros".
- Q: ¿Cómo se dispara la transición de "Probacionista" a "Miembro"? → A: Transición manual realizada por un Administrador tras validación interna.
- Q: ¿Los miembros pueden ver su historial de cursos de probacionismo? → A: Sí, los cursos de probacionismo son visibles en el Kardex del Miembro como historial de solo lectura.
- Q: ¿Cómo se maneja la temporalidad académica sin periodos fijos? → A: Se eliminan los periodos académicos. Las materias se registran con mes y año de inicio, diferenciando paralelos mediante un campo específico.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definition of Core Entities (Priority: P1)

Como **arquitecto de software o desarrollador**, quiero definir las entidades base del sistema (Usuarios, Roles, Materias, Inscripciones, Asistencias y Notas) en un modelo relacional, para que sirva como el contrato estructural y fuente única de verdad para el desarrollo del backend y frontend.

**Why this priority**: La Constitución establece que el diseño de la base de datos es el contrato estructural no negociable y debe definirse antes de cualquier implementación funcional.

**Independent Test**: Verificar que el modelo relacional cubra todas las entidades mencionadas y que las relaciones (1:N, N:M) estén correctamente establecidas según las reglas de negocio de la Escuela NA.

**Acceptance Scenarios**:

1. **Given** los requerimientos del MVP, **When** se diseña el esquema, **Then** debe incluir tablas para Usuarios (con roles inherentes), Materias (con mes/año de inicio e instructor), Inscripciones (miembros en materias), Asistencias y Notas.
2. **Given** el diseño de la base de datos, **When** se valida contra la Constitución, **Then** debe reflejar que todo Instructor y Administrador es inherentemente un Miembro.

---

### User Story 2 - Data Dictionary and Constraints (Priority: P1)

Como **desarrollador**, quiero disponer de un diccionario de datos detallado que especifique tipos de datos, restricciones (null/not null, unique, FK) y descripciones de cada campo, para asegurar la integridad de los datos y la consistencia en la implementación.

**Why this priority**: Previene errores de integración y asegura que las validaciones en el backend coincidan con las restricciones a nivel de base de datos.

**Independent Test**: Revisar el diccionario de datos y confirmar que cada campo tiene definido su tipo, obligatoriedad y propósito.

**Acceptance Scenarios**:

1. **Given** una tabla definida, **When** se documenta en el diccionario, **Then** debe especificar claramente si el campo es clave primaria, foránea o si tiene restricciones de unicidad.
2. **Given** el diccionario de datos, **When** un desarrollador lo consulta, **Then** debe entender sin ambigüedad el formato esperado para cada dato (ej. formato de correo, longitud de cadenas).

---

### User Story 3 - Traceability and History (Priority: P2)

Como **Secretaría de Escolástica**, quiero que el modelo de datos soporte el rastreo de cambios y el histórico de movimientos (altas y bajas), para mantener un control administrativo estricto sobre la trayectoria de los alumnos.

**Why this priority**: La Constitución exige explícitamente un histórico de bajas por alumno y materia.

**Independent Test**: Verificar que las tablas de inscripciones permitan registrar la fecha de alta, la fecha de baja y el motivo o estado de la misma sin perder el registro histórico.

**Acceptance Scenarios**:

1. **Given** una baja de un alumno en una materia, **When** se actualiza la base de datos, **Then** el registro debe permanecer en el sistema marcado como "Baja" con su respectiva fecha.
2. **Given** la necesidad de auditoría, **When** se consulta el historial de un alumno, **Then** el modelo debe permitir recuperar todas las materias cursadas, aprobadas y abandonadas.

---

### User Story 4 - Probationary to Member Transition (Priority: P2)

Como **Administrador**, quiero cambiar manualmente el rol de un usuario de "Probacionista" a "Miembro", para habilitar su acceso a la aplicación y permitir que el nuevo Miembro consulte su historial de probación como lectura.

**Why this priority**: Define el flujo de vida del usuario y asegura que el acceso a la plataforma esté restringido según la lógica de negocio, preservando la integridad del registro académico.

**Independent Test**: Cambiar el rol de un usuario en la base de datos y verificar que la `fecha_recibimiento` se registre, que el usuario pueda autenticarse y que sus cursos de probación previos aparezcan en su Kardex.

**Acceptance Scenarios**:

1. **Given** un usuario con rol "Probacionista", **When** el administrador actualiza su rol a "Miembro", **Then** el sistema guarda la fecha actual en `fecha_recibimiento`, permite el login al usuario y habilita la vista de historial de sus cursos pasados.

---

### Edge Cases

- **Roles Múltiples**: ¿Cómo maneja el modelo a un usuario que es simultáneamente Instructor de una materia y Alumno de otra? El diseño debe permitir esta polivalencia sin duplicar registros de identidad.
- **Cambios en Horarios**: ¿Qué sucede con las asistencias registradas si el horario de una materia cambia a mitad de curso? El modelo debe contemplar la integridad referencial de los registros ya existentes.
- **Bajas y Notas**: ¿Debe el sistema permitir registrar notas a un alumno que ya tiene estado de "Baja"? La base de datos debe permitir o restringir esto según la lógica de negocio definida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST utilizar una base de datos relacional como fuente única de verdad.
- **FR-002**: El modelo MUST implementar la jerarquía de roles donde Administradores e Instructores son inherentemente Miembros.
- **FR-003**: El sistema MUST definir una tabla de `Usuarios` que centralice la identidad y autenticación.
- **FR-004**: El sistema MUST definir una tabla de `Materias` que incluya instructor responsable, código (basado en mes/año), paralelo, horarios y descripción.
- **FR-005**: El sistema MUST definir una tabla de `Inscripciones` (relación N:M entre Usuarios y Materias) para gestionar alumnos.
- **FR-006**: El sistema MUST definir una tabla de `Asistencias` vinculada a una Inscripción y una fecha/clase específica.
- **FR-007**: El sistema MUST definir una tabla de `Notas` vinculada a una Inscripción para registrar resultados de exámenes.
- **FR-008**: El sistema MUST incluir campos de auditoría (`created_at`, `updated_at`) en todas las tablas principales.
- **FR-009**: El modelo MUST soportar "Soft Deletes" o estados de vigencia para mantener el histórico de bajas requerido.
- **FR-010**: El sistema MUST restringir el acceso a la aplicación a usuarios con rol `Probacionista`, permitiendo su acceso solo cuando su rol cambie a `Miembro`.
- **FR-011**: El sistema MUST registrar la `fecha_recibimiento` en el perfil del usuario al momento de la transición manual de rol.
- **FR-012**: El sistema MUST permitir a los usuarios con rol `Miembro` visualizar sus inscripciones, asistencias y notas de cursos de probacionismo pasados en modo de solo lectura.

### Key Entities *(include if feature involves data)*

- **Usuario**: Entidad central que representa a cualquier persona con acceso al sistema. Todo usuario es inherentemente un **Miembro** una vez superada la etapa de probación.
- **Rol**: Define los permisos y capacidades (Admin, Instructor, Miembro, Probacionista, Ex-miembro).
- **Materia**: Unidad educativa con mes y año de inicio, instructor asignado y paralelo. Los cursos de probacionismo son materias exclusivas para usuarios con rol `Probacionista`.
- **Horario**: Definición de los momentos en que se imparte una materia.
- **Inscripción**: Relación que vincula a un Miembro o Probacionista con una Materia, rastreando su estado (Activo/Baja).
- **Asistencia**: Registro diario de presencia de un alumno en una materia.
- **Nota**: Calificación obtenida por un alumno en las evaluaciones de una materia.

## Data Dictionary *(Conceptual Model)*

### 1. Usuarios & Roles
- **Tabla: `roles`**
    - `id`: UUID (PK)
    - `nombre`: String (Unique) - ej. 'Admin', 'Instructor', 'Miembro', 'Probacionista', 'Ex-miembro'
    - `descripcion`: String (Optional)
- **Tabla: `usuarios`**
    - `id`: UUID (PK) - Sincronizado con Supabase Auth.
    - `email`: String (Unique, Not Null)
    - `nombre_completo`: String (Not Null)
    - `genero`: String (Optional)
    - `fecha_nacimiento`: Date (Optional)
    - `telefono`: String (Optional)
    - `ci`: String (Optional)
    - `foto_url`: String (Optional)
    - `rol_id`: UUID (FK -> roles)
    - `estado`: Enum ('Activo', 'Inactivo')
    - `fecha_recibimiento`: Date (Optional) - Fecha en que pasa de Probacionista a Miembro.
    - `created_at`: Timestamp
    - `updated_at`: Timestamp

### 2. Estructura Académica
- **Tabla: `materias`**
    - `id`: UUID (PK)
    - `codigo`: String (Unique, Not Null) - Formato: `[Materia]-MM-YYYY-[Paralelo]`
    - `nombre`: String (Not Null)
    - `descripcion`: Text
    - `mes_inicio`: Integer (1-12)
    - `anio_inicio`: Integer (ej. 2026)
    - `paralelo`: String (Not Null, Default 'A') - ej. 'A', 'B', '1'
    - `instructor_id`: UUID (FK -> usuarios) - Debe tener rol Instructor.
    - `es_curso_probacion`: Boolean (Default false) - Identifica si es solo para probacionistas.
    - `estado`: Enum ('Activa', 'Inactiva', 'Finalizada')
- **Tabla: `horarios`**
    - `id`: UUID (PK)
    - `materia_id`: UUID (FK -> materias)
    - `dia_semana`: Integer (0-6)
    - `hora_inicio`: Time (Not Null)
    - `hora_fin`: Time (Not Null)
    - `aula`: String (Optional)

### 3. Operatividad (Inscripciones, Asistencias, Notas)
- **Tabla: `inscripciones`**
    - `id`: UUID (PK)
    - `usuario_id`: UUID (FK -> usuarios) - El alumno (Miembro o Probacionista).
    - `materia_id`: UUID (FK -> materias)
    - `fecha_inscripcion`: Timestamp (Default now)
    - `fecha_baja`: Timestamp (Optional)
    - `motivo_baja`: String (Optional) - Basado en lista predefinida.
    - `estado`: Enum ('Activo', 'Baja', 'Finalizado')
- **Tabla: `asistencias`**
    - `id`: UUID (PK)
    - `inscripcion_id`: UUID (FK -> inscripciones)
    - `fecha`: Date (Not Null)
    - `estado`: Enum ('Presente', 'Ausente', 'Tarde', 'Justificado')
    - `observacion`: String (Optional)
    - `registrado_por`: UUID (FK -> usuarios) - El instructor.
- **Tabla: `notas`**
    - `id`: UUID (PK)
    - `inscripcion_id`: UUID (FK -> inscripciones)
    - `valor`: Decimal (0-100, Not Null)
    - `tipo_evaluacion`: String (Not Null) - ej. 'Parcial 1', 'Final', 'Extraordinario'
    - `fecha_registro`: Timestamp (Default now)
    - `registrado_por`: UUID (FK -> usuarios)

### 4. Auditoría
- **Tabla: `logs_auditoria`**
    - `id`: UUID (PK)
    - `usuario_id`: UUID (FK -> usuarios)
    - `accion`: String (Not Null) - ej. 'CAMBIO_NOTA', 'TRANSICION_MIEMBRO'
    - `tabla_afectada`: String
    - `registro_id`: UUID
    - `valor_anterior`: JSONB
    - `valor_nuevo`: JSONB
    - `fecha`: Timestamp (Default now)

### Assumptions

- **A-001**: Se asume el uso de tipos de datos estándar SQL para máxima compatibilidad.
- **A-002**: Se asume que la zona horaria del sistema para todos los registros será UTC-4 Bolivia.
- **A-003**: Se asume que el volumen de datos inicial permite una normalización en 3NF sin comprometer el rendimiento en el MVP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El modelo relacional debe estar documentado y ratificado antes de iniciar cualquier desarrollo de API o UI.
- **SC-002**: El 100% de las tablas definidas deben tener una clave primaria y cumplir con la 3ra Forma Normal (3NF) para evitar redundancias.
- **SC-003**: El diccionario de datos debe cubrir el 100% de los campos presentes en el esquema.
- **SC-004**: La integridad referencial (Foreign Keys) debe garantizar que no existan "registros huérfanos" (ej. asistencias sin inscripción válida).
