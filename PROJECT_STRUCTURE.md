# 🏗️ FROST SOLUTIONS - COMPLETE PROJECT STRUCTURE

**Generated:** $(date)  
**Total Files:** 409 TypeScript files + 233 TSX files + 238 Markdown files

---

## 📁 ROOT DIRECTORY STRUCTURE

```
frost-solutions/
├── 📄 Configuration Files
│   ├── package.json                    # Dependencies & scripts
│   ├── package-lock.json               # Lock file
│   ├── tsconfig.json                   # TypeScript config
│   ├── next.config.mjs                 # Next.js config
│   ├── tailwind.config.js              # Tailwind CSS config
│   ├── postcss.config.js               # PostCSS config
│   ├── jest.config.js                  # Jest test config
│   ├── jest.setup.js                   # Jest setup
│   ├── middleware.ts                   # Next.js middleware
│   ├── vercel.json                     # Vercel deployment config
│   ├── next-env.d.ts                   # Next.js types
│   ├── sw.js                           # Service worker (legacy)
│   ├── eng.traineddata                 # Tesseract OCR data
│   ├── swe.traineddata                 # Tesseract OCR Swedish data
│   ├── file-structure.txt               # Legacy structure doc
│   └── frost_nightlog.txt              # Night factory log
│
├── 📁 app/                             # Next.js App Router (MAIN APPLICATION)
│   ├── 📄 layout.tsx                   # Root layout
│   ├── 📄 page.tsx                     # Home page
│   ├── 📄 globals.css                  # Global styles
│   │
│   ├── 📁 admin/                       # Admin pages (5 files)
│   │   ├── page.tsx
│   │   ├── aeta/page.tsx
│   │   ├── debug/page.tsx
│   │   ├── live-map/page.tsx
│   │   └── work-sites/page.tsx
│   │
│   ├── 📁 analytics/                  # Analytics dashboard
│   │   └── page.tsx
│   │
│   ├── 📁 api/                         # API Routes (162 files!)
│   │   ├── 📁 ai/                      # AI endpoints
│   │   │   ├── chat/route.ts
│   │   │   ├── feedback/route.ts
│   │   │   ├── identify-material/route.ts
│   │   │   ├── predict-budget/route.ts
│   │   │   ├── suggest-invoice/route.ts
│   │   │   ├── suggest-kma-checklist/route.ts
│   │   │   ├── suggest-project-plan/route.ts
│   │   │   └── summarize/route.ts
│   │   ├── 📁 absences/
│   │   ├── 📁 audit-logs/
│   │   ├── 📁 clients/
│   │   ├── 📁 invoices/
│   │   ├── 📁 materials/
│   │   ├── 📁 payroll/
│   │   ├── 📁 projects/
│   │   ├── 📁 quotes/
│   │   ├── 📁 rot/
│   │   ├── 📁 suppliers/
│   │   ├── 📁 supplier-invoices/
│   │   ├── 📁 tenant/
│   │   ├── 📁 time-entries/
│   │   ├── 📁 work-orders/
│   │   └── 📁 integrations/
│   │
│   ├── 📁 auth/                        # Authentication (3 files)
│   │   ├── actions.ts
│   │   ├── callback/page.tsx
│   │   └── set-tenant/route.ts
│   │
│   ├── 📁 components/                  # React Components (149 files!)
│   │   ├── 📁 ai/                      # AI components
│   │   │   ├── AIChatbot.tsx
│   │   │   ├── AIChatbotClient.tsx
│   │   │   ├── AIChatbotWrapper.tsx
│   │   │   ├── AiAssistant.tsx
│   │   │   ├── AiChatBubble.tsx
│   │   │   ├── AiChatWindow.tsx
│   │   │   ├── AiCostBadge.tsx
│   │   │   ├── AiTypingIndicator.tsx
│   │   │   ├── BudgetAIPrediction.tsx
│   │   │   ├── InvoiceAISuggestion.tsx
│   │   │   ├── KMAIISuggestion.tsx
│   │   │   ├── MaterialAIIdentifier.tsx
│   │   │   ├── ProjectAIPlanning.tsx
│   │   │   └── 📁 ui/                  # AI UI components
│   │   ├── 📁 analytics/              # Analytics components
│   │   ├── 📁 factoring/               # Factoring components
│   │   ├── 📁 integrations/            # Integration components
│   │   ├── 📁 ocr/                     # OCR components
│   │   ├── 📁 payroll/                 # Payroll components
│   │   ├── 📁 performance/             # Performance components
│   │   ├── 📁 quotes/                  # Quote components
│   │   ├── 📁 rbac/                    # RBAC components
│   │   ├── 📁 rot/                     # ROT components
│   │   ├── 📁 scheduling/              # Scheduling components
│   │   ├── 📁 search/                  # Search components
│   │   ├── 📁 supplier-invoices/       # Supplier invoice components
│   │   ├── 📁 suppliers/               # Supplier components
│   │   ├── 📁 ui/                      # UI primitives (shadcn/ui)
│   │   │   ├── accessible-button.tsx
│   │   │   ├── accessible-file-upload.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-message.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── table.tsx
│   │   └── 📁 workflows/               # Workflow components
│   │
│   ├── 📁 context/                     # React Context (2 files)
│   │   ├── TenantContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── 📁 hooks/                       # Custom React Hooks (36 files)
│   │   ├── useAIBudgetPrediction.ts
│   │   ├── useAIInvoiceSuggestion.ts
│   │   ├── useAIKMA.ts
│   │   ├── useAIMaterialIdentification.ts
│   │   ├── useAIProjectPlan.ts
│   │   ├── useAbsences.ts
│   │   ├── useAdmin.ts
│   │   ├── useClients.ts
│   │   ├── useDashboardAnalytics.ts
│   │   ├── useDebounce.ts
│   │   ├── useEmployees.ts
│   │   ├── useFactoringOffers.ts
│   │   ├── useIntegrations.ts
│   │   ├── useInvoices.ts
│   │   ├── useMaterials.ts
│   │   ├── useOnlineStatus.ts
│   │   ├── usePayrollPeriods.ts
│   │   ├── usePermissions.ts
│   │   ├── useProjectAnalytics.ts
│   │   ├── useProjects.ts
│   │   ├── useQuoteActions.ts
│   │   ├── useQuoteItems.ts
│   │   ├── useQuoteTemplates.ts
│   │   ├── useQuotes.ts
│   │   ├── useRotApplications.ts
│   │   ├── useScheduleReminders.ts
│   │   ├── useSchedules.ts
│   │   ├── useSearch.ts
│   │   ├── useStreamingChat.ts
│   │   ├── useSupplierInvoices.ts
│   │   ├── useSuppliers.ts
│   │   ├── useSyncStatus.ts
│   │   ├── useThrottle.ts
│   │   ├── useUserRole.ts
│   │   └── useWorkOrders.ts
│   │
│   ├── 📁 lib/                         # Shared Libraries (178 files!)
│   │   ├── 📁 ai/                      # AI Integration (15 files)
│   │   │   ├── ai-utils.ts
│   │   │   ├── anti-loop.ts
│   │   │   ├── cache.ts
│   │   │   ├── claude.ts
│   │   │   ├── common.ts
│   │   │   ├── frost-bygg-ai-integration.ts  ⭐ NEW
│   │   │   ├── frost-bygg-ai-examples.tsx   ⭐ NEW
│   │   │   ├── huggingface.ts
│   │   │   ├── intent.ts
│   │   │   ├── memory.ts
│   │   │   ├── openai-client.ts
│   │   │   ├── prompt.ts
│   │   │   ├── prompts.ts
│   │   │   ├── ratelimit.ts
│   │   │   ├── security-guard.ts
│   │   │   ├── telemetry.ts
│   │   │   ├── templates.ts
│   │   │   └── tools.ts
│   │   ├── 📁 api/                     # API clients
│   │   ├── 📁 clients/                 # External clients
│   │   ├── 📁 crypto/                  # Encryption utilities
│   │   ├── 📁 db/                      # Database utilities
│   │   ├── 📁 domain/                  # Domain logic
│   │   ├── 📁 email/                   # Email utilities
│   │   ├── 📁 encryption.ts           # Encryption
│   │   ├── 📁 error-handling/          # Error handling
│   │   ├── 📁 factoring/               # Factoring logic
│   │   ├── 📁 featureFlags.ts          # Feature flags
│   │   ├── 📁 formatters.ts           # Formatters
│   │   ├── 📁 gpsUtils.ts             # GPS utilities
│   │   ├── 📁 guards/                  # Guards
│   │   ├── 📁 http/                    # HTTP utilities
│   │   ├── 📁 i18n/                    # Internationalization
│   │   ├── 📁 idb-persister.ts        # IndexedDB persister
│   │   ├── 📁 idempotency.ts          # Idempotency
│   │   ├── 📁 integrations/           # Integration logic (Fortnox/Visma)
│   │   ├── 📁 markup/                  # Invoice markup
│   │   ├── 📁 middleware/              # Middleware
│   │   ├── 📁 notifications.ts       # Notifications
│   │   ├── 📁 obCalculation.ts       # OB calculations
│   │   ├── 📁 ocr/                     # OCR processing
│   │   ├── 📁 offline/                # Offline support
│   │   ├── 📁 payroll/                # Payroll logic
│   │   ├── 📁 pdf/                     # PDF generation
│   │   ├── 📁 performance/            # Performance utilities
│   │   ├── 📁 pricing/                # Pricing logic
│   │   ├── 📁 projects/               # Project utilities
│   │   ├── 📁 queryClient.ts          # React Query client
│   │   ├── 📁 quotes/                 # Quote logic
│   │   ├── 📁 rateLimit.ts            # Rate limiting
│   │   ├── 📁 rbac/                   # RBAC logic
│   │   ├── 📁 repositories/          # Data repositories
│   │   ├── 📁 rot/                    # ROT logic
│   │   ├── 📁 scheduling/            # Scheduling logic
│   │   ├── 📁 schemas/               # Zod schemas
│   │   ├── 📁 security/              # Security utilities
│   │   ├── 📁 serverTenant.ts        # Server tenant
│   │   ├── 📁 services/              # Business services
│   │   ├── 📁 storage/              # Storage utilities
│   │   ├── 📁 store/                # Zustand stores
│   │   ├── 📁 supabaseServer.ts     # Supabase server client
│   │   ├── 📁 sync/                  # Sync logic
│   │   ├── 📁 timeRounding.ts       # Time rounding
│   │   ├── 📁 toast.ts              # Toast notifications
│   │   ├── 📁 ui/                   # UI utilities
│   │   ├── 📁 useTenant.ts          # Tenant hook
│   │   ├── 📁 utils.ts              # General utilities
│   │   ├── 📁 utils/                # More utilities
│   │   ├── 📁 validation/          # Validation
│   │   ├── 📁 work-order-state-machine.ts
│   │   ├── 📁 work-orders/          # Work order utilities
│   │   ├── 📁 workers/              # Background workers
│   │   └── 📁 workflows/            # Workflow logic
│   │
│   ├── 📁 types/                      # TypeScript Types (14 files)
│   │   ├── ai.ts
│   │   ├── factoring.ts
│   │   ├── integrations.ts
│   │   ├── materials.ts
│   │   ├── ocr.ts
│   │   ├── payroll.ts
│   │   ├── quotes.ts
│   │   ├── rot.ts
│   │   ├── scheduling.ts
│   │   ├── supabase.ts
│   │   ├── supabase-generated.ts
│   │   ├── supplierInvoices.ts
│   │   ├── work-orders.ts
│   │   └── workflow.ts
│   │
│   ├── 📁 utils/                      # Utility Functions (12 files)
│   │   ├── darkModeHelpers.ts
│   │   ├── mocks/
│   │   ├── server/
│   │   └── supabase/
│   │
│   └── 📁 [Feature Pages]/           # Feature-specific pages
│       ├── 📁 aeta/
│       ├── 📁 bug-fixes/
│       ├── 📁 calendar/
│       ├── 📁 clients/
│       ├── 📁 dashboard/
│       ├── 📁 delivery-notes/
│       ├── 📁 employees/
│       ├── 📁 faq/
│       ├── 📁 feedback/
│       ├── 📁 integrations/
│       ├── 📁 invoices/
│       ├── 📁 kma/
│       ├── 📁 login/
│       ├── 📁 materials/
│       ├── 📁 onboarding/
│       ├── 📁 password-setup/
│       ├── 📁 payroll/
│       ├── 📁 projects/
│       ├── 📁 providers/
│       ├── 📁 public/
│       ├── 📁 quotes/
│       ├── 📁 reports/
│       ├── 📁 rot/
│       ├── 📁 settings/
│       ├── 📁 supplier-invoices/
│       ├── 📁 suppliers/
│       ├── 📁 work-orders/
│       └── 📁 workflows/
│
├── 📁 docs/                            # Documentation (234 files!)
│   ├── FROST_BYGG_AI_SETUP.md          ⭐ NEW
│   ├── README.md
│   ├── 📁 prompts/                     # AI prompts
│   └── [Many other docs...]
│
├── 📁 public/                          # Static Assets
│   ├── offline.html
│   ├── service-worker.js
│   ├── sw.js
│   └── sw.ts
│
├── 📁 sql/                             # SQL Scripts (50+ files)
│   ├── 📁 archive/
│   ├── 📁 migrations/
│   └── [Many SQL files...]
│
├── 📁 supabase/                        # Supabase Config (10 files)
│   ├── 📁 functions/
│   ├── 📁 rpc/
│   └── [Config files...]
│
└── 📁 __tests__/                       # Tests (1 file)
    └── 📁 lib/
```

