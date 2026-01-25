import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Hantera CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initiera Supabase (Service Role krävs för att skriva utan RLS-hinder)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { invoice_id, file_path, tenant_id } = await req.json()
    const channelId = `invoice-processing-${invoice_id}`

    // Helper för att skicka status
    const broadcast = async (status: string, message: string, data?: any) => {
      await supabase.channel(channelId).send({
        type: 'broadcast',
        event: 'status',
        payload: { status, message, data }
      })
    }

    // 2. Skicka start-signal
    await broadcast('processing', 'Hämtar fil...')

    // 3. Hämta PDF från Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('invoices')
      .download(file_path)

    if (downloadError) throw new Error('Kunde inte hämta filen')

    // 4. Konvertera till Base64 för Gemini
    const arrayBuffer = await fileData.arrayBuffer()
    const base64File = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    await broadcast('analyzing', 'AI analyserar dokumentet...')

    // 5. Anropa Google Gemini 2.0 Flash
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract invoice data strictly as JSON: { supplier_name, total_amount, currency, due_date, ocr_number }." },
              { inline_data: { mime_type: "application/pdf", data: base64File } }
            ]
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    )

    const aiData = await geminiResponse.json()
    
    // Hantera om Gemini svarar fel/tomt
    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('AI kunde inte läsa fakturan')
    }

    const parsedData = JSON.parse(aiData.candidates[0].content.parts[0].text)

    await broadcast('saving', 'Sparar data...')

    // 6. Uppdatera databasen med AI-datan
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        supplier: parsedData.supplier_name,
        amount: parsedData.total_amount,
        ocr: parsedData.ocr_number,
        due_date: parsedData.due_date,
        status: 'review_needed', // Låt användaren godkänna
        ai_data: parsedData // Spara rådatan ifall vi behöver debugga
      })
      .eq('id', invoice_id)

    if (updateError) throw updateError

    // 7. Klart!
    await broadcast('complete', 'Fakturan tolkad!', parsedData)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
