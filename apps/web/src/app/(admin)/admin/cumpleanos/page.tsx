'use client';

import { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CakeIcon from '@mui/icons-material/Cake';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface UsuarioCumple {
  id: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  roles: { rol: { nombre: string } }[];
}

const DIAS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getMondayOf(date: Date): Date {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
}

function addDays(date: Date, n: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + n));
}

function firstOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, n: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
}

function sameUTCDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

export default function CumpleanosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioCumple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthStart, setMonthStart] = useState<Date>(() => firstOfMonth(todayUTC()));

  const today = todayUTC();

  useEffect(() => {
    api.get('/users/cumpleanos')
      .then(({ data }) => setUsuarios(data))
      .catch(() => setError('Error al cargar cumpleaños'))
      .finally(() => setLoading(false));
  }, []);

  // Grid of full weeks (Mon–Sun) covering the whole month
  const monthDays = useMemo(() => {
    const gridStart = getMondayOf(monthStart);
    const nextMonth = addMonths(monthStart, 1);
    const days: Date[] = [];
    let d = gridStart;
    while (d < nextMonth || days.length % 7 !== 0) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [monthStart]);

  const birthdaysByDay = useMemo(
    () => monthDays.map((day) => {
      const m = day.getUTCMonth();
      const d = day.getUTCDate();
      return usuarios.filter((u) => {
        const nac = new Date(u.fecha_nacimiento);
        return nac.getUTCMonth() === m && nac.getUTCDate() === d;
      });
    }),
    [monthDays, usuarios],
  );

  function prevMonth() { setMonthStart((p) => addMonths(p, -1)); }
  function nextMonth() { setMonthStart((p) => addMonths(p, 1)); }
  function goToday() { setMonthStart(firstOfMonth(todayUTC())); }

  const monthLabel = `${MESES_LARGO[monthStart.getUTCMonth()]} ${monthStart.getUTCFullYear()}`;

  return (
    <>
      <PageHeader title="Cumpleaños" subtitle="Calendario mensual" />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <IconButton onClick={prevMonth} size="small"><ChevronLeftIcon /></IconButton>
        <Typography variant="subtitle2" sx={{ minWidth: 180, textAlign: 'center', fontWeight: 500, textTransform: 'capitalize' }}>
          {monthLabel}
        </Typography>
        <IconButton onClick={nextMonth} size="small"><ChevronRightIcon /></IconButton>
        <Button size="small" variant="outlined" onClick={goToday}>Hoy</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: 1,
              minWidth: 800,
            }}
          >
            {/* Weekday header row */}
            {DIAS_SHORT.map((dia) => (
              <Box
                key={dia}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.4 }}>
                  {dia}
                </Typography>
              </Box>
            ))}

            {monthDays.map((day, i) => {
              const isToday = sameUTCDay(day, today);
              const inMonth = day.getUTCMonth() === monthStart.getUTCMonth();
              const users = birthdaysByDay[i];
              return (
                <Box
                  key={i}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isToday ? 'primary.main' : 'divider',
                    overflow: 'hidden',
                    minHeight: 92,
                    bgcolor: isToday ? 'rgba(25,118,210,0.04)' : 'background.paper',
                    opacity: inMonth ? 1 : 0.45,
                  }}
                >
                  {/* Day number */}
                  <Box sx={{ px: 1, pt: 0.5, textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 24,
                        height: 24,
                        borderRadius: '50%',
                        fontWeight: isToday ? 700 : 400,
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        color: isToday ? 'white' : 'text.secondary',
                        lineHeight: 1,
                      }}
                    >
                      {day.getUTCDate()}
                    </Typography>
                  </Box>

                  {/* Birthday items */}
                  <Box sx={{ p: 0.75, pt: 0.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {users.map((u) => {
                      const nac = new Date(u.fecha_nacimiento);
                      const edad = day.getUTCFullYear() - nac.getUTCFullYear();
                      const roles = u.roles.map((r) => r.rol.nombre).join(', ');
                      return (
                        <Tooltip key={u.id} title={`${roles} · ${edad} años`} arrow placement="top">
                          <Box
                            sx={{
                              bgcolor: isToday ? 'primary.main' : 'rgba(25,118,210,0.10)',
                              color: isToday ? 'white' : 'primary.dark',
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.4,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 0.5,
                              cursor: 'default',
                            }}
                          >
                            <CakeIcon sx={{ fontSize: 13, flexShrink: 0, mt: '1px' }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  lineHeight: 1.3,
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {u.nombre_completo}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.75, lineHeight: 1 }}>
                                {edad} años
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </>
  );
}
