import { IQuery } from '@nestjs/cqrs';

export class ObterDiscoveryCompletoQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
  ) {}
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IDiscoveryRepository,
  IHipoteseRepository,
  IPesquisaRepository,
  IEvidenciaRepository,
  IInsightRepository,
  IExperimentoRepository,
  IEntrevistaRepository,
  IDecisaoDiscoveryRepository,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId, PesquisaId } from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';

interface HipoteseDTO {
  id: string;
  titulo: string;
  descricao: string;
  comoValidar: string;
  metricaAlvo?: string;
  impactoEsperado: string;
  prioridade: string;
  status: string;
  statusLabel: string;
  qtdEvidencias: number;
  qtdExperimentos: number;
  createdAt: Date;
}

interface EntrevistaDTO {
  id: string;
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
}

interface PesquisaDTO {
  id: string;
  titulo: string;
  metodo: string;
  metodoLabel: string;
  objetivo: string;
  roteiroUrl?: string;
  status: string;
  statusLabel: string;
  totalParticipantes: number;
  participantesConcluidos: number;
  progressoPercentual: number;
  qtdEntrevistas: number;
  entrevistas: EntrevistaDTO[];
  createdAt: Date;
}

interface EvidenciaDTO {
  id: string;
  hipoteseId?: string;
  tipo: string;
  tipoLabel: string;
  titulo: string;
  descricao: string;
  arquivoUrl?: string;
  tags: string[];
  createdAt: Date;
}

interface InsightDTO {
  id: string;
  entrevistaId?: string;
  descricao: string;
  impacto: string;
  impactoLabel: string;
  confianca: string;
  confiancaLabel: string;
  status: string;
  statusLabel: string;
  tags: string[];
  qtdEvidencias: number;
  relevanceScore: number;
  createdAt: Date;
}

interface ExperimentoDTO {
  id: string;
  hipoteseId?: string;
  titulo: string;
  descricao: string;
  tipo: string;
  tipoLabel: string;
  metricaSucesso: string;
  metricaSucessoSlug?: string;
  metricaSucessoLabel?: string;
  status: string;
  statusLabel: string;
  hasResults: boolean;
  pValue?: number;
  isSignificant?: boolean;
  createdAt: Date;
}

interface DecisaoDTO {
  statusFinal: string;
  statusFinalLabel: string;
  resumo: string;
  aprendizados: string[];
  recomendacoes: string[];
  proximosPassos: string[];
  decididoPorNome?: string;
  dataDecisao?: Date;
  materiaisAnexos?: Record<string, unknown> | null;
}

export interface DiscoveryCompletoDTO {
  id: string;
  demandaId: string;
  titulo: string;
  descricao: string;
  contexto?: string;
  publicoAfetado: string[];
  volumeImpactado?: string;
  severidade?: string;
  severidadeLabel?: string;
  comoIdentificado: string[];
  status: string;
  statusLabel: string;
  produtoId: string;
  produtoNome?: string;
  responsavelId: string;
  responsavelNome?: string;
  criadoPorId: string;
  criadoPorNome?: string;
  hipoteses: HipoteseDTO[];
  pesquisas: PesquisaDTO[];
  evidencias: EvidenciaDTO[];
  insights: InsightDTO[];
  experimentos: ExperimentoDTO[];
  decisao?: DecisaoDTO;
  evolucaoLog: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ObterDiscoveryCompletoQuery)
export class ObterDiscoveryCompletoHandler implements IQueryHandler<ObterDiscoveryCompletoQuery> {
  private readonly logger = new Logger(ObterDiscoveryCompletoHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
    @Inject('IEvidenciaRepository')
    private readonly evidenciaRepository: IEvidenciaRepository,
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IExperimentoRepository')
    private readonly experimentoRepository: IExperimentoRepository,
    @Inject('IEntrevistaRepository')
    private readonly entrevistaRepository: IEntrevistaRepository,
    @Inject('IDecisaoDiscoveryRepository')
    private readonly decisaoRepository: IDecisaoDiscoveryRepository,
  ) {}

