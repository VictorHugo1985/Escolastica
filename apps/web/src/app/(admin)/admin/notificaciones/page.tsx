'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificacionRow {
  id: string;
  tipo: string;
  descripcion: string;
  actor: { id: string; nombre_completo: string } | null;
  clase: { id: string; codigo: string; materia: string } | null;
  usuario_afectado: { id: string; nombre_completo: string } | null;
  created_at: string;
}

const TIPO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pase_de_lista', label: 'Pases de lista' },
  { value: 'baja_inscrito', label: 'Bajas de inscritos' },
  { value: 'promocion_miembro', label: 'Promociones a miembro' },
  { value: 'clase_inactiva', label: 'Clases inactivas' },
];

const TIPO_LABELS: Record<string, { label: string; color: 'info' | 'error' | 'success' | 'warning' }> = {
  pase_de_lista: { label: 'Pase de lista', color: 'info' },
  baja_inscrito: { label: 'Baja', color: 'error' },
  promocion_miembro: { label: 'Promoción', color: 'success' },
  clase_inactiva: { label: 'Clases inactivas', color: 'warning' },
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

const columns: GridColDef[] = [
  {
    field: 'tipo',
    headerName: 'Tipo',
    width: 150,
    renderCell: (params: GridRenderCellParams) => {
      const t = TIPO_LABELS[params.value as string] ?? { label: params.value, color: 'default' as const };
      return <Chip label={t.label} color={t.color} size="small" />;
    },
  },
  {
    field: 'descripcion',
    headerName: 'Descripción',
    flex: 1,
    minWidth: 250,
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', py: 0.75 }}>
        {params.value as string}
      </Typography>
    ),
  },
  {
    field: 'actor',
    headerName: 'Actor',
    width: 180,
    valueGetter: (value: { nombre_completo: string } | null, row: NotificacionRow) =>
      row.tipo === 'clase_inactiva' ? 'Sistema' : value?.nombre_completo ?? 'Usuario eliminado',
  },
  {
    field: 'created_at',
    headerName: 'Fecha',
    width: 160,
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant="caption">{formatTime(params.value as string)}</Typography>
    ),
  },
];

export default function NotificacionesPage() {
  const [rows, setRows] = useState<NotificacionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [tipoFilter, setTipoFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(tipoFilter ? { tipo: tipoFilter } : {}),
      });
      const { data } = await api.get(`/notificaciones/historial?${params}`);
      setRows(data.notificaciones);
      setTotal(data.total);
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, tipoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTipoChange = (value: string) => {
    setTipoFilter(value);
    setPage(0);
  };

  return (
    <Box>
      <PageHeader title="Historial de Actividad" />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Tipo de acción</InputLabel>
          <Select
            value={tipoFilter}
            label="Tipo de acción"
            onChange={(e) => handleTipoChange(e.target.value)}
          >
            {TIPO_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No se encontraron notificaciones{tipoFilter ? ' para este filtro' : ''}.
        </Typography>
      ) : (
        <>
          <DataGrid
            rows={rows}
            columns={columns}
            hideFooter
            autoHeight
            getRowHeight={() => 'auto'}
            disableRowSelectionOnClick
            sx={{ mb: 1, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
          />
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[pageSize]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </>
      )}
    </Box>
  );
}
