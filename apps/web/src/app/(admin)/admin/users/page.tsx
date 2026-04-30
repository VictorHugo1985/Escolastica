'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { ImportResultDto } from '@escolastica/shared';

const ROLES = ['', 'Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExMiembro'];
const ESTADOS = ['', 'Activo', 'Inactivo'];
const ROL_OPTIONS = ['Instructor', 'Miembro', 'Probacionista', 'Escolastico', 'ExMiembro', 'ExProbacionista'];

interface RolEntry {
  rol: { id: string; nombre: string };
}

interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  estado: string;
  roles: RolEntry[];
  created_at: string;
}

// ─── ImportDialog ────────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [rolNombre, setRolNombre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ImportResultDto | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    if (resultado) onSuccess();
    setRolNombre('');
    setFile(null);
    setFileError('');
    setResultado(null);
    setErrorMsg('');
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFileError('');
    if (selected && !selected.name.endsWith('.csv')) {
      setFileError('Solo se aceptan archivos .csv');
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleDownloadTemplate() {
    try {
      const resp = await api.get('/users/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'usuarios-plantilla.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('No se pudo descargar la plantilla');
    }
  }

  async function handleImport() {
    if (!file || !rolNombre) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rolNombre', rolNombre);
      const { data } = await api.post<ImportResultDto>('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultado(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Error al importar el archivo');
    } finally {
      setLoading(false);
    }
  }

  const resultSeverity = resultado
    ? resultado.errores > 0
      ? 'warning'
      : resultado.creados === 0
        ? 'info'
        : 'success'
    : 'info';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importar usuarios desde CSV</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        {!resultado && (
          <>
            <FormControl size="small" required>
              <InputLabel>Rol a asignar</InputLabel>
              <Select value={rolNombre} label="Rol a asignar" onChange={(e) => setRolNombre(e.target.value)}>
                {ROL_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>

            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
              >
                {file ? file.name : 'Seleccionar archivo CSV'}
              </Button>
              {fileError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{fileError}</Typography>}
            </Box>

            <Link component="button" variant="body2" onClick={handleDownloadTemplate} sx={{ alignSelf: 'flex-start' }}>
              Descargar plantilla de ejemplo
            </Link>
          </>
        )}

        {resultado && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Alert severity={resultSeverity}>
              Total: {resultado.total} &nbsp;|&nbsp; Creados: {resultado.creados} &nbsp;|&nbsp;
              Duplicados: {resultado.duplicados} &nbsp;|&nbsp; Errores: {resultado.errores}
            </Alert>
            {resultado.filas_fallidas.length > 0 && (
              <>
                <Typography variant="subtitle2">Filas con problemas:</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Resultado</TableCell>
                        <TableCell>Motivo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultado.filas_fallidas.map((f) => (
                        <TableRow key={f.fila_numero}>
                          <TableCell>{f.fila_numero}</TableCell>
                          <TableCell>{f.nombre}</TableCell>
                          <TableCell>{f.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={f.resultado}
                              size="small"
                              color={f.resultado === 'duplicado' ? 'warning' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{f.motivo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{resultado ? 'Cerrar' : 'Cancelar'}</Button>
        {!resultado && (
          <Button
            variant="contained"
            disabled={!file || !rolNombre || loading}
            onClick={handleImport}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            Importar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── UsersPage ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const esEscol = user?.roles.includes('Escolastico') ?? false;

  const [users, setUsers] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: {
          search: search || undefined,
          rol: rol || undefined,
          estado: estado || undefined,
        },
      });
      setUsers(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, rol, estado]);

  async function handleDeactivate(u: Usuario) {
    if (!confirm(`¿Desactivar a "${u.nombre_completo}"?`)) return;
    try {
      await api.patch(`/users/${u.id}/deactivate`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al desactivar');
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const resp = await api.get('/users/export', {
        params: { search: search || undefined, rol: rol || undefined, estado: estado || undefined },
        responseType: 'arraybuffer',
      });
      const blob = new Blob([resp.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al exportar usuarios');
    } finally {
      setExportLoading(false);
    }
  }

  const columns: GridColDef[] = [
    { field: 'nombre_completo', headerName: 'Nombre', flex: 1.5, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    {
      field: 'roles',
      headerName: 'Roles',
      width: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(row.roles as RolEntry[]).map((r) => (
            <Chip key={r.rol.id} label={r.rol.nombre} size="small" />
          ))}
        </Box>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={value === 'Activo' ? 'success' : 'default'} />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => router.push(`/admin/users/${row.id}`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {row.estado === 'Activo' && (
            <IconButton size="small" color="warning" onClick={() => handleDeactivate(row)}>
              <PersonOffIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de miembros y roles"
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {esEscol && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => setImportOpen(true)}
                  size="small"
                >
                  Importar CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
                  onClick={handleExport}
                  disabled={exportLoading}
                  size="small"
                >
                  Exportar Excel
                </Button>
              </>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/admin/users/new')}>
              Nuevo usuario
            </Button>
          </Box>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 260 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Rol</InputLabel>
          <Select value={rol} label="Rol" onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => <MenuItem key={r} value={r}>{r || 'Todos'}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 130 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={estado} label="Estado" onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((e) => <MenuItem key={e} value={e}>{e || 'Todos'}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={load}
      />
    </>
  );
}
