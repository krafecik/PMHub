import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const headerTenant = req.headers['x-tenant-id'];
    const tenantId =
      typeof headerTenant === 'string'
        ? headerTenant
        : Array.isArray(headerTenant)
        ? headerTenant[0]
        : undefined;

    const currentUser = req.user as JwtAccessPayload | undefined;

    if (!tenantId && currentUser?.defaultTenantId) {
      req.tenantId = currentUser.defaultTenantId;
    } else if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  }
}

