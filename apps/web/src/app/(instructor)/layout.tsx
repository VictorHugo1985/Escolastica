import Box from '@mui/material/Box';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2, maxWidth: 600, mx: 'auto' }}>
      {children}
    </Box>
  );
}
