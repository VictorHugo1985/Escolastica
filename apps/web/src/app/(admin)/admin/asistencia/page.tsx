'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula: { id: string; nombre: string } | null;
}

interface Clase {
  id: string;
  codigo: string;
  estado: string;
  materia: { id: string; nombre: string; nivel: number };
  instructor: { id: string; nombre_completo: string };
  horarios: Horario[];
  _count: { inscripciones: number };
}

interface Instructor {
  id: string;
  nombre_completo: string;
}

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatHora(h: string): string {
  const d = h.includes('T') ? new Date(h) : new Date(`1970-01-01T${h}Z`);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

export default function ListasPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const esEscol = user?.roles.includes('Escolastico') ?? false;

  const [clases, setClases] = useState<Clase[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroInstructor, setFiltroInstructor] = useState<string>('');
  const [filtroDia, setFiltroDia] = useState<number | null>(null);

  // Carga de datos (no toca el filtro de día)
  useEffect(() => {
    if (!user) return;

    const params: Record<string, string> = { estado: 'Activa' };
    if (!esEscol) params.instructor_id = user.id;

    const requests = [api.get('/clases', { params })];
    if (esEscol) requests.push(api.get('/users/eligible-instructors'));

    Promise.all(requests)
      .then(([resClases, resInstructores]) => {
        setClases(resClases.data);
        if (resInstructores) setInstructores(resInstructores.data);
      })
      .catch(() => setError('Error al cargar las clases'))
      .finally(() => setLoading(false));
  }, [esEscol, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const clasesFiltradas = useMemo(() => {
    let result = clases;
    if (filtroInstructor) result = result.filter((c) => c.instructor.id === filtroInstructor);
    if (filtroDia !== null) result = result.filter((c) => c.horarios.some((h) => h.dia_semana === filtroDia));
    return result;
  }, [clases, filtroInstructor, filtroDia]);

  return (
    <>
      <PageHeader
        title="Listas"
        subtitle={filtroDia !== null
          ? `${clasesFiltradas.length} clase(s) el ${DIAS_LARGO[filtroDia]}`
          : `${clasesFiltradas.length} clase${clasesFiltradas.length !== 1 ? 's' : ''} activa${clasesFiltradas.length !== 1 ? 's' : ''}`}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        {esEscol && instructores.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Filtrar por instructor</InputLabel>
            <Select
              value={filtroInstructor}
              label="Filtrar por instructor"
              onChange={(e) => setFiltroInstructor(e.target.value)}
            >
              <MenuItem value=""><em>Todos los instructores</em></MenuItem>
              {instructores.map((i) => (
                <MenuItem key={i.id} value={i.id}>{i.nombre_completo}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <ToggleButtonGroup
          exclusive
          value={filtroDia === null ? 'all' : String(filtroDia)}
          onChange={(_, v) => {
            if (v === null) return; // clic sobre botón ya activo en mobile — ignorar deselect
            setFiltroDia(v === 'all' ? null : Number(v));
          }}
          size="small"
          sx={{ flexWrap: 'nowrap' }}
        >
          <Tooltip title="Todos los días">
            <ToggleButton value="all" sx={{ px: 1, minWidth: 34 }}>
              <ViewWeekIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <Tooltip key={d} title={DIAS_LARGO[d]}>
              <ToggleButton value={String(d)} sx={{ px: 1, minWidth: 34 }}>
                <Typography variant="caption" fontWeight={700} lineHeight={1}>
                  {DIAS_CORTO[d]}
                </Typography>
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : clasesFiltradas.length === 0 ? (
        <Alert severity="info">
          {filtroInstructor
            ? 'El instructor seleccionado no tiene clases activas.'
            : 'No hay clases activas en el sistema.'}
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {clasesFiltradas.map((clase) => (
            <Card key={clase.id} elevation={2} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardActionArea
                onClick={() => router.push(`/admin/asistencia/${clase.id}`)}
                sx={{ flex: 1, alignItems: 'flex-start' }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <SchoolIcon color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {clase.materia.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Nivel {clase.materia.nivel} · {clase.codigo}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {clase.instructor.nombre_completo}
                    </Typography>
                  </Box>

                  {clase.horarios.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 0.25 }} />
                        {clase.horarios.map((h, i) => (
                          <Chip
                            key={i}
                            size="small"
                            label={`${DIAS_CORTO[h.dia_semana]} ${formatHora(h.hora_inicio)}–${formatHora(h.hora_fin)}`}
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                      {clase.horarios[0]?.aula && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, ml: 0.25 }}>
                          <MeetingRoomIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {clase.horarios[0].aula.nombre}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {clase._count.inscripciones} alumnos activos
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
