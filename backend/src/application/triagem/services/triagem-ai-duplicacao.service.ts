import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import { DeteccaoDuplicataService } from '@domain/triagem/services/deteccao-duplicata.service';
import { BaseAiService } from '@core/ai/services';
import { OpenAiService } from '@infra/ai/openai.service';
import { buildTriagemDuplicacaoPrompt } from '@core/ai/prompts/triagem.prompts';
import { Demanda } from '@domain/demandas';

type DuplicataSugestao = {
  id: string;
  similaridade: number;
  justificativa: string;
};

type DuplicataAiResponse = {
  duplicatas: DuplicataSugestao[];
};

@Injectable()
export class TriagemAiDuplicacaoService extends BaseAiService {
  constructor(
    openAiService: OpenAiService,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    private readonly deteccaoDuplicataService: DeteccaoDuplicataService,
  ) {
    super(openAiService);
  }

  async sugerirDuplicatas(tenantId: string, demandaId: string) {
    try {
      this.logAiRequest('sugerirDuplicatas', { tenantId, demandaId });

      const demanda = await this.demandaRepository.findById(tenantId, demandaId);
      if (!demanda) {
        throw new NotFoundException(`Demanda ${demandaId} não encontrada`);
      }

      const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
      if (!triagem) {
        throw new NotFoundException(`Triagem da demanda ${demandaId} não encontrada`);
      }

      const similares = await this.buscarCandidatas(tenantId, demanda);
      if (similares.length === 0) {
        this.logAiResponse('sugerirDuplicatas', undefined, { demandaId, candidatas: 0 });
        return [];
      }

      const prompt = buildTriagemDuplicacaoPrompt({
        demandaTitulo: demanda.titulo.getValue(),
        demandaDescricao: demanda.descricao ?? '',
        candidatos: similares.map((item) => ({
          id: item.demanda.id ?? '',
          titulo: item.demanda.titulo.getValue(),
          descricao: item.demanda.descricao ?? '',
        })),
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é um assistente de triagem de demandas de produto. Sempre retorne JSON válido de acordo com as instruções.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          responseFormat: 'json_object',
        },
      );

      const parsed = this.parseJsonResponse<DuplicataAiResponse>(content);
      const resultado = parsed.duplicatas ?? [];

      const final = resultado
        .map((item) => {
          const candidata = similares.find((similar) => similar.demanda.id === item.id);
          if (!candidata) {
            return null;
          }

          return {
            id: candidata.demanda.id ?? '',
            titulo: candidata.demanda.titulo.getValue(),
            descricao: candidata.demanda.descricao ?? '',
            similaridadeCalculada: candidata.similaridade,
            similaridadeIa: item.similaridade,
            justificativa: item.justificativa,
            tipo: candidata.demanda.tipo.slug,
            origem: candidata.demanda.origem.slug,
            status: candidata.demanda.status.slug,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      this.logAiResponse('sugerirDuplicatas', raw.usage, { demandaId, duplicatas: final.length });
      return final;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirDuplicatas');
    }
  }

  private async buscarCandidatas(tenantId: string, demanda: Demanda) {
    const resultado = await this.demandaRepository.findAll(tenantId, {
      status: ['NOVO', 'RASCUNHO', 'TRIAGEM', 'AGUARDANDO_INFO'],
      page: 1,
      pageSize: 200,
    });

    return resultado.data
      .filter((item) => item.id !== demanda.id)
      .map((comparador) => ({
        demanda: comparador,
        similaridade: this.deteccaoDuplicataService.calcularSimilaridade(demanda, comparador),
      }))
      .filter((item) => item.similaridade >= 30)
      .sort((a, b) => b.similaridade - a.similaridade)
      .slice(0, 10);
  }
}
