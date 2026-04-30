'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Movimiento {
  id: string;
  estado: string;
  fecha_inscripcion: string;
  fecha_baja: string | null;
  motivo_baja: string | null;
  concluyo_temario_materia: boolean;
  comentarios: string | null;
  clase: {
    id: string;
    codigo: string;
    materia: { nombre: string };
    instructor: { nombre_completo: string };
  };
}

interface Usuario {
  id: string;
  nombre_completo: string;
}

export default function MovimientosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [userRes, movRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/inscripciones', { params: { usuarioId: id } }),
        ]);
        setUsuario(userRes.data);
        setMovimientos(movRes.data);
      } catch {
        setError('Error al cargar historial');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const columns: GridColDef[] = [
    {
      field: 'materia',
      headerName: 'Materia',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_, row) => (row as Movimiento).clase?.materia?.nombre,
    },
    {
      field: 'clase',
      headerName: 'Clase',
      width: 160,
      valueGetter: (_, row) => (row as Movimiento).clase?.codigo,
    },
    {
      field: 'fecha_inscripcion',
      headerName: 'Fecha alta',
      width: 120,
      valueGetter: (_, row) => {
        const d = (row as Movimiento).fecha_inscripcion;
        return d ? new Date(d).toLocaleDateString('es-BO') : '';
      },
    },
    {
      field: 'fecha_baja',
      headerName: 'Fecha baja',
      width: 120,
      valueGetter: (_, row) => {
        const d = (row as Movimiento).fecha_baja;
        return d ? new Date(d).toLocaleDateString('es-BO') : '—';
      },
    },
    {
      field: 'motivo_baja',
      headerName: 'Motivo baja',
      width: 120,
      valueGetter: (_, row) => (row as Movimiento).motivo_baja ?? '—',
    },
    {
      field: 'concluyo_temario_materia',
      headerName: 'Concluyó',
      width: 100,
      renderCell: ({ row }) =>
        (row as Movimiento).concluyo_temario_materia ? (
          <CheckCircleIcon fontSize="small" color="success" />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === 'Activo' ? 'success' : value === 'Finalizado' ? 'primary' : 'default'}
        />
      ),
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <PageHeader
        title={`Historial: ${usuario?.nombre_completo ?? ''}`}
        subtitle="Movimientos de inscripciones (altas y bajas)"
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/admin/users/${id}`)}>
            Perfil
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={movimientos}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          localeText={{ noRowsLabel: 'Sin movimientos registrados' }}
        />
      </Box>
    </>
  );
}
