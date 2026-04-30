import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { type: 'login', user, pass } });
}

async function sendEmail(opts: { to: string; subject: string; html: string; devLog: string }) {
  const transporter = createTransporter();
  if (!transporter) { console.warn(opts.devLog); return; }
  try {
    await transporter.sendMail({
      from: `"Escolastica" <${process.env.GMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (e: any) {
    console.error(`Email error to ${opts.to}:`, e?.message);
  }
}

export async function sendPasswordReset(email: string, token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const resetUrl = `${base}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Recuperación de contraseña — Escolastica',
    html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    devLog: `[DEV] Reset link for ${email}: ${resetUrl}`,
  });
}

export async function sendWelcomeCredentials(email: string, password: string) {
  await sendEmail({
    to: email,
    subject: 'Bienvenido a Escolastica — Tus credenciales de acceso',
    html: `<p>Tu acceso a <strong>Escolastica</strong> fue habilitado.</p><p><strong>Email:</strong> ${email}</p><p><strong>Contraseña temporal:</strong> <code>${password}</code></p><p>Al ingresar por primera vez se te pedirá que establezcas una nueva contraseña.</p>`,
    devLog: `[DEV] Welcome credentials for ${email}: ${password}`,
  });
}
