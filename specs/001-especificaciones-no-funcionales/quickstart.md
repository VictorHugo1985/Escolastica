# Inicio Rápido: Autenticación (001)

## Configuración de Entorno

Para habilitar la autenticación, asegúrate de tener las siguientes variables en tu archivo `.env`:

```bash
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRATION=3600s
REFRESH_TOKEN_SECRET=otro_secreto_seguro
RESEND_API_KEY=re_tu_api_key_para_emails # Opcional para desarrollo
```

## Pruebas Locales

1. **Crear Usuario de Prueba**:
   Puedes usar el script de seed para crear un usuario administrador:
   ```bash
   npx turbo db:seed --filter=database
   ```

2. **Probar Login**:
   Usa una herramienta como Postman o Insomnia para enviar un POST a `http://localhost:3001/auth/login` con:
   ```json
   {
     "email": "admin@escolastica.com",
     "password": "Password123!"
   }
   ```

3. **Verificación de Token**:
   Copia el `accessToken` recibido y úsalo en el Header `Authorization: Bearer <token>` para acceder a rutas protegidas.

## Pantallas del Frontend

Las pantallas de autenticación se encuentran en `apps/web/src/app/(auth)/`:
- `/login`: Formulario de acceso.
- `/forgot-password`: Solicitud de recuperación.
- `/reset-password`: Cambio de contraseña con token.
