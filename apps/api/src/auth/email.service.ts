import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private createTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (!user || !pass) return null;

    return nodemailer.createTransport({
      service: 'gmail',
      auth: { type: 'login', user, pass },
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña — Escolastica',
      html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      devLog: `[DEV] Reset password link for ${email}: ${resetUrl}`,
    });
  }

  async sendTokenCode(email: string, code: string): Promise<void> {
    await this.sendEmail({
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

  async sendWelcomeCredentials(email: string, password: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Bienvenido a Escolastica — Tus credenciales de acceso',
      html: `
        <p>Tu acceso a <strong>Escolastica</strong> fue habilitado.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contraseña temporal:</strong> <code>${password}</code></p>
        <p>Al ingresar por primera vez se te pedirá que establezcas una nueva contraseña.</p>
      `,
      devLog: `[DEV] Welcome credentials for ${email}: ${password}`,
    });
  }

  private async sendEmail(opts: { to: string; subject: string; html: string; devLog: string }) {
    const transporter = this.createTransporter();

    if (!transporter) {
      this.logger.warn(opts.devLog);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Escolastica" <${process.env.GMAIL_USER}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Email enviado a ${opts.to}`);
    } catch (error: any) {
      this.logger.error(`Error al enviar email a ${opts.to}: ${error?.message}`);
    }
  }
}
