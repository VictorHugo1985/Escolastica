# Data Model: Roles Múltiples por Usuario

## Entities

### UsuarioRole (Tabla de Unión)
Vínculo entre usuarios y roles con auditoría completa.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificador único. |
| usuario_id | UUID | FK -> usuarios | Usuario que posee el rol. |
| rol_id | UUID | FK -> roles | Rol asignado. |
| asignado_por_id | UUID | FK -> usuarios | Admin que realizó la asignación. |
| fecha_asignacion | DateTime | Default: now() | Momento de la asignación. |
| revocado_por_id | UUID | FK -> usuarios, Nullable | Admin que revocó el rol. |
| fecha_revocacion | DateTime | Nullable | Momento de la revocación. |
| activo | Boolean | Default: true | Indica si el rol está vigente. |

## Relationships
- `Usuario` 1:N `UsuarioRole`: Un usuario puede tener múltiples registros de roles activos o históricos.
- `Rol` 1:N `UsuarioRole`: Un rol puede estar asignado a múltiples usuarios.

## Validation Rules
1. **Exclusividad**: No se puede asignar ningún otro rol si el usuario tiene `probacionista` o `ex-miembro` activo.
2. **Mínimo Vital**: No se puede revocar el último rol activo de un usuario.
3. **Bloqueo Instructor**: No se puede revocar `instructor` si el usuario tiene clases asignadas activas.
