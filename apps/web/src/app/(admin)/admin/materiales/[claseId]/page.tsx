'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import PageHeader from '@/components/ui/PageHeader';
import PagoMaterialDialog, { type TemaOption, type PagoInicial } from '@/components/materiales/PagoMaterialDialog';
import { api } from '@/lib/api';

interface Pago {
  id: string;
  fecha: string;
  monto: number;
  comentarios: string | null;
  temas: TemaOption[];
  registrado_por: { id: string; nombre_completo: string } | null;
}

interface Fila {
  inscripcion_id: string;
  usuario: { id: string; nombre_completo: string };
  estado_inscripcion: string;
  total_pagado: number;
  temas_sugeridos: TemaOption[];
  pagos: Pago[];
}

interface ControlMaterial {
  cabecera: { id: string; comentarios: string | null } | null;
  filas: Fila[];
  total_clase: number;
  alumnos_con_pagos: number;
  total_inscritos: number;
}

interface ClaseInfo {
  id: string;
  codigo: string;
  estado: string;
  materia: { id: string; nombre: string };
  instructor: { nombre_completo: string };
}

interface DialogState {
  fila: Fila;
  inicial?: PagoInicial;
}

function fmtMonto(v: number): string {
  return v.toFixed(1);
}

function fmtFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function MaterialClasePage() {
  const { claseId } = useParams<{ claseId: string }>();
  const router = useRouter();

  const [clase, setClase] = useState<ClaseInfo | null>(null);
  const [temas, setTemas] = useState<TemaOption[]>([]);
  const [control, setControl] = useState<ControlMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [comentarioGeneral, setComentarioGeneral] = useState('');
  const [guardandoComentario, setGuardandoComentario] = useState(false);

  const loadControl = useCallback(async () => {
    const { data } = await api.get<ControlMaterial>(`/clases/${claseId}/material`);
    setControl(data);
    setComentarioGeneral(data.cabecera?.comentarios ?? '');
  }, [claseId]);

  useEffect(() => {
    (async () => {
      try {
        const { data: c } = await api.get<ClaseInfo>(`/clases/${claseId}`);
        setClase(c);
        const [resTemas] = await Promise.all([api.get(`/materias/${c.materia.id}/temas`), loadControl()]);
        setTemas(resTemas.data.map((t: TemaOption) => ({ id: t.id, titulo: t.titulo })));
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Error al cargar el material de la clase';
        setError(Array.isArray(msg) ? msg.join(', ') : msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [claseId, loadControl]);

  function toggleExpandido(inscripcionId: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(inscripcionId)) next.delete(inscripcionId);
      else next.add(inscripcionId);
      return next;
    });
  }

  async function handleSaved() {
    try {
      await loadControl();
    } catch {
      setError('Error al recargar los pagos');
    }
  }

  async function guardarComentarioGeneral() {
    setGuardandoComentario(true);
    try {
      await api.patch(`/clases/${claseId}/material`, { comentarios: comentarioGeneral.trim() || null });
      await loadControl();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar el comentario';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setGuardandoComentario(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const comentarioCambiado = comentarioGeneral.trim() !== (control?.cabecera?.comentarios ?? '');

  return (
    <>
      <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => router.push('/admin/materiales')} sx={{ mb: 1 }}>
        Materiales
      </Button>
      <PageHeader
        title={clase ? `Material · ${clase.materia.nombre}` : 'Material'}
        subtitle={clase ? `${clase.instructor.nombre_completo} · ${clase.codigo}` : undefined}
        action={clase?.estado === 'Finalizada' ? <Chip size="small" label="Finalizada" /> : undefined}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {control && (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <Chip
              color="primary"
              label={`${control.alumnos_con_pagos}/${control.total_inscritos} con pagos · Total ${fmtMonto(control.total_clase)} Bs`}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 3 }}>
            <TextField
              label="Comentario general (opcional)"
              size="small"
              fullWidth
              multiline
              maxRows={3}
              value={comentarioGeneral}
              onChange={(e) => setComentarioGeneral(e.target.value)}
            />
            {comentarioCambiado && (
              <Button variant="outlined" onClick={guardarComentarioGeneral} disabled={guardandoComentario}>
                {guardandoComentario ? <CircularProgress size={18} /> : 'Guardar'}
              </Button>
            )}
          </Box>

          {control.filas.length === 0 ? (
            <Alert severity="info">La clase no tiene alumnos inscritos.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {control.filas.map((fila) => {
                const esBaja = fila.estado_inscripcion !== 'Activo';
                const abierto = expandidos.has(fila.inscripcion_id);
                return (
                  <Card key={fila.inscripcion_id} variant="outlined" sx={esBaja ? { bgcolor: 'action.hover' } : undefined}>
                    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color={esBaja ? 'disabled' : 'action'} />
                        <Box
                          sx={{ flex: 1, minWidth: 0, cursor: fila.pagos.length > 0 ? 'pointer' : 'default' }}
                          onClick={() => fila.pagos.length > 0 && toggleExpandido(fila.inscripcion_id)}
                        >
                          <Typography
                            variant="body1"
                            noWrap
                            sx={{ color: esBaja ? 'text.disabled' : 'text.primary', textDecoration: esBaja ? 'line-through' : 'none' }}
                          >
                            {fila.usuario.nombre_completo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fila.pagos.length === 0
                              ? 'sin pagos'
                              : `Total ${fmtMonto(fila.total_pagado)} Bs · ${fila.pagos.length} pago${fila.pagos.length !== 1 ? 's' : ''}`}
                          </Typography>
                        </Box>
                        {esBaja && <Chip size="small" label="Baja" />}
                        {fila.pagos.length > 0 && (
                          <IconButton size="small" onClick={() => toggleExpandido(fila.inscripcion_id)}>
                            {abierto ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        )}
                        {!esBaja && (
                          <Tooltip title="Registrar pago">
                            <IconButton color="primary" onClick={() => setDialog({ fila })}>
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      <Collapse in={abierto} unmountOnExit>
                        <Box sx={{ mt: 1, pl: 3.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {fila.pagos.map((pago) => (
                            <Box
                              key={pago.id}
                              onClick={() => setDialog({
                                fila,
                                inicial: {
                                  id: pago.id,
                                  fecha: pago.fecha,
                                  monto: pago.monto,
                                  tema_ids: pago.temas.map((t) => t.id),
                                  comentarios: pago.comentarios,
                                },
                              })}
                              sx={{
                                display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap',
                                p: 0.75, borderRadius: 1, cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 42 }}>
                                {fmtFecha(pago.fecha)}
                              </Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 56 }}>
                                {fmtMonto(pago.monto)}
                              </Typography>
                              {pago.temas.length > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  {pago.temas.map((t) => t.titulo).join(', ')}
                                </Typography>
                              )}
                              {pago.comentarios && (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  “{pago.comentarios}”
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}

      {dialog && (
        <PagoMaterialDialog
          open
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
          claseId={claseId}
          temasMateria={temas}
          alumno={{ inscripcion_id: dialog.fila.inscripcion_id, nombre_completo: dialog.fila.usuario.nombre_completo }}
          temasSugeridos={dialog.fila.temas_sugeridos.map((t) => t.id)}
          inicial={dialog.inicial}
        />
      )}
    </>
  );
}
