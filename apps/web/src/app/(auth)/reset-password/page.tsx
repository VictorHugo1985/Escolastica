'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { api } from '@/lib/api';

const Schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});
type Form = z.infer<typeof Schema>;

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(data: Form) {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Token inválido o expirado');
    }
  }

  if (!token) {
    return (
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Alert severity="error">Token inválido. Solicitá un nuevo enlace de recuperación.</Alert>
          <Button href="/forgot-password" variant="text" sx={{ mt: 2 }}>Volver</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} color="primary.main" mb={0.5}>
          Nueva contraseña
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Ingresá tu nueva contraseña.
        </Typography>

        {success ? (
          <Alert severity="success">
            Contraseña actualizada. Redirigiendo al login...
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.confirm}
              helperText={errors.confirm?.message}
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
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Guardar contraseña'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
