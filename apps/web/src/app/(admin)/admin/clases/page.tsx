'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateClaseSchema, UpdateClaseSchema, type CreateClaseDto } from '@escolastica/shared';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Autocomplete from '@mui/material/Autocomplete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Materia {
  id: string;
  nombre: string;
  nivel: number;
}

interface Instructor {
  id: string;
  nombre_completo: string;
}

interface Usuario {
  id: string;
  nombre_completo: string;
}

interface Aula {
  id: string;
  nombre: string;
}

interface Clase {
  id: string;
  codigo: string;
  materia: Materia;
  instructor: Instructor;
  mes_inicio: number;
  anio_inicio: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  celador: string;
  horarios?: { id: string; dia_semana: number; hora_inicio: string; hora_fin: string; aula: Aula | null }[];
  _count?: { inscripciones: number; sesiones: number };
}

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DIAS_FORM = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' },
];

export default function ClasesPage() {
  const router = useRouter();
  const [clases, setClases] = useState<Clase[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);
  const [dialogHorarios, setDialogHorarios] = useState<{ id: string; dia_semana: number; hora_inicio: string; hora_fin: string; aula_id?: string }[]>([]);
  const [addingHorario, setAddingHorario] = useState(false);
  const [addHorarioForm, setAddHorarioForm] = useState({ dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00', aula_id: '' });

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(UpdateClaseSchema),
    defaultValues: {
      mes_inicio: new Date().getMonth() + 1,
      anio_inicio: new Date().getFullYear(),
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      celador: '',
      horario: { dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00' },
    }
  });

  async function loadData() {
    setLoading(true);
    try {
      const [resClases, resMaterias, resInstructores, resAulas, resUsuarios] = await Promise.all([
        api.get('/clases'),
        api.get('/materias', { params: { estado: 'Activo' } }),
        api.get('/users/eligible-instructors'),
        api.get('/aulas'),
        api.get('/users', { params: { estado: 'Activo' } }),
      ]);
      setClases(resClases.data);
      setMaterias(resMaterias.data);
      setInstructores(resInstructores.data);
      setAulas(resAulas.data);
      setUsuarios(resUsuarios.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleOpenCreate() {
    setEditingClase(null);
    setDialogHorarios([]);
    setAddingHorario(false);
    setAddHorarioForm({ dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00', aula_id: '' });
    reset({
      mes_inicio: new Date().getMonth() + 1,
      anio_inicio: new Date().getFullYear(),
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      celador: '',
      materia_id: '',
      instructor_id: '',
      paralelo: '',
      horario: { dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00' },
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(clase: Clase) {
    setEditingClase(clase);
    setAddingHorario(false);
    setAddHorarioForm({ dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00', aula_id: '' });
    setDialogHorarios(
      (clase.horarios ?? []).map((h) => ({
        id: h.id,
        dia_semana: h.dia_semana,
        hora_inicio: new Date(h.hora_inicio).toISOString().substring(11, 16),
        hora_fin: new Date(h.hora_fin).toISOString().substring(11, 16),
        aula_id: h.aula?.id,
      }))
    );
    reset({
      materia_id: clase.materia.id,
      instructor_id: clase.instructor.id,
      celador: clase.celador,
      mes_inicio: clase.mes_inicio,
      anio_inicio: clase.anio_inicio,
      paralelo: (clase as any).paralelo || '',
      fecha_inicio: clase.fecha_inicio.split('T')[0],
      fecha_fin: clase.fecha_fin.split('T')[0],
    });
    setDialogOpen(true);
  }

  async function handleAddHorario() {
    if (!editingClase) return;
    try {
      const payload = {
        dia_semana: addHorarioForm.dia_semana,
        hora_inicio: addHorarioForm.hora_inicio,
        hora_fin: addHorarioForm.hora_fin,
        aula_id: addHorarioForm.aula_id || undefined,
      };
      const res = await api.post(`/clases/${editingClase.id}/horarios`, payload);
      setDialogHorarios((prev) => [...prev, {
        id: res.data.id,
        dia_semana: addHorarioForm.dia_semana,
        hora_inicio: addHorarioForm.hora_inicio,
        hora_fin: addHorarioForm.hora_fin,
        aula_id: addHorarioForm.aula_id || undefined,
      }]);
      setAddingHorario(false);
      setAddHorarioForm({ dia_semana: 4, hora_inicio: '18:00', hora_fin: '20:00', aula_id: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al agregar horario';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleDeleteHorario(horarioId: string) {
    if (!editingClase) return;
    try {
      await api.delete(`/clases/${editingClase.id}/horarios/${horarioId}`);
      setDialogHorarios((prev) => prev.filter((h) => h.id !== horarioId));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al eliminar horario';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function onSubmit(_data: any) {
    try {
      if (editingClase) {
        await api.patch(`/clases/${editingClase.id}`, _data);
      } else {
        // getValues() devuelve todos los campos registrados sin pasar por el schema
        const v = getValues();
        if (!v.materia_id) { setError('Seleccioná una materia'); return; }
        if (!v.instructor_id) { setError('Seleccioná un instructor'); return; }
        if (!v.celador?.trim()) { setError('Ingresá el nombre del celador'); return; }
        const payload = {
          materia_id: v.materia_id,
          instructor_id: v.instructor_id,
          mes_inicio: Number(v.mes_inicio),
          anio_inicio: Number(v.anio_inicio),
          celador: v.celador,
          fecha_inicio: v.fecha_inicio,
          fecha_fin: v.fecha_fin,
          paralelo: v.paralelo || undefined,
          horario: {
            dia_semana: Number(v.horario?.dia_semana ?? 4),
            hora_inicio: v.horario?.hora_inicio ?? '18:00',
            hora_fin: v.horario?.hora_fin ?? '20:00',
            aula_id: v.horario?.aula_id || undefined,
          },
        };
        await api.post('/clases', payload);
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar clase';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  const columns: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', width: 150 },
    { 
      field: 'materia', 
      headerName: 'Materia', 
      flex: 1.5, 
      minWidth: 180,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return null;
        return (
          <Box>
            <Box sx={{ fontWeight: 600 }}>{value.nombre}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Nivel {value.nivel}</Box>
          </Box>
        );
      }
    },
    { 
      field: 'instructor', 
      headerName: 'Instructor', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => params.value?.nombre_completo || '-'
    },
    {
      field: 'horario',
      headerName: 'Horario',
      width: 160,
      valueGetter: (_, row: Clase) => {
        const h = row.horarios?.[0];
        if (!h) return 'Sin horario';
        const inicio = new Date(h.hora_inicio).toISOString().substring(11, 16);
        const fin = new Date(h.hora_fin).toISOString().substring(11, 16);
        return `${DIAS_CORTO[h.dia_semana]} ${inicio}–${fin}`;
      },
    },
    {
      field: 'celador',
      headerName: 'Celador',
      width: 150,
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value || 'Inactiva'} size="small" color={params.value === 'Activa' ? 'success' : params.value === 'Finalizada' ? 'default' : 'warning'} />
      ),
    },
    {
      field: '_count',
      headerName: 'Inscritos',
      width: 80,
      renderCell: (params) => params.value?.inscripciones ?? 0,
    },
    {
      field: 'actions',
      headerName: '',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <Tooltip title="Inscripciones">
            <IconButton size="small" onClick={() => router.push(`/admin/clases/${params.row.id}`)}>
              <GroupIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Asistencias">
            <IconButton size="small" onClick={() => router.push(`/admin/clases/${params.row.id}/asistencias`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clases"
        subtitle="Instancias activas de materias"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nueva clase
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={clases}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingClase ? `Editar Clase: ${editingClase.codigo}` : 'Abrir nueva clase'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.materia_id}>
                  <InputLabel>Materia</InputLabel>
                  <Controller
                    name="materia_id"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Materia">
                        {materias.map((m) => (
                          <MenuItem key={m.id} value={m.id}>{m.nombre} (Nivel {m.nivel})</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.materia_id?.message as string}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.instructor_id}>
                  <InputLabel>Instructor</InputLabel>
                  <Controller
                    name="instructor_id"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Instructor">
                        {instructores.map((i) => (
                          <MenuItem key={i.id} value={i.id}>{i.nombre_completo}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.instructor_id?.message as string}</FormHelperText>
                </FormControl>
              </Grid>

              {/* Horario: formulario embebido al CREAR, gestión directa al EDITAR */}
              {!editingClase ? (
                <>
                  <Grid item xs={12}>
                    <Divider><Typography variant="caption" color="text.secondary">Horario inicial</Typography></Divider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!(errors as any).horario?.dia_semana}>
                      <InputLabel>Día de la semana</InputLabel>
                      <Controller
                        name="horario.dia_semana"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="Día de la semana">
                            {DIAS_FORM.map((d) => (
                              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      <FormHelperText>{(errors as any).horario?.dia_semana?.message as string}</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Hora inicio"
                      type="time"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!(errors as any).horario?.hora_inicio}
                      helperText={(errors as any).horario?.hora_inicio?.message as string}
                      {...register('horario.hora_inicio')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Hora fin"
                      type="time"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!(errors as any).horario?.hora_fin}
                      helperText={(errors as any).horario?.hora_fin?.message as string}
                      {...register('horario.hora_fin')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Aula (opcional)</InputLabel>
                      <Controller
                        name="horario.aula_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                            label="Aula (opcional)"
                          >
                            <MenuItem value=""><em>Ninguna</em></MenuItem>
                            {aulas.map((a) => (
                              <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }}><Typography variant="caption" color="text.secondary">Horarios</Typography></Divider>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {dialogHorarios.length === 0 && (
                      <Typography variant="body2" color="text.secondary">Sin horarios registrados</Typography>
                    )}
                    {dialogHorarios.map((h) => (
                      <Chip
                        key={h.id}
                        label={`${DIAS_FORM.find((d) => d.value === h.dia_semana)?.label ?? h.dia_semana} ${h.hora_inicio}–${h.hora_fin}`}
                        onDelete={() => handleDeleteHorario(h.id)}
                        deleteIcon={<DeleteIcon />}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                  {addingHorario ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Día</InputLabel>
                        <Select
                          value={addHorarioForm.dia_semana}
                          label="Día"
                          onChange={(e) => setAddHorarioForm((p) => ({ ...p, dia_semana: Number(e.target.value) }))}
                        >
                          {DIAS_FORM.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        type="time"
                        label="Hora inicio"
                        value={addHorarioForm.hora_inicio}
                        onChange={(e) => setAddHorarioForm((p) => ({ ...p, hora_inicio: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 130 }}
                      />
                      <TextField
                        size="small"
                        type="time"
                        label="Hora fin"
                        value={addHorarioForm.hora_fin}
                        onChange={(e) => setAddHorarioForm((p) => ({ ...p, hora_fin: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 130 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Aula</InputLabel>
                        <Select
                          value={addHorarioForm.aula_id}
                          label="Aula"
                          onChange={(e) => setAddHorarioForm((p) => ({ ...p, aula_id: e.target.value }))}
                        >
                          <MenuItem value=""><em>Ninguna</em></MenuItem>
                          {aulas.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button size="small" variant="contained" onClick={handleAddHorario}>Agregar</Button>
                      <Button size="small" onClick={() => setAddingHorario(false)}>Cancelar</Button>
                    </Box>
                  ) : (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingHorario(true)}>
                      Agregar horario
                    </Button>
                  )}
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="celador"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={usuarios.map(u => u.nombre_completo)}
                      onChange={(_, value) => field.onChange(value || '')}
                      value={field.value || ''}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Celador responsable"
                          error={!!errors.celador}
                          helperText={(errors.celador?.message as string) || "Seleccionar de los usuarios vigentes"}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth error={!!errors.mes_inicio}>
                  <InputLabel>Mes de inicio</InputLabel>
                  <Controller
                    name="mes_inicio"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Mes de inicio">
                        {MESES.map((m) => (
                          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Año de inicio"
                  type="number"
                  fullWidth
                  error={!!errors.anio_inicio}
                  {...register('anio_inicio', { valueAsNumber: true })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Paralelo (opcional)"
                  fullWidth
                  placeholder="Ej: A, B, Tarde"
                  {...register('paralelo')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de inicio real"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fecha_inicio}
                  {...register('fecha_inicio')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de finalización estimada"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fecha_fin}
                  helperText={errors.fecha_fin?.message as string}
                  {...register('fecha_fin')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={18} /> : editingClase ? 'Guardar Cambios' : 'Crear Clase'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
