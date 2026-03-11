# Feature Specification: Administrative Reports

**Feature Branch**: `009-admin-reports-analysis`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Administrative Reports (Analysis and control tools for the Secretaría de Escolástica, optimized for desktop)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Attendance Dashboard (Priority: P1)

Como **secretaria de Escolástica**, quiero ver un resumen global de la asistencia por materia y periodo en mi pantalla de escritorio, para identificar grupos con baja participación o problemas de deserción temprana.

**Why this priority**: Es fundamental para el control operativo y la toma de decisiones preventivas sobre la vigencia de las materias.

**Independent Test**: Acceder al dashboard administrativo, filtrar por periodo y verificar que los porcentajes de asistencia coincidan con los datos agregados de las materias.

**Acceptance Scenarios**:

1. **Given** un administrador en su panel de escritorio, **When** accede a la sección de Reportes de Asistencia, **Then** el sistema muestra un gráfico o tabla comparativa de todas las materias del periodo actual.
2. **Given** un reporte de asistencia, **When** el usuario hace clic en una materia, **Then** el sistema desglosa la asistencia por alumno y fecha.

---

### User Story 2 - Academic Performance Analysis (Priority: P1)

Como **personal administrativo**, quiero visualizar la distribución de notas finales por materia y periodo, para asegurar la calidad académica y detectar irregularidades en las evaluaciones.

**Why this priority**: Permite supervisar la labor de los instructores y el rendimiento general de los miembros.

**Independent Test**: Generar un reporte de notas por materia y verificar que se calculen correctamente los promedios y porcentajes de aprobación.

**Acceptance Scenarios**:

1. **Given** el panel de análisis académico, **When** se filtra por materia, **Then** el sistema muestra el promedio general, la nota máxima, la mínima y la tasa de aprobación/reprobación.

---

### User Story 3 - Enrollment and Withdrawal Audit (Priority: P1)

Como **auditor de Escolástica**, quiero ver un reporte detallado de todas las altas y bajas ocurridas en un rango de fechas, incluyendo los motivos de baja seleccionados, para entender las causas de rotación de alumnos.

**Why this priority**: La Constitución enfatiza el control de movimientos y el historial de bajas. Este reporte es la herramienta para ese control.

**Independent Test**: Filtrar movimientos por "Baja" en el último mes y verificar que se listen correctamente con sus motivos.

**Acceptance Scenarios**:

1. **Given** el reporte de movimientos, **When** se filtra por tipo "Baja", **Then** el sistema muestra una lista cronológica con Nombre, Materia, Fecha, Motivo y Usuario que registró el movimiento.

---

### User Story 4 - Data Export for External Use (Priority: P2)

Como **administrador**, quiero exportar los reportes de asistencia, notas y movimientos a formatos Excel (CSV) y PDF, para realizar análisis externos o generar documentos formales de impresión.

**Why this priority**: Facilita la interoperabilidad con otras herramientas y la generación de archivos físicos o digitales estáticos.

**Independent Test**: Generar un reporte y hacer clic en los botones de exportación, verificando que el archivo descargado contenga la información exacta visualizada en pantalla.

**Acceptance Scenarios**:

1. **Given** un reporte filtrado en pantalla, **When** el usuario selecciona "Exportar a Excel", **Then** el sistema descarga un archivo .csv compatible con hojas de cálculo.
2. **Given** un reporte filtrado en pantalla, **When** el usuario selecciona "Exportar a PDF", **Then** el sistema genera y descarga un documento con formato de impresión profesional.

---

### Edge Cases

- **Exportación de Grandes Volúmenes**: El sistema debe manejar la exportación de miles de registros sin bloquear la interfaz de usuario.
- **Permisos de Visualización**: Solo usuarios con rol de `Administrador` deben tener acceso a esta sección y a las funciones de descarga.
- **Datos Históricos**: El sistema debe manejar grandes volúmenes de datos de periodos pasados sin degradar el rendimiento de la vista de escritorio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer un dashboard administrativo optimizado para resolución de escritorio (1920x1080 o superior).
- **FR-002**: El sistema MUST permitir filtrar todos los reportes por `Periodo Académico`.
- **FR-003**: El sistema MUST mostrar estadísticas agregadas de asistencia (Promedio por materia, por alumno).
- **FR-004**: El sistema MUST mostrar estadísticas de rendimiento académico (Notas promedio, tasa de aprobación).
- **FR-005**: El sistema MUST incluir un log de auditoría visual de todos los movimientos de alumnos (Altas/Bajas).
- **FR-006**: El sistema MUST permitir la exportación de cualquier reporte generado a formato Excel (CSV).
- **FR-007**: El sistema MUST permitir la generación y descarga de reportes en formato PDF.
- **FR-008**: El sistema MUST incluir filtros por `Instructor` para analizar el rendimiento de sus respectivos grupos.

### Key Entities *(include if feature involves data)*

- **Reporte**: Vista lógica agregada de datos existentes.
- **Log de Movimientos**: Registro histórico de Altas/Bajas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los reportes agregados deben cargarse en menos de 2 segundos, incluso con bases de datos de hasta 10,000 registros de asistencia.
- **SC-002**: El 100% de los datos exportados deben ser idénticos a los visualizados en pantalla tras aplicar filtros.
- **SC-003**: El dashboard debe ser accesible únicamente para usuarios con el rol verificado de `Administrador`.
- **SC-004**: El proceso de generación de un PDF no debe exceder los 5 segundos para reportes de longitud estándar.

### Assumptions

- **A-001**: Se asume que los cálculos de promedios se realizan en tiempo real sobre la base de datos relacional.
- **A-002**: Se asume que el diseño desktop prioriza densidad de información sobre tamaño de fuentes.
