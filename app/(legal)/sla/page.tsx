import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Service Level Agreement (SLA) | Frost Bygg',
  description: 'Service Level Agreement för Frost Bygg - Uptime-garantier och supportåtaganden.',
}

export default function SLAPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Service Level Agreement (SLA)
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Version: <strong className="text-gray-900 dark:text-gray-200">v1.0</strong></span>
          <span>•</span>
          <span>Giltig från: <strong className="text-gray-900 dark:text-gray-200">2026-01-26</strong></span>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Frost Data AB</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p><strong>Organisationsnummer:</strong> 556954-1088</p>
          <p><strong>Adress:</strong> Skålbovägen 15, 827 53 Järvsö, Sverige</p>
          <p><strong>E-post (support):</strong> support@frostsolutions.se</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-300">
          Detta Service Level Agreement ("SLA") definierar servicenivåer och åtaganden för Frost Bygg. 
          Detta SLA är en del av våra Användarvillkor och gäller för alla kunder med aktiv prenumeration.
        </p>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Uptime-garanti</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Frost garanterar en månatlig uptime på minst 99,5%
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Detta innebär att Tjänsten ska vara tillgänglig minst 99,5% av tiden per kalendermånad.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1.1 Beräkning av uptime</h3>
            <p>Uptime beräknas enligt följande formel:</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-3">
              <code className="text-sm">
                Uptime % = ((Total tid - Nedtid) / Total tid) × 100
              </code>
            </div>
            <p>
              <strong>Total tid:</strong> Antal minuter i kalendermånaden<br />
              <strong>Nedtid:</strong> Antal minuter då Tjänsten inte är tillgänglig (exklusive exkluderade perioder)
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1.2 Definition av nedtid</h3>
            <p>
              Nedtid definieras som perioder då Tjänsten inte är tillgänglig för användare på grund av:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Serverfel eller infrastrukturfel från Frosts sida</li>
              <li>Databasfel eller databasnedtid</li>
              <li>Nätverksfel i Frosts infrastruktur</li>
              <li>Fel i Frosts applikationskod som gör Tjänsten oanvändbar</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1.3 Exkluderade perioder</h3>
            <p>Följande perioder räknas inte som nedtid:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Planerat underhåll med minst 48 timmars varsel</li>
              <li>Force majeure-händelser (naturkatastrofer, krig, etc.)</li>
              <li>Fel i tredje parts tjänster (t.ex. internetleverantörer) som är utanför Frosts kontroll</li>
              <li>Fel som orsakas av kundens egen utrustning eller nätverk</li>
              <li>Fel som orsakas av kundens egen kod eller konfiguration</li>
              <li>DDoS-attacker eller andra säkerhetshot som kräver omedelbar åtgärd</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Planerat underhåll</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost kan genomföra planerat underhåll för att uppdatera, förbättra eller underhålla Tjänsten.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Underhållsregler:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Maximal underhållstid:</strong> 4 timmar per kalendermånad</li>
              <li><strong>Varsel:</strong> Minst 48 timmars varsel via e-post och notis i Tjänsten</li>
              <li><strong>Tidpunkt:</strong> Underhåll utförs när möjligt under lågtrafikperioder (t.ex. nattetid)</li>
              <li><strong>Frekvens:</strong> Planerat underhåll genomförs normalt en gång per månad</li>
            </ul>
          </div>
          <p>
            Om planerat underhåll överskrider 4 timmar per månad kommer överskjutande tid att räknas 
            som nedtid och kan ge rätt till servicekrediter enligt avsnitt 4.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Supportåtaganden</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Frost tillhandahåller support via e-post (support@frostsolutions.se) och strävar efter 
            att svara på supportförfrågningar enligt följande tidsmål:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Prioritet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Beskrivning</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Svarstid</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">P1 - Kritisk</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Tjänsten är helt nere eller oanvändbar för alla användare</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">60 minuter</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400">P2 - Hög</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Större funktionalitet är nedsatt eller många användare påverkas</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">4 timmar</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-yellow-600 dark:text-yellow-400">P3 - Normal</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Mindre funktionalitet är nedsatt eller få användare påverkas</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">1 arbetsdag</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">P4 - Låg</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Allmänna frågor, förfrågningar om funktioner, dokumentation</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">3 arbetsdagar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Obs:</strong> Svarstider gäller under vardagar (måndag-fredag, 09:00-17:00 CET). 
              Supportförfrågningar som tas emot utanför dessa tider börjar räknas från nästa arbetsdag.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Servicekrediter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p>
            Om Frost inte uppfyller uptime-garantin på 99,5% per månad har du rätt till servicekrediter 
            enligt följande tabell:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Månatlig Uptime</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Servicekredit</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">99,0% - 99,49%</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">10% av månadsavgiften</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">98,0% - 98,99%</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">25% av månadsavgiften</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">&lt; 98,0%</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">50% av månadsavgiften</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.1 Beräkning av servicekredit</h3>
            <p>
              Servicekrediten beräknas baserat på månadsavgiften för den månad då uptime-garantin 
              inte uppfylldes. Servicekrediten krediteras automatiskt på nästa faktura.
            </p>
            <p>
              <strong>Exempel:</strong> Om din månadsavgift är 499 SEK och uptime var 98,5% i januari, 
              får du en servicekredit på 25% av 499 SEK = 124,75 SEK på februarifakturan.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.2 Maximal servicekredit</h3>
            <p>
              Den totala servicekrediten per månad är begränsad till högst 50% av månadsavgiften, 
              oavsett nedtidens längd.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4.3 Anspråk på servicekredit</h3>
            <p>
              För att ansöka om servicekredit måste du kontakta support@frostsolutions.se inom 30 dagar 
              efter slutet av den månad då uptime-garantin inte uppfylldes. Anspråket ska innehålla:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datum och tid för nedtiden</li>
              <li>Beskrivning av problemet</li>
              <li>Eventuella skärmdumpar eller loggar som stödjer anspråket</li>
            </ul>
            <p>
              Frost kommer att granska anspråket och kreditera servicekrediten på nästa faktura om 
              anspråket är giltigt.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Övervakning och rapportering</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost övervakar kontinuerligt Tjänstens tillgänglighet och prestanda. Frost förbehåller 
            sig rätten att använda tredje parts övervakningstjänster för att mäta uptime.
          </p>
          <p>
            Du kan begära en månadsrapport över uptime genom att kontakta support@frostsolutions.se. 
            Frost kommer att tillhandahålla sådan rapport inom 10 arbetsdagar efter begäran.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Begränsningar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Detta SLA gäller endast för Tjänsten som tillhandahålls av Frost. Detta SLA gäller inte för:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Tredje parts tjänster eller integrationer (t.ex. Fortnox, Visma)</li>
            <li>Fel i kundens egen utrustning eller nätverk</li>
            <li>Fel som orsakas av kundens egen kod eller konfiguration</li>
            <li>Force majeure-händelser</li>
            <li>DDoS-attacker eller andra säkerhetshot</li>
            <li>Fel i internetleverantörers nätverk</li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Ändringar av SLA</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost förbehåller sig rätten att ändra detta SLA med 30 dagars varsel. Ändringar kommer 
            att meddelas via e-post och genom en notis i Tjänsten.
          </p>
          <p>
            Om ändringarna är betydande och du inte godkänner dem kan du säga upp din prenumeration 
            innan ändringarna träder i kraft.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Om du har frågor om detta SLA, kontakta oss på support@frostsolutions.se
        </p>
        <p className="mt-2">
          Senast uppdaterad: 2026-01-26
        </p>
      </div>
    </div>
  )
}
