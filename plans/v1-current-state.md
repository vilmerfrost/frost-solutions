# Frost Solutions V1 - Nuvarande Applikation

**Dokumentversion:** 1.0  
**Senast uppdaterad:** 2026-01-30  
**Status:** Produktionslive  

---

## Innehållsförteckning

1. [Sammanfattning](#1-sammanfattning)
2. [Teknisk Stack](#2-teknisk-stack)
3. [Databasschema](#3-databasschema)
4. [Sidor & Funktioner](#4-sidor--funktioner)
5. [API-routes](#5-api-routes)
6. [Custom Hooks](#6-custom-hooks)
7. [Komponenter](#7-komponenter)
8. [AI & Automation](#8-ai--automation)
9. [Integrationer](#9-integrationer)
10. [Befintliga Planer](#10-befintliga-planer)
11. [Kända Begränsningar](#11-kända-begränsningar)

---

## 1. Sammanfattning

### Vad är Frost Solutions V1?

Frost Solutions är en modern SaaS-plattform för svenska byggföretag och hantverkare. Appen hanterar:
- Projekthantering
- Tidrapportering med OB-beräkningar
- Fakturering och offerter
- Lönehantering
- ROT-avdrag
- Arbetsordrar
- Material- och leverantörshantering

### Nyckelstatistik

| Mätvärde | Antal |
|----------|-------|
| React-komponenter | 149+ |
| API-routes | 162+ |
| Custom hooks | 36+ |
| Kodrader | 50,000+ |
| Sidvisningar/routes | 40+ |
| SQL-migreringar | 70+ |

---

## 2. Teknisk Stack

### Frontend

| Teknik | Version | Användning |
|--------|---------|------------|
| Next.js | 16 | App Router, Server Components |
| React | 19 | UI-bibliotek |
| TypeScript | 5.x | Strikt läge |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | UI-komponenter |
| React Query | 5.x | Datahämtning & cache |
| Zustand | 4.x | State management |
| Lucide React | Latest | Ikoner |
| React Hook Form | 7.x | Formulär |
| date-fns | 3.x | Datumhantering |
| Sonner | Latest | Toast-notiser |

### Backend

| Teknik | Användning |
|--------|------------|
| Supabase | PostgreSQL, Auth, Storage, Realtime |
| Row Level Security (RLS) | Multi-tenant isolation |
| pgvector | Vektorsökning för RAG |
| pgcrypto | Kryptering av känslig data |
| Edge Functions | Serverless-funktioner |

### AI-Stack

| Teknik | Användning |
|--------|------------|
| Google Gemini 2.5 Flash | OCR, bildanalys |
| OpenAI Whisper | (Planerad) Röst-till-text |
| pgvector | RAG för leverantörsigenkänning |

### Infrastruktur

| Tjänst | Användning |
|--------|------------|
| Vercel | Hosting, Edge Network |
| Supabase | Databas, Auth, Storage |
| Sentry | Felrapportering |
| Resend | E-post |

---

## 3. Databasschema

### Kärnentiteter

#### Tenant (Hyresgäst/Företag)
```typescript
interface Tenant {
  id: UUID;
  name: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### Client (Kund)
```typescript
interface Client {
  id: UUID;
  tenant_id: UUID;
  name: string;
  email: string;
  org_number: string;
  address: string;
  phone: string;
  archived: boolean;
}
```

#### Employee (Anställd)
```typescript
interface Employee {
  id: UUID;
  tenant_id: UUID;
  auth_user_id: UUID;
  full_name: string;
  email: string;
  role: 'admin' | 'employee';
  default_rate_sek: number;
}
```

#### Project (Projekt)
```typescript
interface Project {
  id: UUID;
  tenant_id: UUID;
  client_id: UUID;
  name: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  price_model: 'hourly' | 'fixed' | 'budget';
  budget: number;
  hourly_rate: number;
  markup_percent: number;
  is_rot_rut: boolean;
  start_date: date;
  end_date: date;
}
```

#### TimeEntry (Tidspost)
```typescript
interface TimeEntry {
  id: UUID;
  tenant_id: UUID;
  employee_id: UUID;
  project_id: UUID;
  date: date;
  hours_total: number;
  amount_total: number;
  is_billed: boolean;
  start_time: time;
  end_time: time;
  break_minutes: number;
  start_location_lat: number;
  start_location_lng: number;
  work_site_id: UUID;
  // Nya fält (Phase 2)
  aeta_request_id: UUID;
  mileage_km: number;
  travel_cost_sek: number;
  photos: text[];
  description: text;
}
```

#### Invoice (Faktura)
```typescript
interface Invoice {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  client_id: UUID;
  amount: number;
  status: string;
  number: string;
  issue_date: date;
  due_date: date;
}
```

#### Quote (Offert)
```typescript
interface Quote {
  id: UUID;
  tenant_id: UUID;
  quote_number: string;
  version_number: number;
  title: string;
  customer_id: UUID;
  project_id: UUID;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'archived';
  valid_until: date;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
}
```

#### WorkOrder (Arbetsorder)
```typescript
interface WorkOrder {
  id: UUID;
  tenant_id: UUID;
  number: string;
  title: string;
  description: text;
  project_id: UUID;
  assigned_to: UUID;
  status: string;
  priority: string;
  scheduled_date: date;
  // Nya fält (Phase 2)
  work_order_type: 'standard' | 'ata' | 'damage' | 'sales';
  estimated_hours: string;
  aeta_request_id: UUID;
  quote_item_id: UUID;
  material_requirements: JSONB;
  safety_requirements: text[];
}
```

#### ÄTA Request
```typescript
interface AetaRequest {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  title: string;
  description: text;
  change_type: 'ADDITION' | 'MODIFICATION' | 'UNFORESEEN';
  status: 'draft' | 'pending_admin' | 'pending_customer' | 'approved' | 'rejected' | 'completed';
  estimated_cost: number;
  actual_cost: number;
  photos: text[];
}
```

#### ROT Application
```typescript
interface RotApplication {
  id: UUID;
  tenant_id: UUID;
  project_id: UUID;
  client_id: UUID;
  customer_person_number: string; // Krypterat
  property_designation: string;
  work_type: string;
  work_cost_sek: number;
  material_cost_sek: number;
  total_cost_sek: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  // Nya fält (SKV 5017)
  property_type: 'BRF' | 'HOUSE' | 'APARTMENT' | 'TOWNHOUSE' | 'OTHER';
  apartment_number: string;
  brf_org_number: string;
  work_start_date: date;
  work_end_date: date;
  work_details: JSONB;
  customer_declarations: JSONB;
  deductible_amount: number;
}
```

### Stödtabeller

- `work_sites` - Arbetsplatser med GPS & geofencing
- `materials` - Materialdatabas
- `suppliers` - Leverantörsregister
- `supplier_invoices` - Leverantörsfakturor
- `schedule_slots` - Schemaläggning
- `schedule_patterns` - Återkommande scheman
- `schedule_exceptions` - Frånvaro/undantag
- `absences` - Semster/sjukfrånvaro
- `payroll_periods` - Löneperioder
- `notifications` - Push-notiser
- `audit_trail` - Revisionslogg
- `ai_conversations` - AI-chathistorik

---

## 4. Sidor & Funktioner

### Huvudsidor

| Route | Funktion | Status |
|-------|----------|--------|
| `/` | Dashboard | ✅ Live |
| `/projects` | Projektlista | ✅ Live |
| `/projects/[id]` | Projektdetaljer | ✅ Live |
| `/projects/new` | Skapa projekt | ✅ Live |
| `/invoices` | Fakturalista | ✅ Live |
| `/invoices/new` | Skapa faktura | ✅ Live |
| `/quotes` | Offertlista | ✅ Live |
| `/quotes/new` | Skapa offert | ✅ Live |
| `/employees` | Anställda | ✅ Live |
| `/clients` | Kunder | ✅ Live |
| `/time-tracking` | Tidrapportering | ✅ Live |
| `/reports/new` | Skapa tidsrapport | ✅ Live |
| `/payroll` | Lönehantering | ✅ Live |
| `/payroll/periods` | Löneperioder | ✅ Live |
| `/rot` | ROT-ansökningar | ✅ Live |
| `/rot/new` | Ny ROT-ansökan | ✅ Live |
| `/work-orders` | Arbetsordrar | ✅ Live |
| `/aeta` | ÄTA-hantering | ✅ Live |
| `/materials` | Material | ✅ Live |
| `/supplier-invoices` | Leverantörsfakturor | ✅ Live |
| `/calendar` | Kalender/Schema | ✅ Live |
| `/analytics` | Analys & Rapporter | ✅ Live |
| `/kma` | Kvalitetskontroll | ✅ Live |
| `/delivery-notes` | Följesedlar | ✅ Live |

### Adminsidor

| Route | Funktion |
|-------|----------|
| `/admin` | Admindashboard |
| `/admin/debug` | Debug-verktyg |
| `/admin/live-map` | GPS-tracking karta |
| `/admin/work-sites` | Hantera arbetsplatser |

### Inställningar

| Route | Funktion |
|-------|----------|
| `/settings/integrations` | Fortnox/Visma |
| `/settings/subscription` | Prenumeration |
| `/settings/utseende` | Tema & utseende |
| `/settings/import` | CSV-import |

### Publika sidor

| Route | Funktion |
|-------|----------|
| `/public/[token]` | Offert-godkännande |
| `/login` | Inloggning |
| `/signup` | Registrering |
| `/onboarding` | Onboarding-flöde |

---

## 5. API-routes

### Projekt
- `POST /api/create-project` - Skapa projekt
- `GET /api/dashboard/data` - Dashboard-data
- `GET /api/dashboard/stats` - Dashboard-statistik

### Anställda
- `GET /api/employees/list` - Lista anställda
- `POST /api/employees/create` - Skapa anställd
- `GET /api/employees/[id]` - Hämta anställd
- `PUT /api/employees/[id]/update` - Uppdatera
- `POST /api/employees/[id]/archive` - Arkivera

### Schemaläggning
- `GET /api/schedules/list` - Lista scheman
- `POST /api/schedules/create` - Skapa schema
- `DELETE /api/schedules/delete` - Ta bort

### Prenumerationer
- `GET /api/subscriptions/current` - Nuvarande plan
- `GET /api/subscriptions/plans` - Tillgängliga planer
- `POST /api/subscriptions/checkout` - Starta checkout
- `GET /api/subscriptions/portal` - Kundportal

### Stripe
- `POST /api/stripe/webhook` - Stripe webhooks
- `POST /api/stripe/create-checkout` - Checkout session

### Sök
- `GET /api/search` - Global sökning

### Feedback
- `POST /api/feedback` - Skicka feedback

---

## 6. Custom Hooks

### Kärnhooks

| Hook | Funktion |
|------|----------|
| `useProjects` | Hämta & hantera projekt |
| `useClients` | Hämta & hantera kunder |
| `useEmployees` | Hämta & hantera anställda |
| `useInvoices` | Fakturering |
| `useQuotes` | Offerter |
| `useWorkOrders` | Arbetsordrar |
| `useMaterials` | Material |
| `useSupplierInvoices` | Leverantörsfakturor |
| `useSchedules` | Schemaläggning |
| `useAbsences` | Frånvaro |
| `usePayrollPeriods` | Löneperioder |
| `useRotApplications` | ROT-ansökningar |

### AI-hooks

| Hook | Funktion |
|------|----------|
| `useAIBudgetPrediction` | AI-budgetprognos |
| `useAIInvoiceSuggestion` | AI-fakturaförslag |
| `useAIProjectPlan` | AI-projektplanering |
| `useAIMaterialIdentification` | AI-materialigenkänning |
| `useAIKMA` | AI för kvalitetskontroll |
| `useStreamingChat` | AI-chatbot |

### Hjälphooks

| Hook | Funktion |
|------|----------|
| `useDebounce` | Fördröjning av input |
| `useThrottle` | Throttling |
| `useKeyboardShortcuts` | Tangentbordsgenvägar |
| `useOnlineStatus` | Online/offline-status |
| `usePermissions` | Behörighetskontroll |
| `useUserRole` | Användarroll |
| `useSubscription` | Prenumerationsstatus |
| `useSyncStatus` | Synkstatus |
| `useSearch` | Global sökning |

---

## 7. Komponenter

### AI-komponenter (`/app/components/ai/`)
- `AiAssistant.tsx` - AI-assistent
- `AIBalanceWidget.tsx` - AI-saldovisning
- `AIChatbot.tsx` - Chatbot
- `AIChatbotClient.tsx` - Klient-chatbot
- `AiChatBubble.tsx` - Chattbubbla
- `AiChatWindow.tsx` - Chattfönster
- `BudgetAIPrediction.tsx` - Budgetprognos
- `KMAIISuggestion.tsx` - KMA-förslag
- `MaterialAIIdentifier.tsx` - Materialigenkänning
- `PaymentModal.tsx` - Betalningsmodal
- `ProjectAIPlanning.tsx` - Projektplanering

### Analytik (`/app/components/analytics/`)
- `DashboardAnalytics.tsx` - Dashboard-analytik
- `ProjectAnalytics.tsx` - Projektanalytik

### Formulär (`/app/components/forms/`)
- Diverse formulärkomponenter

### Integrationer (`/app/components/integrations/`)
- 18 integrationskomponenter för Fortnox/Visma

### Lönehantering (`/app/components/payroll/`)
- `ExportButton.tsx` - Exportknapp
- `PeriodFilters.tsx` - Periodfilter
- `PeriodForm.tsx` - Periodformulär
- `PeriodList.tsx` - Periodlista
- `ValidationIssues.tsx` - Valideringsproblem

### Offerter (`/app/components/quotes/`)
- 13 offertkomponenter

### Schemaläggning (`/app/components/scheduling/`)
- 6 schemakomponenter
- `ScheduleModal.tsx` - Schemamodal

### ROT (`/app/components/rot/`)
- 4 ROT-komponenter

### UI (`/app/components/ui/`)
- 19 baskomponenter (Button, Input, Select, etc.)

---

## 8. AI & Automation

### OCR-fakturering
- **Teknik:** Google Gemini 2.0 Flash
- **Noggrannhet:** 95%+
- **Funktioner:**
  - Automatisk fältextraktion
  - Radigenkänning
  - Momsberäkning
  - Leverantörsigenkänning (RAG)

### AI-projektsammanfattningar
- **Teknik:** Groq Llama 3.3 70B
- **Funktioner:**
  - Automatiska sammanfattningar
  - Nyckelinsikter
  - Riskidentifiering

### Prediktiva budgetvarningar
- **Funktioner:**
  - Tröskelvarningar (75%, 90%, 100%)
  - Trendanalys
  - Åtgärdsrekommendationer

### RAG-leverantörsigenkänning
- **Teknik:** pgvector + LLM
- **Funktioner:**
  - Fuzzy matching
  - Historisk inlärning
  - Konfidenspoäng

---

## 9. Integrationer

### Implementerade (Stubs)

| Integration | Status | Funktion |
|-------------|--------|----------|
| Fortnox | 🟡 Stub | Bokföring, fakturering |
| Visma eAccounting | 🟡 Stub | Bokföring |
| Visma Payroll | 🟡 Stub | Lönehantering |
| Google OAuth | ✅ Live | Inloggning |
| Stripe | ✅ Live | Betalningar |
| Resend | ✅ Live | E-post |

### Planerade

| Integration | Prioritet |
|-------------|-----------|
| BankID | Hög |
| PEPPOL | Medium |
| Twilio/46elks SMS | Hög |
| UC/Roaring kreditupp. | Medium |

---

## 10. Befintliga Planer

### v2-prd-legal-fortress.md
Komplett PRD för V2 "Legal Fortress"-konceptet:
- 4 Pelare: Projekthantering, Juridiskt skydd, Fältverktyg, Admin/Finans
- Detaljerat ÄTA-flöde med push-notiser
- Anti-scam moduler (kreditkontroll, svartlistor)
- Teknisk arkitektur
- Roadmap Q1-Q4 2026

### v2-binder-spec.md
DMS-specifikation för dokumenthantering:
- Mappstruktur enligt BSAB/CoClass
- RBAC-behörigheter
- Versionering
- Extern delning

### v2-brainstorming.md
"Steal & Ship"-idéer:
- iBinder-klon
- SSG-ersättare
- Bluebeam Lite
- Meps-integration

### details-view-improvements.md
Förbättringsplan för detaljvyer:
- `DetailLayout`-komponent
- Tabbaserad navigation
- Bättre sortering/filtrering

---

## 11. Kända Begränsningar

### Tekniska begränsningar

| Problem | Konsekvens | V2-lösning |
|---------|-----------|------------|
| PWA-begränsningar | Dålig kameraåtkomst, sessionsförlust | React Native app |
| Offline-stöd | Basic optimistic UI | WatermelonDB sync |
| SMS saknas | Kan inte skicka notiser | 46elks/Bird integration |
| BankID saknas | Ingen e-signering | Idura integration |

### Funktionella gap

| Gap | Beskrivning | Prioritet |
|-----|-------------|-----------|
| ÄTA-godkännande | Ingen kundsignering | P0 |
| Kreditkontroll | Manuell process | P1 |
| Ritningsvisare | Endast PDF-visning | P2 |
| KMA-checklistor | Inte flexibla | P2 |
| Personalliggare | Saknas helt | P3 |

### Säkerhet

| Område | Status |
|--------|--------|
| RLS | ✅ Implementerat |
| Kryptering (PNR) | ✅ AES-256-GCM |
| Auth | ✅ Supabase Auth |
| Audit Trail | ✅ Grundläggande |
| GDPR | 🟡 Delvis |

---

## Appendix: Filstruktur

```
frost-solutions/
├── app/
│   ├── admin/              # Admin-sidor
│   ├── aeta/               # ÄTA-hantering
│   ├── analytics/          # Analytik
│   ├── api/                # API-routes (50+)
│   ├── auth/               # Autentisering
│   ├── calendar/           # Kalender
│   ├── clients/            # Kunder
│   ├── components/         # 149+ komponenter
│   ├── context/            # React Context
│   ├── delivery-notes/     # Följesedlar
│   ├── employees/          # Anställda
│   ├── feedback/           # Feedback
│   ├── hooks/              # 36+ custom hooks
│   ├── invoices/           # Fakturor
│   ├── kma/                # Kvalitetskontroll
│   ├── login/              # Inloggning
│   ├── materials/          # Material
│   ├── onboarding/         # Onboarding
│   ├── payroll/            # Lönehantering
│   ├── projects/           # Projekt
│   ├── providers/          # React Query
│   ├── public/             # Publika sidor
│   ├── quotes/             # Offerter
│   ├── reports/            # Rapporter
│   ├── rot/                # ROT-avdrag
│   ├── settings/           # Inställningar
│   ├── signup/             # Registrering
│   ├── supplier-invoices/  # Leverantörsfakturor
│   ├── suppliers/          # Leverantörer
│   ├── time-tracking/      # Tidrapportering
│   ├── types/              # TypeScript-typer
│   ├── utils/              # Hjälpfunktioner
│   ├── work-orders/        # Arbetsordrar
│   └── workflows/          # Workflows
├── docs/                   # 68 dokumentationsfiler
├── plans/                  # Planeringsdokument
├── public/                 # Statiska filer, SW
├── sql/                    # 70+ SQL-filer
├── supabase/               # Edge Functions
└── tests/                  # Playwright-tester
```

---

*Dokumentet skapades: 2026-01-30*  
*Version: 1.0.0*
