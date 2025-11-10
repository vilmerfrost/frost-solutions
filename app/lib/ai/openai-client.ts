// app/lib/clients/openai/openai-client.ts
import OpenAI from 'openai';
import type {
  IOpenAiClient,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiStreamChunk,
} from './openai.interface';
import { AiProviderError } from '@/lib/domain/ai/errors';
import { withRetry } from '@/lib/utils/retry';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OpenAiClient');

export class OpenAiClient implements IOpenAiClient {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(request: OpenAiChatRequest): Promise<OpenAiChatResponse> {
    logger.info('Creating chat completion', {
      model: request.model,
      messageCount: request.messages.length,
    });

    return withRetry(
      async () => {
        try {
          const response = await this.client.chat.completions.create({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens,
            stream: false,
          });

          logger.info('Chat completion created', {
            id: response.id,
            tokens: response.usage?.total_tokens,
          });

          return response as OpenAiChatResponse;
        } catch (error: any) {
          logger.error('OpenAI API error', error);
          throw new AiProviderError('OpenAI', error.message, {
            status: error.status,
            type: error.type,
          });
        }
      },
      {
        maxAttempts: 3,
        retryableErrors: (error) => {
          if (error instanceof AiProviderError) {
            const status = error.context?.status as number;
            // Retry on 429 (rate limit) and 5xx
            return status === 429 || (status >= 500 && status < 600);
          }
          return false;
        },
      }
    );
  }

  /**
   * Create streaming chat completion
   */
  async *createStreamingChatCompletion(
    request: OpenAiChatRequest
  ): AsyncIterable<OpenAiStreamChunk> {
    logger.info('Creating streaming chat completion', {
      model: request.model,
      messageCount: request.messages.length,
    });

    try {
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        yield chunk as OpenAiStreamChunk;
      }

      logger.info('Streaming completed');
    } catch (error: any) {
      logger.error('Streaming error', error);
      throw new AiProviderError('OpenAI', error.message);
    }
  }

  /**
   * Count tokens (approximate)
   */
  countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // For production, use tiktoken library
    return Math.ceil(text.length / 4);
  }
}

