# Feature Specification: Database Model and Data Dictionary (Master Spec)

**Feature Branch**: `002-diccionario-datos`  
**Created**: 2026-03-10  
**Updated**: 2026-04-06 (Refactorización a Sesiones)  
**Status**: Draft  
**Input**: User description: "Renombrar tabla clase_temas a sesiones y refactorizar para soportar asistencia, tipo de clase y avance de temas."

## Clarifications

### Session 2026-04-06

- Q: ¿Cómo se debe estandarizar el nombre de la entidad para las clases abiertas? → A: Se utilizará el nombre de tabla `clases`.
- Q: ¿Cuál es la escala de calificación definitiva? → A: Se mantiene la escala basada en Enum ('Sobresaliente', 'Repite', 'Aprobo') para simplificar la lógica de aprobación.
- Q: ¿Cuál es la frecuencia de registro de asistencias? → A: Un solo registro por alumno por día para cada clase (suficiente para el seguimiento académico).
- Q: ¿Cuántos instructores puede tener una clase? → A: Un solo instructor por clase para el MVP.
- Q: ¿Cómo se maneja la recurrencia de los horarios? → A: Se asume una recurrencia semanal fija (mismo horario cada semana durante la duración de la clase).
- Q: ¿Se puede registrar más de un tema por sesión/día para una misma clase? → A: Solo se permite registrar un único tema por sesión.
- Q: ¿Los instructores pueden editar o eliminar sus registros de avance? → A: Sí, los instructores tienen flexibilidad total para editar o eliminar sus propios registros en cualquier momento.
- Q: ¿Quién puede registrar el avance de temas en una clase? → A: Cualquier instructor autorizado o administrador puede realizar el registro (ej: suplentes), quedando constancia de su ID en el campo `instructor_id`.
- Q: ¿Cómo se gestionan los espacios físicos (aulas)? → A: Se define una tabla maestra de `aulas` para que los horarios referencien un espacio preexistente en lugar de texto libre.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definition of Core Entities (Priority: P1)

Como **arquitecto de software o desarrollador**, quiero definir las entidades base del sistema (Usuarios, Roles, Materias, Temas por Materia, Clases, Inscripciones, Asistencias, Notas, Aulas y Sesiones) en un modelo relacional, para que sirva como el contrato estructural y fuente única de verdad.

**Why this priority**: La Constitución establece que el diseño de la base de datos es el contrato estructural no negociable.

**Independent Test**: Verificar que el modelo relacional cubra todas las entidades mencionadas y que las relaciones (1:N, N:M) estén correctamente establecidas.

**Acceptance Scenarios**:

1. **Given** los requerimientos del MVP, **When** se diseña el esquema, **Then** debe incluir tablas para Usuarios, materias, Clases, Inscripciones, Asistencias, Notas, Aulas y Sesiones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST utilizar una base de datos relacional como fuente única de verdad.
- **FR-002**: El modelo MUST implementar la jerarquía de roles donde Administradores e Instructores son inherentemente Miembros.
- **FR-003**: El sistema MUST definir una tabla de `Usuarios` que centralice la identidad y autenticación.
- **FR-004**: El sistema MUST definir una tabla de `materias` (Pensum) que actúe como catálogo maestro de asignaturas y sus temarios.
- **FR-005**: El sistema MUST definir una tabla de `clases` para las sesiones abiertas, vinculadas al Pensum, con instructor, código, paralelo y fecha de inicio.
- **FR-006**: El sistema MUST definir una tabla de `Inscripciones` (relación N:M entre Usuarios y Clases) para gestionar alumnos.
- **FR-007**: El sistema MUST definir una tabla de `Asistencias` vinculada a una sesión específica (`sesiones.id`).
- **FR-008**: El sistema MUST definir una tabla de `Notas` vinculada a una Inscripción para registrar resultados de exámenes.
- **FR-009**: El sistema MUST incluir campos de auditoría (`created_at`, `updated_at`) en todas las tablas principales.
- **FR-010**: El modelo MUST soportar "Soft Deletes" o estados de vigencia para mantener el historial de bajas requerido.
- **FR-011**: El sistema MUST restringir el acceso a la aplicación a usuarios con rol `Probacionista`.
- **FR-012**: El sistema MUST permitir a los Miembros visualizar su historial de cursos de probacionismo en modo de solo lectura.
- **FR-013**: El sistema MUST definir una tabla `temas` vinculada a la tabla `materias` para el temario base.
- **FR-014**: El sistema MUST definir una tabla `sesiones` para el seguimiento de avance académico y asistencia por sesión de clase.
- **FR-015**: El sistema MUST definir una tabla `aulas` para gestionar los espacios físicos de la institución.

