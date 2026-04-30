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
import Link from 'next/link';
import { api } from '@/lib/api';

const Schema = z.object({
  email: z.string().email('Email inválido'),
});
type Form = z.infer<typeof Schema>;

type Resultado = { tipo: 'nueva_activacion' | 'recuperacion' | null; message: string };

export default function RequestAccessPage() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(data: Form) {
    setError('');
    try {
      const { data: res } = await api.post<Resultado>('/auth/request-credentials', { email: data.email });
      setResultado(res);
    } catch {
      setError('No se pudo procesar la solicitud. Intentá nuevamente.');
    }
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            Solicitar acceso
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Ingresá tu correo registrado para recibir tu contraseña
          </Typography>
        </Box>

        {resultado ? (
          <Box>
            {resultado.tipo === 'nueva_activacion' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {resultado.message}
              </Alert>
            )}
            {resultado.tipo === 'recuperacion' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {resultado.message}
              </Alert>
            )}
            {resultado.tipo === null && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {resultado.message}
              </Alert>
            )}
            <Button component={Link} href="/login" variant="outlined" fullWidth>
              Ir al inicio de sesión
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message as string}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Enviar'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button component={Link} href="/login" variant="text" size="small" color="inherit">
                Volver al inicio de sesión
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
