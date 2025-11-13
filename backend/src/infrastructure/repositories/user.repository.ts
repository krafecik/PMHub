import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { AuthProvider, TenantRole } from '@prisma/client';

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
            tenant: true
          }
        }
      }
    });
  }

  findByIdWithTenants(id: bigint) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenants: {
          include: {
            tenant: true
          }
        }
      }
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
        status: 'ACTIVE'
      },
      create: {
        email,
        nome: name,
        provider: AuthProvider.AZURE_AD,
        subject_id: subjectId,
        foto_url: picture ?? null,
        status: 'ACTIVE'
      }
    });

    return this.findByIdWithTenants(user.id);
  }

  async incrementTokenVersion(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        token_version: {
          increment: 1
        }
      },
      include: {
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    });
  }

  listTenantsByUser(userId: bigint) {
    return this.prisma.userTenant.findMany({
      where: { user_id: userId },
      include: {
        tenant: true
      }
    });
  }

  async createLocalUser(params: {
    email: string;
    name: string;
    passwordHash: string;
    tenantId: bigint;
    role: TenantRole;
  }) {
    const user = await this.prisma.user.create({
      data: {
        email: params.email,
        nome: params.name,
        password_hash: params.passwordHash,
        provider: AuthProvider.LOCAL,
        tenants: {
          create: [
            {
              tenant_id: params.tenantId,
              role: params.role
            }
          ]
        }
      },
      include: {
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    });

    return user;
  }
}

