import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import {
  CriarDiscoveryCommand,
  CriarHipoteseCommand,
  RegistrarPesquisaCommand,
  AdicionarEntrevistaCommand,
  CriarEvidenciaCommand,
  GerarInsightCommand,
  IniciarExperimentoCommand,
  FinalizarDiscoveryCommand,
  AtualizarStatusHipoteseCommand,
  ConcluirExperimentoCommand,
  AtualizarDiscoveryCommand,
} from '../../../application/discovery/commands';
import {
  ListarDiscoveriesQuery,
  ObterDiscoveryCompletoQuery,
  BuscarInsightsRelacionadosQuery,
  ObterEstatisticasDiscoveryQuery,
  ObterEntrevistaDetalheQuery,
} from '../../../application/discovery/queries';
import { DiscoveryAiService } from '@application/discovery/services';

type SortBy = 'createdAt' | 'updatedAt' | 'titulo';
type SortOrder = 'asc' | 'desc';

export interface ListarDiscoveriesQueryParams {
  page?: string;
  pageSize?: string;
  status?: string | string[];
  responsavelId?: string;
  produtoId?: string;
  searchTerm?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export interface RegistrarPesquisaPayload {
  titulo: string;
  metodo: string;
  objetivo: string;
  roteiroUrl?: string;
  totalParticipantes?: number;
}

export interface CriarDiscoveryPayload {
  demandaId: string;
  titulo: string;
  descricao: string;
  contexto?: string;
  publicoAfetado?: string[];
  volumeImpactado?: string;
  severidade?: string;
  comoIdentificado?: string[];
  responsavelId: string;
  produtoId: string;
}

export interface CriarHipotesePayload {
  titulo: string;
  descricao: string;
  comoValidar: string;
  metricaAlvo?: string;
  impactoEsperado?: string;
  prioridade?: string;
}

export interface AdicionarEntrevistaPayload {
  participanteNome: string;
  participantePerfil?: string;
  participanteEmail?: string;
  dataHora: Date | string;
  transcricao?: string;
  notas?: string;
  gravacaoUrl?: string;
  tags?: string[];
  duracaoMinutos?: number;
}

export interface CriarEvidenciaPayload {
  hipoteseId?: string;
  tipo: string;
  titulo: string;
  descricao: string;
  arquivoUrl?: string;
  tags?: string[];
}

export interface GerarInsightPayload {
  entrevistaId?: string;
  descricao: string;
  impacto?: string;
  confianca?: string;
  tags?: string[];
  evidenciasIds?: string[];
}

export interface IniciarExperimentoPayload {
  hipoteseId?: string;
  titulo: string;
  descricao: string;
  tipo: string;
  metricaSucesso: string;
  grupoControle?: any;
  grupoVariante?: any;
}

export interface FinalizarDiscoveryPayload {
  statusFinal: string;
  resumo: string;
  aprendizados?: string[];
  recomendacoes?: string[];
  proximosPassos?: string[];
  materiaisAnexos?: any;
}

export interface AtualizarDiscoveryPayload {
  titulo?: string;
  descricao?: string;
  contexto?: string;
  publicoAfetado?: string[];
  volumeImpactado?: string;
  severidade?: string;
  comoIdentificado?: string[];
}

@Injectable()
export class DiscoveryHttpService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly discoveryAiService: DiscoveryAiService,
  ) {}

  async listarDiscoveries(user: JwtAccessPayload, params: ListarDiscoveriesQueryParams) {
    const tenantId = this.getTenantId(user);
    const page = params.page ? parseInt(params.page, 10) : 1;
    const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20;

    if (Number.isNaN(page) || page < 1) {
      throw new BadRequestException('Parâmetro page inválido');
    }

    if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('Parâmetro pageSize inválido (1-100)');
    }

    const query = new ListarDiscoveriesQuery(
      tenantId,
      {
        status: Array.isArray(params.status)
          ? params.status
          : params.status
            ? [params.status]
            : undefined,
        responsavelId: params.responsavelId,
        produtoId: params.produtoId,
        searchTerm: params.searchTerm,
      },
      {
        page,
        pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    );

    return this.queryBus.execute(query);
  }

  async obterEstatisticas(user: JwtAccessPayload, produtoId?: string) {
    const tenantId = this.getTenantId(user);
    const query = new ObterEstatisticasDiscoveryQuery(tenantId, produtoId);
    return this.queryBus.execute(query);
  }

  async buscarInsightsRelacionados(
    user: JwtAccessPayload,
    tags: string | string[],
    excludeDiscoveryId?: string,
    limit?: string,
  ) {
    const tenantId = this.getTenantId(user);
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    if (tagsArray.length === 0) {
      throw new BadRequestException('Informe ao menos uma tag para buscar insights relacionados');
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;
    if (Number.isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
      throw new BadRequestException('Parâmetro limit inválido (1-50)');
    }

    const query = new BuscarInsightsRelacionadosQuery(
      tenantId,
      tagsArray,
      excludeDiscoveryId,
      limitNumber,
    );
    return this.queryBus.execute(query);
  }

  async obterDiscovery(user: JwtAccessPayload, discoveryId: string) {
    const tenantId = this.getTenantId(user);
    const query = new ObterDiscoveryCompletoQuery(tenantId, discoveryId);
    return this.queryBus.execute(query);
  }

  async obterEntrevistaDetalhe(user: JwtAccessPayload, pesquisaId: string, entrevistaId: string) {
    const tenantId = this.getTenantId(user);
    const query = new ObterEntrevistaDetalheQuery(tenantId, pesquisaId, entrevistaId);
    return this.queryBus.execute(query);
  }

  async criarDiscovery(user: JwtAccessPayload, payload: CriarDiscoveryPayload) {
    this.assertRequired(payload.demandaId, 'demandaId');
    this.assertRequired(payload.titulo, 'titulo');
    this.assertRequired(payload.descricao, 'descricao');
    this.assertRequired(payload.responsavelId, 'responsavelId');
    this.assertRequired(payload.produtoId, 'produtoId');

    const tenantId = this.getTenantId(user);

    const command = new CriarDiscoveryCommand(
      tenantId,
      payload.demandaId,
      payload.titulo,
      payload.descricao,
      user.sub,
      payload.responsavelId,
      payload.produtoId,
      payload.contexto,
      payload.publicoAfetado || [],
      payload.volumeImpactado,
      payload.severidade,
      payload.comoIdentificado || [],
    );

    const discoveryId = await this.commandBus.execute(command);
    return { id: discoveryId };
  }

  async atualizarDiscovery(
    user: JwtAccessPayload,
    discoveryId: string,
    payload: AtualizarDiscoveryPayload,
  ) {
    const tenantId = this.getTenantId(user);

    const command = new AtualizarDiscoveryCommand(
      tenantId,
      discoveryId,
      payload.titulo,
      payload.descricao,
      payload.contexto,
      payload.publicoAfetado,
      payload.volumeImpactado,
      payload.severidade,
      payload.comoIdentificado,
    );

    await this.commandBus.execute(command);
    return { message: 'Discovery atualizado com sucesso' };
  }

  async criarHipotese(user: JwtAccessPayload, discoveryId: string, payload: CriarHipotesePayload) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.titulo, 'titulo');
    this.assertRequired(payload.descricao, 'descricao');
    this.assertRequired(payload.comoValidar, 'comoValidar');

    const tenantId = this.getTenantId(user);

    const command = new CriarHipoteseCommand(
      tenantId,
      discoveryId,
      payload.titulo,
      payload.descricao,
      payload.comoValidar,
      payload.metricaAlvo,
      payload.impactoEsperado || 'MEDIO',
      payload.prioridade || 'MEDIA',
    );

    const hipoteseId = await this.commandBus.execute(command);
    return { id: hipoteseId };
  }

  async registrarPesquisa(
    user: JwtAccessPayload,
    discoveryId: string,
    payload: RegistrarPesquisaPayload,
  ) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.titulo, 'titulo');
    this.assertRequired(payload.metodo, 'metodo');
    this.assertRequired(payload.objetivo, 'objetivo');

    const tenantId = this.getTenantId(user);
    const totalParticipantes = payload.totalParticipantes ?? 0;

    if (totalParticipantes < 0) {
      throw new BadRequestException('totalParticipantes não pode ser negativo');
    }

    const command = new RegistrarPesquisaCommand(
      tenantId,
      discoveryId,
      payload.titulo,
      payload.metodo,
      payload.objetivo,
      payload.roteiroUrl,
      totalParticipantes,
    );

    const pesquisaId = await this.commandBus.execute(command);
    return { id: pesquisaId };
  }

  async adicionarEntrevista(
    user: JwtAccessPayload,
    pesquisaId: string,
    payload: AdicionarEntrevistaPayload,
  ) {
    this.assertRequired(pesquisaId, 'pesquisaId');
    this.assertRequired(payload.participanteNome, 'participanteNome');
    this.assertRequired(payload.dataHora, 'dataHora');

    const tenantId = this.getTenantId(user);
    const dataHora =
      payload.dataHora instanceof Date ? payload.dataHora : new Date(payload.dataHora);

    if (Number.isNaN(dataHora.getTime())) {
      throw new BadRequestException('dataHora inválida');
    }

    const command = new AdicionarEntrevistaCommand(
      tenantId,
      pesquisaId,
      payload.participanteNome,
      dataHora,
      payload.participantePerfil,
      payload.participanteEmail,
      payload.transcricao,
      payload.notas,
      payload.gravacaoUrl,
      payload.tags || [],
      payload.duracaoMinutos,
    );

    const entrevistaId = await this.commandBus.execute(command);
    return { id: entrevistaId };
  }

  async criarEvidencia(
    user: JwtAccessPayload,
    discoveryId: string,
    payload: CriarEvidenciaPayload,
  ) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.tipo, 'tipo');
    this.assertRequired(payload.titulo, 'titulo');
    this.assertRequired(payload.descricao, 'descricao');

    const tenantId = this.getTenantId(user);

    const command = new CriarEvidenciaCommand(
      tenantId,
      discoveryId,
      payload.hipoteseId,
      payload.tipo,
      payload.titulo,
      payload.descricao,
      payload.arquivoUrl,
      payload.tags || [],
    );

    const evidenciaId = await this.commandBus.execute(command);
    return { id: evidenciaId };
  }

  async gerarInsight(user: JwtAccessPayload, discoveryId: string, payload: GerarInsightPayload) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.descricao, 'descricao');

    const tenantId = this.getTenantId(user);

    const command = new GerarInsightCommand(
      tenantId,
      discoveryId,
      payload.entrevistaId,
      payload.descricao,
      payload.impacto || 'MEDIO',
      payload.confianca || 'MEDIA',
      payload.tags || [],
      payload.evidenciasIds || [],
    );

    const insightId = await this.commandBus.execute(command);
    return { id: insightId };
  }

  async iniciarExperimento(
    user: JwtAccessPayload,
    discoveryId: string,
    payload: IniciarExperimentoPayload,
  ) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.titulo, 'titulo');
    this.assertRequired(payload.descricao, 'descricao');
    this.assertRequired(payload.tipo, 'tipo');
    this.assertRequired(payload.metricaSucesso, 'metricaSucesso');

    const tenantId = this.getTenantId(user);

    const command = new IniciarExperimentoCommand(
      tenantId,
      discoveryId,
      payload.hipoteseId,
      payload.titulo,
      payload.descricao,
      payload.tipo,
      payload.metricaSucesso,
      payload.grupoControle,
      payload.grupoVariante,
    );

    const experimentoId = await this.commandBus.execute(command);
    return { id: experimentoId };
  }

  async finalizarDiscovery(
    user: JwtAccessPayload,
    discoveryId: string,
    payload: FinalizarDiscoveryPayload,
  ) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(payload.statusFinal, 'statusFinal');
    this.assertRequired(payload.resumo, 'resumo');

    const tenantId = this.getTenantId(user);

    const command = new FinalizarDiscoveryCommand(
      tenantId,
      discoveryId,
      payload.statusFinal,
      payload.resumo,
      user.sub,
      payload.aprendizados || [],
      payload.recomendacoes || [],
      payload.proximosPassos || [],
      payload.materiaisAnexos,
    );

    await this.commandBus.execute(command);
    return { message: 'Discovery finalizado com sucesso' };
  }

  async atualizarStatusHipotese(user: JwtAccessPayload, hipoteseId: string, status: string) {
    this.assertRequired(hipoteseId, 'hipoteseId');
    this.assertRequired(status, 'status');

    const tenantId = this.getTenantId(user);
    const command = new AtualizarStatusHipoteseCommand(tenantId, hipoteseId, status);

    await this.commandBus.execute(command);
    return { message: 'Status da hipótese atualizado com sucesso' };
  }

  async concluirExperimento(
    user: JwtAccessPayload,
    experimentoId: string,
    resultados: any,
    pValue?: number,
  ) {
    this.assertRequired(experimentoId, 'experimentoId');
    this.assertRequired(resultados, 'resultados');

    if (pValue !== undefined && (pValue < 0 || pValue > 1)) {
      throw new BadRequestException('pValue deve estar entre 0 e 1');
    }

    const tenantId = this.getTenantId(user);
    const command = new ConcluirExperimentoCommand(tenantId, experimentoId, resultados, pValue);

    await this.commandBus.execute(command);
    return { message: 'Experimento concluído com sucesso' };
  }

  async sugerirHipoteses(user: JwtAccessPayload, discoveryId: string) {
    this.assertRequired(discoveryId, 'discoveryId');
    const tenantId = this.getTenantId(user);
    return this.discoveryAiService.sugerirHipoteses(tenantId, discoveryId);
  }

  async correlacionarInsights(user: JwtAccessPayload, discoveryId: string, insightId: string) {
    this.assertRequired(discoveryId, 'discoveryId');
    this.assertRequired(insightId, 'insightId');
    const tenantId = this.getTenantId(user);
    return this.discoveryAiService.correlacionarInsights(tenantId, discoveryId, insightId);
  }

  async sugerirMvp(user: JwtAccessPayload, discoveryId: string) {
    this.assertRequired(discoveryId, 'discoveryId');
    const tenantId = this.getTenantId(user);
    return this.discoveryAiService.sugerirMvp(tenantId, discoveryId);
  }

  async gerarResumoExecutivo(user: JwtAccessPayload, discoveryId: string) {
    this.assertRequired(discoveryId, 'discoveryId');
    const tenantId = this.getTenantId(user);
    return this.discoveryAiService.gerarResumoExecutivo(tenantId, discoveryId);
  }

  async sintetizarEntrevistas(
    user: JwtAccessPayload,
    discoveryId: string,
    entrevistaIds?: string[],
  ) {
    this.assertRequired(discoveryId, 'discoveryId');
    const tenantId = this.getTenantId(user);
    return this.discoveryAiService.sintetizarEntrevistas(tenantId, discoveryId, entrevistaIds);
  }

  private assertRequired(value: unknown, fieldName: string): void {
    if (value === undefined || value === null) {
      throw new BadRequestException(`Campo ${fieldName} é obrigatório`);
    }

    if (typeof value === 'string' && value.trim() === '') {
      throw new BadRequestException(`Campo ${fieldName} é obrigatório`);
    }
  }

  private getTenantId(user: JwtAccessPayload): string {
    const tenantId = user.defaultTenantId || '';
    if (!tenantId) {
      throw new BadRequestException('Tenant não identificado no contexto da requisição');
    }
    return tenantId;
  }
}
