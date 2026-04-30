'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface LogEntry {
  id: string;
  accion: string;
  tabla_afectada: string;
  created_at: string;
  valor_anterior: Record<string, any> | null;
  valor_nuevo: Record<string, any> | null;
  usuario: { id: string; nombre_completo: string } | null;
}

const ACCIONES = ['INSERT', 'UPDATE', 'DELETE'];
const TABLAS = ['usuarios', 'materias', 'clases', 'inscripciones', 'sesiones', 'asistencias', 'notas'];

function JsonCell({ value }: { value: Record<string, any> | null }) {
  const [open, setOpen] = useState(false);
  if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box>
      <IconButton size="small" onClick={() => setOpen(!open)}>
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
      <Collapse in={open}>
        <Box component="pre" sx={{ fontSize: 11, maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-all', mt: 0.5 }}>
          {JSON.stringify(value, null, 2)}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function AuditoriaPage() {
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState({
    tabla_afectada: '',
    accion: '',
    usuario_id: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.tabla_afectada) params.set('tabla_afectada', filters.tabla_afectada);
      if (filters.accion) params.set('accion', filters.accion);
      if (filters.usuario_id) params.set('usuario_id', filters.usuario_id);
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
      params.set('page', String(page + 1));
      params.set('limit', String(pageSize));

      const { data } = await api.get(`/audit-logs?${params.toString()}`);
      setRows(data.data);
      setTotal(data.total);
    } catch {
      setError('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: 'Fecha',
      width: 170,
      valueFormatter: (v: string) => new Date(v).toLocaleString('es-AR'),
    },
    {
      field: 'usuario',
      headerName: 'Usuario',
      width: 180,
      valueGetter: (_: any, row: LogEntry) => row.usuario?.nombre_completo ?? 'Sistema',
    },
    {
      field: 'accion',
      headerName: 'Acción',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'INSERT' ? 'success' : params.value === 'DELETE' ? 'error' : 'warning'}
        />
      ),
    },
    { field: 'tabla_afectada', headerName: 'Tabla', width: 140 },
    {
      field: 'valor_anterior',
      headerName: 'Valor anterior',
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <JsonCell value={params.value} />,
    },
    {
      field: 'valor_nuevo',
      headerName: 'Valor nuevo',
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <JsonCell value={params.value} />,
    },
  ];

  return (
    <>
      <PageHeader title="Logs de auditoría" subtitle="Historial de acciones críticas del sistema" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <FilterListIcon color="action" />
        <TextField
          select label="Tabla" size="small" sx={{ minWidth: 150 }}
          value={filters.tabla_afectada}
          onChange={(e) => setFilters((f) => ({ ...f, tabla_afectada: e.target.value }))}
        >
          <MenuItem value="">Todas</MenuItem>
          {TABLAS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>

        <TextField
          select label="Acción" size="small" sx={{ minWidth: 120 }}
          value={filters.accion}
          onChange={(e) => setFilters((f) => ({ ...f, accion: e.target.value }))}
        >
          <MenuItem value="">Todas</MenuItem>
          {ACCIONES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>

        <TextField
          label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={filters.fechaDesde}
          onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
        />
        <TextField
          label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={filters.fechaHasta}
          onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
        />
        <Button variant="outlined" size="small" onClick={() => setFilters({ tabla_afectada: '', accion: '', usuario_id: '', fechaDesde: '', fechaHasta: '' })}>
          Limpiar
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={total}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={{ page, pageSize }}
          paginationMode="server"
          onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{ minHeight: 400 }}
        />
      )}
    </>
  );
}
