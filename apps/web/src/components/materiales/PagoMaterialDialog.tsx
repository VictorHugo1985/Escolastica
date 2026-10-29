'use client';

import { useEffect, useState } from 'react';
import { MontoSchema } from '@escolastica/shared';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useMediaQuery, useTheme } from '@mui/material';
import { api } from '@/lib/api';

export interface TemaOption {
  id: string;
  titulo: string;
}

export interface PagoInicial {
  id: string;
  fecha: string;
  monto: number;
  tema_ids: string[];
  comentarios: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  claseId: string;
  temasMateria: TemaOption[];
  alumno: { inscripcion_id: string; nombre_completo: string };
  temasSugeridos?: string[];
  inicial?: PagoInicial;
}

function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Alta y edición de un pago de material (spec 032). Pantalla completa en móvil.
export default function PagoMaterialDialog({
  open, onClose, onSaved, claseId, temasMateria, alumno, temasSugeridos = [], inicial,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [fecha, setFecha] = useState(hoy());
  const [montoTexto, setMontoTexto] = useState('');
  const [temaIds, setTemaIds] = useState<string[]>([]);
  const [comentarios, setComentarios] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFecha(inicial?.fecha ?? hoy());
    setMontoTexto(inicial ? String(inicial.monto) : '');
    setTemaIds(inicial?.tema_ids ?? temasSugeridos);
    setComentarios(inicial?.comentarios ?? '');
    setError('');
    setConfirmDelete(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Acepta coma o punto como separador decimal
  const montoNumero = montoTexto.trim() === '' ? NaN : Number(montoTexto.trim().replace(',', '.'));
  const montoValido = MontoSchema.safeParse(montoNumero);
  const montoError = montoTexto.trim() !== '' && !montoValido.success;

  async function handleSave() {
    if (!montoValido.success) {
      setError('Ingresá un monto válido: solo números ≥ 0 con un decimal como máximo');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      fecha,
      monto: montoValido.data,
      tema_ids: temaIds,
      comentarios: comentarios.trim() || null,
    };
    try {
      if (inicial) {
        await api.patch(`/clases/${claseId}/material/pagos/${inicial.id}`, payload);
      } else {
        await api.post(`/clases/${claseId}/material/pagos`, { ...payload, inscripcion_id: alumno.inscripcion_id });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar el pago';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!inicial) return;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/clases/${claseId}/material/pagos/${inicial.id}`);
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al eliminar el pago';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={isMobile} maxWidth="xs" fullWidth>
      <DialogTitle>
        {inicial ? 'Editar pago' : 'Nuevo pago'} · {alumno.nombre_completo}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Monto (Bs)"
            value={montoTexto}
            onChange={(e) => setMontoTexto(e.target.value)}
            inputProps={{ inputMode: 'decimal' }}
            error={montoError}
            helperText={montoError ? 'Solo números ≥ 0 con un decimal como máximo' : ' '}
            autoFocus
            fullWidth
          />
          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Temas del material</InputLabel>
            <Select
              multiple
              value={temaIds}
              label="Temas del material"
              onChange={(e) => setTemaIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
              renderValue={(selected) =>
                (selected as string[]).map((id) => temasMateria.find((t) => t.id === id)?.titulo ?? id).join(', ')
              }
            >
              {temasMateria.length === 0 && <MenuItem disabled value=""><em>La materia no tiene temas</em></MenuItem>}
              {temasMateria.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.titulo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Comentarios (opcional)"
            multiline
            rows={2}
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            fullWidth
          />
          {confirmDelete && inicial && (
            <Alert
              severity="warning"
              action={
                <Button color="error" size="small" onClick={handleDelete} disabled={saving}>
                  Eliminar
                </Button>
              }
            >
              ¿Eliminar el pago de {inicial.monto} del {fmtFecha(inicial.fecha)}?
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {inicial && !confirmDelete && (
          <Button color="error" onClick={() => setConfirmDelete(true)} disabled={saving} sx={{ mr: 'auto' }}>
            Eliminar
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !montoValido.success}>
          {saving ? <CircularProgress size={18} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
