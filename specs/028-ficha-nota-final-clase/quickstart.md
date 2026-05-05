# Quickstart: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-04

## Resumen ejecutivo

Esta feature tiene **alcance reducido**: la mayor parte del backend ya está implementado. El trabajo se concentra en:

1. Una migración de base de datos (agregar `nota_final` a `inscripciones`)
2. Extender un endpoint existente (agregar `nota_final` al PATCH `/conclusion`)
3. Modificar una sola página de frontend (`/admin/clases/[id]/page.tsx`)

Tiempo estimado: **1 jornada de trabajo**.

## Archivos a modificar

| Archivo | Tipo de cambio |
|---------|---------------|
| `prisma/schema.prisma` | Agregar campo `nota_final` en model `inscripciones` |
| `apps/web/src/app/api/inscripciones/[id]/conclusion/route.ts` | Agregar `nota_final` al PATCH handler |
| `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx` | Agregar columna `nota_final` + botón "Finalizar clase" |

## Pasos de implementación (en orden)

### 1. Schema + Migración

```bash
# En el schema.prisma, agregar en model inscripciones:
# nota_final  EstadoNota?

npx prisma migrate dev --name add-nota-final-inscripcion
npx prisma generate
```

### 2. Backend: extender endpoint `conclusion`

En `conclusion/route.ts`, dentro del bloque `data` del `prisma.inscripciones.update`:

```typescript
...(dto.nota_final !== undefined && { nota_final: dto.nota_final }),
```

Agregar también en el `valor_anterior` del auditLog la captura de `before.nota_final`.

Agregar validación: si `dto.nota_final` está presente y no es null, verificar que sea un valor del enum `EstadoNota`.

### 3. Frontend: columna `nota_final` + botón "Finalizar clase"

**Columna nota_final en DataGrid**:
- `Select` inline con opciones `Sobresaliente / Sólido / Aprobado / Reprobado` + opción vacía
- `onChange` llama `api.patch('/inscripciones/{id}/conclusion', { nota_final: value })` + `loadClase()`

**Botón "Finalizar clase"**:
- Visible solo si `clase.estado === 'Activa'`  
- Solo renderizado si el usuario tiene rol `Escolastico` (consultar rol desde el contexto de auth)
- Click abre `Dialog` de confirmación
- Confirmación llama `api.patch('/clases/{id}/status', { estado: 'Finalizada' })` + `loadClase()`

## Flujo de prueba manual

1. Abrir `/admin/clases/[id]` con una clase `Activa` que tenga alumnos inscritos
2. Seleccionar `nota_final` para un alumno → verificar que persiste al recargar
3. Desmarcar/marcar checkbox de conclusión de temario → verificar comportamiento inalterado
4. Click "Finalizar clase" → confirmar → verificar estado cambia a `Finalizada`
5. Verificar que el botón "Finalizar clase" ya no aparece
6. Verificar que el botón "Inscribir alumno" ya no aparece (ya implementado: `clase.estado !== 'Finalizada'`)
7. Verificar entrada en `logs_auditoria` para el cambio de estado y para la nota final

## Dependencias del entorno

- PostgreSQL con Prisma migrations habilitadas
- `npx prisma migrate dev` disponible (entorno de desarrollo)
- Para producción: aplicar migración via `npx prisma migrate deploy` antes del deploy
