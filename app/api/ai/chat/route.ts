import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getTenantId } from '@/lib/serverTenant'
import { buildPrompt, buildMinimalPrompt, type BusinessContext } from '@/lib/ai/prompt'
import { aiLogger as logger } from '@/lib/logger'
import { assertRateLimit } from '@/lib/rateLimit'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { CHAT_TOOLS, executeTool } from '@/lib/ai/chat-tools'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'google/gemini-3.1-flash-lite-preview'
const MAX_TOOL_ROUNDS = 3

const BodySchema = z.object({
  conversationId: z.string().uuid().nullish(),
  pageContext: z.string().default(''),
  pageData: z.record(z.string(), z.unknown()).default({}),
  query: z.string().min(1),
})

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Business context (unchanged from v1 — fetches lightweight tenant snapshot)
// ---------------------------------------------------------------------------

async function buildBusinessContext(
  tenantId: string,
  userId: string
): Promise<BusinessContext | null> {
  try {
    const admin = createAdminClient(10_000)

    const [userResult, projectsResult, timeEntriesResult, invoicesResult, workOrdersResult] =
      await Promise.all([
        admin
          .from('employees')
          .select('name, role')
          .eq('tenant_id', tenantId)
          .eq('auth_user_id', userId)
          .maybeSingle(),
        admin
          .from('projects')
          .select('id, name, status, budget')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
        admin
          .from('time_entries')
          .select('hours_total, approval_status, date')
          .eq('tenant_id', tenantId)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        admin.from('invoices').select('total_amount, status').eq('tenant_id', tenantId).neq('status', 'paid'),
        admin
          .from('work_orders')
          .select('status, assigned_to')
          .eq('tenant_id', tenantId)
          .in('status', ['new', 'assigned', 'in_progress']),
      ])

    const timeEntries = timeEntriesResult.data ?? []
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)

    const totalHours = timeEntries.reduce((s, e) => s + (Number(e.hours_total) || 0), 0)
    const thisWeekHours = timeEntries
      .filter((e) => new Date(e.date) >= startOfWeek)
      .reduce((s, e) => s + (Number(e.hours_total) || 0), 0)
    const pendingApproval = timeEntries.filter((e) => e.approval_status === 'pending').length

    const invoices = invoicesResult.data ?? []
    const workOrders = workOrdersResult.data ?? []

    return {
      user: { name: userResult.data?.name || 'Användare', role: userResult.data?.role || 'employee' },
      activeProjects: (projectsResult.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        budget: p.budget,
      })),
      recentTimeEntries: { totalHours, thisWeek: thisWeekHours, pendingApproval },
      invoices: {
        unpaidCount: invoices.length,
        totalUnpaid: invoices.reduce((s, inv) => s + (Number(inv.total_amount) || 0), 0),
      },
      workOrders: {
        pendingCount: workOrders.filter((wo) => wo.status === 'new' || wo.status === 'assigned').length,
        assignedToMe: workOrders.filter((wo) => wo.assigned_to === userId).length,
      },
    }
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to build business context')
    return null
  }
}

// ---------------------------------------------------------------------------
// OpenRouter streaming (OpenAI-compatible format)
// ---------------------------------------------------------------------------

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface StreamResult {
  text: string
  toolCalls: ToolCall[]
}

