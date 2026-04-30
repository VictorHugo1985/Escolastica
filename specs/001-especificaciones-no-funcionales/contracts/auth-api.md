# Contrato: API de Autenticación

## Endpoints

### 1. Iniciar Sesión (POST `/auth/login`)
- **Descripción**: Valida credenciales y otorga tokens de acceso.
- **Request Body**:
  ```json
  {
    "email": "user@escolastica.com",
    "password": "secure_password",
    "rememberMe": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "jwt_token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@escolastica.com",
      "rol": "Instructor"
    }
  }
  ```

### 2. Cerrar Sesión (POST `/auth/logout`)
- **Descripción**: Invalida el token de sesión actual.
- **Seguridad**: Requiere Bearer Token.

### 3. Solicitar Recuperación (POST `/auth/forgot-password`)
- **Request Body**: `{ "email": "user@escolastica.com" }`
- **Response**: `200 OK` (aunque el correo no exista, para evitar enumeración).

### 4. Resetear Contraseña (POST `/auth/reset-password`)
- **Request Body**:
  ```json
  {
    "token": "reset_token_uuid",
    "newPassword": "new_secure_password"
  }
  ```

## Seguridad y Headers

- **Content-Type**: `application/json`
- **Authorization**: `Bearer <accessToken>` para rutas protegidas.
- **CORS**: Solo dominios autorizados de la aplicación web.
