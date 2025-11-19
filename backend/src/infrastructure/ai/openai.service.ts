import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '@config/env.config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
  model?: string;
  stop?: string[] | string;
}

export type ChatCompletionResult = {
  content: string;
  raw: any;
};

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly openAiClient?: OpenAI;
  private readonly geminiClient?: GoogleGenerativeAI;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultTemperature: number;
  private readonly provider: 'openai' | 'gemini' | 'none';

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const gptToken = configService.get('GPT_TOKEN', { infer: true });
    const geminiToken = configService.get('GEMINI_TOKEN', { infer: true });

    this.defaultModel = configService.get('GPT_MODEL', { infer: true }) || 'gpt-4-turbo-preview';
    this.defaultMaxTokens = configService.get('GPT_MAX_TOKENS', { infer: true });
    this.defaultTemperature = configService.get('GPT_TEMPERATURE', { infer: true });

    // Prioridade: Gemini > OpenAI > None
    if (geminiToken) {
      this.provider = 'gemini';
      this.geminiClient = new GoogleGenerativeAI(geminiToken);
      this.logger.log('Usando provedor de IA: Gemini');
    } else if (gptToken) {
      this.provider = 'openai';
      this.openAiClient = new OpenAI({ apiKey: gptToken });
      this.logger.log('Usando provedor de IA: OpenAI');
    } else {
      this.provider = 'none';
      this.logger.warn('Nenhum token de IA configurado (GPT_TOKEN ou GEMINI_TOKEN). Funcionalidades de IA desabilitadas.');
    }
  }

  async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    if (this.provider === 'none') {
      throw new Error('Provedor de IA não configurado.');
    }

    const startTime = Date.now();
    const modelName = options.model ?? this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxTokens = options.maxTokens ?? this.defaultMaxTokens;

    try {
      if (this.provider === 'gemini' && this.geminiClient) {
        return await this.callGemini(messages, {
          model: 'gemini-2.0-flash', 
          temperature,
          maxTokens,
          responseFormat: options.responseFormat,
        }, startTime);
      } else if (this.provider === 'openai' && this.openAiClient) {
        return await this.callOpenAI(messages, {
          model: modelName,
          temperature,
          maxTokens,
          responseFormat: options.responseFormat,
          stop: options.stop,
        }, startTime);
      }

      throw new Error('Cliente de IA não inicializado corretamente.');
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error({
        msg: 'AI completion failed',
        provider: this.provider,
        error: error?.message,
        status: error?.status,
        code: error?.code,
        duration,
      });
      throw error;
    }
  }

  private async callOpenAI(
    messages: ChatCompletionMessageParam[],
    options: any,
    startTime: number
  ): Promise<ChatCompletionResult> {
    const response = (await this.executeWithRetry(() =>
      this.openAiClient!.chat.completions.create({
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        response_format: options.responseFormat ? { type: options.responseFormat } : undefined,
        stop: options.stop,
      })
    )) as OpenAI.Chat.Completions.ChatCompletion;

    const [choice] = response.choices;
    if (!choice) throw new Error('Resposta da OpenAI sem choices.');

    this.logSuccess('openai', options.model, response.usage, startTime);

    return {
      content: choice.message.content ?? '',
      raw: response,
    };
  }

  private async callGemini(
    messages: ChatCompletionMessageParam[],
    options: any,
    startTime: number
  ): Promise<ChatCompletionResult> {
    const model = this.geminiClient!.getGenerativeModel({ 
      model: options.model || 'gemini-pro',
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
        responseMimeType: options.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
      }
    });

    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    let prompt = '';
    if (systemMessage && typeof systemMessage.content === 'string') {
      prompt += `INSTRUÇÕES DO SISTEMA: ${systemMessage.content}\n\n`;
    }

    for (const msg of userMessages) {
      const role = msg.role === 'user' ? 'Usuário' : 'Assistente';
      if (typeof msg.content === 'string') {
         prompt += `${role}: ${msg.content}\n`;
      }
    }
    
    prompt += `\nAssistente:`;

    const result = await this.executeWithRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();

    this.logSuccess('gemini', 'gemini-1.5-flash', undefined, startTime);

    return {
      content: text,
      raw: response,
    };
  }

  private logSuccess(provider: string, model: string, usage: any, startTime: number) {
    const duration = Date.now() - startTime;
    this.logger.log({
      msg: `${provider} completion successful`,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : 'usage-not-available-for-gemini-standard-response',
      model,
      duration,
    });
  }

  private async executeWithRetry<T>(executor: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await executor();
    } catch (error: any) {
      // Não fazer retry para erros de autenticação
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }

      // Para rate limit (429), usar backoff mais longo e menos tentativas
      const isRateLimit = error?.status === 429;
      const maxAttempts = isRateLimit ? 2 : 3;
      
      if (attempt >= maxAttempts) {
        if (isRateLimit) {
          // Transformar erro 429 em uma mensagem mais amigável
          const friendlyError = new Error(
            'Limite de requisições da API de IA excedido. Por favor, aguarde alguns minutos antes de tentar novamente. ' +
            'O Google Gemini tem limites de taxa de requisições por minuto/hora.',
          );
          (friendlyError as any).status = 429;
          (friendlyError as any).code = 'RATE_LIMIT_EXCEEDED';
          throw friendlyError;
        }
        throw error;
      }

      // Backoff exponencial: para 429, começar com delay maior
      const baseDelay = isRateLimit ? 5000 : 1000; // 5s para rate limit, 1s para outros
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), isRateLimit ? 30000 : 8000);
      
      this.logger.warn({
        msg: `Erro ao chamar IA (${this.provider}), tentando novamente`,
        attempt,
        maxAttempts,
        delay,
        isRateLimit,
        error: error?.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(executor, attempt + 1);
    }
  }
}