---

## 🔴 KNOWN ISSUES & BROKEN FEATURES

### 1. **PAYROLL EXPORT ISSUES** (CRITICAL)

**Files Affected:**
- `app/components/payroll/ExportButton.tsx` - HMR error with Download icon
- `app/components/payroll/ValidationIssues.tsx` - Related HMR issue
- `app/lib/payroll/periods.ts` - Period creation not working
- `app/lib/payroll/employeeColumns.ts` - Column detection issues
- `app/lib/payroll/exporters/helpers.ts` - Export functionality broken
- `app/api/payroll/periods/[id]/export/route.ts` - Export API route

**Problems:**
- ❌ HMR Error: Download icon cache issue in Next.js 16/Turbopack
- ❌ Cannot create payroll periods
- ❌ Cannot export payroll periods
- ❌ Column detection not working properly

**Documentation:**
- `docs/PROMPT_CHATGPT5_PAYROLL_FIXES.md`
- `docs/PROMPT_CLAUDE45_PAYROLL_FIXES.md`
- `docs/PROMPT_EXTERNAL_AI_PAYROLL_FIXES.md`
- `docs/PROMPT_GPT4O_PAYROLL_FIXES.md`

---

### 2. **MISSING DEPENDENCIES** (MEDIUM)

**Files Affected:**
- Multiple components using `date-fns` but not installed
- Multiple components using `react-hook-form` but not installed

