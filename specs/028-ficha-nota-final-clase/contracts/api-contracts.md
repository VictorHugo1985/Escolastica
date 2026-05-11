# API Contracts: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-09 (actualizado)

> **Nota**: Reemplaza versión del 2026-05-04. Los contratos de `nota_final` como campo escalar son reemplazados por endpoints de colección.

---

## Endpoint 1: Agregar nota final a una inscripción (NUEVO)

```
POST /api/inscripciones/:id/notas-finales
```

**Authorization**: `Escolastico` OR instructor titular de la clase

**Request Body**:

```json
{
  "tipo_nota": "Nota_Teorica",
  "valor": "Aprobado"
}
```

**Valores válidos para `tipo_nota`**: `"Nota_Teorica"` | `"Nota_Practica"` | `"Examen_Final"` | `"Trabajo_Escrito"`

**Valores válidos para `valor`**: `"Sobresaliente"` | `"Solido"` | `"Aprobado"` | `"Reprobado"`

**Response 201**:

```json
{
  "id": "uuid-nota",
  "inscripcion_id": "uuid-inscripcion",
  "tipo_nota": "Nota_Teorica",
  "valor": "Aprobado",
  "created_at": "2026-05-09T..."
}
```

**Errors**:

| Status | Caso |
|--------|------|
| 400 | `tipo_nota` o `valor` fuera del enum |
| 403 | No es Escolástico ni instructor titular |
| 404 | Inscripción no encontrada |
| 409 | Ya existe una nota del mismo `tipo_nota` para esta inscripción |

**Auditoría**: Registra `CREATE` en `logs_auditoria`, `tabla_afectada: 'notas_finales_inscripcion'`, `valor_nuevo: { inscripcion_id, tipo_nota, valor }`.

---

## Endpoint 2: Eliminar nota final de una inscripción (NUEVO)

```
DELETE /api/inscripciones/:id/notas-finales/:notaId
```

**Authorization**: `Escolastico` OR instructor titular de la clase

**Response 204**: Sin body

**Errors**:

| Status | Caso |
|--------|------|
| 403 | No es Escolástico ni instructor titular |
| 404 | Inscripción no encontrada, o nota no existe / no pertenece a esa inscripción |

**Auditoría**: Registra `DELETE` en `logs_auditoria`, `tabla_afectada: 'notas_finales_inscripcion'`, `valor_anterior: { inscripcion_id, tipo_nota, valor }`.

---

## Endpoint 3: Actualizar conclusión de temario (modificado — quitar nota_final)

```
PATCH /api/inscripciones/:id/conclusion
```

**Sin cambio en autorización.**

**Request Body** — se elimina el campo `nota_final`:

```json
{
  "concluyo_temario_materia": true,
  "fecha_conclusion_temario": "2026-05-01",
  "comentarios": "Alumno con buen desempeño"
}
```

El campo `nota_final` ya no es aceptado. Si se envía, se ignora silenciosamente (o se rechaza con 400 según criterio de implementación).

**Response 200**: Objeto `inscripciones` actualizado (sin `nota_final`).

---

## Endpoint 4: Obtener clase con inscripciones (modificado — incluye notas_finales)

```
GET /api/clases/:id
```

**Sin cambio en autorización.**

**Cambio en respuesta**: cada inscripción ahora incluye `notas_finales` en lugar de `nota_final`.

```json
{
  "id": "uuid-clase",
  "inscripciones": [
    {
      "id": "uuid-inscripcion",
      "concluyo_temario_materia": false,
      "nota_final": null,          // ← ELIMINADO
      "notas_finales": [           // ← NUEVO
        {
          "id": "uuid-nota",
          "tipo_nota": "Nota_Teorica",
          "valor": "Aprobado"
        }
      ],
      "usuario": { "id": "...", "nombre_completo": "..." }
    }
  ]
}
```

---

## Endpoint 5: Cambiar estado de clase (sin cambio)

```
PATCH /api/clases/:id/status
```

**Sin cambio de contrato.** Ver documentación original.

---

## Tipos TypeScript para el frontend

```typescript
type TipoNotaFinal = 'Nota_Teorica' | 'Nota_Practica' | 'Examen_Final' | 'Trabajo_Escrito';
type EstadoNota = 'Sobresaliente' | 'Solido' | 'Aprobado' | 'Reprobado';

interface NotaFinal {
  id: string;
  tipo_nota: TipoNotaFinal;
  valor: EstadoNota;
}

interface Inscripcion {
  id: string;
  usuario_id: string;
  fecha_inscripcion: string;
  concluyo_temario_materia: boolean;
  fecha_conclusion_temario: string | null;
  notas_finales: NotaFinal[];  // reemplaza nota_final: EstadoNota | null
  estado: string;
  usuario: { id: string; nombre_completo: string; email: string };
}

// Etiquetas de display para los enums
const TIPO_NOTA_LABELS: Record<TipoNotaFinal, string> = {
  Nota_Teorica:    'Nota Teórica',
  Nota_Practica:   'Nota Práctica',
  Examen_Final:    'Examen Final',
  Trabajo_Escrito: 'Trabajo Escrito',
};
```
