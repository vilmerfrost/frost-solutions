# 🔐 OAuth Redirect URI Setup Guide

## Steg-för-steg Guide: Registrera Redirect URIs i Fortnox & Visma

### ⚠️ VIKTIGT
Redirect URIs måste matcha **EXAKT** (tecken för tecken). Ingen trailing slash, rätt protocol, rätt port.

---

## 📋 STEG 1: Verifiera din Redirect URI

### 1.1 Kör debug endpoint

Öppna i webbläsaren:
```
http://localhost:3000/api/debug/oauth-config
```

Du kommer se:
```json
{
  "baseUrl": "http://localhost:3000",
  "fortnox": {
    "redirectUri": "http://localhost:3000/api/integrations/callback/fortnox"
  },
  "visma": {
    "redirectUri": "http://localhost:3000/api/integrations/callback/visma"
  }
}
```

### 1.2 Kopiera EXAKT dessa URIs

Du kommer behöva dessa exakta värden när du registrerar i portalerna.

---

## 🔵 STEG 2: Registrera i Fortnox Developer Portal

### 2.1 Logga in på Fortnox Developer Portal

**URL:** https://developer.fortnox.se/
1. Logga in med ditt Fortnox-konto
2. Gå till **"Mina Appar"** (My Applications)
3. Välj din applikation (eller skapa ny om du inte har en)

### 2.2 Hitta OAuth-inställningar

1. Klicka på din applikation
2. Gå till fliken **"Integration"** eller **"OAuth 2.0 Settings"**
3. Hitta fältet **"Redirect URI"** eller **"Callback URL"**

### 2.3 Lägg till Redirect URIs

**För Development (localhost):**
```
http://localhost:3000/api/integrations/callback/fortnox
```

**För Production (när du deployar):**
```
https://din-domän.se/api/integrations/callback/fortnox
```

**För Staging (om du har):**
```
https://staging.din-domän.se/api/integrations/callback/fortnox
```

### 2.4 Fortnox-specifika krav

- ✅ **Ingen trailing slash** (`/` i slutet)
- ✅ **Include protocol** (`http://` eller `https://`)
- ✅ **Include port** för localhost (`:3000`)
- ✅ **Case-sensitive** - använd exakt samma bokstäver
- ❌ **Inga wildcards** - varje URI måste vara explicit
- ❌ **Inga query parameters** - bara ren URL

### 2.5 Spara inställningar

Klicka på **"Spara"** eller **"Update"** efter att du lagt till URIs.

---

## 🟢 STEG 3: Registrera i Visma Developer Portal

### 3.1 Logga in på Visma Developer Portal

**URL:** https://developer.vismaonline.com/

1. Logga in med ditt Visma-konto
2. Gå till **"My Apps"** eller **"Applications"**
3. Välj din applikation (eller skapa ny)

### 3.2 Hitta OAuth-inställningar

1. Klicka på din applikation
2. Gå till **"OAuth 2.0 Configuration"** eller **"Application Settings"**
3. Hitta fältet **"Redirect URIs"** eller **"Callback URLs"**

### 3.3 Lägg till Redirect URIs

**⚠️ VIKTIGT: Rätt path!**
Den korrekta path är `/api/integrations/callback/visma` (callback FÖRE visma).

**❌ FEL:** `/api/integrations/visma/callback`  
**✅ RÄTT:** `/api/integrations/callback/visma`

**För Development (localhost):**
```
http://localhost:3000/api/integrations/callback/visma
```

**För Production:**
```
https://din-domän.se/api/integrations/callback/visma
```

**För Staging:**
```
https://staging.din-domän.se/api/integrations/callback/visma
```

### 3.4 Visma Spiris Support (Om du behöver ändra Redirect URI)

Om du redan har registrerat en felaktig redirect URI (t.ex. `/api/integrations/visma/callback` istället för `/api/integrations/callback/visma`), behöver du kontakta Spiris support för att ändra den.

**Support Email:** support@spiris.se eller api@spiris.se

**Vad du behöver skicka:**
1. Ditt Client ID (t.ex. `frostsoultionssandbox`)
2. Den korrekta redirect URI: `http://localhost:3000/api/integrations/callback/visma`

**Exempel på email:**
```
Hej!

Jag behöver ändra min redirect URI för Visma eAccounting integration.

Client ID: [ditt_client_id]
Ny Redirect URI: http://localhost:3000/api/integrations/callback/visma

Tack!
```

**Notera:** HTTP är endast tillåtet i Sandbox-miljön. För production krävs HTTPS.

### 3.5 Visma-specifika krav

- ✅ **HTTPS krävs i production** (Visma tillåter endast HTTP för localhost)
- ✅ **Ingen trailing slash**
- ✅ **Exakt matchning** - varje tecken måste stämma
- ✅ **Rätt path-ordning** - `/callback/visma` inte `/visma/callback`
- ❌ **Inga wildcards**

### 3.6 Spara inställningar

