'use client';

import Box from '@mui/material/Box';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open onClose={() => {}} esInstructor={false} />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
