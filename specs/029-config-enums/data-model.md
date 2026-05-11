# Data Model: Configuración de Enumeraciones

**Branch**: `029-config-enums` | **Date**: 2026-05-11
**Cross-reference**: Spec 003 (Diccionario de Datos) — requiere actualización con estas entidades.

---

## Nuevas entidades

### `enum_categorias`

Representa una categoría de enumeración configurable. Es una tabla de catálogo con filas fijas (una por categoría configurable).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identificador único |
| `nombre` | VARCHAR(50) | UNIQUE NOT NULL | Identificador interno invariante (ej: `TipoSesion`) |
| `etiqueta` | VARCHAR(100) | NOT NULL | Texto visible al usuario (ej: `Tipo de Sesión`) |
| `descripcion` | VARCHAR(255) | NULL | Descripción de para qué se usa la categoría |
| `created_at` | TIMESTAMPTZ | default now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | default now(), auto-update | Última modificación |

**Filas iniciales (seed):**

| nombre | etiqueta | descripcion |
|--------|----------|-------------|
| `EstadoNota` | `Estado de Nota` | Escala de calificaciones usada en notas de inscripciones |
| `TipoNotaFinal` | `Tipo de Nota Final` | Tipos de evaluación asignables a una inscripción |
| `TipoSesion` | `Tipo de Sesión` | Clasificación de las sesiones de clase |
| `MotivoBaja` | `Motivo de Baja` | Razón por la que un miembro fue dado de baja |

---

### `enum_valores`

Representa un valor individual dentro de una categoría configurable. Es la tabla donde el administrador agrega, renombra y desactiva valores.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identificador único |
| `categoria_id` | UUID | FK → enum_categorias(id) NOT NULL | Categoría a la que pertenece |
| `codigo` | VARCHAR(50) | NOT NULL | Identificador interno invariante, único por categoría (ej: `Clase`) |
| `etiqueta` | VARCHAR(100) | NOT NULL | Texto visible al usuario (editable) |
| `activo` | BOOLEAN | NOT NULL default true | Si aparece en formularios nuevos |
| `orden` | INTEGER | NOT NULL default 0 | Posición en la lista |
| `created_at` | TIMESTAMPTZ | default now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | default now(), auto-update | Última modificación |

**Constraints:**
- `UNIQUE(categoria_id, codigo)` — no puede haber dos valores con el mismo código en la misma categoría.
- `codigo` es inmutable tras creación — los registros históricos lo referencian por valor de string.

**Valores iniciales (seed por categoría):**

| categoria | codigo | etiqueta | activo | orden |
|-----------|--------|----------|--------|-------|
| EstadoNota | `Sobresaliente` | Sobresaliente | true | 1 |
| EstadoNota | `Solido` | Sólido | true | 2 |
| EstadoNota | `Aprobado` | Aprobado | true | 3 |
| EstadoNota | `Reprobado` | Reprobado | true | 4 |
| TipoNotaFinal | `Nota_Teorica` | Nota Teórica | true | 1 |
| TipoNotaFinal | `Nota_Practica` | Nota Práctica | true | 2 |
| TipoNotaFinal | `Examen_Final` | Examen Final | true | 3 |
| TipoNotaFinal | `Trabajo_Escrito` | Trabajo Escrito | true | 4 |
| TipoSesion | `Clase` | Clase | true | 1 |
| TipoSesion | `Examen` | Examen | true | 2 |
| TipoSesion | `Practica` | Práctica | true | 3 |
| TipoSesion | `Repaso` | Repaso | true | 4 |
| MotivoBaja | `Ausencia` | Ausencia | true | 1 |
| MotivoBaja | `Laboral` | Laboral | true | 2 |
| MotivoBaja | `Personal` | Personal | true | 3 |
| MotivoBaja | `Desconocido` | Desconocido | true | 4 |

---

## Cambios a tablas existentes

Las siguientes columnas cambian de tipo PostgreSQL ENUM a VARCHAR(50). Los datos existentes se preservan; la validación pasa de DB-level a application-level.

| Tabla | Columna | Tipo anterior | Tipo nuevo | Categoría |
|-------|---------|---------------|------------|-----------|
| `sesiones` | `tipo` | `TipoSesion` (enum) | `VARCHAR(50) NOT NULL` | TipoSesion |
| `inscripciones` | `motivo_baja` | `MotivoBaja?` (enum) | `VARCHAR(50) NULL` | MotivoBaja |
| `notas` | `nota` | `EstadoNota` (enum) | `VARCHAR(50) NOT NULL` | EstadoNota |
| `notas_finales_inscripcion` | `tipo_nota` | `TipoNotaFinal` (enum) | `VARCHAR(50) NOT NULL` | TipoNotaFinal |
| `notas_finales_inscripcion` | `valor` | `EstadoNota` (enum) | `VARCHAR(50) NOT NULL` | EstadoNota |

**Enums de PostgreSQL eliminados tras la migración:**
- `TipoSesion`
- `EstadoNota`
- `TipoNotaFinal`
- `MotivoBaja`

**Enums de PostgreSQL que NO cambian:**
- `Rol`, `EstadoGeneral`, `EstadoClase`, `EstadoInscripcion`, `EstadoAsistencia`

---

## Relaciones

```
enum_categorias 1──* enum_valores
```

Las tablas con columnas VARCHAR no tienen FK declarada a `enum_valores` — la integridad referencial se aplica a nivel de API. Este es un trade-off aceptado para permitir configurabilidad en runtime (ver research.md).

---

## Cambios en schema.prisma

### Nuevos modelos a agregar

```prisma
model enum_categorias {
  id          String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombre      String         @unique @db.VarChar(50)
  etiqueta    String         @db.VarChar(100)
  descripcion String?        @db.VarChar(255)
  created_at  DateTime       @default(now()) @db.Timestamptz(6)
  updated_at  DateTime       @default(now()) @updatedAt @db.Timestamptz(6)
  valores     enum_valores[]
}

model enum_valores {
  id           String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  categoria_id String          @db.Uuid
  codigo       String          @db.VarChar(50)
  etiqueta     String          @db.VarChar(100)
  activo       Boolean         @default(true)
  orden        Int             @default(0)
  created_at   DateTime        @default(now()) @db.Timestamptz(6)
  updated_at   DateTime        @default(now()) @updatedAt @db.Timestamptz(6)
  categoria    enum_categorias @relation(fields: [categoria_id], references: [id])
  @@unique([categoria_id, codigo])
}
```

### Modificaciones a modelos existentes

```prisma
// sesiones.tipo: TipoSesion → String
tipo  String  @db.VarChar(50)

// inscripciones.motivo_baja: MotivoBaja? → String?
motivo_baja  String?  @db.VarChar(50)

// notas.nota: EstadoNota → String
nota  String  @db.VarChar(50)

// notas_finales_inscripcion.tipo_nota: TipoNotaFinal → String
tipo_nota  String  @db.VarChar(50)

// notas_finales_inscripcion.valor: EstadoNota → String
valor  String  @db.VarChar(50)
```

### Enums a eliminar del schema.prisma

```prisma
// Eliminar estas declaraciones:
enum TipoSesion { ... }
enum EstadoNota { ... }
enum TipoNotaFinal { ... }
enum MotivoBaja { ... }
```
