import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { SolicitacaoInfoRepository } from './solicitacao-info.repository.interface';
import { SolicitacaoInfo, StatusSolicitacaoEnum } from '@domain/triagem';

@Injectable()
export class PrismaSolicitacaoInfoRepository implements SolicitacaoInfoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SolicitacaoInfo | null> {
    const data = await this.prisma.solicitacaoInfo.findUnique({
      where: { id: BigInt(id) },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByTriagem(triagemId: string): Promise<SolicitacaoInfo[]> {
    const data = await this.prisma.solicitacaoInfo.findMany({
      where: { triagem_id: BigInt(triagemId) },
      orderBy: { created_at: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByTenant(tenantId: string): Promise<SolicitacaoInfo[]> {
    const data = await this.prisma.solicitacaoInfo.findMany({
      where: {
        triagem: {
          demanda: {
            tenant_id: BigInt(tenantId),
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findBySolicitante(solicitanteId: string): Promise<SolicitacaoInfo[]> {
    const data = await this.prisma.solicitacaoInfo.findMany({
      where: { solicitante_id: BigInt(solicitanteId) },
      orderBy: { created_at: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async create(solicitacao: SolicitacaoInfo): Promise<SolicitacaoInfo> {
    // Buscar tenant_id da triagem (triagemId é o ID da triagem)
    const triagem = await this.prisma.triagemDemanda.findUnique({
      where: { id: BigInt(solicitacao.triagemId) },
      select: { tenant_id: true },
    });

    if (!triagem) {
      throw new Error(`TriagemDemanda ${solicitacao.triagemId} não encontrada`);
    }

    const data = await this.prisma.solicitacaoInfo.create({
      data: {
        triagem_id: BigInt(solicitacao.triagemId),
        tenant_id: triagem.tenant_id,
        solicitante_id: BigInt(solicitacao.solicitanteId),
        texto: solicitacao.texto,
        anexos: solicitacao.anexos,
        prazo: solicitacao.prazo,
        status: solicitacao.status,
        respondido_em: solicitacao.respondidoEm ?? null,
        resposta: solicitacao.resposta ?? null,
      },
    });

    return this.toDomain(data);
  }

  async update(solicitacao: SolicitacaoInfo): Promise<void> {
    await this.prisma.solicitacaoInfo.update({
      where: { id: BigInt(solicitacao.id) },
      data: {
        texto: solicitacao.texto,
        anexos: solicitacao.anexos,
        prazo: solicitacao.prazo ?? null,
        status: solicitacao.status,
        respondido_em: solicitacao.respondidoEm ?? null,
        resposta: solicitacao.resposta ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.solicitacaoInfo.delete({
      where: { id: BigInt(id) },
    });
  }

  private toDomain(data: any): SolicitacaoInfo {
    return new SolicitacaoInfo({
      id: data.id.toString(),
      triagemId: data.triagem_id.toString(),
      solicitanteId: data.solicitante_id.toString(),
      texto: data.texto,
      anexos: Array.isArray(data.anexos) ? data.anexos : [],
      prazo: data.prazo ?? undefined,
      status: data.status as StatusSolicitacaoEnum,
      respondidoEm: data.respondido_em ?? undefined,
      resposta: data.resposta ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