### Key Entities *(include if feature involves data)*

- **Usuario**: Identidad central. Todo usuario es **Miembro** tras la probación.
- **Rol**: Admin, Instructor, Miembro, Probacionista, Ex-miembro.
- **Materia**: Definición maestra de una asignatura (ej. "Psicología", temario base).
- **Tema**: Unidad de contenido dentro de una materia.
- **Clase**: Una sesión específica abierta (ej. "Psicología - Marzo 2026 - Paralelo A").
- **Aula**: Espacio físico donde se dictan las clases.
- **Sesión**: Registro de una clase dada (clase, examen, práctica, reposición).
- **Horario**: Definición de día, hora y aula para una clase.
- **Inscripción**: Vínculo entre alumno e clase.
- **Asistencia**: Registro de presencia en una sesión.
- **Nota**: Calificación en una clase.

## Data Dictionary *(Consolidated)*

### 1. Usuarios & Roles
- **Tabla: `roles`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `nombre`: VARCHAR(50) (Unique, Not Null) - ej: 'Admin', 'Instructor', 'Miembro', 'Probacionista'.
- **Tabla: `usuarios`**
    - `id`: UUID (PK) - Sincronizado con Supabase Auth.
    - `rol_id`: UUID (FK -> roles, Not Null)
    - `email`: VARCHAR(255) (Unique, Not Null)
    - `nombre_completo`: VARCHAR(255) (Not Null)
    - `genero`: VARCHAR(20) (Optional)
    - `fecha_nacimiento`: DATE (Optional)
    - `telefono`: VARCHAR(20) (Optional)
    - `ci`: VARCHAR(20) (Optional)
    - `foto_url`: TEXT (Optional)
    - `fecha_recibimiento`: DATE (Optional)
    - `estado`: VARCHAR(20) (Default 'Activo') - Enum: 'Activo', 'Inactivo'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 2. Estructura Académica (Pensum y Temas)
- **Tabla: `materias`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `nombre`: VARCHAR(100) (Not Null) - ej. 'Psicología'
    - `descripcion`: TEXT (Optional) - Temario base
    - `es_curso_probacion`: BOOLEAN (Default FALSE)
    - `estado`: VARCHAR(20) (Default 'Activo') - Enum: 'Activo', 'Inactivo'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
- **Tabla: `temas`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `materia_id`: UUID (FK -> materias, Not Null)
    - `titulo`: VARCHAR(255) (Not Null) - ej. 'Introducción a la Psicología General'
    - `descripcion`: TEXT (Optional) - Contenido detallado del tema
    - `orden`: INTEGER (Not Null) - Define la secuencia cronológica.
    - `estado`: VARCHAR(20) (Default 'Activo') - Enum: 'Activo', 'Inactivo'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 3. Infraestructura y Espacios
