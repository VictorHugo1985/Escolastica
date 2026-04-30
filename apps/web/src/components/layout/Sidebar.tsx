'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuthStore } from '@/store/auth.store';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  esInstructor: boolean;
}

const navItems: NavItem[] = [
  // Administración — Escolástico
  { label: 'Usuarios',   href: '/admin/users',         icon: <PeopleIcon />,         roles: ['Escolastico'] },
  { label: 'Pendientes', href: '/admin/users/pending', icon: <HourglassEmptyIcon />, roles: ['Escolastico'] },
  { label: 'Materias',   href: '/admin/materias',       icon: <SchoolIcon />,         roles: ['Escolastico'] },
  { label: 'Clases',     href: '/admin/clases',         icon: <ClassIcon />,          roles: ['Escolastico'] },
  { label: 'Aulas',      href: '/admin/aulas',          icon: <MeetingRoomIcon />,    roles: ['Escolastico'] },
  // Asistencia — Instructor + Escolástico
  { label: 'Listas',     href: '/admin/asistencia',     icon: <FactCheckIcon />,      roles: ['Instructor', 'Escolastico'] },
  { label: 'Calendario', href: '/admin/calendario',     icon: <CalendarMonthIcon />,  roles: ['Instructor', 'Escolastico'] },
  { label: 'Kardex',     href: '/admin/kardex',         icon: <MenuBookIcon />,       roles: ['Escolastico'] },
];

export default function Sidebar({ open, onClose, esInstructor }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const userRoles: string[] = user?.roles ?? [];

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => userRoles.includes(r)),
  );

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const drawerContent = (
    <>
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="h6" fontWeight={700} color="white">
          Escolastica
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {user?.email}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 1 }} />

      <List sx={{ flex: 1 }}>
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={active}
                onClick={onClose}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  color: 'white',
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      <Box sx={{ p: 1 }}>
        <ListItemButton
          component={Link}
          href="/admin/profile"
          onClick={onClose}
          sx={{ borderRadius: 1, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Mi perfil" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
        <ListItemButton
          onClick={async () => { onClose(); await handleLogout(); }}
          sx={{ borderRadius: 1, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
