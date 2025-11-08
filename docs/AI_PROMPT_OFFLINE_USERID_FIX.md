# Prompt för Claude 4.5: Fixa offline userId-hämtning för tidsrapporter

## Problembeskrivning

Jag har en Next.js 16-applikation med Supabase som backend. Användaren rapporterar att offline-sparande av tidsrapporter inte fungerar - de får felmeddelandet "Du är inte inloggad" trots att de är inloggade.

## Teknisk kontext

- **Framework:** Next.js 16 (Turbopack)
- **Backend:** Supabase (PostgreSQL med RLS)
- **Auth:** Supabase Auth med cookies (`sb-access-token`, `sb-refresh-token`)
- **Offline storage:** localStorage för caching
- **Komponent:** `app/reports/new/page.tsx` - formulär för att skapa nya tidsrapporter

## Nuvarande implementation

### userId-hämtning i handleSubmit (`app/reports/new/page.tsx`)

Jag har implementerat en multi-strategy approach:

1. **Strategy 1:** Supabase client direkt (`supabase.auth.getUser()`) - fungerar offline om session finns
2. **Strategy 2:** localStorage cache (`cachedUserId`)
3. **Strategy 3:** API route (`/api/auth/user`) - kräver nätverksanslutning
4. **Strategy 4:** Final fallback till cache

### Problemet

Trots denna implementation får användaren fortfarande felmeddelandet "Du är inte inloggad" när de försöker spara offline.

## Möjliga orsaker

1. **Supabase session inte tillgänglig offline:** `supabase.auth.getUser()` kanske inte fungerar offline även om session finns i localStorage
2. **Cache inte satt korrekt:** userId kanske inte cachas när användaren är online
3. **Session expired:** Supabase session kanske har gått ut
4. **Cookie-problem:** Cookies kanske inte är tillgängliga offline

## Vad jag behöver hjälp med

1. **Verifiera Supabase offline session:**
   - Kan `supabase.auth.getUser()` fungera offline om session finns?
   - Var lagras Supabase session? (localStorage, cookies, eller båda?)
   - Hur kan vi läsa userId direkt från session storage offline?

2. **Förbättra userId-hämtning:**
   - Säkerställ att userId alltid cachas när användaren är online
   - Implementera robust offline-hämtning från Supabase session
   - Lägg till fallback-strategier

3. **Debugging och logging:**
   - Lägg till bättre logging för att se vad som händer
   - Verifiera att session faktiskt finns när offline

## Filer att granska

- `frost-demo/app/reports/new/page.tsx` - Huvudkomponenten (rad ~529-601 för userId-hämtning)
- `frost-demo/app/utils/supabase/supabaseClient.ts` - Supabase client setup
- `frost-demo/app/api/auth/user/route.ts` - API route för userId

## Ytterligare kontext

- Användaren kan navigera mellan sidor offline utan problem
- Problemet uppstår specifikt när man försöker spara en tidsrapport offline
- Felet är "Du är inte inloggad" trots att användaren är inloggad
- Detta tyder på att userId inte kan hämtas offline

## Önskat resultat

1. Användaren ska kunna spara tidsrapporter offline utan "Du är inte inloggad"-fel
2. userId ska hämtas från Supabase session direkt när offline
3. userId ska alltid cachas när online för offline-användning
4. Robust fallback-strategi om session saknas

## Test-scenarier att verifiera

1. **Online:** Logga in → userId cachas automatiskt
2. **Offline:** Gå offline → försök spara tidsrapport → ska fungera med cached/session userId
3. **Session expired:** Om session går ut → ska visa tydligt felmeddelande
4. **No session:** Om ingen session finns → ska visa "Logga in igen"

## Ytterligare tips

- Supabase lagrar session i localStorage under nyckeln som börjar med `sb-`
- `supabase.auth.getUser()` kan fungera offline om session finns i localStorage
- Kolla om det finns en `supabase.auth.getSession()` metod som kan användas offline
- Verifiera att Supabase client är korrekt konfigurerad för offline-användning

---

**Vänligen analysera koden och ge konkreta förslag på fixar med kod-exempel. Fokusera på att säkerställa att userId kan hämtas offline från Supabase session.**

