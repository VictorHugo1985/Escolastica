# Feature Specification: Ajustes de Roles para MVP (Miembro sin Acceso, Ex-Probacionista, Comentarios)

**Feature Branch**: `023-roles-ajustes-mvp`
**Created**: 2026-04-24
**Status**: Draft
**Input**: User description: "Incluir en la spec 003-roles que el rol Miembro no va tener acceso a la app web en esta version de MVP, ademas incluir un nuevo rol:ex-probacionista para los probacionistas que no son promovidos a mienbros e incluir un campo en usuario de comentarios de llenado opcional"

> Esta spec documenta tres ajustes al modelo de roles definido en **Spec 003**. Los cambios aprobados deben incorporarse directamente en spec 003.

## Clarifications

### Session 2026-04-24

- Q: ¿El campo `comentarios` es editable por el propio usuario? → A: No. Es de uso exclusivo del Escolástico (administración interna).
- Q: ¿El rol Ex-Probacionista permite acceso futuro al sistema? → A: No. Es un estado terminal sin acceso a la app, equivalente a Probacionista en términos de acceso.
- Q: ¿Los Miembros pueden ser inscriptos en materias aunque no puedan acceder a la app? → A: Sí. El Escolástico gestiona sus inscripciones, asistencias y notas en su nombre.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restricción de Acceso Web para Rol Miembro en MVP (Priority: P1)

Como **escolástico**, quiero que en el MVP únicamente los usuarios con rol Instructor o Escolástico puedan iniciar sesión en la aplicación web, para reducir la complejidad de la interfaz de cara al usuario final y enfocar el desarrollo en las herramientas de gestión.

**Why this priority**: Define el alcance funcional del MVP. Sin esta restricción, la app debería incluir vistas de Kardex y notas para el Miembro, duplicando el esfuerzo de desarrollo.

**Independent Test**: Intentar iniciar sesión con un usuario que solo tiene el rol Miembro y verificar que el sistema rechaza el acceso con un mensaje informativo claro, diferenciado del error de credenciales incorrectas.

**Acceptance Scenarios**:

1. **Given** un usuario con rol exclusivo de "Miembro" (sin rol Instructor ni Escolástico), **When** intenta autenticarse en la app web, **Then** el sistema rechaza el intento con un mensaje del tipo "Tu cuenta no tiene acceso a la aplicación en esta versión".
2. **Given** un usuario con roles de Miembro e Instructor simultáneamente, **When** inicia sesión, **Then** el sistema permite el acceso (el rol Instructor habilita el ingreso).
3. **Given** un Miembro sin acceso a la app, **When** el Escolástico inscribe, registra asistencia o carga notas en su nombre desde el panel administrativo, **Then** todas las operaciones funcionan normalmente; el Miembro no necesita autenticarse para que su historial sea gestionado.

---

### User Story 2 - Rol Ex-Probacionista y Flujo de No-Promoción (Priority: P1)

Como **escolástico**, quiero poder marcar a un Probacionista como "Ex-Probacionista" desde la Bandeja de Aprobación cuando decido no promoverlo a Miembro, para mantener un registro claro de su situación y poder dejar constancia del motivo de la decisión.

**Why this priority**: Es la contraparte del flujo de promoción. Sin este rol, los Probacionistas rechazados quedarían en la bandeja indefinidamente o serían eliminados sin dejar historial.

**Independent Test**: Desde la Bandeja de Aprobación, seleccionar un Probacionista, elegir "No promover / Ex-probacionista", ingresar un comentario opcional y guardar. Verificar que el usuario desaparece de la bandeja, su rol cambia a "Ex-Probacionista" y el comentario queda en su perfil.

**Acceptance Scenarios**:

1. **Given** un Probacionista en la Bandeja de Aprobación, **When** el Escolástico selecciona "No promover" e ingresa el comentario "Falta de compromiso en asistencia", **Then** el sistema actualiza el rol a "Ex-Probacionista", persiste el comentario en `comentarios` del usuario y lo elimina de la bandeja.
2. **Given** un usuario con rol Ex-Probacionista, **When** intenta autenticarse en la app web, **Then** el sistema rechaza el acceso con el mismo mensaje informativo que Probacionista.
3. **Given** un Escolástico gestionando roles, **When** intenta asignar cualquier otro rol a un usuario Ex-Probacionista, **Then** el sistema rechaza la operación (rol exclusivo, incompatible con otros).
4. **Given** un Probacionista que se convierte en Ex-Probacionista, **When** se consulta su historial, **Then** el sistema preserva todos sus registros previos de asistencias y notas de materias de probacionismo.
5. **Given** el flujo de no-promoción con el campo `comentarios` vacío, **When** el Escolástico omite el comentario, **Then** el sistema acepta la operación normalmente (campo opcional).

---

### User Story 3 - Campo Comentarios en Usuario (Priority: P2)

Como **escolástico**, quiero tener un campo de texto libre `comentarios` en el perfil de cualquier usuario, para registrar notas internas relevantes sobre ese usuario (ej. motivo de no-promoción, situaciones especiales, observaciones de seguimiento).

**Why this priority**: Proporciona un canal de información interna sin herramientas externas. Su uso más frecuente será registrar el motivo de rechazo de un Probacionista al convertirlo en Ex-Probacionista.

**Independent Test**: Desde el panel de gestión de usuarios, abrir el perfil de un usuario, ingresar texto en `comentarios`, guardar y verificar que persiste. Confirmar que el propio usuario no ve ni puede editar este campo.

