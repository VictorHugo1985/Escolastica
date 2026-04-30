# Feature Specification: Usuarios (Roles y Privilegios)

**Feature Branch**: `003-roles`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "todos los usuarios al ser miembros pueden ser asignados a clases, inclusive si tambien son escolasticos y/o instructores"

## Clarifications

### Session 2026-04-24 (Spec 023)
- Q: ¿El rol Miembro tiene acceso a la app web en el MVP? → A: No. En el MVP solo los usuarios con rol Instructor o Escolástico pueden autenticarse en la app. El Miembro puro no tiene acceso; el Escolástico gestiona sus inscripciones, asistencias y notas en su nombre.
- Q: ¿Existe un rol para Probacionistas no promovidos a Miembro? → A: Sí. El rol "Ex-Probacionista" es asignado por el Escolástico desde la Bandeja de Aprobación cuando decide no promover. Es un estado terminal exclusivo (incompatible con otros roles) sin acceso a la app. Ver Spec 023.
- Q: ¿Los usuarios tienen un campo de notas internas? → A: Sí. Se añade el campo `comentarios` (texto libre, opcional, nullable) a la entidad Usuario. Solo editable por Escolástico; invisible para el propio usuario.

### Session 2026-04-23
- Q: ¿Puede un usuario tener más de un rol simultáneamente? → A: Sí. Un usuario puede acumular cualquier combinación de Miembro, Instructor y Escolástico. Los permisos se suman. Probacionista y ExMiembro son roles exclusivos (incompatibles con cualquier otro). Ver spec 018 para la implementación técnica (tabla `usuario_roles`).
- Q: ¿Cómo se agrega o quita un rol a un usuario existente? → A: Mediante los endpoints `POST /users/:id/roles` y `DELETE /users/:id/roles/:rolNombre`, ambos restringidos al rol Escolástico.

### Session 2026-04-06
- Q: ¿Cuál será el identificador único obligatorio para el registro y login de usuarios? → A: Correo Electrónico.
- Q: ¿Cómo debe reaccionar el sistema si se retira el rol de Instructor con clases activas? → A: Permitir el cambio.
- Q: ¿Qué nivel de control tiene un usuario sobre su perfil? → A: Solo lectura; todo cambio requiere la intervención de un escolastico.
- Q: ¿Cuál es el método de autenticación primario? → A: Correo electrónico y contraseña (gestionado localmente).
- Q: ¿Se permite al usuario cambiar su propia contraseña? → A: Sí, el usuario puede cambiar su contraseña autónomamente por seguridad.
- Q: ¿Cuál debe ser el comportamiento al "eliminar" un usuario? → A: Desactivación lógica (Soft Delete) para preservar el historial.
- Q: ¿Un Escolástico puede impartir clases de forma inherente o requiere rol de Instructor? → A: Requiere asignación explícita del rol de "Instructor" para ser elegible como docente.
- Q: ¿La promoción de Probacionista a Miembro es automática o manual? → A: Manual; acción ejecutada por un Escolástico tras validación.
- Q: ¿Cualquier Escolástico puede asignar el rol de Escolástico a otros? → A: Sí; la gestión de roles es compartida entre todos los Escolásticos.
- Q: ¿Cómo visualiza el Escolástico a los Probacionistas para su aprobación? → A: Mediante una Bandeja de Aprobación separada de la lista general de usuarios.
- Q: ¿El Probacionista puede entrar a la app para ver sus materias? → A: No; el acceso está totalmente bloqueado hasta que sea promovido a Miembro.
- Q: ¿Cómo se gestiona la actividad académica del Probacionista sin acceso a la app? → A: El registro de notas y asistencias es responsabilidad exclusiva del Instructor y/o Escolástico en el panel administrativo.
- Q: ¿En qué momento se entregan las credenciales de acceso? → A: Solo al momento de la promoción de Probacionista a Miembro.
- Q: ¿Un Instructor puede ser alumno de su propia materia? → A: No; el sistema bloquea la inscripción como alumno en materias donde el usuario es Instructor.
- Q: ¿La creación de usuarios Probacionistas será individual o masiva? → A: Individual para el MVP; el Escolástico crea los perfiles manualmente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de Roles por Administrador (Priority: P1)

