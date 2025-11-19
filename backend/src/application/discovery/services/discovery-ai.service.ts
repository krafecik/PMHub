import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BaseAiService } from '@core/ai/services';
import { OpenAiService } from '@infra/ai/openai.service';
import {
  buildDiscoveryHipotesesPrompt,
  buildDiscoveryCorrelacaoPrompt,
  buildDiscoveryMvpPrompt,
  buildDiscoveryResumoExecutivoPrompt,
} from '@core/ai/prompts/discovery.prompts';
import {
  IDiscoveryRepository,
  IHipoteseRepository,
  IInsightRepository,
  IPesquisaRepository,
  IEntrevistaRepository,
} from '@domain/discovery/repositories';
import { TenantId } from '@domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId, InsightId, PesquisaId } from '@domain/discovery/value-objects';
import { Pesquisa } from '@domain/discovery/entities/pesquisa.entity';

type HipoteseIaSugestao = {
  titulo: string;
  descricao: string;
  impactoEsperado: string;
  comoValidar: string;
  prioridade: string;
};

type CorrelacaoIaResponse = {
  correlacoes: Array<{
    id: string;
    grauCorrelacao: number;
    comentario: string;
  }>;
};

type MvpIaResponse = {
  mvps: Array<{
    nome: string;
    descricao: string;
    hipotesesAlvo: string[];
    metricas: string[];
  }>;
};

type HipotesesIaResponse = {
  hipoteses: HipoteseIaSugestao[];
};

type ResumoExecutivoIaPayload = {
  problema: string;
  principaisInsights: string[];
  hipotesesValidadas: string[];
  recomendacoes: string[];
};

@Injectable()
export class DiscoveryAiService extends BaseAiService {
  constructor(
    openAiService: OpenAiService,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IPesquisaRepository')
    private readonly pesquisaRepository: IPesquisaRepository,
    @Inject('IEntrevistaRepository')
    private readonly entrevistaRepository: IEntrevistaRepository,
  ) {
    super(openAiService);
  }

