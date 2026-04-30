'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IconButton from '@mui/material/IconButton';
import { api } from '@/lib/api';

type Estado = 'Presente' | 'Ausente' | 'Licencia';

interface AlumnoRow {
  inscripcion_id: string;
  usuario: { id: string; nombre_completo: string };
  estado: Estado;
  asistencia_id: string | null;
}

interface ClaseInfo {
  codigo: string;
  materia: { nombre: string };
  horarios: { dia_semana: number }[];
}

interface SesionInfo {
  id: string;
  fecha: string;
}

const ESTADOS: Estado[] = ['Ausente', 'Presente', 'Licencia'];

const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatFechaCompleta(fechaStr: string): string {
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${DIAS_LARGO[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`;
}

function getFechaParaSemana(dia_semana: number): string {
  const hoy = new Date();
  const diff = dia_semana - hoy.getDay();
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() + diff);
  return fecha.toISOString().split('T')[0];
}

const estadoColor: Record<Estado, 'success' | 'error' | 'warning'> = {
  Presente: 'success',
  Ausente: 'error',
  Licencia: 'warning',
};

function nextEstado(current: Estado): Estado {
  const idx = ESTADOS.indexOf(current);
  return ESTADOS[(idx + 1) % ESTADOS.length];
}

function PaseListaContent() {
  const { claseId } = useParams<{ claseId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sesionId, setSesionId] = useState(searchParams.get('sesionId'));
  const [clase, setClase] = useState<ClaseInfo | null>(null);
  const [sesion, setSesion] = useState<SesionInfo | null>(null);
  const [rows, setRows] = useState<AlumnoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState('');

  const rowsRef = useRef<AlumnoRow[]>([]);
  const lastChangedRef = useRef<string | null>(null);
  const autoSaveRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    api.get(`/clases/${claseId}`).then(({ data }) => setClase(data)).catch(() => {});
  }, [claseId]);

  const load = useCallback(async (sid: string) => {
    try {
      const { data } = await api.get(`/clases/${claseId}/sesiones/${sid}/asistencias`);
      setRows(data);
    } catch {
      setError('Error al cargar la lista de alumnos');
    } finally {
      setLoading(false);
    }
    api.get(`/clases/${claseId}/sesiones/${sid}`)
      .then(({ data }) => setSesion(data))
      .catch(() => {});
  }, [claseId]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (sesionId) {
      load(sesionId);
    } else {
      setLoading(false);
    }
  }, [sesionId, load]);

  const iniciarSesion = async () => {
    setIniciando(true);
    setError('');
    try {
      const dia_semana = clase?.horarios?.[0]?.dia_semana;
      const fecha = dia_semana !== undefined ? getFechaParaSemana(dia_semana) : undefined;
      const { data } = await api.post(`/clases/${claseId}/sesiones`, fecha ? { fecha } : {});
      setSesionId(data.id);
      setSesion(data);
      setLoading(true);
      await load(data.id);
    } catch {
      setError('Error al iniciar la sesión');
    } finally {
      setIniciando(false);
    }
  };

  const autoSave = useCallback(async (inscripcionId: string) => {
    if (!sesionId) return;
    const row = rowsRef.current.find((r) => r.inscripcion_id === inscripcionId);
    if (!row) return;
    if (row.asistencia_id) {
      api.patch(`/clases/${claseId}/sesiones/${sesionId}/asistencias/${row.asistencia_id}`, {
        estado: row.estado,
      }).catch(() => {});
    } else {
      try {
        await api.post(`/clases/${claseId}/sesiones/${sesionId}/asistencias/bulk`, {
          asistencias: rowsRef.current.map((r) => ({ inscripcion_id: r.inscripcion_id, estado: r.estado })),
        });
        const { data } = await api.get(`/clases/${claseId}/sesiones/${sesionId}/asistencias`);
        setRows((prev) =>
          prev.map((r) => {
            const fresh = data.find((d: AlumnoRow) => d.inscripcion_id === r.inscripcion_id);
            return fresh ? { ...r, asistencia_id: fresh.asistencia_id } : r;
          }),
        );
      } catch {}
    }
  }, [claseId, sesionId]);

  useEffect(() => { autoSaveRef.current = autoSave; }, [autoSave]);

  useEffect(() => {
    return () => {
      if (lastChangedRef.current) autoSaveRef.current(lastChangedRef.current);
    };
  }, []);

  const toggle = (inscripcionId: string) => {
    if (lastChangedRef.current && lastChangedRef.current !== inscripcionId) {
      autoSave(lastChangedRef.current);
    }
    lastChangedRef.current = inscripcionId;
    setRows((prev) =>
      prev.map((r) =>
        r.inscripcion_id === inscripcionId ? { ...r, estado: nextEstado(r.estado) } : r,
      ),
    );
  };

  const marcarTodosPresentes = useCallback(async () => {
    lastChangedRef.current = null;
    const allPresentes = rowsRef.current.map((r) => ({ ...r, estado: 'Presente' as Estado }));
    setRows(allPresentes);
    if (!sesionId) return;
    try {
      await api.post(`/clases/${claseId}/sesiones/${sesionId}/asistencias/bulk`, {
        asistencias: allPresentes.map((r) => ({ inscripcion_id: r.inscripcion_id, estado: r.estado })),
      });
      if (allPresentes.some((r) => !r.asistencia_id)) {
        const { data } = await api.get(`/clases/${claseId}/sesiones/${sesionId}/asistencias`);
        setRows((prev) =>
          prev.map((r) => {
            const fresh = data.find((d: AlumnoRow) => d.inscripcion_id === r.inscripcion_id);
            return fresh ? { ...r, asistencia_id: fresh.asistencia_id } : r;
          }),
        );
      }
    } catch {}
  }, [claseId, sesionId]);

  const presentes = rows.filter((r) => r.estado === 'Presente').length;

  const fechaProgramada = clase?.horarios?.[0] !== undefined
    ? formatFechaCompleta(getFechaParaSemana(clase.horarios[0].dia_semana) + 'T00:00:00')
    : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={() => router.back()} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
            {clase?.codigo ?? 'Pase de lista'}
          </Typography>
          {clase && (
            <Typography variant="caption" color="text.secondary" display="block">
              {clase.materia.nombre}
            </Typography>
          )}
          {sesion && (
            <Typography variant="caption" color="primary.main" display="block" fontWeight={500}>
              {formatFechaCompleta(sesion.fecha)}
            </Typography>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : !sesionId ? (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {fechaProgramada
              ? `No hay sesión registrada para el ${fechaProgramada}. Iniciá el pase de lista para comenzar.`
              : 'No hay sesión activa. Iniciá el pase de lista para comenzar.'}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={iniciando ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={iniciarSesion}
            disabled={iniciando}
          >
            {iniciando ? 'Iniciando...' : 'Iniciar Sesión'}
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {presentes}/{rows.length} presentes
            </Typography>
            <Button variant="outlined" onClick={marcarTodosPresentes}>
              Todos presentes
            </Button>
          </Box>

          <List disablePadding>
            {rows.map((row) => (
              <ListItem
                key={row.inscripcion_id}
                onClick={() => toggle(row.inscripcion_id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  cursor: 'pointer',
                  '&:active': { opacity: 0.7 },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: 14 }}>
                    {row.usuario.nombre_completo.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={row.usuario.nombre_completo} />
                <Chip
                  label={row.estado}
                  color={estadoColor[row.estado]}
                  size="small"
                  sx={{ minWidth: 80 }}
                />
              </ListItem>
            ))}
          </List>

          {rows.length === 0 && (
            <Alert severity="info">Esta clase no tiene alumnos inscritos activos.</Alert>
          )}
        </>
      )}
    </Box>
  );
}

export default function PaseListaPage() {
  return (
    <Suspense>
      <PaseListaContent />
    </Suspense>
  );
}
