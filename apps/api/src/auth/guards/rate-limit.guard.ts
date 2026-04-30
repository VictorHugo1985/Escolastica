import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip ?? request.connection?.remoteAddress ?? 'unknown';
    const now = Date.now();

    const record = attempts.get(ip);

    if (record && now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        throw new HttpException(
          `Demasiados intentos. Intente nuevamente en ${retryAfter} segundos.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      record.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    return true;
  }

  static resetFor(ip: string): void {
    attempts.delete(ip);
  }
}