async function streamOpenRouter(
  messages: Array<Record<string, unknown>>,
  signal: AbortSignal,
  onChunk?: (content: string) => void
): Promise<StreamResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured')

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://frostsolutions.se',
      'X-Title': 'Frost Solutions',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      tools: CHAT_TOOLS,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal,
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${errorBody}`)
  }
  if (!res.body) throw new Error('No response body from OpenRouter')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  const toolCallMap = new Map<number, ToolCall>()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
      try {
        const data = JSON.parse(line.slice(6))
        const delta = data.choices?.[0]?.delta

        if (delta?.content) {
          fullText += delta.content
          onChunk?.(delta.content)
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx: number = tc.index ?? 0
            const existing = toolCallMap.get(idx)
            if (!existing) {
              toolCallMap.set(idx, {
                id: tc.id || `call_${idx}`,
                type: 'function',
                function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
              })
            } else {
              if (tc.function?.arguments) existing.function.arguments += tc.function.arguments
              if (tc.function?.name) existing.function.name = tc.function.name
              if (tc.id) existing.id = tc.id
            }
          }
        }
      } catch {
        // malformed SSE chunk — skip
      }
    }
  }

  return { text: fullText, toolCalls: Array.from(toolCallMap.values()) }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId()
  if (!tenantId) return new Response('Unauthorized', { status: 401 })

  let userId: string | null = null
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    // continue without user
  }

  // Rate limit: 10 req / min / tenant
  try {
    await assertRateLimit(tenantId, '/api/ai/chat', 10)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'RateLimitError') {
      return new Response(
        JSON.stringify({ error: 'För många förfrågningar. Försök igen om en minut.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }
    throw error
  }

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // --- Build business context (with 10 s timeout) ---
  let businessContext: BusinessContext | null = null
  if (userId) {
    try {
      businessContext = await Promise.race([
        buildBusinessContext(tenantId, userId),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
      ])
    } catch {
      // proceed without context
    }
  }

  // --- Load conversation history ---
  let history: Array<{ role: string; content: string }> = []
  if (body.conversationId) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', body.conversationId)
        .order('created_at', { ascending: true })
        .limit(20)
      history = (data ?? []).map((m) => ({ role: m.role, content: m.content }))
    } catch {
      // proceed without history
    }
  }

  // --- Assemble messages ---
  const promptMsgs = businessContext
    ? buildPrompt(body.pageContext, body.pageData, body.query, businessContext)
    : buildMinimalPrompt(body.query)

  const messages: Array<Record<string, unknown>> = [
    { role: promptMsgs[0].role, content: promptMsgs[0].content },
    ...history,
    { role: promptMsgs[1].role, content: promptMsgs[1].content },
  ]

  // --- Stream with tool-call loop ---
  const abortCtrl = new AbortController()
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        let finalText = ''

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const result = await streamOpenRouter(messages, abortCtrl.signal, (content) => {
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ content })}\n\n`))
          })

          if (result.toolCalls.length === 0) {
            finalText = result.text
            break
          }

          // Notify frontend that tools are being executed
          const toolNames = result.toolCalls.map((tc) => tc.function.name)
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ status: 'tool_call', tools: toolNames })}\n\n`))

          logger.info({ tenantId, tools: toolNames, round }, 'Executing tool calls')

          // Append assistant message with tool_calls
          messages.push({
            role: 'assistant',
            content: result.text || null,
            tool_calls: result.toolCalls,
          })

          // Execute each tool and append results
          for (const tc of result.toolCalls) {
            let toolResult: unknown
            try {
              const args = JSON.parse(tc.function.arguments)
              toolResult = await executeTool(tenantId, tc.function.name, args)
            } catch (err: unknown) {
              toolResult = { error: err instanceof Error ? err.message : 'Tool execution failed' }
            }

            messages.push({
              role: 'tool',
              content: JSON.stringify(toolResult),
              tool_call_id: tc.id,
            })
          }

          // Next iteration will stream the model's response using the tool results
        }

        // --- Persist conversation (best-effort) ---
        if (body.conversationId && finalText) {
          try {
            const admin = createAdminClient()
            await admin.from('ai_messages').insert([
              { conversation_id: body.conversationId, role: 'user', content: body.query },
              { conversation_id: body.conversationId, role: 'assistant', content: finalText },
            ])
            await admin
              .from('ai_conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', body.conversationId)
          } catch {
            // non-critical
          }
        }

        ctrl.enqueue(enc.encode('data: [DONE]\n\n'))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        logger.error({ error: msg, tenantId }, 'AI chat error')
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        ctrl.close()
      }
    },
    cancel() {
      abortCtrl.abort()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
