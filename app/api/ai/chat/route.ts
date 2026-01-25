// app/api/ai/chat/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getTenantId } from '@/lib/serverTenant'
import { buildPrompt } from '@/lib/ai/prompt'
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache'
import { aiLogger as logger } from '@/lib/logger'
import { assertRateLimit } from '@/lib/rateLimit'

const BodySchema = z.object({
 conversationId: z.string().uuid().optional(),
 pageContext: z.string().default(''),
 pageData: z.record(z.string(), z.unknown()).default({}),
 query: z.string().min(1),
 useCache: z.boolean().default(true),
 model: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gemini-1.5-flash']).default('gpt-4'),
})

export const runtime = 'nodejs'

// Supported AI providers and their configurations
const AI_PROVIDERS = {
 openai: {
  url: 'https://api.openai.com/v1/chat/completions',
  getHeaders: () => ({
   'Content-Type': 'application/json',
   'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  }),
  models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
 },
 gemini: {
  url: 'https://generativelanguage.googleapis.com/v1beta/models',
  getHeaders: () => ({
   'Content-Type': 'application/json',
  }),
  models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
 },
}

async function streamOpenAI(
 messages: Array<{ role: string; content: string }>,
 model: string,
 signal: AbortSignal,
 onChunk: (content: string) => void
): Promise<string> {
 const apiKey = process.env.OPENAI_API_KEY
 if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not configured')
 }

 const res = await fetch(AI_PROVIDERS.openai.url, {
  method: 'POST',
  headers: AI_PROVIDERS.openai.getHeaders(),
  body: JSON.stringify({
   model,
   messages,
   stream: true,
   temperature: 0.7,
   max_tokens: 2048,
  }),
  signal,
 })

 if (!res.ok) {
  const error = await res.text()
  logger.error({ status: res.status, error }, 'OpenAI API error')
  throw new Error(`OpenAI API error: ${res.status}`)
 }

 if (!res.body) {
  throw new Error('No response body')
 }

 const reader = res.body.getReader()
 const decoder = new TextDecoder()
 let fullText = ''

 while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
   if (line.startsWith('data: ')) {
    const data = line.slice(6)
    if (data === '[DONE]') {
     return fullText
    }

    try {
     const parsed = JSON.parse(data)
     const content = parsed.choices?.[0]?.delta?.content || ''
     if (content) {
      fullText += content
      onChunk(content)
     }
    } catch {
     // Skip invalid JSON chunks
    }
   }
  }
 }

 return fullText
}

async function streamGemini(
 messages: Array<{ role: string; content: string }>,
 model: string,
 signal: AbortSignal,
 onChunk: (content: string) => void
): Promise<string> {
 const apiKey = process.env.GEMINI_API_KEY
 if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured')
 }

 // Convert messages to Gemini format
 const geminiContents = messages.map(m => ({
  role: m.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: m.content }],
 }))

 const res = await fetch(
  `${AI_PROVIDERS.gemini.url}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
  {
   method: 'POST',
   headers: AI_PROVIDERS.gemini.getHeaders(),
   body: JSON.stringify({
    contents: geminiContents,
    generationConfig: {
     temperature: 0.7,
     maxOutputTokens: 2048,
    },
   }),
   signal,
  }
 )

 if (!res.ok) {
  const error = await res.text()
  logger.error({ status: res.status, error }, 'Gemini API error')
  throw new Error(`Gemini API error: ${res.status}`)
 }

 if (!res.body) {
  throw new Error('No response body')
 }

 const reader = res.body.getReader()
 const decoder = new TextDecoder()
 let fullText = ''

 while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
   if (line.startsWith('data: ')) {
    try {
     const data = JSON.parse(line.slice(6))
     const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
     if (content) {
      fullText += content
      onChunk(content)
     }
    } catch {
     // Skip invalid JSON chunks
    }
   }
  }
 }

 return fullText
}

export async function POST(req: NextRequest) {
 const tenantId = await getTenantId()
 if (!tenantId) {
  return new Response('Unauthorized', { status: 401 })
 }

 // Rate limit: 5 requests per minute per tenant for AI chat
 try {
  await assertRateLimit(tenantId, '/api/ai/chat', 5)
 } catch (error: any) {
  if (error.name === 'RateLimitError') {
   return new Response(JSON.stringify({ error: 'För många förfrågningar. Försök igen om en minut.' }), {
    status: 429,
    headers: { 
     'Content-Type': 'application/json',
     'Retry-After': String(error.retryAfter || 60)
    },
   })
  }
  throw error
 }

 let body
 try {
  body = BodySchema.parse(await req.json())
 } catch (e: any) {
  logger.warn({ error: e.message }, 'Invalid request body')
  return new Response(JSON.stringify({ error: 'Invalid request' }), {
   status: 400,
   headers: { 'Content-Type': 'application/json' },
  })
 }

 const messages = buildPrompt(body.pageContext, body.pageData, body.query)
 const key = makeCacheKey(tenantId, messages)

 // Check cache
 if (body.useCache) {
  const hit = await getCached(tenantId, key)
  if (hit) {
   logger.debug({ tenantId }, 'Cache hit for AI chat')
   return new Response(JSON.stringify({ cached: true, response: hit }), {
    headers: { 'Content-Type': 'application/json' },
   })
  }
 }

 // Determine which provider to use
 const isGeminiModel = body.model.startsWith('gemini')
 const streamFn = isGeminiModel ? streamGemini : streamOpenAI

 logger.info({ tenantId, model: body.model, provider: isGeminiModel ? 'gemini' : 'openai' }, 'Starting AI chat stream')

 const controller = new AbortController()

 const stream = new ReadableStream({
  async start(controllerStream) {
   const encoder = new TextEncoder()
   let fullText = ''

   try {
    fullText = await streamFn(
     messages.map(m => ({ role: m.role, content: m.content })),
     body.model,
     controller.signal,
     (content) => {
      controllerStream.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
     }
    )

    // Cache the result
    if (fullText) {
     await setCached(tenantId, key, { text: fullText }, 3600)
     logger.debug({ tenantId, textLength: fullText.length }, 'AI chat completed and cached')
    }

    // Send done signal
    controllerStream.enqueue(encoder.encode('data: [DONE]\n\n'))
   } catch (e: any) {
    logger.error({ error: e.message, tenantId }, 'AI chat stream error')
    controllerStream.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`))
   } finally {
    controllerStream.close()
   }
  },
  cancel() {
   controller.abort()
  },
 })

 return new Response(stream, {
  headers: {
   'Content-Type': 'text/event-stream; charset=utf-8',
   'Cache-Control': 'no-cache, no-transform',
   'Connection': 'keep-alive',
   'X-Accel-Buffering': 'no',
  },
 })
}
