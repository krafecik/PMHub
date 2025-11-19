import { JwtAccessPayload, JwtRefreshPayload, TenantAccess } from '@core/auth/jwt-token.service';
import { TokensBundle } from '@core/auth/jwt-token.service';

type AuthUserOptions = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string | null;
  tenants?: TenantAccess[];
  defaultTenantId?: string;
};

export const buildTenantAccess = (overrides: Partial<TenantAccess> = {}): TenantAccess => ({
  tenantId: overrides.tenantId ?? 'tenant-01',
  role: overrides.role ?? 'CPO',
  nome: overrides.nome ?? 'Tenant Teste',
});

export const buildJwtAccessPayload = (overrides: AuthUserOptions = {}): JwtAccessPayload => {
  const tenants = overrides.tenants ?? [buildTenantAccess()];
  return {
    sub: overrides.sub ?? 'user-01',
    email: overrides.email ?? 'user@example.com',
    name: overrides.name ?? 'Usuário Teste',
    picture: overrides.picture ?? null,
    tenants,
    defaultTenantId: overrides.defaultTenantId ?? tenants[0]?.tenantId ?? 'tenant-01',
  };
};

export const buildJwtRefreshPayload = (
  overrides: Partial<JwtRefreshPayload> = {},
): JwtRefreshPayload => ({
  sub: overrides.sub ?? 'user-01',
  tokenVersion: overrides.tokenVersion ?? 1,
});

export const buildTokensBundle = (overrides: Partial<TokensBundle> = {}): TokensBundle => ({
  accessToken: overrides.accessToken ?? 'access-token',
  refreshToken: overrides.refreshToken ?? 'refresh-token',
  expiresIn: overrides.expiresIn ?? 900,
});
