'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// Grid constants
const GRID_START = 18 * 60;       // 18:00 in minutes
const GRID_END   = 22 * 60 + 30;  // 22:30 in minutes
const GRID_DURATION = GRID_END - GRID_START; // 270 min
const SLOT_HEIGHT = 44;           // px per 30-min slot
const GRID_HEIGHT = (GRID_DURATION / 30) * SLOT_HEIGHT; // 396 px

const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; // dia_semana 1–6
const DIAS_COLS  = [1, 2, 3, 4, 5, 6];

const TIME_LABELS: string[] = [];
for (let m = GRID_START; m <= GRID_END; m += 30) {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  TIME_LABELS.push(`${h}:${min}`);
}

const INSTRUCTOR_COLORS = [
  '#1565C0', '#C62828', '#2E7D32', '#6A1B9A',
  '#E65100', '#00695C', '#4E342E', '#283593',
];

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula: { id: string; nombre: string } | null;
}

interface Clase {
  id: string;
  codigo: string;
  celador: string;
  materia: { nombre: string };
  instructor: { id: string; nombre_completo: string };
  horarios: Horario[];
}

interface SelectedBlock { clase: Clase; horario: Horario; }

interface BlockLayout {
  clase: Clase;
  horario: Horario;
  col: number;
  total: number;
}

