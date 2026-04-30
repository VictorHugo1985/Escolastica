# Quickstart: Escolástico con Privilegios Plenos de Asistencia

**Feature**: `024-asistencia-privilegios-escolastico`  
**Date**: 2026-04-24

## Contexto

Esta feature extiende `005-registro-asistencia`. El Escolástico pasa a tener paridad total con el Instructor para crear sesiones y registrar asistencia en **cualquier** clase activa del sistema.

## Cambio de implementación

### Alcance: 2 archivos en backend, 0 en frontend

---

### 1. `apps/api/src/sesiones/sesiones.service.ts`

Extender `findClasesHoy` para aceptar el array de roles del actor:

```typescript
async findClasesHoy(userId: string, roles: string[]) {
  const today = new Date();
  const diaSemana = today.getDay();
  const esEscol = roles.includes('Escolastico');

  return this.prisma.clases.findMany({
    where: {
      ...(!esEscol && { instructor_id: userId }),
      estado: 'Activa',
      horarios: { some: { dia_semana: diaSemana } },
    },
    include: {
      materia: { select: { id: true, nombre: true } },
      horarios: { where: { dia_semana: diaSemana } },
      _count: { select: { inscripciones: { where: { estado: 'Activo' } } } },
    },
  });
}
```

---

### 2. `apps/api/src/sesiones/sesiones.controller.ts`

Pasar `req.user.roles` al servicio:

```typescript
@Get('clases/hoy')
@Roles(Rol.Instructor, Rol.Escolastico)
findClasesHoy(@Request() req) {
  return this.sesionesService.findClasesHoy(req.user.id, req.user.roles);
}
```

---

## Verificación

1. Login como **Instructor** → `GET /clases/hoy` devuelve solo sus clases del día ✓
2. Login como **Escolástico** → `GET /clases/hoy` devuelve todas las clases activas del día ✓
3. Escolástico crea sesión en clase ajena → sesión creada, log de auditoría tiene UUID del Escolástico ✓
4. Escolástico registra asistencias → logs muestran su UUID como actor ✓

## No requiere

- Migración de base de datos
- Cambios en frontend
- Cambios en otros módulos
