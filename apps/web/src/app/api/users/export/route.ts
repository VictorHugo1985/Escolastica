import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const { searchParams } = new URL(req.url);
    const rol = searchParams.get('rol') ?? undefined;
    const estado = searchParams.get('estado') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const users = await prisma.usuarios.findMany({
      where: {
        ...(rol && { roles: { some: { rol: { nombre: rol } } } }),
        ...(estado && { estado: estado as any }),
        ...(search && { OR: [
          { nombre_completo: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ] }),
      },
      include: { roles: { include: { rol: true } } },
      orderBy: { nombre_completo: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Usuarios');
    sheet.columns = [
      { header: 'Nombre completo', key: 'nombre_completo', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'CI', key: 'ci', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Género', key: 'genero', width: 12 },
      { header: 'Fecha nacimiento', key: 'fecha_nacimiento', width: 18 },
      { header: 'Estado', key: 'estado', width: 10 },
      { header: 'Fecha inscripción', key: 'fecha_inscripcion', width: 18 },
      { header: 'Fecha recibimiento', key: 'fecha_recibimiento', width: 18 },
      { header: 'Roles', key: 'roles', width: 25 },
      { header: 'Creado el', key: 'created_at', width: 18 },
    ];

    for (const u of users) {
      sheet.addRow({
        nombre_completo: u.nombre_completo,
        email: u.email ?? '',
        ci: u.ci ?? '',
        telefono: u.telefono ?? '',
        genero: u.genero ?? '',
        fecha_nacimiento: u.fecha_nacimiento ? new Date(u.fecha_nacimiento).toLocaleDateString('es-AR') : '',
        estado: u.estado,
        fecha_inscripcion: u.fecha_inscripcion ? new Date(u.fecha_inscripcion).toLocaleDateString('es-AR') : '',
        fecha_recibimiento: u.fecha_recibimiento ? new Date(u.fecha_recibimiento).toLocaleDateString('es-AR') : '',
        roles: (u as any).roles?.map((r: any) => r.rol.nombre).join(', ') ?? '',
        created_at: new Date(u.created_at).toLocaleDateString('es-AR'),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fecha = new Date().toISOString().split('T')[0];
    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="usuarios-${fecha}.xlsx"`,
      },
    });
  } catch (e) { return handleError(e); }
}
