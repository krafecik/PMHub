import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';
  import { AuthStateStore } from '@core/auth/auth-state.store';
import { JwtTokenService, JwtAccessPayload } from '@core/auth/jwt-token.service';
import { AuthProvider, TenantRole } from '@prisma/client';
import { compare } from 'bcryptjs';
import { AzureAdProvider } from '@infra/auth/azure-ad.provider';
import { UserRepository, UserWithTenants } from '@infra/repositories';

type AzureClaims = {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
};

export type AuthenticatedTenant = {
  id: string;
  nome: string;
  role: TenantRole;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  nome: string;
  foto_url?: string | null;
  tenants: AuthenticatedTenant[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthSession = {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  defaultTenantId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly azureProvider: AzureAdProvider,
    private readonly authStateStore: AuthStateStore,
    private readonly userRepository: UserRepository,
    private readonly jwtTokenService: JwtTokenService
  ) {}

  get isAzureEnabled(): boolean {
    return this.configService.get('AUTH_AZURE_AD_ENABLED', { infer: true });
  }

  async initiateAzureLogin(): Promise<{ authorizationUrl: string; state: string; expiresIn: number }> {
    if (!this.isAzureEnabled) {
      throw new BadRequestException('Azure AD está desabilitado.');
    }

    const { state, pkce } = this.authStateStore.createState();
    const authorizationUrl = await this.azureProvider.generateAuthorizationUrl({
      state,
      codeChallenge: pkce.codeChallenge
    });

    return {
      authorizationUrl,
      state,
      expiresIn: 300
    };
  }

  async handleAzureCallback(code: string, state: string): Promise<AuthSession> {
    if (!this.isAzureEnabled) {
      throw new BadRequestException('Azure AD está desabilitado.');
    }

    const storedState = this.authStateStore.consumeState(state);
    const tokenSet = await this.azureProvider.exchangeCodeForTokens({
      code,
      codeVerifier: storedState.codeVerifier
    });

    const claims = tokenSet.claims() as AzureClaims;
    const email = claims.email ?? claims.preferred_username;

    if (!email) {
      throw new UnauthorizedException('O provedor não retornou um e-mail válido.');
    }

    const user = await this.userRepository.upsertAzureUser({
      email,
      name: claims.name ?? email,
      subjectId: claims.sub,
      picture: claims.picture
    });

    if (!user || user.tenants.length === 0) {
      throw new ForbiddenException('Usuário não possui tenants atribuídos. Contate o administrador.');
    }

    return this.buildAuthSession(user);
  }

  async loginLocal(email: string, password: string): Promise<AuthSession> {
    const user = await this.userRepository.findByEmailWithTenants(email);

    if (!user || user.provider !== AuthProvider.LOCAL) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Usuário sem credenciais locais configuradas.');
    }

    const passwordsMatch = await compare(password, user.password_hash);

    if (!passwordsMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Usuário inativo.');
    }

    if (user.tenants.length === 0) {
      throw new ForbiddenException('Usuário não possui tenants atribuídos.');
    }

    return this.buildAuthSession(user);
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);
    const userId = BigInt(payload.sub);

    const user = await this.userRepository.findByIdWithTenants(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (user.token_version !== payload.tokenVersion) {
      throw new UnauthorizedException('Token de refresh inválido.');
    }

    const updatedUser = await this.userRepository.incrementTokenVersion(user.id);

    if (!updatedUser || updatedUser.tenants.length === 0) {
      throw new ForbiddenException('Usuário não possui tenants atribuídos.');
    }

    return this.buildAuthSession(updatedUser);
  }

  async revokeSession(userId: string): Promise<void> {
    const id = BigInt(userId);
    await this.userRepository.incrementTokenVersion(id);
  }

  async switchTenant(user: JwtAccessPayload, tenantId: string): Promise<AuthSession> {
    const userId = BigInt(user.sub);
    const userWithTenants = await this.userRepository.findByIdWithTenants(userId);

    if (!userWithTenants) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const hasAccess = userWithTenants.tenants.some(
      (tenant) => tenant.tenant_id.toString() === tenantId
    );

    if (!hasAccess) {
      throw new ForbiddenException('Usuário não possui acesso ao tenant selecionado.');
    }

    return this.buildAuthSession(userWithTenants, {
      defaultTenantId: tenantId,
      tokenVersion: userWithTenants.token_version
    });
  }

  private async buildAuthSession(
    user: UserWithTenants,
    options?: { defaultTenantId?: string; tokenVersion?: number }
  ): Promise<AuthSession> {
    if (!user) {
      throw new UnauthorizedException('Usuário inválido.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Usuário inativo.');
    }

    const tenantsForToken = user.tenants.map((tenant) => ({
      tenantId: tenant.tenant_id.toString(),
      nome: tenant.tenant.nome,
      role: tenant.role
    }));

    const tenantsForUser = tenantsForToken.map((tenant) => ({
      id: tenant.tenantId,
      nome: tenant.nome,
      role: tenant.role
    }));

    let defaultTenantId = tenantsForToken[0]?.tenantId;
    if (options?.defaultTenantId) {
      const exists = tenantsForToken.some((tenant) => tenant.tenantId === options.defaultTenantId);
      if (exists) {
        defaultTenantId = options.defaultTenantId;
      }
    }

    const tokenVersion = options?.tokenVersion ?? user.token_version;

    const tokens = await this.jwtTokenService.generateTokens(
      {
        sub: user.id.toString(),
        email: user.email,
        name: user.nome,
        tenants: tenantsForToken,
        defaultTenantId,
        picture: user.foto_url
      },
      {
        sub: user.id.toString(),
        tokenVersion
      }
    );

    const authUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email,
      nome: user.nome,
      foto_url: user.foto_url,
      tenants: tenantsForUser
    };

    return { user: authUser, tokens, defaultTenantId: defaultTenantId ?? null };
  }
}

