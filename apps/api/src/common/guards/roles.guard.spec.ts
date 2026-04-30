import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Rol } from '@escolastica/shared';

function makeContext(user: any, requiredRoles: Rol[] | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function withRoles(roles: Rol[] | undefined) {
    reflector.getAllAndOverride = () => roles as any;
  }

  it('permite acceso cuando no hay roles requeridos', () => {
    withRoles(undefined);
    const ctx = makeContext({ roles: [Rol.Miembro] }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acceso cuando la lista de roles requeridos está vacía', () => {
    withRoles([]);
    const ctx = makeContext({ roles: [Rol.Miembro] }, []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('bloquea si no hay usuario en el request', () => {
    withRoles([Rol.Instructor]);
    const ctx = makeContext(null, [Rol.Instructor]);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('Escolastico acumula permisos: pasa verificación de rol Instructor', () => {
    withRoles([Rol.Instructor]);
    const ctx = makeContext({ roles: [Rol.Escolastico] }, [Rol.Instructor]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Escolastico acumula permisos: pasa verificación de rol Miembro', () => {
    withRoles([Rol.Miembro]);
    const ctx = makeContext({ roles: [Rol.Escolastico] }, [Rol.Miembro]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Escolastico acumula permisos: pasa verificación de rol Probacionista', () => {
    withRoles([Rol.Probacionista]);
    const ctx = makeContext({ roles: [Rol.Escolastico] }, [Rol.Probacionista]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Instructor pasa cuando se requiere Instructor', () => {
    withRoles([Rol.Instructor]);
    const ctx = makeContext({ roles: [Rol.Instructor] }, [Rol.Instructor]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Miembro NO pasa cuando se requiere Instructor', () => {
    withRoles([Rol.Instructor]);
    const ctx = makeContext({ roles: [Rol.Miembro] }, [Rol.Instructor]);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('Miembro NO pasa cuando se requiere Escolastico', () => {
    withRoles([Rol.Escolastico]);
    const ctx = makeContext({ roles: [Rol.Miembro] }, [Rol.Escolastico]);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('pasa cuando el rol del usuario coincide con alguno de los roles requeridos (OR)', () => {
    withRoles([Rol.Instructor, Rol.Escolastico]);
    const ctx = makeContext({ roles: [Rol.Instructor] }, [Rol.Instructor, Rol.Escolastico]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('no pierde permisos: Escolastico sigue pasando múltiples checks encadenados', () => {
    const roles: Rol[] = [Rol.Instructor, Rol.Miembro, Rol.Escolastico];
    for (const requiredRole of roles) {
      withRoles([requiredRole]);
      const ctx = makeContext({ roles: [Rol.Escolastico] }, [requiredRole]);
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('usuario con roles múltiples pasa verificación de cualquiera de sus roles', () => {
    withRoles([Rol.Instructor]);
    const ctx = makeContext({ roles: [Rol.Miembro, Rol.Instructor] }, [Rol.Instructor]);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
