import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { Public } from '../common/decorators/public.decorator';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso — retorna accessToken' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Usuario inactivo o Probacionista' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos — bloqueado 15 minutos' })
  async login(@Body() body: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body, req.ip);
    RateLimitGuard.resetFor(req.ip ?? '');
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: (body.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token con refresh token (cookie HttpOnly)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    const result = await this.authService.refresh(rawToken);
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const { refreshToken: _, ...response } = result;
    return response;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión — revoca todos los refresh tokens' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  async forgotPassword(@Body() body: any) {
    const { enviado } = await this.authService.forgotPassword(body);
    return { enviado, message: enviado
      ? 'Se enviaron las instrucciones de recuperación a tu email.'
      : 'No encontramos una cuenta activa con ese email.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token de recuperación' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() body: any) {
    await this.authService.resetPassword(body);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  @Public()
  @Post('request-credentials')
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar credenciales de acceso (primera activación o recuperación)' })
  async requestCredentials(@Body() body: { email: string }) {
    const result = await this.authService.requestCredentials(body.email ?? '');
    if (!result) {
      return { tipo: null, message: 'No encontramos una cuenta activa con ese email.' };
    }
    if (result.tipo === 'nueva_activacion') {
      return { tipo: 'nueva_activacion', message: 'Se enviaron tus credenciales de acceso a tu correo.' };
    }
    return { tipo: 'recuperacion', message: 'Tu cuenta ya tiene una contraseña. Se enviaron instrucciones de recuperación a tu email.' };
  }
}
