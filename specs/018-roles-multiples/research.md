# Research: Roles Múltiples por Usuario

## Decision: Relación Muchos-a-Muchos Explícita en Prisma
**Rationale**: Para incluir campos de auditoría (`asignado_por_id`, `revocado_por_id`, `activo`) en la relación entre Usuarios y Roles, Prisma requiere una tabla de unión explícita en lugar de una implícita.
**Implementation**: Se definirá el modelo `UsuarioRole` en `schema.prisma` vinculando `usuarios` y `roles`.

## Decision: Silent Refresh con HttpOnly Cookies
**Rationale**: FR-011 exige sincronización sin cerrar sesión. Almacenar el Access Token en memoria y el Refresh Token en una HttpOnly cookie es el estándar de seguridad para SPAs.
**Implementation**: 
- Backend: Endpoint `POST /auth/refresh` que emite un nuevo JWT si el Refresh Token es válido.
- Frontend: Interceptor de Axios que detecta errores 401 y reintenta la petición tras llamar a `/refresh`.

## Decision: Lógica de Autorización Aditiva (RolesGuard)
**Rationale**: FR-002 establece que los permisos se suman. Un usuario con roles `['Escolastico', 'Instructor']` debe pasar guardias que requieran cualquiera de los dos.
**Implementation**: El `RolesGuard` en NestJS cambiará de `user.role === requiredRole` a `requiredRoles.some(role => user.roles.includes(role))`.

## Decision: Jerarquía Visual en el Frontend
**Rationale**: FR-012 requiere orden jerárquico.
**Implementation**: Se definirá una constante `ROLE_HIERARCHY = ['escolastico', 'instructor', 'miembro']`. Antes de renderizar los chips, el array de roles del usuario se ordenará usando `roles.sort((a, b) => ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b))`.

## Alternatives Considered
- **RBAC con Bitmasks**: Rechazado por baja legibilidad y dificultad de auditoría granular.
- **Refresh Token en LocalStorage**: Rechazado por vulnerabilidad a ataques XSS.
