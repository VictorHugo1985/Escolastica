'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import SchoolIcon from '@mui/icons-material/School';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface AsistenciaResumen {
  inscripcion_id: string;
  clase: { id: string; materia: { id: string; nombre: string } };
  total_sesiones: number;
  presentes: number;
  ausentes: number;
  licencias: number;
  porcentaje: number;
}

export default function KardexPage() {
  const [asistencias, setAsistencias] = useState<AsistenciaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me/asistencias')
      .then(({ data }) => setAsistencias(data))
      .catch(() => setError('Error al cargar el kardex'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Mi Kardex" subtitle="Resumen de asistencias por materia" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : asistencias.length === 0 ? (
        <Alert severity="info">No tenés materias inscritas con sesiones registradas.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {asistencias.map((a) => (
            <Card key={a.inscripcion_id} elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SchoolIcon color="primary" fontSize="small" />
                  <Typography variant="h6" component="span">{a.clase.materia.nombre}</Typography>
                  <Chip
                    label={`${a.porcentaje}%`}
                    size="small"
                    color={a.porcentaje >= 75 ? 'success' : a.porcentaje >= 50 ? 'warning' : 'error'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={a.porcentaje}
                  color={a.porcentaje >= 75 ? 'success' : a.porcentaje >= 50 ? 'warning' : 'error'}
                  sx={{ mb: 1.5, height: 8, borderRadius: 4 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sesiones: <strong>{a.total_sesiones}</strong>
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Presentes: <strong>{a.presentes}</strong>
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Ausentes: <strong>{a.ausentes}</strong>
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    Licencias: <strong>{a.licencias}</strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
