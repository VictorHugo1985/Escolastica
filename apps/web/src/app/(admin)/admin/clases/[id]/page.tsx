'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HistoryIcon from '@mui/icons-material/History';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Usuario { id: string; nombre_completo: string; email: string }
interface Inscripcion {
  id: string;
  usuario_id: string;
  fecha_inscripcion: string;
  concluyo_temario_materia: boolean;
  estado: string;
  usuario: Usuario;
}
interface Clase {
  id: string;
  codigo: string;
  estado: string;
  celador: string;
  fecha_inicio: string;
  fecha_fin: string;
  comentarios: string | null;
  materia: { nombre: string; nivel: number };
  instructor: { id: string; nombre_completo: string };
  inscripciones: Inscripcion[];
  _count: { sesiones: number };
}

const MOTIVOS = ['Ausencia', 'Laboral', 'Personal', 'Desconocido'] as const;

export default function ClaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [clase, setClase] = useState<Clase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comentarios, setComentarios] = useState('');
  const [savingComentarios, setSavingComentarios] = useState(false);

  // Baja dialog
  const [bajaTarget, setBajaTarget] = useState<Inscripcion | null>(null);
  const [bajaMotivo, setBajaMotivo] = useState('Ausencia');
  const [bajaComentarios, setBajaComentarios] = useState('');
  const [givingBaja, setGivingBaja] = useState(false);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // Inscribir dialog
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<Usuario[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inscribingId, setInscribingId] = useState('');

  const loadClase = useCallback(async () => {
    try {
      const { data } = await api.get(`/clases/${id}`);
      setClase(data);
      setComentarios(data.comentarios ?? '');
    } catch {
      setError('Error al cargar la clase');
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function saveComentarios() {
    if (!clase) return;
    setSavingComentarios(true);
    try {
      await api.patch(`/clases/${id}`, { comentarios: comentarios || null });
    } catch {
      setError('Error al guardar comentarios');
    } finally {
      setSavingComentarios(false);
    }
  }

  useEffect(() => { loadClase(); }, [loadClase]);

  // --- Baja ---
  function openBaja(insc: Inscripcion) {
    setBajaTarget(insc);
    setBajaMotivo('Ausencia');
    setBajaComentarios('');
  }

  async function confirmBaja() {
    if (!bajaTarget) return;
    setGivingBaja(true);
    try {
      await api.patch(`/inscripciones/${bajaTarget.id}/baja`, {
        motivo_baja: bajaMotivo,
        comentarios: bajaComentarios || undefined,
      });
      setBajaTarget(null);
      await loadClase();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al dar de baja');
    } finally {
      setGivingBaja(false);
    }
  }

  // --- Conclusión de temario ---
  async function toggleConclusion(insc: Inscripcion) {
    const next = !insc.concluyo_temario_materia;
    try {
      await api.patch(`/inscripciones/${insc.id}/conclusion`, {
        concluyo_temario_materia: next,
      });
      await loadClase();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al actualizar conclusión');
    }
  }

  // --- Pase de lista ---
  async function iniciarPaseLista() {
    setIniciandoSesion(true);
    try {
      const { data } = await api.post(`/clases/${id}/sesiones`, {});
      router.push(`/admin/asistencia/${id}?sesionId=${data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al iniciar la sesión');
      setIniciandoSesion(false);
    }
  }

  // --- Alta (inscribir) ---
  async function searchCandidates(q: string) {
    setSearch(q);
    if (!q.trim()) { setCandidates([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/users/eligible-students', { params: { claseId: id } });
      const filtered = (data as Usuario[]).filter(
        (u) => u.nombre_completo.toLowerCase().includes(q.toLowerCase()) ||
               u.email?.toLowerCase().includes(q.toLowerCase())
      );
      setCandidates(filtered.slice(0, 10));
    } catch {
      setCandidates([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function inscribir(usuarioId: string) {
    setInscribingId(usuarioId);
    try {
      await api.post(`/clases/${id}/inscripciones`, { usuario_id: usuarioId });
      setAddOpen(false);
      setSearch('');
      setCandidates([]);
      await loadClase();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al inscribir');
    } finally {
      setInscribingId('');
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'nombre_completo',
      headerName: 'Alumno',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_, row) => (row as Inscripcion).usuario?.nombre_completo,
    },
    {
      field: 'fecha_inscripcion',
      headerName: 'Fecha alta',
      width: 120,
      valueGetter: (_, row) => {
        const d = (row as Inscripcion).fecha_inscripcion;
        return d ? new Date(d).toLocaleDateString('es-BO') : '';
      },
    },
    {
      field: 'concluyo_temario_materia',
      headerName: 'Concluyó temario',
      width: 150,
      renderCell: ({ row }) => (
        <Tooltip title={(row as Inscripcion).concluyo_temario_materia ? 'Marcar como no concluido' : 'Marcar como concluido'}>
          <Checkbox
            checked={(row as Inscripcion).concluyo_temario_materia}
            onChange={() => toggleConclusion(row as Inscripcion)}
            size="small"
            color="success"
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="Dar de baja">
          <IconButton size="small" color="warning" onClick={() => openBaja(row as Inscripcion)}>
            <PersonOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (!clase) {
    return <Alert severity="error">Clase no encontrada</Alert>;
  }

  const inscripciones = clase.inscripciones ?? [];

  return (
    <>
      <PageHeader
        title={clase.codigo}
        subtitle={clase.materia?.nombre}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {clase.estado === 'Activa' && (
              <Button
                variant="contained"
                size="small"
                startIcon={iniciandoSesion ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={iniciarPaseLista}
                disabled={iniciandoSesion}
              >
                Pase de lista
              </Button>
            )}
            <Button
              size="small"
              startIcon={<HistoryIcon />}
              onClick={() => router.push(`/admin/asistencia/${id}`)}
            >
              Historial
            </Button>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/clases')}>
              Volver
            </Button>
          </Box>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Resumen de la clase */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Instructor</Typography>
            <Typography variant="body2" fontWeight={600}>{clase.instructor?.nombre_completo}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">Período</Typography>
            <Typography variant="body2">{new Date(clase.fecha_inicio).toLocaleDateString('es-BO')} — {new Date(clase.fecha_fin).toLocaleDateString('es-BO')}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">Sesiones</Typography>
            <Typography variant="body2" fontWeight={600}>{clase._count?.sesiones ?? 0}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Chip
              label={clase.estado}
              size="small"
              color={clase.estado === 'Activa' ? 'success' : clase.estado === 'Finalizada' ? 'default' : 'warning'}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Comentarios de la clase */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Comentarios de la clase"
          multiline
          rows={2}
          fullWidth
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          onBlur={saveComentarios}
          inputProps={{ maxLength: 1000 }}
          InputProps={{
            endAdornment: savingComentarios
              ? <CircularProgress size={16} sx={{ mr: 1, flexShrink: 0 }} />
              : null,
          }}
          placeholder="Notas internas sobre esta clase..."
        />
      </Box>

      {/* Inscripciones activas */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Inscritos activos ({inscripciones.length})
        </Typography>
        {clase.estado !== 'Finalizada' && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddOpen(true)}
          >
            Inscribir alumno
          </Button>
        )}
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={inscripciones}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          localeText={{ noRowsLabel: 'Sin alumnos inscritos' }}
        />
      </Box>

      {/* Dialog: Dar de Baja */}
      <Dialog open={!!bajaTarget} onClose={() => setBajaTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Dar de baja: {bajaTarget?.usuario.nombre_completo}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Motivo *</InputLabel>
            <Select
              value={bajaMotivo}
              label="Motivo *"
              onChange={(e) => setBajaMotivo(e.target.value)}
            >
              {MOTIVOS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Comentarios"
            fullWidth
            margin="dense"
            multiline
            rows={2}
            value={bajaComentarios}
            onChange={(e) => setBajaComentarios(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBajaTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={givingBaja}
            onClick={confirmBaja}
          >
            {givingBaja ? <CircularProgress size={18} /> : 'Confirmar baja'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Inscribir alumno */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setSearch(''); setCandidates([]); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon fontSize="small" /> Inscribir alumno
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Buscar por nombre o correo"
            fullWidth
            margin="dense"
            value={search}
            onChange={(e) => searchCandidates(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
                </InputAdornment>
              ),
            }}
          />
          {candidates.length > 0 && (
            <List dense sx={{ mt: 1 }}>
              {candidates.map((u) => (
                <ListItem
                  key={u.id}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!!inscribingId}
                      onClick={() => inscribir(u.id)}
                    >
                      {inscribingId === u.id ? <CircularProgress size={14} /> : 'Inscribir'}
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {u.nombre_completo[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.nombre_completo}
                    secondary={u.email}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {search && !searchLoading && candidates.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              No se encontraron alumnos elegibles con ese término.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddOpen(false); setSearch(''); setCandidates([]); }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
