'use client'

import { useState, useEffect } from 'react'

const facts = [
 // App-specifika fakta
 "💡 Frost Solutions använder automatisk OB-beräkning enligt byggkollektivavtalet för att säkerställa korrekt löneräkning.",
 "⚡ Stämpelklockan är tillgänglig 24/7 och sparas automatiskt, så du kan navigera mellan sidor utan att förlora din stämpling.",
 "📊 Systemet avrundar automatiskt alla tidsrapporter till minst 0,5 timmar för enklare fakturering.",
 "🌍 GPS-funktionen hjälper dig att automatiskt påminnas när du närmar dig en arbetsplats.",
 "💼 Administratörer kan se alla anställdas aktivitet i realtid via Live Karta.",
 "📄 Fakturor skapas automatiskt med fakturarader från tidsrapporterna när du skapar dem från ett projekt.",
 "📄 Offerter kan skapas med artiklar (material, arbete, övrigt) och totals beräknas automatiskt med rabatter och moms.",
 "📧 Offerter kan skickas direkt via email med PDF-bilaga till kunder.",
 "🔄 Offerter kan konverteras till projekt när de accepteras - skapa projekt direkt från offert!",
 "📋 Duplicera offerter för att snabbt skapa nya offerter baserat på befintliga.",
 "💰 Offerter beräknar automatiskt subtotal, rabatt, moms och total - inga manuella beräkningar behövs!",
 "📊 Offertstatusar: Utkast → Väntar godkännande → Godkänd → Skickad → Visad → Accepterad/Rejicerad.",
 "🎯 KMA (Kostnads- & Miljöanalys) kan aktiveras i offerter för att spåra kostnads- och miljöanalys.",
 "📦 Materialdatabasen låter dig snabbt lägga till artiklar från befintliga material i offerter.",
 "📄 Varje offert får ett unikt offertnummer (t.ex. OF-2025-001) som genereras automatiskt.",
 "⏰ Offerter kan ha ett giltig till-datum som automatiskt markerar dem som utgångna när datumet passerar.",
 "🔒 All data är säkert isolerad per företag (tenant) - ingen kan se andras data.",
 "🎯 Projektförlopp visar visuellt när du närmar dig budgeten med färgkodning.",
 "📱 Appen är helt mobilvänlig och fungerar perfekt på telefon, tablet och dator.",
 "🤖 AI-sammanfattning hjälper dig snabbt förstå projektstatus och fakturaöversikt.",
 "📡 Arbetsordrar fungerar offline - skapa och redigera arbetsordrar även utan internet, de synkas automatiskt när du kommer online.",
 "🔄 Systemet synkar automatiskt alla ändringar när du kommer tillbaka online, så du förlorar aldrig data.",
 "📋 Arbetsordrar kan ha prioriteringar (Låg, Normal, Hög, Kritiskt) för bättre organisation av arbetsflödet.",
 "📸 Du kan ladda upp foton direkt i arbetsordrar för att dokumentera arbetet eller problem.",
 "👥 Arbetsordrar kan tilldelas specifika anställda, och de får automatiskt en notifikation när de tilldelas.",
 "🔄 Statusflödet för arbetsordrar är enkelt - klicka på 'Nästa steg' för att gå igenom alla statusar automatiskt.",
 "📊 Du kan filtrera arbetsordrar på status, prioritet, projekt eller tilldelad person för enklare hantering.",
 "🔔 När en arbetsorder tilldelas en anställd får de automatiskt en notifikation i appen.",
 "📱 Arbetsordrar är tillgängliga offline - alla ändringar sparas lokalt och synkas när internet är tillgängligt igen.",
 "⚡ Sync-systemet använder 'Last-Write-Wins' för att automatiskt lösa konflikter om samma arbetsorder redigeras från flera enheter.",
 
 // Byggbranschen - allmänna fakta
 "🏗️ Byggbranschen är Sveriges största bransch med över 200 000 anställda och står för cirka 6% av BNP.",
 "⏰ OB-tillägg (Obekväm arbetstid) är viktigt i byggbranschen - kväll, natt och helg ger extra ersättning.",
 "📋 ROT-avdraget kan ge upp till 75 000 kr i skattereduktion per person och år för renoveringar.",
 "🔨 Säkerhet är kritisk på byggarbetsplatser - använd alltid rätt skyddsutrustning och följ säkerhetsregler.",
 "📐 Prestanda och kvalitet är nyckeln i byggbranschen - korrekt tidsrapportering hjälper med projektplanering.",
 "🌡️ Byggarbete påverkas av väder - planera därefter och dokumentera tidsförluster.",
 "💰 Lönekostnader är ofta den största utgiften i byggprojekt - korrekt tidsrapportering är avgörande.",
 "📊 Genomsnittlig timlön i byggbranschen varierar mellan 200-500 kr/timme beroende på yrke och erfarenhet.",
 "🏢 Byggbranschen står för cirka 40% av Sveriges totala energianvändning.",
 "👷 Byggbranschen har högst skadefrekvens i Sverige - säkerhet måste alltid komma först.",
 "📈 Digitalisering ökar i byggbranschen - digital tidsrapportering sparar tid och reducerar fel.",
 "🌱 Hållbarhet blir allt viktigare - många byggprojekt fokuserar nu på miljövänliga material och processer.",
 "🔧 Underhåll och renovering står för cirka 60% av byggbranschens totala omsättning.",
 "📱 Mobilappar för tidsrapportering ökar produktiviteten med upp till 30% enligt studier.",
 "🎓 Utbildning är viktigt - certifieringar och kompetensutveckling ökar löner och möjligheter.",
 "🏗️ Byggbranschen är cyklisk - planera för både höga och låga perioder.",
 "📋 Dokumentation är kritisk - korrekt dokumentation av arbete kan spara tid vid fakturering.",
 "🤝 Kommunikation mellan företag och kunder är nyckeln till framgångsrika projekt.",
 "⚖️ Byggkollektivavtalet reglerar löner, arbetstider och OB-tillägg för anställda i byggbranschen.",
 "📊 Genomsnittlig projektledningstid är 12-18 månader för större byggprojekt.",
 
 // AI-specifika fakta
 "🤖 AI kan sammanfatta dina tidsrapporter - klicka på 'Sammanfatta mina tidsrapporter' i AI-assistenten eller på rapporter-sidan.",
 "💡 AI Budgetprognos hjälper dig identifiera risk för budgetöverskridning innan det är för sent.",
 "📸 AI Materialidentifiering kan identifiera byggmaterial från foto - ladda upp en bild på projekt-sidan.",
 "📝 AI Faktureringsförslag genererar automatiskt faktura-rader baserat på dina tidsrapporter.",
 "📅 AI Projektplanering föreslår realistiska tidsplaner med faser och riskfaktorer.",
 "✅ AI KMA-checklista genererar automatiskt checklistor baserat på projekttyp (elektriker, rörmokare, målare, etc.).",
 "🔍 AI-assistenten kan hjälpa dig hitta rätt sida i appen - klicka på AI-ikonen nere till höger.",
 "💬 Fråga AI-assistenten 'Sammanfatta mina tidsrapporter' för en snabb översikt över ditt arbete.",
 "🎯 AI-funktioner använder caching för att vara snabba och kostnadseffektiva - se 'Cache'-badgen på resultat.",
 "⚡ De flesta AI-funktioner är gratis (template-baserade eller Hugging Face), endast fakturering och projektplanering använder betalda modeller.",
]

export default function DidYouKnow() {
 const [currentFact, setCurrentFact] = useState<string>('')
 const [show, setShow] = useState(true)

 useEffect(() => {
  // Show a random fact on mount
  const randomFact = facts[Math.floor(Math.random() * facts.length)]
  setCurrentFact(randomFact)

  // Rotate facts every 10 seconds
  const interval = setInterval(() => {
   const newFact = facts[Math.floor(Math.random() * facts.length)]
   setCurrentFact(newFact)
  }, 10000)

  return () => clearInterval(interval)
 }, [])

 if (!show) return null

 return (
  <div className="bg-primary-500 hover:bg-primary-600 dark:/20 dark:/20 rounded-[8px] p-4 mb-6 border border-blue-200 dark:border-blue-800 relative">
   <button
    onClick={() => setShow(false)}
    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    aria-label="Stäng"
   >
    ✕
   </button>
   <div className="flex items-start gap-3">
    <div className="text-2xl">💡</div>
    <div className="flex-1">
     <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
      Visste du att?
     </div>
     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {currentFact}
     </p>
    </div>
   </div>
  </div>
 )
}

