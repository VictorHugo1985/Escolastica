# Quickstart: Registro de Pago por Material Entregado (032)

Guía de validación end-to-end. Detalle de campos en [data-model.md](./data-model.md) y de endpoints en [contracts/api-material-clase.md](./contracts/api-material-clase.md).

## Prerrequisitos

0. Revisar `packages/database/migrations/20261028000000_material_clase/migration.sql`: solo debe crear las 3 tablas nuevas, sus índices y sus constraints. Nada sobre tablas existentes.
1. Migración aplicada: `npx prisma migrate deploy --schema packages/database/schema.prisma` (crea `material_clase`, `pagos_material`, `pago_material_temas`).
2. Cliente regenerado: `npx prisma generate --schema packages/database/schema.prisma`.
3. App corriendo: `npm run dev` (web en `http://localhost:3000`).
4. Datos: una clase **Activa** con ≥ 3 inscritos activos y ≥ 2 temas en su materia; una clase **Finalizada**; un usuario Instructor (titular de la clase activa) y un Escolástico.

## Validación de tipos

```bash
cd apps/web && npx tsc --noEmit -p .
cd ../api && npx tsc --noEmit -p .
```
Esperado: sin errores. (El repo no tiene runner de tests; las reglas de `MontoSchema` —acepta `0`, `10`, `10.5`; rechaza `-1`, `10.55`, `"abc"`— se validan en los escenarios 1 y 3.)

## Escenario 1 — Pagos en cuotas (US1)

1. Ingresar como **Instructor** → menú lateral **Materiales**.
   - Se ven solo sus clases activas; filtros de día y chip "Finalizadas" funcionan igual que en Listas.
2. Elegir la clase activa (sin pagos previos).
   - Lista fija de inscritos, todos "sin pagos"; cabecera "0/N con pagos · Total 0".
3. En la fila de VH → **+** → fecha hoy, monto `10`, temas 1–2, guardar.
   - VH: total 10, detalle con 1 pago. Cabecera "1/N con pagos · Total 10". Se creó la cabecera de material de la clase.
4. En VH → **+** de nuevo: los temas 1–2 vienen precargados. Cambiar fecha a +7 días, monto `10`, comentario "saldo", guardar.
   - VH: total **20**, detalle con **2 pagos** (más reciente primero). Total de la clase 20.
5. Intentar monto `10.55` o `-2` → error en el campo, no se guarda.

## Escenario 2 — Corregir y eliminar (US2)

1. Editar el pago "saldo" de VH a `12` → VH total 22, clase 22.
2. Eliminar el primer pago de VH y confirmar → VH total 12.
3. Revisar `logs_auditoria`: filas `INSERT`, `UPDATE` y `DELETE` en `pagos_material` con snapshot y usuario.

## Escenario 3 — Permisos y estados

| Caso | Resultado esperado |
|------|--------------------|
| Instructor llama `GET /api/clases/<clase de otro instructor>/material` | `403` |
| Escolástico entra a Materiales | Ve todas las clases; puede registrar pagos en cualquiera |
| Usuario Miembro | No ve "Materiales" en el menú; la API responde `403` |
| Chip "Finalizadas" → clase finalizada → agregar pago | Se guarda normalmente |
| `POST` de pago en una clase `Inactiva` | `409` |

## Escenario 4 — Casos borde

1. **Baja con pagos**: dar de baja a VH → sigue en la lista con etiqueta "Baja", total y detalle; sus pagos se pueden editar/eliminar pero no aparece el botón **+**.
2. **Inscripción nueva**: inscribir un alumno → aparece con "sin pagos".
3. **Pago 0**: registrar `0` → aparece en el detalle, cuenta en "con pagos", no suma al total.
4. **Materia sin temas**: selector vacío; el pago se guarda sin temas.
5. **Listas sin regresión**: `/admin/asistencia` (ahora con `ClasesVigentesList`) muestra y filtra igual que antes.
