import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';

export type TenantAccess = {
  tenantId: string;
  role: string;
  nome?: string;
};

export type JwtAccessPayload = {
  sub: string;
  email: string;
  name: string;
  tenants: TenantAccess[];
  defaultTenantId: string;
  picture?: string | null;
};

export type JwtRefreshPayload = {
  sub: string;
  tokenVersion: number;
};

export type TokensBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>
  ) {}

  async generateTokens(
    accessPayload: JwtAccessPayload,
    refreshPayload: JwtRefreshPayload
  ): Promise<TokensBundle> {
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: '15m'
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: '7d'
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutos em segundos
    };
  }

  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    return this.jwtService.verifyAsync<JwtRefreshPayload>(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true })
    });
  }
}

