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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

const NOTA_COLOR: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  Sobresaliente: 'success',
  Solido: 'info',
  Aprobado: 'warning',
  Reprobado: 'error',
};

function fmtFechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

interface AsistenciaResumen {
  inscripcion_id: string;
  clase: { id: string; codigo: string; estado: string; materia: { id: string; nombre: string } };
  nota_final: 'Sobresaliente' | 'Solido' | 'Aprobado' | 'Reprobado' | null;
  concluyo_temario: boolean;
  fecha_conclusion_temario: string | null;
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <SchoolIcon color="primary" fontSize="small" />
                  <Typography variant="h6" component="span" sx={{ flex: 1 }}>{a.clase.materia.nombre}</Typography>
                  <Chip
                    label={a.clase.estado}
                    size="small"
                    color={a.clase.estado === 'Activa' ? 'success' : a.clase.estado === 'Finalizada' ? 'default' : 'warning'}
                    variant="outlined"
                    sx={{ mr: 0.5 }}
                  />
                  <Chip
                    label={`${a.porcentaje}%`}
                    size="small"
                    color={a.porcentaje >= 75 ? 'success' : a.porcentaje >= 50 ? 'warning' : 'error'}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {a.clase.codigo}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={a.porcentaje}
                  color={a.porcentaje >= 75 ? 'success' : a.porcentaje >= 50 ? 'warning' : 'error'}
                  sx={{ mb: 1.5, height: 8, borderRadius: 4 }}
                />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {a.concluyo_temario
                      ? <CheckCircleIcon fontSize="small" color="success" />
                      : <CancelIcon fontSize="small" color="disabled" />}
                    <Typography variant="body2" color={a.concluyo_temario ? 'success.main' : 'text.disabled'}>
                      {a.concluyo_temario ? 'Concluyó temario' : 'Sin concluir temario'}
                    </Typography>
                    {a.concluyo_temario && a.fecha_conclusion_temario && (
                      <Typography variant="caption" color="text.secondary">
                        ({fmtFechaLarga(a.fecha_conclusion_temario)})
                      </Typography>
                    )}
                  </Box>
                  {a.nota_final && (
                    <Chip
                      label={`Nota: ${a.nota_final}`}
                      size="small"
                      color={NOTA_COLOR[a.nota_final] ?? 'default'}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
