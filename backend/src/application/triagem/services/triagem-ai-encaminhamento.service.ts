import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import { BaseAiService } from '@core/ai/services';
import { OpenAiService } from '@infra/ai/openai.service';
import { buildTriagemEncaminhamentoPrompt } from '@core/ai/prompts/triagem.prompts';

type EncaminhamentoAiResponse = {
  acaoRecomendada: 'ENVIAR_DISCOVERY' | 'SOLICITAR_INFO' | 'ARQUIVAR' | 'VIRAR_EPICO' | 'AGUARDAR';
  justificativa: string;
  checklist: string[];
};

@Injectable()
export class TriagemAiEncaminhamentoService extends BaseAiService {
  constructor(
    openAiService: OpenAiService,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
  ) {
    super(openAiService);
  }

  async sugerirEncaminhamento(tenantId: string, demandaId: string) {
    try {
      this.logAiRequest('sugerirEncaminhamento', { tenantId, demandaId });

      const demanda = await this.demandaRepository.findById(tenantId, demandaId);
      if (!demanda) {
        throw new NotFoundException(`Demanda ${demandaId} não encontrada`);
      }

      const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
      if (!triagem) {
        throw new NotFoundException(`Triagem não encontrada para demanda ${demandaId}`);
      }

      const prompt = buildTriagemEncaminhamentoPrompt({
        demandaTitulo: demanda.titulo.getValue(),
        demandaDescricao: demanda.descricao ?? '',
        tipo: demanda.tipo.slug,
        origem: demanda.origem.slug,
        impacto: triagem.impacto?.value,
        urgencia: triagem.urgencia?.value,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é um Product Manager sênior. Analise as demandas e entregue recomendações em JSON válido.',
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

      const result = this.parseJsonResponse<EncaminhamentoAiResponse>(content);
      this.logAiResponse('sugerirEncaminhamento', raw.usage, { demandaId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirEncaminhamento');
    }
  }
}
