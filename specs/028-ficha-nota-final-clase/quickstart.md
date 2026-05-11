# Quickstart: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-09 (actualizado)

> Reemplaza versión del 2026-05-04. El campo único `nota_final` es reemplazado por la tabla `notas_finales_inscripcion`.

## Resumen ejecutivo

La implementación de "Finalizar clase" ya está completa (botón, diálogo, endpoint). El trabajo restante se concentra en:

1. Migración de DB (remover `nota_final` del campo único, agregar tabla `notas_finales_inscripcion`)
2. Dos nuevos endpoints Next.js (POST y DELETE de notas finales)
3. Modificar endpoint `conclusion` (quitar soporte a `nota_final`)
4. Modificar UI de la página de clase (reemplazar Select inline por diálogo de gestión)

Tiempo estimado: **1–1.5 jornadas de trabajo**.

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `packages/database/schema.prisma` | Agregar enum, nueva tabla, quitar campo `nota_final` de inscripciones |
| `apps/web/src/app/api/inscripciones/[id]/conclusion/route.ts` | Quitar lógica `nota_final` |
| `apps/web/src/app/api/inscripciones/[id]/notas-finales/route.ts` | CREAR — POST handler |
| `apps/web/src/app/api/inscripciones/[id]/notas-finales/[notaId]/route.ts` | CREAR — DELETE handler |
| `apps/web/src/app/api/clases/[id]/route.ts` (o equivalente) | Incluir `notas_finales` en Prisma include de inscripciones |
| `apps/web/src/app/(admin)/admin/clases/[id]/page.tsx` | Reemplazar columna `nota_final` con columna chips + diálogo |

## Pasos de implementación (en orden)

### 1. Schema + Migración

En `packages/database/schema.prisma`:

```prisma
// Agregar enum:
enum TipoNotaFinal {
  Nota_Teorica
  Nota_Practica
  Examen_Final
  Trabajo_Escrito
}

// Agregar modelo:
model notas_finales_inscripcion {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  inscripcion_id String         @db.Uuid
  tipo_nota      TipoNotaFinal
  valor          EstadoNota
  created_at     DateTime       @default(now()) @db.Timestamptz(6)
  updated_at     DateTime       @default(now()) @updatedAt @db.Timestamptz(6)
  inscripcion    inscripciones  @relation(fields: [inscripcion_id], references: [id], onDelete: Cascade)
  @@unique([inscripcion_id, tipo_nota])
}

// En model inscripciones: quitar nota_final, agregar relación:
// - QUITAR: nota_final  EstadoNota?
// + AGREGAR: notas_finales  notas_finales_inscripcion[]
```

```bash
npx prisma migrate dev --name replace-nota-final-with-table
npx prisma generate
```

### 2. Modificar `conclusion/route.ts`

Quitar el bloque:
```typescript
...(dto.nota_final !== undefined && { nota_final: dto.nota_final }),
```
Y quitar `nota_final` del `valor_anterior` / `valor_nuevo` en `auditLog`.

### 3. Crear `notas-finales/route.ts` (POST)

```typescript
// POST /api/inscripciones/:id/notas-finales
// 1. requireAuth — verificar Escolastico o instructor titular
// 2. Validar tipo_nota ∈ TipoNotaFinal, valor ∈ EstadoNota
// 3. prisma.notas_finales_inscripcion.create({ data: { inscripcion_id, tipo_nota, valor } })
//    — Prisma lanzará error P2002 (unique constraint) → responder 409
// 4. auditLog CREATE
// 5. return json(nota, 201)
```

### 4. Crear `notas-finales/[notaId]/route.ts` (DELETE)

```typescript
// DELETE /api/inscripciones/:id/notas-finales/:notaId
// 1. requireAuth — verificar Escolastico o instructor titular
// 2. Verificar que la nota existe y pertenece a la inscripción → 404 si no
// 3. auditLog DELETE (guardar valor_anterior antes de borrar)
// 4. prisma.notas_finales_inscripcion.delete({ where: { id: notaId } })
// 5. return 204
```

### 5. Actualizar `GET /api/clases/:id`

En el include de inscripciones, agregar:
```typescript
notas_finales: { select: { id: true, tipo_nota: true, valor: true } }
```

### 6. Actualizar UI `/admin/clases/[id]/page.tsx`

**Reemplazar** la columna `nota_final` del DataGrid:

```typescript
// QUITAR: interface Inscripcion.nota_final, NOTAS_FINALES const, updateNotaFinal()
// AGREGAR: interface NotaFinal, notas_finales en Inscripcion
// AGREGAR: estado notasTarget (inscripcion seleccionada para el diálogo)
// AGREGAR: Dialog de gestión de notas (ver descripción abajo)

// NUEVA columna en DataGrid:
{
  field: 'notas_finales',
  headerName: 'Notas finales',
  width: 200,
  renderCell: ({ row }) => (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {row.notas_finales.map((n) => (
        <Chip key={n.id} label={`${TIPO_NOTA_LABELS[n.tipo_nota]}: ${n.valor}`} size="small" />
      ))}
      <IconButton size="small" onClick={() => setNotasTarget(row)}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  ),
}
```

**Dialog de gestión de notas** (abre cuando `notasTarget !== null`):
- Lista de notas existentes con chip + botón eliminar (×)
- Formulario de agregar: Select de tipo + Select de valor + botón "Agregar"
- Al confirmar agregar: `api.post('/inscripciones/:id/notas-finales', { tipo_nota, valor })` + `loadClase()`
- Al eliminar: `api.delete('/inscripciones/:id/notas-finales/:notaId')` + `loadClase()`
- `fullScreen` en mobile (`useMediaQuery(theme.breakpoints.down('sm'))`)

## Flujo de prueba manual

1. Aplicar migración — verificar que `nota_final` ya no existe en `inscripciones` y que `notas_finales_inscripcion` se creó
2. Abrir `/admin/clases/:id` — verificar que la columna muestra chips vacíos + botón editar
3. Click en botón editar → agregar "Nota Teórica: Aprobado" → verificar que aparece en el diálogo y en los chips
4. Agregar "Nota Práctica: Sobresaliente" → verificar que aparecen dos chips
5. Intentar agregar "Nota Teórica" de nuevo → debe aparecer error (tipo duplicado)
6. Eliminar "Nota Práctica" → chip desaparece
7. Verificar entradas en `logs_auditoria` para CREATE y DELETE
8. Marcar "Concluyó temario" → debe seguir funcionando sin cambios
9. Finalizar clase → verificar estado `Finalizada`
10. Verificar que los chips de notas se siguen mostrando en clase finalizada

## Dependencias del entorno

- PostgreSQL con Prisma migrations habilitadas
- `npx prisma migrate dev` en entorno de desarrollo
- Para producción: `npx prisma migrate deploy` antes del deploy
