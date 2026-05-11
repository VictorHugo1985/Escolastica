# Research: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-09 (actualizado)

> **Nota**: Este documento reemplaza la versión del 2026-05-04. La spec fue modificada para soportar múltiples notas finales tipificadas por inscripción, en lugar de un campo único `nota_final`.

## Estado actual del código

### Lo ya implementado (en esta rama)

| Componente | Estado | Notas |
|---|---|---|
| Campo `nota_final EstadoNota?` en `inscripciones` | **Implementado — a reemplazar** | Migración `20260504000000` |
| `PATCH /api/inscripciones/:id/conclusion` acepta `nota_final` | **Implementado — a modificar** | Quitar soporte a `nota_final` |
| Select inline de `nota_final` en DataGrid `/admin/clases/:id` | **Implementado — a reemplazar** | Reemplazar con diálogo multi-nota |
| Botón "Finalizar clase" + Dialog de confirmación | **Implementado — sin cambio** | ✓ |
| `PATCH /api/clases/:id/status` | **Implementado — sin cambio** | ✓ |

### Lo pendiente de implementar

- Nueva tabla `notas_finales_inscripcion` con enum `TipoNotaFinal`
- Endpoints `POST` y `DELETE` para `/api/inscripciones/:id/notas-finales`
- Diálogo de gestión de notas finales en la UI
- Inclusión de `notas_finales` en la respuesta de `GET /api/clases/:id`

## Decisiones de Diseño

### Decisión 1: Tabla separada `notas_finales_inscripcion`

- **Decisión**: Crear tabla `notas_finales_inscripcion` con FK a `inscripciones`, enum `TipoNotaFinal`, y `valor EstadoNota`. Eliminar campo `nota_final` de `inscripciones`.
- **Rationale**: El campo único no permite diferenciar entre tipos de evaluación final. La tabla separada refleja la multiplicidad semántica (una inscripción puede tener nota teórica Y práctica). Unicidad en `(inscripcion_id, tipo_nota)` asegura integridad sin lógica adicional.
- **Alternativas descartadas**:
  - Mantener `nota_final` único + agregar notas adicionales en tabla `notas` — contamina `notas` con datos de cierre que no son evaluaciones parciales.
  - Columnas separadas por tipo (`nota_teorica`, `nota_practica`…) — no escalable si se agregan tipos futuros.

### Decisión 2: Enum `TipoNotaFinal` en Prisma/PostgreSQL

- **Decisión**: Definir `TipoNotaFinal` como enum de PostgreSQL con valores: `Nota_Teorica`, `Nota_Practica`, `Examen_Final`, `Trabajo_Escrito`.
- **Rationale**: Enums de PostgreSQL garantizan integridad a nivel de DB. Consistente con el patrón ya establecido en el proyecto (`EstadoNota`, `EstadoClase`, etc.). Los valores usan snake_case con mayúscula inicial para evitar espacios en el nombre del enum.
- **Alternativas descartadas**: String libre con CHECK constraint — no aprovecha el ecosistema Prisma ni el tipado TypeScript generado.

### Decisión 3: Endpoints REST dedicados para notas finales

- **Decisión**: Crear `POST /api/inscripciones/:id/notas-finales` y `DELETE /api/inscripciones/:id/notas-finales/:notaId` como rutas Next.js independientes.
- **Rationale**: Las operaciones de agregar/eliminar notas son acciones discretas con lógica de negocio propia (validar unicidad de tipo, auditar por separado). Separarlas del endpoint `conclusion` mantiene responsabilidad única.
- **Alternativas descartadas**: Extender PATCH `conclusion` — mezclaría operaciones de diferente semántica (actualización de campos escalares vs. gestión de colección).

### Decisión 4: UI — Diálogo por inscripción

- **Decisión**: En la columna del DataGrid, mostrar las notas como chips compactos (`Teórica: Aprobado`) + botón icono que abre un diálogo. El diálogo muestra la lista, permite agregar (Select de tipo + Select de valor + botón Agregar) y eliminar (botón ×) notas.
- **Rationale**: El DataGrid no soporta bien listas dinámicas inline. El diálogo permite operaciones CRUD sin recargar la fila. Es usable en mobile (Dialog fullscreen en xs). La columna sigue siendo informativa con los chips.
- **Alternativas descartadas**: Select inline multi-valor — no soporta tipo+valor por nota. Subfilas expandibles (MUI DataGrid Pro feature) — no disponible en tier gratuito.

### Decisión 5: Inclusión de `notas_finales` en la carga de la clase

- **Decisión**: Extender el include de Prisma en `GET /api/clases/:id` para incluir `notas_finales: true` dentro de cada inscripción.
- **Rationale**: La UI carga toda la clase de una vez (`loadClase()`). Incluir las notas en ese fetch evita N+1 requests adicionales al renderizar la lista de inscripciones.
- **Alternativas descartadas**: Fetch separado por inscripción al abrir el diálogo — introduce latencia perceptible y complejidad de estado.

## Impacto en Reglas del Sistema

- **Auditoría**: POST agrega a `logs_auditoria` con `accion: 'CREATE'`, `tabla_afectada: 'notas_finales_inscripcion'`. DELETE registra con `accion: 'DELETE'`. ✓
- **Autorización**: Mismos permisos que antes — `Escolastico` o instructor titular. ✓
- **Mobile-First**: Dialog usa `fullScreen` en breakpoint `xs`. Chips en DataGrid son compactos. ✓
- **Spec 003**: La nueva entidad `notas_finales_inscripcion` debe añadirse al Diccionario de Datos Maestro. Pendiente de actualización en Spec 003. ⚠️
