# Tareas: Especificaciones Generales y Autenticación (001)

**Entrada**: Documentos de diseño de `/specs/001-especificaciones-no-funcionales/`
**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/ | **Depende de**: spec 000 (monorepo), spec 002 (schema Prisma)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (diferentes archivos, sin dependencias)
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3, US4)

---

## Fase 1: Configuración (Prerrequisitos de Auth)

- [x] T001 Verificar que `packages/database/schema.prisma` incluye modelos `Usuario`, `Sesion` y `TokenRecuperacion` (spec 002)
- [x] T002 Añadir variables de entorno a `apps/api/.env`: `JWT_SECRET`, `JWT_EXPIRATION`, `REFRESH_TOKEN_SECRET`
- [x] T003 [P] Añadir variable `RESEND_API_KEY` a `apps/api/.env` para envío de correos de recuperación

---

## Fase 2: Fundacional (Módulo de Auth en Backend)

**⚠️ CRÍTICO**: No puede comenzar el trabajo en historias de usuario hasta que esta fase esté completa.

- [x] T004 Crear `AuthModule` en `apps/api/src/auth/auth.module.ts`
- [x] T005 Implementar `AuthService` con lógica de login, hashing (`bcrypt`, cost 12) y emisión de JWT en `apps/api/src/auth/auth.service.ts`
- [x] T006 [P] Crear `JwtStrategy` (Passport) para validación de Bearer Token en rutas protegidas en `apps/api/src/auth/strategies/jwt.strategy.ts`
- [x] T007 [P] Crear esquemas Zod de login y registro en `packages/shared/src/schemas/auth.schema.ts`
- [x] T008 Implementar `RateLimitGuard` (5 intentos / 15 min bloqueo) en `apps/api/src/auth/guards/rate-limit.guard.ts`

**Punto de control**: Módulo de autenticación funcional y protegido contra fuerza bruta.

---

## Fase 3: Historia de Usuario 1 — Estructura del Proyecto (P1)

**Objetivo**: Verificar que la estructura de carpetas del monorepo está correctamente separada (backend/frontend).

- [x] T009 [US1] Validar que existen `apps/web/`, `apps/api/`, `packages/shared/`, `packages/database/` con sus README.md
- [x] T010 [US1] Configurar rutas de autenticación en Next.js App Router: `apps/web/src/app/(auth)/layout.tsx`

---

## Fase 4: Historia de Usuario 2 — Login (P1)

**Objetivo**: Flujo completo de login con correo y contraseña, generación de JWT y acceso a rutas protegidas.

**Prueba Independiente**: POST `/auth/login` con credenciales válidas retorna JWT; con inválidas retorna error genérico.

- [x] T011 [US2] Implementar endpoint `POST /auth/login` en `apps/api/src/auth/auth.controller.ts`
- [x] T012 [P] [US2] Crear pantalla de Login en `apps/web/src/app/(auth)/login/page.tsx` con formulario Zod + React Hook Form
- [x] T013 [US2] Implementar lógica de redirección post-login por rol en `apps/web/src/middleware.ts`
- [x] T014 [US2] Añadir registro al sistema de auditoría (spec 012) en intentos de login fallidos

---

## Fase 5: Historia de Usuario 3 — Recordar Contraseña (P2)

**Objetivo**: Refresh token persistente almacenado en HttpOnly cookie (NO en localStorage).

- [x] T015 [US3] Implementar endpoint `POST /auth/refresh` para renovar access token con refresh token
- [x] T016 [US3] Configurar cookie `HttpOnly`, `Secure`, `SameSite=Strict` en `apps/api/src/auth/auth.controller.ts`
- [x] T017 [P] [US3] Añadir checkbox "Recordarme" al formulario de login con lógica de expiración extendida

---

## Fase 6: Historia de Usuario 4 — Reset de Contraseña (P2)

**Objetivo**: Flujo de recuperación de contraseña mediante token de un solo uso con expiración de 1 hora.

- [x] T018 [US4] Implementar endpoint `POST /auth/forgot-password` (respuesta genérica siempre 200)
- [x] T019 [US4] Implementar endpoint `POST /auth/reset-password` con validación de token y expiración
- [x] T020 [P] [US4] Crear pantalla `apps/web/src/app/(auth)/forgot-password/page.tsx`
- [x] T021 [P] [US4] Crear pantalla `apps/web/src/app/(auth)/reset-password/page.tsx` con validación de token en URL
- [x] T022 [US4] Integrar envío de correo con Resend en `apps/api/src/auth/email.service.ts`

---

## Fase 7: Pulido y Temas Transversales

- [x] T023 [P] Documentar todos los endpoints de auth con decoradores Swagger en `auth.controller.ts`
- [x] T024 Ejecutar validación del quickstart.md: login, logout, forgot-password, reset-password
- [x] T025 Verificar que Probacionistas reciben error de acceso bloqueado al intentar login