Om du kan redigera själv: Klicka på **"Save"** eller **"Update"** efter att du lagt till URIs.  
Om du behöver support: Vänta på bekräftelse från Spiris att redirect URI är uppdaterad.

---

## 🔧 STEG 4: Konfigurera Environment Variables

### 4.1 Skapa/uppdatera `.env.local`

```bash
# Base URL för din applikation
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Client IDs och Secrets
FORTNOX_CLIENT_ID=ditt_fortnox_client_id
FORTNOX_CLIENT_SECRET=ditt_fortnox_client_secret

VISMA_CLIENT_ID=ditt_visma_client_id
VISMA_CLIENT_SECRET=ditt_visma_client_secret
```

### 4.2 För Production (Vercel/Netlify)

Lägg till i din deployment platform's environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://din-domän.se
FORTNOX_CLIENT_ID=prod_client_id
FORTNOX_CLIENT_SECRET=prod_client_secret
VISMA_CLIENT_ID=prod_client_id
VISMA_CLIENT_SECRET=prod_client_secret
```

---

## ✅ STEG 5: Verifiera Konfiguration

### 5.1 Testa debug endpoint

```bash
curl http://localhost:3000/api/debug/oauth-config
```

Kontrollera att:
- ✅ `baseUrl` är korrekt
- ✅ `redirectUri` för både Fortnox och Visma är korrekta
- ✅ Inga trailing slashes
- ✅ Rätt protocol (http för localhost, https för production)

### 5.2 Testa OAuth Flow

1. Starta din dev server: `npm run dev`
2. Gå till `/integrations`
3. Klicka på **"Anslut Fortnox"** eller **"Anslut Visma"**
4. Du ska redirectas till provider's OAuth-sida
5. Efter auktorisering ska du redirectas tillbaka till din app

### 5.3 Kontrollera i Browser DevTools

1. Öppna **Network** tab i DevTools
2. Klicka på "Anslut Fortnox"
3. Hitta request till `apps.fortnox.se/oauth-v1/auth`
4. Klicka på request och kolla **Query String Parameters**
5. Verifiera att `redirect_uri` matchar EXAKT vad du registrerade

---

## 🚨 VANLIGA FEL OCH LÖSNINGAR

### Fel 1: "redirect_uri_mismatch"

**Orsak:** Redirect URI matchar inte vad som är registrerat.

**Lösning:**
1. Kör `/api/debug/oauth-config` och kopiera exakt `redirectUri`
2. Gå till provider portal och verifiera att URI:n matchar EXAKT
3. Kontrollera:
   - Ingen trailing slash?
   - Rätt protocol (http vs https)?
   - Rätt port?
   - Rätt path?

### Fel 2: "invalid_request" (Visma)

**Orsak:** Ofta redirect URI-problem eller felaktig scope.

**Lösning:**
1. Verifiera redirect URI är registrerad i Visma portal
2. Kontrollera att du använder HTTPS i production
3. Verifiera scope är korrekt: `ea:api ea:sales`

### Fel 3: Environment variable saknas

**Fel:** `NEXT_PUBLIC_APP_URL environment variable is required`

**Lösning:**
1. Skapa `.env.local` i projektets root
2. Lägg till: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. Starta om dev server

---

## 📝 CHECKLISTA

### Före första testet:

- [ ] `.env.local` skapad med `NEXT_PUBLIC_APP_URL`
- [ ] Fortnox Client ID och Secret satta i `.env.local`
- [ ] Visma Client ID och Secret satta i `.env.local`
- [ ] Redirect URI registrerad i Fortnox portal (exakt match)
- [ ] Redirect URI registrerad i Visma portal (exakt match)
- [ ] Dev server startad om efter env changes
- [ ] Debug endpoint visar korrekta redirect URIs

### Efter registrering:

- [ ] Testat OAuth flow för Fortnox
- [ ] Testat OAuth flow för Visma
- [ ] Verifierat redirect URI i browser DevTools
- [ ] Kontrollerat server logs för fel

---

## 🔗 ANVÄNDBARA LÄNKAR

- **Fortnox Developer Portal:** https://developer.fortnox.se/
- **Visma Developer Portal:** https://developer.vismaonline.com/
- **Debug Endpoint:** http://localhost:3000/api/debug/oauth-config
- **RFC 6749 (OAuth 2.0 Spec):** https://tools.ietf.org/html/rfc6749#section-3.1.2

---

## 💡 TIPS

1. **Använd debug endpoint** för att alltid se exakt vilken redirect URI som används
2. **Kopiera-klistra** redirect URI från debug endpoint direkt till portalerna
3. **Testa i incognito** för att undvika cache-problem
4. **Kolla server logs** - de visar exakt vilken redirect URI som skickas
5. **En miljö i taget** - börja med localhost, sedan staging, sedan production

---

**Efter att du följt denna guide bör OAuth-flödet fungera korrekt! 🎉**