  async sugerirHipoteses(tenantId: string, discoveryId: string) {
    try {
      this.logAiRequest('sugerirHipoteses', { tenantId, discoveryId });

      const [discovery, insights] = await Promise.all([
        this.discoveryRepository.findById(new TenantId(tenantId), new DiscoveryId(discoveryId)),
        this.insightRepository.findByDiscovery(
          new TenantId(tenantId),
          new DiscoveryId(discoveryId),
        ),
      ]);

      if (!discovery) {
        throw new NotFoundException('Discovery não encontrado para geração de hipóteses.');
      }

      const principaisInsights = insights
        .sort((a, b) => (b.getRelevanceScore?.() ?? 0) - (a.getRelevanceScore?.() ?? 0))
        .slice(0, 8)
        .map((insight) => ({
          id: insight.id?.getValue() ?? '',
          descricao: this.truncate(insight.descricao, 400),
          impacto: insight.impacto.getLabel(),
          confianca: insight.confianca.getLabel(),
        }));

      const prompt = buildDiscoveryHipotesesPrompt({
        problema: this.composeProblema(discovery.descricao, discovery.contexto),
        insights: principaisInsights,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é um PM sênior conduzindo discovery. Gere hipóteses testáveis e retorne JSON válido conforme solicitado.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const parsed = this.parseJsonResponse<HipotesesIaResponse>(content);
      const result = parsed.hipoteses ?? [];
      this.logAiResponse('sugerirHipoteses', raw.usage, { discoveryId, hipoteses: result.length });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirHipoteses');
    }
  }

  async correlacionarInsights(tenantId: string, discoveryId: string, insightId: string) {
    try {
      this.logAiRequest('correlacionarInsights', { tenantId, discoveryId, insightId });

      const [principal, insights] = await Promise.all([
        this.insightRepository.findById(new TenantId(tenantId), new InsightId(insightId)),
        this.insightRepository.findByDiscovery(
          new TenantId(tenantId),
          new DiscoveryId(discoveryId),
        ),
      ]);

      if (!principal) {
        throw new NotFoundException('Insight principal não encontrado.');
      }

      const outros = insights
        .filter((insight) => insight.id?.getValue() !== insightId)
        .slice(0, 10);

      const prompt = buildDiscoveryCorrelacaoPrompt({
        insightPrincipal: this.truncate(principal.descricao, 800),
        outrosInsights: outros.map((item) => ({
          id: item.id?.getValue() ?? '',
          descricao: this.truncate(item.descricao, 400),
        })),
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você analisa insights de discovery e identifica correlações. Sempre responda com JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const parsed = this.parseJsonResponse<CorrelacaoIaResponse>(content);
      const result = parsed.correlacoes ?? [];
      this.logAiResponse('correlacionarInsights', raw.usage, {
        discoveryId,
        insightId,
        correlacoes: result.length,
      });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'correlacionarInsights');
    }
  }

  async sugerirMvp(tenantId: string, discoveryId: string) {
    try {
      this.logAiRequest('sugerirMvp', { tenantId, discoveryId });

      const [discovery, hipoteses] = await Promise.all([
        this.discoveryRepository.findById(new TenantId(tenantId), new DiscoveryId(discoveryId)),
        this.hipoteseRepository.findByDiscovery(
          new TenantId(tenantId),
          new DiscoveryId(discoveryId),
        ),
      ]);

      if (!discovery) {
        throw new NotFoundException('Discovery não encontrado para sugestão de MVP.');
      }

      const prompt = buildDiscoveryMvpPrompt({
        problema: this.composeProblema(discovery.descricao, discovery.contexto),
        hipoteses: hipoteses.map((hipotese) => ({
          titulo: this.truncate(hipotese.titulo, 120),
          status: hipotese.status.getLabel(),
        })),
        restricoes: discovery.comoIdentificado,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é especialista em experimentação. Crie sugestões concretas de MVPs em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const parsed = this.parseJsonResponse<MvpIaResponse>(content);
      const result = parsed.mvps ?? [];
      this.logAiResponse('sugerirMvp', raw.usage, { discoveryId, mvps: result.length });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirMvp');
    }
  }

  async gerarResumoExecutivo(tenantId: string, discoveryId: string) {
    const [discovery, hipoteses, insights] = await Promise.all([
      this.discoveryRepository.findById(new TenantId(tenantId), new DiscoveryId(discoveryId)),
      this.hipoteseRepository.findByDiscovery(new TenantId(tenantId), new DiscoveryId(discoveryId)),
      this.insightRepository.findByDiscovery(new TenantId(tenantId), new DiscoveryId(discoveryId)),
    ]);

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado para resumo executivo.');
    }

    const payload: ResumoExecutivoIaPayload = {
      problema: this.composeProblema(discovery.descricao, discovery.contexto),
      principaisInsights: insights
        .sort((a, b) => (b.getRelevanceScore?.() ?? 0) - (a.getRelevanceScore?.() ?? 0))
        .slice(0, 6)
        .map((insight) => this.truncate(insight.descricao, 200)),
      hipotesesValidadas: hipoteses
        .filter((hipotese) => hipotese.status.isSuccess?.() ?? false)
        .map((hipotese) => this.truncate(hipotese.titulo, 140)),
      recomendacoes: hipoteses
        .filter((hipotese) => hipotese.status.isActive?.() ?? false)
        .slice(0, 3)
        .map((hipotese) => `Priorizar análise adicional da hipótese "${hipotese.titulo}".`),
    };

    const prompt = buildDiscoveryResumoExecutivoPrompt(payload);

    const { content } = await this.openAiService.createChatCompletion([
      {
        role: 'system',
        content: 'Você produz resumos executivos concisos e acionáveis. Responda apenas com texto.',
      },
      { role: 'user', content: prompt },
    ]);

    return content.trim();
  }

  async sintetizarEntrevistas(tenantId: string, discoveryId: string, entrevistaIds?: string[]) {
    const pesquisas = await this.pesquisaRepository.findByDiscovery(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    const entrevistas = await this.coletarEntrevistas(tenantId, pesquisas, entrevistaIds ?? []);

    if (entrevistas.length === 0) {
      throw new NotFoundException('Nenhuma entrevista encontrada para sintetizar.');
    }

    const resumoInput = entrevistas
      .map(
        (entrevista, index) =>
          `${index + 1}. Participante: ${entrevista.participanteNome ?? 'N/A'}\nNotas: ${this.truncate(
            entrevista.notas ?? entrevista.transcricao ?? '',
            600,
          )}`,
      )
      .join('\n\n');

    const { content } = await this.openAiService.createChatCompletion([
      {
        role: 'system',
        content:
          'Você sintetiza entrevistas de discovery, destacando dores, necessidades e oportunidades. Estruture a resposta em tópicos.',
      },
      {
        role: 'user',
        content: `A seguir estão trechos de entrevistas com clientes:\n\n${resumoInput}\n\nResuma os principais pontos em até 5 bullets, destacando dores, motivações e citações relevantes.`,
      },
    ]);

    return content.trim();
  }

  private composeProblema(descricao: string, contexto?: string | null) {
    return `${this.truncate(descricao, 800)}${
      contexto ? `\nContexto adicional: ${this.truncate(contexto, 400)}` : ''
    }`;
  }

  private truncate(value: string | null | undefined, limit: number) {
    if (!value) return '';
    if (value.length <= limit) return value;
    return `${value.slice(0, limit)}…`;
  }

  private async coletarEntrevistas(
    tenantId: string,
    pesquisas: Pesquisa[],
    entrevistaIds: string[],
  ) {
    const entrevistas: Array<{
      id: string;
      participanteNome?: string;
      transcricao?: string | null;
      notas?: string | null;
    }> = [];

    const idsSet = new Set(entrevistaIds);

    for (const pesquisa of pesquisas) {
      const pesquisaId = pesquisa.id?.getValue();
      if (!pesquisaId) {
        continue;
      }

      const registros = await this.entrevistaRepository.findByPesquisa(
        new TenantId(tenantId),
        new PesquisaId(pesquisaId),
      );

      registros.forEach((entrevista) => {
        const id = entrevista.id?.getValue();
        if (!id) return;
        if (idsSet.size > 0 && !idsSet.has(id)) {
          return;
        }

        entrevistas.push({
          id,
          participanteNome: entrevista.participanteNome ?? undefined,
          transcricao: entrevista.transcricao ?? null,
          notas: entrevista.notas ?? null,
        });
      });
    }

    return entrevistas.slice(0, 10);
  }
}
