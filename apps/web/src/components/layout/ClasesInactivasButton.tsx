'use client';

import { useState, useEffect } from 'react';
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
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useMediaQuery, useTheme } from '@mui/material';
import { api } from '@/lib/api';

interface ClaseInactiva {
  nombre_clase: string;
  semanas_inactiva: number;
}

export default function ClasesInactivasButton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clases, setClases] = useState<ClaseInactiva[]>([]);

  useEffect(() => {
    api.get<{ clases: ClaseInactiva[] }>('/notificaciones/clases-inactivas')
      .then(({ data }) => setClases(data.clases))
      .catch(() => {
        // Silently fail — el indicador simplemente no se muestra
      });
  }, []);

  if (clases.length === 0) return null;

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
  };

  const panelContent = (
    <Box sx={{ width: isMobile ? '100vw' : 340, maxWidth: '100vw' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EventBusyIcon color="warning" sx={{ fontSize: 18 }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Clases sin sesiones recientes
        </Typography>
      </Box>
      <Divider />
      <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
        {clases.map((c, i) => (
          <ListItem key={i} divider sx={{ py: 1.25, gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
              {c.nombre_clase}
            </Typography>
            <Chip label={`${c.semanas_inactiva} SEM`} color="warning" size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="clases sin sesiones recientes">
        <Badge badgeContent={clases.length} color="warning" max={99}>
          <EventBusyIcon />
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
