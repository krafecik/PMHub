import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRepository, UserWithTenants } from '@infra/repositories';
import { JwtTokenService } from '@core/auth/jwt-token.service';
import { MailService } from '@infra/email/mail.service';
import { MetricsService } from '@core/metrics/metrics.service';
import { EnvConfig } from '@config/env.config';
import { AuthProvider, TenantRole, UserStatus } from '@prisma/client';
import { hashSync } from 'bcryptjs';

describe('AuthService - métricas de autenticação', () => {
  let service: AuthService;
  let configService: ConfigService<EnvConfig, true>;
  let userRepositoryMock: {
    findByEmailWithTenants: jest.Mock;
    updateLastLogin: jest.Mock;
    findByIdWithTenants: jest.Mock;
    updateFailedAttempts: jest.Mock;
    resetFailedAttempts: jest.Mock;
  };
  let jwtTokenServiceMock: {
    generateTokens: jest.Mock;
  };
  let mailServiceMock: Partial<MailService>;
  let metricsServiceMock: {
    startTimer: jest.Mock;
    recordLoginAttempt: jest.Mock;
    recordLoginSuccess: jest.Mock;
    recordLoginFailure: jest.Mock;
    recordAccountLocked: jest.Mock;
    recordInviteSent: jest.Mock;
    recordInviteAccepted: jest.Mock;
    recordInviteRevoked: jest.Mock;
    recordResetRequested: jest.Mock;
    recordResetCompleted: jest.Mock;
    observeQueueLatency: jest.Mock;
  };
  let timerMock: jest.Mock;
  let validPasswordHash: string;
  let invalidPasswordHash: string;

  beforeAll(() => {
    validPasswordHash = hashSync('StrongPass123!', 1);
    invalidPasswordHash = hashSync('OutraSenha123!', 1);
  });

  beforeEach(() => {
    timerMock = jest.fn();

    configService = {
      get: jest.fn((key: keyof EnvConfig) => {
        switch (key) {
          case 'AUTH_INVITE_TTL_HOURS':
            return 72;
          case 'AUTH_RESET_TTL_MINUTES':
            return 60;
          case 'AUTH_AZURE_AD_ENABLED':
            return false;
          case 'APP_WEB_URL':
            return 'http://localhost:3000';
          default:
            return undefined;
        }
      }),
    } as unknown as ConfigService<EnvConfig, true>;

    userRepositoryMock = {
      findByEmailWithTenants: jest.fn(),
      updateLastLogin: jest.fn(),
      findByIdWithTenants: jest.fn(),
      updateFailedAttempts: jest.fn(),
      resetFailedAttempts: jest.fn(),
    };

    jwtTokenServiceMock = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      }),
    };

    mailServiceMock = {};

    metricsServiceMock = {
      startTimer: jest.fn().mockReturnValue(timerMock),
      recordLoginAttempt: jest.fn(),
      recordLoginSuccess: jest.fn(),
      recordLoginFailure: jest.fn(),
      recordAccountLocked: jest.fn(),
      recordInviteSent: jest.fn(),
      recordInviteAccepted: jest.fn(),
      recordInviteRevoked: jest.fn(),
      recordResetRequested: jest.fn(),
      recordResetCompleted: jest.fn(),
      observeQueueLatency: jest.fn(),
    };

    service = new AuthService(
      configService,
      {} as any,
      {} as any,
      userRepositoryMock as unknown as UserRepository,
      jwtTokenServiceMock as unknown as JwtTokenService,
      mailServiceMock as MailService,
      metricsServiceMock as unknown as MetricsService,
    );
  });

  function buildUser(overrides: Record<string, unknown> = {}): UserWithTenants {
    const baseUser = {
      id: BigInt(1),
      email: 'user@example.com',
      nome: 'Usuário Teste',
      provider: AuthProvider.LOCAL,
      password_hash: validPasswordHash,
      status: UserStatus.ACTIVE,
      failed_attempts: 0,
      locked_until: null,
      tenants: [
        {
          tenant_id: BigInt(10),
          role: TenantRole.CPO,
          tenant: {
            id: BigInt(10),
            nome: 'Tenant Teste',
          },
        },
      ],
    };

    return { ...baseUser, ...overrides } as unknown as UserWithTenants;
  }
  it('registra métricas de sucesso no login local', async () => {
    const user = buildUser();
    userRepositoryMock.findByEmailWithTenants.mockResolvedValue(user);
    userRepositoryMock.updateLastLogin.mockResolvedValue(undefined);
    userRepositoryMock.findByIdWithTenants.mockResolvedValue(user);

    const result = await service.loginLocal('user@example.com', 'StrongPass123!');

    expect(metricsServiceMock.startTimer).toHaveBeenCalledWith({ operation: 'login_local' });
    expect(metricsServiceMock.recordLoginAttempt).toHaveBeenCalledWith({
      provider: 'local',
      tenantId: '10',
    });
    expect(metricsServiceMock.recordLoginSuccess).toHaveBeenCalledWith({
      provider: 'local',
      tenantId: '10',
    });
    expect(metricsServiceMock.recordLoginFailure).not.toHaveBeenCalled();
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(result.tokens.accessToken).toBe('access');
  });

  it('registra falha e bloqueio ao exceder tentativas', async () => {
    const user = buildUser({ failed_attempts: 4, password_hash: invalidPasswordHash });
    userRepositoryMock.findByEmailWithTenants.mockResolvedValue(user);
    userRepositoryMock.updateFailedAttempts.mockResolvedValue(undefined);

    await expect(service.loginLocal('user@example.com', 'SenhaIncorreta!')).rejects.toThrow(
      'Usuário bloqueado temporariamente após múltiplas tentativas.',
    );

    expect(metricsServiceMock.startTimer).toHaveBeenCalledWith({ operation: 'login_local' });
    expect(metricsServiceMock.recordLoginAttempt).toHaveBeenCalledWith({
      provider: 'local',
      tenantId: '10',
    });
    expect(metricsServiceMock.recordAccountLocked).toHaveBeenCalledWith({
      tenantId: '10',
    });
    expect(metricsServiceMock.recordLoginFailure).toHaveBeenCalledWith({
      reason: 'locked',
      tenantId: '10',
    });
    expect(metricsServiceMock.recordLoginSuccess).not.toHaveBeenCalled();
    expect(timerMock).toHaveBeenCalledTimes(1);
  });
});


