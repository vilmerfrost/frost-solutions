// app/lib/services/ai.service.ts
import type { IOpenAiClient } from '@/lib/clients/openai/openai.interface';
import type {
  AiConversation,
  AiContext,
  AiMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AiAssistantRole,
} from '@/lib/domain/ai/types';
import { AiCacheService } from './ai-cache.service';
import { TokenLimitExceededError, ContextTooLargeError } from '@/lib/domain/ai/errors';
import { Result, ok, err } from '@/lib/utils/result';
import { createLogger } from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('AiService');

export interface IAiService {
  chat(request: ChatCompletionRequest, tenantId: string, userId: string): Promise<Result<ChatCompletionResponse, Error>>;
  streamChat(request: ChatCompletionRequest, tenantId: string, userId: string): AsyncIterable<string>;
  buildContext(tenantId: string, userId: string, contextType?: string): Promise<AiContext>;
}

export class AiService implements IAiService {
  private readonly MAX_TOKENS = 4096;
  private readonly MAX_CONTEXT_SIZE = 8000; // characters

  constructor(
    private readonly openai: IOpenAiClient,
    private readonly cache: AiCacheService
  ) {}

  /**
   * Chat completion with context injection
   */
  async chat(
    request: ChatCompletionRequest,
    tenantId: string,
    userId: string
  ): Promise<Result<ChatCompletionResponse, Error>> {
    logger.info('Processing chat request', {
      tenantId,
      userId,
      role: request.assistant_role,
    });

    try {
      // STEP 1: Build context
      const context = await this.buildContext(tenantId, userId, request.assistant_role);

      // STEP 2: Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(request.assistant_role, context);

      // STEP 3: Check cache
      const cacheKey = `${request.message}:${JSON.stringify(context)}`;
      const cached = await this.cache.get(cacheKey, tenantId);
      if (cached) {
        return ok({
          conversation_id: request.conversation_id || uuidv4(),
          message: {
            id: uuidv4(),
            role: 'assistant',
            content: cached,
            timestamp: new Date(),
          },
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            estimated_cost: 0,
          },
        });
      }

      // STEP 4: Validate token limits
      const estimatedTokens = this.openai.countTokens(systemPrompt + request.message);
      if (estimatedTokens > this.MAX_TOKENS) {
        return err(new TokenLimitExceededError(estimatedTokens, this.MAX_TOKENS));
      }

      // STEP 5: Call OpenAI
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = response.choices[0].message.content;

      // STEP 6: Cache response
      await this.cache.set(
        cacheKey,
        assistantMessage,
        response.usage.total_tokens,
        tenantId
      );

      // STEP 7: Calculate cost
      const estimatedCost = (response.usage.total_tokens / 1000) * 0.03; // $0.03 per 1K tokens

      logger.info('Chat completed', {
        tokens: response.usage.total_tokens,
        cost: estimatedCost,
      });

      return ok({
        conversation_id: request.conversation_id || uuidv4(),
        message: {
          id: uuidv4(),
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date(),
        },
        usage: {
          ...response.usage,
          estimated_cost: estimatedCost,
        },
      });
    } catch (error) {
      logger.error('Chat failed', error);
      return err(error as Error);
    }
  }

  /**
   * Streaming chat completion
   */
  async *streamChat(
    request: ChatCompletionRequest,
    tenantId: string,
    userId: string
  ): AsyncIterable<string> {
    logger.info('Starting streaming chat', { tenantId, userId });

    // Build context
    const context = await this.buildContext(tenantId, userId, request.assistant_role);
    const systemPrompt = this.buildSystemPrompt(request.assistant_role, context);

    // Stream from OpenAI
    const stream = this.openai.createStreamingChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        yield content;
      }
    }

    // Cache full response
    const cacheKey = `${request.message}:${JSON.stringify(context)}`;
    await this.cache.set(cacheKey, fullResponse, this.openai.countTokens(fullResponse), tenantId);

    logger.info('Streaming completed');
  }

  /**
   * Build AI context from business data
   * CRITICAL: Ensures multi-tenant security
   */
  async buildContext(
    tenantId: string,
    userId: string,
    contextType?: string
  ): Promise<AiContext> {
    logger.debug('Building AI context', { tenantId, userId, contextType });

    const context: AiContext = {
      tenant_id: tenantId,
      user_id: userId,
    };

    // TODO: Fetch actual business data with proper tenant isolation
    // This is where you inject project data, invoices, etc.
    // Placeholder context
    context.company_info = {
      name: 'Frost Solutions AB',
      industry: 'Construction',
    };

    // Validate context size
    const contextSize = JSON.stringify(context).length;
    if (contextSize > this.MAX_CONTEXT_SIZE) {
      logger.warn('Context too large, truncating', {
        size: contextSize,
        limit: this.MAX_CONTEXT_SIZE,
      });
      // TODO: Implement smart truncation
    }

    return context;
  }

  /**
   * Build system prompt based on role and context
   */
  private buildSystemPrompt(role: AiAssistantRole, context: AiContext): string {
    const basePrompt = `Du är en AI-assistent för ${context.company_info?.name || 'ett byggföretag'}.`;

    const rolePrompts: Record<AiAssistantRole, string> = {
      project_assistant: `${basePrompt} Du hjälper med projektplanering, budgetering och uppföljning.`,
      invoice_helper: `${basePrompt} Du hjälper med fakturor, betalningar och bokföring.`,
      cost_analyzer: `${basePrompt} Du analyserar kostnader och ger råd om kostnadsoptimering.`,
      general: `${basePrompt} Du svarar på allmänna frågor.`,
    };

    const prompt = rolePrompts[role];

    // Inject context
    const contextStr = JSON.stringify(context, null, 2);

    return `${prompt}
KONTEXT:
${contextStr}

Svara alltid på svenska. Var koncis och professionell.`;
  }
}

