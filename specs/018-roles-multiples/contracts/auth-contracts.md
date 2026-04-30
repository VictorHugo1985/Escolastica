# Auth & Role Contracts

## API Endpoints (api/src/auth)

### POST /auth/refresh
Endpoint para refrescar el Access Token y obtener los roles actualizados.

**Request**:
- Headers: `Cookie: refreshToken=...` (HttpOnly)

**Response (200 OK)**:
```json
{
  "accessToken": "new_jwt_string",
  "roles": ["miembro", "instructor"]
}
```

---

## API Endpoints (api/src/users)

### POST /users/:id/roles
Asigna un nuevo rol a un usuario.

**Roles Requeridos**: `escolastico`

**Request Body**:
```json
{
  "rol_slug": "instructor"
}
```

**Response (201 Created)**:
```json
{
  "usuario_id": "uuid",
  "rol_id": "uuid",
  "asignado_por_id": "uuid",
  "fecha_asignacion": "2026-04-23T10:00:00Z"
}
```

**Error (400 Bad Request)**:
- "Rol incompatible con el estado actual del usuario (Probacionista/ExMiembro)"
- "El usuario ya posee este rol"

### DELETE /users/:id/roles/:roleSlug
Revoca un rol específico de un usuario (soft-delete).

**Roles Requeridos**: `escolastico`

**Response (200 OK)**:
```json
{
  "success": true,
  "revocado_por_id": "uuid",
  "fecha_revocacion": "2026-04-23T10:05:00Z"
}
```

**Error (400 Bad Request)**:
- "No se puede revocar el único rol activo del usuario"
- "No se puede revocar el rol instructor con clases activas"
