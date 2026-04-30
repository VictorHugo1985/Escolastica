import { NextRequest } from 'next/server';
import { requireAuth, requireRole, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const csv = [
      'nombre_completo,email,telefono,ci,fecha_nacimiento,genero,estado,fecha_inscripcion',
      'Juan Perez,juan.perez@ejemplo.com,1134567890,12345678,1990-05-15,Masculino,Activo,2024-03-01',
      'Maria Garcia,maria.garcia@ejemplo.com,,,1985-11-30,Femenino,,',
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="usuarios-plantilla.csv"',
      },
    });
  } catch (e) { return handleError(e); }
}
