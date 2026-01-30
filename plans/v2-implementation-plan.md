# Frost Solutions V2 - Implementationsplan

**Dokumentversion:** 2.0  
**Senast uppdaterad:** 2026-01-30  
**Status:** SPIKAD - Redo för implementation  
**Baserad på:** Research & validering 2026-01-30

---

## Innehållsförteckning

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack - Final](#2-tech-stack---final)
3. [Kostnadsöversikt](#3-kostnadsöversikt)
4. [Prismodell](#4-prismodell)
5. [Feature Matrix](#5-feature-matrix)
6. [ÄTA-flödet - The Money Maker](#6-äta-flödet---the-money-maker)
7. [Databasändringar](#7-databasändringar)
8. [Nya Integrationer](#8-nya-integrationer)
9. [Mobile App Specifikation](#9-mobile-app-specifikation)
10. [Implementationsplan](#10-implementationsplan)
11. [Success Metrics](#11-success-metrics)
12. [Risker & Mitigation](#12-risker--mitigation)

---

## 1. Executive Summary

### Vision
**"Missa aldrig en ÄTA-faktura igen"** - Frost V2 transformerar från projekthanteringsverktyg till en juridisk sköldsplattform som skyddar byggföretag från obetalda ÄTA-arbeten.

### Kärnstrategi

```
┌─────────────────────────────────────────────────────────────┐
│                    FROST V2 POSITIONING                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   SALES HOOK (Vad som säljer):                             │
│   "Missa aldrig en ÄTA-faktura igen"                       │
│   → Direkt ROI, räknas i kronor                            │
│                                                             │
│   MOAT (Vad som behåller kunder):                          │
│   "Ryggen fri vid varje tvist"                             │
│   → Legal Fortress, dokumentation                          │
│                                                             │
│   DIFFERENTIATOR (Mot Bygglet):                            │
│   "Obegränsade användare - betala per projekt"             │
│   → Skalbart för växande byggföretag                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Valideringsresultat

| Område | Research | Beslut |
|--------|----------|--------|
| E-signering | BankID dyrt, Idura API-first | **Idura** |
| Kreditupplysning | UC dyrt, SCB gratis API | **SCB + Allabolag MVP** |
| SMS | Bird billigast (0.20 kr) | **Bird API** |
| Mobile | PWA räcker inte | **React Native (Expo)** |
| Offline | Kritiskt för byggen | **WatermelonDB** |
| Ritningar | Full Bluebeam overkill | **PDF.js + Pins** |
| KMA | Generellt räcker | **Checklistor** |
| Personalliggare | Komplext, låg ROI | **Skippa för MVP** |

---

## 2. Tech Stack - Final

### Arkitekturöversikt

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FROST V2 ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                │
│  │   MOBILE APP        │    │   WEB APP           │                │
│  │   React Native      │    │   Next.js 16        │                │
│  │   (Expo)            │    │   (Befintlig)       │                │
│  └─────────┬───────────┘    └─────────┬───────────┘                │
│            │                          │                             │
│            ▼                          ▼                             │
│  ┌─────────────────────┐    ┌─────────────────────┐                │
│  │   WatermelonDB      │    │                     │                │
│  │   (Offline-first)   │───▶│   SUPABASE          │                │
│  │   + Sync Engine     │    │   PostgreSQL        │                │
│  └─────────────────────┘    │   Storage           │                │
│                             │   Auth              │                │
│                             │   Realtime          │                │
│                             └─────────┬───────────┘                │
│                                       │                             │
│            ┌──────────────────────────┼──────────────────────┐     │
│            ▼                          ▼                      ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   IDURA         │    │   BIRD          │    │   OPENAI        ││
│  │   BankID        │    │   SMS           │    │   Whisper       ││
│  │   E-signering   │    │   ~0.20 kr/sms  │    │   GPT-4o        ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                     │
│            ┌──────────────────────────┬──────────────────────┐     │
│            ▼                          ▼                      ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   SCB API       │    │   ROARING.IO    │    │   GEMINI        ││
│  │   Företagsdata  │    │   Kreditscore   │    │   OCR/Vision    ││
│  │   (Gratis)      │    │   (Fas 2)       │    │   (Befintlig)   ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Beslut

| Lager | Teknik | Motivering |
|-------|--------|------------|
| **Web Frontend** | Next.js 16 | Befintlig, fungerar bra |
| **Mobile App** | React Native (Expo) | Native kameraåtkomst, offline, push |
| **Offline DB** | WatermelonDB | Bästa för offline-first React Native |
| **Backend** | Supabase | Befintlig, behåll |
| **E-signering** | Idura | API-first, låg startkostnad |
| **SMS** | Bird | Billigast i Sverige (0.20 kr) |
| **Företagsdata** | SCB Företagsregistret | Gratis API |
| **Kreditscore** | Roaring.io | Fas 2, ca 1,495 SEK/mån |
| **Röst-AI** | OpenAI Whisper | Bäst accuracy |
| **Text-AI** | GPT-4o / Gemini | Befintlig |
| **Lagring** | Supabase Storage → R2 | Migrera vid 80GB |

### Repostruktur

**Monorepo-approach (rekommenderad):**
```
frost-solutions/
├── apps/
│   ├── web/              # Next.js app (flyttad från root)
│   └── mobile/           # Expo React Native app
├── packages/
│   ├── shared/           # Delade typer, utilities
│   ├── ui/               # Delade UI-komponenter
│   └── sync/             # WatermelonDB sync-logik
├── supabase/             # Edge Functions (befintlig)
└── packages.json         # Monorepo config (pnpm/turborepo)
```

---

## 3. Kostnadsöversikt

### Månadskostnader (Uppskattning)

| Tjänst | Kostnad | Not |
|--------|---------|-----|
| **Supabase Pro** | $25 (~260 SEK) | 100GB storage, 500k MAU |
| **Vercel Pro** | $20 (~210 SEK) | Web hosting |
| **Idura** | ~500-1,000 SEK | Platform fee |
| **Idura signaturer** | ~0.50 SEK/st | Per BankID-signering |
| **Bird SMS** | ~50-200 SEK | Beroende på volym |
| **OpenAI (Whisper)** | ~100-500 SEK | Fas 2, beroende på användning |
| **Apple Developer** | $99/år (~850 SEK/år) | iOS-publicering |
| **Google Play** | $25 engång | Android-publicering |
| **Roaring.io** | ~1,495 SEK | Fas 2, kreditscore |
| **TOTALT (Fas 1)** | **~1,200-2,000 SEK/mån** | |
| **TOTALT (Fas 2+)** | **~2,700-4,000 SEK/mån** | Med kreditscore |

### Enhetskostnader

| Åtgärd | Kostnad |
|--------|---------|
| BankID-signering | ~0.50 SEK |
| SMS-notis | ~0.20 SEK |
| Whisper-transkribering (1 min) | ~0.006 $ (~0.06 SEK) |
| Kreditsökning (Roaring) | ~1-5 SEK |

---

## 4. Prismodell

### Freemium + Per-Projekt

```
┌─────────────────────────────────────────────────────────────┐
│                    FROST V2 PRISSÄTTNING                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🆓 GRATIS                                                  │
│     • 1 aktivt projekt                                     │
│     • Obegränsade användare                                │
│     • 2 GB lagring                                         │
│     • Grundläggande ÄTA-hantering                          │
│     • Email-signering (ej BankID)                          │
│                                                             │
│  💼 PRO - 499 SEK/projekt/månad                            │
│     • Obegränsade aktiva projekt                           │
│     • 5 GB lagring per projekt                             │
│     • E-signering med BankID                               │
│     • Legal Fortress (audit trail)                         │
│     • SMS-notiser till kunder                              │
│     • Prioriterad support                                  │
│                                                             │
│  🏢 ENTERPRISE - Offert                                    │
│     • Allt i Pro                                           │
│     • Kreditkontroll (Roaring)                             │
│     • API-access                                           │
│     • SSO / Custom domain                                  │
│     • Dedicated support                                    │
│     • SLA                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prissättningsstrategi

**Varför "per projekt" istället för "per användare"?**

1. **Skalbarhet:** Byggföretag vill inte betala extra för att lägga till snickare/lärling
2. **Värdebaserat:** Ett projekt på 500k SEK motiverar 499 SEK/mån
3. **Differentiering:** Bygglet tar betalt per användare, vi tar per värde
4. **Lägre tröskel:** Småfirmor kan testa gratis på ett projekt

---

## 5. Feature Matrix

### MVP vs Later

| Feature | MVP (Fas 1) | Fas 2 | Fas 3 |
|---------|-------------|-------|-------|
| **ÄTA-flöde** | ✅ Foto + text | Röst-AI | - |
| **E-signering** | ✅ Email-länk | BankID (Idura) | - |
| **Offline** | ✅ Optimistic UI | Full sync | - |
| **Mobile app** | ✅ Expo MVP | Polish | App Store |
| **Ritningsvisare** | ✅ PDF + Pins | Markup | Mätning |
| **SMS-notiser** | ✅ Bird API | - | - |
| **KMA** | ✅ Checklistor | Mallar | Rapporter |
| **Binder/DMS** | ✅ Basic | Versioner | Delning |
| **Audit Trail** | ✅ Immutable | Export | Compliance |
| **Kreditkontroll** | ❌ | ✅ Roaring | UC |
| **Röst-till-ÄTA** | ❌ | ✅ Whisper | - |
| **Personalliggare** | ❌ | ❌ | Kanske |
| **PEPPOL** | ❌ | ❌ | ✅ |

### Detaljerade Feature-specifikationer

#### ÄTA-hantering (MVP)
- **Skapa ÄTA:** Foto + text + typ + urgency
- **Admin-granskning:** Prissättning, tidspåverkan
- **Kundnotis:** Email + (SMS i Pro)
- **Godkännande:** Publik länk med signering
- **Fakturering:** Varning om ofakturerade ÄTA

#### Mobile App (MVP)
- **Plattform:** Expo (iOS + Android)
- **Kärnfunktioner:**
  - Skapa ÄTA med foto
  - Tidrapportering
  - Se projekt & arbetsordrar
  - Push-notiser
- **Offline:** AsyncStorage → WatermelonDB sync

#### Binder/DMS (MVP)
- **Mappstruktur:** BSAB-baserad default
- **Upload:** Drag & drop, mobil-foto
- **Versionering:** Automatic v1, v2, v3...
- **Behörigheter:** Admin/Arbetsledare/Arbetare/Extern

---

## 6. ÄTA-flödet - The Money Maker

### Översikt

```
┌─────────────────────────────────────────────────────────────┐
│              ÄTA → FAKTURA WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ TRIGGER (Fältet - Mobile App)                          │
│     Arbetare: 📷 Foto + 🎤 Röstnotering (Fas 2)            │
│     App sparar lokalt (offline-safe)                       │
│     → System skapar "ÄTA-utkast"                           │
│     → Push-notis till Byggledare                           │
│                                                             │
│  2️⃣ ATTEST (Byggledare - Web/Mobile)                       │
│     Granskar beskrivning + foton                           │
│     Sätter pris (från avtal eller manuellt)                │
│     Anger tidspåverkan                                     │
│     → Skickar signeringslänk till kund                     │
│                                                             │
│  3️⃣ KUNDENS VY (Publik sida - Token-access)               │
│     SMS/Email med länk                                     │
│     Ser: Beskrivning, foton, pris, tidspåverkan            │
│     Bekräftar checkboxar                                   │
│     → Signerar (BankID i Pro, email i Free)                │
│     → Status: "Godkänd & Fakturerbar"                      │
│                                                             │
│  4️⃣ PAYDAY (Ekonomi - Web)                                 │
│     Vid fakturering:                                       │
│     ⚠️ "3 ofakturerade ÄTA för detta projekt (15 000 kr)" │
│     → Ett klick → Läggs till på fakturan                   │
│     → Bilagor: Signatur + Foto + Audit trail               │
│                                                             │
│  📎 JURIDISKT SKYDD:                                       │
│     Signatur + Foto + Tidsstämpel + IP = Legal Fortress   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Teknisk Implementation

#### Publik godkännandesida
```typescript
// Route: /approve/[token]/page.tsx
// Kräver INTE inloggning

interface ApprovalPageProps {
  params: { token: string }
}

// Visa:
// 1. Projektinfo
// 2. ÄTA-beskrivning + foton
// 3. Prisspecifikation
// 4. Tidspåverkan
// 5. Checkboxar för bekräftelse
// 6. Signeringsknapp (BankID eller Email)
```

#### Audit Trail
```typescript
interface ATAAuditEntry {
  id: string;
  ata_id: string;
  timestamp: Date;
  action: 'created' | 'photo_added' | 'admin_reviewed' | 
          'sent_to_customer' | 'customer_viewed' | 
          'customer_approved' | 'customer_rejected' |
          'invoice_generated';
  actor: {
    type: 'employee' | 'admin' | 'customer' | 'system';
    id: string;
    ip_address?: string;
  };
  data_before?: Record<string, any>;
  data_after?: Record<string, any>;
}
```

---

## 7. Databasändringar

### Nya tabeller

#### audit_trail (Immutable)
```sql
CREATE TABLE audit_trail (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,  -- 'ata', 'contract', 'invoice'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  data_before JSONB,
  data_after JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  hash TEXT NOT NULL  -- SHA256 chain
);

-- Ingen UPDATE eller DELETE tillåten
CREATE RULE audit_no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;
```

#### ata_approvals (Nya fält)
```sql
ALTER TABLE ata_requests ADD COLUMN IF NOT EXISTS
  customer_approval_token TEXT UNIQUE,
  customer_approval_method TEXT,  -- 'bankid', 'email'
  customer_approval_timestamp TIMESTAMPTZ,
  customer_approval_ip TEXT,
  customer_approval_signature JSONB,
  notification_sent_at TIMESTAMPTZ,
  notification_channels JSONB,  -- ['email', 'sms']
  reminder_count INTEGER DEFAULT 0;
```

#### project_documents (Binder)
```sql
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  folder_path TEXT NOT NULL,  -- '/01-Ritningar/01-A'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  mime_type TEXT,
  file_size_bytes BIGINT,
  version_number INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES project_documents(id),
  uploaded_by UUID REFERENCES employees(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_project_folder ON project_documents(project_id, folder_path);
```

#### document_folders (Binder struktur)
```sql
CREATE TABLE document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL,
  path TEXT NOT NULL,  -- '/01-Ritningar/01-A'
  name TEXT NOT NULL,  -- '01-A'
  parent_path TEXT,
  access_level TEXT DEFAULT 'all',  -- 'admin', 'supervisor', 'worker', 'external'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);
```

---

## 8. Nya Integrationer

### Idura (BankID E-signering)

**API-flöde:**
```typescript
// 1. Initiera signering
POST /api/sign/init
{
  document_hash: "sha256...",
  signer_pnr: "199001011234",  // Endast om känd
  return_url: "https://app.frost.se/approve/[token]/complete"
}

// 2. Polla status
GET /api/sign/status/[order_ref]

// 3. Hämta signatur
GET /api/sign/result/[order_ref]
```

**Kostnad:** ~500-1000 SEK/mån + ~0.50 SEK/signering

### Bird (SMS)

**API-flöde:**
```typescript
POST https://api.bird.com/v2/send
{
  to: "+46701234567",
  from: "FrostSolutions",
  body: "ÄTA-förfrågan kräver ditt godkännande: https://frost.se/approve/abc123"
}
```

**Kostnad:** ~0.20 SEK/SMS

### SCB Företagsregistret

**API-flöde:**
```typescript
GET https://api.scb.se/foretagsregistret/v1/foretag/{orgnr}

// Response:
{
  orgnr: "5561234567",
  namn: "Byggfirma AB",
  juridiskForm: "Aktiebolag",
  sniKod: "41200",
  adress: {...},
  antalAnstallda: "10-19"
}
```

**Kostnad:** Gratis (kräver certifikat-auth)

### OpenAI Whisper (Fas 2)

**API-flöde:**
```typescript
POST https://api.openai.com/v1/audio/transcriptions
{
  file: audioBlob,
  model: "whisper-1",
  language: "sv"
}

// Response:
{
  text: "Hittade fuktskada i väggen, behöver sanering"
}
```

**Kostnad:** $0.006/minut

---

## 9. Mobile App Specifikation

### Tech Stack

| Komponent | Teknik |
|-----------|--------|
| Framework | React Native (Expo) |
| Navigation | Expo Router |
| State | Zustand |
| Offline DB | WatermelonDB |
| Kamera | expo-camera |
| Push | expo-notifications |
| Auth | Supabase Auth |

### Skärmflöde

```
┌──────────────────────────────────────────────┐
│                 MOBILE APP                    │
├──────────────────────────────────────────────┤
│                                              │
│  📱 BOTTOM NAV                               │
│  ├── 🏠 Hem (Dashboard)                      │
│  ├── 📋 Projekt                              │
│  ├── ➕ Nytt (Quick Action)                  │
│  ├── ⏱️ Tid                                  │
│  └── 👤 Profil                               │
│                                              │
│  📄 SKÄRMAR                                  │
│  ├── /home                                   │
│  │   ├── Dagens arbetsorder                 │
│  │   ├── Aktiva ÄTA                         │
│  │   └── Snabbknappar                       │
│  │                                          │
│  ├── /projects                              │
│  │   ├── Projektlista                       │
│  │   └── /[id] - Projektdetalj              │
│  │                                          │
│  ├── /ata/new                               │
│  │   ├── Välj projekt                       │
│  │   ├── Ta foto (kräver för UNFORESEEN)    │
│  │   ├── Beskriv (text eller röst)          │
│  │   ├── Typ & Urgency                      │
│  │   └── Skicka                             │
│  │                                          │
│  ├── /time                                  │
│  │   ├── Idag (timmar)                      │
│  │   ├── Start/Stopp                        │
│  │   └── Historik                           │
│  │                                          │
│  └── /profile                               │
│      ├── Inställningar                      │
│      └── Logga ut                           │
│                                              │
└──────────────────────────────────────────────┘
```

### Offline-strategi

```typescript
// WatermelonDB schema
const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'ata_drafts',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'change_type', type: 'string' },
        { name: 'photos', type: 'string' }, // JSON array
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'time_entries_draft',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'hours', type: 'number' },
        { name: 'date', type: 'string' },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
  ],
});

// Sync when online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncQueue.processAll();
  }
});
```

---

## 10. Implementationsplan

### Fas 1: Foundation (4-6 veckor)

#### Sprint 1-2: ÄTA-flöde
- [ ] Förbättra ata_requests-tabell (nya fält)
- [ ] Skapa /approve/[token] publik sida
- [ ] Implementera email-signering (gratis tier)
- [ ] Audit trail-tabell
- [ ] "Ofakturerade ÄTA"-varning i fakturering

#### Sprint 3-4: Mobile App MVP
- [ ] Sätt upp Expo-projekt i monorepo
- [ ] Implementera auth (Supabase)
- [ ] ÄTA-skapande med foto
- [ ] Tidrapportering
- [ ] Push-notiser

#### Sprint 5-6: Binder/DMS Basic
- [ ] project_documents-tabell
- [ ] document_folders-tabell
- [ ] Upload-funktionalitet
- [ ] Mappstruktur-initiering
- [ ] Basic versionering

### Fas 2: Integrationer (4-6 veckor)

#### Sprint 7-8: BankID (Idura)
- [ ] Idura API-integration
- [ ] BankID-signering i /approve/[token]
- [ ] Signatur-lagring i audit trail
- [ ] Testning med sandbox

#### Sprint 9-10: SMS + Voice
- [ ] Bird SMS-integration
- [ ] SMS-notiser för ÄTA
- [ ] Whisper-integration (röst-till-text)
- [ ] Voice-to-ÄTA i mobile app

#### Sprint 11-12: Polish
- [ ] SCB API för företagsdata
- [ ] Auto-fill vid kund-skapande
- [ ] App Store-publicering
- [ ] Buggfixar & optimering

### Fas 3: Scale (4-6 veckor)

#### Sprint 13-14: Kreditscore
- [ ] Roaring.io-integration
- [ ] Risk-badge på kunder
- [ ] Varningssystem

#### Sprint 15-16: Enterprise
- [ ] API-dokumentation
- [ ] Webhook-system
- [ ] SSO-förberedelse
- [ ] White-label basics

---

## 11. Success Metrics

### Fas 1 KPIs

| Metric | Mål | Mätning |
|--------|-----|---------|
| ÄTA-skapningstid | < 2 min | Analytics |
| Kundgodkännande-rate | > 80% | DB |
| Offline-sync success | > 99% | Logs |
| App Store rating | > 4.0 | Stores |

### Fas 2 KPIs

| Metric | Mål | Mätning |
|--------|-----|---------|
| BankID-adoption | > 60% av Pro | DB |
| SMS delivery rate | > 98% | Bird API |
| Voice-to-ÄTA usage | > 30% av mobile | Analytics |

### Business KPIs

| Metric | Mål | Tidsram |
|--------|-----|---------|
| Gratis → Pro konvertering | > 20% | 3 mån |
| Churn rate | < 5%/mån | Ongoing |
| NPS | > 40 | Kvartalsvis |

---

## 12. Risker & Mitigation

### Tekniska risker

| Risk | Sannolikhet | Impact | Mitigation |
|------|-------------|--------|------------|
| WatermelonDB sync-konflikter | Medium | Hög | Server-wins strategi, testa noggrant |
| Expo build-problem | Låg | Medium | EAS Build, CI/CD tidigt |
| Idura API-ändringar | Låg | Medium | Wrapper-lager, versionering |

### Affärsrisker

| Risk | Sannolikhet | Impact | Mitigation |
|------|-------------|--------|------------|
| Låg mobile-adoption | Medium | Hög | Tvinga ÄTA-foto via app |
| Pris för högt | Låg | Medium | A/B-testa, erbjud årspris |
| Konkurrent kopierar | Medium | Låg | First-mover, kundrelationer |

### Juridiska risker

| Risk | Sannolikhet | Impact | Mitigation |
|------|-------------|--------|------------|
| GDPR-klagomål | Låg | Hög | DPA, consent-hantering |
| BankID-certifiering | Låg | Medium | Idura hanterar |

---

## Appendix A: API-kontrakt

### Idura BankID
```
Base URL: https://api.idura.io/v1
Auth: API-key i header
Docs: https://docs.idura.io
```

### Bird SMS
```
Base URL: https://api.bird.com/v2
Auth: Access Token
Docs: https://docs.bird.com
```

### SCB Företagsregistret
```
Base URL: https://api.scb.se/foretagsregistret/v1
Auth: mTLS certifikat
Docs: https://www.scb.se/api
```

### OpenAI Whisper
```
Base URL: https://api.openai.com/v1
Auth: Bearer token
Docs: https://platform.openai.com/docs
```

---

## Appendix B: Miljövariabler (nya)

```env
# Idura (BankID)
IDURA_API_KEY=xxx
IDURA_SANDBOX=true

# Bird (SMS)
BIRD_ACCESS_TOKEN=xxx
BIRD_SENDER_NAME=FrostSolutions

# SCB (kräver certifikat, separat hantering)
SCB_CERT_PATH=/certs/scb.pem

# OpenAI (Whisper)
OPENAI_API_KEY=xxx  # Kan dela med befintlig

# Roaring (Fas 2)
ROARING_API_KEY=xxx
ROARING_SANDBOX=true
```

---

*Dokumentet skapades: 2026-01-30*  
*Version: 2.0.0-final*  
*Status: SPIKAD - Redo för implementation*
