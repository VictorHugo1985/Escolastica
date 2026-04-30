'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const esEscol = user?.roles.includes('Escolastico') ?? false;
  const esInstructor = !esEscol && (user?.roles ?? []).includes('Instructor');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (mustChangePassword && pathname !== '/admin/change-password') {
      router.replace('/admin/change-password');
    }
  }, [mustChangePassword, pathname, router]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top bar — all roles: hamburger to toggle sidebar */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'primary.main', zIndex: 1201 }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen((o) => !o)}
            edge="start"
            sx={{ mr: 1.5 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>
            Escolastica
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          esInstructor={esInstructor}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            bgcolor: 'background.default',
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
