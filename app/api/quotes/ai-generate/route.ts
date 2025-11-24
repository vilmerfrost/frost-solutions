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

    // Fallback AI generation function (används om extern AI misslyckas)
    function generateQuoteWithFallback(prompt: string, context: any) {
      // Extrahera info från prompt och context
      const lines = prompt.toLowerCase()
      
      // Detektera projekt-typ
      let projectType = 'Allmänt projekt'
      if (lines.includes('tak') || lines.includes('roof')) projectType = 'Takarbete'
      if (lines.includes('fasad') || lines.includes('facade')) projectType = 'Fasadarbete'
      if (lines.includes('golv') || lines.includes('floor')) projectType = 'Golvarbete'
      if (lines.includes('målning') || lines.includes('paint')) projectType = 'Målning'
      if (lines.includes('el') || lines.includes('electric')) projectType = 'Elarbete'
      if (lines.includes('vvs') || lines.includes('plumb')) projectType = 'VVS-arbete'

      // Generera offert baserat på typ
      const baseItems = [
        {
          name: 'Planering och projektledning',
          description: 'Initial planering och projektledning för ' + projectType,
          quantity: 1,
          unit: 'st',
          unit_price: 5000,
          discount: 0,
          vat_rate: 25,
        },
        {
          name: 'Material och verktyg',
          description: 'Material och verktyg för genomförande av ' + projectType,
          quantity: 1,
          unit: 'st',
          unit_price: 15000,
          discount: 10,
          vat_rate: 25,
        },
        {
          name: 'Arbetskostnader',
          description: 'Arbetskostnader för ' + projectType + ' (uppskattad tid)',
          quantity: 40,
          unit: 'timmar',
          unit_price: 850,
          discount: 0,
          vat_rate: 25,
        },
      ]

      // Lägg till typ-specifika items
      if (projectType === 'Takarbete') {
        baseItems.push({
          name: 'Takpannor och underlagsmaterial',
          description: 'Takpannor, underlag och fästmaterial',
          quantity: 100,
          unit: 'm²',
          unit_price: 450,
          discount: 5,
          vat_rate: 25,
        })
      } else if (projectType === 'Fasadarbete') {
        baseItems.push({
          name: 'Fasadmaterial och puts',
          description: 'Fasadmaterial, puts och grundmaterial',
          quantity: 80,
          unit: 'm²',
          unit_price: 350,
          discount: 5,
          vat_rate: 25,
        })
      }

      return {
        title: projectType + ' - Offert',
        description: `Offert för ${projectType.toLowerCase()}. Denna offert är genererad automatiskt baserat på din beskrivning och kan behöva justeras efter noggrannare bedömning.`,
        items: baseItems,
        notes: 'Genererad av AI - granskas och justeras vid behov',
      }
    }

    let generatedData

    // Försök använda extern AI först (om den finns)
    try {
      // Use getBaseUrlFromHeaders to get current origin (works with ngrok, localhost, production)
      const { getBaseUrlFromHeaders } = await import('@/utils/url')
      const baseUrl = getBaseUrlFromHeaders(req.headers)
      const aiResponse = await fetch(`${baseUrl}/api/ai/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        generatedData = aiData.data
      } else {
        throw new Error('External AI failed')
      }
    } catch (aiError) {
      // Fallback till lokal generation
      console.warn('[AI Generate] Using fallback generation')
      generatedData = generateQuoteWithFallback(prompt, context)
    }

    const aiText = generatedData.description || `AI-genererad offert baserad på:
- Projekttyp: ${context.project_type || 'Allmänt'}
- Beskrivning: ${context.description || 'Ingen beskrivning'}
- Budget: ${context.budget_range || 'Ej angiven'}
- Särskilda krav: ${context.special_requirements || 'Inga'}`

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
        title: generatedData.title || context.description?.substring(0, 100) || 'AI-genererad offert',
        notes: generatedData.notes || `AI-genererad offert baserad på:\n\n${prompt}\n\nAI-svar:\n${aiText}`,
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

    // Skapa items om de finns
    if (generatedData.items && generatedData.items.length > 0) {
      const itemsToInsert = generatedData.items.map((item: any, index: number) => ({
        tenant_id: tenantId,
        quote_id: newQuote.id,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity || 1,
        unit: item.unit || 'st',
        unit_price: item.unit_price || 0,
        discount: item.discount || 0,
        vat_rate: item.vat_rate || 25,
        order_index: index + 1,
      }))

      const { error: itemsError } = await admin
        .from('quote_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('[AI Generate] Failed to create items', itemsError)
        // Fortsätt ändå, offerten är skapad
      }
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

    // Hämta komplett offert med items
    const { data: completeQuote } = await admin
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('id', newQuote.id)
      .single()

    return NextResponse.json({
      success: true,
      quote: completeQuote || newQuote,
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

