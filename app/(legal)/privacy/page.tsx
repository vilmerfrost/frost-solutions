import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Integritetspolicy | Frost Bygg',
  description: 'Integritetspolicy för Frost Bygg - Läs hur vi behandlar dina personuppgifter enligt GDPR.',
}

export default function PrivacyPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Integritetspolicy
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Version: <strong className="text-gray-900 dark:text-gray-200">v1.0</strong></span>
          <span>•</span>
          <span>Giltig från: <strong className="text-gray-900 dark:text-gray-200">2026-01-26</strong></span>
        </div>
      </div>

      {/* Controller Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personuppgiftsansvarig</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p><strong>Frost Data AB</strong></p>
          <p><strong>Organisationsnummer:</strong> 556954-1088</p>
          <p><strong>Adress:</strong> Skålbovägen 15, 827 53 Järvsö, Sverige</p>
          <p><strong>E-post (integritet):</strong> privacy@frostsolutions.se</p>
          <p><strong>E-post (juridik):</strong> legal@frostsolutions.se</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Innehållsförteckning</h2>
        <nav className="space-y-2">
          <a href="#section-1" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">1. Översikt</a>
          <a href="#section-2" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">2. Personuppgifter vi samlar in</a>
          <a href="#section-3" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">3. Ändamål och rättsliga grunder</a>
          <a href="#section-4" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">4. Delning och mottagare</a>
          <a href="#section-5" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">5. Internationella överföringar</a>
          <a href="#section-6" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">6. Lagring</a>
          <a href="#section-7" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">7. Dina GDPR-rättigheter</a>
          <a href="#section-8" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">8. Cookies och analys</a>
          <a href="#section-9" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">9. Säkerhet</a>
          <a href="#section-10" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">10. Kontakt och klagomål</a>
        </nav>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Översikt</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Denna integritetspolicy beskriver hur Frost Data AB ("Frost", "vi", "oss") samlar in, 
            använder, lagrar och skyddar dina personuppgifter när du använder Frost Bygg ("Tjänsten").
          </p>
          <p>
            Vi är personuppgiftsansvarig för behandlingen av personuppgifter enligt EU:s 
            dataskyddsförordning (GDPR). Vi respekterar din integritet och är engagerade i att 
            skydda dina personuppgifter.
          </p>
          <p>
            Genom att använda Tjänsten godkänner du behandlingen av dina personuppgifter enligt 
            denna integritetspolicy. Om du inte godkänner denna policy, får du inte använda Tjänsten.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Personuppgifter vi samlar in</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.1 Kategorier av personuppgifter</h3>
            <p>Vi samlar in följande kategorier av personuppgifter:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identitetsuppgifter:</strong> Namn, e-postadress, telefonnummer, organisationsnummer</li>
              <li><strong>Kontouppgifter:</strong> Användarnamn, lösenord (krypterat), inloggningshistorik</li>
              <li><strong>Företagsinformation:</strong> Företagsnamn, adress, organisationsnummer</li>
              <li><strong>Användningsdata:</strong> IP-adress, webbläsartyp, enhetstyp, användningsstatistik</li>
              <li><strong>Betalningsinformation:</strong> Betalningsmetod, faktureringsadress (behandlas av Stripe)</li>
              <li><strong>Kommunikationsdata:</strong> Meddelanden till support, feedback, e-postkorrespondens</li>
              <li><strong>Projektdata:</strong> Projektinformation, tidsrapporter, fakturor som du laddar upp</li>
              <li><strong>Medarbetaruppgifter:</strong> Namn, e-post, telefonnummer för medarbetare som du registrerar</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.2 Datasubjekt</h3>
            <p>Vi behandlar personuppgifter för följande datasubjekt:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Kunder:</strong> Personer som registrerar ett konto och använder Tjänsten</li>
              <li><strong>Medarbetare:</strong> Personer som registreras som medarbetare i Tjänsten av kunder</li>
              <li><strong>Kontakter:</strong> Personer som är kontakter hos kunder eller leverantörer</li>
              <li><strong>Användare:</strong> Personer som har åtkomst till Tjänsten genom ett kundkonto</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2.3 Källor</h3>
            <p>Vi samlar in personuppgifter från:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dig direkt när du registrerar ett konto eller använder Tjänsten</li>
              <li>Automatiskt när du använder Tjänsten (t.ex. IP-adress, användningsstatistik)</li>
              <li>Tredje part som du ger oss tillstånd att integrera med (t.ex. Fortnox, Visma)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Ändamål och rättsliga grunder</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>Vi behandlar dina personuppgifter för följande ändamål och rättsliga grunder:</p>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.1 Uppfylla avtal (GDPR Art. 6(1)(b))</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Leverera och underhålla Tjänsten</li>
              <li>Hantera ditt konto och prenumeration</li>
              <li>Processera betalningar</li>
              <li>Ge kundsupport</li>
              <li>Kommunisera med dig om Tjänsten</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.2 Berättigat intresse (GDPR Art. 6(1)(f))</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Förbättra och utveckla Tjänsten</li>
              <li>Analysera användningsmönster för att förbättra användarupplevelsen</li>
              <li>Förebygga bedrägerier och säkerhetshot</li>
              <li>Marknadsföring av liknande produkter och tjänster (du kan när som helst avanmäla dig)</li>
              <li>Teknisk support och felsökning</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.3 Rättslig förpliktelse (GDPR Art. 6(1)(c))</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uppfylla bokförings- och skatteregler (7 års lagring)</li>
              <li>Uppfylla domstolsbeslut och myndighetskrav</li>
              <li>Uppfylla GDPR och andra dataskyddslagar</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3.4 Samtycke (GDPR Art. 6(1)(a))</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nya funktioner och betafunktioner (du kan när som helst återkalla samtycket)</li>
              <li>Marknadsföring via e-post (du kan när som helst avanmäla dig)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Delning och mottagare</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Vi delar dina personuppgifter med följande tredje part (underleverantörer) för att 
            kunna leverera Tjänsten:
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
            Alla underleverantörer är kontrakterade enligt GDPR Art. 28 och är bundna av 
            konfidentialitets- och säkerhetsförpliktelser. Vi har ingått Data Processing Agreements 
            (DPA) med alla underleverantörer.
          </p>
          <p>
            Vi delar inte dina personuppgifter med tredje part för marknadsföring utan ditt 
            samtycke, förutom i de fall som krävs enligt lag.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Internationella överföringar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Vissa av våra underleverantörer är belägna utanför EU/EES. När vi överför 
            personuppgifter till tredje land använder vi följande säkerhetsåtgärder:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Contractual Clauses (SCC):</strong> EU-kommissionens standardavtalsklausuler</li>
            <li><strong>Data Privacy Framework (DPF):</strong> För överföringar till USA (Stripe, Google)</li>
            <li><strong>Adequacy Decisions:</strong> För länder som EU har bedömt ha adekvat dataskydd</li>
          </ul>
          <p>
            Du har rätt att få information om vilka säkerhetsåtgärder som används för internationella 
            överföringar. Kontakta oss på privacy@frostsolutions.se för mer information.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Lagring</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>Vi lagrar dina personuppgifter så länge det är nödvändigt för ändamålen som anges i denna policy:</p>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lagringsperioder</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Kontouppgifter:</strong> Så länge ditt konto är aktivt + 30 dagar efter uppsägning</li>
              <li><strong>Betalningsdata:</strong> 7 år (enligt svensk bokföringslagstiftning)</li>
              <li><strong>Fakturor och projektdata:</strong> Så länge ditt konto är aktivt + 7 år efter uppsägning</li>
              <li><strong>Användningsloggar:</strong> 90 dagar</li>
              <li><strong>Supportmeddelanden:</strong> 3 år efter sista kontakten</li>
              <li><strong>Marknadsföringsdata:</strong> Tills du avanmäler dig eller 3 år efter sista kontakten</li>
            </ul>
          </div>

          <p>
            Efter att lagringsperioden har gått ut kommer vi att radera eller anonymisera dina 
            personuppgifter, förutom i de fall där lagstiftning kräver längre lagring (t.ex. 
            bokföringslagar).
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Dina GDPR-rättigheter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>Enligt GDPR har du följande rättigheter:</p>
          
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.1 Rätt till tillgång (Art. 15)</h3>
              <p>Du har rätt att få en kopia av dina personuppgifter som vi behandlar.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.2 Rätt till rättelse (Art. 16)</h3>
              <p>Du har rätt att få felaktiga personuppgifter rättade.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.3 Rätt till radering (Art. 17)</h3>
              <p>Du har rätt att få dina personuppgifter raderade ("right to be forgotten"), 
              förutom när lagstiftning kräver lagring.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.4 Rätt till begränsning (Art. 18)</h3>
              <p>Du har rätt att begränsa behandlingen av dina personuppgifter under vissa omständigheter.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.5 Rätt till dataportabilitet (Art. 20)</h3>
              <p>Du har rätt att få dina personuppgifter i ett strukturerat, vanligt använt och 
              maskinläsbart format.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.6 Rätt att invända (Art. 21)</h3>
              <p>Du har rätt att invända mot behandling baserad på berättigat intresse eller 
              direktmarknadsföring.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.7 Rätt att återkalla samtycke (Art. 7)</h3>
              <p>Om behandlingen baseras på samtycke har du rätt att när som helst återkalla ditt samtycke.</p>
            </div>
          </div>

          <p className="mt-4">
            För att utöva dina rättigheter, kontakta oss på privacy@frostsolutions.se. Vi kommer 
            att svara på din begäran inom 30 dagar.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Cookies och analys</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Vi använder cookies och liknande tekniker för att förbättra användarupplevelsen och 
            analysera användningen av Tjänsten.
          </p>
          <p><strong>Typer av cookies vi använder:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Nödvändiga cookies:</strong> För autentisering och säkerhet (kan inte avaktiveras)</li>
            <li><strong>Funktionella cookies:</strong> För att komma ihåg dina inställningar</li>
            <li><strong>Analytiska cookies:</strong> För att analysera användningsmönster (anonymiserade)</li>
          </ul>
          <p>
            Du kan hantera cookies genom dina webbläsarinställningar. Observera att vissa funktioner 
            i Tjänsten kan påverkas om du avaktiverar cookies.
          </p>
        </div>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Säkerhet</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Vi implementerar lämpliga tekniska och organisatoriska åtgärder för att skydda dina 
            personuppgifter mot obehörig åtkomst, förlust, förstörelse eller ändring:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Kryptering i transit (TLS 1.2+)</li>
            <li>Kryptering vid lagring (AES-256)</li>
            <li>Regelbunden säkerhetsgranskning och sårbarhetsskanning</li>
            <li>Åtkomstkontroller med minsta privilegium</li>
            <li>Multi-factor authentication för administratörer</li>
            <li>Regelbundna säkerhetskopieringar</li>
            <li>Dokumenterad incidenthanteringsplan</li>
          </ul>
          <p>
            Trots våra säkerhetsåtgärder kan ingen system vara 100% säkert. Om du upptäcker en 
            säkerhetslucka, kontakta oss omedelbart på security@frostsolutions.se.
          </p>
        </div>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Kontakt och klagomål</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Om du har frågor om denna integritetspolicy eller vill utöva dina GDPR-rättigheter, 
            kontakta oss:
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p><strong>E-post:</strong> privacy@frostsolutions.se</p>
            <p><strong>Postadress:</strong> Frost Data AB, Skålbovägen 15, 827 53 Järvsö, Sverige</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">10.1 Klagomål till tillsynsmyndighet</h3>
            <p>
              Om du anser att vi behandlar dina personuppgifter i strid med GDPR har du rätt att 
              lämna ett klagomål till Integritetsskyddsmyndigheten (IMY):
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-2">
              <p><strong>Integritetsskyddsmyndigheten (IMY)</strong></p>
              <p>Box 8114, 104 20 Stockholm</p>
              <p>Telefon: 08-657 61 00</p>
              <p>E-post: imy@imy.se</p>
              <p>Webbplats: <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">www.imy.se</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Om du har frågor om denna integritetspolicy, kontakta oss på privacy@frostsolutions.se
        </p>
        <p className="mt-2">
          Senast uppdaterad: 2026-01-26
        </p>
      </div>
    </div>
  )
}
