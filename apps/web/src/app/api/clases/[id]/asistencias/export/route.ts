import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleError, ApiError } from '@/lib/route';

const FILL: Record<string, ExcelJS.Fill> = {
  Presente: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } },
  Ausente:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6666' } },
  Licencia: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } },
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function fmtFecha(date: Date): string {
  const d = date.getUTCDate().toString().padStart(2, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const y = date.getUTCFullYear().toString().slice(2);
  return `${d}/${m}/${y}`;
}

function fmtFechaLarga(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

function fmtHora(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function addInfoRow(sheet: ExcelJS.Worksheet, label: string, value: string) {
  const row = sheet.addRow([label, value]);
  row.getCell(1).font = { bold: true };
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);

    const clase = await prisma.clases.findUnique({
      where: { id: params.id },
      include: {
        materia: { select: { nombre: true } },
        instructor: { select: { nombre_completo: true } },
        horarios: { include: { aula: { select: { nombre: true } } }, orderBy: { dia_semana: 'asc' } },
      },
    });
    if (!clase) throw new ApiError('Clase no encontrada', 404);

    const [sesiones, inscripciones, tipoNotaLabels] = await Promise.all([
      prisma.sesiones.findMany({
        where: { clase_id: params.id },
        orderBy: { fecha: 'asc' },
        select: { id: true, fecha: true, tipo: true, temas: { include: { tema: { select: { titulo: true } } } } },
      }),
      prisma.inscripciones.findMany({
        where: { clase_id: params.id },
        select: {
          estado: true,
          fecha_baja: true,
          motivo_baja: true,
          usuario: { select: { nombre_completo: true } },
          asistencias: { select: { sesion_id: true, estado: true } },
          notas_finales: { select: { tipo_nota: true, valor: true }, orderBy: { created_at: 'asc' } },
        },
        orderBy: [{ estado: 'asc' }, { usuario: { nombre_completo: 'asc' } }],
      }),
      prisma.enum_valores.findMany({
        where: { categoria: { nombre: 'TipoNotaFinal' } },
        select: { codigo: true, etiqueta: true },
      }),
    ]);

    const labelMap = Object.fromEntries(tipoNotaLabels.map((v) => [v.codigo, v.etiqueta]));
    const ultimaSesion = sesiones.length > 0 ? sesiones[sesiones.length - 1].fecha : null;

    const horarioStr = clase.horarios.map((h) => {
      const dia = DIAS[h.dia_semana] ?? h.dia_semana;
      const aula = h.aula ? ` (${h.aula.nombre})` : '';
      return `${dia} ${fmtHora(h.hora_inicio)} - ${fmtHora(h.hora_fin)}${aula}`;
    }).join(' · ') || '—';

    const aulasStr = Array.from(new Set(
      clase.horarios.map((h) => h.aula?.nombre).filter((n): n is string => !!n)
    )).join(', ') || '—';

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencias');

    // Set first two columns width for header section
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 38;

    // --- Class info header ---
    const titleRow = sheet.addRow([`${clase.codigo} — ${clase.materia.nombre}`]);
    titleRow.font = { bold: true, size: 13 };
    titleRow.height = 22;

    sheet.addRow([]);

    addInfoRow(sheet, 'Instructor', clase.instructor.nombre_completo);
    addInfoRow(sheet, 'Fecha inicio', fmtFechaLarga(new Date(clase.fecha_inicio)));
    addInfoRow(sheet, 'Última sesión', ultimaSesion ? fmtFechaLarga(new Date(ultimaSesion)) : '—');
    addInfoRow(sheet, 'Aula', aulasStr);
    addInfoRow(sheet, 'Horario', horarioStr);

    sheet.addRow([]);

    const INFO_ROWS = 8; // title + blank + 5 info rows + blank separator

    // Adjust session columns to their real widths (after we know how many there are)
    sheet.getColumn(1).width = 32;
    for (let i = 2; i <= sesiones.length + 1; i++) sheet.getColumn(i).width = 14;
    sheet.getColumn(sesiones.length + 2).width = 42;

    // --- Column header row ---
    const headerValues: string[] = ['Alumno'];
    for (const s of sesiones) {
      const lines = [fmtFecha(new Date(s.fecha)), s.tipo];
      const temasTitulos = s.temas.map((t) => t.tema.titulo).join(', ');
      if (temasTitulos) lines.push(temasTitulos);
      headerValues.push(lines.join('\n'));
    }
    headerValues.push('Notas finales');

    const hRow = sheet.addRow(headerValues);
    hRow.font = { bold: true };
    hRow.height = sesiones.some((s) => s.temas.length > 0) ? 46 : 30;
    hRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    hRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };

    // --- Data rows ---
    for (const insc of inscripciones) {
      const esBaja = insc.estado === 'Baja';
      const asistMap = Object.fromEntries(insc.asistencias.map((a) => [a.sesion_id, a.estado]));

      let notasParts = insc.notas_finales
        .map((n) => `${labelMap[n.tipo_nota] ?? n.tipo_nota}: ${n.valor}`);
      if (esBaja) {
        const fechaBajaStr = insc.fecha_baja
          ? new Date(insc.fecha_baja).toLocaleDateString('es-AR', { timeZone: 'UTC' })
          : '';
        const bajaParts = ['BAJA', insc.motivo_baja, fechaBajaStr].filter(Boolean);
        notasParts = [bajaParts.join(' · '), ...notasParts];
      }

      const rowValues: string[] = [insc.usuario.nombre_completo];
      for (const s of sesiones) rowValues.push(asistMap[s.id] ?? '');
      rowValues.push(notasParts.join(' | '));

      const dataRow = sheet.addRow(rowValues);

      if (esBaja) {
        dataRow.getCell(1).font = { strike: true, color: { argb: 'FF888888' } };
        dataRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }

      sesiones.forEach((s, idx) => {
        const estado = asistMap[s.id];
        const cell = dataRow.getCell(idx + 2);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (!esBaja && estado && FILL[estado]) cell.fill = FILL[estado];
      });
    }

    // Freeze first column + header row (accounts for info rows above)
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: INFO_ROWS + 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const fecha = new Date().toISOString().split('T')[0];
    const nombre = clase.codigo.replace(/[^a-zA-Z0-9-]/g, '-');
    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="asistencias-${nombre}-${fecha}.xlsx"`,
      },
    });
  } catch (e) { return handleError(e); }
}