  async execute(query: ObterDiscoveryCompletoQuery): Promise<DiscoveryCompletoDTO> {
    const { tenantId, discoveryId } = query;

    // Get discovery
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    // Get all related data
    const [hipoteses, pesquisas, evidencias, insights, experimentos] = await Promise.all([
      this.hipoteseRepository.findByDiscovery(new TenantId(tenantId), new DiscoveryId(discoveryId)),
      this.pesquisaRepository.findByDiscovery(new TenantId(tenantId), new DiscoveryId(discoveryId)),
      this.evidenciaRepository.findByDiscovery(
        new TenantId(tenantId),
        new DiscoveryId(discoveryId),
      ),
      this.insightRepository.findByDiscovery(new TenantId(tenantId), new DiscoveryId(discoveryId)),
      this.experimentoRepository.findByDiscovery(
        new TenantId(tenantId),
        new DiscoveryId(discoveryId),
      ),
    ]);

    // Transform hipoteses
    const hipotesesDTO: HipoteseDTO[] = await Promise.all(
      hipoteses.map(async (h) => ({
        id: h.id?.getValue() || '',
        titulo: h.titulo,
        descricao: h.descricao,
        comoValidar: h.comoValidar,
        metricaAlvo: h.metricaAlvo,
        impactoEsperado: h.impactoEsperado.getSlug(),
        prioridade: h.prioridade.getSlug(),
        status: h.status.getSlug(),
        statusLabel: h.status.getLabel(),
        qtdEvidencias: evidencias.filter((e) => e.hipoteseId?.getValue() === h.id?.getValue())
          .length,
        qtdExperimentos: experimentos.filter((e) => e.hipoteseId?.getValue() === h.id?.getValue())
          .length,
        createdAt: h.createdAt || new Date(),
      })),
    );

    // Transform pesquisas
    const pesquisasDTO: PesquisaDTO[] = await Promise.all(
      pesquisas.map(async (p) => {
        const pesquisaId = p.id?.getValue();
        let entrevistasDTO: EntrevistaDTO[] = [];
        let qtdEntrevistas = 0;

        if (pesquisaId) {
          const entrevistas = await this.entrevistaRepository.findByPesquisa(
            new TenantId(tenantId),
            new PesquisaId(pesquisaId),
          );
          entrevistasDTO = entrevistas.map((entrevista) => ({
            id: entrevista.id?.getValue() || '',
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
          }));
          qtdEntrevistas = entrevistasDTO.length;
        }

        return {
          id: pesquisaId || '',
          titulo: p.titulo,
          metodo: p.metodo.getSlug(),
          metodoLabel: p.metodo.getLabel(),
          objetivo: p.objetivo,
          roteiroUrl: p.roteiroUrl,
          status: p.status.getSlug(),
          statusLabel: p.status.getLabel(),
          totalParticipantes: p.totalParticipantes,
          participantesConcluidos: p.participantesConcluidos,
          progressoPercentual: p.getProgressoPercentual(),
          qtdEntrevistas,
          entrevistas: entrevistasDTO,
          createdAt: p.createdAt || new Date(),
        };
      }),
    );

    // Transform evidencias
    const evidenciasDTO: EvidenciaDTO[] = evidencias.map((e) => ({
      id: e.id?.getValue() || '',
      hipoteseId: e.hipoteseId?.getValue(),
      tipo: e.tipo.getValue(),
      tipoLabel: e.tipo.getLabel(),
      titulo: e.titulo,
      descricao: e.descricao,
      arquivoUrl: e.arquivoUrl,
      tags: e.tags,
      createdAt: e.createdAt || new Date(),
    }));

    // Transform insights
    const insightsDTO: InsightDTO[] = insights.map((i) => ({
      id: i.id?.getValue() || '',
      entrevistaId: i.entrevistaId?.getValue(),
      descricao: i.descricao,
      impacto: i.impacto.getSlug(),
      impactoLabel: i.impacto.getLabel(),
      confianca: i.confianca.getSlug(),
      confiancaLabel: i.confianca.getLabel(),
      status: i.status.getSlug(),
      statusLabel: i.status.getLabel(),
      tags: i.tags,
      qtdEvidencias: i.evidenciasIds.length,
      relevanceScore: i.getRelevanceScore(),
      createdAt: i.createdAt || new Date(),
    }));

    // Transform experimentos
    const experimentosDTO: ExperimentoDTO[] = experimentos.map((e) => ({
      id: e.id?.getValue() || '',
      hipoteseId: e.hipoteseId?.getValue(),
      titulo: e.titulo,
      descricao: e.descricao,
      tipo: e.tipoSlug,
      tipoLabel: e.tipoLabel,
      metricaSucesso: e.metricaSucesso,
      metricaSucessoSlug: e.metricaSucessoCatalogo?.getSlug(),
      metricaSucessoLabel: e.metricaSucessoCatalogo?.getLabel(),
      status: e.status.getSlug(),
      statusLabel: e.status.getLabel(),
      hasResults: e.hasResults(),
      pValue: e.pValue,
      isSignificant: e.pValue !== undefined ? e.isStatisticallySignificant() : undefined,
      createdAt: e.createdAt || new Date(),
    }));

    const decisaoEntity = await this.decisaoRepository.findByDiscovery(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    const decisao: DecisaoDTO | undefined = decisaoEntity
      ? {
          statusFinal: decisaoEntity.statusFinal.getSlug(),
          statusFinalLabel: decisaoEntity.statusFinal.getLabel(),
          resumo: decisaoEntity.resumo,
          aprendizados: decisaoEntity.aprendizados,
          recomendacoes: decisaoEntity.recomendacoes,
          proximosPassos: decisaoEntity.proximosPassos,
          decididoPorNome: undefined,
          dataDecisao: decisaoEntity.createdAt,
          materiaisAnexos: decisaoEntity.materiaisAnexos ?? null,
        }
      : undefined;

    return {
      id: discovery.id?.getValue() || '',
      demandaId: discovery.demandaId.getValue(),
      titulo: discovery.titulo,
      descricao: discovery.descricao,
      contexto: discovery.contexto,
      publicoAfetado: discovery.publicoAfetado,
      volumeImpactado: discovery.volumeImpactado,
      severidade: discovery.severidade.getSlug(),
      severidadeLabel: discovery.severidade.getLabel(),
      comoIdentificado: discovery.comoIdentificado,
      status: discovery.status.getValue(),
      statusLabel: discovery.status.getLabel(),
      produtoId: discovery.produtoId.getValue(),
      produtoNome: discovery.produtoNome,
      responsavelId: discovery.responsavelId.getValue(),
      responsavelNome: discovery.responsavelNome,
      criadoPorId: discovery.criadoPorId.getValue(),
      criadoPorNome: discovery.criadoPorNome,
      hipoteses: hipotesesDTO,
      pesquisas: pesquisasDTO,
      evidencias: evidenciasDTO,
      insights: insightsDTO,
      experimentos: experimentosDTO,
      decisao,
      evolucaoLog: discovery.evolucaoLog,
      createdAt: discovery.createdAt || new Date(),
      updatedAt: discovery.updatedAt || new Date(),
    };
  }
}
