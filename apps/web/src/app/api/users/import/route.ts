import { NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rolNombre = (formData.get('rolNombre') as string) ?? 'Probacionista';

    if (!file) throw new ApiError('Se requiere un archivo CSV', 400);

    const rol = await prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new ApiError(`Rol "${rolNombre}" no existe`, 400);

    const buffer = Buffer.from(await file.arrayBuffer());

    let rows: Record<string, string>[];
    try {
      rows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      throw new ApiError('El archivo CSV no pudo ser procesado', 400);
    }

    if (rows.length === 0) throw new ApiError('El archivo CSV no contiene datos', 400);
    if (!('nombre_completo' in rows[0]) || !('email' in rows[0])) throw new ApiError('El CSV debe tener columnas: nombre_completo, email', 400);

    const resultado = { total: rows.length, creados: 0, duplicados: 0, errores: 0, filas_fallidas: [] as any[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nombre = (row['nombre_completo'] ?? '').trim();
      const email = (row['email'] ?? '').trim();
      const falla = (r: string, motivo: string) => { resultado.filas_fallidas.push({ fila_numero: i + 1, nombre, email, resultado: r, motivo }); };

      if (!nombre) { resultado.errores++; falla('error', 'nombre_completo es requerido'); continue; }
      if (!email) { resultado.errores++; falla('error', 'email es requerido'); continue; }

      const existing = await prisma.usuarios.findUnique({ where: { email } });
      if (existing) { resultado.duplicados++; falla('duplicado', 'El email ya existe'); continue; }

      const estadoRaw = row['estado']?.trim();
      const estado = ['Activo', 'Inactivo'].includes(estadoRaw) ? estadoRaw as any : 'Activo';

      try {
        const user = await prisma.usuarios.create({
          data: {
            nombre_completo: nombre, email,
            telefono: row['telefono']?.trim() || null,
            ci: row['ci']?.trim() || null,
            genero: row['genero']?.trim() || null,
            fecha_nacimiento: row['fecha_nacimiento']?.trim() ? new Date(row['fecha_nacimiento'].trim()) : null,
            fecha_inscripcion: row['fecha_inscripcion']?.trim() ? new Date(row['fecha_inscripcion'].trim()) : null,
            estado,
          },
        });
        await prisma.usuario_roles.create({ data: { usuario_id: user.id, rol_id: rol.id } });
        auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'usuarios', valor_nuevo: { id: user.id, email, rol: rolNombre } });
        resultado.creados++;
      } catch {
        resultado.errores++;
        falla('error', 'Error al crear el usuario');
      }
    }

    return json(resultado);
  } catch (e) { return handleError(e); }
}
