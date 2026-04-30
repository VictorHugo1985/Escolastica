import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Hash bcrypt (12 rounds) de contraseña "123" — solo para desarrollo
const PASSWORD_HASH = '$2b$12$Q4iZkyrcLtf4c0RyAw9G6uF2tcmbuhZI.MmTlFK4MWjdH1.RGnTHy'

async function crearUsuarioEscol(
  email: string,
  nombre: string,
  rolId: string,
) {
  const user = await prisma.usuarios.upsert({
    where: { email },
    update: { password_hash: PASSWORD_HASH, nombre_completo: nombre, estado: 'Activo' },
    create: { email, nombre_completo: nombre, password_hash: PASSWORD_HASH, estado: 'Activo' },
  })

  await prisma.usuario_roles.upsert({
    where: { usuario_id_rol_id: { usuario_id: user.id, rol_id: rolId } },
    update: {},
    create: { usuario_id: user.id, rol_id: rolId },
  })

  console.log(`  ✓ ${nombre} <${email}>`)
  return user
}

async function main() {
  console.log('Iniciando seeding...\n')

  // ── 1. Roles ────────────────────────────────────────────────────────────────
  const ROLES = ['Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExProbacionista', 'ExMiembro']

  for (const nombre of ROLES) {
    await prisma.roles.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }
  console.log('Roles: OK')

  const rolEscol = await prisma.roles.findUniqueOrThrow({ where: { nombre: 'Escolastico' } })

  // ── 2. Usuarios Escolásticos iniciales ──────────────────────────────────────
  console.log('Usuarios:')
  await crearUsuarioEscol('esco.fantastica@gmail.com', 'Escolastica', rolEscol.id)
  await crearUsuarioEscol('victor.hpp@gmail.com', 'Victor Hugo Parada Paz', rolEscol.id)

  console.log('\nSeeding completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
