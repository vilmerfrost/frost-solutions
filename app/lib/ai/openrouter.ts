const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 2;

export const MODELS = {
  DEFAULT: 'google/gemini-3.1-flash-lite-preview',
  OCR: 'google/gemini-3.1-flash-lite-preview',
} as const;

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface CallOptions {
  jsonMode?: boolean;
  maxTokens?: number;
  model?: string;
}

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options?: CallOptions
): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return callWithMessages(apiKey, messages, options);
}

export async function callOpenRouterVision(
  systemPrompt: string,
  textPrompt: string,
  imageBase64: string,
  options?: CallOptions & { mimeType?: string }
): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const mime = options?.mimeType || 'image/jpeg';

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: textPrompt },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
      ],
    },
  ];

  return callWithMessages(apiKey, messages, options);
}

async function callWithMessages(
  apiKey: string,
  messages: OpenRouterMessage[],
  options?: CallOptions
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }

    try {
      const body: Record<string, any> = {
        model: options?.model || MODELS.DEFAULT,
        messages,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: 0.3,
      };

      if (options?.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://frostsolutions.se',
          'X-Title': 'Frost Solutions',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? '';

      if (options?.jsonMode) {
        try {
          return JSON.parse(content);
        } catch {
          const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) return JSON.parse(match[1].trim());
          throw new Error('AI returned non-JSON response');
        }
      }

      return content;
    } catch (err: any) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
    }
  }

  throw lastError || new Error('OpenRouter request failed');
}
