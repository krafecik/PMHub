import { AuthSession } from '@application/auth/auth.service';
import { TenantRole } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf
} from 'class-validator';

export enum AuthProviderRequest {
  AZURE_AD = 'azuread',
  LOCAL = 'local'
}

export class LoginRequestDto {
  @IsEnum(AuthProviderRequest)
  provider!: AuthProviderRequest;

  @ValidateIf((o) => o.provider === AuthProviderRequest.LOCAL)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => o.provider === AuthProviderRequest.LOCAL)
  @IsString()
  @MinLength(6)
  password?: string;
}

export class TenantResponseDto {
  @Expose()
  id!: string;

  @Expose()
  nome!: string;

  @Expose()
  role!: TenantRole;
}

export class AuthUserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  nome!: string;

  @Expose()
  foto_url?: string | null;

  @Expose()
  @Type(() => TenantResponseDto)
  tenants!: TenantResponseDto[];
}

export class AuthTokensResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  expiresIn!: number;
}

export class AuthSessionResponseDto {
  @Expose()
  @Type(() => AuthUserResponseDto)
  user!: AuthUserResponseDto;

  @Expose()
  @Type(() => AuthTokensResponseDto)
  tokens!: AuthTokensResponseDto;

  @Expose()
  defaultTenantId!: string | null;

  static fromDomain(session: AuthSession): AuthSessionResponseDto {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        nome: session.user.nome,
        foto_url: session.user.foto_url ?? null,
        tenants: session.user.tenants
      },
      tokens: session.tokens,
      defaultTenantId: session.defaultTenantId
    };
  }
}

export class AzureLoginResponseDto {
  @Expose()
  authorizationUrl!: string;

  @Expose()
  state!: string;

  @Expose()
  expiresIn!: number;
}

export class RefreshTokenRequestDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AuthCallbackQueryDto {
  @IsString()
  code!: string;

  @IsString()
  state!: string;
}

