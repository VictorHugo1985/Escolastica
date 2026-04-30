# Investigación: Autenticación y Gestión de Sesiones

## Decisiones Técnicas

### Estrategia de Autenticación
- **Decisión**: Utilizar JWT (JSON Web Tokens) gestionados localmente por el backend (Nest.js) con almacenamiento de usuarios en la base de datos de Supabase (vía Prisma).
- **Justificación**: Se alinea con las Specs 001 y 002 que requieren gestión local alineada con el modelo de datos. Permite un control total sobre el flujo de reset de contraseña y bloqueo por fuerza bruta.
- **Alternativas**: Supabase Auth (descartado por requerimiento de gestión local en Spec 000).

### Almacenamiento Seguro de Credenciales (Recuérdame)
- **Decisión**: El frontend utilizará un esquema de "Refresh Tokens" almacenados en `HttpOnly Cookies` para las sesiones, y el "Recordar contraseña" se implementará mediante un token persistente de larga duración, NO almacenando la contraseña real.
- **Justificación**: Cumple con FR-003 y SC-005. Almacenar contraseñas reales en `LocalStorage` es un riesgo de seguridad crítico.
- **Alternativas**: `LocalStorage` (inseguro contra ataques XSS).

### Prevención de Fuerza Bruta
- **Decisión**: Implementar un middleware de `Rate Limiting` en el endpoint de login y un contador de intentos fallidos en la tabla de usuarios.
- **Justificación**: Cumple con FR-004 y las restricciones de seguridad de la Constitución.
- **Acción**: Bloqueo temporal de 15 minutos tras 5 intentos fallidos.

### Recuperación de Contraseña
- **Decisión**: Generación de un token UUID v4 almacenado en una tabla `password_reset_tokens` con expiración de 1 hora.
- **Justificación**: Proceso estándar de la industria que garantiza seguridad y un solo uso (FR-005).

## Mejores Prácticas de Seguridad

### Hashing de Contraseñas
- Utilizar `bcrypt` con un factor de costo de 10 o 12.
- Nunca almacenar contraseñas en texto plano.

### Comunicación Segura
- Todas las cookies de sesión deben tener los flags `Secure`, `HttpOnly` y `SameSite=Strict`.
- Implementar validación estricta de dominios permitidos (CORS).

### Validación de Datos (Zod)
- Las reglas de complejidad de contraseña (mínimo 8 caracteres, 1 número, 1 símbolo) se definirán en `packages/shared` para validación inmediata en el frontend y redundante en el backend.
