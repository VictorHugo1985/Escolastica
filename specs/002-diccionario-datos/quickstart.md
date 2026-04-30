# Inicio Rápido: Base de Datos y Diccionario (002)

## Configuración de Prisma

El esquema central de la base de datos reside en `packages/database/schema.prisma`.

### Requisitos Previos
- Configurar `packages/database/.env` con `DATABASE_URL` (puerto 6543 para pooler) y `DIRECT_URL` (puerto 5432 para migraciones).
- Asegurarse de que el password de la base de datos no contenga corchetes `[]` en el URI.

## Comandos Principales (desde la raíz)

1. **Instalar Dependencias**:
   ```bash
   cd packages/database
   npm install
   ```

2. **Validar Esquema**:
   ```bash
   npx prisma validate
   ```

3. **Generar el Cliente de Prisma**:
   ```bash
   npx prisma generate
   ```

4. **Aplicar Migraciones (Desarrollo)**:
   Aplica los cambios estructurales a la base de datos de Supabase.
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Cargar Datos Iniciales (Seed)**:
   Pobla la base de datos con roles (`Escolastico`, `Instructor`, `Miembro`, `Probacionista`, `Ex-miembro`) y configuraciones base.
   *(Requiere implementar `seed.ts`)*

6. **Visualizar Datos (Prisma Studio)**:
   ```bash
   npx prisma studio
   ```

## Notas de Supabase
- Si el comando de migración falla por tiempo de espera, verificar que el puerto `5432` esté abierto en la red local o usar el pooling en puerto `6543`.
