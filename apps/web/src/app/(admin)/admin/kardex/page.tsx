'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

type Modo = 'miembro' | 'instructor' | 'clase';

interface UserOption { id: string; nombre_completo: string; roles: { rol: { nombre: string } }[]; }
interface ClaseOption { id: string; codigo: string; materia: { nombre: string }; instructor: { nombre_completo: string }; estado: string; }

interface SesionResumen { fecha: string; estado: string; tipo?: string; tema?: string | null; }

interface AsistenciaMiembro {
  inscripcion_id: string;
  clase: { id: string; codigo: string; estado: string; materia: { id: string; nombre: string } };
  nota_final: 'Sobresaliente' | 'Solido' | 'Aprobado' | 'Reprobado' | null;
  concluyo_temario: boolean;
  fecha_conclusion_temario: string | null;
  total_sesiones: number;
  presentes: number;
  ausentes: number;
  licencias: number;
  porcentaje: number;
  ultimas_sesiones: SesionResumen[];
}

interface SesionInstructorResumen {
  fecha: string;
  presentes: number;
  total: number;
  porcentaje: number;
}

interface ClaseInstructorStat {
  id: string;
  codigo: string;
  estado: string;
  materia: { nombre: string; nivel: number };
  total_sesiones: number;
  total_alumnos: number;
  promedio_asistencia: number;
  total_presencias: number;
  total_posibles: number;
  sesiones_historico: SesionInstructorResumen[];
}

interface AsistenciaAlumno {
  inscripcion_id: string;
  usuario: { id: string; nombre_completo: string };
  total_sesiones: number;
  presentes: number;
  ausentes: number;
  licencias: number;
  porcentaje: number;
  ultimas_sesiones: SesionResumen[];
}

function BarAsistencia({ value, height = 8 }: { value: number; height?: number }) {
  const color = value >= 75 ? 'success' : value >= 50 ? 'warning' : 'error';
  return (
    <LinearProgress
      variant="determinate"
      value={Math.max(0, Math.min(100, value))}
      color={color}
      sx={{ height, borderRadius: height / 2 }}
    />
  );
}

function PctChip({ value }: { value: number }) {
  const color = value >= 75 ? 'success' : value >= 50 ? 'warning' : 'error';
  return <Chip label={`${value}%`} size="small" color={color} />;
}

