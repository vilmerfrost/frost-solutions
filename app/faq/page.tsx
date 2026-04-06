'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import FrostLogo from '@/components/FrostLogo'
import { BASE_PATH } from '@/utils/url'

interface FAQItem {
 question: string
 answer: string
 category: string
 id?: string
}

// TODO: Move FAQ content to Supabase table or CMS for dynamic management
// Current content is hardcoded and requires code deployment to update
const faqs: FAQItem[] = [
 {
  category: 'Stämpelklocka',
  question: 'Hur fungerar stämpelklockan?',
  answer: 'Stämpelklockan låter dig snabbt stämpla in och ut. Du väljer ett projekt och klickar på "Stämpla in". När du är klar, klickar du på "Stämpla ut". Systemet beräknar automatiskt OB-timmar (kväll, natt, helg) enligt byggkollektivavtalet och avrundar till minst 0,5 timmar.'
 },
 {
  category: 'Stämpelklocka',
  question: 'Vad är GPS auto-checkin?',
  answer: 'GPS auto-checkin startar automatiskt när du är inom 500 meter från en arbetsplats (kan konfigureras av admin). Du får en notifikation när du närmar dig arbetsplatsen för att påminna dig att stämpla in.'
 },
 {
  category: 'Stämpelklocka',
  question: 'Hur stämplar jag in manuellt?',
  answer: 'Gå till dashboard och välj projekt i stämpelklockan, klicka sedan på "Stämpla in". För manuell tidsrapportering kan du också gå till "Rapporter" → "Ny tidsrapport".'
 },
 {
  category: 'OB-beräkning',
  question: 'När gäller OB-tillägg?',
  answer: 'OB-tillägg gäller enligt byggkollektivavtalet: Vanlig tid (06:00-18:00), OB Kväll (18:00-22:00), OB Natt (22:00-06:00), och OB Helg (alla helger). Systemet delar automatiskt upp tiden om du jobbar över flera OB-perioder.'
 },
 {
  category: 'OB-beräkning',
  question: 'Hur avrundas timmar?',
  answer: 'Alla tidsrapporter avrundas automatiskt uppåt till minst 0,5 timmar för faktureringsenhet.'
 },
 {
  category: 'Projekt',
  question: 'Hur skapar jag ett nytt projekt?',
  answer: 'Gå till "Projekt" → "Nytt projekt" eller klicka på "Skapa" på dashboarden. Fyll i projektnamn, kund, och övrig information.'
 },
 {
  category: 'Projekt',
  question: 'Kan jag se projektstatus och förlopp?',
  answer: 'Ja, på projekt-sidan kan du se alla projekt med förloppsbalkar som visar timmar använda vs budgeterade timmar.'
 },
 {
  category: 'Lönespecifikation',
  question: 'Var hittar jag min lönespecifikation?',
  answer: 'Gå till "Rapporter" → "Lönespec" eller klicka på din användare i lönespec-sektionen. Du kan exportera som PDF eller CSV.'
 },
 {
  category: 'Lönespecifikation',
  question: 'Vem kan se min lönespecifikation?',
  answer: 'Du kan bara se din egen lönespecifikation. Administratörer kan se alla lönespecifikationer.'
 },
 {
  category: 'Administration',
  question: 'Hur lägger jag till en ny anställd?',
  answer: 'Endast administratörer kan lägga till anställda. Gå till "Anställda" → "Lägg till anställd" och fyll i information.'
 },
 {
  category: 'Administration',
  question: 'Hur skapar jag arbetsplatser för GPS?',
  answer: 'Gå till "Admin" → "Arbetsplatser" och klicka på "+ Lägg till arbetsplats". Ange namn, adress, GPS-koordinater (eller klicka "Använd min position"), radie och auto-checkin inställningar.'
 },
 {
  category: 'Administration',
  question: 'Var ser jag alla incheckade anställda?',
  answer: 'Gå till "Admin" → "Live Karta" för att se alla incheckade anställda med deras GPS-positioner i realtid.'
 },
 {
  category: 'Fakturor',
  question: 'Hur skapar jag en faktura?',
  answer: 'Gå till "Fakturor" → "Ny faktura" och välj projekt, kund och tidsperiod. Systemet genererar automatiskt fakturan baserat på rapporterade timmar.'
 },
 {
  category: 'ROT-avdrag',
  question: 'Hur skapar jag en ROT-ansökan?',
  answer: 'Gå till "ROT-avdrag" → "Ny ansökan" och fyll i kundinformation och projektuppgifter. Systemet skapar automatiskt en ansökan som skickas till Skatteverket.'
 },
 {
  category: 'Tekniska',
  question: 'Jag ser inte stämpelklockan, vad gör jag?',
  answer: 'Kontrollera att du har en employee-record. Gå till "Admin" → "Admin Debug" för att kontrollera din status och fixa eventuella problem.'
 },
 {
  category: 'Tekniska',
  question: 'Varför fungerar inte GPS?',
  answer: 'Kontrollera att du har gett webbläsaren tillstånd att använda din position. GPS fungerar bäst i webbläsare på mobil eller desktop med GPS-hårdvara.'
 },
 {
  category: 'Tekniska',
  question: 'Hur rapporterar jag en bugg?',
  answer: 'Gå till "Feedback" i menyn och välj "Buggrapport". Beskriv problemet så detaljerat som möjligt, inklusive skärmdumpar om möjligt.'
 },
 {
  category: 'Projekt',
  question: 'Hur ser jag vilka anställda som jobbat på ett projekt?',
  answer: 'Gå till projektets detaljsida och klicka på "Visa" under "Anställdas timmar". Där ser du en översikt över alla anställda som rapporterat timmar på projektet, med totala timmar per person.'
 },
 {
  category: 'Fakturor',
  question: 'Vad händer när jag skapar en faktura från ett projekt?',
  answer: 'Systemet skapar automatiskt fakturarader från alla ofakturerade tidsrapporter för projektet. Varje tidsrapport blir en fakturarad med datum, timmar och belopp. Tidsrapporterna markeras också automatiskt som fakturerade.'
 },
 {
  category: 'Offerter',
  question: 'Hur skapar jag en offert?',
  answer: 'Gå till "Offerter" → "Ny Offert". Fyll i titel, välj kund, ange giltig till-datum och valuta. Du kan också aktivera KMA (Kostnads- & Miljöanalys) om det behövs. Efter att offerten är skapad kan du lägga till artiklar.'
 },
 {
  category: 'Offerter',
  question: 'Hur lägger jag till artiklar i en offert?',
  answer: 'När du redigerar en offert, scrolla ner till "Artiklar"-sektionen. Klicka på "Lägg till artikel" och fyll i namn, antal, enhet, pris/enhet, rabatt % och moms %. Du kan också välja typ (Material, Arbete eller Övrigt). Totals beräknas automatiskt.'
 },
 {
  category: 'Offerter',
  question: 'Hur beräknas totals i en offert?',
  answer: 'Systemet beräknar automatiskt: Subtotal (summa av alla artiklar), Rabatt (summa av alla rabatter), Moms (beräknas på netto-belopp efter rabatt), och Total (subtotal - rabatt + moms). Allt uppdateras automatiskt när du ändrar artiklar.'
 },
 {
  category: 'Offerter',
  question: 'Hur skickar jag en offert till kunden?',
  answer: 'Öppna offerten och klicka på "Skicka via Email". Ange kundens email-adress. Systemet genererar automatiskt en PDF och skickar den som bilaga. Offertens status ändras till "Skickad" och antal skickade emails spåras.'
 },
 {
  category: 'Offerter',
  question: 'Kan jag ladda ner offerten som PDF?',
  answer: 'Ja! Öppna offerten och klicka på "Ladda ner PDF". PDF:en öppnas i en ny flik och kan sparas eller skickas manuellt.'
 },
 {
  category: 'Offerter',
  question: 'Hur godkänner jag en offert?',
  answer: 'Om offerten har status "Väntar godkännande", klicka på "Godkänn"-knappen. Du kan lägga till en kommentar. Offertens status ändras till "Godkänd" och händelsen loggas i historiken.'
 },
 {
  category: 'Offerter',
  question: 'Hur konverterar jag en offert till ett projekt?',
  answer: 'När en offert har status "Accepterad" eller "Godkänd", klicka på "Konvertera till Projekt". Systemet skapar automatiskt ett nytt projekt med samma namn och kund som offerten. Offerten arkiveras och du omdirigeras till det nya projektet.'
 },
 {
  category: 'Offerter',
  question: 'Kan jag duplicera en offert?',
  answer: 'Ja! Öppna offerten och klicka på "Duplicera". Systemet skapar en ny offert med samma artiklar men nytt offertnummer. Den nya offerten har status "Utkast" och kan redigeras fritt.'
 },
 {
  category: 'Offerter',
  question: 'Vad är KMA (Kostnads- & Miljöanalys)?',
  answer: 'KMA är en funktion för att spåra kostnads- och miljöanalys i offerter. Du kan aktivera KMA när du skapar eller redigerar en offert. Detta gör att du kan lägga till KMA-referens, typ och omfattning.'
 },
 {
  category: 'Offerter',
  question: 'Hur filtrerar jag offerter?',
  answer: 'På offerter-sidan kan du filtrera på status (Utkast, Skickad, Accepterad, etc.), kund eller söka efter titel eller offertnummer. Du kan också kombinera flera filter.'
 },
 {
  category: 'Stämpelklocka',
  question: 'Kan jag pausa min stämpling?',
  answer: 'Ja! Klicka på "Pausa" när du tar en paus. Tiden räknas inte under pausen. Klicka på "Återuppta" när du fortsätter arbeta. Total paus-tid visas i stämpelklockan.'
 },
 {
  category: 'Stämpelklocka',
  question: 'Får jag en påminnelse om jag glömmer stämpla ut?',
  answer: 'Ja! Om du har jobbat 8 timmar får du automatiskt en påminnelse att stämpla ut. Påminnelsen visas en gång per stämpling.'
 },
 {
  category: 'ROT-avdrag',
  question: 'Hur följer jag upp status på min ROT-ansökan?',
  answer: 'Gå till ROT-ansökan och klicka på "Kontrollera status". Systemet hämtar automatiskt uppdaterad status från Skatteverket.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Hur skapar jag en arbetsorder?',
  answer: 'Gå till "Arbetsordrar" → "Ny arbetsorder". Fyll i titel, beskrivning, välj projekt, tilldela anställd (valfritt), sätt prioritet och status. Du kan också ladda upp foton direkt.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Vad är skillnaden mellan prioriteterna?',
  answer: 'Prioriteter är: Låg (planerat arbete), Normal (vanligt arbete), Hög (brådskande), Kritiskt (måste göras omedelbart). Prioritet hjälper dig att organisera arbetsflödet.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Hur ändrar jag status på en arbetsorder?',
  answer: 'Öppna arbetsordern och klicka på "Nästa steg"-knappen. Systemet går automatiskt igenom alla statusar: Skapad → Tilldelad → Pågående → Väntar godkännande → Godkänd → Färdig.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Kan jag arbeta med arbetsordrar offline?',
  answer: 'Ja! Du kan skapa, redigera och ta bort arbetsordrar även utan internet. Alla ändringar sparas lokalt och synkas automatiskt när du kommer online igen.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Vad händer om jag redigerar samma arbetsorder från två enheter?',
  answer: 'Systemet använder "Last-Write-Wins" - den senaste ändringen vinner. Om det uppstår konflikter loggas de för granskning, men senaste ändringen används automatiskt.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Får anställda notifikationer när de tilldelas en arbetsorder?',
  answer: 'Ja! När en arbetsorder tilldelas en anställd får de automatiskt en notifikation i appen. De kan också se alla tilldelade arbetsordrar på sin arbetsordrar-sida.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Kan jag ladda upp foton i arbetsordrar?',
  answer: 'Ja! Klicka på "Ladda upp foton" när du skapar eller redigerar en arbetsorder. Foton sparas och kan ses av alla som har tillgång till arbetsordern.'
 },
 {
  category: 'Arbetsordrar',
  question: 'Hur filtrerar jag arbetsordrar?',
  answer: 'På arbetsordrar-sidan kan du filtrera på status (Skapad, Pågående, Färdig, etc.), prioritet (Låg, Normal, Hög, Kritiskt), projekt eller tilldelad person.'
 },
 {
  category: 'Offline & Sync',
  question: 'Hur fungerar offline-stöd?',
  answer: 'Appen fungerar offline! Du kan skapa och redigera arbetsordrar, tidsrapporter och mer även utan internet. Alla ändringar sparas lokalt och synkas automatiskt när du kommer online.'
 },
 {
  category: 'Offline & Sync',
  question: 'När synkas mina data?',
  answer: 'Data synkas automatiskt när du kommer online, var 30:e sekund när du är online, och när du gör vissa åtgärder. Du kan också manuellt synka genom att klicka på sync-knappen.'
 },
 {
  category: 'Offline & Sync',
  question: 'Hur ser jag om mina data är synkade?',
  answer: 'I sidofältet ser du en status-indikator som visar om du är online/offline och om sync pågår. En grön bock betyder att allt är synkat.'
 },
 {
  category: 'Offline & Sync',
  question: 'Vad händer om jag har ändringar som inte synkats?',
  answer: 'Systemet visar antal väntande ändringar i sync-indikatorn. När du kommer online synkas de automatiskt. Du förlorar aldrig data - allt sparas lokalt först.'
 },
 {
  category: 'Offline & Sync',
  question: 'Kan jag arbeta med flera enheter samtidigt?',
  answer: 'Ja! Systemet hanterar synkning från flera enheter. Om samma data redigeras på två enheter används "Last-Write-Wins" - senaste ändringen vinner.'
 },
 {
  category: 'Integrationer',
  question: 'Vilket Fortnox-paket behöver jag för att använda Fortnox-integrationen?',
  answer: 'Du behöver ett betalt Fortnox-paket (Fakturering, Bokföring, Lön eller Allt-i-ett). Gratis Fortnox-konton saknar API-åtkomst och kan därför inte anslutas. Detta är INTE ett fel i appen - det är en begränsning från Fortnox för gratis konton.',
  id: 'fortnox-license'
 },
 {
  category: 'Integrationer',
  question: 'Varför får jag felet "saknar licens" när jag försöker ansluta Fortnox?',
  answer: 'Detta betyder att ditt Fortnox-konto är gratis och saknar API-åtkomst. Kunder med betalda Fortnox-paket (Fakturering eller högre) kommer att kunna ansluta utan problem. Uppgradera ditt Fortnox-paket eller använd ett kundkonto med betalt paket för att testa integrationen.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är AI-assistenten och var hittar jag den?',
  answer: 'AI-assistenten är en chatbot som hjälper dig navigera i appen och sammanfatta data. Du hittar den som en flytande knapp nere till höger på skärmen. Den kan hjälpa dig hitta rätt sida, sammanfatta tidsrapporter och ge tips om funktioner.'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur sammanfattar jag mina tidsrapporter med AI?',
  answer: 'Du kan använda AI-assistenten (klicka på AI-ikonen nere till höger) och säg "Sammanfatta mina tidsrapporter", eller gå till "Rapporter"-sidan där du ser en AI-sammanfattning automatiskt. AI-sammanfattningen visar totala timmar, OB-timmar och trender.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är AI Budgetprognos?',
  answer: 'AI Budgetprognos analyserar ditt projekts budget och framsteg, predikterar risk för budgetöverskridning och föreslår åtgärder. Du hittar den på projekt-detaljsidan. Den använder statistisk analys (gratis) och visar risk-nivåer med färgkodning (grön/gul/röd).'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur fungerar AI Materialidentifiering?',
  answer: 'AI Materialidentifiering kan identifiera byggmaterial från foto. Gå till ett projekt, scrolla ner till "AI Materialidentifiering", ladda upp en bild av materialet. Systemet identifierar materialet och matchar mot dina supplier_items i databasen. Det använder Hugging Face (gratis).'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är AI Faktureringsförslag?',
  answer: 'AI Faktureringsförslag analyserar dina time entries för ett projekt och föreslår faktura-belopp och rader. Du hittar det när du skapar en faktura från ett projekt. Det kan använda Claude AI (betalt, med caching) eller template (gratis fallback).'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur använder jag AI Projektplanering?',
  answer: 'AI Projektplanering föreslår realistiska tidsplaner med faser, riskfaktorer och teamstorlek. Gå till ett projekt och scrolla ner till "AI Projektplanering", klicka på "Generera plan". Den använder Claude AI (betalt, med caching) eller template (gratis fallback).'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är AI KMA-checklista?',
  answer: 'AI KMA-checklista genererar automatiskt checklistor baserat på projekttyp (elektriker, rörmokare, målare, etc.). Den visas automatiskt när du skapar ett nytt projekt. Den är template-baserad (gratis) och inkluderar säkerhetsmoment och foto-krav.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad betyder "Cache"-badgen på AI-resultat?',
  answer: '"Cache"-badgen betyder att resultatet hämtades från cache (tidigare genererat resultat). Detta är snabbare och kostar inget. AI-resultat cachelagras i 7-14 dagar beroende på typ.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vilka AI-funktioner är gratis och vilka kostar?',
  answer: 'Gratis: Budgetprognos (statistik), Materialidentifiering (Hugging Face), KMA-checklista (template), Sammanfattning (Hugging Face). Betalt (med caching): Faktureringsförslag och Projektplanering (Claude AI). Total kostnad är optimerad med caching och rate limiting.'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur fungerar AI-assistentens konversationsminne?',
  answer: 'AI-assistenten kommer ihåg din konversation under sessionen. Var 8-12 meddelanden skapas en sammanfattning som sparas för långtidsminne. Detta gör att assistenten kan ge mer relevanta svar baserat på tidigare diskussioner. Konversationer sparas per användare och tenant.'
 },
 {
  category: 'AI-funktioner',
  question: 'Kan AI-assistenten utföra åtgärder åt mig?',
  answer: 'Ja! AI-assistenten kan använda "tools" (funktionsanrop) för att utföra åtgärder som att skapa fakturor, generera KMA-checklistor, hitta tidsrapporter, köra budgetprognoser och identifiera material. När du frågar om något som kräver en åtgärd, kommer assistenten att föreslå att utföra den åt dig.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är snabbkommandon i AI-assistenten?',
  answer: 'Efter varje svar föreslår AI-assistenten 3 snabbkommandon (t.ex. "Skapa faktura", "Visa tidsrapporter", "Kör budgetprognos"). Dessa är klickbara knappar som direkt utför åtgärden eller navigerar till rätt sida. Det gör det snabbare att komma vidare efter att ha fått ett svar.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad händer om AI-assistenten upprepar sig?',
  answer: 'Systemet har ett anti-loop system som upptäcker när samma fråga ställs flera gånger. Om du frågar samma sak mer än 2 gånger på 60 sekunder, kommer assistenten att föreslå en alternativ lösning eller direkt åtgärd istället för att upprepa samma svar.'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur fungerar intent-detektering?',
  answer: 'AI-assistenten klassificerar automatiskt din fråga i kategorier (faktura, KMA, arbetsorder, tid, material, budget, allmänt). Detta gör att systemet kan ge mer relevanta svar och föreslå rätt verktyg. Systemet lär sig också från tidigare frågor för att bli bättre över tid.'
 },
 {
  category: 'AI-funktioner',
  question: 'Kan jag ge feedback på AI-svar?',
  answer: 'Ja! Varje AI-svar har 👍/👎 knappar för feedback. Din feedback hjälper systemet att lära sig och förbättras. Du kan också ange orsak till varför du gillade eller inte gillade svaret. Feedback sparas anonymt och används för att förbättra AI-assistenten.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad är RAG (Retrieval-Augmented Generation)?',
  answer: 'RAG är en teknik där AI-assistenten hämtar relevant kontext från dina Frost-data (projekt, fakturor, tidsrapporter) innan den svarar. Detta gör att svaren är mer exakta och baserade på faktisk data istället för generiska svar. Systemet visar alltid källor för siffror och data.'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur fungerar streaming-svar?',
  answer: 'När AI-assistenten genererar långa svar, visas texten ord-för-ord (typing effect) i realtid istället för att vänta på hela svaret. Detta gör det kännbart snabbare och mer interaktivt. Du kan också avbryta genereringen om du vill.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad gör AI-assistenten för att undvika felaktig information?',
  answer: 'Systemet har flera anti-hallucination åtgärder: 1) Visar alltid källor när data refereras, 2) Säger "Jag hittar inte detta i Frost-datan" istället för att gissa, 3) Använder RAG för att hämta faktisk data, 4) Validerar all data innan den visas. Om data saknas, föreslår systemet hur du kan samla in den.'
 },
 {
  category: 'AI-funktioner',
  question: 'Hur fungerar rate limiting för AI-funktioner?',
  answer: 'För att hålla kostnaderna nere och säkerställa prestanda finns det rate limits per tenant: Faktureringsförslag (5/min), Projektplanering (3/min). Om du når gränsen får du ett meddelande och kan försöka igen om en minut. Gratis funktioner (budget, material, KMA) har inga rate limits.'
 },
 {
  category: 'AI-funktioner',
  question: 'Vad händer om AI-tjänsten är nere?',
  answer: 'Systemet har fallback-strategier: Om AI-tjänsten är otillgänglig används template-baserade svar (gratis, snabba). För faktureringsförslag och projektplanering används enklare templates. Du får alltid ett svar, även om det inte är AI-genererat. Systemet loggar också alla fel för förbättringar.'
 },
 {
  category: 'Integrationer',
  question: 'Hur ansluter jag till Fortnox eller Visma?',
  answer: 'Gå till "Inställningar" → "Integrationer" (endast för administratörer). Klicka på "Anslut" för den integration du vill använda. Du kommer att omdirigeras till Fortnox/Visma för att godkänna behörigheterna. Efter godkännande ansluts integrationen automatiskt.'
 },
 {
  category: 'Integrationer',
  question: 'Vad kan jag göra med Fortnox-integrationen?',
  answer: 'Med Fortnox-integrationen kan du automatiskt synkronisera fakturor och kunder mellan Frost Solutions och Fortnox. Du kan exportera fakturor och kunder till Fortnox, och importera data från Fortnox till Frost Solutions.'
 },
 {
  category: 'Integrationer',
  question: 'Hur ansluter jag till Visma?',
  answer: 'Gå till "Inställningar" → "Integrationer" (endast för administratörer). Klicka på "Anslut" för Visma Payroll eller Visma eAccounting. Du kommer att omdirigeras till Visma för att godkänna behörigheterna. Efter godkännande ansluts integrationen automatiskt.'
 },
 {
  category: 'Integrationer',
  question: 'Vad är skillnaden mellan Visma Payroll och Visma eAccounting?',
  answer: 'Visma Payroll används för lönehantering och personaladministration, medan Visma eAccounting används för fakturering och bokföring. Du kan ansluta båda integrationerna samtidigt om du använder båda Visma-tjänsterna.'
 },
 {
  category: 'Integrationer',
  question: 'Kan jag använda både Fortnox och Visma samtidigt?',
  answer: 'Ja, du kan ansluta både Fortnox och Visma-integrationer samtidigt. Varje integration fungerar oberoende av varandra. Du kan välja vilken integration du vill använda för varje export eller synkronisering.'
 },
 {
  category: 'Integrationer',
  question: 'Hur ofta synkroniseras data med Fortnox/Visma?',
  answer: 'Synkronisering sker manuellt när du klickar på "Exportera" eller "Synkronisera" på relevanta sidor. Automatisk synkronisering kan aktiveras i framtida versioner. För nu, synkronisera manuellt när du behöver uppdatera data.'
 },
 {
  category: 'Integrationer',
  question: 'Vad händer om jag frånkopplar en integration?',
  answer: 'När du frånkopplar en integration tas OAuth-token bort och integrationen kan inte längre användas. Dina befintliga data i Frost Solutions påverkas inte, men du kan inte längre exportera eller synkronisera med den integrationen. Du kan alltid ansluta igen senare.'
 },
 {
  category: 'Integrationer',
  question: 'Vilka behörigheter behöver integrationerna?',
  answer: 'Fortnox kräver behörighet för fakturering och kunder. Visma Payroll kräver behörighet för lönehantering. Visma eAccounting kräver behörighet för fakturering och bokföring. Alla behörigheter begärs endast för läsning och skrivning av relevant data.'
 },
]

