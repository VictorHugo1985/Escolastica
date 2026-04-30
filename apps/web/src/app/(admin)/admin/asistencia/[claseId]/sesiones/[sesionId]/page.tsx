'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

type Estado = 'Presente' | 'Ausente' | 'Licencia';
type TipoSesion = 'Clase' | 'Examen' | 'Practica' | 'Repaso';

interface AlumnoRow {
  inscripcion_id: string;
  usuario: { id: string; nombre_completo: string };
  estado: Estado;
  asistencia_id: string | null;
}

interface SesionInfo {
  id: string;
  fecha: string;
  tipo: TipoSesion;
  comentarios: string | null;
  tema: { id: string; titulo: string } | null;
}

interface ClaseInfo {
  codigo: string;
  materia: { id: string; nombre: string };
  instructor: { nombre_completo: string };
}

interface Tema {
  id: string;
  titulo: string;
  orden: number;
}

const ESTADOS: Estado[] = ['Ausente', 'Presente', 'Licencia'];
const TIPOS: TipoSesion[] = ['Clase', 'Examen', 'Practica', 'Repaso'];
const TIPOS_LABEL: Record<TipoSesion, string> = {
  Clase: 'Clase',
  Examen: 'Examen',
  Practica: 'Práctica',
  Repaso: 'Repaso',
};

const estadoColor: Record<Estado, 'success' | 'error' | 'warning'> = {
  Presente: 'success',
  Ausente: 'error',
  Licencia: 'warning',
};

const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatFechaCompleta(fechaStr: string): string {
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${DIAS_LARGO[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`;
}

function nextEstado(current: Estado): Estado {
  const idx = ESTADOS.indexOf(current);
  return ESTADOS[(idx + 1) % ESTADOS.length];
}

export default function PaseListaSesionPage() {
  const { claseId, sesionId } = useParams<{ claseId: string; sesionId: string }>();
  const router = useRouter();

  const [clase, setClase] = useState<ClaseInfo | null>(null);
  const [sesion, setSesion] = useState<SesionInfo | null>(null);
  const [rows, setRows] = useState<AlumnoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSesion, setSavingSesion] = useState(false);
  const [successSesion, setSuccessSesion] = useState(false);
  const [error, setError] = useState('');

  const [tipo, setTipo] = useState<TipoSesion>('Clase');
  const [comentarios, setComentarios] = useState('');
  const [fechaEdit, setFechaEdit] = useState('');
  const [temaId, setTemaId] = useState<string>('');
  const [temas, setTemas] = useState<Tema[]>([]);

  const rowsRef = useRef<AlumnoRow[]>([]);
  const lastChangedRef = useRef<string | null>(null);
  const autoSaveRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    // Critical: clase header + attendance list
    Promise.all([
      api.get(`/clases/${claseId}`),
      api.get(`/clases/${claseId}/sesiones/${sesionId}/asistencias`),
    ])
      .then(([resClase, resAsistencias]) => {
        setClase(resClase.data);
        setRows(resAsistencias.data);
        // Load temas for this materia
        const materiaId = resClase.data?.materia?.id;
        if (materiaId) {
          api.get(`/materias/${materiaId}/temas`)
            .then(({ data: t }) => setTemas(t))
            .catch(() => {});
        }
      })
      .catch(() => setError('Error al cargar los datos de la sesión'))
      .finally(() => setLoading(false));

    // Non-blocking: session metadata for header date + editor fields
    api.get(`/clases/${claseId}/sesiones/${sesionId}`)
      .then(({ data }) => {
        setSesion(data);
        setTipo(data.tipo ?? 'Clase');
        setComentarios(data.comentarios ?? '');
        setFechaEdit(data.fecha ? new Date(data.fecha).toISOString().split('T')[0] : '');
        setTemaId(data.tema?.id ?? '');
      })
      .catch(() => {});
  }, [claseId, sesionId]);

  const autoSave = useCallback(async (inscripcionId: string) => {
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

  const guardarSesion = async () => {
    setSavingSesion(true);
    setError('');
    try {
      await api.patch(`/clases/${claseId}/sesiones/${sesionId}`, {
        tipo,
        comentarios: comentarios || null,
        tema_id: temaId || null,
        ...(fechaEdit && { fecha: fechaEdit }),
      });
      setSuccessSesion(true);
      setTimeout(() => setSuccessSesion(false), 3000);
    } catch {
      setError('Error al guardar los cambios de la sesión');
    } finally {
      setSavingSesion(false);
    }
  };

  const presentes = rows.filter((r) => r.estado === 'Presente').length;
  const subtitle = sesion ? formatFechaCompleta(sesion.fecha) : '';

  return (
    <>
      <PageHeader
        title={clase?.codigo ?? 'Pase de lista'}
        subtitle={subtitle}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/admin/asistencia/${claseId}`)}>
            Sesiones
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 680 }}>
          {/* Attendance section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Chip label={`${presentes}/${rows.length} presentes`} color="primary" size="small" />
              <Button size="small" variant="outlined" onClick={marcarTodosPresentes}>
                Todos presentes
              </Button>
            </Box>

            {rows.length === 0 ? (
              <Alert severity="info">Esta clase no tiene alumnos inscritos activos.</Alert>
            ) : (
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
                      '&:hover': { bgcolor: 'action.hover' },
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
            )}

          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Session metadata section */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Datos de la sesión
            </Typography>

            <TextField
              label="Fecha de la sesión"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={fechaEdit}
              onChange={(e) => setFechaEdit(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de sesión</InputLabel>
              <Select
                value={tipo}
                label="Tipo de sesión"
                onChange={(e) => setTipo(e.target.value as TipoSesion)}
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t} value={t}>{TIPOS_LABEL[t]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tema cursado</InputLabel>
              <Select
                value={temaId}
                label="Tema cursado"
                onChange={(e) => setTemaId(e.target.value)}
              >
                <MenuItem value=""><em>Sin tema asignado</em></MenuItem>
                {temas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Comentarios (opcional)"
              multiline
              rows={3}
              fullWidth
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ mb: 2 }}
            />

            {successSesion && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 1 }}>
                Cambios de sesión guardados
              </Alert>
            )}

            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={savingSesion ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={guardarSesion}
              disabled={savingSesion}
            >
              {savingSesion ? 'Guardando...' : 'Guardar cambios de sesión'}
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
}
