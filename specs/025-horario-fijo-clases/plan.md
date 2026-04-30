# Implementation Plan: Horario Fijo Obligatorio por Clase

**Branch**: `025-horario-fijo-clases` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/025-horario-fijo-clases/spec.md`

---

## Summary

Hacer obligatorio el registro de un horario fijo (día de la semana + hora inicio/fin) al crear una clase, reemplazando el campo `aula_id` de nivel superior por un objeto `horario` completo en el DTO de creación. Agregar un filtro por día de la semana en el listado de asistencia (preseleccionado al día actual para instructores). La lógica de pre-carga de fecha en sesiones ya está implementada y no requiere cambios.

No se requieren migraciones de base de datos: la tabla `horarios` ya existe con todos los campos necesarios.

---

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 backend, Next.js 14 frontend)  
**Primary Dependencies**: NestJS, Prisma ORM, MUI v5, Zod, React Hook Form + zodResolver  
**Storage**: PostgreSQL (Supabase) — tabla `horarios` ya existe con esquema correcto  
**Testing**: Manual / escenarios en quickstart.md  
**Target Platform**: Web responsive (mobile-first para operaciones de asistencia, desktop para admin)  
**Project Type**: Web application — monorepo Turborepo (apps/api, apps/web, packages/shared, packages/database)  
**Performance Goals**: Filtro por día < 2s, creación de sesión < 5s (SC-002, SC-005)  
**Constraints**: Sin migraciones de BD; sin romper compatibilidad con clases existentes sin horario  
**Scale/Scope**: ~50–200 clases activas, ~10 instructores, ~200 alumnos

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Data-First**: La tabla `horarios` ya existe en el modelo de datos aprobado (Spec 003). No hay cambios de esquema — solo se formaliza la obligatoriedad a nivel de validación en el DTO y se corrige la creación que antes usaba valores hardcodeados. Alineado con el Diccionario de Datos Maestro.
- [X] **Mobile-First**: El filtro por día en el listado de Listas es un Select compacto compatible con móvil. La pantalla de creación de clase (solo admin desktop) agrega campos de horario al formulario existente sin afectar el flujo mobile del instructor.
- [X] **Modular**: Los cambios son acotados: 1 schema en `packages/shared`, 1 servicio en `apps/api`, 1 formulario en `apps/web/admin/clases`, 1 filtro en `apps/web/admin/asistencia`. No se modifica código no relacionado.
- [X] **Audit**: La creación de clase ya registra auditoría. El campo `horario` se incluye en el `valor_nuevo` del log de auditoría. No se requiere auditoría adicional para el filtro (acción de lectura).
- [X] **Sessions**: La fecha de sesión derivada del horario ya está implementada y utiliza `clase.horarios[0].dia_semana`. Al formalizar el horario como obligatorio, esta funcionalidad queda garantizada para todas las clases nuevas.

**Resultado**: Sin violaciones. Sin complejidad adicional justificada.

---

## Project Structure

### Documentation (this feature)

```text
specs/025-horario-fijo-clases/
├── plan.md         ✅ este archivo
├── research.md     ✅ generado
├── data-model.md   ✅ generado
├── quickstart.md   ✅ generado
├── contracts/
│   └── api.md      ✅ generado
└── tasks.md        (pendiente — /speckit.tasks)
```

### Source Code — archivos a modificar

```text
packages/shared/src/schemas/
└── clase.schema.ts              # Reemplazar aula_id por horario: { dia_semana, hora_inicio, hora_fin, aula_id? }

apps/api/src/clases/
└── clases.service.ts            # create(): usar data.horario en lugar del bloque if(data.aula_id)

