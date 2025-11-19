import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BaseAiService } from '@core/ai/services';
import { OpenAiService } from '@infra/ai/openai.service';
import {
  buildPlanejamentoPrioridadePrompt,
  buildPlanejamentoHealthScorePrompt,
  buildPlanejamentoDependenciasPrompt,
  buildPlanejamentoRoadmapDraftPrompt,
} from '@core/ai/prompts/planejamento.prompts';
import {
  IPlanejamentoEpicoRepository,
  IPlanejamentoFeatureRepository,
  IPlanejamentoDependenciaRepository,
  IPlanejamentoCapacityRepository,
  IPlanejamentoCommitmentRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { Feature } from '@domain/planejamento/entities';

type PrioridadeAiResponse = {
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  justificativa: string;
  alertas: string[];
};

type HealthScoreAiResponse = {
  health: 'GREEN' | 'YELLOW' | 'RED';
  justificativa: string;
  proximosPassos: string[];
};

type DependenciasAiResponse = {
  dependenciasSugeridas: Array<{
    idFeature: string;
    tipo: 'HARD' | 'SOFT' | 'RECURSO';
    risco: 'ALTO' | 'MEDIO' | 'BAIXO';
    justificativa: string;
  }>;
};

type RoadmapAiResponse = {
  committed: string[];
  targeted: string[];
  aspirational: string[];
  comentarios: string;
};

@Injectable()
export class PlanejamentoAiService extends BaseAiService {
  constructor(
    openAiService: OpenAiService,
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
    @Inject(PLANEJAMENTO_FEATURE_REPOSITORY_TOKEN)
    private readonly featureRepository: IPlanejamentoFeatureRepository,
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
    @Inject(PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN)
    private readonly capacityRepository: IPlanejamentoCapacityRepository,
    @Inject(PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN)
    private readonly commitmentRepository: IPlanejamentoCommitmentRepository,
  ) {
    super(openAiService);
  }

  async sugerirPrioridade(tenantId: string, epicoId: string) {
    try {
      this.logAiRequest('sugerirPrioridade', { tenantId, epicoId });

      const epico = await this.epicoRepository.findById(epicoId, tenantId);
      if (!epico) {
        throw new NotFoundException('Épico não encontrado');
      }

      const features = await this.featureRepository.listByEpico(epicoId, tenantId);
      const prompt = buildPlanejamentoPrioridadePrompt({
        epico: {
          titulo: epico.titulo,
          impacto: epico.toObject().objetivo ?? epico.toObject().valueProposition,
          status: epico.status.getValue(),
          health: epico.health.getValue(),
          effort: this.calcularEsforco(features),
        },
        historico: features.map((feature) => {
          const objeto = feature.toObject();
          return `${objeto.titulo} - status ${objeto.status} (${objeto.pontos ?? 0} pts)`;
        }),
        contextoOrganizacional: epico.toObject().descricao ?? '',
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é um CPO avaliando priorização de épicos. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const result = this.parseJsonResponse<PrioridadeAiResponse>(content);
      this.logAiResponse('sugerirPrioridade', raw.usage, { epicoId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirPrioridade');
    }
  }

  async calcularHealthScore(tenantId: string, epicoId: string) {
    try {
      this.logAiRequest('calcularHealthScore', { tenantId, epicoId });

      const epico = await this.epicoRepository.findById(epicoId, tenantId);
      if (!epico) {
        throw new NotFoundException('Épico não encontrado');
      }

      const features = await this.featureRepository.listByEpico(epicoId, tenantId);
      const dependencias = await this.dependenciaRepository.listAll({ tenantId, epicoId });

      const indicadores: Record<string, string | number> = {
        progressoPercentual: epico.toObject().progressPercent ?? 0,
        totalFeatures: features.length,
        featuresBloqueadas: dependencias.length,
      };

      const prompt = buildPlanejamentoHealthScorePrompt({
        epicoTitulo: epico.titulo,
        indicadores,
        dependenciasCriticas: dependencias
          .filter((dependencia) => dependencia.toObject().tipo.getValue() === 'HARD')
          .map((dependencia) => dependencia.toObject().featureBloqueadoraId ?? ''),
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você avalia health score de épicos considerando risco e capacidade. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const result = this.parseJsonResponse<HealthScoreAiResponse>(content);
      this.logAiResponse('calcularHealthScore', raw.usage, { epicoId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'calcularHealthScore');
    }
  }

  async sugerirDependencias(tenantId: string, featureId: string) {
    try {
      this.logAiRequest('sugerirDependencias', { tenantId, featureId });

      const feature = await this.featureRepository.findById(featureId, tenantId);
      if (!feature) {
        throw new NotFoundException('Feature não encontrada');
      }

      const featureObj = feature.toObject();
      const candidatas = await this.featureRepository.list({
        tenantId,
        epicoId: featureObj.epicoId,
        page: 1,
        pageSize: 50,
      });

      const prompt = buildPlanejamentoDependenciasPrompt({
        featureTitulo: featureObj.titulo,
        descricao: featureObj.descricao ?? '',
        featuresRelacionadas: candidatas.data
          .filter((item) => item.id !== featureId)
          .map((item) => {
            const itemObj = typeof item === 'object' && 'toObject' in item ? item.toObject() : item;
            return {
              id: itemObj.id ?? '',
              titulo: itemObj.titulo ?? '',
              descricao: itemObj.descricao ?? '',
            };
          }),
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é um Tech Lead analisando dependências técnicas. Forneça somente JSON válido conforme instruções.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const result = this.parseJsonResponse<DependenciasAiResponse>(content);
      this.logAiResponse('sugerirDependencias', raw.usage, { featureId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirDependencias');
    }
  }

  async gerarRoadmapDraft(tenantId: string, quarter: string) {
    try {
      this.logAiRequest('gerarRoadmapDraft', { tenantId, quarter });

      const epicos = await this.epicoRepository.list({
        tenantId,
        quarter,
        page: 1,
        pageSize: 200,
      });

      const capacidades = await this.capacityRepository.listByQuarter(tenantId, quarter);
      const commits = await this.commitmentRepository.listAll({ tenantId, quarter });

      const prompt = buildPlanejamentoRoadmapDraftPrompt({
        quarter,
        epicos: epicos.data.map((epico) => ({
          titulo: epico.titulo,
          status: epico.status.getValue(),
          health: epico.health.getValue(),
        })),
        capacidade: capacidades.map((snapshot) => {
          const obj = snapshot.toObject();
          return {
            squad: obj.squadId,
            capacidade: obj.capacidadeTotal,
            utilizada: obj.capacidadeUsada,
          };
        }),
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você elabora drafts de roadmap equilibrando capacidade e commitments. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object' },
      );

      const parsed = this.parseJsonResponse<RoadmapAiResponse>(content);
      const result = {
        ...parsed,
        contextoAtual: commits.map((commitment) => {
          const commitObj = commitment.toPersistence();
          return {
            id: commitObj.id,
            quarter: commitObj.quarter.getValue(),
            itens: commitObj.itens,
          };
        }),
      };
      this.logAiResponse('gerarRoadmapDraft', raw.usage, { quarter, epicos: epicos.data.length });
      return result;
    } catch (error: any) {
      this.handleAiError(error, 'gerarRoadmapDraft');
    }
  }

  private calcularEsforco(features: Feature[]): number {
    return features.reduce((acc: number, feature: Feature) => {
      const obj = feature.toObject();
      return acc + (obj.pontos ?? 0);
    }, 0);
  }
}