Como **escolastico**, quiero poder crear y gestionar usuarios asignándoles los roles de "Instructor", "Escolastico", "Miembro", "Probacionista" o "Ex-Probacionista", para que cada usuario tenga los accesos y privilegios adecuados según su rol en la escuela. En el MVP, solo los roles Instructor y Escolástico tienen acceso a la app web; el Miembro puro no tiene acceso y sus datos son gestionados por el Escolástico.

**Why this priority**: Es la base del control de acceso. Define quién puede hacer qué en el sistema.

**Independent Test**: Desde el panel de administración, crear un usuario, permitir asignar un rol y verificar sus accesos.

**Acceptance Scenarios**:

2. **Given** un Escolastico en el panel de gestión, **When** selecciona a un Miembro para ser Instructor, **Then** el sistema actualiza el registro y permite su asignación a materias (como Instructor).
3. **Given** un Escolastico en el panel de gestión, **When** asigna el rol de Escolastico a otro usuario, **Then** ese usuario adquiere privilegios de gestión general.
4. **Given** un Instructor con materias activas asignadas, **When** el Escolastico intenta retirarle el rol de Instructor, **Then** el sistema bloquea la acción y solicita la reasignación previa de dichas materias.
5. **Given** un Escolastico gestionando usuarios, **When** decide eliminar a un usuario con historial, **Then** el sistema realiza una desactivación lógica (Soft Delete) manteniendo sus registros previos.
6. **Given** un usuario con rol "Probacionista" en la Bandeja de Aprobación, **When** un Escolástico ejecuta la promoción manual, **Then** el rol cambia a "Miembro", desaparece de la bandeja y se habilita para auto registrar su contrasena.
7. **Given** un Probacionista en la Bandeja de Aprobación, **When** el Escolástico registra la fecha de entrevista y la marca como completada, **Then** el sistema persiste ambos campos y los muestra en el detalle del Probacionista dentro de la bandeja.
8. **Given** un Probacionista con entrevista completada, **When** el Escolástico intenta promoverlo, **Then** el sistema permite la promoción normalmente (la entrevista completada es informativa, no bloqueante en el MVP).

> Los escenarios detallados de registro de entrevista y bandeja de aprobación enriquecida están definidos en **Spec 017 (Ficha de Probacionista)**.

---

### User Story 3 - Restricción de Docencia (Asignación como Instructor) (Priority: P1)

Como **escolástico**, quiero que el sistema solo me permita asignar usuarios con el rol de "Instructor" para **impartir** materias o clases, para asegurar la integridad académica.

**Why this priority**: Garantiza que solo personal autorizado pueda figurar como responsable docente de una materia.

**Independent Test**: Intentar asignar un usuario que solo tiene el rol de "Miembro" como **titular/instructor** de una materia y verificar que el sistema lo impide.

**Acceptance Scenarios**:

1. **Given** la creación de una materia, **When** se selecciona el Instructor responsable, **Then** el sistema solo permite elegir usuarios que tengan el rol de "Instructor" activo.

---

### User Story 4 - Versatilidad del Escolastico (Priority: P2)

Como **escolastico**, quiero que mis privilegios de gestión sean independientes de mi participación en clases (como instructor o alumno), permitiéndome operar el sistema globalmente en cualquier escenario (como super-admin).

**Why this priority**: Asegura que el rol de gestión prevalezca y sea compatible con las funciones operativas.

**Independent Test**: Verificar que un escolastico asignado como alumno en una materia sigue teniendo acceso a las herramientas de configuración general de la aplicación.

**Acceptance Scenarios**:

1. **Given** un escolastico asignado como alumno o instructor, **When** navega por el sistema, **Then** mantiene acceso a las funciones de auditoría y gestión de usuarios.

---

### Edge Cases

