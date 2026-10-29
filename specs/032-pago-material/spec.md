# Feature Specification: Registro de Pago por Material Entregado

**Feature Branch**: `032-pago-material`  
**Created**: 2026-10-28  
**Status**: Draft  
**Input**: User description: "Crear una funcionalidad similar al pase de lista pero que en vez de registrar asistencia, te permita registrar un valor entero con un decimal asociado a cada inscrito para registrar el pago por material recibido. Dejar la fecha, comentarios y el combo para elegir los temas entregados."

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

### Session 2026-10-28

- Q: ¿Desde dónde se accede a la gestión de material? → A: Desde una opción nueva **"Materiales"** en el menú lateral, con su propia lista de clases (independiente de Listas).
- Q: ¿Cómo se estructuran las entregas y los pagos? → A: **Una sola cabecera de material por clase**. Debajo, una **lista fija de inscritos** donde cada alumno puede tener **varios pagos** (ej. VH pagó 10 Bs al recibir el material y 10 Bs adicionales la semana siguiente por el mismo material). Cada pago lleva su fecha, monto, temas/material al que corresponde y comentario. Por alumno se muestra el **total pagado** y el **detalle de pagos**. No existen entregas separadas con su propia cabecera.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar pagos de material desde la lista fija de inscritos (Priority: P1)

Como **instructor o Escolástico**, quiero abrir el control de material de una clase y, sobre la lista fija de alumnos inscritos, agregar rápidamente un pago a cualquier alumno indicando monto, fecha, temas del material y un comentario opcional, para llevar el cobro de material sin planillas aparte, aunque el alumno pague en varias cuotas.

**Why this priority**: Es el núcleo de la funcionalidad: registrar pagos (incluidos pagos parciales sucesivos) sobre la lista de la clase.

**Independent Test**: En una clase activa con alumnos inscritos, entrar a Materiales → clase, registrar a VH un pago de 10 con temas 1–2, y otro pago de 10 una semana después con los mismos temas. La fila de VH debe mostrar total 20 y el detalle con los dos pagos (fecha, monto, temas, comentario).

**Acceptance Scenarios**:

1. **Given** un instructor que entra a **Materiales** en el menú lateral y selecciona una clase, **When** se abre el control de material de la clase, **Then** el sistema muestra la lista fija de inscritos (como el pase de lista), cada uno con su total pagado (o "sin pagos") y una acción para agregar un pago, más el total recaudado de la clase y la cantidad de alumnos con al menos un pago.
2. **Given** la lista de inscritos, **When** el usuario agrega un pago a un alumno, **Then** el sistema pide fecha (por defecto hoy), monto, temas del material (selección múltiple de los temas de la materia; precargados con los temas del último pago de ese alumno, si tiene) y comentario opcional, y al guardar el pago aparece en el detalle del alumno y su total se actualiza.
3. **Given** VH tiene un pago de 10, **When** se le registra otro pago de 10 por el mismo material, **Then** su total pagado pasa a 20 y su detalle muestra ambos pagos por separado con su fecha.
4. **Given** el usuario escribe un monto con más de un decimal (ej. `15.55`), un valor negativo o texto, **When** intenta guardar, **Then** el sistema rechaza el valor con un mensaje claro y no guarda el pago.
5. **Given** una clase sin ningún pago registrado todavía, **When** se registra el primer pago, **Then** el sistema crea automáticamente la cabecera de material de la clase (no hace falta un paso previo).

---

### User Story 2 - Corregir o eliminar un pago (Priority: P2)

Como **instructor o Escolástico**, quiero corregir el monto, la fecha, los temas o el comentario de un pago ya registrado, o eliminarlo si fue un error, para que el total de cada alumno refleje la realidad.

**Why this priority**: Los errores de carga son comunes desde el celular; sin corrección, los totales quedan mal.

**Independent Test**: Editar un pago de VH de 10 a 12 y eliminar otro; verificar que el total de VH y el de la clase se recalculan y que ambas acciones quedan en auditoría.

**Acceptance Scenarios**:

1. **Given** un pago registrado, **When** el usuario lo abre desde el detalle del alumno, **Then** puede modificar fecha, monto, temas y comentario y guardar.
2. **Given** un pago registrado, **When** el usuario lo elimina y confirma, **Then** desaparece del detalle y los totales se recalculan.
3. **Given** cualquier alta, edición o eliminación de pago, **When** se completa, **Then** queda registrada en auditoría con el usuario, el valor anterior y el nuevo.

---

### Edge Cases

