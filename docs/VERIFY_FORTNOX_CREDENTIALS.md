# 🔍 Verifiera Fortnox Credentials

## Problem: "Fortnox Client ID saknas"

Om du får detta felmeddelande, kontrollera att dina credentials är korrekt satta i `.env.local`.

## ✅ Steg-för-steg Guide

### 1. Öppna `.env.local` filen
Filens plats: `frost-demo/.env.local`

### 2. Kontrollera att dessa rader finns EXAKT så här:

```env
FORTNOX_CLIENT_ID=your_fortnox_client_id_here
FORTNOX_CLIENT_SECRET=your_fortnox_client_secret_here
FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback
```

### 3. VIKTIGT - Kontrollera:
- ✅ **INGA mellanslag** före eller efter `=`
- ✅ **INGA citattecken** runt värdena
- ✅ **INGA extra rader** eller kommentarer på samma rad
- ✅ **Exakt** samma format som ditt Client ID från Fortnox Developer Portal

### 4. Exempel på FEL format (gör INTE så här):
```env
# ❌ FEL - mellanslag före =
FORTNOX_CLIENT_ID = ABC123xyz

# ❌ FEL - citattecken
FORTNOX_CLIENT_ID="ABC123xyz"

# ❌ FEL - kommentar på samma rad
FORTNOX_CLIENT_ID=ABC123xyz # mitt client id

# ❌ FEL - mellanslag efter =
FORTNOX_CLIENT_ID= ABC123xyz
```

### 5. Exempel på RÄTT format:
```env
# ✅ RÄTT
FORTNOX_CLIENT_ID=your_fortnox_client_id_here
FORTNOX_CLIENT_SECRET=your_fortnox_client_secret_here
FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback
```

### 6. Starta om servern
Efter att ha ändrat `.env.local` **MÅSTE** du starta om dev-servern:

1. Tryck `Ctrl+C` i terminalen där servern körs
2. Kör `npm run dev` igen
3. Vänta tills servern har startat (du ser "Ready in X ms")

### 7. Testa igen
Gå till `/settings/integrations` och klicka på "Anslut till Fortnox"

## 🔍 Debug: Verifiera att värdena laddas

Om problemet kvarstår, kontrollera server console när du klickar på "Anslut":

- Om du ser `❌ FORTNOX_CLIENT_ID är inte satt korrekt` = servern har inte laddat om .env.local
- Om du ser `❌ URL innehåller placeholder` = client ID är inte korrekt

## ❓ Måste jag publicera?

**NEJ!** Du behöver INTE publicera något. Fortnox OAuth fungerar med `localhost:3000` för development.

Du behöver bara:
1. Sätta credentials i `.env.local`
2. Starta om servern
3. Testa anslutningen

## 📝 Fortnox Redirect URI

I Fortnox Developer Portal, se till att du har registrerat:
```
http://localhost:3000/api/integrations/fortnox/callback
```

Som en av dina "Allowed Redirect URIs".

