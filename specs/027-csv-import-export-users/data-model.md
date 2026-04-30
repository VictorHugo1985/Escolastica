# Data Model: Importación CSV y Exportación Excel de Usuarios

**Feature**: 027-csv-import-export-users
**Date**: 2026-04-28

---

## Impacto en el esquema de base de datos

**Esta feature NO agrega ni modifica tablas en la base de datos.**

Toda la lógica de importación es transaccional sobre las tablas existentes `usuarios` y `usuario_roles`, usando exactamente el mismo flujo que la creación manual de usuarios. La exportación es una lectura sobre las mismas tablas.

---

## Entidades existentes utilizadas

### `usuarios` (sin cambios de schema)

| Campo              | Tipo       | Requerido en CSV | Notas                                    |
|--------------------|------------|------------------|------------------------------------------|
| `nombre_completo`  | `String`   | Sí               | Columna requerida en el CSV              |
| `email`            | `String?`  | Sí               | Columna requerida; unique en DB          |
| `telefono`         | `String?`  | Opcional         |                                          |
| `ci`               | `String?`  | Opcional         | No se valida unicidad en importación masiva |
| `fecha_nacimiento` | `DateTime?`| Opcional         | Formato ISO 8601 en CSV (YYYY-MM-DD)     |
| `genero`           | `String?`  | Opcional         |                                          |
| `estado`           | `String`   | — (fijo)         | Siempre `"Activo"` al importar           |
| `must_change_password` | `Boolean` | — (fijo)    | Siempre `false`; credenciales por flujo de activación |

### `usuario_roles` (sin cambios de schema)

Cada usuario creado por importación recibe exactamente un rol, registrado en `usuario_roles` con la relación al `roles.id` correspondiente al nombre seleccionado.

### `roles` (solo lectura)

El rol seleccionado por el Escolástico en la importación se busca por `nombre` en la tabla `roles`. El sistema expone la lista de roles disponibles al frontend para poblar el selector.

---

## Estructuras de datos en memoria (no persisten en DB)

### `FilaImportacion`
Representa una fila del CSV durante el procesamiento.

```
FilaImportacion {
  fila_numero:    number        // número de fila en el CSV (1-based, sin contar header)
  nombre_completo: string
  email:          string
  telefono?:      string
  ci?:            string
  fecha_nacimiento?: string    // YYYY-MM-DD
  genero?:        string
}
```

### `ResultadoFila`
Resultado de intentar crear un usuario a partir de una `FilaImportacion`.

```
ResultadoFila {
  fila_numero:    number
  nombre:         string
  email:          string
  resultado:      'creado' | 'duplicado' | 'error'
  motivo?:        string       // presente solo si resultado === 'error'
}
```

### `ResultadoImportacion`
Retorno del endpoint `POST /users/import`.

```
ResultadoImportacion {
  total:       number           // total de filas de datos procesadas
  creados:     number
  duplicados:  number           // email ya existente en DB
  errores:     number           // validación fallida u otro error
  filas_fallidas: ResultadoFila[]  // solo duplicados y errores
}
```

---

## Columnas del Excel exportado

El archivo `.xlsx` contiene exactamente estas columnas en este orden:

| # | Columna              | Campo fuente                      |
|---|----------------------|-----------------------------------|
| 1 | Nombre completo      | `usuarios.nombre_completo`        |
| 2 | Email                | `usuarios.email`                  |
| 3 | CI                   | `usuarios.ci`                     |
| 4 | Teléfono             | `usuarios.telefono`               |
| 5 | Género               | `usuarios.genero`                 |
| 6 | Fecha nacimiento     | `usuarios.fecha_nacimiento`       |
| 7 | Estado               | `usuarios.estado`                 |
| 8 | Fecha inscripción    | `usuarios.fecha_inscripcion`      |
| 9 | Fecha recibimiento   | `usuarios.fecha_recibimiento`     |
| 10| Roles                | `usuario_roles → roles.nombre`   |
| 11| Creado el            | `usuarios.created_at`             |

---

## Plantilla CSV (template descargable)

El archivo `usuarios-plantilla.csv` que el sistema ofrece para descarga tiene este contenido:

```csv
nombre_completo,email,telefono,ci,fecha_nacimiento,genero
Juan Perez,juan.perez@ejemplo.com,1134567890,12345678,1990-05-15,Masculino
Maria Garcia,maria.garcia@ejemplo.com,,,1985-11-30,Femenino
```

- Primera fila: headers exactos requeridos por el sistema
- Filas siguientes: datos de ejemplo (pueden borrarse)
- Campos opcionales pueden dejarse vacíos (columnas presentes pero sin valor)
