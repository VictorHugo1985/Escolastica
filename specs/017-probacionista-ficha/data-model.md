# Data Model: Ficha de Probacionista — Instructor de Referencia

**Branch**: `017-probacionista-ficha`  
**Phase**: 1 — Design  
**Date**: 2026-04-22

## Cambios al esquema

**Ninguno.** Esta feature no agrega tablas ni columnas al esquema de la base de datos. Opera exclusivamente con relaciones existentes.

## Entidades involucradas (solo lectura / extensión de query)

### usuarios (tabla existente)
```
id                    UUID  PK
rol_id                UUID  FK → roles
nombre_completo       VARCHAR(255)
email                 VARCHAR(255)? UNIQUE
fecha_entrevista      DATE?          ← agregado en spec 003 US5
entrevista_completada BOOLEAN        ← agregado en spec 003 US5
estado                EstadoGeneral
created_at            TIMESTAMPTZ
```
Contexto: los Probacionistas son `usuarios` con `rol.nombre = 'Probacionista'`.

### inscripciones (tabla existente)
```
id                UUID  PK
usuario_id        UUID  FK → usuarios
clase_id          UUID  FK → clases
fecha_inscripcion TIMESTAMPTZ
estado            EstadoInscripcion  (Activo | Baja | Finalizado)
```
Contexto: se filtra por clases cuya materia tiene `es_curso_probacion = true`.

### clases (tabla existente)
```
id            UUID  PK
materia_id    UUID  FK → materias
instructor_id UUID  FK → usuarios
```

### materias (tabla existente)
```
id                 UUID  PK
nombre             VARCHAR(100)
es_curso_probacion BOOLEAN  ← discriminador para materias de probacionismo
```

## Consulta de derivación — Instructor de Referencia

La consulta para obtener el instructor de referencia de un Probacionista sigue este camino relacional:

```
usuarios [Probacionista]
  └─ inscripciones
       WHERE clase.materia.es_curso_probacion = true
       ORDER BY fecha_inscripcion DESC
       TAKE 1
       └─ clase
            ├─ materia   SELECT nombre, es_curso_probacion
            └─ instructor  SELECT id, nombre_completo
```

**Resultado en la respuesta**:
```json
{
  "instructor_referencia": {
    "nombre_completo": "Carlos López",
    "estado_inscripcion": "Finalizado",
    "materia": "Introducción al Escolasticismo"
  }
}
```

Si no existe inscripción en materia de probacionismo:
```json
{
  "instructor_referencia": null
}
```

## Diagrama de relaciones (simplificado)

```
usuarios (Probacionista)
     │
     │ 1..N
     ▼
inscripciones ──────── clases ──────── materias
                         │               (es_curso_probacion=true)
                         │ N..1
                         ▼
                      usuarios (Instructor)
                      [nombre_completo]
```
