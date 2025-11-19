import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseAiService } from '@core/ai/services';
import { OpenAiService } from '@infra/ai/openai.service';
import {
  buildDocumentacaoPrdPrompt,
  buildDocumentacaoRegrasNegocioPrompt,
  buildDocumentacaoConsistenciaPrompt,
  buildDocumentacaoCenariosPrompt,
  buildDocumentacaoGherkinPrompt,
  buildDocumentacaoReleaseNotesPrompt,
} from '@core/ai/prompts/documentacao.prompts';
import { DOCUMENTO_REPOSITORY_TOKEN, DocumentoRepository } from '@domain/documentacao';

type PrdDraftAiResponse = {
  objetivo: string;
  contexto: string;
  escopoFuncional: string[];
  requisitosNaoFuncionais: string[];
  regrasNegocio: string[];
  fluxos: string[];
  criteriosAceite: string[];
  riscos: string[];
};

type RegrasNegocioAiResponse = {
  regras: Array<{
    codigo: string;
    descricao: string;
    tipo: string;
  }>;
};

type ConsistenciaAiResponse = {
  inconsistencias: Array<{
    descricao: string;
    severidade: 'ALTA' | 'MEDIA' | 'BAIXA';
    impacto: string;
  }>;
};

type CenariosAiResponse = {
  cenarios: Array<{
    titulo: string;
    persona: string;
    narrativa: string;
  }>;
};

type GherkinAiResponse = {
  cenarios: Array<{
    titulo: string;
    steps: string[];
  }>;
};

type ReleaseNotesAiResponse = {
  novidades: string[];
  melhorias: string[];
  notasTecnicas: string[];
};

@Injectable()
export class DocumentacaoAiService extends BaseAiService {
  constructor(
    openAiService: OpenAiService,
    @Inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentoRepository: DocumentoRepository,
  ) {
    super(openAiService);
  }

