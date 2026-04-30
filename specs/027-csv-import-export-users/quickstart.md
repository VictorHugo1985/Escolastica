# Quickstart: Importación CSV y Exportación Excel de Usuarios

**Feature**: 027-csv-import-export-users
**Date**: 2026-04-28

---

## Escenario 1: Importación exitosa de 3 usuarios

### CSV de prueba (`test-import.csv`):
```csv
nombre_completo,email,telefono,ci,fecha_nacimiento,genero
Juan Perez,juan.perez@test.com,1134567890,12345678,1990-05-15,Masculino
Maria Garcia,maria.garcia@test.com,,,1985-11-30,Femenino
Carlos Ruiz,carlos.ruiz@test.com,1198765432,,,,
```

### Flujo:
1. Login como Escolástico
2. Ir a `/admin/users`
3. Clic en "Importar CSV"
4. Seleccionar rol: `Instructor`
5. Cargar el archivo `test-import.csv`
6. Clic en "Importar"

### Resultado esperado:
```json
{
  "total": 3,
  "creados": 3,
  "duplicados": 0,
  "errores": 0,
  "filas_fallidas": []
}
```
- Alert verde: "3 usuarios creados correctamente"
- Los 3 usuarios aparecen en la lista con rol Instructor

---

## Escenario 2: CSV con duplicados y errores mixtos

### CSV de prueba:
```csv
nombre_completo,email,telefono
Juan Perez,juan.perez@test.com,1134567890
,sinNombre@test.com,
Nuevo Usuario,nuevo@test.com,1155555555
```
(asumiendo que `juan.perez@test.com` ya existe del escenario 1)

### Resultado esperado:
```json
{
  "total": 3,
  "creados": 1,
  "duplicados": 1,
  "errores": 1,
  "filas_fallidas": [
    { "fila_numero": 1, "email": "juan.perez@test.com", "resultado": "duplicado", "motivo": "El email ya existe en el sistema" },
    { "fila_numero": 2, "email": "sinNombre@test.com", "resultado": "error", "motivo": "nombre_completo es requerido" }
  ]
}
```

---

## Escenario 3: CSV con formato incorrecto (sin columna requerida)

### CSV de prueba:
```csv
apellido,correo
Perez,juan@test.com
```

### Resultado esperado: HTTP 400
```json
{
  "statusCode": 400,
  "message": "El archivo CSV debe contener las columnas: nombre_completo, email"
}
```
- El dialog muestra Alert rojo con el mensaje de error
- No se crea ningún usuario

---

## Escenario 4: Exportación con filtros activos

### Flujo:
1. En `/admin/users` aplicar filtro: Rol = `Instructor`, Estado = `Activo`
2. Clic en "Exportar Excel"

### Resultado esperado:
- Se descarga `usuarios-2026-04-28.xlsx`
- El archivo contiene solo los usuarios Instructores Activos
- Las columnas son: Nombre completo, Email, CI, Teléfono, Género, Fecha nacimiento, Estado, Fecha inscripción, Fecha recibimiento, Roles, Creado el

---

## Escenario 5: Descarga de plantilla

### Flujo:
1. Abrir dialog de importación
2. Clic en "Descargar plantilla de ejemplo"

### Resultado esperado:
- Se descarga `usuarios-plantilla.csv`
- Contenido:
```csv
nombre_completo,email,telefono,ci,fecha_nacimiento,genero
Juan Perez,juan.perez@ejemplo.com,1134567890,12345678,1990-05-15,Masculino
Maria Garcia,maria.garcia@ejemplo.com,,,1985-11-30,Femenino
```

---

## Verificación de auditoría

Después del escenario 1, verificar que existan 3 registros en la tabla `auditoria`:
- `accion`: `INSERT`
- `tabla_afectada`: `usuarios`
- `usuario_id`: ID del Escolástico que hizo la importación

---

## Instalación de dependencias (pre-requisito para implementación)

```bash
npm install csv-parse exceljs @types/multer --workspace=apps/api
```
