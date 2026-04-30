# Quickstart: Implementing Multiple Roles

## 1. Database Migration
1. Update `packages/database/schema.prisma` to include the `UsuarioRole` model.
2. Replace `rol_id` in the `User` model with a relation to `UsuarioRole`.
3. Run `npx prisma migrate dev --name transition_to_multi_role`.

## 2. Backend Implementation (NestJS)
1. Update `JwtStrategy` to extract an array of roles from the payload.
2. Refactor `RolesGuard` to support array-based permission checks.
3. Implement `POST /users/:id/roles` and `DELETE /users/:id/roles/:id` in `UsersController`.
4. Implement `POST /auth/refresh` to re-issue tokens with updated roles.

## 3. Frontend Implementation (Next.js)
1. Add a global Axios interceptor to handle `401 Unauthorized` by calling `/auth/refresh`.
2. Update the `AuthContext` to store and expose the `roles` array.
3. Create the `RoleChip` component to display roles hierarchically.
4. Update the User Management form to allow multiple role selection.
