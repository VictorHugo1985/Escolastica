'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useMediaQuery, useTheme } from '@mui/material';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificacionDto {
  id: string;
  tipo: 'pase_de_lista' | 'baja_inscrito' | 'promocion_miembro' | 'clase_inactiva';
  descripcion: string;
  actor: { id: string; nombre_completo: string } | null;
  clase: { id: string; codigo: string; materia: string } | null;
  usuario_afectado: { id: string; nombre_completo: string } | null;
  created_at: string;
}

const TIPO_LABELS: Record<string, { label: string; color: 'info' | 'error' | 'success' | 'warning' }> = {
  pase_de_lista: { label: 'Pase de lista', color: 'info' },
  baja_inscrito: { label: 'Baja', color: 'error' },
  promocion_miembro: { label: 'Promoción', color: 'success' },
  clase_inactiva: { label: 'Clases inactivas', color: 'warning' },
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificacionesButton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionDto[]>([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const { data } = await api.get<{ notificaciones: NotificacionDto[]; total_no_leidas: number }>(
        '/notificaciones',
      );
      setNotificaciones(data.notificaciones);
      setTotalNoLeidas(data.total_no_leidas);
    } catch {
      // Silently fail — badge stays at previous value
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const handleOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
    setLoading(true);
    try {
      await api.put('/notificaciones');
      setTotalNoLeidas(0);
      await fetchNotificaciones();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
  };

  const handleVerTodas = () => {
    handleClose();
    router.push('/admin/notificaciones');
  };

  const panelContent = (
    <Box sx={{ width: isMobile ? '100vw' : 360, maxWidth: '100vw' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Actividad reciente
        </Typography>
        {loading && <CircularProgress size={16} />}
      </Box>
      <Divider />
      {notificaciones.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay actividad reciente.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notificaciones.map((n) => {
            const tipo = TIPO_LABELS[n.tipo] ?? { label: n.tipo, color: 'default' as const };
            return (
              <ListItem key={n.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, width: '100%' }}>
                  <Chip label={tipo.label} color={tipo.color} size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {formatTime(n.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body2">{n.descripcion}</Typography>
              </ListItem>
            );
          })}
        </List>
      )}
      <Divider />
      <Box sx={{ px: 2, py: 1 }}>
        <Button size="small" fullWidth onClick={handleVerTodas}>
          Ver todas
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="notificaciones">
        <Badge badgeContent={totalNoLeidas > 0 ? totalNoLeidas : undefined} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {isMobile ? (
        <Drawer anchor="bottom" open={drawerOpen} onClose={handleClose}
          PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh' } }}>
          {panelContent}
        </Drawer>
      ) : (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { mt: 0.5 } }}
        >
          {panelContent}
        </Popover>
      )}
    </>
  );
}
