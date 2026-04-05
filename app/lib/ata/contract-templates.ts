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

/** All available contract templates. */
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  AB04_TEMPLATE,
  ABT06_TEMPLATE,
  CONSUMER_TEMPLATE,
]

/**
 * Look up a template by id.
 */
export function getTemplateById(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.id === id)
}
