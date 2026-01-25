import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA) | Frost Bygg',
  description: 'Data Processing Agreement för Frost Bygg - GDPR Art. 28 compliant avtal för databehandling.',
}

export default function DPAPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Data Processing Agreement (DPA)
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Version: <strong className="text-gray-900 dark:text-gray-200">v1.0</strong></span>
          <span>•</span>
          <span>Giltig från: <strong className="text-gray-900 dark:text-gray-200">2026-01-26</strong></span>
        </div>
      </div>

      {/* Parties Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Parter</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <div>
            <p><strong>Personuppgiftsansvarig:</strong> Kunden (den som använder Frost Bygg)</p>
          </div>
          <div>
            <p><strong>Databehandlare:</strong> Frost Data AB</p>
            <p><strong>Organisationsnummer:</strong> 556954-1088</p>
            <p><strong>Adress:</strong> Skålbovägen 15, 827 53 Järvsö, Sverige</p>
            <p><strong>E-post:</strong> legal@frostsolutions.se</p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-300">
          Detta Data Processing Agreement ("DPA") reglerar behandlingen av personuppgifter när du använder 
          Frost Bygg. Detta DPA är en del av våra Användarvillkor och följer kraven i GDPR Art. 28.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Genom att använda Frost Bygg godkänner du detta DPA. Om du inte godkänner detta DPA, 
          får du inte använda Tjänsten.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Ämne och varaktighet</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Detta DPA reglerar behandlingen av personuppgifter som du (Personuppgiftsansvarig) laddar 
            upp eller på annat sätt tillhandahåller genom användning av Frost Bygg.
          </p>
          <p>
            Detta DPA gäller från det datum då du börjar använda Tjänsten och tills ditt konto 
            avslutas och alla personuppgifter har raderats eller returnerats enligt avsnitt 10.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Art och ändamål</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost agerar som databehandlare och behandlar personuppgifter för följande ändamål:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Leverera och underhålla Frost Bygg-tjänsten</li>
            <li>Hantera användarkonton och autentisering</li>
            <li>Processera och lagra projektdata, fakturor och tidsrapporter</li>
            <li>Ge kundsupport och tekniskt stöd</li>
            <li>Processera betalningar (via Stripe)</li>
            <li>Skicka e-postmeddelanden och notifikationer</li>
            <li>Förbättra och utveckla Tjänsten</li>
          </ul>
          <p>
            Frost behandlar personuppgifter endast i enlighet med dina instruktioner och detta DPA, 
            samt enligt GDPR och annan tillämplig dataskyddslagstiftning.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Kategorier av datasubjekt och personuppgifter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.1 Datasubjekt</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kunder (personer som registrerar ett konto)</li>
              <li>Medarbetare (personer som registreras som medarbetare i Tjänsten)</li>
              <li>Kontakter (personer som är kontakter hos kunder eller leverantörer)</li>
              <li>Användare (personer som har åtkomst till Tjänsten genom ett kundkonto)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.2 Kategorier av personuppgifter</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Identitetsuppgifter: Namn, e-postadress, telefonnummer</li>
              <li>Kontouppgifter: Användarnamn, lösenord (krypterat)</li>
              <li>Företagsinformation: Företagsnamn, adress, organisationsnummer</li>
              <li>Användningsdata: IP-adress, användningsstatistik</li>
              <li>Projektdata: Projektinformation, tidsrapporter, fakturor</li>
              <li>Betalningsinformation: Faktureringsadress (behandlas av Stripe)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Personuppgiftsansvarigas skyldigheter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>Du (Personuppgiftsansvarig) är ansvarig för att:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Se till att du har rätt att behandla personuppgifterna som du laddar upp till Tjänsten</li>
            <li>Se till att du har lämplig rättslig grund för behandlingen (GDPR Art. 6)</li>
            <li>Informera datasubjekten om behandlingen enligt GDPR Art. 13-14</li>
            <li>Se till att datasubjekten har lämnat nödvändigt samtycke där så krävs</li>
            <li>Uppfylla alla andra skyldigheter som personuppgiftsansvarig enligt GDPR</li>
            <li>Ge tydliga instruktioner till Frost om hur personuppgifterna ska behandlas</li>
            <li>Informera Frost omedelbart om något datasubjekt återkallar samtycke eller invänder mot behandling</li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Databehandlarens skyldigheter (GDPR Art. 28)</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.1 Behandling enligt instruktioner</h3>
            <p>
              Frost behandlar personuppgifter endast i enlighet med dina instruktioner och detta DPA, 
              samt enligt GDPR. Frost kommer inte att behandla personuppgifterna för andra ändamål 
              än de som anges i detta DPA utan ditt skriftliga medgivande.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.2 Konfidentialitet</h3>
            <p>
              Frost säkerställer att personer som har behörighet att behandla personuppgifterna är 
              bundna av konfidentialitetsförpliktelser eller är föremål för en lämplig lagstadgad 
              tystnadsplikt (GDPR Art. 28(3)(b)).
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.3 Säkerhetsåtgärder</h3>
            <p>
              Frost implementerar lämpliga tekniska och organisatoriska åtgärder för att säkerställa 
              ett skyddsnivå som är lämplig för risken (GDPR Art. 32). Se Bilaga 2 för detaljerade 
              tekniska och organisatoriska åtgärder.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5.4 Underleverantörer</h3>
            <p>
              Frost får använda underleverantörer för att behandla personuppgifter, förutsatt att 
              Frost informerar dig om eventuella planerade ändringar av underleverantörer och ger 
              dig möjlighet att invända mot sådana ändringar (GDPR Art. 28(2)). Se Bilaga 1 för 
              lista över underleverantörer.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Underleverantörer</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Frost använder följande underleverantörer för att leverera Tjänsten. Alla underleverantörer 
            är kontrakterade enligt GDPR Art. 28 och är bundna av konfidentialitets- och säkerhetsförpliktelser.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Underleverantör</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Tjänst</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Plats</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Data som behandlas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Säkerhetsåtgärd</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Supabase Inc.</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Databas, autentisering</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">EU (Frankfurt/Irland)</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Kunddata, autentiseringsdata</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">SCC</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Stripe Inc.</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Betalningshantering</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">EU/US</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Faktureringsdata, korttokens</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">DPF + SCC</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Resend Corp.</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">E-postleverans</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">EU/US</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">E-postadresser, innehåll</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">SCC</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Vercel Inc.</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Applikationshosting</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Global (EU-region prioriteras)</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Applikationsdata</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">SCC</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Google LLC</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">AI-behandling (Gemini 2.0)</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Global</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Fakturadata (tillfälligt)</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">DPF + SCC</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            Om Frost planerar att lägga till eller ändra underleverantörer kommer Frost att informera 
            dig minst 30 dagar i förväg. Du har rätt att invända mot ändringar av underleverantörer. 
            Om du invänder och parterna inte kan komma överens om en lösning, kan du säga upp detta DPA.
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Personuppgiftsincidenter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost kommer att informera dig omedelbart, men senast inom 72 timmar efter att Frost har 
            blivit medveten om en personuppgiftsincident som påverkar dina personuppgifter (GDPR Art. 33(2)).
          </p>
          <p>
            Meddelandet ska innehålla:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Beskrivning av incidenten och de berörda personuppgifterna</li>
            <li>Konsekvenser av incidenten</li>
            <li>Åtgärder som Frost har vidtagit eller planerar att vidta för att åtgärda incidenten</li>
            <li>Kontaktuppgifter för vidare frågor</li>
          </ul>
          <p>
            Frost kommer att bistå dig med att uppfylla dina skyldigheter enligt GDPR Art. 33-34 
            (meddelande till tillsynsmyndighet och berörda personer).
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Bistånd med datasubjektsförfrågningar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost kommer att bistå dig med att uppfylla dina skyldigheter enligt GDPR Art. 12-23 
            (datasubjekts rättigheter) genom att tillhandahålla tekniska och organisatoriska åtgärder 
            (GDPR Art. 28(3)(e)).
          </p>
          <p>
            Om Frost får en förfrågan direkt från ett datasubjekt kommer Frost att vidarebefordra 
            förfrågan till dig och inte svara direkt, om inte lagstiftning kräver annat.
          </p>
          <p>
            Frost kommer att bistå dig med att:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ge tillgång till personuppgifter (GDPR Art. 15)</li>
            <li>Rättelse av personuppgifter (GDPR Art. 16)</li>
            <li>Radering av personuppgifter (GDPR Art. 17)</li>
            <li>Begränsning av behandling (GDPR Art. 18)</li>
            <li>Dataportabilitet (GDPR Art. 20)</li>
          </ul>
        </div>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Bistånd med säkerhet och DPIA</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost kommer att bistå dig med att uppfylla dina skyldigheter enligt GDPR Art. 32-36 
            (säkerhet, meddelande om personuppgiftsincidenter, dataskyddskonsekvensanalys, förhandskonsultation).
          </p>
          <p>
            Frost kommer att tillhandahålla information som behövs för att du ska kunna genomföra 
            en dataskyddskonsekvensanalys (DPIA) enligt GDPR Art. 35.
          </p>
        </div>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Radering eller återlämnande</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Efter att detta DPA har upphört eller på din begäran kommer Frost att radera alla 
            personuppgifter och kopior därav, eller återlämna dem till dig, inom 30 dagar, 
            om inte lagstiftning kräver lagring (GDPR Art. 28(3)(g)).
          </p>
          <p>
            Om lagstiftning kräver att Frost behåller personuppgifterna kommer Frost att informera 
            dig om detta och kommer att fortsätta att skydda personuppgifterna enligt detta DPA.
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="section-11" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Granskning och certifiering</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost gör dokumentationen om behandlingen tillgänglig för granskning av tillsynsmyndigheter 
            (GDPR Art. 28(3)(h)).
          </p>
          <p>
            Du har rätt att genomföra granskningar av Frosts behandling av personuppgifter, men inte 
            oftare än en gång per år, om inte särskilda omständigheter kräver annat. Granskningar ska 
            ske med minst 30 dagars varsel och ska inte störa Frosts verksamhet.
          </p>
          <p>
            Frost kan tillhandahålla certifieringar eller granskningsrapporter från tredje part 
            (t.ex. SOC 2, ISO 27001) som bevis på säkerhetsåtgärderna, vilket kan ersätta en direkt 
            granskning om du accepterar detta.
          </p>
        </div>
      </section>

      {/* Section 12 */}
      <section id="section-12" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Internationella överföringar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Vissa av Frosts underleverantörer är belägna utanför EU/EES. När personuppgifter överförs 
            till tredje land använder Frost följande säkerhetsåtgärder:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Contractual Clauses (SCC):</strong> EU-kommissionens standardavtalsklausuler</li>
            <li><strong>Data Privacy Framework (DPF):</strong> För överföringar till USA (Stripe, Google)</li>
            <li><strong>Adequacy Decisions:</strong> För länder som EU har bedömt ha adekvat dataskydd</li>
          </ul>
          <p>
            Frost säkerställer att alla internationella överföringar följer GDPR Art. 44-49.
          </p>
        </div>
      </section>

      {/* Section 13 */}
      <section id="section-13" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Ansvar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost är ansvarig för skador som uppstår på grund av brott mot detta DPA eller GDPR, 
            förutsatt att Frost inte kan bevisa att det inte är ansvarigt för händelsen som gav 
            upphov till skadan (GDPR Art. 82).
          </p>
          <p>
            Frosts totala ansvar gentemot dig för alla skador och förluster är begränsat till högst 
            12 månaders avgifter som du har betalat till Frost under de 12 månader som föregår det 
            anspråk som ger upphov till ansvaret.
          </p>
        </div>
      </section>

      {/* Annex 1 */}
      <section id="annex-1" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Bilaga 1: Underleverantörer</h2>
        <div className="text-gray-700 dark:text-gray-300">
          <p>
            Se avsnitt 6 ovan för lista över underleverantörer och deras behandling av personuppgifter.
          </p>
        </div>
      </section>

      {/* Annex 2 */}
      <section id="annex-2" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Bilaga 2: Tekniska och organisatoriska åtgärder (TOMs)</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.1 Kryptering</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Kryptering i transit:</strong> TLS 1.2+ för all kommunikation</li>
              <li><strong>Kryptering vid lagring:</strong> AES-256 eller molnleverantörens hanterade kryptering</li>
              <li><strong>Databas:</strong> Krypterad databas med automatisk rotation av nycklar</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.2 Åtkomstkontroller</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Principen om minsta privilegium:</strong> Användare får endast åtkomst till data de behöver</li>
              <li><strong>Multi-factor authentication (MFA):</strong> Krävs för administratörer</li>
              <li><strong>Åtkomstloggning:</strong> Alla åtkomster loggas och granskas regelbundet</li>
              <li><strong>Automatisk timeout:</strong> Sessioner timeout efter inaktivitet</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.3 Sårbarhetshantering</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Regelbunden patching:</strong> Säkerhetsuppdateringar installeras regelbundet</li>
              <li><strong>Sårbarhetsskanning:</strong> Automatisk sårbarhetsskanning av infrastruktur</li>
              <li><strong>Penetrationstestning:</strong> Årlig penetrationstestning av externa säkerhetsfirmor</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.4 Säkerhetskopiering</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dagliga säkerhetskopior:</strong> Automatiska dagliga säkerhetskopior</li>
              <li><strong>Testad återställning:</strong> Säkerhetskopior testas regelbundet</li>
              <li><strong>Lagring:</strong> Säkerhetskopior lagras separat och krypterat</li>
              <li><strong>Retention:</strong> 30 dagars retention för säkerhetskopior</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.5 Incidenthantering</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dokumenterad plan:</strong> Incidenthanteringsplan för personuppgiftsincidenter</li>
              <li><strong>Snabb respons:</strong> Incidentteam som kan aktiveras 24/7</li>
              <li><strong>Kommunikation:</strong> Process för att informera kunder inom 72 timmar</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.6 Datasegregation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Tenant isolation:</strong> Data isoleras per kund (tenant)</li>
              <li><strong>Logisk separation:</strong> Databasnivå separation mellan kunder</li>
              <li><strong>Row Level Security:</strong> RLS policies för att säkerställa åtkomstkontroll</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.7 Säker utveckling</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Code review:</strong> All kod granskas innan deployment</li>
              <li><strong>Secrets management:</strong> Hemligheter hanteras säkert (ingen hårdkodning)</li>
              <li><strong>Dependency scanning:</strong> Automatisk sårbarhetsskanning av dependencies</li>
              <li><strong>Secure SDLC:</strong> Säkerhet integrerad i utvecklingsprocessen</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Om du har frågor om detta DPA, kontakta oss på legal@frostsolutions.se
        </p>
        <p className="mt-2">
          Senast uppdaterad: 2026-01-26
        </p>
      </div>
    </div>
  )
}
