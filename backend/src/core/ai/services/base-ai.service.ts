import { Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { OpenAiService } from '@infra/ai/openai.service';

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: any,
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

export abstract class BaseAiService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly openAiService: OpenAiService) {}

  protected parseJsonResponse<T>(content: string): T {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error({
        msg: 'Falha ao converter resposta do OpenAI em JSON',
        content: content.substring(0, 500), // Limitar tamanho do log
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AiServiceError(
        'Resposta da IA em formato inválido. Tente novamente.',
        'INVALID_AI_RESPONSE',
        502,
        error,
      );
    }
  }

  protected handleAiError(error: any, context: string): never {
    const errorMessage = error?.message || 'Erro desconhecido ao processar requisição de IA';
    const errorCode = error?.code || 'AI_SERVICE_ERROR';

    this.logger.error({
      msg: `Erro em ${context}`,
      error: errorMessage,
      code: errorCode,
      stack: error?.stack,
    });

    // Mapear erros conhecidos do OpenAI/Gemini
    if (error?.status === 429 || error?.code === 'RATE_LIMIT_EXCEEDED') {
      // Usar mensagem amigável se disponível, senão usar padrão
      const message = error?.message?.includes('Limite de requisições')
        ? error.message
        : 'Limite de requisições da API de IA excedido. O Google Gemini tem limites de taxa por minuto/hora. Por favor, aguarde alguns minutos antes de tentar novamente.';
      throw new ServiceUnavailableException(message);
    }

    if (error?.status === 401 || error?.status === 403) {
      throw new ServiceUnavailableException(
        'Configuração de IA inválida. Contate o administrador.',
      );
    }

    if (error?.status >= 500) {
      throw new ServiceUnavailableException(
        'Serviço de IA temporariamente indisponível. Tente novamente mais tarde.',
      );
    }

    if (error instanceof AiServiceError) {
      throw error;
    }

    throw new BadRequestException(`Erro ao processar requisição de IA: ${errorMessage}`);
  }

  protected logAiRequest(context: string, metadata?: Record<string, any>) {
    this.logger.log({
      msg: `Iniciando requisição de IA: ${context}`,
      ...metadata,
    });
  }

  protected logAiResponse(context: string, usage?: any, metadata?: Record<string, any>) {
    this.logger.log({
      msg: `Requisição de IA concluída: ${context}`,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
      ...metadata,
    });
  }
}
