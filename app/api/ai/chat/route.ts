// app/api/ai/chat/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { buildPrompt } from '@/lib/ai/prompt';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';

const BodySchema = z.object({
 conversationId: z.string().uuid().optional(),
 pageContext: z.string().default(''),
 pageData: z.record(z.unknown()).default({}),
 query: z.string().min(1),
 useCache: z.boolean().default(true),
});

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
 const tenantId = await getTenantId();
 if (!tenantId) {
  return new Response('Unauthorized', { status: 401 });
 }

 const body = BodySchema.parse(await req.json());
 const messages = buildPrompt(body.pageContext, body.pageData, body.query);
 const key = makeCacheKey(tenantId, messages);

 if (body.useCache) {
  const hit = await getCached(tenantId, key);
  if (hit) {
   return new Response(JSON.stringify({ cached: true, response: hit }), {
    headers: { 'Content-Type': 'application/json' },
   });
  }
 }

 // Streaming – exempel med OpenAI SSE (byt till provider ni används)
 const controller = new AbortController();

 const stream = new ReadableStream({
  async start(controllerStream) {
   try {
    // TODO: Replace with actual OpenAI/Claude streaming implementation
    const res = await fetch(process.env.LLM_STREAM_URL || 'https://api.openai.com/v1/chat/completions', {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY || process.env.OPENAI_API_KEY}`,
     },
     body: JSON.stringify({
      model: 'gpt-4',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
     }),
     signal: controller.signal,
    });

    if (!res.ok || !res.body) {
     throw new Error('LLM error');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    for (;;) {
     const { done, value } = await reader.read();
     if (done) break;

     const chunk = decoder.decode(value);
     const lines = chunk.split('\n');

     for (const line of lines) {
      if (line.startsWith('data: ')) {
       const data = line.slice(6);
       if (data === '[DONE]') {
        await setCached(tenantId, key, { text: fullText }, 3600);
        controllerStream.close();
        return;
       }
       
       try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
         fullText += content;
         controllerStream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
       } catch {
        // Skip invalid JSON
       }
      }
     }
    }
   } catch (e) {
    controllerStream.error(e);
   } finally {
    controllerStream.close();
   }
  },
  cancel() {
   controller.abort();
  },
 });

 return new Response(stream, {
  headers: {
   'Content-Type': 'text/event-stream; charset=utf-8',
   'Cache-Control': 'no-cache, no-transform',
   'Connection': 'keep-alive',
  },
 });
}
