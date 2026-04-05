export interface RiskTemplate {
  id: string
  name: string
  workType: string
  risks: Array<{
    hazard: string
    consequence: string
    probability: 'low' | 'medium' | 'high'
    severity: 'low' | 'medium' | 'high'
    mitigation: string
  }>
}

export const RISK_TEMPLATES: RiskTemplate[] = [
  {
    id: 'takarbete',
    name: 'Takarbete',
    workType: 'Takarbete (roofing)',
    risks: [
      {
        hazard: 'Fall från höjd',
        consequence: 'Allvarlig skada eller dödsfall',
        probability: 'high',
        severity: 'high',
        mitigation: 'Fallskydd, säkerhetssele, skyddsräcken och takbryggor ska användas. Arbete avbryts vid stark vind.',
      },
      {
        hazard: 'Väderexponering (vind, regn, is)',
        consequence: 'Halkolyckor, nedkylning',
        probability: 'medium',
        severity: 'medium',
        mitigation: 'Kontrollera väderprognos innan arbetsstart. Halkskydd på skor. Avbryt vid dåligt väder.',
      },
      {
        hazard: 'Fallande material och verktyg',
        consequence: 'Skada på personal nedanför',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Avspärrning nedanför arbetsområdet. Verktygsfästen. Hjälm obligatorisk i området.',
      },
    ],
  },
  {
    id: 'rivning',
    name: 'Rivning',
    workType: 'Rivning (demolition)',
    risks: [
      {
        hazard: 'Damm och asbest',
        consequence: 'Lungsjukdomar, cancer',
        probability: 'high',
        severity: 'high',
        mitigation: 'Asbestinventering före rivning. Andningsskydd (P3-filter). Sanering av behörig firma vid asbest.',
      },
      {
        hazard: 'Konstruktionskollaps',
        consequence: 'Allvarlig skada eller dödsfall',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Konstruktionsbedömning av sakkunnig. Stegvis rivning. Avstängning av riskområden.',
      },
      {
        hazard: 'Exponering för farliga ämnen (bly, PCB)',
        consequence: 'Förgiftning, hudskador',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Materialinventering. Personlig skyddsutrustning. Provtagning innan rivning.',
      },
    ],
  },
  {
    id: 'elarbete',
    name: 'Elarbete',
    workType: 'Elarbete (electrical)',
    risks: [
      {
        hazard: 'Elektrisk stöt',
        consequence: 'Brännskador, hjärtstillestånd, dödsfall',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Frånskiljning och låsning av strömkälla. Spänningsmätning före arbete. Behörig elektriker.',
      },
      {
        hazard: 'Brand genom kortslutning',
        consequence: 'Brand, egendomsskada',
        probability: 'low',
        severity: 'high',
        mitigation: 'Dubbelkontroll av kopplingar. Brandsläckare tillgänglig. Jordfelsbrytare.',
      },
      {
        hazard: 'Ljusbåge (arc flash)',
        consequence: 'Allvarliga brännskador, blindhet',
        probability: 'low',
        severity: 'high',
        mitigation: 'Ljusbågeskydd (PPE). Arbete på spänningsfria anläggningar. Riskbedömning av energinivåer.',
      },
    ],
  },
  {
    id: 'gravarbete',
    name: 'Grävarbete',
    workType: 'Grävarbete (excavation)',
    risks: [
      {
        hazard: 'Ras i schakt',
        consequence: 'Begravning, kvävning, dödsfall',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Spontning vid djup >1,5m. Daglig inspektion av schaktkanter. Ingen uppställning av material vid kant.',
      },
      {
        hazard: 'Skada på underjordiska ledningar',
        consequence: 'Gasläcka, elolycka, vattenläcka',
        probability: 'medium',
        severity: 'high',
        mitigation: 'Ledningsanvisning (LU) före grävstart. Handgrävning nära ledningar. Markera ledningar.',
      },
      {
        hazard: 'Maskinolyckor',
        consequence: 'Klämskador, överrullning',
        probability: 'low',
        severity: 'high',
        mitigation: 'Avspärrning kring maskiner. Signalerare vid backning. Operatörsbehörighet.',
      },
    ],
  },
  {
    id: 'heta-arbeten',
    name: 'Heta arbeten',
    workType: 'Heta arbeten (hot work)',
    risks: [
      {
        hazard: 'Brand från gnistor och svetsflammor',
        consequence: 'Okontrollerad brand, egendomsskada',
        probability: 'high',
        severity: 'high',
        mitigation: 'Tillstånd för heta arbeten. Brandvakt under och 1h efter arbete. Avlägsna brännbart material.',
      },
      {
        hazard: 'Brännskador',
        consequence: 'Hud- och ögonbrännskador',
        probability: 'medium',
        severity: 'medium',
        mitigation: 'Svetshjälm, skyddshandskar, flamskyddskläder. Avskärmning av arbetsplats.',
      },
      {
        hazard: 'Gasexponering (svetsrök, acetylen)',
        consequence: 'Andningsbesvär, förgiftning',
        probability: 'medium',
        severity: 'medium',
        mitigation: 'God ventilation eller punktutsug. Andningsskydd vid otillräcklig ventilation. Gasvarnare.',
      },
    ],
  },
]
