import { NextResponse } from 'next/server'

export async function POST(req: Request) {
 const { text } = await req.json()
 console.log("Text från frontend:", text)

 const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
   'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`,
   'Content-Type': 'application/json'
  },
  body: JSON.stringify({
   model: 'gpt-3.5-turbo',
   messages: [
    { role: 'system', content: 'Du är en API-assistent som hjälper byggbolag skriva korrekta fakturabeskrivningar.' },
    { role: 'user', content: `Kunddata/faktura: ${text}` }
   ],
   max_tokens: 140
  })
 })

 console.log("OpenAI response-status:", openaiRes.status)
 const data = await openaiRes.json()
 console.log("OpenAI response-data:", data)

 const aiText = data?.choices?.[0]?.message?.content?.trim() || "AI-generering misslyckades"
 return NextResponse.json({ aiText })
}
