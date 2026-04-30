'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface ClaseInfo {
  id: string;
  codigo: string;
  materia: { nombre: string };
  instructor: { nombre_completo: string };
  horarios: { dia_semana: number }[];
  inscripciones: unknown[];
}

interface Sesion {
  id: string;
  fecha: string;
  tipo: string;
  comentarios: string | null;
  tema: { id: string; titulo: string } | null;
  _count: { asistencias: number };
}

const TIPOS_LABEL: Record<string, string> = {
  Clase: 'Clase',
  Examen: 'Examen',
  Practica: 'Práctica',
  Repaso: 'Repaso',
};

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

function esSesionHoy(fechaStr: string): boolean {
  const hoy = new Date();
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  return year === hoy.getFullYear() && month - 1 === hoy.getMonth() && day === hoy.getDate();
}

export default function SesionesHubPage() {
  const { claseId } = useParams<{ claseId: string }>();
  const router = useRouter();

  const [clase, setClase] = useState<ClaseInfo | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/clases/${claseId}`),
      api.get(`/clases/${claseId}/sesiones`),
    ])
      .then(([resClase, resSesiones]) => {
        setClase(resClase.data);
        setSesiones(resSesiones.data);
      })
      .catch(() => setError('Error al cargar los datos de la clase'))
      .finally(() => setLoading(false));
  }, [claseId]);

  const sesionHoy = sesiones.find((s) => esSesionHoy(s.fecha));

  const handleIniciarHoy = async () => {
    if (sesionHoy) {
      router.push(`/admin/asistencia/${claseId}/sesiones/${sesionHoy.id}`);
      return;
    }
    setIniciando(true);
    setError('');
    try {
      const dia_semana = clase?.horarios?.[0]?.dia_semana;
      const fecha = dia_semana !== undefined ? getFechaParaSemana(dia_semana) : undefined;
      const { data } = await api.post(`/clases/${claseId}/sesiones`, fecha ? { fecha } : {});
      router.push(`/admin/asistencia/${claseId}/sesiones/${data.id}`);
    } catch {
      setError('Error al crear la sesión');
      setIniciando(false);
    }
  };

  const handleEliminar = async (sesion: Sesion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar la sesión del ${formatFechaCompleta(sesion.fecha)}? Esta acción no se puede deshacer y eliminará todas las asistencias registradas.`)) return;
    setEliminando(sesion.id);
    try {
      await api.delete(`/clases/${claseId}/sesiones/${sesion.id}`);
      setSesiones((prev) => prev.filter((s) => s.id !== sesion.id));
    } catch {
      setError('Error al eliminar la sesión');
    } finally {
      setEliminando(null);
    }
  };

  const subtitle = clase
    ? `${clase.materia.nombre} · ${clase.instructor.nombre_completo}`
    : '';

  return (
    <>
      <PageHeader
        title={clase?.codigo ?? 'Gestión de sesiones'}
        subtitle={subtitle}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/asistencia')}>
            Clases
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 680 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={iniciando ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleIniciarHoy}
            disabled={iniciando}
            sx={{ mb: 4, py: 1.5 }}
          >
            {iniciando
              ? 'Abriendo...'
              : sesionHoy
              ? 'Continuar sesión de hoy'
              : 'Iniciar Sesión'}
          </Button>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Historial de sesiones
          </Typography>

          {sesiones.length === 0 ? (
            <Alert severity="info">No hay sesiones registradas para esta clase.</Alert>
          ) : (
            <List disablePadding sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
              {sesiones.map((sesion, idx) => (
                <Box key={sesion.id}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={eliminando === sesion.id}
                        onClick={(e) => handleEliminar(sesion, e)}
                        sx={{ color: 'error.main', mr: 0.5 }}
                      >
                        {eliminando === sesion.id
                          ? <CircularProgress size={16} color="error" />
                          : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => router.push(`/admin/asistencia/${claseId}/sesiones/${sesion.id}`)}
                      sx={{ py: 1.5, pr: 6 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" fontWeight={500}>
                              {formatFechaCompleta(sesion.fecha)}
                            </Typography>
                            {esSesionHoy(sesion.fecha) && (
                              <Chip label="Hoy" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={TIPOS_LABEL[sesion.tipo] ?? sesion.tipo}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {sesion._count.asistencias}/{clase?.inscripciones?.length ?? '?'} presentes
                              </Typography>
                            </Box>
                            {sesion.tema && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Tema: {sesion.tema.titulo}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ArrowForwardIosIcon fontSize="small" sx={{ color: 'text.disabled', ml: 1 }} />
                    </ListItemButton>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      )}
    </>
  );
}
