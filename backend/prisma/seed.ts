/* eslint-disable no-console */
import { PrismaClient, AuthProvider, TenantRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenantName = process.env.SEED_TENANT_NAME ?? 'Tenant Demo';

  let tenant = await prisma.tenant.findFirst({
    where: { nome: tenantName }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nome: tenantName
      }
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cpopm.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrador CPOPM';

  const passwordHash = await hash(adminPassword, 12);

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: {
      tenants: true
    }
  });

  if (!adminUser) {
    await prisma.user.create({
      data: {
        provider: AuthProvider.LOCAL,
        email: adminEmail,
        nome: adminName,
        password_hash: passwordHash,
        status: 'ACTIVE'
      }
    });
  } else if (!adminUser.password_hash) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password_hash: passwordHash,
        nome: adminName,
        status: 'ACTIVE'
      }
    });
  }

  adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: adminEmail },
    include: {
      tenants: true
    }
  });

  const userTenant = await prisma.userTenant.findUnique({
    where: {
      user_id_tenant_id: {
        user_id: adminUser.id,
        tenant_id: tenant.id
      }
    }
  });

  if (!userTenant) {
    await prisma.userTenant.create({
      data: {
        user_id: adminUser.id,
        tenant_id: tenant.id,
        role: TenantRole.CPO
      }
    });
  } else if (userTenant.role !== TenantRole.CPO) {
    await prisma.userTenant.update({
      where: { id: userTenant.id },
      data: { role: TenantRole.CPO }
    });
  }

  console.info('Seed concluído com tenant demo e usuário admin local.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

