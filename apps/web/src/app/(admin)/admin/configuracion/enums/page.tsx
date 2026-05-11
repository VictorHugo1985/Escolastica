'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface EnumValor {
  id: string;
  codigo: string;
  etiqueta: string;
  activo: boolean;
  orden: number;
}

interface EnumCategoria {
  nombre: string;
  etiqueta: string;
  descripcion?: string | null;
  total_valores: number;
  valores_activos: number;
}

const NON_CONFIGURABLE_ENUMS = [
  { nombre: 'Rol', etiqueta: 'Rol', valores: ['Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExProbacionista', 'ExMiembro'] },
  { nombre: 'EstadoGeneral', etiqueta: 'Estado General', valores: ['Activo', 'Inactivo'] },
  { nombre: 'EstadoClase', etiqueta: 'Estado de Clase', valores: ['Activa', 'Inactiva', 'Finalizada'] },
  { nombre: 'EstadoInscripcion', etiqueta: 'Estado de Inscripción', valores: ['Activo', 'Baja', 'Finalizado'] },
  { nombre: 'EstadoAsistencia', etiqueta: 'Estado de Asistencia', valores: ['Presente', 'Ausente', 'Licencia'] },
];

export default function ConfigEnumsPage() {
  const [categorias, setCategorias] = useState<EnumCategoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [valores, setValores] = useState<EnumValor[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingVals, setLoadingVals] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEtiqueta, setEditEtiqueta] = useState('');
  const [editError, setEditError] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newEtiqueta, setNewEtiqueta] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/config/enums')
      .then(({ data }) => setCategorias(data))
      .catch(() => setError('Error al cargar categorías'))
      .finally(() => setLoadingCats(false));
  }, []);

  async function loadValores(nombre: string) {
    setLoadingVals(true);
    setEditingId(null);
    setAddError('');
    setNewCodigo('');
    setNewEtiqueta('');
    try {
      const { data } = await api.get(`/config/enums/${nombre}`);
      setValores(data.valores);
    } catch {
      setError('Error al cargar valores');
    } finally {
      setLoadingVals(false);
    }
  }

  async function reloadCats() {
    const { data } = await api.get('/config/enums');
    setCategorias(data);
  }

  function selectCategoria(nombre: string) {
    setCategoriaSeleccionada(nombre);
    loadValores(nombre);
  }

  async function toggleActivo(v: EnumValor) {
    try {
      await api.patch(`/config/enums/${categoriaSeleccionada}/valores/${v.id}`, { activo: !v.activo });
      await loadValores(categoriaSeleccionada!);
      await reloadCats();
    } catch {
      setError('Error al cambiar estado del valor');
    }
  }

  function startEdit(v: EnumValor) {
    setEditingId(v.id);
    setEditEtiqueta(v.etiqueta);
    setEditError('');
  }

  async function saveEdit(v: EnumValor) {
    if (!editEtiqueta.trim()) { setEditError('La etiqueta no puede estar vacía'); return; }
    setSaving(true);
    try {
      await api.patch(`/config/enums/${categoriaSeleccionada}/valores/${v.id}`, { etiqueta: editEtiqueta.trim() });
      setEditingId(null);
      await loadValores(categoriaSeleccionada!);
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function addValor() {
    if (!newCodigo.trim()) { setAddError('El código es requerido'); return; }
    if (!newEtiqueta.trim()) { setAddError('La etiqueta es requerida'); return; }
    setSaving(true);
    try {
      await api.post(`/config/enums/${categoriaSeleccionada}/valores`, {
        codigo: newCodigo.trim(),
        etiqueta: newEtiqueta.trim(),
      });
      setNewCodigo('');
      setNewEtiqueta('');
      setAddError('');
      await loadValores(categoriaSeleccionada!);
      await reloadCats();
    } catch (err: any) {
      setAddError(err?.response?.data?.message ?? 'Error al agregar valor');
    } finally {
      setSaving(false);
    }
  }

  const catActual = categorias.find((c) => c.nombre === categoriaSeleccionada);

  return (
    <>
      <PageHeader title="Enumeraciones" subtitle="Configuración de valores de las listas de opciones" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Columna izquierda: categorías configurables */}
        <Card elevation={1} sx={{ width: 260, flexShrink: 0 }}>
          <CardContent sx={{ pb: '8px !important' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Categorías configurables
            </Typography>
            {loadingCats ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              <List dense disablePadding>
                {categorias.map((c) => (
                  <ListItemButton
                    key={c.nombre}
                    selected={categoriaSeleccionada === c.nombre}
                    onClick={() => selectCategoria(c.nombre)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={c.etiqueta}
                      secondary={`${c.valores_activos} activos / ${c.total_valores} total`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Columna derecha: valores */}
        <Box sx={{ flex: 1 }}>
          {!categoriaSeleccionada ? (
            <Alert severity="info">Seleccioná una categoría para ver y editar sus valores.</Alert>
          ) : loadingVals ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  {catActual?.etiqueta}
                </Typography>
                {catActual?.descripcion && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {catActual.descripcion}
                  </Typography>
                )}

                {valores.map((v) => (
                  <Box
                    key={v.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant="caption" color="text.disabled" sx={{ width: 130, flexShrink: 0, fontFamily: 'monospace' }}>
                      {v.codigo}
                    </Typography>

                    {editingId === v.id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <TextField
                          size="small"
                          value={editEtiqueta}
                          onChange={(e) => setEditEtiqueta(e.target.value)}
                          error={!!editError}
                          helperText={editError}
                          sx={{ flex: 1 }}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(v); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                        <Tooltip title="Guardar">
                          <IconButton size="small" onClick={() => saveEdit(v)} disabled={saving}><SaveIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ flex: 1 }}>{v.etiqueta}</Typography>
                        <Tooltip title="Editar etiqueta">
                          <IconButton size="small" onClick={() => startEdit(v)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Chip
                      label={v.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={v.activo ? 'success' : 'default'}
                      variant={v.activo ? 'filled' : 'outlined'}
                      onClick={() => toggleActivo(v)}
                      icon={v.activo ? <CheckCircleIcon /> : <CancelIcon />}
                      clickable
                      sx={{ cursor: 'pointer', minWidth: 90 }}
                    />
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Agregar nuevo valor</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <TextField
                    label="Código"
                    size="small"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    sx={{ width: 150 }}
                    inputProps={{ maxLength: 50 }}
                    placeholder="ej: Taller"
                  />
                  <TextField
                    label="Etiqueta"
                    size="small"
                    value={newEtiqueta}
                    onChange={(e) => setNewEtiqueta(e.target.value)}
                    sx={{ flex: 1, minWidth: 160 }}
                    inputProps={{ maxLength: 100 }}
                    placeholder="ej: Taller"
                    onKeyDown={(e) => { if (e.key === 'Enter') addValor(); }}
                  />
                  <Button variant="contained" size="small" onClick={addValor} disabled={saving} sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                    Agregar
                  </Button>
                </Box>
                {addError && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setAddError('')}>{addError}</Alert>}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Enumeraciones no configurables (US2) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          Enumeraciones del sistema
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Estas enumeraciones son controladas por la lógica del sistema y no son editables.
        </Alert>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {NON_CONFIGURABLE_ENUMS.map((cat) => (
            <Card key={cat.nombre} elevation={1} sx={{ minWidth: 200 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LockIcon fontSize="small" color="disabled" />
                  <Typography variant="subtitle2" fontWeight={600}>{cat.etiqueta}</Typography>
                </Box>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                  Solo lectura — controlado por el sistema
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {cat.valores.map((v) => (
                    <Chip key={v} label={v} size="small" variant="outlined" disabled />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </>
  );
}
