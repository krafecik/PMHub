import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BuscarDemandaPorIdQuery } from './buscar-demanda-por-id.query';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';

export interface TagDto {
  id: string;
  nome: string;
}

export interface DemandaDetalhada {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  tipoLabel: string;
  produtoId: string;
  origem: string;
  origemLabel: string;
  origemDetalhe?: string;
  responsavelId?: string;
  prioridade: string;
  prioridadeLabel: string;
  prioridadeColor: string;
  status: string;
  statusLabel: string;
  criadoPorId: string;
  criadoPorNome?: string;
  motivoCancelamento?: string;
  tags: TagDto[];
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(BuscarDemandaPorIdQuery)
export class BuscarDemandaPorIdHandler implements IQueryHandler<BuscarDemandaPorIdQuery> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: BuscarDemandaPorIdQuery): Promise<DemandaDetalhada> {
    const demanda = await this.demandaRepository.findById(query.tenantId, query.demandaId);

    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Buscar tags da demanda
    const demandaTags = await this.prisma.demandaTag.findMany({
      where: {
        demanda_id: BigInt(demanda.id!),
      },
      include: {
        tag: true,
      },
    });

    const tags: TagDto[] = demandaTags.map((dt) => ({
      id: dt.tag.id.toString(),
      nome: dt.tag.nome,
    }));

    // Buscar nome do usuário que criou a demanda
    const usuarioCriador = await this.prisma.user.findUnique({
      where: {
        id: BigInt(demanda.criadoPorId),
      },
      select: {
        nome: true,
      },
    });

    return {
      id: demanda.id!,
      titulo: demanda.titulo.getValue(),
      descricao: demanda.descricao,
      tipo: demanda.tipo.slug,
      tipoLabel: demanda.tipo.label,
      produtoId: demanda.produtoId,
      origem: demanda.origem.slug,
      origemLabel: demanda.origem.label,
      origemDetalhe: demanda.origemDetalhe,
      responsavelId: demanda.responsavelId,
      prioridade: demanda.prioridade.slug,
      prioridadeLabel: demanda.prioridade.label,
      prioridadeColor: demanda.prioridade.getColor(),
      status: demanda.status.slug,
      statusLabel: demanda.status.label,
      criadoPorId: demanda.criadoPorId,
      criadoPorNome: usuarioCriador?.nome || `Usuário #${demanda.criadoPorId}`,
      motivoCancelamento: demanda.motivoCancelamento,
      tags,
      createdAt: demanda.createdAt!,
      updatedAt: demanda.updatedAt!,
    };
  }
}
