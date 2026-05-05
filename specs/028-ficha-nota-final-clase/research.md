# Research: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-04

## Hallazgos del Código Existente

### Estado actual del backend

| Ruta API                                        | Método | Estado       | Relevancia                                   |
|-------------------------------------------------|--------|--------------|----------------------------------------------|
| `PATCH /api/clases/[id]/status`                 | PATCH  | Implementado | Cambia `estado` de la clase. Requiere rol `Escolastico`. Registra auditoría. |
| `PATCH /api/inscripciones/[id]/conclusion`      | PATCH  | Implementado | Actualiza `concluyo_temario_materia` y `fecha_conclusion_temario`. No tiene `nota_final`. |
| `GET /api/clases/[id]/inscripciones`            | GET    | Implementado | Devuelve lista de inscripciones de la clase. |

### Estado actual del frontend

La página `/admin/clases/[id]/page.tsx` ya tiene:
- Columna `concluyo_temario_materia` como Checkbox en el DataGrid con llamada a `toggleConclusion()`
- Chip de estado de la clase con colores para `Activa`, `Finalizada`, `Inactiva`
- Llamada al endpoint `/conclusion` via `api.patch`
- **Falta**: columna `nota_final`, botón "Finalizar clase" y su confirmación

### Estado actual del schema

- `inscripciones` tiene `concluyo_temario_materia` (Boolean) y `fecha_conclusion_temario` (Date?) — ya en DB
- `inscripciones` **NO tiene** `nota_final` — requiere migración
- `EstadoNota` enum ya existe: `Sobresaliente | Solido | Aprobado | Reprobado`
- `EstadoClase` enum ya tiene `Finalizada` — no requiere migración de enum

## Decisiones de Diseño

### Decisión 1: Ubicación de `nota_final`

- **Decisión**: Agregar campo `nota_final` (nullable, `EstadoNota`) directamente en `inscripciones`
- **Rationale**: La nota final es un atributo de la inscripción (relación alumno-clase), no una evaluación parcial con tipo propio. El modelo `notas` es para evaluaciones tipificadas (examen, práctica). Almacenar en `inscripciones` es consistente con `concluyo_temario_materia` que es otro atributo de cierre de la inscripción.
- **Alternativas descartadas**: Agregar un registro en `notas` con `tipo_evaluacion = 'Final'` — descartado porque requeriría lógica de unicidad y consultas adicionales para un dato que conceptualmente pertenece a la inscripción.

### Decisión 2: Endpoint para `nota_final`

- **Decisión**: Extender el endpoint existente `PATCH /api/inscripciones/[id]/conclusion` para aceptar también `nota_final`
- **Rationale**: La nota final y la conclusión de temario son ambos atributos de cierre de la inscripción, tienen la misma audiencia de actores (Escolástico e Instructor titular), y compartir el mismo endpoint simplifica el cliente.
- **Alternativas descartadas**: Crear un endpoint nuevo `/nota-final` — innecesario, fragmenta la lógica de cierre.

### Decisión 3: Acción "Finalizar clase" en UI

- **Decisión**: Agregar botón "Finalizar clase" en la vista `/admin/clases/[id]` con diálogo de confirmación. El botón llama al endpoint `PATCH /api/clases/[id]/status` con `{ estado: 'Finalizada' }`.
- **Rationale**: El endpoint backend ya existe y es correcto. Solo falta el elemento de UI. El diálogo de confirmación es obligatorio por la especificación (FR-007) ya que es una acción irreversible.
- **Alternativas descartadas**: Crear un endpoint dedicado `finalizar` — el endpoint `status` ya es genérico y suficiente.

### Decisión 4: Edición de `nota_final` en UI

- **Decisión**: Agregar columna `nota_final` en el DataGrid con un Select inline (similar al Checkbox de temario existente). Al cambiar el valor se llama inmediatamente al endpoint `conclusion`.
- **Rationale**: Patrón consistente con la columna de conclusión de temario ya implementada. Evita formularios adicionales.
- **Alternativas descartadas**: Modal de edición — overhead innecesario para un solo campo.

## Impacto en Reglas del Sistema

- **Auditoría**: El endpoint `conclusion` debe registrar `nota_final` en `logs_auditoria` junto con el valor anterior. El endpoint `status` ya registra auditoría. ✓
- **Autorización**: `nota_final` editable por `Escolastico` e `Instructor` titular. Finalizar clase solo por `Escolastico`. Consistente con lógica existente en ambos endpoints. ✓
- **Mobile-First**: Los controles de nota final (Select) y el botón de finalizar deben ser usables en móvil. El DataGrid de MUI es responsive. ✓