**Acceptance Scenarios**:

1. **Given** el perfil de cualquier usuario en el panel administrativo, **When** el Escolástico ingresa texto en `comentarios` y guarda, **Then** el sistema persiste el texto y lo muestra en el perfil.
2. **Given** un usuario autenticado con cualquier rol, **When** accede a su propio perfil, **Then** el campo `comentarios` no es visible ni editable en su vista.
3. **Given** el campo `comentarios` vacío en un perfil, **When** el Escolástico guarda sin completarlo, **Then** el sistema acepta sin error (campo opcional, permite null).

---

### Edge Cases

- **Miembro con múltiples roles**: Si un Miembro adquiere el rol Instructor o Escolástico, gana acceso a la app automáticamente. Retirarle esos roles secundarios vuelve a bloquear su acceso.
- **Ex-Probacionista vs ExMiembro**: Son roles distintos. Ex-Probacionista aplica a quien nunca fue promovido; ExMiembro aplica a quien fue Miembro y fue dado de baja.
- **Historial del Ex-Probacionista**: Los registros de asistencias y notas de materias de probacionismo se conservan para auditoría.
- **Comentarios sensibles**: Los comentarios son visibles para todos los Escolásticos; no existe control de acceso por autor del comentario.
- **Post-MVP**: Si en el futuro se habilita acceso a Miembros, la restricción MVP debe ser configurable sin cambios de modelo de datos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En el MVP, el sistema MUST bloquear el acceso a la app web a usuarios cuyo conjunto de roles activos no incluya "Instructor" ni "Escolástico".
- **FR-002**: El mensaje de bloqueo para Miembros MUST ser informativo y diferente al error por credenciales incorrectas.
- **FR-003**: El sistema MUST incorporar el rol "Ex-Probacionista" como rol canónico, con las mismas restricciones de exclusividad que "Probacionista" (incompatible con cualquier otro rol).
- **FR-004**: El rol "Ex-Probacionista" MUST ser asignable únicamente desde la Bandeja de Aprobación como acción explícita del Escolástico sobre un usuario con rol "Probacionista".
- **FR-005**: Al asignar "Ex-Probacionista", el sistema MUST permitir registrar opcionalmente texto en el campo `comentarios` del usuario en la misma operación.
- **FR-006**: El sistema MUST agregar el campo `comentarios` (texto libre, opcional, nullable) a la entidad Usuario.
- **FR-007**: El campo `comentarios` MUST ser editable únicamente por Escolástico y MUST ser invisible en la vista de perfil del propio usuario.
- **FR-008**: Las reglas de acceso MVP MUST ser consistentes: Probacionista, Ex-Probacionista y Miembro puro → sin acceso; Instructor y Escolástico → con acceso.
- **FR-009**: El sistema MUST preservar todos los registros históricos (asistencias, notas, inscripciones) al convertir un usuario a Ex-Probacionista.

### Key Entities *(include if feature involves data)*

- **Usuario**: Se añade campo `comentarios` (Texto libre, opcional, null por defecto). Solo editable por Escolástico. Actualiza tabla `usuarios` de spec 003.
- **Rol "Ex-Probacionista"**: Nuevo rol canónico. Estado terminal para Probacionistas no promovidos. Sin acceso a la app. Exclusivo (incompatible con otros roles). Amplía el catálogo de roles de spec 003.
- **Política de acceso MVP**: Restricción de autenticación que bloquea login a usuarios sin rol Instructor o Escolástico activo. Aplica también a ExMiembro y Miembro puro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los intentos de login de usuarios con roles Miembro, Probacionista o Ex-Probacionista (sin Instructor/Escolástico) son bloqueados en el MVP.
- **SC-002**: El 100% de los flujos de no-promoción desde la Bandeja de Aprobación resultan en el rol "Ex-Probacionista" con el historial del usuario intacto.
- **SC-003**: El campo `comentarios` está disponible en el 100% de los perfiles desde el panel Escolástico y no es visible en ninguna vista de usuario final.
- **SC-004**: Un Escolástico puede completar el flujo de no-promoción (asignar Ex-Probacionista + comentario opcional) en menos de 30 segundos desde la Bandeja de Aprobación.
- **SC-005**: El rol Ex-Probacionista no puede coexistir con ningún otro rol en el 100% de los casos de asignación.

## Assumptions

- **A-001**: "Sin acceso a la app web" en MVP no impide que el Miembro sea inscripto, evaluado y tenga historial; solo imposibilita su autenticación directa.
- **A-002**: El campo `comentarios` no tiene historial de versiones en el MVP; se guarda solo el valor actual (último texto ingresado por el Escolástico).
- **A-003**: El rol "Ex-Probacionista" no requiere flujo de reactivación en el MVP; si se desea reingresar al usuario, se crea un nuevo registro.

## Dependencies

- **Spec 003** (Usuarios / Roles): Esta spec enmienda spec 003. Los cambios deben incorporarse como clarificaciones y requisitos en spec 003.
- **Spec 017** (Ficha de Probacionista): La asignación del rol Ex-Probacionista ocurre desde la Bandeja de Aprobación definida en spec 017.
- **Spec 019** (Privilegios de Roles): La matriz de acceso debe incluir la columna "Ex-Probacionista" y actualizar la restricción MVP para Miembro.
