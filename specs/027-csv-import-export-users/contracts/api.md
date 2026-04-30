# API Contracts: Importación CSV y Exportación Excel de Usuarios

**Feature**: 027-csv-import-export-users
**Module**: `users` (extensión de endpoints existentes)
**Auth**: JWT Bearer — todos los endpoints requieren rol `Escolastico`

---

## POST /users/import

Importa usuarios en masa desde un archivo CSV.

### Request

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

| Campo       | Tipo   | Requerido | Descripción                                          |
|-------------|--------|-----------|------------------------------------------------------|
| `file`      | File   | Sí        | Archivo `.csv` con los usuarios a importar           |
| `rolNombre` | string | Sí        | Nombre del rol a asignar (ej. `"Instructor"`)        |

**Validaciones previas (rechazo 400 antes de procesar filas)**:
- El archivo debe tener extensión `.csv` o MIME type `text/csv` / `text/plain`
- El archivo no puede estar vacío
- Los headers del CSV deben incluir al menos `nombre_completo` y `email`
- `rolNombre` debe corresponder a un rol existente en el sistema

### Response 200 OK

```json
{
  "total": 25,
  "creados": 22,
  "duplicados": 2,
  "errores": 1,
  "filas_fallidas": [
    {
      "fila_numero": 5,
      "nombre": "Carlos Lopez",
      "email": "carlos@existe.com",
      "resultado": "duplicado",
      "motivo": "El email ya existe en el sistema"
    },
    {
      "fila_numero": 12,
      "nombre": "Ana",
      "email": "ana@ejemplo.com",
      "resultado": "duplicado",
      "motivo": "El email ya existe en el sistema"
    },
    {
      "fila_numero": 18,
      "nombre": "",
      "email": "sinNombre@ejemplo.com",
      "resultado": "error",
      "motivo": "nombre_completo es requerido"
    }
  ]
}
```

### Response 400 Bad Request (formato inválido)

```json
{
  "statusCode": 400,
  "message": "El archivo CSV debe contener las columnas: nombre_completo, email"
}
```

### Response 403 Forbidden

Solo accesible para rol `Escolastico`.

---

## GET /users/export

Descarga un archivo Excel con los usuarios que coincidan con los filtros activos.

### Request

```
Authorization: Bearer <token>
```

| Query Param | Tipo   | Requerido | Descripción                         |
|-------------|--------|-----------|-------------------------------------|
| `rol`       | string | No        | Filtrar por nombre de rol            |
| `estado`    | string | No        | `"Activo"` o `"Inactivo"`           |
| `search`    | string | No        | Búsqueda por nombre o email          |

### Response 200 OK

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="usuarios-2026-04-28.xlsx"
```

Body: stream binario del archivo `.xlsx`

### Response 403 Forbidden

Solo accesible para rol `Escolastico`.

---

## GET /users/import-template

Descarga la plantilla CSV de ejemplo para importación.

### Request

```
Authorization: Bearer <token>
```

### Response 200 OK

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="usuarios-plantilla.csv"
```

Body: contenido CSV estático con headers y dos filas de ejemplo.

---

## Roles disponibles para importación

El frontend debe obtener los roles disponibles del endpoint existente o de una lista estática. Los roles válidos son los existentes en la tabla `roles`: `Escolastico`, `Instructor`, `Miembro`, `Probacionista`, `ExProbacionista`, `ExMiembro`.

> **Nota**: En la práctica, el Escolástico usará principalmente `Instructor` y `Miembro` para importaciones masivas.