  async gerarPrdDraft(tenantId: string, documentoId: string) {
    try {
      this.logAiRequest('gerarPrdDraft', { tenantId, documentoId });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const prompt = buildDocumentacaoPrdPrompt({
        titulo: documento.titulo,
        resumoExecutivo: documento.resumo ?? '',
        contexto: versaoJson.contexto?.problema ?? versaoJson.objetivo ?? '',
        objetivos: versaoJson.objetivo ? [versaoJson.objetivo] : [],
        requisitosFuncionais: versaoJson.requisitosFuncionais?.map((rf: any) => rf.descricao) ?? [],
        requisitosNaoFuncionais:
          versaoJson.requisitosNaoFuncionais?.map((rnf: any) => rnf.descricao) ?? [],
        riscos: versaoJson.riscos?.map((r: any) => r.descricao) ?? [],
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'Você é um Product Manager escrevendo PRDs. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.7, maxTokens: 2000 },
      );

      if (!content) {
        throw new Error('Falha ao gerar PRD draft: resposta vazia');
      }

      const result = this.parseJsonResponse<PrdDraftAiResponse>(content);
      this.logAiResponse('gerarPrdDraft', raw.usage, { documentoId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'gerarPrdDraft');
    }
  }

  async sugerirRegrasNegocio(tenantId: string, documentoId: string) {
    try {
      this.logAiRequest('sugerirRegrasNegocio', { tenantId, documentoId });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const descricao = [
        versaoJson.objetivo,
        versaoJson.contexto?.problema,
        versaoJson.contexto?.dados,
      ]
        .filter(Boolean)
        .join('\n\n');

      const eventosChave = versaoJson.fluxos?.descricao
        ? [versaoJson.fluxos.descricao]
        : (versaoJson.requisitosFuncionais?.map((rf: any) => rf.descricao) ?? []);

      const prompt = buildDocumentacaoRegrasNegocioPrompt({
        descricaoDocumento: descricao,
        eventosChave,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'Você é um analista de negócio. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.7, maxTokens: 1500 },
      );

      if (!content) {
        throw new Error('Falha ao sugerir regras de negócio: resposta vazia');
      }

      const result = this.parseJsonResponse<RegrasNegocioAiResponse>(content);
      this.logAiResponse('sugerirRegrasNegocio', raw.usage, { documentoId });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'sugerirRegrasNegocio');
    }
  }

  async verificarConsistencia(tenantId: string, documentoId: string) {
    try {
      this.logAiRequest('verificarConsistencia', { tenantId, documentoId });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const prd = JSON.stringify(versaoJson, null, 2);

      // Buscar outras versões ou documentos relacionados se necessário
      const versoes = await this.documentoRepository.listarVersoes(documentoId, tenantId);
      const rfc = versoes.length > 1 ? JSON.stringify(versoes[1].toJSON(), null, 2) : undefined;

      const prompt = buildDocumentacaoConsistenciaPrompt({
        prd,
        rfc,
        specs: undefined, // Pode ser expandido no futuro
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'Você é um auditor de documentação. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.5, maxTokens: 1500 },
      );

      if (!content) {
        throw new Error('Falha ao verificar consistência: resposta vazia');
      }

      const result = this.parseJsonResponse<ConsistenciaAiResponse>(content);
      this.logAiResponse('verificarConsistencia', raw.usage, {
        documentoId,
        inconsistencias: result.inconsistencias?.length || 0,
      });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'verificarConsistencia');
    }
  }

  async gerarCenarios(tenantId: string, documentoId: string) {
    try {
      this.logAiRequest('gerarCenarios', { tenantId, documentoId });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const objetivo = versaoJson.objetivo ?? '';
      const personas = versaoJson.contexto?.personas
        ? versaoJson.contexto.personas.split(',').map((p: string) => p.trim())
        : [];
      const fluxosPrincipais = versaoJson.fluxos?.descricao
        ? [versaoJson.fluxos.descricao]
        : (versaoJson.requisitosFuncionais?.map((rf: any) => rf.descricao) ?? []);

      const prompt = buildDocumentacaoCenariosPrompt({
        objetivo,
        personas,
        fluxosPrincipais,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'Você é um UX Writer. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.7, maxTokens: 1500 },
      );

      if (!content) {
        throw new Error('Falha ao gerar cenários: resposta vazia');
      }

      const result = this.parseJsonResponse<CenariosAiResponse>(content);
      this.logAiResponse('gerarCenarios', raw.usage, {
        documentoId,
        cenarios: result.cenarios?.length || 0,
      });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'gerarCenarios');
    }
  }

  async gerarCenariosGherkin(tenantId: string, documentoId: string) {
    try {
      this.logAiRequest('gerarCenariosGherkin', { tenantId, documentoId });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const feature = documento.titulo;
      const criteriosAceite = versaoJson.criteriosAceite?.map((ca: any) => ca.descricao) ?? [];

      if (criteriosAceite.length === 0) {
        throw new BadRequestException(
          'Documento não possui critérios de aceite para gerar cenários Gherkin',
        );
      }

      const prompt = buildDocumentacaoGherkinPrompt({
        feature,
        criteriosAceite,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content: 'Você é um QA engineer. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.7, maxTokens: 1500 },
      );

      if (!content) {
        throw new Error('Falha ao gerar cenários Gherkin: resposta vazia');
      }

      const result = this.parseJsonResponse<GherkinAiResponse>(content);
      this.logAiResponse('gerarCenariosGherkin', raw.usage, {
        documentoId,
        cenarios: result.cenarios?.length || 0,
      });
      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.handleAiError(error, 'gerarCenariosGherkin');
    }
  }

  async gerarReleaseNotes(tenantId: string, documentoId: string, releaseNome: string) {
    try {
      this.logAiRequest('gerarReleaseNotes', { tenantId, documentoId, releaseNome });

      const documento = await this.documentoRepository.encontrarPorId(tenantId, documentoId);
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      const versaoAtual = documento.versaoAtual;
      if (!versaoAtual) {
        throw new NotFoundException('Documento não possui versão atual');
      }

      const versaoJson = versaoAtual.toJSON();
      const entregas = versaoJson.requisitosFuncionais?.map((rf: any) => rf.descricao) ?? [];
      const notasTecnicas =
        versaoJson.requisitosNaoFuncionais?.map((rnf: any) => rnf.descricao) ?? [];

      const prompt = buildDocumentacaoReleaseNotesPrompt({
        releaseNome,
        entregas,
        notasTecnicas,
      });

      const { content, raw } = await this.openAiService.createChatCompletion(
        [
          {
            role: 'system',
            content:
              'Você é responsável por gerar release notes claras. Responda apenas em JSON válido.',
          },
          { role: 'user', content: prompt },
        ],
        { responseFormat: 'json_object', temperature: 0.7, maxTokens: 1500 },
      );

      if (!content) {
        throw new Error('Falha ao gerar release notes: resposta vazia');
      }

      try {
        const parsed = this.parseJsonResponse<ReleaseNotesAiResponse>(content);
        this.logAiResponse('gerarReleaseNotes', raw.usage, { documentoId, releaseNome });
        return parsed;
      } catch (error) {
        // Se não for JSON, retornar como texto simples
        this.logger.warn('Resposta de release notes não é JSON válido, retornando como texto');
        this.logAiResponse('gerarReleaseNotes', raw.usage, {
          documentoId,
          releaseNome,
          fallback: true,
        });
        return {
          novidades: [],
          melhorias: [],
          notasTecnicas: [content],
        };
      }
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleAiError(error, 'gerarReleaseNotes');
    }
  }
}
