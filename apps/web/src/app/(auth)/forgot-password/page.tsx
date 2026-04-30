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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '@/lib/api';

const Schema = z.object({ email: z.string().email('Email inválido') });
type Form = z.infer<typeof Schema>;

type Respuesta = { enviado: boolean; message: string };

export default function ForgotPasswordPage() {
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(Schema),
  });

  async function onSubmit(data: Form) {
    setError('');
    try {
      const { data: res } = await api.post<Respuesta>('/auth/forgot-password', data);
      setRespuesta(res);
    } catch {
      setError('No se pudo procesar la solicitud. Intentá nuevamente.');
    }
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} color="primary.main" mb={0.5}>
          Recuperar contraseña
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Ingresá tu email y te enviaremos instrucciones.
        </Typography>

        {respuesta ? (
          <Alert severity={respuesta.enviado ? 'success' : 'warning'}>
            {respuesta.message}
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              margin="normal"
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
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Enviar instrucciones'}
            </Button>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="text" size="small" startIcon={<ArrowBackIcon />} href="/login">
            Volver al login
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
