# Fix: Fortnox OAuth Errors (invalid_scope, error_missing_license)

## Vanliga Fortnox OAuth-fel

### 1. `error_missing_license: Resource owner is not licensed for the requested scope(s)`

**Problem:** Ditt Fortnox-konto saknar licens för de begärda scopes.

**Viktigt:** Detta är INTE ett fel i appen! Detta är ett Fortnox-paket-problem.

#### Fortnox-paket och API-åtkomst:

| Fortnox-paket | API-åtkomst | Fungerar med appen? |
|---------------|-------------|---------------------|
| **Gratis/Basic** | ❌ Ingen API-åtkomst | ❌ Fungerar INTE |
| **Fakturering** | ✅ Full API-åtkomst | ✅ Fungerar |
| **Bokföring** | ✅ Full API-åtkomst | ✅ Fungerar |
| **Lön** | ✅ Full API-åtkomst | ✅ Fungerar |
| **Allt-i-ett** | ✅ Full API-åtkomst | ✅ Fungerar |

#### För utvecklare/testare:

**Om du har ett gratis Fortnox-konto:**
- Appen fungerar korrekt, men ditt testkonto saknar API-åtkomst
- **Lösning 1:** Uppgradera till Fakturering (kostar pengar)
- **Lösning 2:** Använd ett kundkonto med betalt Fortnox-paket för testning
- **Lösning 3:** Kontakta Fortnox support och be om test-API-åtkomst

#### För produktion:

**När kunder använder appen:**
- Kunder med betalda Fortnox-paket (Fakturering eller högre) kommer att kunna ansluta utan problem
- Gratis Fortnox-konton kommer att få samma fel (detta är förväntat beteende)
- Du kan visa ett tydligt meddelande i UI: "Din Fortnox-prenumeration saknar API-åtkomst. Uppgradera till Fakturering eller högre för att använda integrationen."

**Lösning för utvecklare:**
1. Kontrollera ditt Fortnox-paket:
   - Logga in på Fortnox
   - Gå till Inställningar → Prenumeration
   - Se vilket paket du har

2. Om du har Gratis/Basic:
   - Uppgradera till Fakturering (kostar pengar)
   - ELLER använd ett kundkonto med betalt paket för testning
   - ELLER kontakta Fortnox support för test-API-åtkomst

3. Testa igen efter uppgradering

### 2. `invalid_scope: An unsupported scope was requested`

**Problem:** Scopes är inte korrekt konfigurerade i Fortnox Developer Portal.

**Lösning:**
1. Gå till: https://apps.fortnox.se/oauth-v1
2. Öppna din OAuth-applikation
3. Kontrollera att följande scopes är aktiverade:
   - `invoice` (grundläggande - fungerar med alla paket)
4. Spara ändringar
5. Testa igen

### 3. `access_denied`

**Problem:** Användaren avbröt auktoriseringen eller nekade behörigheterna.

**Lösning:**
- Försök igen och godkänn alla behörigheter i Fortnox auktoriseringsskärmen

---

# Fix: Fortnox invalid_scope Error (Legacy)

## Problem
Fortnox returnerar `invalid_scope: An unsupported scope was requested` när du försöker ansluta.

## Orsaker

1. **Scopes är inte aktiverade i Fortnox Developer Portal**
2. **Felaktiga scope-namn** (t.ex. `invoice:read` istället för `invoice`)
3. **För många scopes** (vissa scopes kräver specifik konfiguration)

## Lösning

### Steg 1: Verifiera Scopes i Fortnox Developer Portal

1. Gå till: https://apps.fortnox.se/oauth-v1
2. Logga in med ditt Fortnox-konto
3. Klicka på din OAuth-applikation
4. Gå till "Scopes" eller "Behörigheter"
5. **Aktivera endast dessa scopes:**
   - ✅ `invoice` (Fakturor)
   - ✅ `customer` (Kunder)

**VIKTIGT:** Starta med bara dessa två scopes för att testa. Du kan lägga till fler senare.

### Steg 2: Uppdatera Scope i Koden

Om du behöver ändra scopes, uppdatera `app/lib/integrations/fortnox/oauth.ts`:

```typescript
// Minimal scope för att testa
scope = 'invoice customer'
```

### Steg 3: Testa Med Minimal Scope

1. Uppdatera koden med minimal scope (`invoice customer`)
2. Starta om dev-servern
3. Gå till `/settings/integrations`
4. Klicka på "Anslut till Fortnox"
5. Verifiera att det fungerar

### Steg 4: Lägg Till Fler Scopes (Om Nödvändigt)

När grundscopes fungerar, kan du lägga till fler:

1. Aktivera scope i Fortnox Developer Portal
2. Uppdatera koden:
   ```typescript
   scope = 'invoice customer salary timereporting offer'
   ```
3. Starta om servern
4. Testa igen

## Vanliga Fel

### Fel: "invalid_scope" trots att scope är aktiverad
**Lösning:**
- Kontrollera att scope-namnet är exakt korrekt (t.ex. `invoice`, inte `invoices`)
- Kontrollera att du har sparat ändringar i Fortnox Developer Portal
- Starta om dev-servern

### Fel: "redirect_uri_mismatch"
**Lösning:**
- Kontrollera att Redirect URI i Fortnox Developer Portal är exakt: `http://localhost:3000/api/integrations/fortnox/callback`
- Kontrollera `.env.local`: `FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback`
- Starta om dev-servern

### Fel: "invalid_client"
**Lösning:**
- Kontrollera `FORTNOX_CLIENT_ID` och `FORTNOX_CLIENT_SECRET` i `.env.local`
- Kontrollera att inga mellanslag eller citattecken finns
- Starta om dev-servern

## Rekommenderad Scope-konfiguration

### Minimal (för testning)
```
invoice customer
```

### Standard (för produktion)
```
invoice customer salary timereporting
```

### Full (alla funktioner)
```
invoice customer salary timereporting offer order article
```

## Testa Efter Fix

1. ✅ Gå till `/settings/integrations`
2. ✅ Klicka på "Anslut till Fortnox"
3. ✅ Du ska omdirigeras till Fortnox utan `invalid_scope`-fel
4. ✅ Godkänn behörigheterna
5. ✅ Du ska omdirigeras tillbaka med success-meddelande

## Ytterligare Hjälp

Om problemet kvarstår:
1. Kontrollera Fortnox Developer Portal att scopes är aktiverade
2. Kontrollera server logs för detaljerade felmeddelanden
3. Kontakta Fortnox support om scopes inte fungerar trots korrekt konfiguration

