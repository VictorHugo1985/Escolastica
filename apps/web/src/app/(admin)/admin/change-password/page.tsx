'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockResetIcon from '@mui/icons-material/LockReset';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const Schema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña temporal'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});
type Form = z.infer<typeof Schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const clearMustChangePassword = useAuthStore((s) => s.clearMustChangePassword);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(data: Form) {
    setError('');
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      clearMustChangePassword();
      router.replace('/admin/asistencia');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cambiar la contraseña');
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>
              Cambio de contraseña requerido
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Tu cuenta usa una contraseña temporal. Definí una nueva contraseña para continuar.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Contraseña temporal"
              type="password"
              fullWidth
              margin="normal"
              autoComplete="current-password"
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message as string}
              {...register('currentPassword')}
            />
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              margin="normal"
              autoComplete="new-password"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message as string}
              {...register('newPassword')}
            />
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              fullWidth
              margin="normal"
              autoComplete="new-password"
              error={!!errors.confirm}
              helperText={errors.confirm?.message as string}
              {...register('confirm')}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Establecer nueva contraseña'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