- ¿Qué pasa si se intenta promover un Probacionista sin entrevista completada? En el MVP la promoción es posible igualmente; el campo es informativo.
- ¿Qué pasa si se ingresa una `fecha_entrevista` futura? El sistema debe permitirlo para agendar entrevistas anticipadamente.
- ¿Qué pasa si un Instructor se inscribe a su propia clase? El sistema debería bloquear su inscripcion. 
- Baja de roles: Si a un usuario se le quita el rol de "Instructor", debe dejar de aparecer como elegible para *impartir* clases. Si tiene clases activas, la operación se bloquea hasta la reasignación de las mismas.
- Roles múltiples: La lógica de permisos debe sumar privilegios, no restarlos.
- Usuarios desactivados: Un usuario en estado "Soft Delete" no debe aparecer en búsquedas activas para nuevas inscripciones o asignaciones docentes.
- Intento de login Probacionista o Ex-Probacionista: El sistema debe impedir el acceso a cualquier usuario con rol Probacionista o Ex-Probacionista, mostrando un mensaje de que su cuenta no tiene acceso a la aplicación.
- Miembro sin acceso en MVP: Un usuario con rol exclusivo "Miembro" (sin Instructor ni Escolástico) no puede autenticarse en la app web del MVP. El Escolástico gestiona todas sus inscripciones, asistencias y notas en su nombre. Si el Miembro adquiere el rol Instructor o Escolástico, obtiene acceso automáticamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST considerar a todos los usuarios registrados como "Probacionista" de forma inherente hasta su promoción.
- **FR-002**: El sistema MUST permitir que CUALQUIER usuario (Miembro, Instructor o Escolastico) sea asignado como alumno/asistente a una materia.
- **FR-003**: El sistema MUST restringir la asignación de **docentes responsables** de materias exclusivamente a usuarios que tengan el rol "Instructor" entre sus roles activos.
- **FR-014**: El sistema MUST permitir que un usuario acumule más de un rol de forma simultánea (ej: Escolástico e Instructor). Los permisos de cada rol se suman. Ver spec 018.
- **FR-015**: El sistema MUST tratar a Probacionista, Ex-Probacionista y ExMiembro como roles exclusivos: no pueden coexistir con ningún otro rol en el mismo usuario.
- **FR-016**: En el MVP, el sistema MUST bloquear el acceso a la app web a usuarios cuyo conjunto de roles activos no incluya "Instructor" ni "Escolástico". El mensaje de bloqueo MUST ser informativo y diferenciado del error por credenciales incorrectas.
- **FR-017**: El sistema MUST incorporar el rol "Ex-Probacionista" como rol canónico asignable únicamente desde la Bandeja de Aprobación como acción explícita sobre un usuario con rol "Probacionista". Al asignarlo, el sistema MUST permitir registrar opcionalmente texto en el campo `comentarios` del usuario. Ver Spec 023.
- **FR-018**: El sistema MUST agregar el campo `comentarios` (texto libre, opcional, nullable) a la entidad Usuario. MUST ser editable únicamente por Escolástico e invisible en la vista de perfil del propio usuario.
- **FR-005**: El sistema MUST proveer funciones de gestión general (configuración, auditoría, gestión de usuarios) únicamente a usuarios con el rol de "Escolastico".
- **FR-006**: El sistema MUST impedir la revocación del rol de Instructor si el usuario tiene clases vigentes bajo su cargo.
- **FR-007**: El sistema MUST centralizar la edición de perfiles de usuario por el Escolastico, restringiendo la edición por parte del propio usuario (solo lectura).
- **FR-008**: El sistema MUST utilizar el **correo electrónico** como identificador único obligatorio para el registro y método de autenticación.
- **FR-009**: El sistema MUST permitir que los usuarios cambien su propia contraseña de forma autónoma.
- **FR-010**: El sistema MUST utilizar desactivación lógica (Soft Delete) para la "eliminación" de usuarios.
- **FR-011 → FR-013**: Gestión de `fecha_entrevista` y `entrevista_completada` en Bandeja de Aprobación. Ver **Spec 017** para los requisitos detallados.
- **FR-019**: El sistema MUST validar la unicidad del **CI (Cédula de Identidad)** y el **Email** en el registro de usuarios.
- **FR-020**: El sistema MUST validar que el formato del CI sea numérico (o alfanumérico según región) y el teléfono cumpla con un formato estándar de 8-10 dígitos.

