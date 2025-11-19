import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthProvider, TenantRole, UserStatus } from '@prisma/client';
import { UserSummary, InviteSummary, InviteValidation } from '@application/auth/auth.service';

export class InviteUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nome!: string;

  @IsEnum(TenantRole)
  role!: TenantRole;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  mensagem?: string;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsEnum(TenantRole)
  role!: TenantRole;
}

export class ResendInviteParamsDto {
  @IsString()
  inviteId!: string;
}

export class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nome!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class TenantSummaryDto {
  @Expose()
  tenantId!: string;

  @Expose()
  nome!: string;

  @Expose()
  role!: TenantRole;
}

export class UserSummaryResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  nome!: string;

  @Expose()
  status!: UserStatus;

  @Expose()
  provider!: AuthProvider;

  @Expose()
  lastLoginAt?: Date | null;

  @Expose()
  lockedUntil?: Date | null;

  @Expose()
  @Type(() => TenantSummaryDto)
  tenants!: TenantSummaryDto[];

  static fromDomain(user: UserSummary): UserSummaryResponseDto {
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      status: user.status,
      provider: user.provider,
      lastLoginAt: user.lastLoginAt ?? null,
      lockedUntil: user.lockedUntil ?? null,
      tenants: user.tenants.map((tenant) => ({
        tenantId: tenant.tenantId,
        nome: tenant.nome,
        role: tenant.role,
      })),
    };
  }
}

export class InviteSummaryResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  nome?: string | null;

  @Expose()
  tenantId!: string;

  @Expose()
  tenantNome?: string | null;

  @Expose()
  role!: TenantRole;

  @Expose()
  invitedBy!: string;

  @Expose()
  invitedByNome?: string | null;

  @Expose()
  invitedAt!: Date;

  @Expose()
  expiresAt!: Date;

  static fromDomain(invite: InviteSummary): InviteSummaryResponseDto {
    return {
      id: invite.id,
      email: invite.email,
      nome: invite.nome ?? null,
      tenantId: invite.tenantId,
      tenantNome: invite.tenantNome ?? null,
      role: invite.role,
      invitedBy: invite.invitedBy,
      invitedByNome: invite.invitedByNome ?? null,
      invitedAt: invite.invitedAt,
      expiresAt: invite.expiresAt,
    };
  }
}

export class InviteValidationResponseDto {
  @Expose()
  email!: string;

  @Expose()
  nome?: string | null;

  @Expose()
  tenantId!: string;

  @Expose()
  tenantNome?: string | null;

  @Expose()
  role!: TenantRole;

  @Expose()
  expiresAt!: Date;

  static fromDomain(validation: InviteValidation): InviteValidationResponseDto {
    return {
      email: validation.email,
      nome: validation.nome ?? null,
      tenantId: validation.tenantId,
      tenantNome: validation.tenantNome ?? null,
      role: validation.role,
      expiresAt: validation.expiresAt,
    };
  }
}
