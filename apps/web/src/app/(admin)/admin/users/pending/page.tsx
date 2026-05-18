'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

const DIAS_LABEL: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

interface InstructorReferencia {
  id: string;
  nombre_completo: string;
  estado_inscripcion: string;
  materia: string;
  dias_semana: number[];
}

interface Usuario {
  id: string;
  email: string | null;
  telefono: string | null;
  nombre_completo: string;
  created_at: string;
  fecha_entrevista: string | null;
  entrevista_completada: boolean;
  instructor_referencia: InstructorReferencia | null;
}

interface InterviewState {
  fecha_entrevista: string;
  entrevista_completada: boolean;
  saving: boolean;
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoting, setPromoting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Record<string, InterviewState>>({});
  const [filtroInstructor, setFiltroInstructor] = useState('');
  const [filtroDia, setFiltroDia] = useState<number | ''>('');

  const instructoresDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      const ir = u.instructor_referencia;
      if (ir) map.set(ir.id, ir.nombre_completo);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const diasDisponibles = useMemo(() => {
    const set = new Set<number>();
    for (const u of users) {
      for (const d of u.instructor_referencia?.dias_semana ?? []) set.add(d);
    }
    return Array.from(set).sort();
  }, [users]);

  const usersFiltrados = useMemo(() => users.filter((u) => {
    if (filtroInstructor && u.instructor_referencia?.id !== filtroInstructor) return false;
    if (filtroDia !== '' && !u.instructor_referencia?.dias_semana.includes(filtroDia as number)) return false;
    return true;
  }), [users, filtroInstructor, filtroDia]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/users/pending-approval');
      setUsers(data);
      const init: Record<string, InterviewState> = {};
      for (const u of data) {
        init[u.id] = {
          fecha_entrevista: u.fecha_entrevista ? u.fecha_entrevista.slice(0, 10) : '',
          entrevista_completada: u.entrevista_completada ?? false,
          saving: false,
        };
      }
      setInterviews(init);
    } catch {
      setError('Error al cargar la bandeja');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function setInterview(userId: string, patch: Partial<InterviewState>) {
    setInterviews((prev) => ({ ...prev, [userId]: { ...prev[userId], ...patch } }));
  }

  async function saveInterview(userId: string, overrides?: Partial<InterviewState>) {
    const iv = { ...interviews[userId], ...overrides };
    if (!iv) return;
    setInterview(userId, { saving: true });
    try {
      await api.patch(`/users/${userId}/interview`, {
        fecha_entrevista: iv.fecha_entrevista || null,
        entrevista_completada: iv.entrevista_completada,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar entrevista');
    } finally {
      setInterview(userId, { saving: false });
    }
  }

  async function handleCheckboxChange(userId: string, checked: boolean) {
    setInterview(userId, { entrevista_completada: checked });
    await saveInterview(userId, { entrevista_completada: checked });
  }

  async function handlePromote(user: Usuario) {
    if (!confirm(`¿Promover a "${user.nombre_completo}" como Miembro?`)) return;
    setPromoting(user.id);
    try {
      await api.post(`/users/${user.id}/promote`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al promover');
    } finally {
      setPromoting(null);
    }
  }

  async function handleReject(user: Usuario) {
    if (!confirm(`¿Dar de baja a "${user.nombre_completo}"? Se le asignará el rol Ex-probacionista.`)) return;
    setRejecting(user.id);
    try {
      await api.post(`/users/${user.id}/reject`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al dar de baja');
    } finally {
      setRejecting(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Bandeja de aprobación"
        subtitle="Probacionistas pendientes de promoción a Miembro"
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {users.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Instructor</InputLabel>
            <Select value={filtroInstructor} label="Instructor" onChange={(e) => setFiltroInstructor(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {instructoresDisponibles.map(([id, nombre]) => (
                <MenuItem key={id} value={id}>{nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Día</InputLabel>
            <Select value={filtroDia} label="Día" onChange={(e) => setFiltroDia(e.target.value as number | '')}>
              <MenuItem value="">Todos</MenuItem>
              {diasDisponibles.map((d) => (
                <MenuItem key={d} value={d}>{DIAS_LABEL[d] ?? d}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(filtroInstructor || filtroDia !== '') && (
            <Button size="small" variant="text" onClick={() => { setFiltroInstructor(''); setFiltroDia(''); }}>
              Limpiar filtros
            </Button>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {usersFiltrados.length} de {users.length} probacionistas
          </Typography>
        </Box>
      )}

      {usersFiltrados.length === 0 && !loading ? (
        <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
          <CheckCircleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6">No hay probacionistas pendientes</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {usersFiltrados.map((user) => {
            const iv = interviews[user.id];
            return (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <PersonIcon color="action" />
                      <Box>
                        <Typography fontWeight={600}>{user.nombre_completo}</Typography>
                        {user.email && (
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        )}
                        {user.telefono && (
                          <Typography variant="caption" color="text.secondary" display="block">{user.telefono}</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                      Ingresó: {new Date(user.created_at).toLocaleDateString('es-AR')}
                    </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        ENTREVISTA
                      </Typography>
                      {iv?.saving && <CircularProgress size={10} />}
                    </Box>

                    {iv && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {iv.fecha_entrevista ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              label=""
                              type="date"
                              size="small"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              value={iv.fecha_entrevista}
                              onChange={(e) => setInterview(user.id, { fecha_entrevista: e.target.value })}
                              onBlur={() => saveInterview(user.id)}
                            />
                            <Button
                              size="small"
                              color="inherit"
                              sx={{ minWidth: 0, px: 0.5, color: 'text.disabled' }}
                              onClick={() => { setInterview(user.id, { fecha_entrevista: '' }); saveInterview(user.id, { fecha_entrevista: '' }); }}
                            >✕</Button>
                          </Box>
                        ) : (
                          <Button size="small" variant="text" sx={{ alignSelf: 'flex-start', px: 0, color: 'text.secondary' }}
                            onClick={() => setInterview(user.id, { fecha_entrevista: new Date().toISOString().slice(0, 10) })}>
                            + Programar fecha
                          </Button>
                        )}
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={iv.entrevista_completada}
                              disabled={iv.saving}
                              onChange={(e) => handleCheckboxChange(user.id, e.target.checked)}
                            />
                          }
                          label={<Typography variant="body2">Realizada</Typography>}
                        />
                      </Box>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <SchoolIcon fontSize="small" color="action" />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        INSTRUCTOR
                      </Typography>
                    </Box>

                    {user.instructor_referencia ? (
                      <Box sx={{ pl: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {user.instructor_referencia.nombre_completo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {user.instructor_referencia.materia}
                        </Typography>
                        {user.instructor_referencia.dias_semana.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {user.instructor_referencia.dias_semana.map((d) => (
                              <Chip key={d} label={DIAS_LABEL[d] ?? d} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>
                        Sin inscripción registrada
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ flexDirection: 'column', gap: 1, p: 1.5, pt: 0 }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      startIcon={promoting === user.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                      disabled={promoting === user.id || rejecting === user.id}
                      onClick={() => handlePromote(user)}
                    >
                      Promover a Miembro
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      fullWidth
                      startIcon={rejecting === user.id ? <CircularProgress size={14} color="inherit" /> : <PersonRemoveIcon />}
                      disabled={promoting === user.id || rejecting === user.id}
                      onClick={() => handleReject(user)}
                    >
                      Descartar promoción
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}
