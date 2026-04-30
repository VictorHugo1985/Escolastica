'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAulaSchema, type CreateAulaDto } from '@escolastica/shared';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Aula {
  id: string;
  nombre: string;
  capacidad: number | null;
  ubicacion: string | null;
  _count?: { horarios: number };
}

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAulaDto>({ resolver: zodResolver(CreateAulaSchema) });

  async function load() {
    try {
      const { data } = await api.get('/aulas');
      setAulas(data);
    } catch {
      setError('Error al cargar aulas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    reset({ nombre: '', capacidad: undefined, ubicacion: '' });
    setDialogOpen(true);
  }

  function openEdit(aula: Aula) {
    setEditing(aula);
    reset({ nombre: aula.nombre, capacidad: aula.capacidad ?? undefined, ubicacion: aula.ubicacion ?? '' });
    setDialogOpen(true);
  }

  async function onSubmit(data: CreateAulaDto) {
    try {
      if (editing) {
        await api.patch(`/aulas/${editing.id}`, data);
      } else {
        await api.post('/aulas', data);
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleDelete(aula: Aula) {
    if (!confirm(`¿Eliminar el aula "${aula.nombre}"?`)) return;
    try {
      await api.delete(`/aulas/${aula.id}`);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo eliminar';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 160 },
    { field: 'capacidad', headerName: 'Capacidad', width: 110, valueFormatter: (v) => v ?? '—' },
    { field: 'ubicacion', headerName: 'Ubicación', flex: 1, valueFormatter: (v) => v ?? '—' },
    {
      field: 'horarios',
      headerName: 'Horarios',
      width: 100,
      renderCell: ({ row }) => (
        <Chip
          label={row._count?.horarios ?? 0}
          size="small"
          color={row._count?.horarios > 0 ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Aulas"
        subtitle="Catálogo de aulas disponibles"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva aula
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={aulas}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar aula' : 'Nueva aula'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              label="Nombre"
              fullWidth
              margin="dense"
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              {...register('nombre')}
            />
            <TextField
              label="Capacidad"
              type="number"
              fullWidth
              margin="dense"
              error={!!errors.capacidad}
              helperText={errors.capacidad?.message}
              {...register('capacidad', { valueAsNumber: true })}
            />
            <TextField
              label="Ubicación"
              fullWidth
              margin="dense"
              {...register('ubicacion')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={18} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