function fmtFecha(iso: string): string {
  const d = new Date(iso);
  const dia = d.getUTCDate().toString().padStart(2, '0');
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${dia}/${mes}`;
}

function SesionDot({ sesion }: { sesion: SesionResumen }) {
  const bg =
    sesion.estado === 'Presente' ? 'success.main' :
    sesion.estado === 'Licencia' ? 'warning.main' :
    'error.main';
  const label = sesion.estado === 'Presente' ? 'P' : sesion.estado === 'Licencia' ? 'L' : 'A';
  const tooltipLines = [
    `${fmtFecha(sesion.fecha)} · ${sesion.estado}`,
    sesion.tipo && `Tipo: ${sesion.tipo}`,
    sesion.tema && `Tema: ${sesion.tema}`,
  ].filter(Boolean).join('\n');
  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLines}</span>} arrow>
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: '4px',
          bgcolor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

const NOTA_COLOR: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  Sobresaliente: 'success',
  Solido: 'info',
  Aprobado: 'warning',
  Reprobado: 'error',
};

function fmtFechaLarga(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function pctToColor(pct: number): string {
  // 0% → red hsl(0), 100% → green hsl(120)
  const hue = Math.round(pct * 1.2);
  return `hsl(${hue}, 65%, 42%)`;
}

function SesionInstructorDot({ sesion }: { sesion: SesionInstructorResumen }) {
  return (
    <Tooltip
      title={`${fmtFecha(sesion.fecha)} · ${sesion.presentes}/${sesion.total} (${sesion.porcentaje}%)`}
      arrow
    >
      <Box
        style={{ backgroundColor: pctToColor(sesion.porcentaje) }}
        sx={{
          width: 26,
          height: 26,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'white', fontWeight: 700, fontSize: '0.6rem', lineHeight: 1 }}
        >
          {sesion.porcentaje}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default function AdminKardexPage() {
  const [modo, setModo] = useState<Modo>('miembro');
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);
  const [instructores, setInstructores] = useState<UserOption[]>([]);
  const [clases, setClases] = useState<ClaseOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soloActivas, setSoloActivas] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users', { params: { estado: 'Activo' } }),
      api.get('/users/eligible-instructors'),
      api.get('/clases'),
    ])
      .then(([resUsers, resInstr, resClases]) => {
        setUsuarios(
          (resUsers.data as UserOption[]).filter((u) =>
            u.roles.some((r) => ['Miembro', 'Probacionista'].includes(r.rol.nombre)),
          ),
        );
        setInstructores(resInstr.data);
        setClases(resClases.data);
      })
      .catch(() => setError('Error al cargar opciones'));
  }, []);

  useEffect(() => {
    if (!selectedId) { setData(null); return; }
    setLoading(true);
    setError('');
    const endpoint =
      modo === 'miembro' ? `/users/${selectedId}/asistencias` :
      modo === 'instructor' ? `/users/${selectedId}/instructor-stats` :
      `/clases/${selectedId}/asistencias/resumen`;
    api.get(endpoint)
      .then(({ data }) => setData(data))
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [selectedId, modo]);

  function handleModoChange(_: unknown, v: Modo | null) {
    if (!v) return;
    setModo(v);
    setSelectedId('');
    setSelectedUser(null);
    setData(null);
    setSoloActivas(true);
  }

  const clasesFiltradas = soloActivas ? clases.filter((c) => c.estado === 'Activa') : clases;
  const dataInstructorFiltrada = data && modo === 'instructor'
    ? (soloActivas ? (data as ClaseInstructorStat[]).filter((c) => c.estado === 'Activa') : data as ClaseInstructorStat[])
    : null;

  const labelSelector =
    modo === 'instructor' ? 'Seleccionar instructor' : 'Seleccionar clase';

  return (
    <>
      <PageHeader title="Kardex" subtitle="Análisis de asistencias" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>
        <ToggleButtonGroup
          value={modo}
          exclusive
          onChange={handleModoChange}
          size="small"
        >
          <ToggleButton value="miembro">
            <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />Miembro
          </ToggleButton>
          <ToggleButton value="instructor">
            <SchoolIcon fontSize="small" sx={{ mr: 0.5 }} />Instructor
          </ToggleButton>
          <ToggleButton value="clase">
            <ClassIcon fontSize="small" sx={{ mr: 0.5 }} />Clase
          </ToggleButton>
        </ToggleButtonGroup>

        {modo === 'miembro' ? (
          <Autocomplete
            options={usuarios}
            getOptionLabel={(u) => u.nombre_completo}
            value={selectedUser}
            onChange={(_, v) => {
              setSelectedUser(v);
              setSelectedId(v?.id ?? '');
            }}
            renderInput={(params) => (
              <TextField {...params} label="Buscar miembro" size="small" />
            )}
            sx={{ minWidth: 300 }}
            noOptionsText="Sin resultados"
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
          />
        ) : (
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>{labelSelector}</InputLabel>
            <Select value={selectedId} label={labelSelector} onChange={(e) => setSelectedId(e.target.value)}>
              {modo === 'instructor' && instructores.map((i) => (
                <MenuItem key={i.id} value={i.id}>{i.nombre_completo}</MenuItem>
              ))}
              {modo === 'clase' && clasesFiltradas.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.materia.nombre} — {c.codigo} · {c.instructor.nombre_completo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {modo !== 'miembro' && (
          <ToggleButtonGroup
            value={soloActivas ? 'activas' : 'todas'}
            exclusive
            onChange={(_, v) => {
              if (!v) return;
              const next = v === 'activas';
              setSoloActivas(next);
              if (modo === 'clase') { setSelectedId(''); setData(null); }
            }}
            size="small"
          >
            <ToggleButton value="activas">Activas</ToggleButton>
            <ToggleButton value="todas">Todas</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : !selectedId ? (
        <Alert severity="info">
          Seleccioná {modo === 'miembro' ? 'un miembro' : modo === 'instructor' ? 'un instructor' : 'una clase'} para ver el kardex.
        </Alert>
      ) : !data || data.length === 0 ? (
        <Alert severity="info">No hay datos de asistencia registrados.</Alert>
      ) : modo === 'instructor' && dataInstructorFiltrada?.length === 0 ? (
        <Alert severity="info">Este instructor no tiene clases activas. Cambiá el filtro a "Todas" para ver el historial completo.</Alert>
      ) : (
        <>
          {/* ── MIEMBRO ── */}
          {modo === 'miembro' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(data as AsistenciaMiembro[]).map((a) => (
                <Card key={a.inscripcion_id} elevation={1}>
                  <CardContent>
                    {/* Encabezado: materia + estado de clase + % asistencia */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <SchoolIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                        {a.clase.materia.nombre}
                      </Typography>
                      <Chip
                        label={a.clase.estado}
                        size="small"
                        color={a.clase.estado === 'Activa' ? 'success' : a.clase.estado === 'Finalizada' ? 'default' : 'warning'}
                        variant="outlined"
                        sx={{ mr: 0.5 }}
                      />
                      <PctChip value={a.porcentaje} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {a.clase.codigo}
                    </Typography>

                    <BarAsistencia value={a.porcentaje} />

                    {/* Estadísticas de asistencia */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">Sesiones: <strong>{a.total_sesiones}</strong></Typography>
                      <Typography variant="body2" color="success.main">Presentes: <strong>{a.presentes}</strong></Typography>
                      <Typography variant="body2" color="error.main">Ausentes: <strong>{a.ausentes}</strong></Typography>
                      <Typography variant="body2" color="warning.main">Licencias: <strong>{a.licencias}</strong></Typography>
                    </Box>

                    {/* Conclusión y nota final */}
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {a.concluyo_temario
                          ? <CheckCircleIcon fontSize="small" color="success" />
                          : <CancelIcon fontSize="small" color="disabled" />}
                        <Typography variant="body2" color={a.concluyo_temario ? 'success.main' : 'text.disabled'}>
                          {a.concluyo_temario ? 'Concluyó temario' : 'Sin concluir temario'}
                        </Typography>
                        {a.concluyo_temario && a.fecha_conclusion_temario && (
                          <Typography variant="caption" color="text.secondary">
                            ({fmtFechaLarga(a.fecha_conclusion_temario)})
                          </Typography>
                        )}
                      </Box>
                      {a.nota_final && (
                        <Chip
                          label={`Nota: ${a.nota_final}`}
                          size="small"
                          color={NOTA_COLOR[a.nota_final] ?? 'default'}
                        />
                      )}
                    </Box>

                    {a.ultimas_sesiones.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Últimas sesiones (antiguo → reciente)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {a.ultimas_sesiones.map((s, i) => (
                            <SesionDot key={i} sesion={s} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* ── INSTRUCTOR ── */}
          {modo === 'instructor' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(dataInstructorFiltrada ?? [])
                .sort((a: ClaseInstructorStat, b: ClaseInstructorStat) => b.promedio_asistencia - a.promedio_asistencia)
                .map((c: ClaseInstructorStat) => (
                  <Card key={c.id} elevation={1}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {c.materia.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Nivel {c.materia.nivel} · {c.codigo} · {c.estado}
                          </Typography>
                        </Box>
                        <PctChip value={c.promedio_asistencia} />
                      </Box>

                      <BarAsistencia value={c.promedio_asistencia} />

                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          Sesiones: <strong>{c.total_sesiones}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Alumnos: <strong>{c.total_alumnos}</strong>
                        </Typography>
                        {c.total_posibles > 0 && (
                          <Typography variant="body2" color="primary.main">
                            Asistencias: <strong>{c.total_presencias}/{c.total_posibles}</strong>
                          </Typography>
                        )}
                      </Box>

                      {c.sesiones_historico.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Historial por sesión (antiguo → reciente)
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {c.sesiones_historico.map((s, i) => (
                              <SesionInstructorDot key={i} sesion={s} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}

          {/* ── CLASE ── */}
          {modo === 'clase' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {(data as AsistenciaAlumno[])
                .sort((a, b) => b.porcentaje - a.porcentaje)
                .map((a) => (
                  <Card key={a.inscripcion_id} elevation={1}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body1" sx={{ flex: 1 }}>
                          {a.usuario?.nombre_completo ?? '—'}
                        </Typography>
                        <PctChip value={a.porcentaje} />
                      </Box>
                      <BarAsistencia value={a.porcentaje} height={6} />
                      <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">Sesiones: <strong>{a.total_sesiones}</strong></Typography>
                        <Typography variant="caption" color="success.main">Presentes: <strong>{a.presentes}</strong></Typography>
                        <Typography variant="caption" color="error.main">Ausentes: <strong>{a.ausentes}</strong></Typography>
                        <Typography variant="caption" color="warning.main">Licencias: <strong>{a.licencias}</strong></Typography>
                      </Box>
                      {a.ultimas_sesiones?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {a.ultimas_sesiones.map((s, i) => (
                              <SesionDot key={i} sesion={s} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}
