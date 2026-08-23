import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/entities/user.entity';

export const ROLES_KEY = 'roles';

export interface RoleOptions {
  roles: UserRole[];
}

export const Roles = (roles: UserRole[]) => SetMetadata(ROLES_KEY, { roles });