- **Tabla: `aulas`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `nombre`: VARCHAR(50) (Unique, Not Null) - ej: 'Aula 101', 'Salón de Actos'.
    - `capacidad`: INTEGER (Optional)
    - `ubicacion`: TEXT (Optional) - Descripción física (ej: 'Piso 2').
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 4. Instancias de Clases y Horarios
- **Tabla: `clases`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `materia_id`: UUID (FK -> materias, Not Null)
    - `instructor_id`: UUID (FK -> usuarios, Not Null)
    - `codigo`: VARCHAR(50) (Unique, Not Null) - Formato: `[Materia]-MM-YYYY-[Paralelo]`
    - `mes_inicio`: INTEGER (Not Null)
    - `anio_inicio`: INTEGER (Not Null)
    - `Celador`: VARCHAR(10) (Not Null)
    - `fecha_inicio`: DATE (Not Null)
    - `estado`: VARCHAR(20) (Default 'Activa') - Enum: 'Activa', 'Inactiva', 'Finalizada'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
- **Tabla: `horarios`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `clase_id`: UUID (FK -> clases, Not Null)
    - `aula_id`: UUID (FK -> aulas, Optional) - Referencia al espacio físico.
    - `dia_semana`: INTEGER (Not Null) - 0 (Domingo) a 6 (Sábado)
    - `hora_inicio`: TIME (Not Null)
    - `hora_fin`: TIME (Not Null)
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 5. Seguimiento Académico (Sesiones y Avance)
- **Tabla: `sesiones`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `clase_id`: UUID (FK -> clases, Not Null)
    - `fecha`: DATE (Not Null)
    - `tipo`: VARCHAR(20) (Not Null) - Enum: 'clase', 'examen', 'practica', 'reposicion'
    - `tema_id`: UUID (FK -> temas, Optional) - Tema avanzado en la sesión.
    - `concluyo_tema`: BOOLEAN (Default FALSE)
    - `comentarios`: TEXT (Optional)
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 6. Inscripciones, Asistencia y Notas
- **Tabla: `inscripciones`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `usuario_id`: UUID (FK -> usuarios, Not Null)
    - `clase_id`: UUID (FK -> clases, Not Null)
    - `fecha_inscripcion`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `fecha_baja`: TIMESTAMP WITH TIME ZONE (Optional)
    - `motivo_baja`: TEXT (Optional)
    - `estado`: VARCHAR(20) (Default 'Activo') - Enum: 'Activo', 'Baja', 'Finalizado'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
- **Tabla: `asistencias`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `inscripcion_id`: UUID (FK -> inscripciones, Not Null)
    - `sesion_id`: UUID (FK -> sesiones, Not Null) - Vinculación directa a la sesión.
    - `estado`: VARCHAR(20) (Not Null) - Enum: 'Presente', 'Ausente', 'Tarde', 'Justificado'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
- **Tabla: `notas`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `inscripcion_id`: UUID (FK -> inscripciones, Not Null)
    - `nota`: VARCHAR(20) (Not Null) - Enum: 'Sobresaliente', 'Repite', 'Aprobo'
    - `tipo_evaluacion`: VARCHAR(100) (Not Null) - ej. 'Parcial 1'
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())
    - `updated_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### 7. Auditoría
- **Tabla: `logs_auditoria`**
    - `id`: UUID (PK, DEFAULT gen_random_uuid())
    - `usuario_id`: UUID (FK -> usuarios, Optional)
    - `accion`: VARCHAR(100) (Not Null)
    - `tabla_afectada`: VARCHAR(100) (Not Null)
    - `valor_anterior`: JSONB (Optional)
    - `valor_nuevo`: JSONB (Optional)
    - `created_at`: TIMESTAMP WITH TIME ZONE (Default NOW())

### Assumptions

- **A-001**: Tipos de datos estándar PostgreSQL.
- **A-002**: Zona horaria UTC-4 Bolivia.
- **A-003**: Normalización 3NF.
- **A-004**: Todas las PK son UUID generados mediante `gen_random_uuid()`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Modelo relacional consolidado cubre el 100% de las necesidades del MVP, sesiones y asistencia vinculada.
- **SC-002**: 100% de tablas con PK y cumplimiento de 3NF.
- **SC-003**: Diccionario de datos consolidado sin inconsistencias de tipos.
- **SC-004**: Integridad referencial garantizada en todo el esquema, incluyendo sesiones y asistencia.
