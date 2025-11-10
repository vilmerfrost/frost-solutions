// app/lib/clients/openai/openai.interface.ts
export interface IOpenAiClient {
  /**
   * Create chat completion
   */
  createChatCompletion(request: OpenAiChatRequest): Promise<OpenAiChatResponse>;

  /**
   * Create streaming chat completion
   */
  createStreamingChatCompletion(request: OpenAiChatRequest): AsyncIterable<OpenAiStreamChunk>;

  /**
   * Count tokens in text
   */
  countTokens(text: string): number;
}

export interface OpenAiChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAiChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAiStreamChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

