# Research: Registro de Pago por Material Entregado (032)

## 1. Tablas propias vs. reutilizar sesiones/asistencias

- **Decision**: Tres tablas nuevas: `material_clase` (cabecera única por clase), `pagos_material` (cada pago de un alumno) y `pago_material_temas` (N:M pago–temas).
- **Rationale**: La spec exige independencia de las sesiones (FR-013). Reutilizar `sesiones`/`asistencias` haría que los pagos contaran como sesiones, en la alerta de clases inactivas (spec 031) y en los porcentajes del Kardex.
- **Alternatives considered**: (a) `sesiones` con `tipo = 'Material'` + monto en `asistencias` → modifica tablas base y contamina métricas. (b) JSON en una tabla → no se puede sumar ni validar en BD.

## 2. Estructura: una cabecera por clase con pagos múltiples por alumno

- **Decision**: Una sola cabecera por clase (`material_clase.clase_id` UNIQUE). Debajo, cada pago es un registro independiente con su fecha, monto, temas y comentario; un alumno puede tener N pagos.
- **Rationale**: Decisión del usuario (clarificación 2026-10-28): el caso típico es pagar el mismo material en cuotas ("10 Bs al recibirlo, 10 Bs adicionales la semana siguiente"). El total por alumno y el detalle salen directamente de sus pagos. La fecha, los temas y el comentario viven en cada pago porque cambian entre cuotas.
- **Alternatives considered**: Varias entregas por clase, cada una con cabecera propia y abonos por alumno → descartado por el usuario: agrega un nivel de navegación (elegir entrega) que no aporta al caso de uso.

## 3. Creación de la cabecera

- **Decision**: Se crea automáticamente (upsert) en la misma transacción que el primer pago de la clase. El comentario general se edita con `PATCH /clases/:id/material`.
- **Rationale**: Evita un paso previo ("crear control de material") y cabeceras vacías por solo abrir la pantalla.
- **Alternatives considered**: Botón explícito "Iniciar control de material" → un toque más sin beneficio; crear al abrir la pantalla → registros basura.

## 4. Tipo de dato del monto

- **Decision**: `DECIMAL(8,1)` (`Decimal @db.Decimal(8, 1)` en Prisma). Rango 0 – 9 999 999.9. La API serializa a `number`.
- **Rationale**: Garantiza en BD "un decimal como máximo" y totales exactos (SC-002, SC-004).
- **Alternatives considered**: `Int` en décimas → conversiones en todas las capas. `Float` → errores de redondeo en totales.

## 5. Pago de 0

- **Decision**: Se permite `monto = 0`.
- **Rationale**: Permite registrar que el alumno recibió el material (con sus temas) aunque todavía no pagó. "Sin pagos" = el alumno no tiene registros.
- **Alternatives considered**: Exigir `> 0` → no habría forma de dejar constancia de la entrega sin pago.

## 6. Operaciones por pago individual

- **Decision**: `POST` / `PATCH` / `DELETE` por pago, y un `GET` que devuelve la lista fija con totales y detalle.
- **Rationale**: El flujo es "agregar un pago a un alumno" desde la lista, no editar toda la planilla. Cada operación es chica, rápida desde el celular y se audita por separado.
- **Alternatives considered**: Guardado masivo de toda la lista (como `asistencias/bulk`) → no encaja con pagos múltiples por alumno.

## 7. Precarga de temas

- **Decision**: El formulario de nuevo pago precarga los temas del pago más reciente del mismo alumno (`temas_sugeridos` en el GET).
- **Rationale**: El segundo pago suele ser "por el mismo material"; precargar evita volver a elegir los temas (FR-011, SC-001).
- **Alternatives considered**: Precargar los temas del último pago de la clase → menos preciso cuando alumnos pagan materiales distintos.

## 8. Backend: dónde se implementa

- **Decision**: Route handlers de Next.js en `apps/web/src/app/api/clases/[id]/material/` + módulo espejo `apps/api/src/materiales` en NestJS.
- **Rationale**: Convención vigente (specs 030/031 implementaron ambas capas). `vercel.json` solo construye `apps/web`.
- **Alternatives considered**: Solo NestJS → no llegaría a producción. Solo Next.js → rompe la paridad del repo.

## 9. Control de acceso y estado de la clase

- **Decision**: `requireRole('Instructor', 'Escolastico')`; si el actor no es Escolástico, la clase debe tener `instructor_id = actor.sub` (403). Solo clases `Activa` o `Finalizada` (409 para `Inactiva`). Helper `assertAccesoMaterial()` en `apps/web/src/lib/material-clase.ts`.
- **Rationale**: FR-008 y FR-009. Hay dinero de por medio: se valida en el backend (constitución: "validaciones obligatorias en backend").
- **Alternatives considered**: Filtrar solo en la UI → un instructor podría modificar pagos de otra clase llamando a la API.

## 10. Reutilización de UI

- **Decision**: (a) Extraer la lista de clases de `/admin/asistencia` a `components/clases/ClasesVigentesList.tsx` con prop `hrefFor(clase)`; Listas y Materiales la usan. (b) Un único `PagoMaterialDialog` (bottom sheet en móvil) para alta y edición. (c) Selector de temas con el mismo `Select` múltiple de "Temas cursados", alimentado por `GET /materias/:id/temas`.
- **Rationale**: FR-012 pide los mismos filtros que Listas; registrar un pago sin salir de la lista (FR-011).
- **Alternatives considered**: Copiar la página de Listas → duplicación. Pantalla aparte por pago → más navegación desde el celular.
