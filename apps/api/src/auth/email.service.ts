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