function getUtcMinutes(timeStr: string): number {
  const d = timeStr.includes('T') ? new Date(timeStr) : new Date(`1970-01-01T${timeStr}Z`);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function formatHora(timeStr: string): string {
  const d = timeStr.includes('T') ? new Date(timeStr) : new Date(`1970-01-01T${timeStr}Z`);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function abreviarNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1][0]}.`;
}

function layoutBlocks(entries: Array<{ clase: Clase; horario: Horario }>): BlockLayout[] {
  return entries.map((entry) => {
    const startI = getUtcMinutes(entry.horario.hora_inicio);
    const endI   = getUtcMinutes(entry.horario.hora_fin);
    const group  = entries.filter((other) => {
      const s = getUtcMinutes(other.horario.hora_inicio);
      const e = getUtcMinutes(other.horario.hora_fin);
      return startI < e && endI > s;
    });
    return { ...entry, col: group.indexOf(entry), total: group.length };
  });
}

export default function CalendarioPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const esEscol = user?.roles.includes('Escolastico') ?? false;

  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SelectedBlock | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = { estado: 'Activa' };
    if (!esEscol && user?.id) params.instructor_id = user.id;
    api.get('/clases', { params })
      .then(({ data }) => setClases(data))
      .catch(() => setError('Error al cargar las clases'))
      .finally(() => setLoading(false));
  }, [esEscol, user?.id]);

  const instructorColors = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    for (const clase of clases) {
      if (!map[clase.instructor.id]) {
        map[clase.instructor.id] = INSTRUCTOR_COLORS[idx % INSTRUCTOR_COLORS.length];
        idx++;
      }
    }
    return map;
  }, [clases]);

  const classesByDay = useMemo(() => {
    const map: Record<number, Array<{ clase: Clase; horario: Horario }>> = {};
    for (const d of DIAS_COLS) map[d] = [];
    for (const clase of clases) {
      for (const horario of clase.horarios) {
        if (horario.dia_semana >= 1 && horario.dia_semana <= 6) {
          map[horario.dia_semana].push({ clase, horario });
        }
      }
    }
    return map;
  }, [clases]);

  const uniqueInstructors = useMemo(() =>
    clases.filter((c, i, arr) => arr.findIndex((x) => x.instructor.id === c.instructor.id) === i),
    [clases],
  );

  const TIME_COL_W = 44;
  const COL_MIN_W = 72;

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle={esEscol ? 'Todas las clases activas' : 'Mis clases activas'}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : clases.length === 0 ? (
        <Alert severity="info">No hay clases activas para mostrar.</Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          {/* Day headers */}
          <Box sx={{ display: 'flex', minWidth: 'fit-content' }}>
            <Box sx={{ width: TIME_COL_W, flexShrink: 0 }} />
            {DIAS_COLS.map((dia) => (
              <Box
                key={dia}
                sx={{
                  flex: 1, minWidth: COL_MIN_W, textAlign: 'center',
                  py: 0.75, borderLeft: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {DIAS_LABEL[dia - 1]}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grid body */}
          <Box sx={{ display: 'flex', minWidth: 'fit-content', borderTop: '1px solid', borderColor: 'divider' }}>
            {/* Time labels */}
            <Box sx={{ width: TIME_COL_W, flexShrink: 0, position: 'relative', height: GRID_HEIGHT }}>
              {TIME_LABELS.map((label, i) => (
                <Box key={label} sx={{ position: 'absolute', top: i * SLOT_HEIGHT - 7, right: 4 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Day columns */}
            {DIAS_COLS.map((dia) => (
              <Box
                key={dia}
                sx={{
                  flex: 1, minWidth: COL_MIN_W, height: GRID_HEIGHT,
                  position: 'relative', borderLeft: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                {/* Horizontal grid lines */}
                {TIME_LABELS.map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute', top: i * SLOT_HEIGHT,
                      left: 0, right: 0, borderTop: '1px solid',
                      borderColor: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)',
                    }}
                  />
                ))}

                {/* Class blocks — split width when overlapping */}
                {layoutBlocks(classesByDay[dia]).map(({ clase, horario, col, total }, idx) => {
                  const startMin = getUtcMinutes(horario.hora_inicio);
                  const endMin   = getUtcMinutes(horario.hora_fin);
                  const top    = ((startMin - GRID_START) / GRID_DURATION) * GRID_HEIGHT;
                  const height = ((endMin - startMin)     / GRID_DURATION) * GRID_HEIGHT;
                  const color  = esEscol ? instructorColors[clase.instructor.id] : INSTRUCTOR_COLORS[0];
                  const overlaps = total > 1;
                  const blockKey = `${clase.id}-${dia}-${idx}`;
                  const isActive = activeKey === blockKey;
                  const colW = `calc(${(1 / total) * 100}% - 3px)`;
                  const colL = `calc(${(col / total) * 100}% + 2px)`;
                  return (
                    <Box
                      key={blockKey}
                      onClick={() => { setActiveKey(blockKey); setSelected({ clase, horario }); }}
                      sx={{
                        position: 'absolute',
                        top,
                        left: colL,
                        width: colW,
                        height: Math.max(height - 2, 20),
                        bgcolor: color,
                        borderRadius: 1,
                        p: '3px 5px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        opacity: overlaps ? (isActive ? 1 : 0.65) : 0.88,
                        zIndex: isActive ? 2 : 1,
                        transition: 'opacity 0.15s, box-shadow 0.15s',
                        '&:hover': { opacity: 1, boxShadow: 3, zIndex: 2 },
                        userSelect: 'none',
                      }}
                    >
                      <Typography sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, fontSize: 11 }} noWrap>
                        {clase.materia.nombre}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, lineHeight: 1.2 }}>
                        {formatHora(horario.hora_inicio)}–{formatHora(horario.hora_fin)}
                      </Typography>
                      {height >= 56 && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, lineHeight: 1.2, mt: '1px' }} noWrap>
                          {abreviarNombre(clase.celador)}{horario.aula ? ` · ${horario.aula.nombre}` : ''}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Instructor legend — Escolástico only */}
          {esEscol && uniqueInstructors.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, pl: `${TIME_COL_W}px` }}>
              {uniqueInstructors.map((c) => (
                <Box key={c.instructor.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: instructorColors[c.instructor.id], flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">{c.instructor.nombre_completo}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Action modal */}
      <Dialog open={!!selected} onClose={() => { setSelected(null); setActiveKey(null); }} maxWidth="xs" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>{selected.clase.materia.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">{selected.clase.instructor.nombre_completo}</Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 0.5, pb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {DIAS_LABEL[selected.horario.dia_semana - 1]}
                {' · '}
                {formatHora(selected.horario.hora_inicio)}–{formatHora(selected.horario.hora_fin)}
                {selected.horario.aula ? ` · ${selected.horario.aula.nombre}` : ''}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => { router.push(`/admin/asistencia/${selected.clase.id}`); setSelected(null); setActiveKey(null); }}
              >
                Ir a pase de lista
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => { router.push(`/admin/clases/${selected.clase.id}`); setSelected(null); setActiveKey(null); }}
              >
                Ir a calificaciones
              </Button>
              <Button
                variant="text"
                fullWidth
                color="inherit"
                onClick={() => { router.push(`/admin/clases/${selected.clase.id}`); setSelected(null); setActiveKey(null); }}
              >
                Ver detalle de la clase
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