**Problems:**
- ❌ `date-fns` - Used but not in package.json
- ❌ `react-hook-form` - Used but not in package.json

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 3. **API RESPONSE FORMAT MISMATCH** (MEDIUM)

**Files Affected:**
- Multiple API clients expecting `data.data` format
- Backend returning `{ success: true, data }` format

**Problems:**
- ❌ API clients not handling `success` field correctly
- ❌ Inconsistent response format handling

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 4. **QUOTE API ENDPOINT MISMATCH** (LOW)

**Files Affected:**
- `app/hooks/useQuotes.ts`
- `app/api/quotes/[id]/items/route.ts`

**Problems:**
- ❌ Frontend expects `PUT /api/quotes/${id}/items/${itemId}`
- ❌ Backend has `PUT /api/quotes/${id}/items` with body.id
- ❌ Frontend expects `DELETE /api/quotes/${id}/items/${itemId}`
- ❌ Backend has `DELETE /api/quotes/${id}/items` with body.id

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 5. **IMPORT ERRORS** (LOW)

**Files Affected:**
- Various components with incorrect import paths

**Problems:**
- ❌ `useTenant` imported from wrong path
- ❌ `extractErrorMessage` imported from wrong path
- ❌ Some components missing type imports

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 6. **NEW AI INTEGRATION FILES** (NEEDS TESTING)

