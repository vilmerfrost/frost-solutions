import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Användarvillkor | Frost Bygg',
  description: 'Användarvillkor för Frost Bygg - Läs våra villkor för användning av tjänsten.',
}

export default function TermsPage() {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Användarvillkor
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Version: <strong className="text-gray-900 dark:text-gray-200">v1.0</strong></span>
          <span>•</span>
          <span>Giltig från: <strong className="text-gray-900 dark:text-gray-200">2026-01-26</strong></span>
        </div>
      </div>

      {/* Company Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Frost Data AB</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p><strong>Organisationsnummer:</strong> 556954-1088</p>
          <p><strong>Adress:</strong> Skålbovägen 15, 827 53 Järvsö, Sverige</p>
          <p><strong>E-post (juridik):</strong> legal@frostsolutions.se</p>
          <p><strong>E-post (support):</strong> support@frostsolutions.se</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Innehållsförteckning</h2>
        <nav className="space-y-2">
          <a href="#section-1" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">1. Parter och godkännande</a>
          <a href="#section-2" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">2. Definitioner</a>
          <a href="#section-3" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">3. Tjänsten</a>
          <a href="#section-4" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">4. Kundens skyldigheter</a>
          <a href="#section-5" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">5. Acceptabel användning</a>
          <a href="#section-6" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">6. Avstängning och uppsägning</a>
          <a href="#section-7" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">7. Avgifter och betalning</a>
          <a href="#section-8" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">8. Immateriella rättigheter</a>
          <a href="#section-9" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">9. Dataskydd</a>
          <a href="#section-10" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">10. Sekretess</a>
          <a href="#section-11" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">11. Garantier och friskrivningar</a>
          <a href="#section-12" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">12. Ansvarsbegränsning</a>
          <a href="#section-13" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">13. Skadestånd</a>
          <a href="#section-14" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">14. Ändringar</a>
          <a href="#section-15" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">15. Tillämplig lag</a>
          <a href="#section-16" className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">16. Meddelanden</a>
        </nav>
      </div>

      {/* Section 1 */}
      <section id="section-1" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Parter och godkännande</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Dessa användarvillkor ("Villkor") reglerar användningen av Frost Bygg ("Tjänsten"), 
            en molnbaserad programvara för byggföretag som tillhandahålls av Frost Data AB, 
            organisationsnummer 556954-1088 ("Frost", "vi", "oss").
          </p>
          <p>
            Genom att registrera ett konto, logga in eller på annat sätt använda Tjänsten godkänner 
            du dessa Villkor och förbinder dig att följa dem. Om du inte godkänner dessa Villkor, 
            får du inte använda Tjänsten.
          </p>
          <p>
            Om du registrerar ett konto å företagets vägnar bekräftar du att du har behörighet att 
            ingå dessa Villkor å företagets vägnar och att företaget är bundet av dessa Villkor.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="section-2" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Definitioner</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p><strong>"Kunddata"</strong> avser all data, information och innehåll som du eller dina användare laddar upp, 
          skapar eller annars tillhandahåller genom Tjänsten, inklusive men inte begränsat till projektdata, 
          fakturor, tidsrapporter, kundinformation och medarbetaruppgifter.</p>
          
          <p><strong>"Personuppgifter"</strong> avser personuppgifter enligt GDPR (EU:s dataskyddsförordning) som 
          behandlas genom Tjänsten, inklusive men inte begränsat till namn, e-postadresser, telefonnummer, 
          personnummer och andra identifieringsuppgifter.</p>
          
          <p><strong>"Dokumentation"</strong> avser all dokumentation, användarhandböcker, API-dokumentation 
          och annat material som Frost tillhandahåller i samband med Tjänsten.</p>
          
          <p><strong>"Användare"</strong> avser alla personer som har åtkomst till Tjänsten genom ditt konto, 
          inklusive administratörer, medarbetare och andra användare.</p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="section-3" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Tjänsten</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost Bygg är en molnbaserad programvara för byggföretag som förenklar tidrapportering, 
            projekthantering, och fakturering. Tjänsten inkluderar följande funktioner:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI-driven fakturaläsning och automatisk datainmatning</li>
            <li>Automatiska OB-beräkningar (kväll, natt, helg)</li>
            <li>ROT/RUT-avdragshantering</li>
            <li>Integrationer med Fortnox och Visma</li>
            <li>Tidsrapportering och projekthantering</li>
            <li>Fakturering och kundhantering</li>
            <li>Medarbetarhantering</li>
            <li>Rapporter och analysverktyg</li>
          </ul>
          <p>
            Frost förbehåller sig rätten att ändra, uppdatera eller ta bort funktioner i Tjänsten 
            med 30 dagars varsel. Frost strävar efter att hålla Tjänsten tillgänglig 99,5% av tiden 
            per månad, enligt vårt Service Level Agreement (SLA).
          </p>
          <p>
            Frost tillhandahåller Tjänsten "som den är" och gör inga garantier om att Tjänsten 
            kommer att uppfylla dina specifika krav eller vara tillgänglig utan avbrott.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section id="section-4" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Kundens skyldigheter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>Du är ansvarig för:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Att hålla ditt konto och lösenord säkert och konfidentiellt</li>
            <li>Att säkerställa att alla användare under ditt konto följer dessa Villkor</li>
            <li>Att tillhandahålla korrekt och uppdaterad information om dig och ditt företag</li>
            <li>Att säkerställa att du har rätt att ladda upp och behandla all data som laddas upp till Tjänsten</li>
            <li>Att följa alla tillämpliga lagar och förordningar, inklusive GDPR, vid användning av Tjänsten</li>
            <li>Att säkerställa att du har rätt att behandla personuppgifter som laddas upp till Tjänsten</li>
            <li>Att säkerställa att dina användare har lämnat nödvändigt samtycke för behandling av personuppgifter</li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section id="section-5" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Acceptabel användning</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>Du får inte:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Använda Tjänsten på något sätt som bryter mot tillämpliga lagar eller förordningar</li>
            <li>Ladda upp, skicka eller på annat sätt distribuera skadlig kod, virus eller malware</li>
            <li>Försöka få obehörig åtkomst till Tjänsten eller relaterade system</li>
            <li>Använda Tjänsten för att skicka spam, phishing eller annat bedrägerierelaterat innehåll</li>
            <li>Kopiera, modifiera eller skapa härledda verk baserade på Tjänsten utan Frosts skriftliga tillstånd</li>
            <li>Använda Tjänsten för att konkurrera med Frost eller för att utveckla konkurrerande produkter</li>
            <li>Reverse engineer, dekompilera eller disassemblera Tjänsten</li>
            <li>Använda automatiserade system (bots, scrapers) för att komma åt Tjänsten utan tillstånd</li>
            <li>Överbelasta eller försöka störa Tjänstens funktionalitet</li>
          </ul>
          <p className="font-semibold mt-4">Begränsningar för AI och maskininlärning:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Du får inte använda Tjänsten eller dess data för att träna, utveckla eller förbättra AI-modeller eller maskininlärningssystem</li>
            <li>Du får inte extrahera data från Tjänsten för användning i AI-träningssyfte</li>
            <li>Du får inte använda Tjänsten för att skapa konkurrerande AI-drivna produkter eller tjänster</li>
            <li>Alla AI-funktioner i Tjänsten är endast för din interna användning och får inte användas för att skapa externa AI-tjänster</li>
          </ul>
          <p>
            Brott mot dessa regler kan leda till omedelbar avstängning av ditt konto utan återbetalning.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section id="section-6" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Avstängning och uppsägning</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Du kan när som helst säga upp ditt konto genom att kontakta support@frostsolutions.se. 
            Vid uppsägning kommer ditt konto att avslutas vid slutet av den aktuella faktureringsperioden.
          </p>
          <p>
            Frost kan omedelbart avstänga eller säga upp ditt konto om du:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bryter mot dessa Villkor eller Acceptable Use Policy</li>
            <li>Inte betalar avgifter när de förfaller</li>
            <li>Använder Tjänsten på ett sätt som kan skada Frost eller andra användare</li>
            <li>Är inblandad i bedrägerier eller annan olaglig verksamhet</li>
          </ul>
          <p>
            Vid uppsägning eller avstängning kommer du att förlora åtkomst till ditt konto och all data 
            kan raderas efter 30 dagar. Du är ansvarig för att exportera din data innan uppsägningen träder i kraft.
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="section-7" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Avgifter och betalning</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Tjänsten debiteras med en månadsavgift på 499 SEK per månad per konto. Avgiften debiteras 
            i förskott för varje månad och är icke-återbetalningsbar.
          </p>
          <p>
            Alla priser är exklusive moms. Moms tillkommer enligt gällande svensk lagstiftning.
          </p>
          <p>
            Om betalningen misslyckas kan Frost avstänga ditt konto tills betalningen är klar. 
            Frost förbehåller sig rätten att ändra priser med 30 dagars varsel.
          </p>
          <p>
            Du kan när som helst säga upp din prenumeration utan bindningstid. Vid uppsägning kommer 
            din prenumeration att fortsätta till slutet av den aktuella faktureringsperioden.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="section-8" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Immateriella rättigheter</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Tjänsten, inklusive all mjukvara, kod, design, varumärken och annat immateriellt innehåll, 
            är och förblir Frosts egendom eller dess licensgivares egendom.
          </p>
          <p>
            Du får endast använda Tjänsten enligt dessa Villkor och har inga rättigheter att kopiera, 
            modifiera eller distribuera Tjänsten utan Frosts skriftliga tillstånd.
          </p>
          <p>
            Du behåller alla rättigheter till dina Kunddata. Genom att använda Tjänsten beviljar du 
            dock Frost en icke-exklusiv licens att använda, lagra och behandla dina Kunddata för att 
            tillhandahålla och förbättra Tjänsten.
          </p>
        </div>
      </section>

      {/* Section 9 */}
      <section id="section-9" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Dataskydd</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost behandlar personuppgifter enligt GDPR och vår Integritetspolicy. 
            För detaljerad information om hur vi behandlar personuppgifter, se vår Integritetspolicy.
          </p>
          <p>
            Om du är en företagskund och behandlar personuppgifter genom Tjänsten, gäller även vårt 
            Data Processing Agreement (DPA). DPA:et reglerar hur Frost agerar som databehandlare för 
            dina personuppgifter.
          </p>
          <p>
            Frost implementerar lämpliga tekniska och organisatoriska åtgärder för att skydda dina 
            personuppgifter mot obehörig åtkomst, förlust eller förstörelse.
          </p>
        </div>
      </section>

      {/* Section 10 */}
      <section id="section-10" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Sekretess</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost kommer att behandla all Kunddata och annan konfidentiell information som du tillhandahåller 
            som konfidentiell och kommer inte att avslöja sådan information till tredje part utan ditt 
            samtycke, förutom i de fall som krävs enligt lag eller som nödvändigt för att tillhandahålla Tjänsten.
          </p>
          <p>
            Frost förbehåller sig rätten att använda aggregerad och anonymiserad data för statistiska 
            ändamål och för att förbättra Tjänsten.
          </p>
          <p>
            Sekretessförpliktelsen gäller i 3 år efter att ditt konto har avslutats eller efter att 
            den konfidentiella informationen har avslöjats, beroende på vilket som inträffar senast.
          </p>
        </div>
      </section>

      {/* Section 11 */}
      <section id="section-11" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Garantier och friskrivningar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Tjänsten tillhandahålls "som den är" och "som tillgänglig". Frost gör inga uttryckliga 
            eller underförstådda garantier om Tjänsten, inklusive men inte begränsat till garantier 
            om säljbarhet, lämplighet för ett visst ändamål eller icke-intrång.
          </p>
          <p>
            Frost garanterar inte att Tjänsten kommer att vara tillgänglig utan avbrott, fel eller 
            att den kommer att uppfylla dina specifika krav. Frost garanterar inte att alla fel i 
            Tjänsten kommer att korrigeras.
          </p>
          <p>
            Frost är inte ansvarig för förluster eller skador som uppstår på grund av:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Avbrott eller nedtid i Tjänsten</li>
            <li>Förlust av data på grund av tekniska fel eller användarfel</li>
            <li>Förändringar eller upphävande av funktioner i Tjänsten</li>
            <li>Åtgärder från tredje part, inklusive men inte begränsat till internetleverantörer eller molnleverantörer</li>
          </ul>
        </div>
      </section>

      {/* Section 12 */}
      <section id="section-12" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Ansvarsbegränsning</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frosts totala ansvar gentemot dig för alla skador och förluster, oavsett orsak, är 
            begränsat till högst 12 månaders avgifter som du har betalat till Frost under de 
            12 månader som föregår det anspråk som ger upphov till ansvaret.
          </p>
          <p>
            Frost är inte ansvarig för indirekta skador, inklusive men inte begränsat till förlorad 
            vinst, förlorad data, förlorad affärsmöjlighet eller förlorat rykte, även om Frost har 
            blivit informerad om möjligheten för sådana skador.
          </p>
          <p>
            Inga begränsningar i detta avsnitt gäller för skador som uppstår på grund av grov 
            vårdslöshet eller uppsåtlig skada från Frosts sida.
          </p>
        </div>
      </section>

      {/* Section 13 */}
      <section id="section-13" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Skadestånd</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Du är ansvarig för alla skador och förluster som uppstår på grund av ditt brott mot 
            dessa Villkor eller din användning av Tjänsten på ett sätt som bryter mot lagar eller 
            förordningar.
          </p>
          <p>
            Du ska skydda och hålla Frost, dess anställda, direktörer och licensgivare skadeslösa 
            från alla anspråk, skador, förluster, kostnader och utgifter (inklusive rättegångskostnader) 
            som uppstår på grund av:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Din användning av Tjänsten</li>
            <li>Ditt brott mot dessa Villkor</li>
            <li>Din kränkning av tredje parts rättigheter</li>
            <li>Din behandling av personuppgifter i strid med GDPR eller annan tillämplig lagstiftning</li>
          </ul>
        </div>
      </section>

      {/* Section 14 */}
      <section id="section-14" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Ändringar</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Frost förbehåller sig rätten att ändra dessa Villkor när som helst. Om ändringarna är 
            betydande kommer Frost att meddela dig via e-post eller genom en notis i Tjänsten minst 
            30 dagar innan ändringarna träder i kraft.
          </p>
          <p>
            Om du inte godkänner de ändrade Villkoren kan du säga upp ditt konto innan ändringarna 
            träder i kraft. Om du fortsätter att använda Tjänsten efter att ändringarna har trätt 
            i kraft anses du ha godkänt de ändrade Villkoren.
          </p>
          <p>
            Den senaste versionen av dessa Villkor finns alltid tillgänglig på /terms på vår webbplats.
          </p>
        </div>
      </section>

      {/* Section 15 */}
      <section id="section-15" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Tillämplig lag</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Dessa Villkor regleras av och tolkas enligt svensk lag, utan hänvisning till dess 
            lagvalregler.
          </p>
          <p>
            Alla tvister som uppstår i samband med dessa Villkor eller Tjänsten ska avgöras av 
            Stockholms tingsrätt som första instans.
          </p>
          <p>
            Om någon bestämmelse i dessa Villkor befinns vara ogiltig eller ogenomförbar, påverkar 
            detta inte giltigheten eller genomförbarheten av de övriga bestämmelserna.
          </p>
        </div>
      </section>

      {/* Section 16 */}
      <section id="section-16" className="mb-8 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">16. Meddelanden</h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-3">
          <p>
            Alla meddelanden från Frost till dig kommer att skickas till den e-postadress som är 
            kopplad till ditt konto eller via en notis i Tjänsten.
          </p>
          <p>
            Du är ansvarig för att hålla din e-postadress uppdaterad. Om du ändrar din e-postadress 
            måste du uppdatera den i dina kontouppgifter.
          </p>
          <p>
            Meddelanden till Frost ska skickas till legal@frostsolutions.se eller support@frostsolutions.se.
          </p>
          <p>
            Ett meddelande anses ha mottagits när det har skickats till den angivna e-postadressen 
            eller när det visas i Tjänsten.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Om du har frågor om dessa Villkor, kontakta oss på legal@frostsolutions.se
        </p>
        <p className="mt-2">
          Senast uppdaterad: 2026-01-26
        </p>
      </div>
    </div>
  )
}
