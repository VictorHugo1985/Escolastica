'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '@/lib/api';

const EmailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const ResetSchema = z.object({
  token: z.string().min(1, 'Ingresá el código recibido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});

type EmailForm = z.infer<typeof EmailSchema>;
type ResetForm = z.infer<typeof ResetSchema>;

export default function RequestAccessPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(EmailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(ResetSchema) });

  async function onEmailSubmit(data: EmailForm) {
    setError('');
    try {
      const { data: res } = await api.post('/auth/request-credentials', { email: data.email });
      if (res.tipo === null) {
        setError('No encontramos una cuenta activa con ese email.');
        return;
      }
      setSentTo(data.email);
      setStep('reset');
    } catch {
      setError('No se pudo procesar la solicitud. Intentá nuevamente.');
    }
  }

  async function onResetSubmit(data: ResetForm) {
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token: data.token.trim().toUpperCase().replace(/\s/g, ''),
        newPassword: data.password,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Código inválido o expirado');
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setError('');
    setResent(false);
    try {
      await api.post('/auth/request-credentials', { email: sentTo });
      setResent(true);
    } catch {
      setError('No se pudo reenviar el código. Intentá nuevamente.');
    }
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {step === 'email' ? 'Acceder a tu cuenta' : 'Ingresá tu código'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {step === 'email'
              ? 'Te enviaremos un código de seguridad a tu email'
              : `Revisá tu correo: ${sentTo}`}
          </Typography>
        </Box>

        {/* Paso 1 — Email */}
        {step === 'email' && (
          <Box component="form" onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              margin="normal"
              autoComplete="email"
              autoFocus
              error={!!emailForm.formState.errors.email}
              helperText={emailForm.formState.errors.email?.message as string}
              {...emailForm.register('email')}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={emailForm.formState.isSubmitting}
              sx={{ mt: 2 }}
            >
              {emailForm.formState.isSubmitting
                ? <CircularProgress size={22} color="inherit" />
                : 'Enviar código'}
            </Button>
          </Box>
        )}

        {/* Paso 2 — Código + nueva contraseña */}
        {step === 'reset' && (
          success ? (
            <Alert severity="success">
              ¡Contraseña establecida! Redirigiendo al inicio de sesión...
            </Alert>
          ) : (
            <Box component="form" onSubmit={resetForm.handleSubmit(onResetSubmit)} noValidate>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {resent && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResent(false)}>
                  Código reenviado correctamente.
                </Alert>
              )}

              <TextField
                label="Código de seguridad"
                fullWidth
                margin="normal"
                autoFocus
                autoComplete="off"
                placeholder="Ej: A3F8B2"
                inputProps={{
                  style: { textTransform: 'uppercase', letterSpacing: '6px', fontWeight: 'bold', fontSize: '20px' },
                  autoCapitalize: 'characters',
                }}
                error={!!resetForm.formState.errors.token}
                helperText={resetForm.formState.errors.token?.message as string || 'Ingresá el código de 6 caracteres recibido'}
                {...resetForm.register('token')}
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                fullWidth
                margin="normal"
                autoComplete="new-password"
                error={!!resetForm.formState.errors.password}
                helperText={resetForm.formState.errors.password?.message as string}
                {...resetForm.register('password')}
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                fullWidth
                margin="normal"
                autoComplete="new-password"
                error={!!resetForm.formState.errors.confirm}
                helperText={resetForm.formState.errors.confirm?.message as string}
                {...resetForm.register('confirm')}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={resetForm.formState.isSubmitting}
                sx={{ mt: 2 }}
              >
                {resetForm.formState.isSubmitting
                  ? <CircularProgress size={22} color="inherit" />
                  : 'Establecer contraseña'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => { setStep('email'); setError(''); setResent(false); }}
                >
                  Cambiar email
                </Button>
                <Button variant="text" size="small" onClick={handleResend}>
                  Reenviar código
                </Button>
              </Box>
            </Box>
          )
        )}

        {!success && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button component={Link} href="/login" variant="text" size="small" color="inherit">
              Volver al inicio de sesión
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
