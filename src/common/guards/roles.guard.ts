import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleOptions, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const roleOptions = this.reflector.getAllAndOverride<RoleOptions>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roleOptions || !roleOptions.roles || roleOptions.roles.length === 0) {
      return true; // no roles required
    }

    const { roles } = roleOptions;

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User role not found');
    }

    const hasRole = roles.includes(user?.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Requires one of the following roles: ${roles.join(', ')}`,
      );
    }

    return true;
  }
}
