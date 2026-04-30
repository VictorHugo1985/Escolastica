import { SetMetadata } from '@nestjs/common';
import { Rol } from '@escolastica/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
