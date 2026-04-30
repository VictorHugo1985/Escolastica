'use client';

import { useState } from 'react';
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
import Divider from '@mui/material/Divider';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

const Schema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});
type Form = z.infer<typeof Schema>;

export default function ProfilePage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(data: Form) {
    setError('');
    setSuccess('');
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Contraseña actualizada correctamente');
      reset();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cambiar contraseña');
    }
  }

  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Configuración de cuenta" />

      <Card sx={{ maxWidth: 500 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Cambiar contraseña
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Contraseña actual"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.confirm}
              helperText={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 2 }}>
              {isSubmitting ? <CircularProgress size={18} /> : 'Actualizar contraseña'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
