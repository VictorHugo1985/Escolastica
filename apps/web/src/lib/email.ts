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

export async function sendTokenCode(email: string, code: string) {
  await sendEmail({
    to: email,
    subject: 'Tu código de acceso — Escolastica',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1976d2;">Escolastica</h2>
        <p>Tu código de acceso es:</p>
        <p style="font-size:42px;font-weight:bold;letter-spacing:10px;color:#1976d2;text-align:center;padding:24px;background:#f5f5f5;border-radius:8px;">${code}</p>
        <p>Ingresá este código en la pantalla de acceso para establecer tu contraseña.<br><strong>Válido por 1 hora.</strong></p>
        <p style="color:#999;font-size:12px;">Si no solicitaste este código, ignorá este mensaje.</p>
      </div>
    `,
    devLog: `[DEV] Access code for ${email}: ${code}`,
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
