# Feature Specification: Importación CSV y Exportación Excel de Usuarios

**Feature Branch**: `027-csv-import-export-users`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Quiero incluir una funcionalidad que me permita cargar masivamente usuarios con solo un rol de los existentes desde un archivo CSV y tambien me permita descargar en un excel los usuarios con todos sus datos, enfocando esta funcionalidad para la vista escolastica (solo para ese rol)"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importación masiva de usuarios desde CSV (Priority: P1)

El Escolástico necesita incorporar un gran número de nuevos usuarios al sistema de manera eficiente, sin tener que registrarlos uno por uno. Para ello, carga un archivo CSV con los datos personales y el rol que tendrán esos usuarios.

**Why this priority**: El registro individual es la principal fricción operativa al inicio de cada ciclo lectivo. La importación masiva permite incorporar decenas o cientos de usuarios en segundos.

**Independent Test**: Se puede probar cargando un CSV de prueba con 10 usuarios y verificando que aparecen correctamente en la lista de usuarios del sistema, con el rol asignado y sin duplicados.

**Acceptance Scenarios**:

1. **Given** el Escolástico está en la sección de usuarios, **When** sube un CSV válido con datos de 20 personas y selecciona el rol "Instructor", **Then** el sistema crea los 20 usuarios con ese rol y muestra un resumen indicando cuántos fueron creados exitosamente.

2. **Given** el CSV contiene filas con datos incompletos o inválidos (email malformado, nombre vacío), **When** se procesa el archivo, **Then** el sistema omite esas filas, crea las válidas, y reporta exactamente qué filas fallaron y por qué.

3. **Given** el CSV contiene emails que ya existen en el sistema, **When** se procesa el archivo, **Then** el sistema omite esos registros sin errores fatales e informa al Escolástico cuáles fueron duplicados.

4. **Given** el CSV tiene un formato incorrecto (columnas faltantes o delimitador distinto), **When** el Escolástico lo sube, **Then** el sistema rechaza el archivo antes de procesar cualquier fila y muestra un mensaje claro indicando el problema de formato.

5. **Given** el Escolástico no sabe qué columnas debe tener el CSV, **When** accede a la pantalla de importación, **Then** puede descargar una plantilla CSV de ejemplo con las columnas requeridas y datos de muestra.

---

### User Story 2 - Exportación de usuarios a Excel (Priority: P2)

El Escolástico necesita un listado completo de todos los usuarios del sistema con sus datos para análisis, auditoría o reportes externos. Descarga un archivo Excel con toda la información disponible.

**Why this priority**: La exportación complementa la importación y cubre la necesidad de auditoría y reportes sin depender de acceso directo a la base de datos.

**Independent Test**: Se puede probar verificando que el archivo descargado contiene tantas filas como usuarios visibles en la lista y que los campos de cada usuario coinciden con los datos almacenados.

**Acceptance Scenarios**:

1. **Given** el Escolástico accede a la sección de usuarios, **When** hace clic en "Exportar a Excel", **Then** se descarga un archivo `.xlsx` con todos los usuarios visibles, incluyendo todos sus campos y roles.

2. **Given** el sistema tiene 0 usuarios, **When** el Escolástico exporta, **Then** se descarga un Excel con solo la fila de encabezados, sin filas de datos.

3. **Given** hay filtros activos en la vista de usuarios (por rol, estado, etc.), **When** el Escolástico exporta, **Then** la exportación incluye únicamente los usuarios que coinciden con los filtros aplicados.

---

### Edge Cases

- ¿Qué pasa si el CSV tiene más de 1000 filas? El sistema procesa el lote completo.
- ¿Qué pasa si el CSV está vacío (solo encabezados)? El sistema informa que no hay datos para importar.
- ¿Qué pasa si el archivo no es un CSV (PDF, imagen)? El sistema rechaza el archivo antes de intentar procesarlo.
- ¿Puede un usuario importado tener más de un rol? No — la importación asigna exactamente un rol por lote.
- ¿Qué pasa si el CSV tiene el email de un usuario existente? Se omite esa fila y se reporta como duplicado, sin modificar el usuario existente.

## Requirements *(mandatory)*

### Functional Requirements

**Importación CSV:**

- **FR-001**: El sistema DEBE permitir al Escolástico subir un archivo CSV para importar usuarios en masa.
- **FR-002**: El Escolástico DEBE poder seleccionar exactamente un rol existente del sistema para asignar a todos los usuarios del lote importado.
- **FR-003**: El sistema DEBE validar el formato del CSV antes de procesar los datos (columnas requeridas presentes, tipo de archivo correcto).
- **FR-004**: El sistema DEBE procesar cada fila individualmente, creando el usuario si los datos son válidos y el email no existe previamente.
- **FR-005**: El sistema DEBE mostrar un resumen de importación indicando: cantidad creados, cantidad omitidos por duplicado de email, cantidad rechazados con error, y detalle de cada fila fallida con su motivo.
- **FR-006**: El sistema DEBE ofrecer una plantilla CSV descargable con las columnas requeridas y datos de ejemplo.
- **FR-007**: Las columnas requeridas mínimas en el CSV son: `nombre_completo` y `email`. Las columnas opcionales son: `telefono`, `ci`, `fecha_nacimiento`, `genero`.
- **FR-008**: Los usuarios importados NO reciben credenciales automáticamente — deben solicitarlas por el flujo de activación existente.
- **FR-009**: Los usuarios importados quedan en estado "Activo" por defecto.

**Exportación Excel:**

- **FR-010**: El sistema DEBE permitir al Escolástico descargar un archivo Excel (`.xlsx`) con los usuarios visibles según los filtros activos en ese momento.
- **FR-011**: El archivo Excel DEBE incluir todos los campos del usuario: nombre completo, email, CI, teléfono, género, fecha de nacimiento, estado, fecha de inscripción, fecha de recibimiento, y roles asignados.
- **FR-012**: El nombre del archivo descargado DEBE incluir la fecha de exportación (ej. `usuarios-2026-04-28.xlsx`).

**Acceso y seguridad:**

- **FR-013**: Ambas funcionalidades DEBEN estar disponibles exclusivamente para el rol Escolástico.
- **FR-014**: Cualquier intento de acceso desde otro rol DEBE ser rechazado sin procesar datos.

### Key Entities *(include if feature involves data)*

- **ResultadoImportacion** (temporal, no persiste): Resultado de procesar el CSV. Incluye: total de filas, creados, duplicados, errores, y lista de filas fallidas con número de fila, email, nombre y motivo del error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El Escolástico puede importar 100 usuarios válidos desde un CSV en menos de 30 segundos.
- **SC-002**: El 100% de los usuarios con datos válidos en el CSV son creados correctamente en el sistema con el rol seleccionado.
- **SC-003**: Las filas inválidas en el CSV no interrumpen el procesamiento de las filas válidas — la tasa de procesamiento de filas válidas es del 100%.
- **SC-004**: El archivo Excel exportado contiene exactamente los mismos usuarios que la vista filtrada del sistema al momento de la exportación.
- **SC-005**: Un Escolástico puede completar una importación exitosa usando solo la plantilla descargable, sin documentación adicional.
- **SC-006**: La exportación de hasta 1000 usuarios genera el archivo en menos de 10 segundos.

## Assumptions

- Los roles disponibles para asignar en la importación son los mismos que ya existen en el sistema.
- El formato de fecha en el CSV sigue ISO 8601 (YYYY-MM-DD).
- El delimitador del CSV es coma (`,`).
- No se considera importación de usuarios con múltiples roles en esta versión.
- La exportación no incluye contraseñas ni tokens de sesión.