- **Alumno inscrito después de otros pagos**: Aparece en la lista fija con "sin pagos" y se le pueden registrar pagos normalmente.
- **Alumno dado de baja con pagos**: Sigue apareciendo en la lista, identificado como "Baja", con su total y detalle, para no perder el historial. Sus pagos existentes se pueden corregir o eliminar, pero no se le pueden agregar pagos nuevos.
- **Pago de 0**: Se permite (ej. registrar que recibió el material sin pagar todavía); cuenta como pago registrado en el detalle pero no suma al total.
- **Materia sin temas en el pensum**: El selector de temas aparece vacío y el pago se guarda sin temas.
- **Clase finalizada**: Se pueden registrar y corregir pagos igual que en una clase activa (mismo criterio que el pase de lista, spec 005 FR-017).
- **Varios pagos el mismo día para el mismo alumno**: Se permiten.
- **Edición simultánea**: Si dos usuarios editan el mismo pago, prevalece el último guardado y ambas acciones quedan en auditoría.
- **Sin conexión**: Requiere conexión; si falla el guardado, el usuario recibe un aviso de error y no se pierde lo que escribió en el formulario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada clase MUST tener como máximo **una** cabecera de material, que agrupa todos los pagos de material de la clase y admite un comentario general opcional. La cabecera se crea automáticamente al registrar el primer pago.
- **FR-002**: El control de material de una clase MUST mostrar la **lista fija de inscritos** (inscritos activos más los de baja que tengan pagos), con la misma presentación y orden que el pase de lista.
- **FR-003**: Por cada alumno, el sistema MUST mostrar su **total pagado** (suma de sus pagos) y su **detalle de pagos** (fecha, monto, temas, comentario), del más reciente al más antiguo.
- **FR-004**: El sistema MUST permitir **agregar un pago** a cualquier inscrito activo desde la lista, con: fecha (por defecto hoy, editable), monto (obligatorio), temas del material (selección múltiple de los temas de la materia, opcional, precargada con los temas del último pago de ese alumno) y comentario (opcional). Un alumno puede tener cualquier cantidad de pagos.
- **FR-005**: El monto MUST aceptar únicamente números mayores o iguales a 0 con, como máximo, un decimal (ej. `10`, `10.5`, `0`). El sistema MUST rechazar negativos, más de un decimal y valores no numéricos, tanto en la pantalla como al guardar.
- **FR-006**: El sistema MUST permitir **editar** (fecha, monto, temas, comentario) y **eliminar** (con confirmación) cualquier pago registrado.
- **FR-007**: La pantalla MUST mostrar en todo momento el **total recaudado de la clase** y la cantidad de alumnos con al menos un pago sobre el total de inscritos activos (ej. "12/18 con pagos · Total 186.5").
- **FR-008**: Los roles **Instructor** (en sus propias clases) y **Escolástico** (en cualquier clase) MUST poder ver, registrar, editar y eliminar pagos; los demás roles no tienen acceso.
- **FR-009**: El control de material MUST estar disponible para clases en estado `Activa` y `Finalizada`, con el mismo alcance que el pase de lista.
- **FR-010**: El sistema MUST registrar en auditoría el alta, la edición y la eliminación de cada pago, y los cambios del comentario de la cabecera, con el usuario que realizó la acción.
- **FR-011**: El registro de un pago MUST poder completarse desde el celular en pocos toques (teclado numérico para el monto, fecha y temas precargados, guardar sin salir de la lista), y ser usable también en escritorio.
- **FR-012**: El menú lateral MUST incluir una opción **"Materiales"**, visible para los roles Instructor y Escolástico, que muestre la lista de clases (el Instructor ve solo las propias; el Escolástico, todas) con los mismos filtros que la vista Listas: instructor (solo Escolástico), día de la semana y chip "Finalizadas". Al seleccionar una clase, el sistema MUST abrir el control de material de esa clase.
- **FR-013**: El registro de material MUST ser independiente de las sesiones de asistencia: registrar o editar pagos no crea, modifica ni requiere una sesión.

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **Material de la clase** *(nueva — incluir en el diccionario de datos, spec 002/003)*: cabecera única por Clase; comentario general opcional, quién la creó y cuándo.
- **Pago de material** *(nueva)*: pertenece a la cabecera de material de la clase y a una Inscripción; tiene fecha, monto (número ≥ 0 con un decimal como máximo), comentario opcional y quién lo registró. Un inscrito puede tener muchos pagos.
- **Tema del pago** *(nueva, relación)*: vincula un Pago de material con uno o varios Temas de la materia (el material al que corresponde el pago).
- **Inscripción** *(existente)*: define la lista fija de alumnos.
- **Tema** *(existente)*: pensum de la materia; fuente del selector de temas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar un pago a un alumno desde el celular toma menos de 20 segundos (abrir, escribir monto, guardar).
- **SC-002**: El 100% de los montos guardados se muestran exactamente con el valor ingresado (sin redondeos ni pérdida del decimal).
- **SC-003**: El 100% de los montos inválidos (negativos, más de un decimal, texto) se rechazan antes de guardarse.
- **SC-004**: El total pagado de cada alumno coincide al 100% con la suma de su detalle de pagos, y el total de la clase con la suma de los totales de los alumnos.
- **SC-005**: El 100% de las altas, ediciones y eliminaciones de pagos tienen un registro de auditoría con el usuario responsable.
- **SC-006**: La Secretaría de Escolástica deja de necesitar planillas externas para el control de cobro de material en las clases que usen la funcionalidad.

## Assumptions

- El monto se expresa en la moneda local de la institución (Bs); el sistema no maneja múltiples monedas.
- No se define un precio fijo del material ni se calcula deuda o saldo: el sistema registra lo que cada alumno pagó, no lo que debía pagar.
- Los alumnos (Miembro/Probacionista) no ven sus pagos de material en el Kardex en esta versión; la información es solo para Instructor y Escolástico.
- No se emiten comprobantes ni recibos.
- El selector de temas reutiliza el mismo comportamiento que "Temas cursados" del pase de lista (selección múltiple de los temas de la materia).
- Reportes consolidados (por alumno, por período o exportación a Excel) quedan fuera del alcance de esta versión.

## Dependencies & Constraints

- **Constitución — modelo de datos y alcance MVP**: la funcionalidad agrega entidades nuevas (Material de la clase, Pago de material, Tema del pago) y no figura en el alcance MVP original. Requiere aprobación explícita y su incorporación al diccionario de datos antes de implementarse. Es una extensión modular: **no modifica ni borra tablas ni datos existentes**, solo los referencia.
- Depende de: spec 004 (clases e inscripciones), spec 005 (pase de lista, como patrón de interfaz), spec 008/009 (temas por materia), spec 012 (auditoría), spec 024 (permisos del Escolástico).
