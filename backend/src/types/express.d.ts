import { JwtAccessPayload } from '@core/auth/jwt-token.service';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
      tenantId?: string;
    }
  }
}

export {};
