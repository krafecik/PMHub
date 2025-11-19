import { IQuery } from '@nestjs/cqrs';

export class ObterEntrevistaDetalheQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly pesquisaId: string,
    public readonly entrevistaId: string,
  ) {}
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  IEntrevistaRepository,
  IInsightRepository,
  IPesquisaRepository,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { PesquisaId, EntrevistaId } from '../../../domain/discovery/value-objects';

export interface EntrevistaDetalheDTO {
  id: string;
  pesquisaId: string;
  discoveryId: string;
  participanteNome: string;
  participantePerfil?: string;
  participanteEmail?: string;
  dataHora: Date;
  transcricao?: string;
  notas?: string;
  gravacaoUrl?: string;
  tags: string[];
  duracaoMinutos?: number;
  createdAt: Date;
  insights: Array<{
    id: string;
    descricao: string;
    impacto: string;
    impactoLabel: string;
    confianca: string;
    confiancaLabel: string;
    status: string;
    statusLabel: string;
    createdAt: Date;
  }>;
}

@QueryHandler(ObterEntrevistaDetalheQuery)
export class ObterEntrevistaDetalheHandler implements IQueryHandler<ObterEntrevistaDetalheQuery> {
  private readonly logger = new Logger(ObterEntrevistaDetalheHandler.name);

  constructor(
    @Inject('IEntrevistaRepository')
    private readonly entrevistaRepository: IEntrevistaRepository,
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
  ) {}

  async execute(query: ObterEntrevistaDetalheQuery): Promise<EntrevistaDetalheDTO> {
    const { tenantId, pesquisaId, entrevistaId } = query;

    const tenant = new TenantId(tenantId);
    const pesquisaIdVO = new PesquisaId(pesquisaId);
    const entrevistaIdVO = new EntrevistaId(entrevistaId);

    const pesquisa = await this.pesquisaRepository.findById(tenant, pesquisaIdVO);
    if (!pesquisa) {
      throw new NotFoundException('Pesquisa não encontrada');
    }

    const entrevista = await this.entrevistaRepository.findById(tenant, entrevistaIdVO);

    if (!entrevista || entrevista.pesquisaId.getValue() !== pesquisaId) {
      throw new NotFoundException('Entrevista não encontrada');
    }

    const insights = await this.insightRepository.findByEntrevista(tenant, entrevistaIdVO);

    const insightsDTO = insights.map((insight) => ({
      id: insight.id?.getValue() || '',
      descricao: insight.descricao,
      impacto: insight.impacto.getSlug(),
      impactoLabel: insight.impacto.getLabel(),
      confianca: insight.confianca.getSlug(),
      confiancaLabel: insight.confianca.getLabel(),
      status: insight.status.getSlug(),
      statusLabel: insight.status.getLabel(),
      createdAt: insight.createdAt || new Date(),
    }));

    this.logger.debug(
      `Entrevista ${entrevistaId} carregada com ${insightsDTO.length} insights vinculados`,
    );

    return {
      id: entrevista.id?.getValue() || '',
      pesquisaId,
      discoveryId: pesquisa.discoveryId.getValue(),
      participanteNome: entrevista.participanteNome,
      participantePerfil: entrevista.participantePerfil ?? undefined,
      participanteEmail: entrevista.participanteEmail ?? undefined,
      dataHora: entrevista.dataHora,
      transcricao: entrevista.transcricao ?? undefined,
      notas: entrevista.notas ?? undefined,
      gravacaoUrl: entrevista.gravacaoUrl ?? undefined,
      tags: entrevista.tags ?? [],
      duracaoMinutos: entrevista.duracaoMinutos ?? undefined,
      createdAt: entrevista.createdAt || new Date(),
      insights: insightsDTO,
    };
  }
}
