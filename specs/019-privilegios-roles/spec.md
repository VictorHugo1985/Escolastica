# Feature Specification: Privilegios de Roles

**Feature Branch**: `019-privilegios-roles`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "crear una nueva especificacion llamada privilegios-roles en la que se defina que privilegios tendra cada uno de los roles, por ejemplo el escolastico tendra acceso a todas las funcionalidades"

## Clarifications

- Esta especificación actúa como la matriz de autorización final. La gestión procedimental de usuarios y roles definida en Spec 003 y las reglas de compatibilidad académica de Spec 018 son dependencias de entrada para esta matriz.

## User Scenarios & Testing

### User Story 1 - Definición de Permisos por Rol (Priority: P1)

Como **administrador del sistema**, quiero definir los privilegios de cada rol (Escolástico, Instructor, Miembro, Probacionista, Ex-miembro) para asegurar que cada usuario acceda solo a las funcionalidades correspondientes.

**Why this priority**: Es la base de la seguridad y control de acceso del sistema.

**Independent Test**: Verificar que un usuario con un rol específico pueda realizar las acciones permitidas y no las restringidas.

**Acceptance Scenarios**:

1. **Given** un usuario con rol "Escolástico", **When** intenta acceder a cualquier funcionalidad del sistema, **Then** el sistema permite el acceso.
2. **Given** un usuario con rol "Instructor", **When** intenta acceder a funcionalidades fuera de su alcance, **Then** el sistema deniega el acceso.
3. **Given** un usuario con rol "Probacionista", **When** intenta acceder a cualquier funcionalidad protegida, **Then** el sistema deniega el acceso con error 403.

---

### User Story 2 - Matriz Inmutable de Funcionalidades (Priority: P1)

Como **administrador del sistema**, quiero disponer de un listado inmutable de funcionalidades del proyecto para asignar privilegios de forma consistente.

**Why this priority**: Garantiza la integridad de la configuración de seguridad del sistema.

**Independent Test**: Verificar que el listado de funcionalidades sea de solo lectura para los usuarios administrativos normales y que solo se puedan asignar privilegios sobre estas.

**Acceptance Scenarios**:

1. **Given** el listado inmutable de funcionalidades, **When** se consulta la matriz de permisos, **Then** solo se muestran funcionalidades registradas.

---

### Edge Cases

- Qué sucede si se intenta asignar permisos contradictorios a un mismo rol.
- Cómo manejar la actualización de permisos para un rol mientras los usuarios tienen sesiones activas.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST mantener un catálogo inmutable de funcionalidades del proyecto.
- **FR-002**: El sistema MUST permitir la configuración centralizada de privilegios asociados a cada rol canónico (`Escolastico`, `Instructor`, `Miembro`, `Probacionista`, `Ex-miembro`).
- **FR-003**: El sistema MUST bloquear cualquier acceso a funcionalidades no autorizadas para un rol específico.
- **FR-004**: El sistema MUST garantizar que el rol `Probacionista` mantenga su restricción de acceso por defecto (bloqueo total).

### Matriz de Funcionalidades y Roles

| Funcionalidad | Escolástico | Instructor | Miembro | Probacionista | Ex-miembro |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Gestión Materias | Sí | Sí | No | No | No |
| Registro Asistencia | Sí | Sí | No | No | No |
| Gestión Notas | Sí | Sí | No | No | No |
| Acceso Panel Principal | Sí | Sí | Sí | No | No |

### Key Entities

- **Rol**: Define el conjunto de permisos. (Ver Diccionario de Datos 002).
- **Privilegio**: Acción o acceso a funcionalidad protegida.
- **Funcionalidad**: Listado inmutable de capacidades del sistema.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% de las funcionalidades críticas están mapeadas en la matriz inmutable.
- **SC-002**: 100% de las funcionalidades protegidas son validadas contra la matriz de permisos de roles.
- **SC-003**: 0 casos de acceso no autorizado registrado en auditoría para usuarios con roles restringidos.
