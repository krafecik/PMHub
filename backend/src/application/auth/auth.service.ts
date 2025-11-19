import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';
import { AuthStateStore } from '@core/auth/auth-state.store';
import { JwtTokenService, JwtAccessPayload } from '@core/auth/jwt-token.service';
import { AuthProvider, TenantRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { AzureAdProvider } from '@infra/auth/azure-ad.provider';
import { MailService } from '@infra/email/mail.service';
import { MetricsService } from '@core/metrics/metrics.service';
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

export type UserSummary = {
  id: string;
  email: string;
  nome: string;
  status: UserStatus;
  provider: AuthProvider;
  lastLoginAt?: Date | null;
  lockedUntil?: Date | null;
  tenants: Array<{
    tenantId: string;
    nome: string;
    role: TenantRole;
  }>;
};

export type InviteSummary = {
  id: string;
  email: string;
  nome?: string | null;
  tenantId: string;
  tenantNome?: string | null;
  role: TenantRole;
  invitedBy: string;
  invitedByNome?: string | null;
  invitedAt: Date;
  expiresAt: Date;
};

export type InviteValidation = {
  email: string;
  nome?: string | null;
  tenantId: string;
  tenantNome?: string | null;
  role: TenantRole;
  expiresAt: Date;
};

type ListedUser = Awaited<ReturnType<UserRepository['listUsersByTenant']>>[number]['user'];
type LoadedUser = NonNullable<UserWithTenants>;

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly inviteTtlHours: number;
  private readonly resetTtlMinutes: number;

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly azureProvider: AzureAdProvider,
    private readonly authStateStore: AuthStateStore,
    private readonly userRepository: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly mailService: MailService,
    private readonly metricsService: MetricsService,
  ) {
    this.inviteTtlHours = this.configService.get('AUTH_INVITE_TTL_HOURS', { infer: true });
    this.resetTtlMinutes = this.configService.get('AUTH_RESET_TTL_MINUTES', { infer: true });
  }

  get isAzureEnabled(): boolean {
    return this.configService.get('AUTH_AZURE_AD_ENABLED', { infer: true });
  }

  async initiateAzureLogin(): Promise<{
    authorizationUrl: string;
    state: string;
    expiresIn: number;
  }> {
    if (!this.isAzureEnabled) {
      throw new BadRequestException('Azure AD está desabilitado.');
    }

    const { state, pkce } = this.authStateStore.createState();
    const authorizationUrl = await this.azureProvider.generateAuthorizationUrl({
      state,
      codeChallenge: pkce.codeChallenge,
    });

    return {
      authorizationUrl,
      state,
      expiresIn: 300,
    };
  }

  async handleAzureCallback(code: string, state: string): Promise<AuthSession> {
    if (!this.isAzureEnabled) {
      throw new BadRequestException('Azure AD está desabilitado.');
    }

    const storedState = this.authStateStore.consumeState(state);
    const tokenSet = await this.azureProvider.exchangeCodeForTokens({
      code,
      codeVerifier: storedState.codeVerifier,
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
      picture: claims.picture,
    });

    if (!user || user.tenants.length === 0) {
      throw new ForbiddenException(
        'Usuário não possui tenants atribuídos. Contate o administrador.',
      );
    }

    return this.buildAuthSession(user);
  }

  async loginLocal(email: string, password: string): Promise<AuthSession> {
    const timer = this.metricsService.startTimer({ operation: 'login_local' });
    const normalizedEmail = email.toLowerCase();
    const user = await this.userRepository.findByEmailWithTenants(normalizedEmail);

    this.metricsService.recordLoginAttempt({
      provider: 'local',
      tenantId: this.resolveTenantId(user?.tenants),
    });

    if (!user || user.provider !== AuthProvider.LOCAL) {
      this.metricsService.recordLoginFailure({
        reason: 'not_found',
        tenantId: this.resolveTenantId(user?.tenants),
      });
      timer();
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.password_hash) {
      this.metricsService.recordLoginFailure({
        reason: 'no_password',
        tenantId: this.resolveTenantId(user.tenants),
      });
      timer();
      throw new UnauthorizedException('Usuário sem credenciais locais configuradas.');
    }

    if (user.status === UserStatus.LOCKED && user.locked_until) {
      if (new Date(user.locked_until) > new Date()) {
        this.metricsService.recordLoginFailure({
          reason: 'locked',
          tenantId: this.resolveTenantId(user.tenants),
        });
        timer();
        throw new ForbiddenException('Usuário bloqueado temporariamente. Aguarde alguns minutos.');
      }

      await this.userRepository.resetFailedAttempts(user.id);
      user.failed_attempts = 0;
      user.locked_until = null;
      user.status = UserStatus.ACTIVE;
    }

    const passwordsMatch = await compare(password, user.password_hash);

    if (!passwordsMatch) {
      const attempts = (user.failed_attempts ?? 0) + 1;
      const shouldLock = attempts >= LOGIN_MAX_ATTEMPTS;
      const lockedUntil = shouldLock ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000) : null;
      await this.userRepository.updateFailedAttempts(user.id, attempts, lockedUntil);

      if (shouldLock) {
        this.metricsService.recordAccountLocked({
          tenantId: this.resolveTenantId(user.tenants),
        });
        this.metricsService.recordLoginFailure({
          reason: 'locked',
          tenantId: this.resolveTenantId(user.tenants),
        });
        timer();
        throw new ForbiddenException(
          'Usuário bloqueado temporariamente após múltiplas tentativas.',
        );
      }

      this.metricsService.recordLoginFailure({
        reason: 'invalid_credentials',
        tenantId: this.resolveTenantId(user.tenants),
      });
      timer();
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.metricsService.recordLoginFailure({
        reason: 'inactive',
        tenantId: this.resolveTenantId(user.tenants),
      });
      timer();
      throw new ForbiddenException('Usuário não está ativo. Contate o administrador.');
    }

    if (user.tenants.length === 0) {
      this.metricsService.recordLoginFailure({
        reason: 'no_tenant',
        tenantId: 'unknown',
      });
      timer();
      throw new ForbiddenException('Usuário não possui tenants atribuídos.');
    }

    await this.userRepository.updateLastLogin(user.id);
    const freshUser = await this.userRepository.findByIdWithTenants(user.id);
    if (!freshUser) {
      timer();
      throw new UnauthorizedException('Falha ao carregar dados do usuário.');
    }
    this.metricsService.recordLoginSuccess({
      provider: 'local',
      tenantId: this.resolveTenantId(freshUser.tenants),
    });
    timer();
    return this.buildAuthSession(freshUser);
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const timer = this.metricsService.startTimer({ operation: 'refresh_session' });
    const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);
    const userId = BigInt(payload.sub);

    const user = await this.userRepository.findByIdWithTenants(userId);

    if (!user) {
      timer();
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    this.ensureUserIsActive(user);

    if (user.token_version !== payload.tokenVersion) {
      timer();
      throw new UnauthorizedException('Token de refresh inválido.');
    }

    const updatedUser = await this.userRepository.incrementTokenVersion(user.id);

    if (!updatedUser || updatedUser.tenants.length === 0) {
      timer();
      throw new ForbiddenException('Usuário não possui tenants atribuídos.');
    }

    this.ensureUserIsActive(updatedUser);

    const session = await this.buildAuthSession(updatedUser);
    this.metricsService.recordLoginSuccess({
      provider: 'refresh',
      tenantId: this.resolveTenantId(updatedUser.tenants),
    });
    timer();
    return session;
  }

  async revokeSession(userId: string): Promise<void> {
    const id = BigInt(userId);
    await this.userRepository.incrementTokenVersion(id);
  }

  async switchTenant(user: JwtAccessPayload, tenantId: string): Promise<AuthSession> {
    const timer = this.metricsService.startTimer({ operation: 'switch_tenant' });
    const userId = BigInt(user.sub);
    const userWithTenants = await this.userRepository.findByIdWithTenants(userId);

    if (!userWithTenants) {
      timer();
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    this.ensureUserIsActive(userWithTenants);

    const hasAccess = userWithTenants.tenants.some(
      (tenant) => tenant.tenant_id.toString() === tenantId,
    );

    if (!hasAccess) {
      timer();
      throw new ForbiddenException('Usuário não possui acesso ao tenant selecionado.');
    }

    const session = await this.buildAuthSession(userWithTenants, {
      defaultTenantId: tenantId,
      tokenVersion: userWithTenants.token_version,
    });
    timer();
    return session;
  }

  async listUsers(tenantId: string): Promise<UserSummary[]> {
    const timer = this.metricsService.startTimer({ operation: 'users_list' });
    const tenantKey = BigInt(tenantId);
    const assignments = await this.userRepository.listUsersByTenant(tenantKey);

    timer();
    return assignments.map((assignment) => this.mapUserSummary(assignment.user));
  }

  async updateUserRole(params: {
    userId: string;
    tenantId: string;
    role: TenantRole;
  }): Promise<void> {
    const timer = this.metricsService.startTimer({ operation: 'users_update_role' });
    const userId = BigInt(params.userId);
    const tenantId = BigInt(params.tenantId);

    await this.userRepository.updateTenantRole({ userId, tenantId, role: params.role });
    timer();
  }

  async unlockUser(userId: string): Promise<void> {
    const timer = this.metricsService.startTimer({ operation: 'users_unlock' });
    const id = BigInt(userId);
    await this.userRepository.unlockUser(id);
    timer();
  }

  async inviteUser(params: {
    email: string;
    nome: string;
    mensagem?: string;
    tenantId: string;
    role: TenantRole;
    invitedBy: JwtAccessPayload;
  }): Promise<InviteSummary> {
    const timer = this.metricsService.startTimer({ operation: 'invite_create' });
    const normalizedEmail = params.email.toLowerCase();
    const tenantId = BigInt(params.tenantId);
    const invitedById = BigInt(params.invitedBy.sub);

    const existingUser = await this.userRepository.findByEmailWithTenants(normalizedEmail);
    if (existingUser) {
      const alreadyInTenant = existingUser.tenants.some((tenant) => tenant.tenant_id === tenantId);
      if (alreadyInTenant) {
        timer();
        throw new BadRequestException('Usuário já possui acesso a este tenant.');
      }
    }

    const existingInvite = await this.userRepository.findActiveInviteByEmail(
      normalizedEmail,
      tenantId,
    );

    const token = this.generateToken();
    const expiresAt = this.computeInviteExpiry();
    const tokenHash = this.hashToken(token);

    let invite;
    if (existingInvite) {
      invite = await this.userRepository.refreshInvite(
        existingInvite.id,
        new Date(),
        expiresAt,
        invitedById,
      );
      const mailStart = process.hrtime();
      await this.mailService.sendInviteEmail({
        to: normalizedEmail,
        nome: params.nome,
        tenantNome: invite.tenant?.nome,
        role: params.role,
        token,
        expiresAt,
        mensagem: params.mensagem,
        isResend: true,
      });
      this.metricsService.observeQueueLatency(
        { operation: 'invite_email' },
        this.hrtimeToSeconds(mailStart),
      );
    } else {
      invite = await this.userRepository.createInvite({
        tokenHash,
        email: normalizedEmail,
        nome: params.nome,
        mensagem: params.mensagem ?? null,
        tenantId,
        role: params.role,
        invitedById,
        expiresAt,
      });
      const mailStart = process.hrtime();
      await this.mailService.sendInviteEmail({
        to: normalizedEmail,
        nome: params.nome,
        tenantNome: invite.tenant?.nome,
        role: params.role,
        token,
        expiresAt,
        mensagem: params.mensagem,
        isResend: false,
      });
      this.metricsService.observeQueueLatency(
        { operation: 'invite_email' },
        this.hrtimeToSeconds(mailStart),
      );
    }

    this.metricsService.recordInviteSent({
      tenantId: params.tenantId,
      role: params.role,
    });
    const summary = this.mapInviteSummary(invite);
    timer();
    return summary;
  }

  async listInvites(tenantId: string): Promise<InviteSummary[]> {
    const timer = this.metricsService.startTimer({ operation: 'invite_list' });
    const records = await this.userRepository.listInvitesByTenant(BigInt(tenantId));
    const summaries = records.map((invite) => this.mapInviteSummary(invite));
    timer();
    return summaries;
  }

  async resendInvite(inviteId: string, tenantId: string, actor: JwtAccessPayload) {
    const timer = this.metricsService.startTimer({ operation: 'invite_resend' });
    const invite = await this.userRepository.findInviteById(BigInt(inviteId));
    if (!invite || invite.tenant_id.toString() !== tenantId) {
      timer();
      throw new NotFoundException('Convite não encontrado para o tenant informado.');
    }

    if (invite.accepted_at || invite.revoked_at) {
      timer();
      throw new BadRequestException('Convite já foi finalizado.');
    }

    const token = this.generateToken();
    const expiresAt = this.computeInviteExpiry();
    const tokenHash = this.hashToken(token);

    await this.userRepository.revokeInvite(invite.id, new Date());
    const refreshed = await this.userRepository.createInvite({
      tokenHash,
      email: invite.email,
      nome: invite.nome,
      mensagem: invite.mensagem,
      tenantId: invite.tenant_id,
      role: invite.role,
      invitedById: BigInt(actor.sub),
      expiresAt,
    });

    const mailStart = process.hrtime();
    await this.mailService.sendInviteEmail({
      to: invite.email,
      nome: invite.nome,
      tenantNome: invite.tenant?.nome,
      role: invite.role,
      token,
      expiresAt,
      mensagem: invite.mensagem,
      isResend: true,
    });
    this.metricsService.observeQueueLatency(
      { operation: 'invite_email' },
      this.hrtimeToSeconds(mailStart),
    );
    this.metricsService.recordInviteSent({
      tenantId: invite.tenant_id.toString(),
      role: invite.role,
    });

    const summary = this.mapInviteSummary(refreshed);
    timer();
    return summary;
  }

  async revokeInvite(inviteId: string, tenantId: string): Promise<void> {
    const timer = this.metricsService.startTimer({ operation: 'invite_revoke' });
    const invite = await this.userRepository.findInviteById(BigInt(inviteId));
    if (!invite || invite.tenant_id.toString() !== tenantId) {
      timer();
      throw new NotFoundException('Convite não encontrado para o tenant informado.');
    }

    if (invite.revoked_at) {
      timer();
      return;
    }

    await this.userRepository.revokeInvite(invite.id, new Date());
    const mailStart = process.hrtime();
    await this.mailService.sendInviteRevokedEmail(invite.email, invite.tenant?.nome);
    this.metricsService.observeQueueLatency(
      { operation: 'invite_email' },
      this.hrtimeToSeconds(mailStart),
    );
    this.metricsService.recordInviteRevoked({ tenantId });
    timer();
  }

  async validateInviteToken(token: string): Promise<InviteValidation> {
    const timer = this.metricsService.startTimer({ operation: 'invite_validate' });
    const invite = await this.getValidInvite(token);
    const result = {
      email: invite.email,
      nome: invite.nome,
      tenantId: invite.tenant_id.toString(),
      tenantNome: invite.tenant?.nome,
      role: invite.role,
      expiresAt: invite.expires_at,
    };
    timer();
    return result;
  }

  async acceptInvite(params: {
    token: string;
    nome: string;
    password: string;
  }): Promise<AuthSession> {
    const timer = this.metricsService.startTimer({ operation: 'invite_accept' });
    const invite = await this.getValidInvite(params.token);
    const tenantId = invite.tenant_id;
    const normalizedEmail = invite.email.toLowerCase();
    const passwordHash = await hash(params.password, 10);

    let user = await this.userRepository.findByEmailWithTenants(normalizedEmail);

    if (!user) {
      user = await this.userRepository.createLocalUser({
        email: normalizedEmail,
        name: params.nome,
        passwordHash,
        tenantId,
        role: invite.role,
        status: UserStatus.ACTIVE,
      });
    } else {
      await this.userRepository.updateUserPassword(user.id, passwordHash);
      await this.userRepository.addTenantToUser({
        userId: user.id,
        tenantId,
        role: invite.role,
      });
    }

    await this.userRepository.markInviteAccepted(invite.id, new Date());

    const refreshedUser = await this.userRepository.findByEmailWithTenants(normalizedEmail);

    if (!refreshedUser) {
      timer();
      throw new UnauthorizedException('Não foi possível concluir o cadastro.');
    }
    this.metricsService.recordInviteAccepted({
      tenantId: invite.tenant_id.toString(),
      role: invite.role,
    });
    const session = await this.buildAuthSession(refreshedUser);
    timer();
    return session;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const timer = this.metricsService.startTimer({ operation: 'password_reset_request' });
    const normalizedEmail = email.toLowerCase();
    const user = await this.userRepository.findByEmailWithTenants(normalizedEmail);

    if (!user || user.provider !== AuthProvider.LOCAL) {
      timer();
      return;
    }

    const userWithTenants = user as LoadedUser;

    const token = this.generateToken();
    const expiresAt = this.computeResetExpiry();
    const tokenHash = this.hashToken(token);

    await this.userRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const mailStart = process.hrtime();
    await this.mailService.sendPasswordResetEmail({
      to: normalizedEmail,
      nome: userWithTenants.nome,
      token,
      expiresAt,
    });
    this.metricsService.observeQueueLatency(
      { operation: 'password_reset_email' },
      this.hrtimeToSeconds(mailStart),
    );
    const tenantId = this.resolveTenantId(userWithTenants.tenants);
    this.metricsService.recordResetRequested({ tenantId });
    timer();
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const timer = this.metricsService.startTimer({ operation: 'password_reset_complete' });
    const tokenHash = this.hashToken(token);
    const resetToken = await this.userRepository.findResetTokenByHash(tokenHash);

    if (!resetToken || resetToken.used_at) {
      timer();
      throw new BadRequestException('Token inválido ou já utilizado.');
    }

    if (new Date() > new Date(resetToken.expires_at)) {
      timer();
      throw new BadRequestException('Token expirado.');
    }

    const passwordHash = await hash(newPassword, 10);
    await this.userRepository.updateUserPassword(resetToken.user_id, passwordHash);
    await this.userRepository.incrementTokenVersion(resetToken.user_id);
    await this.userRepository.markResetTokenUsed(resetToken.id, new Date());
    const tenantAssignments = await this.userRepository.listTenantsByUser(resetToken.user_id);
    const tenantId =
      tenantAssignments[0]?.tenant_id !== undefined
        ? tenantAssignments[0].tenant_id.toString()
        : 'unknown';
    this.metricsService.recordResetCompleted({ tenantId });
    timer();
  }

  private ensureUserIsActive(user: LoadedUser) {
    if (!user) {
      throw new UnauthorizedException('Usuário inválido.');
    }

    if (user.status === UserStatus.LOCKED && user.locked_until) {
      if (new Date(user.locked_until) > new Date()) {
        throw new ForbiddenException('Usuário bloqueado temporariamente.');
      }
      void this.userRepository.resetFailedAttempts(user.id);
      user.locked_until = null;
      user.failed_attempts = 0;
      user.status = UserStatus.ACTIVE;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Usuário não está ativo.');
    }
  }

  private async buildAuthSession(
    user: LoadedUser,
    options?: { defaultTenantId?: string; tokenVersion?: number },
  ): Promise<AuthSession> {
    this.ensureUserIsActive(user);

    const tenantsForToken = user.tenants.map((tenant) => ({
      tenantId: tenant.tenant_id.toString(),
      nome: tenant.tenant.nome,
      role: tenant.role,
    }));

    const tenantsForUser = tenantsForToken.map((tenant) => ({
      id: tenant.tenantId,
      nome: tenant.nome,
      role: tenant.role,
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
        picture: user.foto_url,
      },
      {
        sub: user.id.toString(),
        tokenVersion,
      },
    );

    const authUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email,
      nome: user.nome,
      foto_url: user.foto_url,
      tenants: tenantsForUser,
    };

    return { user: authUser, tokens, defaultTenantId: defaultTenantId ?? null };
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeInviteExpiry(): Date {
    return new Date(Date.now() + this.inviteTtlHours * 60 * 60 * 1000);
  }

  private computeResetExpiry(): Date {
    return new Date(Date.now() + this.resetTtlMinutes * 60 * 1000);
  }

  private async getValidInvite(token: string) {
    const tokenHash = this.hashToken(token);
    const invite = await this.userRepository.findInviteByTokenHash(tokenHash);

    if (!invite || invite.revoked_at || invite.accepted_at) {
      throw new BadRequestException('Convite inválido.');
    }

    if (new Date() > new Date(invite.expires_at)) {
      throw new BadRequestException('Convite expirado.');
    }

    return invite;
  }

  private mapInviteSummary(invite: Awaited<ReturnType<typeof this.userRepository.findInviteById>>) {
    if (!invite) {
      throw new NotFoundException('Convite não encontrado.');
    }

    return {
      id: invite.id.toString(),
      email: invite.email,
      nome: invite.nome ?? undefined,
      tenantId: invite.tenant_id.toString(),
      tenantNome: invite.tenant?.nome,
      role: invite.role,
      invitedBy: invite.convidante?.id?.toString() ?? '',
      invitedByNome: invite.convidante?.nome,
      invitedAt: invite.invited_at,
      expiresAt: invite.expires_at,
    };
  }

  private mapUserSummary(user: ListedUser): UserSummary {
    return {
      id: user.id.toString(),
      email: user.email,
      nome: user.nome,
      status: user.status,
      provider: user.provider,
      lastLoginAt: user.last_login_at,
      lockedUntil: user.locked_until,
      tenants: user.tenants.map((tenant) => ({
        tenantId: tenant.tenant_id.toString(),
        nome: tenant.tenant.nome,
        role: tenant.role,
      })),
    };
  }

  private resolveTenantId(
    tenants: (LoadedUser['tenants'][number] | ListedUser['tenants'][number])[] | undefined,
  ): string {
    if (!tenants || tenants.length === 0) {
      return 'unknown';
    }

    const tenant = tenants[0];
    if ('tenant_id' in tenant && tenant.tenant_id) {
      return tenant.tenant_id.toString();
    }
    if ('tenant' in tenant && tenant.tenant?.id) {
      return tenant.tenant.id.toString();
    }
    return 'unknown';
  }

  private hrtimeToSeconds(start: [number, number]): number {
    const diff = process.hrtime(start);
    return diff[0] + diff[1] / 1_000_000_000;
  }
}
