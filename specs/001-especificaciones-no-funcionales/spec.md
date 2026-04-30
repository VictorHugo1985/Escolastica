# Feature Specification: General Specifications (Project Structure and Login)

**Feature Branch**: `001-especificaciones-no-funcionales`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "001 Especificaciones Generales"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Project Structure (Priority: P1)

Como **desarrollador o administrador del sistema**, quiero establecer la estructura de directorios base del proyecto (backend desacoplado del frontend) siguiendo los principios de arquitectura por capas y Clean Code, para asegurar que el desarrollo sea escalable y organizado desde el inicio.

**Why this priority**: Es el cimiento técnico del proyecto. Sin una estructura clara que separe responsabilidades, el crecimiento del sistema se volverá inmanejable y violará los principios de la Constitución.

**Independent Test**: Verificar que tras la ejecución de la fase de setup, existan los directorios principales (e.g., `backend/`, `frontend/`, `docs/`, `specs/`) y que cada uno contenga los archivos de configuración base (README, .gitignore, etc.).

**Acceptance Scenarios**:

1. **Given** un repositorio inicializado, **When** se ejecuta el setup de la estructura, **Then** se crean las carpetas `backend/` y `frontend/` de forma independiente.
2. **Given** la nueva estructura, **When** se revisan los archivos base, **Then** cada directorio principal debe contener un `README.md` describiendo su propósito.

---

### User Story 2 - Login de usuario con correo (Priority: P1)

Como **instructor o escolastico**, quiero iniciar sesión de forma segura utilizando mi correo electrónico y contraseña para acceder a mis funcionalidades correspondientes según mi rol.

**Why this priority**: La autenticación es el control de acceso fundamental. Ninguna funcionalidad operativa (asistencias, notas, etc.) puede ser utilizada sin identificar al usuario y validar sus permisos.

**Independent Test**: Probar el flujo de autenticación local con credenciales válidas e inválidas, y verificar que se genere una sesión segura que persista en las rutas protegidas.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con correo y contraseña, **When** ingresa credenciales correctas, **Then** el sistema le otorga acceso y redirige a su dashboard inicial.
2. **Given** un usuario con sesión activa, **When** intenta acceder a una ruta protegida, **Then** el sistema permite el acceso sin solicitar relogin.
3. **Given** un intento de login con contraseña incorrecta, **When** el usuario envía el formulario, **Then** el sistema muestra un mensaje de error genérico y no permite el acceso.

---

### User Story 3 - Recordar credenciales (Priority: P2)

Como **usuario**, quiero tener la opción de que el sistema "recuerde" mi contraseña en mi dispositivo para no tener que ingresarla manualmente en cada sesión.

**Why this priority**: Mejora la experiencia de usuario (UX) al reducir la fricción en el acceso frecuente desde dispositivos personales.

**Independent Test**: Marcar la opción "Recordar contraseña" durante el login, cerrar la aplicación o sesión, y verificar que al volver al login la contraseña esté precargada o el acceso sea automático según la implementación de caché elegida.

**Acceptance Scenarios**:

1. **Given** la opción "Recordar contraseña" marcada, **When** el login es exitoso, **Then** el sistema almacena las credenciales de forma segura en el almacenamiento local del dispositivo.
2. **Given** credenciales cacheables, **When** el usuario regresa a la pantalla de login, **Then** los campos se autocompletan o el sistema permite el ingreso rápido.

---

### User Story 4 - Reset de contraseña por correo (Priority: P2)

Como **usuario**, quiero poder recuperar el acceso a mi cuenta si olvido mi contraseña a través de un proceso seguro de restablecimiento por correo electrónico.

**Why this priority**: Reduce la carga operativa de la Secretaría de Escolástica al permitir que los usuarios resuelvan problemas de acceso de forma autónoma.

**Independent Test**: Solicitar reset de contraseña, recibir el token por correo (o log en desarrollo) y verificar que el token permita cambiar la contraseña una sola vez dentro de su tiempo de validez.

**Acceptance Scenarios**:

1. **Given** un correo registrado, **When** el usuario solicita recuperar contraseña, **Then** recibe un enlace con un token de un solo uso.
2. **Given** un token expirado, **When** el usuario intenta usarlo, **Then** el sistema rechaza el cambio de contraseña.

---

### Edge Cases

- ¿Qué sucede si el usuario intenta loguearse con un correo no registrado? El sistema debe responder de forma genérica para no revelar existencia de cuentas.
- ¿Cómo maneja el sistema intentos de fuerza bruta en el login? Debe haber un límite de intentos antes de bloqueo temporal.
- ¿Qué sucede si la sesión expira por inactividad? El usuario debe ser redirigido al login automáticamente.
- Seguridad del caché: Las contraseñas cacheables deben estar cifradas o protegidas por el sistema operativo para evitar acceso no autorizado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer una estructura de carpetas que separe claramente el backend del frontend.
- **FR-002**: El sistema MUST permitir la autenticación de usuarios mediante correo electrónico y contraseña únicamente.
- **FR-003**: El sistema MUST permitir al usuario elegir si desea "cachear" o recordar su contraseña en el dispositivo.
- **FR-004**: El sistema MUST validar que las contraseñas cumplan con requisitos mínimos de seguridad (longitud, complejidad).
- **FR-005**: El sistema MUST implementar un flujo de recuperación de contraseña vía token enviado por correo electrónico.
- **FR-006**: El sistema MUST manejar sesiones seguras con expiración por inactividad.
- **FR-007**: El sistema MUST proteger todas las rutas operativas (asistencias, notas, materias) bajo autenticación previa.

### Key Entities *(include if feature involves data)*

- **Usuario**: Datos de identidad (email, hash de contraseña, rol: escolastico/instructor).
- **Sesión**: Datos de acceso activo (token, fecha expiración, id_usuario).
- **TokenRecuperación**: Token de un solo uso para reset de contraseña vinculado a un usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La estructura de directorios debe estar lista y validada en el repositorio en menos de 1 hora de implementación técnica.
- **SC-002**: El tiempo de respuesta para una validación de login debe ser inferior a 500ms en condiciones normales.
- **SC-003**: El 100% de las comunicaciones de autenticación deben realizarse sobre protocolos seguros (HTTPS/SSL).
- **SC-004**: Menos del 1% de falsos positivos en el bloqueo de cuentas por sospecha de fuerza bruta.
- **SC-005**: Las credenciales cacheadas deben estar almacenadas siguiendo estándares de seguridad del dispositivo (e.g., Secure Storage, Keychain).