### Key Entities *(include if feature involves data)*

- **Usuario**: Entidad base. Atributos: Email (ID), Nombre Completo, CI, Teléfono, Género, Fecha Nacimiento, Fecha Inscripción, `comentarios` (texto libre, opcional, solo editable por Escolástico).
- **Probacionista**: Usuario registrado sin acceso a la aplicación hasta su promoción. Atributos adicionales exclusivos de la bandeja de aprobación: `fecha_entrevista` (fecha opcional), `entrevista_completada` (booleano, default: false).
- **Ex-Probacionista**: Rol terminal para Probacionistas no promovidos. Sin acceso a la app. Exclusivo (incompatible con otros roles). Asignable solo desde la Bandeja de Aprobación por el Escolástico. Ver Spec 023.
- **Miembro**: Rol base. En el MVP sin acceso a la app web; sus datos son gestionados por el Escolástico. Si acumula rol Instructor o Escolástico, obtiene acceso.
- **Instructor**: Rol que habilita ser "docente" de una materia y acceder a la app web.
- **Escolastico**: Rol administrativo con privilegios de gestión total y acceso completo a la app web.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-002**: La lista de selección de **profesores** filtra el 100% de los usuarios que no tengan el rol Instructor entre sus roles activos (incluyendo Escolásticos sin rol de Instructor explícito).
- **SC-003**: Un usuario con roles de Escolastico puede ver los Kardex (alumno), gestionar clases y administrar el sistema (admin) simultáneamente.
- **SC-004**: El sistema previene errores de "materia huérfana" bloqueando la baja de instructores activos en el 100% de los casos.
- **SC-005**: Verificación de que el usuario final no posee permisos de escritura sobre su propio registro de perfil (excepto cambio de contraseña).
- **SC-006**: Verificación de que solo usuarios autenticados con credenciales válidas, estado "Activo" y al menos un rol de "Instructor" o "Escolástico" activo pueden acceder al sistema en el MVP (Miembro puro, Probacionista y Ex-Probacionista bloqueados).
- **SC-007**: Integridad referencial validada: los usuarios "eliminados" (soft-deleted) mantienen sus registros de calificaciones e historial previos.
- **SC-008**: Verificación de que los Probacionistas aparecen correctamente en la Bandeja de Aprobación y desaparecen tras ser promovidos.
- **SC-009**: Verificación del 100% de bloqueos de login para intentos desde cuentas con rol Probacionista.
- **SC-010**: Verificación de que el historial académico del Probacionista es editable por el Escolástico a pesar del bloqueo de acceso del usuario.
- **SC-011**: Verificación de que el flujo de entrega de credenciales solo se dispara tras el cambio de estado de Probacionista a Miembro.
- **SC-012**: El sistema impide la auto-inscripción como alumno de instructores en el 100% de los casos.
- **SC-013**: Verificación de que el Escolástico puede crear usuarios mediante formularios individuales de forma exitosa.
- **SC-014**: Verificación de que `fecha_entrevista` y `entrevista_completada` son persistidos correctamente y solo son accesibles desde la Bandeja de Aprobación.
- SC-015: Verificación de que el formulario general de edición de usuario NO expone los campos de entrevista bajo ningún escenario.
- **SC-016**: El 100% de los flujos de no-promoción desde la Bandeja de Aprobación resultan en el rol "Ex-Probacionista" con el historial del usuario intacto.
- **SC-017**: El campo `comentarios` está disponible en el 100% de los perfiles desde el panel Escolástico y no es visible en ninguna vista de usuario final.
- **SC-018**: El 100% de los intentos de login de usuarios con rol Miembro puro, Probacionista o Ex-Probacionista son bloqueados con mensaje informativo (sin revelar error de credenciales).

---

**Nota**: Para la validación técnica de accesos a funcionalidades, consultar Spec 019 (Matriz de Privilegios).
