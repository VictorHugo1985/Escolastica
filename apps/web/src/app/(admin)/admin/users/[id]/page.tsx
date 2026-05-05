'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, UpdateUserSchema } from '@escolastica/shared';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

const ALL_ROLES = ['Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExMiembro'];

interface RolEntry {
  rol: { id: string; nombre: string };
}

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentRoles, setCurrentRoles] = useState<RolEntry[]>([]);
  const [roleToAdd, setRoleToAdd] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [currentEstado, setCurrentEstado] = useState('Activo');

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(isNew ? CreateUserSchema : UpdateUserSchema),
    defaultValues: {
      nombre_completo: '',
      email: '',
      ci: '',
      telefono: '',
      genero: '',
      fecha_nacimiento: '',
      fecha_inscripcion: '',
      fecha_recibimiento: '',
      file_actualizado: false,
    },
  });

  async function loadUser() {
    try {
      const { data } = await api.get(`/users/${id}`);
      reset({
        email: data.email ?? '',
        nombre_completo: data.nombre_completo ?? '',
        ci: data.ci ?? '',
        telefono: data.telefono ?? '',
        genero: data.genero ?? '',
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '',
        fecha_inscripcion: data.fecha_inscripcion ? data.fecha_inscripcion.split('T')[0] : '',
        fecha_recibimiento: data.fecha_recibimiento ? data.fecha_recibimiento.split('T')[0] : '',
        file_actualizado: data.file_actualizado ?? false,
      });
      setCurrentRoles(data.roles ?? []);
      setCurrentEstado(data.estado ?? 'Activo');
    } catch {
      setError('Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isNew) loadUser();
  }, [id]);

  async function onSubmit(resolvedData: any) {
    setError('');
    setSuccess('');
    try {
      if (isNew) {
        const payload = Object.fromEntries(
          Object.entries(resolvedData).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        await api.post('/users', payload);
        router.push('/admin/users');
      } else {
        const v = getValues();
        const payload: Record<string, any> = { estado: currentEstado };
        if (v.nombre_completo) payload.nombre_completo = v.nombre_completo;
        if (v.email !== undefined) payload.email = v.email || null;
        if (v.ci !== undefined) payload.ci = v.ci || null;
        if (v.telefono !== undefined) payload.telefono = v.telefono || null;
        if (v.genero !== undefined) payload.genero = v.genero || null;
        if (v.fecha_nacimiento) payload.fecha_nacimiento = v.fecha_nacimiento;
        if (v.fecha_inscripcion) payload.fecha_inscripcion = v.fecha_inscripcion;
        if (v.fecha_recibimiento) payload.fecha_recibimiento = v.fecha_recibimiento;
        payload.file_actualizado = !!v.file_actualizado;
        await api.patch(`/users/${id}`, payload);
        setSuccess('Perfil actualizado correctamente');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  async function handleAddRole() {
    if (!roleToAdd) return;
    setAddingRole(true);
    setError('');
    try {
      const { data } = await api.post(`/users/${id}/roles`, { rol: roleToAdd });
      setCurrentRoles(data.roles ?? []);
      setRoleToAdd('');
      setSuccess(`Rol "${roleToAdd}" agregado`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al agregar rol';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setAddingRole(false);
    }
  }

  async function handleRemoveRole(rolNombre: string) {
    if (!confirm(`¿Quitar el rol "${rolNombre}" de este usuario?`)) return;
    setError('');
    try {
      const { data } = await api.delete(`/users/${id}/roles/${rolNombre}`);
      setCurrentRoles(data.roles ?? []);
      setSuccess(`Rol "${rolNombre}" revocado`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al quitar rol';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  const currentRoleNames = currentRoles.map((r) => r.rol.nombre);
  const availableToAdd = ALL_ROLES.filter((r) => !currentRoleNames.includes(r));

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'Nuevo usuario' : 'Editar usuario'}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isNew && (
              <Button size="small" onClick={() => router.push(`/admin/users/${id}/movimientos`)}>
                Historial
              </Button>
            )}
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/users')}>
              Volver
            </Button>
          </Box>
        }
      />

      <Card sx={{ maxWidth: 720 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          {!isNew && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {currentRoles.map((r) => (
                <Chip key={r.rol.id} label={r.rol.nombre} color="primary" size="small" />
              ))}
              <Chip label={currentEstado} color={currentEstado === 'Activo' ? 'success' : 'default'} size="small" />
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Datos personales
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre completo *" fullWidth
                  error={!!errors.nombre_completo}
                  helperText={errors.nombre_completo?.message as string}
                  {...register('nombre_completo')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Correo electrónico" type="text" fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message as string}
                  {...register('email')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="CI" fullWidth {...register('ci')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" fullWidth placeholder="Ej: 72345678"
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message as string}
                  {...register('telefono')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Género</InputLabel>
                  <Controller name="genero" control={control} defaultValue=""
                    render={({ field }) => (
                      <Select {...field} label="Género">
                        <MenuItem value="">Sin especificar</MenuItem>
                        <MenuItem value="Masculino">Masculino</MenuItem>
                        <MenuItem value="Femenino">Femenino</MenuItem>
                        <MenuItem value="Otro">Otro</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Fecha de nacimiento" type="date" fullWidth
                  InputLabelProps={{ shrink: true }} {...register('fecha_nacimiento')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Fecha de inscripción" type="date" fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha en que ingresó como probacionista"
                  {...register('fecha_inscripcion')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Fecha de recibimiento" type="date" fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha en que fue promovido a Miembro"
                  {...register('fecha_recibimiento')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="file_actualizado"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="success"
                        />
                      }
                      label="Documentos presentados"
                    />
                  )}
                />
              </Grid>

              {!isNew && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={currentEstado}
                      label="Estado"
                      onChange={(e) => setCurrentEstado(e.target.value)}
                    >
                      <MenuItem value="Activo">Activo</MenuItem>
                      <MenuItem value="Inactivo">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>

            {isNew && (
              <Alert severity="info" sx={{ mt: 2 }}>
                El usuario se crea con rol <strong>Probacionista</strong>. Solo el campo nombre es obligatorio.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={18} /> : isNew ? 'Crear usuario' : 'Guardar cambios'}
              </Button>
              <Button onClick={() => router.push('/admin/users')}>Cancelar</Button>
            </Box>
          </Box>

          {!isNew && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Gestión de roles
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Los permisos se acumulan. Probacionista y ExMiembro son exclusivos.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {currentRoles.map((r) => (
                  <Chip
                    key={r.rol.id}
                    label={r.rol.nombre}
                    color="primary"
                    onDelete={currentRoles.length > 1 ? () => handleRemoveRole(r.rol.nombre) : undefined}
                  />
                ))}
              </Box>

              {availableToAdd.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Agregar rol</InputLabel>
                    <Select value={roleToAdd} label="Agregar rol" onChange={(e) => setRoleToAdd(e.target.value)}>
                      {availableToAdd.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                    <FormHelperText>Solo roles no asignados aún</FormHelperText>
                  </FormControl>
                  <IconButton
                    color="primary"
                    disabled={!roleToAdd || addingRole}
                    onClick={handleAddRole}
                    sx={{ mt: 0.5 }}
                  >
                    {addingRole ? <CircularProgress size={20} /> : <AddIcon />}
                  </IconButton>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