export default function FAQPage() {
 // Always start with 'Alla' to avoid hydration mismatch
 const [selectedCategory, setSelectedCategory] = useState<string>('Alla')
 const [searchQuery, setSearchQuery] = useState('')
 const [mounted, setMounted] = useState(false)

 // Handle hash navigation and scrolling on mount (client-side only)
 useEffect(() => {
  setMounted(true)
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  if (hash) {
   const hashValue = hash.replace('#', '')
   
   // If hash is a category name (like "integrationer"), filter by that category
   if (hashValue === 'integrationer' || hashValue === 'Integrationer') {
    setSelectedCategory('Integrationer')
    setSearchQuery('')
    // Scroll to first Integrationer FAQ after render
    setTimeout(() => {
     const firstIntegrationFAQ = document.querySelector('[id="fortnox-license"]')
     if (firstIntegrationFAQ) {
      firstIntegrationFAQ.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Add highlight effect
      firstIntegrationFAQ.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50')
      setTimeout(() => {
       firstIntegrationFAQ.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50')
      }, 2000)
     }
    }, 500)
   } else {
    // Find the FAQ with this ID and ensure it's visible
    const faq = faqs.find(f => f.id === hashValue)
    if (faq) {
     setSelectedCategory(faq.category)
     setSearchQuery('')
     // Scroll to element after a short delay to ensure it's rendered
     setTimeout(() => {
      const element = document.getElementById(hashValue)
      if (element) {
       element.scrollIntoView({ behavior: 'smooth', block: 'start' })
       // Add highlight effect
       element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50')
       setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50')
       }, 2000)
      }
     }, 500)
    }
   }
  }
 }, [])

 const categories = ['Alla', ...Array.from(new Set(faqs.map(faq => faq.category)))]

 const filteredFAQs = faqs.filter(faq => {
  const matchesCategory = selectedCategory === 'Alla' || faq.category === selectedCategory
  const matchesSearch = searchQuery === '' || 
   faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
   faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  return matchesCategory && matchesSearch
 })

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
     {/* Header */}
     <div className="mb-8 flex flex-col items-center">
      <FrostLogo size={48} />
      <h1 className="text-4xl sm:text-5xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
       FAQ - Vanliga Frågor
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-center">
       Hitta svar på dina frågor om Frost Solutions
      </p>
     </div>

     {/* Search */}
     <div className="mb-6">
      <input
       type="text"
       placeholder="Sök efter frågor..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-full px-6 py-4 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
      />
     </div>

     {/* Category Filter - Only render after mount to avoid hydration mismatch */}
     {mounted && (
      <div className="mb-6 flex flex-wrap gap-2">
       {categories.map((category) => (
        <button
         key={category}
         onClick={() => setSelectedCategory(category)}
         className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          selectedCategory === category
           ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 shadow-md'
           : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
         }`}
        >
         {category}
        </button>
       ))}
      </div>
     )}

     {/* FAQ Items - Only render filtered results after mount to avoid hydration mismatch */}
     <div className="space-y-4">
      {!mounted ? (
       // Show all FAQs on initial server render to avoid hydration mismatch
       faqs.map((faq, index) => (
        <div
         key={index}
         id={faq.id}
         className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all scroll-mt-20"
        >
         <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-gray-900 font-bold">
           ?
          </div>
          <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
             {faq.category}
            </span>
           </div>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {faq.question}
           </h3>
           <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {faq.answer}
           </p>
          </div>
         </div>
        </div>
       ))
      ) : filteredFAQs.length === 0 ? (
       <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] p-8 text-center border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
         Inga frågor matchade din sökning.
        </p>
       </div>
      ) : (
       filteredFAQs.map((faq, index) => (
        <div
         key={index}
         id={faq.id}
         className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all scroll-mt-20"
        >
         <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-gray-900 font-bold">
           ?
          </div>
          <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
             {faq.category}
            </span>
           </div>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {faq.question}
           </h3>
           <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {faq.answer}
           </p>
          </div>
         </div>
        </div>
       ))
      )}
     </div>

     {/* Contact Support */}
     <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-6 border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
       Fortfarande frågor?
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
       Kontakta support eller rapportera en bugg via feedback-sidan.
      </p>
      <div className="flex gap-3">
       <Link
        href={`${BASE_PATH}/feedback`}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-[8px] font-semibold transition-colors"
       >
        💬 Kontakta Support
       </Link>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}

