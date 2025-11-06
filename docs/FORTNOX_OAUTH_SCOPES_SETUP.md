# Fortnox OAuth Scopes - Konfigurationsguide

## Problem: `invalid_scope` Error

Om du får felet `invalid_scope` när du försöker ansluta till Fortnox, betyder det att de scopes som begärs inte stöds eller inte är konfigurerade korrekt i Fortnox Developer Portal.

## Korrekta Fortnox Scopes

Fortnox använder **space-separated scope names**, INTE `scope:read` eller `scope:write` format.

### Standard Scopes (implementerade)
```
invoice customer salary timereporting offer
```

### Alla Tillgängliga Scopes
- `invoice` - Fakturor
- `customer` - Kunder
- `salary` - Löner
- `timereporting` - Tidsrapportering
- `offer` - Offerter
- `order` - Order
- `article` - Artiklar
- `account` - Konton
- `company` - Företagsinformation
- `file` - Filer
- `project` - Projekt
- `voucher` - Verifikationer
- `supplier` - Leverantörer
- `wayofdelivery` - Leveranssätt
- `terms` - Betalningsvillkor
- `currency` - Valutor
- `price` - Priser
- `scheme` - Scheman
- `unit` - Enheter
- `modeofpayment` - Betalningssätt

## Konfigurera Scopes i Fortnox Developer Portal

### Steg 1: Logga in på Fortnox Developer Portal
1. Gå till: https://apps.fortnox.se/oauth-v1
2. Logga in med ditt Fortnox-konto

### Steg 2: Hitta din OAuth Application
1. Klicka på din applikation (t.ex. "Frost Solutions")
2. Eller skapa en ny om den inte finns

### Steg 3: Konfigurera Scopes
1. I applikationsinställningarna, hitta "Scopes" eller "Behörigheter"
2. Aktivera följande scopes:
   - ✅ Invoice (Fakturor)
   - ✅ Customer (Kunder)
   - ✅ Salary (Löner)
   - ✅ Time Reporting (Tidsrapportering)
   - ✅ Offer (Offert)

### Steg 4: Verifiera Redirect URI
Kontrollera att Redirect URI är exakt:
```
http://localhost:3000/api/integrations/fortnox/callback
```

**VIKTIGT:** 
- Inga mellanslag i slutet
- Exakt samma URL som i `.env.local`
- För production, uppdatera till din produktions-URL

### Steg 5: Spara och Testa
1. Spara ändringar i Fortnox Developer Portal
2. Starta om din dev-server (om den körs)
3. Försök ansluta igen från `/settings/integrations`

## Felsökning

### Fel: "invalid_scope"
**Orsak:** Scope finns inte i Fortnox Developer Portal eller är felaktigt konfigurerad.

**Lösning:**
1. Kontrollera att scope är aktiverad i Fortnox Developer Portal
2. Kontrollera att scope-namnet är korrekt (t.ex. `invoice`, inte `invoice:read`)
3. Starta om dev-servern efter ändringar

### Fel: "redirect_uri_mismatch"
**Orsak:** Redirect URI i Fortnox Developer Portal matchar inte den i `.env.local`.

**Lösning:**
1. Kontrollera `.env.local`: `FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback`
2. Kontrollera Fortnox Developer Portal: Redirect URI ska vara exakt samma
3. Starta om dev-servern

### Fel: "invalid_client"
**Orsak:** Client ID eller Client Secret är felaktigt.

**Lösning:**
1. Kontrollera `.env.local`:
   ```
   FORTNOX_CLIENT_ID=UFg21BcGXfMs
   FORTNOX_CLIENT_SECRET=9r7SqU8WDT
   ```
2. Kontrollera att inga mellanslag eller citattecken finns
3. Kopiera exakt från Fortnox Developer Portal
4. Starta om dev-servern

## Testa Scopes

Efter att ha konfigurerat scopes, testa:

1. Gå till `/settings/integrations`
2. Klicka på "Anslut till Fortnox"
3. Du ska omdirigeras till Fortnox auktoriseringssida
4. Godkänn behörigheterna
5. Du ska omdirigeras tillbaka med success-meddelande

## Ytterligare Scopes (Om Nödvändigt)

Om du behöver fler scopes i framtiden:

1. Lägg till scope i Fortnox Developer Portal
2. Uppdatera `getAuthorizationUrl` i `app/lib/integrations/fortnox/oauth.ts`:
   ```typescript
   scope = 'invoice customer salary timereporting offer order article'
   ```
3. Starta om dev-servern

## Referenser

- [Fortnox API Documentation](https://developer.fortnox.se/)
- [Fortnox OAuth Guide](https://developer.fortnox.se/documentation/oauth/)

