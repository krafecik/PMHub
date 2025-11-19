import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { AuthProvider, TenantRole, UserStatus } from '@prisma/client';

export type UserWithTenants = Awaited<ReturnType<UserRepository['findByIdWithTenants']>>;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithTenants(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  findByIdWithTenants(id: bigint) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async upsertAzureUser(params: {
    email: string;
    name: string;
    subjectId: string;
    picture?: string | null;
  }) {
    const { email, name, subjectId, picture } = params;

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        nome: name,
        subject_id: subjectId,
        provider: AuthProvider.AZURE_AD,
        foto_url: picture ?? null,
        status: UserStatus.ACTIVE,
        email_verified_at: new Date(),
      },
      create: {
        email,
        nome: name,
        provider: AuthProvider.AZURE_AD,
        subject_id: subjectId,
        foto_url: picture ?? null,
        status: UserStatus.ACTIVE,
        email_verified_at: new Date(),
      },
    });

    return this.findByIdWithTenants(user.id);
  }

  async incrementTokenVersion(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        token_version: {
          increment: 1,
        },
      },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  listTenantsByUser(userId: bigint) {
    return this.prisma.userTenant.findMany({
      where: { user_id: userId },
      include: {
        tenant: true,
      },
    });
  }

  async createLocalUser(params: {
    email: string;
    name: string;
    passwordHash: string;
    tenantId: bigint;
    role: TenantRole;
    status?: UserStatus;
  }) {
    const user = await this.prisma.user.create({
      data: {
        email: params.email,
        nome: params.name,
        password_hash: params.passwordHash,
        provider: AuthProvider.LOCAL,
        status: params.status ?? UserStatus.ACTIVE,
        email_verified_at: new Date(),
        last_password_change_at: new Date(),
        tenants: {
          create: [
            {
              tenant_id: params.tenantId,
              role: params.role,
            },
          ],
        },
      },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return user;
  }

  async addTenantToUser(params: { userId: bigint; tenantId: bigint; role: TenantRole }) {
    return this.prisma.userTenant.upsert({
      where: {
        user_id_tenant_id: {
          user_id: params.userId,
          tenant_id: params.tenantId,
        },
      },
      update: {
        role: params.role,
      },
      create: {
        user_id: params.userId,
        tenant_id: params.tenantId,
        role: params.role,
      },
    });
  }

  async listUsersByTenant(tenantId: bigint) {
    return this.prisma.userTenant.findMany({
      where: { tenant_id: tenantId },
      include: {
        tenant: true,
        user: {
          include: {
            tenants: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async updateTenantRole(params: { userId: bigint; tenantId: bigint; role: TenantRole }) {
    return this.prisma.userTenant.update({
      where: {
        user_id_tenant_id: {
          user_id: params.userId,
          tenant_id: params.tenantId,
        },
      },
      data: {
        role: params.role,
      },
    });
  }

  async createInvite(params: {
    tokenHash: string;
    email: string;
    nome?: string | null;
    mensagem?: string | null;
    tenantId: bigint;
    role: TenantRole;
    invitedById: bigint;
    expiresAt: Date;
  }) {
    return this.prisma.userInvite.create({
      data: {
        token_hash: params.tokenHash,
        email: params.email.toLowerCase(),
        nome: params.nome ?? null,
        mensagem: params.mensagem ?? null,
        tenant_id: params.tenantId,
        role: params.role,
        invited_by_id: params.invitedById,
        expires_at: params.expiresAt,
      },
      include: {
        convidante: true,
        tenant: true,
      },
    });
  }

  listInvitesByTenant(tenantId: bigint) {
    return this.prisma.userInvite.findMany({
      where: {
        tenant_id: tenantId,
        revoked_at: null,
        accepted_at: null,
      },
      include: {
        convidante: true,
        tenant: true,
      },
      orderBy: {
        invited_at: 'desc',
      },
    });
  }

  findActiveInviteByEmail(email: string, tenantId: bigint) {
    return this.prisma.userInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        tenant_id: tenantId,
        revoked_at: null,
        accepted_at: null,
      },
      include: {
        convidante: true,
        tenant: true,
      },
    });
  }

  findInviteById(id: bigint) {
    return this.prisma.userInvite.findUnique({
      where: { id },
      include: {
        convidante: true,
        tenant: true,
      },
    });
  }

  findInviteByTokenHash(tokenHash: string) {
    return this.prisma.userInvite.findUnique({
      where: { token_hash: tokenHash },
      include: {
        tenant: true,
      },
    });
  }

  async markInviteAccepted(inviteId: bigint, acceptedAt: Date) {
    return this.prisma.userInvite.update({
      where: { id: inviteId },
      data: {
        accepted_at: acceptedAt,
      },
    });
  }

  async revokeInvite(inviteId: bigint, revokedAt: Date) {
    return this.prisma.userInvite.update({
      where: { id: inviteId },
      data: {
        revoked_at: revokedAt,
      },
    });
  }

  async refreshInvite(inviteId: bigint, invitedAt: Date, expiresAt: Date, invitedById: bigint) {
    return this.prisma.userInvite.update({
      where: { id: inviteId },
      data: {
        invited_at: invitedAt,
        invited_by_id: invitedById,
        expires_at: expiresAt,
      },
      include: {
        convidante: true,
        tenant: true,
      },
    });
  }

  async createPasswordResetToken(params: { userId: bigint; tokenHash: string; expiresAt: Date }) {
    return this.prisma.passwordResetToken.create({
      data: {
        user_id: params.userId,
        token_hash: params.tokenHash,
        expires_at: params.expiresAt,
      },
    });
  }

  findResetTokenByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: true,
      },
    });
  }

  async markResetTokenUsed(id: bigint, usedAt: Date) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: {
        used_at: usedAt,
      },
    });
  }

  async updateUserPassword(userId: bigint, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        status: UserStatus.ACTIVE,
        failed_attempts: 0,
        locked_until: null,
        last_password_change_at: new Date(),
        provider: AuthProvider.LOCAL,
        email_verified_at: new Date(),
      },
    });
  }

  async updateFailedAttempts(userId: bigint, attempts: number, lockedUntil: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failed_attempts: attempts,
        locked_until: lockedUntil,
        status: lockedUntil ? UserStatus.LOCKED : UserStatus.ACTIVE,
      },
    });
  }

  async resetFailedAttempts(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failed_attempts: 0,
        locked_until: null,
        status: UserStatus.ACTIVE,
      },
    });
  }

  async updateLastLogin(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        last_login_at: new Date(),
        failed_attempts: 0,
        locked_until: null,
        status: UserStatus.ACTIVE,
      },
    });
  }

  async unlockUser(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        locked_until: null,
        failed_attempts: 0,
        status: UserStatus.ACTIVE,
      },
    });
  }
}
