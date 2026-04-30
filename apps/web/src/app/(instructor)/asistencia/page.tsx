'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { api } from '@/lib/api';

interface ClaseHoy {
  id: string;
  codigo: string;
  materia: { id: string; nombre: string };
  instructor: { id: string; nombre_completo: string };
  horarios: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
  _count: { inscripciones: number };
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatHora(time: string) {
  const d = new Date(`1970-01-01T${time}`);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isToday(date: Date) {
  const hoy = new Date();
  return date.getFullYear() === hoy.getFullYear() &&
    date.getMonth() === hoy.getMonth() &&
    date.getDate() === hoy.getDate();
}

export default function AsistenciaPage() {
  const router = useRouter();
  const [fecha, setFecha] = useState(() => new Date());
  const [clases, setClases] = useState<ClaseHoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback((f: Date) => {
    setLoading(true);
    setError('');
    /*setClases([]);*/
    api.get('/clases/hoy', { params: { fecha: toLocalISO(f) } })
      .then(({ data }) => setClases(data))
      .catch(() => setError('Error al cargar las clases del día'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(fecha); }, [fecha, cargar]);

  const handleSelect = async (claseId: string) => {
    try {
      const { data } = await api.post(`/clases/${claseId}/sesiones`, {
        fecha: toLocalISO(fecha),
      });
      router.push(`/asistencia/${claseId}?sesionId=${data.id}`);
    } catch {
      setError('Error al iniciar la sesión');
    }
  };

  const diaStr = `${DIAS[fecha.getDay()]} ${fecha.toLocaleDateString('es-AR')}`;
  const esHoy = isToday(fecha);

  const irDia = (delta: number) => {
    setFecha(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Pase de lista</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <IconButton size="small" onClick={() => irDia(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" color={esHoy ? 'primary.main' : 'text.secondary'} fontWeight={esHoy ? 600 : 400} sx={{ minWidth: 160, textAlign: 'center' }}>
            {esHoy ? `Hoy — ${diaStr}` : diaStr}
          </Typography>
          <IconButton size="small" onClick={() => irDia(1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : clases.length === 0 ? (
        <Alert severity="info">No hay clases programadas para este día.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clases.map((clase) => (
            <Card key={clase.id} elevation={2}>
              <CardActionArea onClick={() => handleSelect(clase.id)} sx={{ p: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" component="span">{clase.materia.nombre}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Código: {clase.codigo}
                  </Typography>
                  {clase.horarios.map((h, i) => (
                    <Chip
                      key={i}
                      size="small"
                      label={`${formatHora(h.hora_inicio)} - ${formatHora(h.hora_fin)}`}
                      sx={{ mr: 1 }}
                    />
                  ))}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {clase._count.inscripciones} alumnos activos
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
