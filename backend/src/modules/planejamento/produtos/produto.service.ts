import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { ProdutoStatus, TenantRole } from '@prisma/client';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';

export type ProdutoView = {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  status: ProdutoStatus;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class ProdutoService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string): Promise<ProdutoView[]> {
    const tenant = BigInt(tenantId);

    const produtos = await this.prisma.produto.findMany({
      where: {
        tenant_id: tenant,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return produtos.map((produto) => this.toView(produto));
  }

  async create(
    tenantId: string,
    dto: CreateProdutoDto,
    user: JwtAccessPayload,
  ): Promise<ProdutoView> {
    this.ensureCanWrite(user, tenantId);

    const produto = await this.prisma.produto.create({
      data: {
        tenant_id: BigInt(tenantId),
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        status: dto.status ?? ProdutoStatus.ACTIVE,
      },
    });

    return this.toView(produto);
  }

  async findOne(tenantId: string, produtoId: string): Promise<ProdutoView> {
    const produto = await this.prisma.produto.findFirst({
      where: {
        id: BigInt(produtoId),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return this.toView(produto);
  }

  async update(
    tenantId: string,
    produtoId: string,
    dto: UpdateProdutoDto,
    user: JwtAccessPayload,
  ): Promise<ProdutoView> {
    this.ensureCanWrite(user, tenantId);

    await this.ensureExists(tenantId, produtoId);

    const produto = await this.prisma.produto.update({
      where: { id: BigInt(produtoId) },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        status: dto.status,
      },
    });

    return this.toView(produto);
  }

  async remove(tenantId: string, produtoId: string, user: JwtAccessPayload): Promise<void> {
    this.ensureCanWrite(user, tenantId, [TenantRole.CPO]);
    await this.ensureExists(tenantId, produtoId);

    await this.prisma.produto.update({
      where: { id: BigInt(produtoId) },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  private async ensureExists(tenantId: string, produtoId: string) {
    const produto = await this.prisma.produto.findFirst({
      where: {
        id: BigInt(produtoId),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
  }

  private ensureCanWrite(user: JwtAccessPayload, tenantId: string, roles?: TenantRole[]) {
    const allowedRoles = roles ?? [TenantRole.CPO, TenantRole.PM];
    const tenantAccess = user.tenants.find((tenant) => tenant.tenantId === tenantId);

    if (!tenantAccess || !allowedRoles.includes(tenantAccess.role as TenantRole)) {
      throw new ForbiddenException('Permissão insuficiente para alterar produtos deste tenant.');
    }
  }

  private toView(produto: {
    id: bigint;
    tenant_id: bigint;
    nome: string;
    descricao: string | null;
    status: ProdutoStatus;
    created_at: Date;
    updated_at: Date;
  }): ProdutoView {
    return {
      id: produto.id.toString(),
      tenant_id: produto.tenant_id.toString(),
      nome: produto.nome,
      descricao: produto.descricao,
      status: produto.status,
      created_at: produto.created_at,
      updated_at: produto.updated_at,
    };
  }
}
