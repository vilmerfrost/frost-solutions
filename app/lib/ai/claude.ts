// app/lib/ai/claude.ts
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function withTimeout<T>(p: Promise<T>, ms = 30_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Claude-timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function claudeJSON(
  model: 'claude-3-5-haiku-latest' | 'claude-3-5-sonnet-latest',
  system: string,
  userPrompt: string,
  maxTokens = 1024
): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('Saknar ANTHROPIC_API_KEY');
  }

  const res = await withTimeout(
    fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.2,
      }),
    })
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API fel ${res.status}: ${t.slice(0, 200)}…`);
  }

  const json = await res.json();
  const content = json?.content?.[0]?.text ?? '';

  try {
    return JSON.parse(content);
  } catch {
    // Om inte ren JSON, returnera text
    return { _raw: content };
  }
}

