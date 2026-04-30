# Tareas: Ficha de Probacionista — Instructor de Referencia (017)

**Entrada**: Documentos de diseño de `/specs/017-probacionista-ficha/`  
**Prerrequisitos**: spec.md, plan.md, data-model.md, contracts/api.md  
**Depende de**: spec 003 (usuarios, inscripciones), spec 007 (inscripciones), spec 004 (clases)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Backend — Extensión de findPendingApproval()

**Objetivo**: Extender la consulta de Probacionistas pendientes para incluir el instructor de referencia de la materia de probacionismo más reciente, sin modificar el esquema de BD.

**Prueba Independiente**: Invocar `GET /users/pending-approval` y verificar que la respuesta incluye `instructor_referencia` con `nombre_completo`, `estado_inscripcion` y `materia` para Probacionistas con inscripción en materia de probacionismo. Para Probacionistas sin inscripción, `instructor_referencia` debe ser `null`.

- [x] T001 [US1] Extender `findPendingApproval()` en `apps/api/src/users/users.service.ts`: incluir en la query Prisma las inscripciones del Probacionista filtradas por `clase.materia.es_curso_probacion = true`, ordenadas por `fecha_inscripcion DESC`, `take: 1`, con include anidado hasta `instructor (select: id, nombre_completo)` y `materia (select: nombre)`
- [x] T002 [P] [US1] Mapear el resultado de la query en `findPendingApproval()` para transformar la inscripción anidada en un objeto plano `instructor_referencia: { nombre_completo, estado_inscripcion, materia } | null`

---

## Fase 2: Frontend — Tarjeta de Probacionista con Instructor de Referencia

**Objetivo**: Mostrar el instructor de referencia en la tarjeta de la Bandeja de Aprobación como campo de solo lectura.

**Prueba Independiente**: Abrir `/admin/users/pending` y verificar que cada tarjeta muestra la sección de "Instructor de referencia" con los datos del instructor o el texto "Sin inscripción registrada".

- [x] T003 [US2] Actualizar la interfaz `Usuario` en `apps/web/src/app/(admin)/admin/users/pending/page.tsx` para incluir el campo `instructor_referencia: { nombre_completo: string; estado_inscripcion: string; materia: string } | null`
- [x] T004 [P] [US2] Agregar sección de solo lectura "Instructor de referencia" en la tarjeta del Probacionista dentro de `apps/web/src/app/(admin)/admin/users/pending/page.tsx`: mostrar nombre, materia y estado de inscripción si existe; mostrar "Sin inscripción registrada" si es null

---

## Dependencias

```
Fase 1 (Backend)
  └── Fase 2 (Frontend — consume respuesta extendida de la API)
```

## Oportunidades de paralelismo

| Fase | Tareas paralelas |
|------|-----------------|
| Fase 1 | T001 → T002 (T002 depende de T001) |
| Fase 2 | T003 + T004 pueden hacerse en paralelo una vez T001 y T002 completos |
