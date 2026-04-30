'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMateriaSchema, type CreateMateriaDto } from '@escolastica/shared';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ListIcon from '@mui/icons-material/List';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import IconButton from '@mui/material/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Tema {
  id: string;
  titulo: string;
  descripcion?: string | null;
  orden: number;
  estado: string;
}

interface Materia {
  id: string;
  nombre: string;
  nivel: number;
  es_curso_probacion: boolean;
  estado: string;
  descripcion: string | null;
  temas?: Tema[];
  _count?: { temas: number; clases: number };
}

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Materia dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);

  // Temas dialog
  const [temasDialogOpen, setTemasDialogOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [temasLoading, setTemasLoading] = useState(false);

  // New tema form
  const [newTemaTitulo, setNewTemaTitulo] = useState('');
  const [newTemaDesc, setNewTemaDesc] = useState('');
  const [addingTema, setAddingTema] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // Inline editing
  const [editingTemaId, setEditingTemaId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingTema, setSavingTema] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMateriaDto>({ resolver: zodResolver(CreateMateriaSchema) });

  async function load(nombre?: string) {
    setLoading(true);
    try {
      const { data } = await api.get('/materias', { params: { nombre } });
      setMaterias(data);
    } catch {
      setError('Error al cargar materias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    reset({ nombre: '', nivel: 0, es_curso_probacion: false });
    setDialogOpen(true);
  }

  function openEdit(m: Materia) {
    setEditing(m);
    reset({ nombre: m.nombre, nivel: m.nivel, es_curso_probacion: m.es_curso_probacion, descripcion: m.descripcion ?? '' });
    setDialogOpen(true);
  }

  async function onSubmit(data: CreateMateriaDto) {
    try {
      if (editing) {
        await api.patch(`/materias/${editing.id}`, data);
      } else {
        await api.post('/materias', data);
      }
      setDialogOpen(false);
      load(search || undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleDeactivate(m: Materia) {
    if (!confirm(`¿Desactivar la materia "${m.nombre}"?`)) return;
    try {
      await api.patch(`/materias/${m.id}/deactivate`);
      load(search || undefined);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al desactivar');
    }
  }

  // --- Gestión de temas ---

  async function loadTemas(materiaId: string) {
    setTemasLoading(true);
    try {
      const { data } = await api.get(`/materias/${materiaId}/temas`);
      setTemas(data);
    } catch {
      setError('Error al cargar temas');
    } finally {
      setTemasLoading(false);
    }
  }

  async function openTemas(m: Materia) {
    setSelectedMateria(m);
    setTemas([]);
    setShowNewForm(false);
    setEditingTemaId(null);
    setTemasDialogOpen(true);
    await loadTemas(m.id);
  }

  async function handleAddTema() {
    if (!newTemaTitulo.trim() || !selectedMateria) return;
    setAddingTema(true);
    setError('');
    try {
      await api.post(`/materias/${selectedMateria.id}/temas`, {
        titulo: newTemaTitulo.trim(),
        ...(newTemaDesc.trim() && { descripcion: newTemaDesc.trim() }),
      });
      setNewTemaTitulo('');
      setNewTemaDesc('');
      setShowNewForm(false);
      await loadTemas(selectedMateria.id);
      load(search || undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al agregar tema';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setAddingTema(false);
    }
  }

  function startEditTema(t: Tema) {
    setEditingTemaId(t.id);
    setEditTitulo(t.titulo);
    setEditDesc(t.descripcion ?? '');
  }

  function cancelEditTema() {
    setEditingTemaId(null);
  }

  async function saveEditTema(temaId: string) {
    if (!selectedMateria || !editTitulo.trim()) return;
    setSavingTema(true);
    try {
      await api.patch(`/materias/${selectedMateria.id}/temas/${temaId}`, {
        titulo: editTitulo.trim(),
        descripcion: editDesc.trim() || null,
      });
      setEditingTemaId(null);
      await loadTemas(selectedMateria.id);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar tema');
    } finally {
      setSavingTema(false);
    }
  }

  async function handleDeleteTema(temaId: string) {
    if (!selectedMateria || !confirm('¿Eliminar este tema?')) return;
    try {
      await api.delete(`/materias/${selectedMateria.id}/temas/${temaId}`);
      await loadTemas(selectedMateria.id);
      load(search || undefined);
    } catch {
      setError('Error al eliminar tema');
    }
  }

  async function movetema(index: number, direction: 'up' | 'down') {
    if (!selectedMateria) return;
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= temas.length) return;

    const newTemas = [...temas];
    [newTemas[index], newTemas[swapIdx]] = [newTemas[swapIdx], newTemas[index]];
    const reordered = newTemas.map((t, i) => ({ ...t, orden: i + 1 }));
    setTemas(reordered);

    try {
      await api.patch(`/materias/${selectedMateria.id}/temas/reorder`, {
        temas: reordered.map(({ id, orden }) => ({ id, orden })),
      });
    } catch {
      setError('Error al reordenar temas');
      await loadTemas(selectedMateria.id);
    }
  }

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1.5, minWidth: 180 },
    { field: 'nivel', headerName: 'Nivel', width: 80 },
    {
      field: 'es_curso_probacion',
      headerName: 'Tipo',
      width: 120,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Probación' : 'Regular'} size="small" color={value ? 'warning' : 'default'} />
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
      field: '_count',
      headerName: 'Temas',
      width: 110,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<ListIcon fontSize="inherit" />}
          onClick={() => openTemas(params.row as Materia)}
        >
          {params.value?.temas ?? 0} temas
        </Button>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
          {row.estado === 'Activo' && (
            <IconButton size="small" color="warning" onClick={() => handleDeactivate(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Materias"
        subtitle="Pensum de materias de la escuela"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nueva materia
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value || undefined); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 280 }}
        />
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={materias}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      {/* Materia dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar materia' : 'Nueva materia'}</DialogTitle>
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
              label="Descripción"
              fullWidth
              margin="dense"
              multiline
              rows={2}
              {...register('descripcion')}
            />
            <TextField
              label="Nivel"
              type="number"
              fullWidth
              margin="dense"
              error={!!errors.nivel}
              helperText={errors.nivel?.message}
              {...register('nivel', { valueAsNumber: true })}
            />
            <FormControlLabel
              control={<Checkbox {...register('es_curso_probacion')} />}
              label="Es materia de probación"
              sx={{ mt: 1 }}
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

      {/* Temas dialog */}
      <Dialog open={temasDialogOpen} onClose={() => setTemasDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Temas: {selectedMateria?.nombre}</span>
          <IconButton size="small" onClick={() => setTemasDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {temasLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {temas.length === 0 && !showNewForm && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
                  No hay temas registrados aún.
                </Typography>
              )}

              {temas.length > 0 && (
                <List dense disablePadding>
                  {temas.map((t, index) => (
                    <Box key={t.id}>
                      {index > 0 && <Divider />}
                      {editingTemaId === t.id ? (
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, py: 1.5, px: 2 }}>
                          <TextField
                            label="Título"
                            size="small"
                            fullWidth
                            value={editTitulo}
                            onChange={(e) => setEditTitulo(e.target.value)}
                            autoFocus
                          />
                          <TextField
                            label="Descripción"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                          />
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={cancelEditTema} startIcon={<CloseIcon />}>
                              Cancelar
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => saveEditTema(t.id)}
                              disabled={savingTema || !editTitulo.trim()}
                              startIcon={savingTema ? <CircularProgress size={14} /> : <SaveIcon />}
                            >
                              Guardar
                            </Button>
                          </Box>
                        </ListItem>
                      ) : (
                        <ListItem
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Subir">
                                <span>
                                  <IconButton size="small" disabled={index === 0} onClick={() => movetema(index, 'up')}>
                                    <ArrowUpwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Bajar">
                                <span>
                                  <IconButton size="small" disabled={index === temas.length - 1} onClick={() => movetema(index, 'down')}>
                                    <ArrowDownwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => startEditTema(t)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton size="small" color="error" onClick={() => handleDeleteTema(t.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={<><strong>{t.orden}.</strong> {t.titulo}</>}
                            secondary={t.descripcion || undefined}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                    </Box>
                  ))}
                </List>
              )}

              {showNewForm && (
                <>
                  {temas.length > 0 && <Divider />}
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Nuevo tema</Typography>
                    <TextField
                      label="Título *"
                      size="small"
                      fullWidth
                      value={newTemaTitulo}
                      onChange={(e) => setNewTemaTitulo(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAddTema(); }}
                    />
                    <TextField
                      label="Descripción"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={newTemaDesc}
                      onChange={(e) => setNewTemaDesc(e.target.value)}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => { setShowNewForm(false); setNewTemaTitulo(''); setNewTemaDesc(''); }}
                        startIcon={<CloseIcon />}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleAddTema}
                        disabled={!newTemaTitulo.trim() || addingTema}
                        startIcon={addingTema ? <CircularProgress size={14} /> : <AddIcon />}
                      >
                        Agregar
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!showNewForm && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setShowNewForm(true); setEditingTemaId(null); }}
            >
              Nuevo tema
            </Button>
          )}
          <Button onClick={() => setTemasDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
