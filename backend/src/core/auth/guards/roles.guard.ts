import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRole } from '@prisma/client';
import { JwtAccessPayload } from '../jwt-token.service';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtAccessPayload | undefined = request.user;
    const tenantId: string | undefined = request.tenantId ?? request.headers['x-tenant-id'];

    if (!user || !tenantId) {
      throw new ForbiddenException('Contexto de tenant não encontrado.');
    }

    const tenantAccess = user.tenants.find((tenant) => tenant.tenantId === tenantId.toString());

    if (!tenantAccess || !requiredRoles.includes(tenantAccess.role as TenantRole)) {
      throw new ForbiddenException('Permissão insuficiente para o tenant atual.');
    }

    return true;
  }
}

