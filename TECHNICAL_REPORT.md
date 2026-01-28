# Frost Solutions - In-Depth Technical Report

**Generated:** January 26, 2026  
**Version:** 2.0  
**Platform:** Next.js 16 SaaS Application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Schema & Tables](#database-schema--tables)
5. [Frontend Modules](#frontend-modules)
6. [Backend API Routes](#backend-api-routes)
7. [Supabase Edge Functions](#supabase-edge-functions)
8. [AI & Automation Features](#ai--automation-features)
9. [Integration Modules](#integration-modules)
10. [Security & Authentication](#security--authentication)
11. [Component Library](#component-library)
12. [Custom Hooks](#custom-hooks)
13. [Utility Libraries](#utility-libraries)
14. [Background Jobs & Cron](#background-jobs--cron)
15. [File Structure](#file-structure)

---

## Executive Summary

**Frost Solutions** is a comprehensive, multi-tenant SaaS platform built specifically for Nordic construction companies and blue-collar businesses. The application consists of **50,000+ lines of code** across **700+ files**, featuring **27 major modules**, **162 API routes**, **149 React components**, and **36 custom hooks**.

### Key Statistics
- **Framework:** Next.js 16 (App Router) with React 19
- **Database:** Supabase PostgreSQL 15+ with Row Level Security
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand + React Query (TanStack Query)
- **AI Integration:** Google Gemini 2.0 Flash, Groq Llama 3.3 70B, OpenAI GPT-4
- **Deployment:** Vercel (Frontend) + Supabase (Backend)

---

## Architecture Overview

### Multi-Tenant Architecture
- **Tenant Isolation:** Complete data isolation via `tenant_id` on all tables
- **Row Level Security (RLS):** All tables protected with RLS policies
- **Tenant Context:** React Context API for tenant management
- **Middleware:** Next.js middleware for session and tenant validation

### Application Structure
```
frost-solutions/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (162 endpoints)
│   ├── components/        # React components (149 files)
│   ├── hooks/             # Custom React hooks (36 files)
│   ├── lib/               # Utility libraries (34 files)
│   ├── types/             # TypeScript type definitions
│   └── [routes]/          # Page routes
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   ├── migrations/        # Database migrations
│   └── rpc/               # PostgreSQL functions
├── sql/                   # SQL scripts (77 files)
└── public/                # Static assets
```

---

## Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.1 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.6.3 | Type safety |
| Tailwind CSS | 3.4.18 | Utility-first CSS |
| Zustand | 5.0.8 | State management |
| React Query | 5.90.6 | Server state management |
| React Hook Form | 7.48.0 | Form handling |
| Zod | 4.1.12 | Schema validation |
| date-fns | 2.30.0 | Date manipulation |
| Lucide React | 0.548.0 | Icon library |
| Sonner | 2.0.7 | Toast notifications |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Latest | PostgreSQL database + Auth + Storage |
| PostgreSQL | 15+ | Primary database |
| Deno | Latest | Edge Functions runtime |
| Stripe | 20.1.2 | Payment processing |
| Resend | 6.3.0 | Email service |

### AI Stack
| Technology | Purpose |
|------------|---------|
| Google Gemini 2.0 Flash | OCR and vision tasks |
| Groq Llama 3.3 70B | Text generation and summaries |
| OpenAI GPT-4 | Advanced AI features |
| pgvector | Vector embeddings for RAG |

### Development Tools
| Technology | Purpose |
|------------|---------|
| Jest | Unit testing |
| Playwright | E2E testing |
| ESLint | Code linting |
| Prettier | Code formatting |
| Sentry | Error tracking |

---

## Database Schema & Tables

### Core Tables

#### 1. **tenants**
Multi-tenant isolation table
- `id` (UUID, PK)
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 2. **employees**
User accounts linked to tenants
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `auth_user_id` (UUID, FK → auth.users)
- `full_name` (TEXT)
- `email` (TEXT)
- `role` (TEXT: 'admin' | 'employee')
- `default_rate_sek` (NUMERIC)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 3. **clients**
Customer/client management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `name` (TEXT)
- `email`, `phone`, `address` (TEXT)
- `org_number` (TEXT)
- `archived` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 4. **projects**
Project management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `client_id` (UUID, FK → clients)
- `name` (TEXT)
- `customer_name`, `customer_orgnr` (TEXT)
- `base_rate_sek` (NUMERIC)
- `budgeted_hours` (NUMERIC)
- `status` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 5. **time_entries**
Time tracking records
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `employee_id` (UUID, FK → employees)
- `project_id` (UUID, FK → projects)
- `date` (DATE)
- `start_time`, `end_time` (TIME)
- `hours_total` (NUMERIC)
- `ob_type` (TEXT: 'normal' | 'evening' | 'night' | 'weekend')
- `amount_total` (NUMERIC)
- `is_billed` (BOOLEAN)
- `break_minutes` (INTEGER)
- `start_location_lat`, `start_location_lng` (NUMERIC)
- `work_site_id` (UUID, FK → work_sites)
- `approval_status` (TEXT: 'pending' | 'approved' | 'rejected')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 6. **invoices**
Customer invoices
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `client_id` (UUID, FK → clients)
- `customer_name` (TEXT)
- `amount` (NUMERIC)
- `description` (TEXT)
- `status` (TEXT: 'draft' | 'sent' | 'paid' | 'overdue')
- `number` (TEXT)
- `issue_date`, `due_date` (DATE)
- `supplier` (TEXT)
- `ocr` (TEXT)
- `ai_data` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 7. **invoice_lines**
Invoice line items
- `id` (UUID, PK)
- `invoice_id` (UUID, FK → invoices)
- `tenant_id` (UUID, FK → tenants)
- `sort_order` (INTEGER)
- `description` (TEXT)
- `quantity` (NUMERIC)
- `unit` (TEXT)
- `rate_sek` (NUMERIC)
- `amount_sek` (NUMERIC)
- `created_at` (TIMESTAMPTZ)

### Specialized Tables

#### 8. **quotes**
Quote/estimation system
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `client_id` (UUID, FK → clients)
- `project_id` (UUID, FK → projects)
- `quote_number` (TEXT, UNIQUE)
- `status` (TEXT: 'draft' | 'sent' | 'approved' | 'rejected')
- `total_amount` (NUMERIC)
- `valid_until` (DATE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 9. **quote_items**
Quote line items
- `id` (UUID, PK)
- `quote_id` (UUID, FK → quotes)
- `description` (TEXT)
- `quantity` (NUMERIC)
- `unit_price` (NUMERIC)
- `discount_percent` (NUMERIC)
- `sort_order` (INTEGER)

#### 10. **rot_applications**
ROT-avdrag (Swedish tax deduction) applications
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `client_id` (UUID, FK → clients)
- `invoice_id` (UUID, FK → invoices)
- `customer_person_number` (TEXT, encrypted)
- `property_designation` (TEXT)
- `work_type` (TEXT)
- `work_cost_sek` (NUMERIC)
- `material_cost_sek` (NUMERIC)
- `total_cost_sek` (NUMERIC)
- `status` (TEXT: 'draft' | 'submitted' | 'approved' | 'rejected')
- `case_number` (TEXT)
- `status_timeline` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 11. **supplier_invoices**
Vendor/supplier invoice management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `supplier_id` (UUID, FK → suppliers)
- `project_id` (UUID, FK → projects)
- `invoice_number` (TEXT)
- `amount` (NUMERIC)
- `tax_amount` (NUMERIC)
- `due_date` (DATE)
- `status` (TEXT: 'pending' | 'approved' | 'paid')
- `ocr_status` (TEXT: 'pending' | 'processing' | 'completed')
- `ocr_data` (JSONB)
- `file_path` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 12. **materials**
Material/inventory management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `supplier_id` (UUID, FK → suppliers)
- `project_id` (UUID, FK → projects)
- `name` (TEXT)
- `description` (TEXT)
- `quantity` (NUMERIC)
- `unit` (TEXT)
- `unit_price` (NUMERIC)
- `total_cost` (NUMERIC)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 13. **work_orders**
Task/work order management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `assigned_to` (UUID, FK → employees)
- `title` (TEXT)
- `description` (TEXT)
- `priority` (TEXT: 'low' | 'medium' | 'high' | 'urgent')
- `status` (TEXT: 'new' | 'in_progress' | 'completed' | 'cancelled')
- `due_date` (DATE)
- `photos` (TEXT[])
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 14. **schedules**
Employee scheduling
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `employee_id` (UUID, FK → employees)
- `project_id` (UUID, FK → projects)
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `status` (TEXT: 'scheduled' | 'completed' | 'cancelled')
- `notes` (TEXT)
- `shift_type` (TEXT: 'normal' | 'transport')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 15. **absences**
Employee absence tracking
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `employee_id` (UUID, FK → employees)
- `start_date` (DATE)
- `end_date` (DATE)
- `type` (TEXT: 'vacation' | 'sick' | 'other')
- `reason` (TEXT)
- `status` (TEXT: 'pending' | 'approved' | 'rejected')
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 16. **work_sites**
GPS-enabled work site locations
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `name` (TEXT)
- `address` (TEXT)
- `latitude` (NUMERIC)
- `longitude` (NUMERIC)
- `geofence_radius_meters` (INTEGER, default: 500)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 17. **delivery_notes**
Följesedlar (delivery notes) with OCR
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `supplier_id` (UUID, FK → suppliers)
- `project_id` (UUID, FK → projects)
- `file_path` (TEXT)
- `ocr_status` (TEXT: 'pending' | 'processing' | 'completed' | 'failed')
- `ocr_data` (JSONB)
- `extracted_data` (JSONB)
- `supplier_name` (TEXT)
- `delivery_date` (DATE)
- `created_at`, `processed_at` (TIMESTAMPTZ)

#### 18. **suppliers**
Supplier/vendor database
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `name` (TEXT)
- `email`, `phone`, `address` (TEXT)
- `org_number` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 19. **notifications**
In-app notification system
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `user_id` (UUID, FK → employees)
- `type` (TEXT)
- `title` (TEXT)
- `message` (TEXT)
- `read` (BOOLEAN)
- `action_url` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 20. **audit_logs**
Comprehensive audit trail
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `user_id` (UUID, FK → employees)
- `table_name` (TEXT)
- `record_id` (UUID)
- `action` (TEXT: 'INSERT' | 'UPDATE' | 'DELETE')
- `old_data` (JSONB)
- `new_data` (JSONB)
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 21. **public_links**
Customer portal secure links
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `resource_type` (TEXT: 'quote' | 'invoice')
- `resource_id` (UUID)
- `token` (TEXT, UNIQUE)
- `expires_at` (TIMESTAMPTZ)
- `access_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)

#### 22. **project_budgets**
Project budget tracking
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `budget_amount` (NUMERIC)
- `alert_threshold_percent` (INTEGER, default: 80)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 23. **budget_alerts**
Budget warning system
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `project_id` (UUID, FK → projects)
- `budget_id` (UUID, FK → project_budgets)
- `severity` (TEXT: 'warning' | 'critical')
- `current_usage_percent` (NUMERIC)
- `acknowledged` (BOOLEAN)
- `resolved` (BOOLEAN)
- `created_at`, `resolved_at` (TIMESTAMPTZ)

#### 24. **integrations**
Third-party integration connections
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `provider` (TEXT: 'fortnox' | 'visma' | 'bankid' | 'peppol')
- `status` (TEXT: 'connected' | 'disconnected' | 'error')
- `access_token` (TEXT, encrypted)
- `refresh_token` (TEXT, encrypted)
- `expires_at` (TIMESTAMPTZ)
- `last_sync_at` (TIMESTAMPTZ)
- `config` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 25. **sync_jobs**
Integration sync job tracking
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `integration_id` (UUID, FK → integrations)
- `resource_type` (TEXT: 'customer' | 'invoice' | 'payroll')
- `status` (TEXT: 'pending' | 'processing' | 'completed' | 'failed')
- `records_synced` (INTEGER)
- `last_error` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 26. **ai_conversations**
AI chat conversation history
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `user_id` (UUID, FK → employees)
- `title` (TEXT)
- `summary` (TEXT)
- `message_count` (INTEGER)
- `last_message_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 27. **ai_messages**
AI chat messages
- `id` (UUID, PK)
- `conversation_id` (UUID, FK → ai_conversations)
- `role` (TEXT: 'user' | 'assistant' | 'system')
- `content` (TEXT)
- `intent` (TEXT)
- `tools_used` (JSONB)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

#### 28. **subscriptions**
Stripe subscription management
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `stripe_subscription_id` (TEXT)
- `stripe_customer_id` (TEXT)
- `status` (TEXT: 'active' | 'canceled' | 'past_due')
- `plan` (TEXT)
- `current_period_end` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 29. **ai_credits**
AI usage credit tracking
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `credits_used` (INTEGER)
- `credits_remaining` (INTEGER)
- `last_reset_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 30. **tenant_feature_flags**
Feature flag management per tenant
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `feature_name` (TEXT)
- `enabled` (BOOLEAN)
- `config` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Database Functions & Views

#### RPC Functions (PostgreSQL)
- `approve_time_entries()` - Bulk approve time entries
- `get_existing_columns()` - Schema introspection
- `supplier_invoices_v2()` - Enhanced supplier invoice queries
- `verify_and_fix_all()` - Data integrity checks
- `verify_setup()` - System verification

#### Views
- `dashboard_analytics` - Aggregated dashboard metrics
- `integration_sync_status` - Integration sync status view
- `schedule_conflicts` - Schedule conflict detection

---

## Frontend Modules

### Page Routes (`app/`)

#### 1. **Dashboard** (`/dashboard`)
- **File:** `app/dashboard/page.tsx`, `app/dashboard/DashboardClient.tsx`
- **Features:**
  - Real-time statistics cards
  - Time clock integration
  - Project overview cards with budget indicators
  - Weekly schedules component
  - Quick actions menu
  - Notification center

#### 2. **Time Tracking** (`/time-tracking`)
- **File:** `app/time-tracking/page.tsx`
- **Features:**
  - Time entry forms with OB type selection
  - Weekly/monthly calendar views
  - Supervisor approval queue
  - Offline support with sync queue
  - Export capabilities

#### 3. **Projects** (`/projects`)
- **Files:**
  - `app/projects/page.tsx` - List view
  - `app/projects/[id]/page.tsx` - Detail view
  - `app/projects/new/page.tsx` - Create form
  - `app/projects/archive/page.tsx` - Archive view
- **Features:**
  - Project CRUD operations
  - Budget vs. actual tracking
  - Time entries tab
  - Materials tab
  - Documents tab
  - Invoices tab
  - AI-generated project summaries
  - Progress visualization

#### 4. **Invoices** (`/invoices`)
- **Files:**
  - `app/invoices/page.tsx` - List view
  - `app/invoices/[id]/page.tsx` - Detail view
  - `app/invoices/new/page.tsx` - Create form
  - `app/invoices/[id]/edit/page.tsx` - Edit form
- **Features:**
  - Invoice CRUD operations
  - Three creation methods:
    1. Manual entry
    2. From project (auto-populate)
    3. AI OCR processing
  - PDF generation
  - Email sending
  - Payment tracking
  - Status management

#### 5. **Employees** (`/employees`)
- **Files:**
  - `app/employees/page.tsx` - List view
  - `app/employees/[id]/page.tsx` - Detail view
  - `app/employees/new/page.tsx` - Create form
  - `app/employees/[id]/edit/page.tsx` - Edit form
- **Features:**
  - Employee management
  - Role assignment (admin/employee)
  - Payroll history
  - Time entries summary
  - Document management

#### 6. **Clients** (`/clients`)
- **Files:**
  - `app/clients/page.tsx` - List view
  - `app/clients/[id]/page.tsx` - Detail view
  - `app/clients/new/page.tsx` - Create form
  - `app/clients/[id]/edit/page.tsx` - Edit form
- **Features:**
  - Client CRM
  - Project associations
  - Invoice history
  - Quote management
  - Document storage

#### 7. **Quotes** (`/quotes`)
- **Files:**
  - `app/quotes/page.tsx` - List view
  - `app/quotes/[id]/page.tsx` - Detail view
  - `app/quotes/new/page.tsx` - Create form
  - `app/quotes/[id]/edit/page.tsx` - Edit form
- **Features:**
  - Quote creation and management
  - Line items with pricing
  - PDF generation
  - Email sending
  - Approval workflow
  - Convert to project
  - Public token-based access

#### 8. **Payroll** (`/payroll`)
- **Files:**
  - `app/payroll/page.tsx` - Main payroll page
  - `app/payroll/periods/page.tsx` - Period management
  - `app/payroll/periods/new/page.tsx` - Create period
  - `app/payroll/periods/[id]/page.tsx` - Period detail
  - `app/payroll/employeeID/[employeeId]/page.tsx` - Employee payslip
- **Features:**
  - Swedish payroll calculations
  - OB (overtime) calculations:
    - Evening (18:00-22:00): +50%
    - Night (22:00-06:00): +100%
    - Weekend: +50%
    - Holiday: +100%
  - Payslip generation
  - CSV export
  - Fortnox/Visma integration ready

#### 9. **ROT-Avdrag** (`/rot`)
- **Files:**
  - `app/rot/page.tsx` - List view
  - `app/rot/[id]/page.tsx` - Detail view
  - `app/rot/new/page.tsx` - Create form
  - `app/rot/[id]/appeal/page.tsx` - Appeal form
- **Features:**
  - ROT application management
  - Person number encryption (GDPR compliant)
  - Status tracking
  - XML generation for Skatteverket
  - Appeal process
  - Photo attachments

#### 10. **Work Orders** (`/work-orders`)
- **Files:**
  - `app/work-orders/page.tsx` - List view
  - `app/work-orders/[id]/page.tsx` - Detail view
- **Features:**
  - Task management
  - Priority levels
  - Status workflow (state machine)
  - Photo uploads
  - Assignment tracking
  - Comments and updates

#### 11. **Materials** (`/materials`)
- **Files:**
  - `app/materials/page.tsx` - List view
  - `app/materials/[id]/edit/page.tsx` - Edit form
  - `app/materials/new/page.tsx` - Create form
- **Features:**
  - Material database
  - Supplier linking
  - Project associations
  - Price tracking
  - Inventory management (planned)

#### 12. **Supplier Invoices** (`/supplier-invoices`)
- **Files:**
  - `app/supplier-invoices/page.tsx` - List view
  - `app/supplier-invoices/[id]/page.tsx` - Detail view
  - `app/supplier-invoices/new/page.tsx` - Create form
  - `app/supplier-invoices/[id]/edit/page.tsx` - Edit form
- **Features:**
  - Vendor invoice management
  - OCR processing
  - Project allocation
  - Approval workflow
  - File storage

#### 13. **Delivery Notes** (`/delivery-notes`)
- **File:** `app/delivery-notes/page.tsx`
- **Features:**
  - Följesedlar management
  - OCR processing
  - Material auto-registration
  - Project linking

#### 14. **Reports** (`/reports`)
- **Files:**
  - `app/reports/page.tsx` - Report list
  - `app/reports/new/page.tsx` - Create report
- **Features:**
  - Time reports
  - Project profitability
  - Employee productivity
  - Budget vs. actual
  - Invoice reports
  - Export (PDF, CSV, Excel)

#### 15. **Analytics** (`/analytics`)
- **File:** `app/analytics/page.tsx`
- **Features:**
  - Revenue trends
  - Project profitability charts
  - Employee utilization
  - Client value analysis
  - Budget performance
  - Custom dashboards

#### 16. **Calendar** (`/calendar`)
- **File:** `app/calendar/page.tsx`
- **Features:**
  - Month/week/day views
  - Project assignments
  - Employee schedules
  - Time entries visualization
  - Drag-and-drop scheduling (planned)

#### 17. **Workflows** (`/workflows`)
- **File:** `app/workflows/page.tsx`
- **Features:**
  - Visual workflow builder (planned)
  - Pre-built workflows:
    - Quote → Project conversion
    - Invoice approval
    - Time entry approval
    - Budget alerts

#### 18. **ÄTA** (`/aeta`)
- **File:** `app/aeta/page.tsx`
- **Features:**
  - Change order management
  - Status tracking
  - Client communication
  - Approval workflow

#### 19. **KMA** (`/kma`)
- **File:** `app/kma/page.tsx`
- **Features:**
  - Quality control checklists
  - Photo requirements
  - Signatures
  - Approval workflow

#### 20. **Integrations** (`/integrations`)
- **File:** `app/integrations/page.tsx`
- **Features:**
  - Integration dashboard
  - Connection status
  - Sync history
  - Configuration

#### 21. **Settings** (`/settings`)
- **Files:**
  - `app/settings/utseende/page.tsx` - Appearance settings
  - `app/settings/integrations/page.tsx` - Integration settings
  - `app/settings/subscription/page.tsx` - Subscription management
  - `app/settings/import/page.tsx` - Data import
- **Features:**
  - Theme selection (light/dark)
  - User preferences
  - Integration configuration
  - Subscription management
  - CSV import

#### 22. **Admin** (`/admin`)
- **Files:**
  - `app/admin/page.tsx` - Admin dashboard
  - `app/admin/live-map/page.tsx` - GPS tracking map
  - `app/admin/work-sites/page.tsx` - Work site management
  - `app/admin/aeta/page.tsx` - ÄTA management
- **Features:**
  - System health monitoring
  - User management
  - Tenant management
  - Live GPS tracking
  - Work site geofencing
  - Debug tools

#### 23. **Public Portal** (`/public/[token]`)
- **File:** `app/public/[token]/page.tsx`
- **Features:**
  - Token-based secure access
  - Quote viewing
  - Invoice viewing
  - Approval/rejection
  - Digital signing (planned)

#### 24. **Authentication**
- **Files:**
  - `app/login/page.tsx` - Login page
  - `app/signup/page.tsx` - Signup page
  - `app/auth/callback/page.tsx` - OAuth callback
  - `app/password-setup/page.tsx` - Password setup
- **Features:**
  - Email/password authentication
  - Google OAuth
  - Tenant selection
  - Session management

#### 25. **Onboarding** (`/onboarding`)
- **File:** `app/onboarding/page.tsx`
- **Features:**
  - Interactive tour
  - Feature highlights
  - Step-by-step guidance

#### 26. **FAQ** (`/faq`)
- **File:** `app/faq/page.tsx`
- **Features:**
  - Frequently asked questions
  - Help documentation

#### 27. **Feedback** (`/feedback`)
- **File:** `app/feedback/page.tsx`
- **Features:**
  - User feedback collection
  - Feature requests

---

## Backend API Routes

### API Structure (`app/api/`)

#### 1. **Time Tracking APIs**
- `GET /api/time-entries` - List time entries
- `POST /api/time-entries` - Create time entry
- `PUT /api/time-entries/[id]` - Update time entry
- `DELETE /api/time-entries/[id]` - Delete time entry
- `POST /api/time-entries/approve` - Approve time entries (bulk)
- `GET /api/time-entries/pending` - Get pending approvals

#### 2. **Project APIs**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/budget` - Set budget
- `GET /api/projects/[id]/budget` - Get budget
- `GET /api/projects/[id]/budget-usage` - Get budget usage
- `GET /api/projects/[id]/budget-alerts` - Get budget alerts
- `POST /api/create-project` - Create project (legacy)

#### 3. **Invoice APIs**
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/[id]/send` - Send invoice via email
- `GET /api/invoices/[id]/pdf` - Generate PDF

#### 4. **Employee APIs**
- `GET /api/employees/list` - List employees
- `POST /api/employees/create` - Create employee
- `GET /api/employees/[id]` - Get employee
- `PUT /api/employees/[id]/update` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

#### 5. **Client APIs**
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

#### 6. **Quote APIs**
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/[id]` - Get quote
- `PUT /api/quotes/[id]` - Update quote
- `DELETE /api/quotes/[id]` - Delete quote
- `POST /api/quotes/[id]/send` - Send quote
- `POST /api/quotes/[id]/approve` - Approve quote
- `POST /api/quotes/[id]/convert` - Convert to project

#### 7. **Payroll APIs**
- `GET /api/payroll` - Get payroll data
- `POST /api/payroll/periods` - Create payroll period
- `GET /api/payroll/periods` - List periods
- `GET /api/payroll/periods/[id]` - Get period
- `GET /api/payroll/employee/[id]` - Get employee payslip
- `POST /api/payroll/export` - Export payroll CSV

#### 8. **ROT APIs**
- `GET /api/rot` - List ROT applications
- `POST /api/rot` - Create ROT application
- `GET /api/rot/[id]` - Get ROT application
- `PUT /api/rot/[id]` - Update ROT application
- `POST /api/rot/[id]/submit` - Submit to Skatteverket
- `GET /api/rot/[id]/status` - Get status
- `POST /api/rot/poll-status` - Poll status (cron)

#### 9. **Work Order APIs**
- `GET /api/work-orders` - List work orders
- `POST /api/work-orders` - Create work order
- `GET /api/work-orders/[id]` - Get work order
- `PUT /api/work-orders/[id]` - Update work order
- `DELETE /api/work-orders/[id]` - Delete work order
- `PATCH /api/work-orders/[id]/status` - Update status
- `POST /api/work-orders/[id]/photos` - Upload photo
- `GET /api/work-orders/[id]/photos` - Get photos

#### 10. **Material APIs**
- `GET /api/materials` - List materials
- `POST /api/materials` - Create material
- `GET /api/materials/[id]` - Get material
- `PUT /api/materials/[id]` - Update material
- `DELETE /api/materials/[id]` - Delete material

#### 11. **Supplier Invoice APIs**
- `GET /api/supplier-invoices` - List supplier invoices
- `POST /api/supplier-invoices` - Create supplier invoice
- `GET /api/supplier-invoices/[id]` - Get supplier invoice
- `PUT /api/supplier-invoices/[id]` - Update supplier invoice
- `POST /api/supplier-invoices/[id]/ocr` - Process OCR

#### 12. **Schedule APIs**
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/[id]` - Update schedule
- `DELETE /api/schedules/[id]` - Delete schedule
- `GET /api/schedules/conflicts` - Check conflicts
- `POST /api/schedules/[id]/complete` - Complete schedule

#### 13. **Absence APIs**
- `GET /api/absences` - List absences
- `POST /api/absences` - Create absence
- `PUT /api/absences/[id]` - Update absence
- `DELETE /api/absences/[id]` - Delete absence

#### 14. **Analytics APIs**
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/projects` - Project analytics

#### 15. **Budget Alert APIs**
- `GET /api/budget-alerts` - List alerts
- `POST /api/budget-alerts/[id]/acknowledge` - Acknowledge alert
- `POST /api/budget-alerts/[id]/resolve` - Resolve alert

#### 16. **Public Link APIs**
- `POST /api/public-links/create` - Create public link
- `GET /api/public/[token]` - Access via token
- `POST /api/public/[token]/sign` - Sign via link
- `POST /api/public-links/[id]/revoke` - Revoke link

#### 17. **Audit Log APIs**
- `GET /api/audit-logs/search` - Search audit logs
- `GET /api/audit-logs/[table]/[recordId]` - Get logs for record

#### 18. **Integration APIs**
- `GET /api/integrations` - List integrations
- `POST /api/integrations/connect` - Connect integration
- `POST /api/integrations/disconnect` - Disconnect integration
- `GET /api/integrations/[id]/status` - Get sync status
- `POST /api/integrations/[id]/sync` - Trigger sync

#### 19. **Admin APIs**
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/tenants` - Tenant management

#### 20. **Stripe APIs**
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Stripe webhook handler

#### 21. **Cron Jobs**
- `GET /api/cron/budget-alerts` - Budget alert worker (every 15 min)
- `GET /api/cron/share-link-cleanup` - Cleanup expired links (daily)
- `GET /api/cron/payroll-reminders` - Payroll reminders (Monday 8 AM)
- `GET /api/cron/invoice-reminders` - Invoice reminders (daily 9 AM)
- `GET /api/cron/friday-panic` - Friday panic alerts (Friday 2 PM)
- `GET /api/cron/sync-integrations` - Sync integrations (every 5 min)

#### 22. **Tenant APIs**
- `GET /api/tenant` - Get tenant info
- `POST /api/create-tenant` - Create tenant
- `POST /api/tenant/update` - Update tenant

---

## Supabase Edge Functions

### 1. **parse-invoice** (`supabase/functions/parse-invoice/index.ts`)
- **Purpose:** AI-powered invoice OCR processing
- **Technology:** Google Gemini 2.0 Flash Vision API
- **Features:**
  - PDF/image upload processing
  - OCR field extraction (supplier, amount, date, OCR number)
  - Real-time status updates via Supabase Realtime
  - Base64 encoding for Gemini API
  - Error handling and retry logic
- **Input:** `{ invoice_id, file_path, tenant_id }`
- **Output:** Updates invoice record with extracted data

### 2. **watchdog** (`supabase/functions/watchdog/index.ts`)
- **Purpose:** Monitor and reset stuck sync jobs
- **Features:**
  - Detects jobs stuck in 'processing' status > 10 minutes
  - Deletes resource locks for stuck jobs
  - Resets jobs to 'pending' status
  - Error logging

---

## AI & Automation Features

### 1. **OCR Invoice Processing**
- **Module:** `app/lib/ocr/`
- **Technology:** Google Gemini 2.0 Flash Vision
- **Files:**
  - `app/lib/ocr/clients/docai.ts` - Google Document AI client
  - `app/lib/ocr/clients/textract.ts` - AWS Textract client
  - `app/lib/ocr/parsers/invoice.ts` - Invoice parser
  - `app/lib/ocr/parsers/deliveryNote.ts` - Delivery note parser
  - `app/lib/ocr/matching/fuzzyMatcher.ts` - Supplier matching
- **Features:**
  - PDF/image upload
  - Field extraction (supplier, amount, date, OCR)
  - Supplier recognition with fuzzy matching
  - Project matching suggestions
  - Confidence scoring

### 2. **AI Project Summaries**
- **Module:** `app/lib/ai/`
- **Technology:** Groq Llama 3.3 70B
- **Files:**
  - `app/lib/ai/prompts.ts` - Prompt templates
  - `app/lib/ai/common.ts` - Common AI utilities
  - `app/components/AISummary.tsx` - Summary component
- **Features:**
  - Automatic project summaries
  - Key insights extraction
  - Budget analysis
  - Risk identification

### 3. **AI Budget Predictions**
- **Module:** `app/components/ai/BudgetAIPrediction.tsx`
- **Hook:** `app/hooks/useAIBudgetPrediction.ts`
- **Features:**
  - Predictive budget alerts
  - Trend analysis
  - Risk prediction
  - Action recommendations

### 4. **AI Invoice Suggestions**
- **Module:** `app/components/ai/InvoiceAISuggestion.tsx`
- **Hook:** `app/hooks/useAIInvoiceSuggestion.ts`
- **Features:**
  - Automatic project matching
  - Supplier recognition
  - Amount validation
  - Duplicate detection

### 5. **AI Material Identification**
- **Module:** `app/components/ai/MaterialAIIdentifier.tsx`
- **Hook:** `app/hooks/useAIMaterialIdentification.ts`
- **Features:**
  - Photo → material identification
  - Supplier item matching
  - Price suggestions

### 6. **AI Project Planning**
- **Module:** `app/components/ai/ProjectAIPlanning.tsx`
- **Hook:** `app/hooks/useAIProjectPlan.ts`
- **Features:**
  - Project planning assistance
  - Resource allocation suggestions
  - Timeline estimation

### 7. **AI KMA Suggestions**
- **Module:** `app/components/ai/KMAIISuggestion.tsx`
- **Hook:** `app/hooks/useAIKMA.ts`
- **Features:**
  - Quality control checklist suggestions
  - Photo requirement recommendations

### 8. **AI Chatbot**
- **Module:** `app/components/ai/AIChatbot.tsx`
- **Files:**
  - `app/components/ai/AIChatbotClient.tsx`
  - `app/components/ai/AIChatbotWrapper.tsx`
  - `app/components/ai/AiChatWindow.tsx`
  - `app/components/ai/AiChatBubble.tsx`
  - `app/components/ai/AiTypingIndicator.tsx`
- **Hook:** `app/hooks/useStreamingChat.ts`
- **Features:**
  - Conversational AI assistant
  - Context-aware responses
  - Tool calling capabilities
  - Conversation history
  - Credit tracking

### 9. **AI Credit System**
- **Module:** `app/components/ai/AIBalanceWidget.tsx`
- **Table:** `ai_credits`
- **Features:**
  - Usage tracking
  - Credit limits
  - Reset cycles
  - Payment integration

### 10. **RAG-Enhanced Supplier Recognition**
- **Technology:** pgvector + LLM
- **Features:**
  - Vector embeddings for supplier names
  - Fuzzy matching with confidence scores
  - Historical learning
  - Automatic categorization

---

## Integration Modules

### 1. **Fortnox Integration**
- **Module:** `app/lib/integrations/fortnox/`
- **Files:**
  - `app/lib/integrations/fortnox/client.ts`
  - `app/lib/integrations/fortnox/customers.ts`
  - `app/lib/integrations/fortnox/invoices.ts`
  - `app/lib/integrations/fortnox/payroll.ts`
- **Components:**
  - `app/components/integrations/FortnoxConnectButton.tsx`
  - `app/components/integrations/SyncCustomerButton.tsx`
  - `app/components/integrations/SyncInvoiceButton.tsx`
  - `app/components/integrations/ExportPayrollButton.tsx`
- **Features:**
  - OAuth 2.0 authentication
  - Customer sync
  - Invoice export
  - Payroll sync
  - Rate limiting

### 2. **Visma Integration**
- **Module:** `app/lib/integrations/visma/`
- **Files:**
  - `app/lib/integrations/visma/client.ts`
  - `app/lib/integrations/visma/eAccounting.ts`
  - `app/lib/integrations/visma/payroll.ts`
- **Components:**
  - `app/components/integrations/VismaConnectButton.tsx`
- **Features:**
  - Visma eAccounting sync
  - Visma Payroll sync
  - OAuth authentication

### 3. **BankID Integration** (Stub)
- **Status:** Ready for implementation
- **Features:**
  - Digital signatures
  - Quote approval
  - Invoice signing
  - Legal compliance

### 4. **PEPPOL E-Invoicing** (Stub)
- **Status:** Ready for implementation
- **Features:**
  - Automatic e-invoice generation
  - PEPPOL network integration
  - EU compliance

### 5. **Integration Dashboard**
- **Component:** `app/components/integrations/SyncDashboard.tsx`
- **Features:**
  - Connection status
  - Sync history
  - Error logs
  - Configuration

---

## Security & Authentication

### 1. **Authentication System**
- **Provider:** Supabase Auth
- **Methods:**
  - Email/password
  - Google OAuth
- **Files:**
  - `app/auth/actions.ts` - Auth actions
  - `app/utils/supabase/server.ts` - Server-side client
  - `app/utils/supabase/middleware.ts` - Middleware
- **Features:**
  - JWT-based sessions
  - Secure token storage
  - Session refresh
  - Tenant selection

### 2. **Row Level Security (RLS)**
- **Implementation:** PostgreSQL RLS policies
- **Coverage:** All tables protected
- **Features:**
  - Tenant isolation
  - User-based access control
  - Role-based permissions
  - Automatic filtering

### 3. **Data Encryption**
- **Module:** `app/lib/encryption.ts`
- **Module:** `app/lib/security/gdpr-encryption.ts`
- **Features:**
  - AES-256-GCM encryption
  - Person number encryption (ROT)
  - API key encryption
  - Token encryption

### 4. **RBAC (Role-Based Access Control)**
- **Module:** `app/lib/rbac/`
- **Files:**
  - `app/lib/rbac/permissions.ts` - Permission definitions
  - `app/lib/rbac/middleware.ts` - RBAC middleware
- **Component:** `app/components/rbac/PermissionGuard.tsx`
- **Hook:** `app/hooks/usePermissions.ts`
- **Roles:**
  - Admin: Full access
  - Employee: Limited access

### 5. **CSRF Protection**
- **Module:** `app/lib/security/csrf.ts`
- **Features:**
  - Token generation
  - Request validation
  - Double-submit cookie pattern

### 6. **Webhook Security**
- **Module:** `app/lib/security/webhook-security.ts`
- **Features:**
  - Signature verification
  - Timestamp validation
  - Replay attack prevention

### 7. **Prompt Security**
- **Module:** `app/lib/security/prompt-security.ts`
- **Features:**
  - Injection prevention
  - Content filtering
  - Rate limiting

### 8. **Audit Logging**
- **Table:** `audit_logs`
- **Features:**
  - Complete operation tracking
  - User action logging
  - Data change history
  - IP address tracking
  - User agent logging

---

## Component Library

### UI Components (`app/components/ui/`)
- `button.tsx` - Button component
- `card.tsx` - Card component
- `dialog.tsx` - Modal dialog
- `input.tsx` - Input field
- `select.tsx` - Select dropdown
- `table.tsx` - Data table
- `toast.tsx` - Toast notifications
- `badge.tsx` - Badge component
- `tabs.tsx` - Tab navigation
- `calendar.tsx` - Date picker calendar
- `dropdown-menu.tsx` - Dropdown menu
- `form.tsx` - Form components
- `label.tsx` - Form label
- `textarea.tsx` - Textarea input

### Feature Components

#### Time Tracking
- `TimeClock.tsx` - Time clock widget
- `OBTypeSelector.tsx` - OB type selector
- `TimeRangePicker.tsx` - Time range picker

#### Projects
- `ProjectCard.tsx` - Project card display
- `ProjectList.tsx` - Project list view
- `ProjectDetailCard.tsx` - Project detail card
- `ProjectProgressBar.tsx` - Progress visualization
- `BudgetCard.tsx` - Budget tracking card

#### Invoices
- `InvoiceDownload.tsx` - PDF download
- `InvoiceOCRUpload.tsx` - OCR upload component
- `InvoiceRealtimeUploader.tsx` - Real-time upload
- `InvoiceUploadArea.tsx` - Upload area

#### Quotes
- `QuoteCard.tsx` - Quote card
- `QuoteForm.tsx` - Quote form
- `QuotePreview.tsx` - Quote preview
- `MaterialPicker.tsx` - Material selection
- `AIGenerateQuote.tsx` - AI quote generation

#### Payroll
- `PeriodForm.tsx` - Payroll period form
- `PeriodList.tsx` - Period list
- `PeriodFilters.tsx` - Filter controls
- `ExportButton.tsx` - CSV export
- `ValidationIssues.tsx` - Validation display

#### ROT
- `RotCalculator.tsx` - ROT calculator
- `RotEligibilityBadge.tsx` - Eligibility indicator
- `ROTAISummary.tsx` - AI summary
- `AIRotSummaryButton.tsx` - AI summary button

#### Scheduling
- `ScheduleCalendar.tsx` - Calendar view
- `ScheduleCard.tsx` - Schedule card
- `ScheduleModal.tsx` - Schedule modal
- `ScheduleSlot.tsx` - Schedule slot
- `AbsenceCalendar.tsx` - Absence calendar
- `AbsenceModal.tsx` - Absence modal

#### Work Orders
- `WorkOrderCard.tsx` - Work order card
- `WorkOrderList.tsx` - Work order list
- `WorkOrderDetail.tsx` - Detail view
- `WorkOrderModal.tsx` - Create/edit modal
- `WorkOrderStatusBadge.tsx` - Status badge
- `WorkOrderPriorityIndicator.tsx` - Priority indicator
- `WorkOrderPhotoUpload.tsx` - Photo upload

#### AI Components
- `AIChatbot.tsx` - Main chatbot
- `AIChatbotClient.tsx` - Client-side chatbot
- `AIChatbotWrapper.tsx` - Wrapper component
- `AiChatWindow.tsx` - Chat window
- `AiChatBubble.tsx` - Chat bubble
- `AiTypingIndicator.tsx` - Typing indicator
- `AiCostBadge.tsx` - Cost badge
- `AIBalanceWidget.tsx` - Credit balance
- `AILoadingSpinner.tsx` - Loading spinner
- `AICard.tsx` - AI card
- `CachedBadge.tsx` - Cache indicator

#### Integrations
- `IntegrationCard.tsx` - Integration card
- `IntegrationStatusCard.tsx` - Status card
- `SyncDashboard.tsx` - Sync dashboard
- `SyncHistory.tsx` - Sync history
- `SyncLogsTable.tsx` - Logs table
- `SyncAnalytics.tsx` - Sync analytics
- `OAuthCallbackHandler.tsx` - OAuth handler

#### Analytics
- `DashboardAnalytics.tsx` - Dashboard analytics
- `ProjectAnalytics.tsx` - Project analytics

#### Common
- `Sidebar.tsx` - Navigation sidebar
- `SidebarClient.tsx` - Client-side sidebar
- `MobileBottomNav.tsx` - Mobile navigation
- `SearchBar.tsx` - Global search
- `NotificationCenter.tsx` - Notifications
- `QuickActions.tsx` - Quick actions menu
- `StatsOverview.tsx` - Statistics overview
- `ErrorBoundary.tsx` - Error boundary
- `PageLayout.tsx` - Page layout wrapper
- `BackButton.tsx` - Back button
- `FileUpload.tsx` - File upload
- `FileList.tsx` - File list
- `DatePicker.tsx` - Date picker
- `FilterSortBar.tsx` - Filter/sort bar
- `EmployeeSelector.tsx` - Employee selector
- `ProjectCard.tsx` - Project card
- `CustomerCard.tsx` - Customer card
- `EmployeeCard.tsx` - Employee card
- `StatCard.tsx` - Statistics card

---

## Custom Hooks

### Data Fetching Hooks
- `useProjects.ts` - Project data fetching
- `useClients.ts` - Client data fetching
- `useEmployees.ts` - Employee data fetching
- `useInvoices.ts` - Invoice data fetching
- `useQuotes.ts` - Quote data fetching
- `useMaterials.ts` - Material data fetching
- `useSupplierInvoices.ts` - Supplier invoice data fetching
- `useWorkOrders.ts` - Work order data fetching
- `useSchedules.ts` - Schedule data fetching
- `useAbsences.ts` - Absence data fetching
- `useRotApplications.ts` - ROT application data fetching
- `usePayrollPeriods.ts` - Payroll period data fetching
- `useSuppliers.ts` - Supplier data fetching
- `useFactoringOffers.ts` - Factoring offer data fetching

### AI Hooks
- `useAIBudgetPrediction.ts` - Budget prediction
- `useAIInvoiceSuggestion.ts` - Invoice suggestions
- `useAIMaterialIdentification.ts` - Material identification
- `useAIProjectPlan.ts` - Project planning
- `useAIKMA.ts` - KMA suggestions
- `useStreamingChat.ts` - Streaming chat

### Utility Hooks
- `useDebounce.ts` - Debounce values
- `useThrottle.ts` - Throttle values
- `useOnlineStatus.ts` - Online/offline status
- `useSearch.ts` - Search functionality
- `useSyncStatus.ts` - Sync status tracking
- `useSubscription.ts` - Subscription management
- `useUserRole.ts` - User role checking
- `usePermissions.ts` - Permission checking
- `useAdmin.ts` - Admin status checking
- `useDashboardAnalytics.ts` - Dashboard analytics
- `useProjectAnalytics.ts` - Project analytics
- `useIntegrations.ts` - Integration management
- `useQuoteActions.ts` - Quote actions
- `useQuoteItems.ts` - Quote items
- `useQuoteTemplates.ts` - Quote templates
- `useScheduleReminders.ts` - Schedule reminders
- `useWorkflowSubscription.ts` - Workflow subscriptions

---

## Utility Libraries

### AI Utilities (`app/lib/ai/`)
- `ai-utils.ts` - Common AI utilities
- `anti-loop.ts` - Prevent AI loops
- `cache.ts` - AI response caching
- `claude.ts` - Claude API client
- `openai-client.ts` - OpenAI client
- `huggingface.ts` - Hugging Face client
- `intent.ts` - Intent detection
- `memory.ts` - Conversation memory
- `prompt.ts` - Prompt building
- `prompts.ts` - Prompt templates
- `tools.ts` - AI tool definitions
- `ratelimit.ts` - Rate limiting
- `security-guard.ts` - Security checks
- `telemetry.ts` - Telemetry tracking
- `templates.ts` - Response templates
- `payment-wrapper.ts` - Payment integration
- `frost-bygg-ai-integration.ts` - Frost Bygg AI integration

### Database Utilities (`app/lib/db/`)
- `database.ts` - Database client
- `indexeddb.ts` - IndexedDB wrapper
- `sync-queue.ts` - Sync queue management
- `types.ts` - Database types

### OCR Utilities (`app/lib/ocr/`)
- `clients/docai.ts` - Google Document AI
- `clients/textract.ts` - AWS Textract
- `parsers/invoice.ts` - Invoice parser
- `parsers/deliveryNote.ts` - Delivery note parser
- `matching/fuzzyMatcher.ts` - Fuzzy matching
- `schemas.ts` - OCR schemas
- `errors.ts` - Error handling
- `logger.ts` - Logging
- `supplierInvoices.ts` - Supplier invoice OCR

### Payroll Utilities (`app/lib/payroll/`)
- `periods.ts` - Payroll period calculations
- `validation.ts` - Payroll validation
- `storage.ts` - Payroll storage
- `employeeColumns.ts` - Employee column definitions
- `timeEntryColumns.ts` - Time entry columns
- `exporters/fortnox.ts` - Fortnox export
- `exporters/visma.ts` - Visma export
- `exporters/helpers.ts` - Export helpers
- `formats/paxml.ts` - PAXML format
- `formats/visma.ts` - Visma format

### ROT Utilities (`app/lib/rot/`)
- `calc.ts` - ROT calculations
- `rot-utils.ts` - ROT utilities
- `rules.ts` - ROT rules
- `xml.ts` - XML generation

### Domain Utilities (`app/lib/domain/`)
- `ai/errors.ts` - AI errors
- `ai/types.ts` - AI types
- `factoring/errors.ts` - Factoring errors
- `factoring/types.ts` - Factoring types
- `rot/calculator.ts` - ROT calculator
- `rot/errors.ts` - ROT errors
- `rot/types.ts` - ROT types
- `rot/validation.ts` - ROT validation
- `rot/xml-generator.ts` - XML generator

### Integration Utilities (`app/lib/integrations/`)
- `fortnox/client.ts` - Fortnox client
- `fortnox/customers.ts` - Customer sync
- `fortnox/invoices.ts` - Invoice sync
- `fortnox/payroll.ts` - Payroll sync
- `visma/client.ts` - Visma client
- `visma/eAccounting.ts` - eAccounting sync
- `visma/payroll.ts` - Payroll sync
- `helpers.ts` - Integration helpers
- `types.ts` - Integration types

### Security Utilities (`app/lib/security/`)
- `csrf.ts` - CSRF protection
- `gdpr-encryption.ts` - GDPR encryption
- `prompt-security.ts` - Prompt security
- `webhook-security.ts` - Webhook security

### Other Utilities
- `obCalculation.ts` - OB (overtime) calculations
- `timeRounding.ts` - Time rounding
- `formatters.ts` - Data formatters
- `gpsUtils.ts` - GPS utilities
- `logger.ts` - Logging
- `encryption.ts` - Encryption
- `rateLimit.ts` - Rate limiting
- `idempotency.ts` - Idempotency
- `errorUtils.ts` - Error utilities
- `queryClient.ts` - React Query client
- `queryInvalidation.ts` - Query invalidation
- `featureFlags.ts` - Feature flags
- `duplicateCheck.ts` - Duplicate detection

---

## Background Jobs & Cron

### Scheduled Jobs (Vercel Cron)

#### 1. **Budget Alerts** (`/api/cron/budget-alerts`)
- **Schedule:** Every 15 minutes (`*/15 * * * *`)
- **Purpose:** Check projects for budget threshold violations
- **Actions:**
  - Calculate current budget usage
  - Create alerts for thresholds exceeded
  - Send notifications

#### 2. **Share Link Cleanup** (`/api/cron/share-link-cleanup`)
- **Schedule:** Daily at 2 AM (`0 2 * * *`)
- **Purpose:** Remove expired public links
- **Actions:**
  - Find expired links
  - Archive or delete
  - Log cleanup

#### 3. **Payroll Reminders** (`/api/cron/payroll-reminders`)
- **Schedule:** Monday at 8 AM (`0 8 * * 1`)
- **Purpose:** Send payroll processing reminders
- **Actions:**
  - Check pending payroll periods
  - Send email reminders
  - Create notifications

#### 4. **Invoice Reminders** (`/api/cron/invoice-reminders`)
- **Schedule:** Daily at 9 AM (`0 9 * * *`)
- **Purpose:** Send overdue invoice reminders
- **Actions:**
  - Find overdue invoices
  - Send email reminders
  - Update status

#### 5. **Friday Panic** (`/api/cron/friday-panic`)
- **Schedule:** Friday at 2 PM (`0 14 * * 5`)
- **Purpose:** Weekly summary and alerts
- **Actions:**
  - Generate weekly summary
  - Send alerts for critical items
  - Create notifications

#### 6. **Sync Integrations** (`/api/cron/sync-integrations`)
- **Schedule:** Every 5 minutes (`*/5 * * * *`)
- **Purpose:** Sync with third-party integrations
- **Actions:**
  - Check sync jobs
  - Process pending syncs
  - Update status

#### 7. **ROT Status Poll** (`/api/rot/poll-status`)
- **Schedule:** Every 6 hours (`0 */6 * * *`)
- **Purpose:** Poll Skatteverket for ROT status updates
- **Actions:**
  - Check pending ROT applications
  - Poll API for status
  - Update records

### Background Workers

#### 1. **Budget Alert Worker**
- **File:** `app/lib/workers/budgetAlertWorker.ts`
- **Purpose:** Process budget alerts asynchronously
- **Features:**
  - Queue-based processing
  - Retry logic
  - Error handling

#### 2. **Share Link Cleanup Worker**
- **File:** `app/lib/workers/shareLinkCleanup.ts`
- **Purpose:** Cleanup expired share links
- **Features:**
  - Batch processing
  - Soft delete
  - Audit logging

---

## File Structure

### Complete Directory Tree

```
frost-solutions/
├── app/
│   ├── admin/                    # Admin pages
│   │   ├── aeta/
│   │   ├── live-map/
│   │   └── work-sites/
│   ├── analytics/                 # Analytics page
│   ├── api/                       # API routes (162 endpoints)
│   │   ├── absences/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── audit-logs/
│   │   ├── clients/
│   │   ├── cron/
│   │   ├── employees/
│   │   ├── materials/
│   │   ├── rbac/
│   │   ├── rot/
│   │   ├── schedules/
│   │   ├── stripe/
│   │   ├── tenant/
│   │   └── work-orders/
│   ├── auth/                      # Authentication
│   ├── calendar/                  # Calendar page
│   ├── clients/                   # Client pages
│   ├── components/               # React components (149 files)
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── cards/
│   │   ├── dashboard/
│   │   ├── factoring/
│   │   ├── forms/
│   │   ├── import/
│   │   ├── integrations/
│   │   ├── invoices/
│   │   ├── ocr/
│   │   ├── onboarding/
│   │   ├── payroll/
│   │   ├── performance/
│   │   ├── projects/
│   │   ├── quotes/
│   │   ├── rbac/
│   │   ├── rot/
│   │   ├── scheduling/
│   │   ├── search/
│   │   ├── supplier-invoices/
│   │   ├── suppliers/
│   │   ├── time/
│   │   ├── ui/
│   │   └── workflows/
│   ├── context/                   # React contexts
│   ├── dashboard/                 # Dashboard page
│   ├── delivery-notes/           # Delivery notes page
│   ├── employees/                # Employee pages
│   ├── hooks/                    # Custom hooks (36 files)
│   ├── invoices/                 # Invoice pages
│   ├── lib/                      # Utility libraries (34 files)
│   │   ├── ai/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── crypto/
│   │   ├── db/
│   │   ├── domain/
│   │   ├── encryption.ts
│   │   ├── factoring/
│   │   ├── http/
│   │   ├── i18n/
│   │   ├── integrations/
│   │   ├── markup/
│   │   ├── middleware/
│   │   ├── ocr/
│   │   ├── offline/
│   │   ├── payroll/
│   │   ├── pdf/
│   │   ├── performance/
│   │   ├── pricing/
│   │   ├── projects/
│   │   ├── quotes/
│   │   ├── rbac/
│   │   ├── repositories/
│   │   ├── rot/
│   │   ├── scheduling/
│   │   ├── security/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── store/
│   │   ├── sync/
│   │   ├── utils/
│   │   └── workers/
│   ├── materials/                # Material pages
│   ├── payroll/                 # Payroll pages
│   ├── projects/                # Project pages
│   ├── providers/               # React providers
│   ├── public/                  # Public portal
│   ├── quotes/                  # Quote pages
│   ├── reports/                 # Report pages
│   ├── rot/                     # ROT pages
│   ├── settings/                # Settings pages
│   ├── supplier-invoices/       # Supplier invoice pages
│   ├── suppliers/               # Supplier pages
│   ├── time-tracking/           # Time tracking page
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Utilities
│   ├── work-orders/             # Work order pages
│   └── workflows/               # Workflow pages
├── supabase/
│   ├── functions/               # Edge Functions
│   │   ├── parse-invoice/
│   │   └── watchdog/
│   ├── migrations/              # Database migrations
│   └── rpc/                     # PostgreSQL functions
├── sql/                         # SQL scripts (77 files)
│   ├── migrations/
│   └── archive/
├── tests/                       # Test files
├── __tests__/                   # Jest tests
├── docs/                        # Documentation (240 files)
├── public/                      # Static assets
├── scripts/                     # Build scripts
├── middleware.ts                # Next.js middleware
├── next.config.mjs              # Next.js config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── vercel.json                  # Vercel config
└── TECHNICAL_REPORT.md          # This document
```

---

## Summary Statistics

### Code Metrics
- **Total Files:** 700+
- **Lines of Code:** 50,000+
- **React Components:** 149
- **API Routes:** 162
- **Custom Hooks:** 36
- **Utility Libraries:** 34
- **Database Tables:** 30+
- **SQL Scripts:** 77
- **Documentation Files:** 240

### Feature Completeness
- **Fully Implemented:** 80%
- **Partially Implemented:** 15%
- **Planned:** 5%

### Technology Coverage
- **Frontend:** Next.js 16, React 19, TypeScript
- **Backend:** Supabase, PostgreSQL, Deno
- **AI:** Gemini 2.0 Flash, Groq Llama 3.3 70B, OpenAI GPT-4
- **Integrations:** Fortnox, Visma, Stripe, Resend
- **Testing:** Jest, Playwright
- **Monitoring:** Sentry
- **Deployment:** Vercel, Supabase

---

## Conclusion

Frost Solutions is a comprehensive, enterprise-grade SaaS platform with extensive functionality across project management, time tracking, invoicing, payroll, and AI-powered automation. The application demonstrates modern software architecture with a focus on scalability, security, and user experience.

The platform's strength lies in its:
1. **Comprehensive Feature Set:** 27+ major modules covering all aspects of construction business management
2. **Modern Architecture:** Next.js 16, React 19, TypeScript, Supabase
3. **AI Integration:** OCR, summaries, predictions, chatbot
4. **Security:** RLS, encryption, audit logging, RBAC
5. **Scalability:** Multi-tenant, offline-first, real-time updates
6. **Nordic Focus:** ROT, Swedish payroll, BankID ready

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Maintained By:** Frost Solutions Development Team
