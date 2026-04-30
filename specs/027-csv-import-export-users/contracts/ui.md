# UI Contract: Importación CSV y Exportación Excel de Usuarios

**Feature**: 027-csv-import-export-users
**Location**: `apps/web/src/app/(admin)/admin/users/page.tsx`
**Role constraint**: Visible solo para Escolástico

---

## Ubicación en la UI

Los dos controles se agregan al encabezado de la página de usuarios (`/admin/users`), junto al botón "Nuevo usuario" existente.

```
[PageHeader: Usuarios]
[Barra de filtros: búsqueda, rol, estado]
[Acciones: [Importar CSV] [Exportar Excel] [+ Nuevo Usuario]]
[DataGrid de usuarios]
```

---

## Botón "Importar CSV"

- **Tipo**: `Button` outlined, con ícono `UploadFileIcon`
- **Label**: "Importar CSV"
- **Visible**: solo si el usuario tiene rol `Escolastico`
- **Acción**: abre el `Dialog` de importación

---

## Dialog de Importación

**Título**: "Importar usuarios desde CSV"

### Contenido del dialog:

1. **Selector de rol** (requerido antes de poder subir archivo):
   - `Select` con todos los roles disponibles
   - Label: "Rol a asignar"
   - Sin valor por defecto

2. **Zona de carga de archivo**:
   - Input `type="file"` con `accept=".csv,text/csv"`
   - Muestra nombre del archivo seleccionado
   - Texto auxiliar: "Solo archivos .csv — máximo 5MB"

3. **Link de descarga de plantilla**:
   - Texto: "Descargar plantilla de ejemplo"
   - Llama a `GET /users/import-template` y descarga el CSV

4. **Botón Importar** (disabled hasta que haya rol y archivo):
   - Muestra `CircularProgress` durante el proceso
   - Label: "Importar" / "Importando..."

### Estados del dialog:

**Estado inicial**: formulario vacío, botón disabled

**Estado procesando**: spinner en el botón, campos disabled

**Estado resultado** (reemplaza el formulario):
- Si `creados > 0`: `Alert severity="success"` con "X usuarios creados correctamente"
- Si `duplicados > 0`: `Alert severity="warning"` con "X emails ya existían y fueron omitidos"
- Si `errores > 0`: `Alert severity="error"` con "X filas no pudieron procesarse"
- Tabla expandible con `filas_fallidas` (fila #, nombre, email, motivo)
- Botón "Cerrar" que cierra el dialog y recarga la lista de usuarios

**Estado error de formato**: `Alert severity="error"` con el mensaje del servidor, sin tabla de detalle

---

## Botón "Exportar Excel"

- **Tipo**: `Button` outlined, con ícono `DownloadIcon`
- **Label**: "Exportar Excel"
- **Visible**: solo si el usuario tiene rol `Escolastico`
- **Acción**: llama a `GET /users/export` pasando los filtros activos (`rol`, `estado`, `search`) y descarga el archivo `.xlsx`
- **Estado loading**: ícono giratorio mientras se genera el archivo
- **Sin dialog**: la descarga se dispara directamente

### Lógica de descarga en el frontend:
```
1. api.get('/users/export', { params: filtros, responseType: 'arraybuffer' })
2. new Blob([response.data], { type: 'application/vnd.openxmlformats-...' })
3. URL.createObjectURL(blob) → <a href=... download="usuarios-FECHA.xlsx"> → .click()
4. URL.revokeObjectURL(url)
```
