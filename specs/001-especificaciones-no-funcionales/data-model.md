# Modelo de Datos: Usuarios y Autenticación

## Entidades Principales

| Entidad | Descripción | Campos Clave |
|---------|-------------|--------------|
| **User** | Representa la identidad de un miembro, instructor o administrador. | `id`, `email`, `password_hash`, `rol`, `intentos_fallidos`, `bloqueado_hasta` |
| **Session** | Registro de sesiones activas para validación de tokens. | `id`, `user_id`, `refresh_token`, `expires_at`, `device_info` |
| **ResetToken** | Tokens de un solo uso para recuperación de contraseña. | `id`, `user_id`, `token`, `expires_at`, `usado` |

## Relaciones

- **Un Usuario tiene muchas Sesiones**: Un usuario puede estar autenticado en múltiples dispositivos simultáneamente.
- **Un Usuario tiene muchos ResetTokens**: Historial de solicitudes de cambio de contraseña.
- **Relación con Perfiles**: Cada `User` estará vinculado a un perfil detallado (Spec 003).

## Reglas de Validación (Zod)

- **Email**: Formato válido de correo electrónico, obligatorio.
- **Password**: Mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.
- **Rol**: Enumeración estricta alineada con el Diccionario Maestro (spec 002): `'Escolastico'`, `'Instructor'`, `'Miembro'`, `'Probacionista'`, `'Ex-miembro'`.