apps/web/src/app/(admin)/admin/
├── clases/page.tsx              # Formulario: agregar dia_semana, hora_inicio, hora_fin; mover aula_id dentro de horario
└── asistencia/page.tsx          # Agregar filtro por día de la semana (Select); preseleccionar hoy para instructores
```

### Archivos que NO cambian

```text
packages/database/schema.prisma            # Sin migración — horarios ya existe
apps/api/src/sesiones/sesiones.service.ts  # Fecha de sesión ya implementada
apps/api/src/sesiones/sesiones.controller.ts
apps/web/src/app/(instructor)/asistencia/  # Pre-carga de fecha ya implementada
apps/web/src/app/(admin)/admin/asistencia/[claseId]/  # Hub y sesión ya implementados
```

---

## Implementación por User Story

### US1: Horario obligatorio en creación de clase (P1)

**Archivos**: `packages/shared/src/schemas/clase.schema.ts`, `apps/api/src/clases/clases.service.ts`, `apps/web/src/app/(admin)/admin/clases/page.tsx`

**Cambios clave**:

1. `CreateClaseSchema`: Eliminar `aula_id`. Agregar:
   ```typescript
   horario: z.object({
     dia_semana: z.number().int().min(0).max(6),
     hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
     hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
     aula_id: z.string().uuid().optional(),
   })
   ```

2. `UpdateClaseSchema`: Eliminar `aula_id` (la edición de horarios usa endpoints dedicados).

3. `clases.service.ts` → `create()`: Reemplazar el bloque:
   ```typescript
   if (data.aula_id) { await this.prisma.horarios.create({ ..., dia_semana: 1, hora_inicio: hardcoded }) }
   ```
   Por:
   ```typescript
   await this.prisma.horarios.create({
     data: {
       clase_id: clase.id,
       dia_semana: data.horario.dia_semana,
       hora_inicio: new Date(`1970-01-01T${data.horario.hora_inicio}:00`),
       hora_fin: new Date(`1970-01-01T${data.horario.hora_fin}:00`),
       aula_id: data.horario.aula_id ?? null,
     },
   });
   ```

4. `clases/page.tsx` (formulario): Agregar dentro del `<Grid>` existente tres nuevos campos agrupados bajo "Horario de la clase": `dia_semana` (Select), `hora_inicio` (TextField time), `hora_fin` (TextField time). Mover el Select de aula dentro del objeto `horario` del formulario. Eliminar el campo `aula_id` a nivel raíz.

### US2: Filtro por día en el listado de asistencia (P2)

**Archivo**: `apps/web/src/app/(admin)/admin/asistencia/page.tsx`

**Cambios clave**:

1. Agregar estado `filtroDia`:
   ```typescript
   const esEscol = user?.roles.includes('Escolastico') ?? false;
   const [filtroDia, setFiltroDia] = useState<number | null>(
     esEscol ? null : new Date().getDay()
   );
   ```

2. Agregar filtro en `clasesFiltradas` (junto al filtro de instructor existente):
   ```typescript
   const clasesFiltradas = useMemo(() => {
     let result = clases;
     if (filtroInstructor) result = result.filter(c => c.instructor.id === filtroInstructor);
     if (filtroDia !== null) result = result.filter(c => c.horarios.some(h => h.dia_semana === filtroDia));
     return result;
   }, [clases, filtroInstructor, filtroDia]);
   ```

3. Agregar Select de día en la UI (junto al filtro de instructor existente):
   ```tsx
   <FormControl size="small" sx={{ minWidth: 160 }}>
     <InputLabel>Día de la semana</InputLabel>
     <Select value={filtroDia ?? ''} label="Día de la semana"
       onChange={(e) => setFiltroDia(e.target.value === '' ? null : Number(e.target.value))}>
       <MenuItem value=""><em>Todos los días</em></MenuItem>
       {DIAS_CORTO.map((d, i) => i > 0 && i < 7 && <MenuItem key={i} value={i}>{d}</MenuItem>)}
     </Select>
   </FormControl>
   ```

### US3: Fecha de sesión pre-cargada (P3 — ya implementado)

No requiere cambios. Funciona en base a `clase.horarios[0].dia_semana` que el GET /clases ya retorna.

**Verificación**: Con el horario ahora obligatorio en nuevas clases, `clase.horarios[0]` siempre existe para clases creadas tras este feature.

---

## Complexity Tracking

Sin violaciones a la Constitución. Sin entradas en esta sección.
