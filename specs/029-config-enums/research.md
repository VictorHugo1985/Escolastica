# Research: Configuración de Enumeraciones de la Aplicación

**Branch**: `029-config-enums` | **Date**: 2026-05-11

---

## Decisión 1: Arquitectura de persistencia — conversión de enum PG a tabla dinámica

**Decision**: Reemplazar los 4 tipos enum de PostgreSQL configurables por dos tablas relacionales: `enum_categorias` y `enum_valores`. Las columnas que los referenciaban pasan de tipo enum a `VARCHAR(50)`. La integridad referencial se reemplaza por validación a nivel de aplicación (API + Zod).

**Rationale**:
- Los tipos `ENUM` de PostgreSQL son estáticos — definidos en el DDL. Agregar un nuevo valor requiere `ALTER TYPE ... ADD VALUE`, lo cual es una migración de DB que no puede ejecutarse desde la app en runtime.
- La única forma de implementar FR-003 ("agregar nuevo valor") y el escenario de aceptación US1-S2 ("agregar 'Taller' → verlo en selector inmediatamente") sin un deploy es usar una tabla de lookup.
- El cambio de columnas a `VARCHAR` supone una pérdida de validación de integridad en DB, compensada por validación explícita en los endpoints de escritura (`Zod` + lookup a `enum_valores` activos).

**Alternatives considered**:
- **Tabla de etiquetas paralela (sin cambiar columnas)**: Las columnas mantienen el tipo enum; se añade una tabla de etiquetas/orden. Rechazada porque no permite agregar nuevos valores sin migración — viola US1.
- **PostgreSQL custom domain + function**: Permite validación custom, pero sigue sin ser alterable en runtime desde la app. Rechazada.
- **JSONB para valores dinámicos**: Excesivo para un volumen de ~50 valores por categoría. Rechazada por complejidad sin beneficio.

---

## Decisión 2: Diseño de la API — CRUD de valores

**Decision**: Endpoints REST bajo `/api/config/enums/` con acceso restringido a `Escolastico`. No se expone endpoint DELETE — los valores solo se desactivan (soft delete). Endpoints:

```
GET  /api/config/enums                              → todas las categorías con conteo de valores activos
GET  /api/config/enums/:categoria                   → detalle de categoría + todos sus valores (activos e inactivos)
POST /api/config/enums/:categoria/valores            → crear nuevo valor
PATCH /api/config/enums/:categoria/valores/:id       → editar etiqueta / activo / orden
```

Adicionalmente, endpoint público (solo autenticación, cualquier rol) para alimentar selectores:

```
GET  /api/config/enums/:categoria/valores?activos=true  → valores activos para usar en formularios
```

**Rationale**: Patrón consistente con el resto de la API del proyecto (Next.js API Routes, `requireAuth`, `auditLog`). No DELETE para preservar integridad histórica: registros existentes que usan un valor desactivado deben seguir siendo legibles.

**Alternatives considered**:
- **GraphQL**: Rechazado — el proyecto usa exclusivamente REST.
- **Endpoint único con todos los valores aplanados**: Menos flexible para UI paginada o por categoría. Rechazado.

---

## Decisión 3: Carga de opciones en selectores existentes

**Decision**: Los formularios/páginas que actualmente tienen los valores de enum hardcodeados pasarán a llamar `GET /api/config/enums/:categoria/valores?activos=true` en su `useEffect` de montaje. El resultado se almacena en estado local del componente. No se implementa caché global ni React Query para esta iteración.

**Rationale**: El volumen de datos es muy pequeño (<50 items por categoría). La latencia es imperceptible. Añadir un sistema de caché global (Context, Zustand, React Query) agregaría complejidad sin beneficio real a esta escala. Simple es mejor.

**Alternatives considered**:
- **Context global de enums**: Permite compartir valores entre componentes. Rechazado por complejidad de setup vs. beneficio real para <5 categorías.
- **SWR / React Query**: Añade caché automático y re-fetch. Rechazado — proyecto no usa estas librerías actualmente.

---

## Decisión 4: Migración de datos existentes

**Decision**: La migración SQL hace dos cosas en una transacción:
1. Crea las tablas `enum_categorias` y `enum_valores` con los valores actuales de cada enum.
2. Cambia las columnas afectadas de tipo enum a `VARCHAR(50)` (preservando los datos existentes).
3. Elimina los tipos enum de PostgreSQL una vez que ninguna columna los referencia.

El paso 1 (seed de valores) va en el mismo archivo `migration.sql` para garantizar que la DB nunca quede sin valores válidos entre pasos.

**Columns affected**:
| Tabla | Columna | Tipo actual | Tipo nuevo | Categoría |
|-------|---------|-------------|------------|-----------|
| `sesiones` | `tipo` | `TipoSesion` | `VARCHAR(50)` | `TipoSesion` |
| `inscripciones` | `motivo_baja` | `MotivoBaja?` | `VARCHAR(50)?` | `MotivoBaja` |
| `notas` | `nota` | `EstadoNota` | `VARCHAR(50)` | `EstadoNota` |
| `notas_finales_inscripcion` | `tipo_nota` | `TipoNotaFinal` | `VARCHAR(50)` | `TipoNotaFinal` |
| `notas_finales_inscripcion` | `valor` | `EstadoNota` | `VARCHAR(50)` | `EstadoNota` |

**Rationale**: Una migración atómica evita estados intermedios inconsistentes. PostgreSQL permite `ALTER COLUMN TYPE` con un CAST explícito cuando el tipo origen es enum y el destino es text/varchar.

---

## Decisión 5: Categorías no configurables — representación en UI

**Decision**: Las 5 categorías no configurables (Rol, EstadoGeneral, EstadoClase, EstadoInscripcion, EstadoAsistencia) se listan en la UI con sus valores hardcodeados en el frontend, sin representación en `enum_categorias`. Se muestran en una sección separada con ícono de candado y tooltip "Controlado por el sistema".

**Rationale**: Crear filas en `enum_categorias` para enums no editables añade complejidad sin valor — esos valores no cambian, no se auditan y no necesitan backend. Mantenerlos en el frontend elimina una capa innecesaria.

---

## Columnas de enum NO configurables (referencia)

Las siguientes columnas permanecen como enum PostgreSQL:

| Tabla | Columna | Tipo |
|-------|---------|------|
| `usuario_roles` | `nombre` | `Rol` |
| `usuarios` | `estado` | `EstadoGeneral` |
| `clases` | `estado` | `EstadoClase` |
| `inscripciones` | `estado` | `EstadoInscripcion` |
| `asistencias` | `estado` | `EstadoAsistencia` |

Estas columnas no se modifican en esta feature.
