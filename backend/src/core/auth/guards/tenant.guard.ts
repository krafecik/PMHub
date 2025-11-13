import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { JwtAccessPayload } from '../jwt-token.service';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantIdHeader = request.headers['x-tenant-id'];
    const tenantId =
      typeof tenantIdHeader === 'string'
        ? tenantIdHeader
        : Array.isArray(tenantIdHeader)
        ? tenantIdHeader[0]
        : undefined;

    if (!tenantId) {
      throw new ForbiddenException('Cabeçalho X-Tenant-Id é obrigatório.');
    }

    const user: JwtAccessPayload | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    const hasAccess = user.tenants.some((tenant) => tenant.tenantId === tenantId.toString());

    if (!hasAccess) {
      throw new ForbiddenException('Usuário não possui acesso ao tenant informado.');
    }

    request.tenantId = tenantId.toString();
    return true;
  }
}

