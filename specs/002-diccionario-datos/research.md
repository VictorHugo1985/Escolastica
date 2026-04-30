# Investigación: Diseño de Base de Datos y Mapeo con Prisma

## Decisiones Técnicas

### Estrategia de IDs y UUIDs
- **Decisión**: Utilizar `gen_random_uuid()` de PostgreSQL para todas las claves primarias (PK).
- **Justificación**: Proporciona seguridad por oscuridad (no es fácil adivinar IDs), evita colisiones en migraciones y es el estándar moderno para sistemas distribuidos/monorepos.
- **Implementación en Prisma**: `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`.

### Gestión de Auditoría con `Json`
- **Decisión**: La tabla `logs_auditoria` utilizará campos `Json` para `valor_anterior` y `valor_nuevo`.
- **Justificación**: Permite almacenar estados completos de cualquier entidad sin importar su estructura, cumpliendo con la Spec 012 de forma flexible y eficiente.
- **Ventaja**: Soporta consultas indexadas en PostgreSQL sobre campos específicos del JSON.

### Implementación de Enums
- **Decisión**: Definir Enums nativos de base de datos para estados (Asistencia, Notas, Roles, Sesiones).
- **Justificación**: Garantiza la integridad de los datos a nivel de motor de base de datos, evitando que valores inválidos sean insertados por error desde cualquier app.
- **Roles Finales**: Escolastico, Instructor, Miembro, Probacionista, Ex-miembro.
- **Asistencia Final**: Presente, Ausente, Licencia.
- **Sesiones Final**: Clase, Examen, Practica, Repaso.

### Sincronización con Supabase Auth
- **Decisión**: El ID del usuario en la tabla `usuarios` será el mismo UUID generado por Supabase Auth.
- **Justificación**: Facilita la relación entre la autenticación y el perfil de usuario sin necesidad de tablas intermedias complejas.

## Mejores Prácticas de Prisma en Monorepos

### Cliente Compartido
- Generar el cliente de Prisma en `packages/database` para que todas las apps del monorepo lo consuman como una dependencia interna.

### Seed Determinístico
- El script `seed.ts` debe ser idempotente (usar `upsert`).
- Roles base y un usuario administrador inicial deben estar siempre presentes tras el seed.

### Convención de Nombres
- Tablas en plural y minúsculas (ej: `usuarios`, `materias`) siguiendo las convenciones de PostgreSQL y los requisitos del Diccionario de Datos.
