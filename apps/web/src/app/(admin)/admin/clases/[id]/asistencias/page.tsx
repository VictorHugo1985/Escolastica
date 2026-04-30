'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface ResumenAlumno {
  inscripcion_id: string;
  usuario: { id: string; nombre_completo: string };
  total_sesiones: number;
  presentes: number;
  ausentes: number;
  licencias: number;
  porcentaje: number;
}

interface SesionRow {
  id: string;
  fecha: string;
  tipo: string;
  _count: { asistencias: number };
}

export default function AsistenciasClasePage() {
  const { id: claseId } = useParams<{ id: string }>();
  const [resumen, setResumen] = useState<ResumenAlumno[]>([]);
  const [sesiones, setSesiones] = useState<SesionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        api.get(`/clases/${claseId}/asistencias/resumen`),
        api.get(`/clases/${claseId}/sesiones`),
      ]);
      setResumen(r.data);
      setSesiones(s.data);
    } catch {
      setError('Error al cargar el historial de asistencias');
    } finally {
      setLoading(false);
    }
  }, [claseId]);

  useEffect(() => { load(); }, [load]);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Alumno', flex: 1, valueGetter: (_: any, row: ResumenAlumno) => row.usuario.nombre_completo },
    { field: 'total_sesiones', headerName: 'Sesiones', width: 90 },
    { field: 'presentes', headerName: 'Presentes', width: 100 },
    { field: 'ausentes', headerName: 'Ausentes', width: 90 },
    { field: 'licencias', headerName: 'Licencias', width: 90 },
    {
      field: 'porcentaje',
      headerName: '% Asistencia',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value}%`}
          size="small"
          color={params.value >= 75 ? 'success' : params.value >= 50 ? 'warning' : 'error'}
        />
      ),
    },
  ];

  const totalSesiones = sesiones.length;
  const avgPct = resumen.length > 0
    ? Math.round(resumen.reduce((s, r) => s + r.porcentaje, 0) / resumen.length)
    : 0;

  return (
    <>
      <PageHeader
        title="Historial de asistencias"
        subtitle={`${totalSesiones} sesiones registradas · Promedio general: ${avgPct}%`}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>Resumen por alumno</Typography>
          <DataGrid
            rows={resumen}
            columns={columns}
            getRowId={(r) => r.inscripcion_id}
            disableRowSelectionOnClick
            autoHeight
            sx={{ mb: 4 }}
          />

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" sx={{ mb: 1 }}>Línea de tiempo de sesiones</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sesiones.map((s) => {
              const asistentes = s._count.asistencias;
              const total = resumen.length || 1;
              const pct = Math.round((asistentes / total) * 100);
              return (
                <Box
                  key={s.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    minWidth: 100,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" display="block" color="text.secondary">
                    {new Date(s.fecha).toLocaleDateString('es-AR')}
                  </Typography>
                  <Chip label={s.tipo} size="small" sx={{ my: 0.5 }} />
                  <Typography variant="body2" fontWeight="bold">
                    {pct}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </>
  );
}
