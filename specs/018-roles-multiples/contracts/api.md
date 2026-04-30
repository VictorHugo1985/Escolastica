# API Contracts: Role Management & Auth Sync

## Role Management (Admin only)

### POST /users/:id/roles
Asigna un nuevo rol a un usuario.

**Request Body**:
```json
{
  "roleSlug": "instructor"
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "rol": "instructor",
  "fecha_asignacion": "iso-date"
}
```

### DELETE /users/:id/roles/:roleId
Revoca un rol de un usuario (soft-delete).

**Response (200 OK)**:
```json
{
  "success": true,
  "fecha_revocacion": "iso-date"
}
```

## Session Synchronization

### POST /auth/refresh
Refresca el Access Token usando el Refresh Token (HttpOnly cookie).

**Response (200 OK)**:
```json
{
  "accessToken": "new-jwt-string",
  "roles": ["escolastico", "instructor"]
}
```