**Files Created:**
- ✅ `app/lib/ai/frost-bygg-ai-integration.ts` - Main integration library
- ✅ `app/lib/ai/frost-bygg-ai-examples.tsx` - Usage examples
- ✅ `docs/FROST_BYGG_AI_SETUP.md` - Setup guide

**Status:**
- ✅ Files created successfully
- ⚠️ Not yet integrated into existing codebase
- ⚠️ Needs API routes created
- ⚠️ Needs environment variables configured
- ⚠️ Needs testing

---

## 📊 FILE COUNT SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| **TypeScript Files (.ts)** | 409 | ✅ |
| **React Components (.tsx)** | 233 | ✅ |
| **Markdown Docs (.md)** | 238 | ✅ |
| **API Routes** | 162 | ✅ |
| **Components** | 149 | ✅ |
| **Hooks** | 36 | ✅ |
| **Types** | 14 | ✅ |
| **SQL Scripts** | 50+ | ✅ |

---

## 🎯 PRIORITY FIXES NEEDED

### 🔴 CRITICAL (Fix Immediately)
1. **Payroll Export Issues** - Blocks payroll functionality
2. **Period Creation** - Users cannot create periods

### 🟡 HIGH (Fix Soon)
3. **Missing Dependencies** - Install `date-fns` and `react-hook-form`
4. **API Response Format** - Standardize response handling

### 🟢 MEDIUM (Fix When Possible)
5. **Quote API Endpoints** - Align frontend/backend
6. **Import Errors** - Fix incorrect import paths
7. **AI Integration** - Create API routes and integrate

---

## ✅ WORKING FEATURES

- ✅ Authentication system
- ✅ Multi-tenant architecture
- ✅ Project management
- ✅ Invoice management
- ✅ Quote system
- ✅ ROT applications
- ✅ Work orders
- ✅ Time tracking
- ✅ Employee management
- ✅ Supplier management
- ✅ Material management
- ✅ Integration framework (Fortnox/Visma)
- ✅ OCR processing
- ✅ AI chatbot
- ✅ Offline support
- ✅ Sync system

---

**Last Updated:** $(date)  
**Total Lines of Code:** ~50,000+ (estimated)

