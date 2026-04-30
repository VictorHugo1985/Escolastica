import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EmailService } from './email.service';
import type { LoginDto, ForgotPasswordDto, ResetPasswordDto } from '@escolastica/shared';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_REMEMBER_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditoria: AuditoriaService,
    private readonly email: EmailService,
  ) {}

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.usuarios.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { rol: true } } },
    });

    const isValid = user?.password_hash
      ? await bcrypt.compare(dto.password, user.password_hash)
      : false;

    if (!user || !isValid) {
      await this.auditoria.log({
        usuario_id: null,
        accion: 'INSERT',
        tabla_afectada: 'auth_intentos',
        valor_nuevo: { email: dto.email, ip, resultado: 'FALLIDO' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado === 'Inactivo') {
      throw new ForbiddenException('Usuario inactivo');
    }

    const roles = user.roles.map((r) => r.rol.nombre);

    // MVP: solo Instructor y Escolastico tienen acceso a la app web (spec 023)
    const hasWebAccess = roles.some((r) => r === 'Instructor' || r === 'Escolastico');
    if (!hasWebAccess) {
      throw new ForbiddenException('Tu cuenta no tiene acceso a la aplicación en esta versión');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles },
      { expiresIn: process.env.JWT_EXPIRATION ?? '3600s' },
    );

    const refreshTtlDays = dto.rememberMe ? REFRESH_TOKEN_REMEMBER_DAYS : REFRESH_TOKEN_TTL_DAYS;
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.refresh_tokens.create({
      data: {
        usuario_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 3600,
      mustChangePassword: user.must_change_password,
      user: { id: user.id, email: user.email, roles },
    };
  }

  async refresh(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await this.prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: { usuario: { include: { roles: { include: { rol: true } } } } },
    });

    if (!record || record.revoked || record.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    await this.prisma.refresh_tokens.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const user = record.usuario;
    const roles = user.roles.map((r) => r.rol.nombre);
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roles },
      { expiresIn: process.env.JWT_EXPIRATION ?? '3600s' },
    );

    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRawToken).digest('hex');

    await this.prisma.refresh_tokens.create({
      data: {
        usuario_id: user.id,
        token_hash: newHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRawToken, expiresIn: 3600 };
  }

  async logout(userId: string) {
    await this.prisma.refresh_tokens.updateMany({
      where: { usuario_id: userId, revoked: false },
      data: { revoked: true },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ enviado: boolean }> {
    const user = await this.prisma.usuarios.findUnique({ where: { email: dto.email } });

    if (!user || user.estado === 'Inactivo') return { enviado: false };

    await this.prisma.tokens_recuperacion.updateMany({
      where: { usuario_id: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.tokens_recuperacion.create({
      data: {
        usuario_id: user.id,
        token,
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    await this.email.sendPasswordReset(user.email, token);
    return { enviado: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.tokens_recuperacion.findUnique({
      where: { token: dto.token },
    });

    if (!record || record.used || record.expires_at < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: record.usuario_id },
        data: { password_hash: passwordHash, must_change_password: false },
      }),
      this.prisma.tokens_recuperacion.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);
  }

  async hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  }

  async requestCredentials(email: string): Promise<{ tipo: 'nueva_activacion' | 'recuperacion' } | null> {
    const ROLES_CON_ACCESO = ['Instructor', 'Escolastico'];

    const user = await this.prisma.usuarios.findUnique({
      where: { email },
      include: { roles: { include: { rol: true } } },
    });

    if (!user || user.estado === 'Inactivo') return null;

    const tieneAcceso = user.roles.some((r) => ROLES_CON_ACCESO.includes(r.rol.nombre));
    if (!tieneAcceso) return null;

    if (user.password_hash) {
      // Cuenta ya activada → enviar reset en vez de credenciales nuevas
      await this.forgotPassword({ email });
      return { tipo: 'recuperacion' };
    }

    // Primera activación → generar contraseña temporal y enviar bienvenida
    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await this.prisma.usuarios.update({
      where: { id: user.id },
      data: { password_hash: passwordHash, must_change_password: true },
    });

    await this.email.sendWelcomeCredentials(email, tempPassword);
    return { tipo: 'nueva_activacion' };
  }
}
