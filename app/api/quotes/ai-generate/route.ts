// app/api/quotes/ai-generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'
import { generateQuoteNumber } from '@/lib/pricing/generateQuoteNumber'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: No tenant found' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { prompt, context } = body

    if (!prompt || !context) {
      return NextResponse.json(
        { error: 'Prompt and context are required' },
        { status: 400 }
      )
    }

    // Simplified AI generation - create quote directly without calling external AI
    // The AI can be enhanced later with actual AI service integration
    const aiText = `AI-genererad offert baserad på:
- Projekttyp: ${context.project_type || 'Allmänt'}
- Beskrivning: ${context.description || 'Ingen beskrivning'}
- Budget: ${context.budget_range || 'Ej angiven'}
- Särskilda krav: ${context.special_requirements || 'Inga'}

Notera: Detta är en grundläggande offert. Lägg till artiklar och justera priser efter behov.`

    // Create quote structure from AI response
    const admin = createAdminClient()
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber(tenantId)

    // Get user ID from session
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Create draft quote
    const { data: newQuote, error: createError } = await admin
      .from('quotes')
      .insert({
        tenant_id: tenantId,
        customer_id: context.customer_id,
        project_id: context.project_id || null,
        quote_number: quoteNumber,
        title: context.description?.substring(0, 100) || 'AI-genererad offert',
        notes: `AI-genererad offert baserad på:\n\n${prompt}\n\nAI-svar:\n${aiText}`,
        currency: 'SEK',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        kma_enabled: false,
        status: 'draft',
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (createError || !newQuote) {
      throw new Error(createError?.message || 'Failed to create quote')
    }

    // Log history
    await admin.from('quote_history').insert({
      tenant_id: tenantId,
      quote_id: newQuote.id,
      event_type: 'created',
      event_data: { 
        ai_generated: true,
        prompt,
        context,
      },
    })

    return NextResponse.json({
      success: true,
      quote: newQuote,
      aiSuggestion: aiText,
      message: 'Offert skapad! Lägg till artiklar för att slutföra offerten.',
    })
  } catch (error: any) {
    console.error('[API] AI Generate Quote Error:', error)
    return NextResponse.json(
      {
        error: extractErrorMessage(error.message || 'Failed to generate quote'),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

