# API Contracts: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-04

---

## Endpoint 1: Actualizar conclusión e inscripción (extendido)

**Existente — se extiende el payload**

```
PATCH /api/inscripciones/:id/conclusion
```

**Authorization**: `Escolastico` OR instructor titular de la clase

**Request Body** (todos los campos opcionales):

```json
{
  "concluyo_temario_materia": true,
  "fecha_conclusion_temario": "2026-05-01",
  "nota_final": "Aprobado",
  "comentarios": "Alumno con buen desempeño"
}
```

**Valores válidos para `nota_final`**: `"Sobresaliente"` | `"Solido"` | `"Aprobado"` | `"Reprobado"` | `null`

**Response 200**:

```json
{
  "id": "uuid",
  "concluyo_temario_materia": true,
  "fecha_conclusion_temario": "2026-05-01T00:00:00.000Z",
  "nota_final": "Aprobado",
  "comentarios": "...",
  "updated_at": "2026-05-04T..."
}
```

**Errors**:

| Status | Caso                                                   |
|--------|--------------------------------------------------------|
| 403    | Usuario no es Escolástico ni instructor titular        |
| 404    | Inscripción no encontrada                              |
| 400    | `nota_final` con valor fuera del enum `EstadoNota`     |

**Auditoría**: Registra `UPDATE` en `logs_auditoria` con `tabla_afectada = 'inscripciones'`, `valor_anterior` y `valor_nuevo` incluyendo `nota_final`.

---

## Endpoint 2: Cambiar estado de clase (existente — sin cambio de contrato)

```
PATCH /api/clases/:id/status
```

**Authorization**: `Escolastico` únicamente

**Request Body**:

```json
{
  "estado": "Finalizada"
}
```

**Valores válidos para `estado`**: `"Activa"` | `"Inactiva"` | `"Finalizada"`

**Response 200**: Objeto `clases` completo actualizado.

**Errors**:

| Status | Caso                                              |
|--------|---------------------------------------------------|
| 403    | Usuario no es Escolástico                         |
| 404    | Clase no encontrada                               |
| 400    | Transición de estado no permitida (backend valida) |

**Nota de implementación**: El backend actual no valida la transición de estado (solo actualiza). Se recomienda agregar validación: si `estado_actual !== 'Activa'` y el nuevo estado es `Finalizada`, rechazar con 400.

**Auditoría**: Ya registra `UPDATE` en `logs_auditoria`. ✓

---

## Cambios al tipo `Inscripcion` en el frontend

Agregar `nota_final` al interface de TypeScript en `page.tsx`:

```typescript
interface Inscripcion {
  id: string;
  usuario_id: string;
  fecha_inscripcion: string;
  concluyo_temario_materia: boolean;
  fecha_conclusion_temario: string | null;
  nota_final: 'Sobresaliente' | 'Solido' | 'Aprobado' | 'Reprobado' | null; // NUEVO
  estado: string;
  usuario: Usuario;
}
```
