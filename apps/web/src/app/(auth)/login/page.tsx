'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthStore } from '@/store/auth.store';

const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginForm) {
    setError('');
    try {
      await login(data.email, data.password, data.rememberMe);
      if (useAuthStore.getState().mustChangePassword) {
        router.push('/admin/change-password');
        return;
      }
      const next = params.get('next') ?? '/admin/calendario';
      router.push(next);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al iniciar sesión';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" color="primary.main" fontWeight={700}>
            Escolastica
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sistema de gestión académica
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            margin="normal"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message as string}
            {...register('email')}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message as string}
            {...register('password')}
          />
          <FormControlLabel
            control={<Checkbox {...register('rememberMe')} />}
            label="Recordarme"
            sx={{ mt: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Button variant="text" size="small" href="/forgot-password">
              Olvidé mi contraseña
            </Button>
            <Button variant="text" size="small" href="/request-access" color="inherit">
              ¿Primera vez? Solicitar acceso
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
