/**
 * AB04 / ABT06 / Consumer contract templates
 *
 * Swedish construction contract standards with placeholder-based auto-fill.
 */

export interface ContractTemplate {
  id: string
  name: string
  standard: 'AB04' | 'ABT06' | 'ABS18' | 'consumer'
  description: string
  sections: ContractSection[]
}

export interface ContractSection {
  title: string
  content: string // Template text with {{placeholders}}
  required: boolean
}

/** All placeholder keys used in templates */
export const TEMPLATE_PLACEHOLDERS = [
  '{{project_name}}',
  '{{client_name}}',
  '{{contractor_name}}',
  '{{start_date}}',
  '{{end_date}}',
  '{{contract_sum}}',
] as const

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number]

/**
 * Fill placeholders in a template with actual values.
 */
export function fillTemplate(
  template: ContractTemplate,
  values: Record<string, string>
): ContractTemplate {
  return {
    ...template,
    sections: template.sections.map((section) => ({
      ...section,
      content: Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
        section.content
      ),
    })),
  }
}

// ---------------------------------------------------------------------------
// AB 04 — General conditions for building contracts (utforandeentreprenad)
// ---------------------------------------------------------------------------

export const AB04_TEMPLATE: ContractTemplate = {
  id: 'ab04',
  name: 'AB 04 — Utforandeentreprenad',
  standard: 'AB04',
  description:
    'Allmanna bestammelser for byggnads-, anlaggnings- och installationsentreprenader (utforandeentreprenad). Bestallaren tillhandahaller ritningar och beskrivningar.',
  sections: [
    {
      title: '1. Omfattning',
      content:
        'Denna entreprenad avser {{project_name}} och utfors av {{contractor_name}} pa uppdrag av {{client_name}}. ' +
        'Entreprenaden utfors som utforandeentreprenad enligt AB 04. ' +
        'Entreprenoren ska utfora samtliga arbeten i enlighet med kontraktshandlingarna.',
      required: true,
    },
    {
      title: '2. Kontraktssumma',
      content:
        'Kontraktssumman uppgar till {{contract_sum}} SEK exklusive moms. ' +
        'Betalning sker enligt betalningsplan som overenskommits mellan parterna. ' +
        'Fakturering sker manadsvis i proportion till utfort arbete.',
      required: true,
    },
    {
      title: '3. Tid',
      content:
        'Entreprenaden ska paborjas senast {{start_date}} och vara fardigtalld senast {{end_date}}. ' +
        'Vid forsening som beror pa entreprenoren utgar vite enligt kapitel 5 i AB 04. ' +
        'Tidplan bifogas som bilaga.',
      required: true,
    },
    {
      title: '4. ATA-arbeten',
      content:
        'Andering, tillagg och avgangar (ATA) ska hanteras enligt AB 04 kap. 2 paragraf 3-4. ' +
        'ATA-arbeten ska skriftligen beordras av bestallaren innan de paborjas. ' +
        'Oforutsedda ATA-arbeten ska dokumenteras med foto och prisbesked innan arbetet godkanns.',
      required: true,
    },
    {
      title: '5. Forsakring',
      content:
        'Entreprenoren ska teckna och vidmakthalla allriskforsakring for entreprenaden under hela entreprenadtiden. ' +
        'Forsakringen ska omfatta brand, vatten, stold och vandalisering. ' +
        'Bevis pa forsakring ska overlamnas till bestallaren fore arbetenas paborjande.',
      required: true,
    },
    {
      title: '6. Garantier',
      content:
        'Garantitiden ar fem (5) ar for entreprenaden och tva (2) ar for material och varor enligt AB 04 kap. 5. ' +
        'Under garantitiden ansvarar entreprenoren for att avhjalpa fel som framtrader.',
      required: true,
    },
    {
      title: '7. Tvistelasning',
      content:
        'Tvister med anledning av detta kontrakt ska i forsta hand losas genom forhandling. ' +
        'Om parterna inte kan enas ska tvisten avgaras av allman domstol enligt AB 04 kap. 10, ' +
        'alternativt genom skiljeforfarande om parterna sa overenskommer.',
      required: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// ABT 06 — General conditions for design-build contracts (totalentreprenad)
// ---------------------------------------------------------------------------

export const ABT06_TEMPLATE: ContractTemplate = {
  id: 'abt06',
  name: 'ABT 06 — Totalentreprenad',
  standard: 'ABT06',
  description:
    'Allmanna bestammelser for totalentreprenader dar entreprenoren ansvarar for bade projektering och utforande.',
  sections: [
    {
      title: '1. Omfattning',
      content:
        'Denna totalentreprenad avser {{project_name}} och utfors av {{contractor_name}} pa uppdrag av {{client_name}}. ' +
        'Entreprenaden utfors som totalentreprenad enligt ABT 06. ' +
        'Entreprenoren ansvarar for bade projektering och utforande av samtliga arbeten.',
      required: true,
    },
    {
      title: '2. Kontraktssumma',
      content:
        'Kontraktssumman uppgar till {{contract_sum}} SEK exklusive moms. ' +
        'Summan inkluderar projektering, material och utforande. ' +
        'Betalning sker enligt overenskommen betalningsplan.',
      required: true,
    },
    {
      title: '3. Tid',
      content:
        'Entreprenaden ska paborjas senast {{start_date}} och vara fardigtalld senast {{end_date}}. ' +
        'Tidplanen inkluderar projekteringstid och utforandetid. ' +
        'Vid forsening tillampas ABT 06 kap. 5 avseende vite och tidsforlangning.',
      required: true,
    },
    {
      title: '4. ATA-arbeten',
      content:
        'ATA-arbeten hanteras enligt ABT 06 kap. 2. ' +
        'Eftersom entreprenoren ansvarar for projekteringen, ska andringar som paverkar funktionskraven godkannas av bestallaren. ' +
        'Kostnadsforslagen for ATA ska innefatta bade projekterings- och utforandekostnader.',
      required: true,
    },
    {
      title: '5. Forsakring',
      content:
        'Entreprenoren ska teckna allriskforsakring samt ansvarsforsakring for bade projektering och utforande. ' +
        'Forsakringen ska galla under hela entreprenadtiden samt garantitiden.',
      required: true,
    },
    {
      title: '6. Garantier och funktionsansvar',
      content:
        'Garantitiden ar fem (5) ar for entreprenaden. ' +
        'Totalentreprenoren har utakat funktionsansvar enligt ABT 06 kap. 5, ' +
        'vilket innebar att entreprenoren ansvarar for att resultatet uppfyller avtalade funktionskrav. ' +
        'Ansvaret for projekteringsfel foljer ABT 06:s regler om funktionsansvar.',
      required: true,
    },
    {
      title: '7. Tvistelasning',
      content:
        'Tvister avgorande sker enligt ABT 06 kap. 10. ' +
        'Parterna ska i forsta hand soka lasning genom forhandling. ' +
        'I andra hand avgaras tvisten av allman domstol eller genom skiljeforfarande.',
      required: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// Consumer — Simplified template per Konsumenttjanstlagen
// ---------------------------------------------------------------------------

export const CONSUMER_TEMPLATE: ContractTemplate = {
  id: 'consumer',
  name: 'Konsumentavtal — Hantverkstjanst',
  standard: 'consumer',
  description:
    'Forenklat avtal for hantverkstjanster riktade till konsumenter (privatpersoner) enligt Konsumenttjanstlagen (1985:716).',
  sections: [
    {
      title: '1. Parter',
      content:
        'Bestallare: {{client_name}}\n' +
        'Entreprenor: {{contractor_name}}\n\n' +
        'Arbetet avser: {{project_name}}',
      required: true,
    },
    {
      title: '2. Arbetsbeskrivning och pris',
      content:
        'Overenskommet pris: {{contract_sum}} SEK inklusive moms. ' +
        'Priset ar fast om inget annat avtalats. ' +
        'Tillkommande arbeten (ATA) ska godkannas skriftligen av bestallaren innan de paborjas. ' +
        'Enligt Konsumenttjanstlagen far priset inte overskrida uppgivet pris vasentligt utan konsumentens godkannande.',
      required: true,
    },
    {
      title: '3. Tid for utforande',
      content:
        'Arbetet paborjas: {{start_date}}\n' +
        'Beraknad fardighallning: {{end_date}}\n\n' +
        'Entreprenoren ska utfora arbetet inom avtalad tid. ' +
        'Vid forsening har konsumenten ratt till prisavdrag eller havning enligt Konsumenttjanstlagen.',
      required: true,
    },
    {
      title: '4. Betalning',
      content:
        'Betalning sker efter utfort och godkant arbete om inget annat avtalats. ' +
        'Entreprenoren har ratt att begara delbetalning for utfort arbete. ' +
        'Konsumenten har ratt att halla inne betalning vid fel i tjansten.',
      required: true,
    },
    {
      title: '5. Angeratt och reklamation',
      content:
        'Konsumenten har ratt att avbestalla tjansten nar som helst, men kan bli skyldig att betala for redan utfort arbete. ' +
        'Reklamation av fel ska ske inom skalig tid efter att felet upptackts. ' +
        'Entreprenoren ansvarar for fel som visar sig inom tva (2) ar efter godkand slutbesiktning.',
      required: true,
    },
    {
      title: '6. Tvistelasning',
      content:
        'Tvister avgorande sker i forsta hand genom kontakt med entreprenoren. ' +
        'Konsumenten kan aven vanda sig till Allmanna Reklamationsnamnden (ARN) eller allman domstol.',
      required: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// Simple Client — Enkel kundavtal for smaller consumer/client jobs
// ---------------------------------------------------------------------------

export const SIMPLE_CLIENT_TEMPLATE: ContractTemplate = {
  id: 'simple-client',
  name: 'Enkel kundavtal',
  standard: 'consumer',
  description:
    'Enkelt kundavtal lampat for mindre uppdrag dar ett forenklat avtal racker.',
  sections: [
    {
      title: '1. Parter',
      content:
        'Bestallare: {{client_name}}\nEntreprenor: {{contractor_name}}\n\nProjektet avser: {{project_name}}',
      required: true,
    },
    {
      title: '2. Arbetsbeskrivning',
      content:
        'Entreprenoren ska utfora foljande arbeten:\n\n[Beskriv arbetet har — material, metod, omfattning]\n\nArbetet utfors pa: [adress]',
      required: true,
    },
    {
      title: '3. Pris och betalning',
      content:
        'Overenskommet pris: {{contract_sum}} SEK exklusive moms.\n\nBetalningsvillkor:\n- 30% vid kontraktsskrivning\n- 40% vid halvfardigt arbete\n- 30% vid godkand slutbesiktning\n\nBetalning sker inom 30 dagar fran fakturadatum.',
      required: true,
    },
    {
      title: '4. Tidplan',
      content:
        'Arbetet paborjas: {{start_date}}\nBeraknad fardighallning: {{end_date}}\n\nVid forsening som inte beror pa bestallaren har bestallaren ratt till skadestand.',
      required: true,
    },
    {
      title: '5. Garanti',
      content:
        'Entreprenoren garanterar utfort arbete i tva (2) ar fran godkand slutbesiktning.\nGarantin omfattar bade arbete och material.\nReklamation ska ske skriftligen inom skalig tid fran det att felet upptacktes.',
      required: true,
    },
    {
      title: '6. Ovrigt',
      content:
        'Andringar och tillagg till detta avtal ska godkannas skriftligen av bada parter.\nTvister avgorande sker genom forhandling i forsta hand, darefter allman domstol.',
      required: true,
    },
  ],
}

// ---------------------------------------------------------------------------
// Subcontractor — Underentreprenorsavtal (AB04-based)
// ---------------------------------------------------------------------------

export const SUBCONTRACTOR_TEMPLATE: ContractTemplate = {
  id: 'subcontractor',
  name: 'Underentreprenorsavtal',
  standard: 'AB04',
  description:
    'Avtal mellan huvudentreprenor och underentreprenor for deluppdrag inom storre byggprojekt.',
  sections: [
    {
      title: '1. Parter',
      content:
        'Huvudentreprenor: {{contractor_name}}\nUnderentreprenor: [UE-foretag]\nOrg.nr: [UE org.nr]\n\nProjektet avser: {{project_name}}\nBestallare: {{client_name}}',
      required: true,
    },
    {
      title: '2. Uppdragsbeskrivning',
      content:
        'Underentreprenoren ska utfora foljande arbeten:\n\n[Beskriv uppdraget i detalj — ytor, material, metoder]\n\nArbetet ska utforas fackmannamassigt och i enlighet med gaellande branschregler.',
      required: true,
    },
    {
      title: '3. Ersattning och betalning',
      content:
        'Overenskommen ersattning: {{contract_sum}} SEK exklusive moms.\n\nFakturering sker manadsvis baserat pa utfort arbete.\nBetalningsvillkor: 30 dagar netto.\nUnderentreprenoren ska ha godkand F-skattsedel.',
      required: true,
    },
    {
      title: '4. Tid och tillganglighet',
      content:
        'Arbetet paborjas: {{start_date}}\nBeraknad fardighallning: {{end_date}}\n\nUnderentreprenoren ska folja huvudentreprenarens tidplan.\nForsening ska meddelas omedelbart och kan medfora viteskrav.',
      required: true,
    },
    {
      title: '5. Forsakring och ansvar',
      content:
        'Underentreprenoren ska inneha:\n- Ansvarsforsakring (minst 5 MSEK)\n- Allriskforsakring for eget arbete och material\n- Olycksfallsforsakring for egen personal\n\nBevis pa forsakring ska uppvisas fore arbetets start.',
      required: true,
    },
    {
      title: '6. Arbetsmiljo och KMA',
      content:
        'Underentreprenoren ska:\n- Folja huvudentreprenarens arbetsmiljoplan\n- Tillhandahalla egen skyddsutrustning\n- Delta i skyddsronder och byggmoten\n- Rapportera tillbud och olyckor omedelbart\n- Ha ID06-kort for all personal pa arbetsplatsen',
      required: true,
    },
    {
      title: '7. Uppsagning',
      content:
        'Avtalet kan sagas upp med 14 dagars skriftligt varsel.\nVid uppsagning har underentreprenoren ratt till ersattning for utfort arbete.\nHuvudentreprenoren har ratt att hava avtalet med omedelbar verkan vid vasentligt avtalsbrott.',
      required: true,
    },
  ],
}

/** All available contract templates. */
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  AB04_TEMPLATE,
  ABT06_TEMPLATE,
  CONSUMER_TEMPLATE,
  SIMPLE_CLIENT_TEMPLATE,
  SUBCONTRACTOR_TEMPLATE,
]

/**
 * Look up a template by id.
 */
export function getTemplateById(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.id === id)
}
