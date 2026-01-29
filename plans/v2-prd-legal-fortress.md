# Frost Solutions V2.0 - Product Requirements Document
## "Legal Fortress" - Vendor Protection First Platform

**Document Version:** 2.0  
**Last Updated:** 2026-01-29  
**Status:** Draft for Review  
**Author:** Product Architecture Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Feature Modules - The 4 Pillars](#2-core-feature-modules---the-4-pillars)
3. [The ÄTA Protection Flow](#3-the-äta-protection-flow)
4. [Anti-Scam Modules](#4-anti-scam-modules)
5. [Technical Architecture](#5-technical-architecture)
6. [Implementation Strategy](#6-implementation-strategy)
7. [Roadmap](#7-roadmap)

---

## 1. Executive Summary

### 1.1 Vision Statement

**"The All-in-One Legal Fortress for Swedish Construction Companies"**

Frost Solutions V2 transforms from a project management tool into a comprehensive **legal protection platform** that shields construction companies from non-paying customers, contract disputes, and fraudulent actors. Every feature is designed with one core principle: **Vendor Protection First**.

The Swedish construction industry loses an estimated 2-3 billion SEK annually to payment disputes, scope creep without documentation, and fraudulent customers. Frost Solutions V2 addresses this by creating an unbreakable digital paper trail that protects the builder at every stage of a project.

### 1.2 Why "Vendor Protection First" Matters

Swedish construction companies face unique challenges:

| Challenge | Impact | V2 Solution |
|-----------|--------|-------------|
| **Undocumented ÄTA work** | 40% of extra work goes unpaid | Mandatory digital sign-off flow |
| **Verbal agreements** | No legal standing in disputes | E-signing with audit trail |
| **Bad-faith customers** | Delayed payments, disputes | Pre-project credit checks |
| **Scope creep** | Budget overruns, unpaid labor | Real-time change tracking |
| **AB04/ABT06 non-compliance** | Lost arbitration cases | Auto-generated compliant docs |

### 1.3 Target Market

**Primary:** Swedish construction companies with 5-50 employees  
**Secondary:** Solo contractors and larger enterprises  
**Tertiary:** Subcontractors working under main contractors

**User Personas:**

1. **The Owner/CEO** - Needs financial protection and business overview
2. **The Project Manager** - Needs efficient workflows and documentation
3. **The Site Supervisor** - Needs mobile-first field tools
4. **The Worker** - Needs simple time tracking and ÄTA reporting
5. **The Accountant** - Needs invoicing integration and audit trails

### 1.4 Value Proposition

> *"Never lose money on undocumented work again. Frost Solutions V2 creates a legally binding digital trail for every hour worked, every material used, and every change requested - automatically."*

**Key Differentiators:**

- **Pre-emptive Protection:** Credit checks before project start
- **Real-time Documentation:** ÄTA captured at the moment of occurrence
- **Legal Compliance:** AB04/ABT06 compliant templates and workflows
- **Integrated Ecosystem:** Replaces 8+ separate tools with one platform
- **AI-Powered:** Intelligent risk detection and auto-summarization

### 1.5 Competitive Landscape Analysis

| Competitor | Strength | Weakness | V2 Advantage |
|------------|----------|----------|--------------|
| **Bluebeam** | Drawing markup | No project management | Full integration |
| **SSG/ID06** | Access control | Standalone system | Built-in module |
| **Hantverksdata** | KMA templates | Outdated UX | Modern, mobile-first |
| **Konsumentvarning** | Credit checks | Manual process | Automated pre-project |
| **VOPA/Sajn** | E-signing | No construction focus | Industry-specific |
| **Bygglet** | Scheduling | Weak legal protection | ÄTA fortress |
| **Fieldwire** | Visual management | US-focused | Swedish compliance |

---

## 2. Core Feature Modules - The 4 Pillars

### 2.1 Pillar 1: Project Management

**Goal:** Replace Excel, whiteboards, and fragmented tools with a unified project command center.

#### 2.1.1 Project Lifecycle Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│  QUOTE → CONTRACT → ACTIVE → COMPLETION → ARCHIVE               │
│    │         │         │          │           │                 │
│    ▼         ▼         ▼          ▼           ▼                 │
│ Credit    E-Sign    ÄTA Flow   Final      Legal                 │
│ Check     Lock-in   Active     Invoice    Archive               │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**

| Feature | Description | Legal Protection Value |
|---------|-------------|----------------------|
| **Project Dashboard** | Real-time overview of all active projects | Budget tracking prevents overruns |
| **Gantt Scheduling** | Visual timeline with resource allocation | Documented timeline for disputes |
| **Budget vs Actual** | Live comparison of quoted vs spent | Early warning for scope creep |
| **Milestone Tracking** | Payment-linked milestones | Triggers for partial invoicing |
| **Document Binder** | Centralized project documentation | Complete audit trail |

#### 2.1.2 Resource Allocation

**Staff Scheduling:**
- Calendar view of employee assignments
- Conflict detection for double-booking
- Skill-based assignment suggestions
- Absence management integration

**Equipment Tracking:**
- Tool inventory with check-in/check-out
- GPS tracking for high-value equipment
- Maintenance scheduling
- Utilization reports

#### 2.1.3 Job Costing

**Real-time Cost Tracking:**

```typescript
interface ProjectCost {
  labor: {
    budgeted_hours: number;
    actual_hours: number;
    hourly_rate: number;
    ob_costs: number;
  };
  materials: {
    budgeted: number;
    actual: number;
    markup_percent: number;
  };
  subcontractors: {
    budgeted: number;
    actual: number;
  };
  ata_additions: {
    approved_amount: number;
    pending_amount: number;
  };
}
```

**Budget Alerts:**
- 75% budget consumed → Yellow warning
- 90% budget consumed → Red alert + manager notification
- 100% exceeded → Automatic ÄTA prompt

---

### 2.2 Pillar 2: Legal/Protection Module

**Goal:** Create an impenetrable legal shield around every project.

#### 2.2.1 Pre-Project Credit Check

**Integration with Konsumentvarning/UC:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 CREDIT CHECK WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│  1. New Client Created                                          │
│     ↓                                                           │
│  2. Auto-trigger Credit Check API                               │
│     ↓                                                           │
│  3. Risk Score Calculated                                       │
│     ├── GREEN: Score > 70 → Proceed normally                    │
│     ├── YELLOW: Score 40-70 → Require 50% upfront               │
│     └── RED: Score < 40 → Block or require full prepayment      │
│     ↓                                                           │
│  4. Risk Badge Displayed on Client Profile                      │
│     ↓                                                           │
│  5. Automatic Contract Terms Adjustment                         │
└─────────────────────────────────────────────────────────────────┘
```

**Data Points Collected:**
- Payment history from public records
- Betalningsanmärkningar count
- Company age and stability
- Previous disputes in construction sector
- Blacklist database cross-reference

#### 2.2.2 Contract Templates - AB04/ABT06 Compliant

**Template Library:**

| Template | Use Case | Key Clauses |
|----------|----------|-------------|
| **AB04 Utförandeentreprenad** | Standard construction | Full AB04 compliance |
| **ABT06 Totalentreprenad** | Design-build projects | ABT06 compliance |
| **Konsumentavtal** | Private homeowners | Konsumenttjänstlagen |
| **ÄTA-tillägg** | Change orders | Pricing, timeline impact |
| **Garantiåtagande** | Warranty terms | 2/5 year guarantees |

**Auto-fill Capabilities:**
- Project name, address, dates
- Client information from CRM
- Pricing from quote
- Standard terms with customization
- Digital signature fields

#### 2.2.3 E-Signing Integration

**Supported Methods:**
1. **BankID** - Highest legal standing
2. **Freja eID** - Alternative Swedish eID
3. **Simple E-sign** - Email verification with audit trail

**Signing Workflow:**

```
Document Created → Review Period → Signature Request → 
Signed by Contractor → Signed by Client → Locked & Archived
```

**Audit Trail Captured:**
- IP address of signer
- Timestamp with timezone
- Device fingerprint
- Document hash before/after
- Screenshot of signed document

#### 2.2.4 ÄTA Workflow Engine

*See Section 3 for detailed ÄTA Protection Flow*

---

### 2.3 Pillar 3: Field Tools

**Goal:** Empower workers with mobile-first tools that automatically create legal documentation.

#### 2.3.1 Drawing Markup - Bluebeam Lite

**Core Features:**

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **PDF Viewer** | High-performance rendering | PDF.js with WebGL acceleration |
| **Basic Markups** | Cloud, arrow, text, highlight | Canvas-based annotation layer |
| **Measurement** | Scale calibration, area/length | Coordinate system with units |
| **Issue Pins** | Link work orders to locations | Clickable markers with metadata |
| **Version Compare** | Overlay two drawing versions | Opacity slider, diff highlighting |

**Mobile Optimization:**
- Pinch-to-zoom with smooth rendering
- Offline caching of recent drawings
- Quick photo annotation
- Voice-to-text for notes

#### 2.3.2 KMA Documentation - Hantverksdata Killer

**Quality Management:**
- Egenkontroller with photo evidence
- Deviation reporting with corrective actions
- Material certifications tracking
- Inspection checklists

**Health & Safety:**
- Riskanalys templates per work type
- Incident reporting with severity classification
- Near-miss logging
- Safety meeting documentation

**Environment:**
- Waste classification and tracking
- Chemical handling logs
- Environmental impact assessments
- Sustainability reporting

**Auto-generated Documents:**

```typescript
interface KMADocument {
  type: 'risk_analysis' | 'self_inspection' | 'incident_report';
  project_id: string;
  created_by: string;
  created_at: Date;
  template_version: string;
  fields: Record<string, any>;
  photos: string[];
  signatures: Signature[];
  status: 'draft' | 'submitted' | 'approved';
}
```

#### 2.3.3 Site Access Control - SSG/ID06 Integration

**Personnel Tracking:**
- Digital check-in/check-out
- ID06 card validation
- Certificate verification
- Visitor management

**Compliance Features:**
- Personalliggare integration
- Automatic Skatteverket reporting
- Subcontractor tracking
- Working hours validation

**Geofencing:**
- Automatic check-in when entering site
- GPS breadcrumb trail
- Time entry validation against location
- Alert for off-site time entries

---

### 2.4 Pillar 4: Admin/Finance

**Goal:** Streamline back-office operations with intelligent automation.

#### 2.4.1 Invoicing Engine

**Invoice Types:**

| Type | Trigger | Automation Level |
|------|---------|------------------|
| **Milestone Invoice** | Milestone completion | Semi-automatic |
| **Progress Invoice** | Monthly/bi-weekly | Automatic draft |
| **Final Invoice** | Project completion | Automatic with review |
| **ÄTA Invoice** | ÄTA approval | Automatic generation |
| **ROT Invoice** | ROT-eligible work | Auto-split labor/material |

**Integration Points:**
- Fortnox sync
- Visma integration
- PEPPOL e-invoicing
- Bankgiro/Plusgiro payments

#### 2.4.2 Waste Management - Logistikbolaget Integration

**Features:**
- Waste classification per project
- Container ordering integration
- Weight tracking and reporting
- Environmental compliance reports
- Cost allocation to projects

**Workflow:**

```
Waste Generated → Classification → Container Request → 
Pickup Scheduled → Weight Recorded → Invoice Matched → 
Project Cost Updated → Environmental Report Generated
```

#### 2.4.3 Reporting & Analytics

**Standard Reports:**
- Project profitability analysis
- Employee productivity metrics
- Client payment behavior
- ÄTA frequency by project type
- Budget variance trends

**AI-Enhanced Reports:**
- Predictive budget alerts
- Risk scoring trends
- Anomaly detection in time entries
- Seasonal workload forecasting

#### 2.4.4 Cost Estimation - CAB MEPS Integration

**Features:**
- Material price database
- Labor cost calculator
- Historical project comparison
- Quote generation from estimates
- Insurance claim documentation

**Price Sources:**
- Supplier price lists
- Historical purchase data
- Market price indices
- Regional adjustments

---

## 3. The ÄTA Protection Flow

### 3.1 Overview - The Legal Shield

**ÄTA** (Ändrings- och Tilläggsarbeten) represents the single largest source of payment disputes in Swedish construction. The V2 ÄTA Protection Flow creates an **unbreakable legal chain** that ensures every piece of extra work is documented, approved, and billable.

**Core Principle:** *No extra work can be performed without a digital paper trail that would hold up in arbitration.*

### 3.2 The Mandatory Push Notice System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ÄTA PROTECTION FLOW - OVERVIEW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   WORKER IDENTIFIES    →    CREATES ÄTA    →    PUSH NOTICE    →       │
│   EXTRA WORK                REQUEST              TO CUSTOMER            │
│                                                                         │
│                              ↓                       ↓                  │
│                                                                         │
│                         ADMIN REVIEW         CUSTOMER RESPONSE          │
│                              ↓                       ↓                  │
│                                                                         │
│                         PRICING SET    ←    APPROVAL/REJECTION          │
│                              ↓                                          │
│                                                                         │
│                    WORK AUTHORIZED    →    EXECUTION    →    INVOICE    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Step-by-Step Logic Flow

#### Step 1: ÄTA Detection & Creation

**Trigger Points:**
- Worker discovers unforeseen condition
- Customer requests additional work
- Design change from architect
- Regulatory requirement change

**Required Fields:**

```typescript
interface ATARequest {
  // Identification
  id: string;
  project_id: string;
  created_by: string;
  created_at: Date;
  
  // Classification
  change_type: 'ADDITION' | 'MODIFICATION' | 'UNFORESEEN';
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  
  // Description
  title: string;
  description: string;
  reason: string;
  
  // Evidence - MANDATORY for UNFORESEEN
  photos: string[];  // Min 1 photo required for UNFORESEEN
  location_on_drawing?: string;
  
  // Estimation
  estimated_hours_category: '2h' | '4-8h' | '>1dag';
  estimated_material_cost?: number;
  
  // Customer Info
  ordered_by_name: string;  // Who requested this?
  ordered_by_role: 'owner' | 'representative' | 'site_contact';
  verbal_approval_claimed: boolean;
  
  // Status Tracking
  status: 'draft' | 'pending_admin' | 'pending_customer' | 'approved' | 'rejected' | 'completed';
  customer_approval_status: 'DRAFT' | 'SENT_FOR_APPROVAL' | 'APPROVED_VERBAL' | 'APPROVED_DIGITAL' | 'REJECTED';
}
```

**Validation Rules:**

| Change Type | Photo Required | Immediate Notification | Admin Review |
|-------------|----------------|----------------------|--------------|
| ADDITION | Optional | Yes | Required |
| MODIFICATION | Optional | Yes | Required |
| UNFORESEEN | **Mandatory** | **Immediate** | Required |

#### Step 2: Admin Review & Pricing

**Admin Dashboard View:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ÄTA #2024-0147 - Oförutsett: Vattenläcka i vägg              │
├─────────────────────────────────────────────────────────────────┤
│  Project: Villa Andersson, Täby                                 │
│  Created: 2024-03-15 09:23 by Erik Svensson                    │
│  Type: UNFORESEEN ⚠️                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📷 3 Photos Attached                                     │   │
│  │ [Photo 1] [Photo 2] [Photo 3]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description:                                                   │
│  "Vid rivning av gips upptäcktes fuktskada och mögel bakom    │
│   badrumsvägg. Kräver sanering och ny isolering."              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PRICING                                                  │   │
│  │ ☑ Follows main contract rates                           │   │
│  │ ☐ Custom pricing                                        │   │
│  │                                                          │   │
│  │ Estimated Hours: [4-8h ▼]                               │   │
│  │ Hourly Rate: 650 SEK (from contract)                    │   │
│  │ Material Estimate: [5000] SEK                           │   │
│  │ Material Markup: 15%                                    │   │
│  │                                                          │   │
│  │ TOTAL ESTIMATE: 9,950 SEK                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Timeline Impact:                                               │
│  ☑ This work impacts project timeline                          │
│  New completion date: [2024-04-20]                             │
│                                                                 │
│  [Save Draft] [Send to Customer for Approval]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pricing Options:**

1. **Contract Rates** - Use rates from signed contract
2. **Custom Rates** - Override for special circumstances
3. **Fixed Price** - Lump sum for defined scope

#### Step 3: Customer Notification - The Push Notice

**Notification Channels:**

| Channel | Priority | Legal Standing |
|---------|----------|----------------|
| **In-App Push** | Immediate | Medium |
| **SMS** | Immediate | High |
| **Email** | Within 5 min | High |
| **Registered Mail** | For disputes | Highest |

**Push Notice Content:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔔 ÄTA-FÖRFRÅGAN KRÄVER DITT GODKÄNNANDE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Projekt: Villa Andersson, Täby                                │
│  Entreprenör: Byggfirma AB                                     │
│                                                                 │
│  Typ: Oförutsett arbete                                        │
│  Beskrivning: Vattenläcka upptäckt i badrumsvägg              │
│                                                                 │
│  Uppskattat pris: 9,950 SEK                                    │
│  Påverkar slutdatum: Ja, +5 dagar                              │
│                                                                 │
│  ⚠️ VIKTIGT: Enligt AB04 kap 2 §4 måste tilläggsarbeten       │
│  godkännas skriftligt för att vara bindande.                   │
│                                                                 │
│  [Se detaljer och godkänn →]                                   │
│                                                                 │
│  Länk giltig i 7 dagar.                                        │
│  Vid utebliven respons kontaktas du per telefon.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 4: Customer Approval Flow

**Approval Page - Public Token Access:**

```
URL: https://app.frostsolutions.se/approve/[unique-token]

┌─────────────────────────────────────────────────────────────────┐
│  FROST SOLUTIONS - ÄTA Godkännande                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Projekt: Villa Andersson                                      │
│  ÄTA #2024-0147                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ARBETSBESKRIVNING                                        │   │
│  │                                                          │   │
│  │ Typ: Oförutsett arbete                                  │   │
│  │                                                          │   │
│  │ Vid rivning av gips upptäcktes fuktskada och mögel      │   │
│  │ bakom badrumsvägg. Arbetet omfattar:                    │   │
│  │ - Sanering av mögel                                     │   │
│  │ - Byte av isolering                                     │   │
│  │ - Ny gipsskiva och spackling                           │   │
│  │                                                          │   │
│  │ 📷 Se bifogade foton                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ KOSTNADSSPECIFIKATION                                    │   │
│  │                                                          │   │
│  │ Arbete: 6 timmar × 650 SEK      3,900 SEK               │   │
│  │ Material:                        5,000 SEK               │   │
│  │ Materialpåslag 15%:                750 SEK               │   │
│  │ ─────────────────────────────────────────                │   │
│  │ TOTALT exkl. moms:              9,650 SEK               │   │
│  │ Moms 25%:                       2,412 SEK               │   │
│  │ ─────────────────────────────────────────                │   │
│  │ TOTALT inkl. moms:             12,062 SEK               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIDSPÅVERKAN                                             │   │
│  │                                                          │   │
│  │ ⚠️ Detta arbete påverkar projektets slutdatum.          │   │
│  │ Nytt beräknat slutdatum: 2024-04-20                     │   │
│  │ (Tidigare: 2024-04-15)                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Jag har läst och förstår ovanstående                       │
│  ☑ Jag godkänner kostnaden och tidspåverkan                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SIGNERING                                                │   │
│  │                                                          │   │
│  │ Namn: [Anders Andersson          ]                      │   │
│  │ E-post: [anders@email.se         ]                      │   │
│  │                                                          │   │
│  │ [🔐 Signera med BankID]  eller  [✍️ Digital signatur]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Avböj och kontakta entreprenör]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Approval Methods:**

| Method | Legal Standing | Use Case |
|--------|---------------|----------|
| **BankID** | Highest - equivalent to handwritten | High-value ÄTA, disputes likely |
| **Digital Signature** | High - with audit trail | Standard ÄTA |
| **Email Confirmation** | Medium - requires verification | Low-value, trusted clients |
| **Verbal + Documentation** | Low - risky | Emergency only, follow up required |

#### Step 5: Audit Trail Generation

**Every ÄTA creates an immutable audit record:**

```typescript
interface ATAAuditEntry {
  id: string;
  ata_id: string;
  timestamp: Date;
  action: ATAAction;
  actor: {
    type: 'employee' | 'admin' | 'customer' | 'system';
    id: string;
    name: string;
    ip_address?: string;
  };
  data_before?: Record<string, any>;
  data_after?: Record<string, any>;
  metadata: {
    user_agent?: string;
    geolocation?: { lat: number; lng: number };
    device_fingerprint?: string;
  };
}

type ATAAction = 
  | 'created'
  | 'photo_added'
  | 'submitted_for_review'
  | 'admin_reviewed'
  | 'pricing_set'
  | 'sent_to_customer'
  | 'customer_viewed'
  | 'customer_approved'
  | 'customer_rejected'
  | 'work_started'
  | 'work_completed'
  | 'invoice_generated'
  | 'invoice_paid';
```

#### Step 6: Work Authorization & Execution

**Authorization States:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION MATRIX                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer Status    │ Admin Status    │ Work Authorized?        │
│  ───────────────────┼─────────────────┼─────────────────────    │
│  APPROVED_DIGITAL   │ approved        │ ✅ YES - Full green     │
│  APPROVED_VERBAL    │ approved        │ ⚠️ YES - With warning   │
│  SENT_FOR_APPROVAL  │ approved        │ ❌ NO - Awaiting        │
│  REJECTED           │ any             │ ❌ NO - Blocked         │
│  DRAFT              │ any             │ ❌ NO - Not submitted   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Verbal Approval Warning System:**

When work proceeds with only verbal approval:

1. **Yellow banner** displayed on project dashboard
2. **Daily reminder** to obtain digital signature
3. **Invoice blocked** until digital approval obtained
4. **Risk flag** added to project for reporting

### 3.4 AB04/ABT06 Compliance

**Key Legal Requirements Met:**

| AB04 Reference | Requirement | V2 Implementation |
|----------------|-------------|-------------------|
| Kap 2 §4 | Written notification of changes | Push notice system |
| Kap 2 §5 | Price agreement before work | Approval flow |
| Kap 2 §6 | Documentation of changes | Photo + audit trail |
| Kap 6 §1 | Invoicing of approved work | Auto-invoice generation |

**Legal Text Auto-Inclusion:**

Every ÄTA document includes:

```
"Detta tilläggsarbete utförs i enlighet med AB04/ABT06 kap 2 §4-6.
Beställaren bekräftar genom sin signatur att arbetet är beställt
och att angivet pris accepteras. Arbetet faktureras separat eller
som del av slutfaktura enligt överenskommelse."
```

### 3.5 Emergency ÄTA Protocol

**For Critical/Urgent Work:**

When work cannot wait for approval (e.g., water damage, safety hazard):

```
┌─────────────────────────────────────────────────────────────────┐
│                 EMERGENCY ÄTA PROTOCOL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DOCUMENT IMMEDIATELY                                        │
│     - Take photos/video of emergency condition                  │
│     - Record verbal authorization (if given)                    │
│     - Note time, date, who was present                         │
│                                                                 │
│  2. CREATE ÄTA WITH "CRITICAL" FLAG                            │
│     - System sends immediate SMS + Email + Push                 │
│     - 1-hour response window before escalation                  │
│                                                                 │
│  3. PROCEED WITH WORK                                          │
│     - Document all work performed                               │
│     - Track actual hours and materials                          │
│                                                                 │
│  4. POST-WORK APPROVAL                                         │
│     - Customer must approve within 48 hours                     │
│     - If no response: Registered mail sent                      │
│     - If disputed: Full audit trail available                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Anti-Scam Modules

### 4.1 Overview - Proactive Protection

The Anti-Scam modules provide **pre-emptive protection** against bad-faith customers, ensuring construction companies can identify risks before committing resources.

### 4.2 Credit Check Integration

#### 4.2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 CREDIT CHECK FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  New Client    →    Org.nr/Personnr    →    API Call           │
│  Created            Extracted               to Provider         │
│                                                                 │
│                          ↓                                      │
│                                                                 │
│              ┌─────────────────────────┐                       │
│              │   CREDIT PROVIDERS      │                       │
│              ├─────────────────────────┤                       │
│              │ • UC (Upplysningscentralen)                     │
│              │ • Bisnode/Dun & Bradstreet                      │
│              │ • Creditsafe                                    │
│              │ • Konsumentvarning.se                           │
│              └─────────────────────────┘                       │
│                          ↓                                      │
│                                                                 │
│              Risk Score Calculated                              │
│                          ↓                                      │
│                                                                 │
│  ┌──────────┬──────────────┬──────────────┐                    │
│  │  GREEN   │    YELLOW    │     RED      │                    │
│  │  70-100  │    40-69     │    0-39      │                    │
│  ├──────────┼──────────────┼──────────────┤                    │
│  │ Proceed  │ 50% Upfront  │ Full Prepay  │                    │
│  │ Normally │ Required     │ or Decline   │                    │
│  └──────────┴──────────────┴──────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Data Points Collected

**For Companies - Organisationsnummer:**

| Data Point | Source | Weight |
|------------|--------|--------|
| Payment remarks | UC/Bisnode | High |
| Company age | Bolagsverket | Medium |
| Revenue trend | Annual reports | Medium |
| Industry risk | Statistical | Low |
| Previous disputes | Konsumentvarning | High |
| Board members | Bolagsverket | Low |

**For Individuals - Personnummer:**

| Data Point | Source | Weight |
|------------|--------|--------|
| Payment remarks | UC | High |
| Income level | Estimated | Medium |
| Property ownership | Lantmäteriet | Medium |
| Previous disputes | Konsumentvarning | High |

#### 4.2.3 Risk Score Algorithm

```typescript
interface CreditCheckResult {
  client_id: string;
  checked_at: Date;
  provider: 'uc' | 'bisnode' | 'creditsafe';
  
  // Raw data
  payment_remarks_count: number;
  payment_remarks_amount: number;
  company_age_years?: number;
  estimated_revenue?: number;
  
  // Calculated scores
  base_score: number;  // 0-100 from provider
  
  // Adjustments
  adjustments: {
    reason: string;
    points: number;
  }[];
  
  // Final
  final_score: number;
  risk_level: 'GREEN' | 'YELLOW' | 'RED';
  
  // Recommendations
  recommended_terms: {
    upfront_percentage: number;
    max_credit_amount: number;
    payment_terms_days: number;
  };
}

function calculateRiskScore(data: CreditCheckResult): number {
  let score = data.base_score;
  
  // Adjustments
  if (data.payment_remarks_count > 0) {
    score -= data.payment_remarks_count * 10;
  }
  
  if (data.company_age_years && data.company_age_years < 2) {
    score -= 15;  // New company penalty
  }
  
  // Check blacklist
  if (isOnBlacklist(data.client_id)) {
    score = 0;  // Automatic red
  }
  
  return Math.max(0, Math.min(100, score));
}
```

### 4.3 Blacklist Database Integration

#### 4.3.1 Data Sources

**External Blacklists:**
- Konsumentvarning.se - Construction-specific
- Branschvarning.se - Cross-industry
- Internal company blacklist
- Industry association warnings

**Blacklist Entry Structure:**

```typescript
interface BlacklistEntry {
  id: string;
  identifier: string;  // Org.nr or Personnummer
  identifier_type: 'org_nr' | 'personnummer';
  name: string;
  
  // Reason
  reason_category: 'non_payment' | 'fraud' | 'dispute' | 'other';
  reason_description: string;
  
  // Evidence
  evidence_urls?: string[];
  reported_by?: string;
  
  // Metadata
  added_at: Date;
  expires_at?: Date;
  severity: 'warning' | 'block';
  
  // Verification
  verified: boolean;
  verified_by?: string;
  verified_at?: Date;
}
```

#### 4.3.2 Blacklist Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 BLACKLIST CHECK FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client Identifier    →    Hash for Privacy    →    API Query  │
│                                                                 │
│                              ↓                                  │
│                                                                 │
│              ┌─────────────────────────┐                       │
│              │   CHECK RESULTS         │                       │
│              ├─────────────────────────┤                       │
│              │ ✅ No matches found     │ → Proceed             │
│              │ ⚠️ Warning match        │ → Show alert          │
│              │ 🚫 Block match          │ → Require override    │
│              └─────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Risk Scoring System

#### 4.4.1 Composite Risk Score

The system calculates a **Composite Risk Score** combining multiple factors:

```typescript
interface CompositeRiskScore {
  client_id: string;
  calculated_at: Date;
  
  // Component scores (0-100)
  credit_score: number;
  blacklist_score: number;  // 100 if clean, 0 if blocked
  payment_history_score: number;  // Based on past projects
  project_complexity_score: number;
  
  // Weights
  weights: {
    credit: 0.35;
    blacklist: 0.25;
    payment_history: 0.25;
    complexity: 0.15;
  };
  
  // Final
  composite_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Actions
  required_actions: RiskAction[];
}

type RiskAction = 
  | { type: 'upfront_payment'; percentage: number }
  | { type: 'milestone_payments'; count: number }
  | { type: 'bank_guarantee'; amount: number }
  | { type: 'manager_approval'; reason: string }
  | { type: 'decline_project'; reason: string };
```

#### 4.4.2 Risk Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT RISK PROFILE - Andersson Fastigheter AB                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPOSITE RISK SCORE: 62/100 - MEDIUM RISK ⚠️                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Component Breakdown                                      │   │
│  │                                                          │   │
│  │ Credit Score:        ████████░░ 78/100                  │   │
│  │ Blacklist Status:    ██████████ 100/100 ✅              │   │
│  │ Payment History:     ████░░░░░░ 42/100 ⚠️               │   │
│  │ Project Complexity:  ██████░░░░ 58/100                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PAYMENT HISTORY WITH US:                                       │
│  • 3 completed projects                                         │
│  • Average payment delay: 18 days                               │
│  • 1 disputed invoice (resolved)                                │
│                                                                 │
│  RECOMMENDED TERMS:                                             │
│  ⚠️ Require 30% upfront payment                                │
│  ⚠️ Milestone payments every 2 weeks                           │
│  ⚠️ Manager approval required for projects > 500k SEK          │
│                                                                 │
│  [Override Risk Assessment]  [View Full Report]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Automated Risk Alerts

**Alert Triggers:**

| Trigger | Alert Level | Action |
|---------|-------------|--------|
| New payment remark on active client | High | Notify PM + Admin |
| Client added to blacklist | Critical | Pause all quotes |
| Invoice 30+ days overdue | Medium | Escalation workflow |
| Multiple ÄTA rejections | Medium | Review relationship |
| Credit score drops > 20 points | High | Re-evaluate terms |

**Alert Workflow:**

```typescript
interface RiskAlert {
  id: string;
  client_id: string;
  project_id?: string;
  
  trigger: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  created_at: Date;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  
  recommended_actions: string[];
  actions_taken?: string[];
  
  auto_actions_executed: {
    action: string;
    executed_at: Date;
    result: string;
  }[];
}
```

### 4.6 Fraud Detection AI

**AI-Powered Anomaly Detection:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 AI FRAUD DETECTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PATTERNS MONITORED:                                            │
│                                                                 │
│  1. Quote Shopping                                              │
│     - Multiple quotes requested, none accepted                  │
│     - Pattern: Information gathering for DIY                    │
│                                                                 │
│  2. Scope Creep Abuse                                          │
│     - Excessive ÄTA requests after low initial quote           │
│     - Pattern: Intentional underscoping                        │
│                                                                 │
│  3. Payment Delay Patterns                                      │
│     - Consistent late payments across projects                  │
│     - Pattern: Cash flow manipulation                          │
│                                                                 │
│  4. Dispute Patterns                                           │
│     - Frequent quality complaints near payment due             │
│     - Pattern: Payment avoidance tactics                       │
│                                                                 │
│  5. Identity Anomalies                                         │
│     - Mismatched contact information                           │
│     - Pattern: Potential fraud                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**AI Model Inputs:**

```typescript
interface FraudDetectionInput {
  client_id: string;
  
  // Behavioral signals
  quotes_requested_30d: number;
  quotes_accepted_30d: number;
  avg_response_time_hours: number;
  
  // Financial signals
  avg_payment_delay_days: number;
  disputes_raised: number;
  disputes_won_by_client: number;
  
  // Communication signals
  email_domain_age_days?: number;
  phone_carrier_type?: 'mobile' | 'voip' | 'landline';
  address_verification_status?: 'verified' | 'unverified' | 'mismatch';
  
  // Historical
  projects_completed: number;
  total_revenue: number;
  ata_rejection_rate: number;
}
```

---

## 5. Technical Architecture

### 5.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FROST SOLUTIONS V2 ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        CLIENT LAYER                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │   Web    │  │  Mobile  │  │  Public  │  │  Admin   │        │   │
│  │  │   App    │  │   PWA    │  │  Portal  │  │  Panel   │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API LAYER                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              Next.js API Routes + Edge Functions          │   │   │
│  │  │  • REST endpoints    • Webhooks    • Real-time SSE       │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICE LAYER                               │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │   │
│  │  │  ATA   │ │ Credit │ │  Doc   │ │  AI    │ │ Notify │        │   │
│  │  │Service │ │Service │ │Service │ │Service │ │Service │        │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       DATA LAYER                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Supabase   │  │     S3       │  │    Redis     │          │   │
│  │  │  PostgreSQL  │  │   Storage    │  │    Cache     │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   EXTERNAL INTEGRATIONS                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │   │
│  │  │   UC   │ │BankID  │ │Fortnox │ │ Visma  │ │ Twilio │        │   │
│  │  │  API   │ │  API   │ │  API   │ │  API   │ │  SMS   │        │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema - Core Entities

#### 5.2.1 Enhanced Client Table

```sql
-- Enhanced clients table with risk scoring
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Basic Info
    name TEXT NOT NULL,
    org_nr TEXT,
    personnummer_encrypted TEXT,  -- GDPR: Encrypted storage
    
    -- Contact
    email TEXT,
    phone TEXT,
    address JSONB,  -- {street, city, postal_code, country}
    
    -- Risk Assessment
    credit_score INTEGER,
    credit_checked_at TIMESTAMPTZ,
    credit_provider TEXT,
    risk_level TEXT CHECK (risk_level IN ('GREEN', 'YELLOW', 'RED', 'BLOCKED')),
    blacklist_status TEXT DEFAULT 'CLEAR',
    blacklist_checked_at TIMESTAMPTZ,
    
    -- Payment Terms
    default_payment_terms_days INTEGER DEFAULT 30,
    required_upfront_percentage INTEGER DEFAULT 0,
    credit_limit_sek NUMERIC(12,2),
    
    -- Internal Scoring
    internal_risk_score INTEGER,
    payment_history_score INTEGER,
    total_revenue_sek NUMERIC(14,2) DEFAULT 0,
    avg_payment_delay_days INTEGER,
    
    -- Metadata
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_text TSVECTOR
);

-- Indexes for performance
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_risk ON clients(risk_level);
CREATE INDEX idx_clients_search ON clients USING GIN(search_text);
```

#### 5.2.2 Enhanced ÄTA Table

```sql
-- Enhanced ÄTA requests with full legal trail
CREATE TABLE ata_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    
    -- Classification
    ata_number TEXT,  -- Auto-generated: ATA-2024-0001
    change_type TEXT NOT NULL CHECK (change_type IN ('ADDITION', 'MODIFICATION', 'UNFORESEEN')),
    urgency TEXT DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
    
    -- Description
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reason TEXT,
    location_reference TEXT,  -- Reference to drawing location
    
    -- Evidence
    photos JSONB DEFAULT '[]',  -- Array of S3 URLs
    documents JSONB DEFAULT '[]',
    
    -- Ordering Info
    ordered_by_name TEXT,
    ordered_by_role TEXT,
    ordered_by_contact TEXT,
    verbal_approval_claimed BOOLEAN DEFAULT FALSE,
    
    -- Estimation
    estimated_hours_category TEXT,
    estimated_hours NUMERIC(6,2),
    estimated_material_cost NUMERIC(10,2),
    
    -- Pricing (set by admin)
    follows_main_contract BOOLEAN DEFAULT TRUE,
    custom_hourly_rate NUMERIC(8,2),
    custom_material_markup NUMERIC(5,2),
    fixed_price NUMERIC(12,2),
    final_quoted_amount NUMERIC(12,2),
    
    -- Timeline Impact
    impacts_timeline BOOLEAN DEFAULT FALSE,
    original_completion_date DATE,
    new_completion_date DATE,
    delay_days INTEGER,
    
    -- Internal Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_admin', 'pending_customer', 
        'approved', 'rejected', 'in_progress', 'completed', 'invoiced'
    )),
    
    -- Customer Approval
    customer_approval_status TEXT DEFAULT 'DRAFT' CHECK (customer_approval_status IN (
        'DRAFT', 'SENT_FOR_APPROVAL', 'APPROVED_VERBAL', 
        'APPROVED_DIGITAL', 'REJECTED', 'EXPIRED'
    )),
    customer_approval_token TEXT UNIQUE,
    customer_approval_method TEXT,  -- 'bankid', 'digital_signature', 'email'
    customer_approval_timestamp TIMESTAMPTZ,
    customer_approval_ip TEXT,
    customer_approval_signature JSONB,  -- Signature data
    
    -- Notification Tracking
    notification_sent_at TIMESTAMPTZ,
    notification_channels JSONB,  -- ['email', 'sms', 'push']
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    
    -- Workflow
    created_by UUID REFERENCES employees(id),
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    internal_notes TEXT,
    
    -- Invoice Link
    invoice_id UUID REFERENCES invoices(id),
    invoiced_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ata_tenant ON ata_requests(tenant_id);
CREATE INDEX idx_ata_project ON ata_requests(project_id);
CREATE INDEX idx_ata_status ON ata_requests(status);
CREATE INDEX idx_ata_customer_status ON ata_requests(customer_approval_status);
CREATE INDEX idx_ata_token ON ata_requests(customer_approval_token);
```

#### 5.2.3 Audit Trail Table

```sql
-- Immutable audit trail for legal compliance
CREATE TABLE audit_trail (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- What
    entity_type TEXT NOT NULL,  -- 'ata', 'contract', 'invoice', etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    
    -- Who
    actor_type TEXT NOT NULL,  -- 'employee', 'customer', 'system'
    actor_id TEXT,
    actor_name TEXT,
    
    -- Data
    data_before JSONB,
    data_after JSONB,
    changes JSONB,  -- Diff of changes
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    geolocation JSONB,
    device_fingerprint TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Immutability
    hash TEXT NOT NULL  -- SHA256 of previous row + current data
);

-- Append-only: No updates or deletes allowed
CREATE RULE audit_no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;

-- Index for queries
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_tenant ON audit_trail(tenant_id);
CREATE INDEX idx_audit_time ON audit_trail(created_at);
```

#### 5.2.4 Credit Check Results Table

```sql
-- Credit check history and results
CREATE TABLE credit_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    
    -- Request
    identifier TEXT NOT NULL,  -- Org.nr or personnummer
    identifier_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    
    -- Response
    raw_response JSONB,
    
    -- Parsed Results
    base_score INTEGER,
    payment_remarks_count INTEGER,
    payment_remarks_amount NUMERIC(12,2),
    company_age_years INTEGER,
    
    -- Calculated
    adjustments JSONB,
    final_score INTEGER,
    risk_level TEXT,
    
    -- Recommendations
    recommended_upfront_pct INTEGER,
    recommended_credit_limit NUMERIC(12,2),
    recommended_payment_days INTEGER,
    
    -- Blacklist
    blacklist_matches JSONB,
    
    -- Metadata
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    checked_by UUID
);

CREATE INDEX idx_credit_client ON credit_checks(client_id);
CREATE INDEX idx_credit_tenant ON credit_checks(tenant_id);
```

#### 5.2.5 Contract Templates Table

```sql
-- Legal contract templates
CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- NULL for system templates
    
    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL,  -- 'AB04', 'ABT06', 'CONSUMER', 'ATA', 'WARRANTY'
    version TEXT NOT NULL,
    
    -- Content
    content_html TEXT NOT NULL,
    content_pdf_template TEXT,
    
    -- Variables
    variables JSONB,  -- [{name, type, required, default}]
    
    -- Legal
    legal_review_date DATE,
    legal_reviewer TEXT,
    ab_compliance TEXT[],  -- ['AB04_2_4', 'AB04_2_5']
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 API Integration Strategy

#### 5.3.1 Credit Check API Integration

```typescript
// Credit check service interface
interface ICreditCheckService {
  checkCompany(orgNr: string): Promise<CreditCheckResult>;
  checkIndividual(personnummer: string): Promise<CreditCheckResult>;
  checkBlacklist(identifier: string): Promise<BlacklistResult>;
  getHistoricalChecks(clientId: string): Promise<CreditCheckResult[]>;
}

// UC Integration
class UCCreditService implements ICreditCheckService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.uc.se/v2';
  
  async checkCompany(orgNr: string): Promise<CreditCheckResult> {
    const response = await fetch(`${this.baseUrl}/company/${orgNr}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return this.mapToResult(data);
  }
  
  private mapToResult(ucResponse: UCResponse): CreditCheckResult {
    return {
      base_score: ucResponse.creditScore,
      payment_remarks_count: ucResponse.paymentRemarks?.length || 0,
      payment_remarks_amount: ucResponse.paymentRemarks?.reduce(
        (sum, r) => sum + r.amount, 0
      ) || 0,
      // ... mapping logic
    };
  }
}
```

#### 5.3.2 E-Signing Integration

```typescript
// BankID integration for e-signing
interface IBankIDService {
  initiateSign(documentHash: string, userPersonnummer: string): Promise<SignSession>;
  checkStatus(orderRef: string): Promise<SignStatus>;
  cancelSign(orderRef: string): Promise<void>;
}

class BankIDService implements IBankIDService {
  private readonly baseUrl = process.env.BANKID_API_URL;
  private readonly cert: Buffer;
  
  async initiateSign(
    documentHash: string, 
    userPersonnummer: string
  ): Promise<SignSession> {
    const response = await fetch(`${this.baseUrl}/sign`, {
      method: 'POST',
      body: JSON.stringify({
        personalNumber: userPersonnummer,
        userVisibleData: Buffer.from(documentHash).toString('base64'),
        userVisibleDataFormat: 'simpleMarkdownV1'
      }),
      // ... TLS client cert
    });
    
    return response.json();
  }
}
```

#### 5.3.3 Notification Service

```typescript
// Multi-channel notification service
interface INotificationService {
  sendPushNotice(ataId: string, channels: NotificationChannel[]): Promise<void>;
  sendReminder(ataId: string): Promise<void>;
  sendEscalation(ataId: string): Promise<void>;
}

type NotificationChannel = 'email' | 'sms' | 'push' | 'registered_mail';

class NotificationService implements INotificationService {
  constructor(
    private readonly emailService: IEmailService,
    private readonly smsService: ISMSService,
    private readonly pushService: IPushService
  ) {}
  
  async sendPushNotice(
    ataId: string, 
    channels: NotificationChannel[]
  ): Promise<void> {
    const ata = await this.ataRepository.findById(ataId);
    const client = await this.clientRepository.findById(ata.project.client_id);
    
    const promises = channels.map(channel => {
      switch (channel) {
        case 'email':
          return this.emailService.send({
            to: client.email,
            template: 'ata-approval-request',
            data: { ata, approvalUrl: this.generateApprovalUrl(ata) }
          });
        case 'sms':
          return this.smsService.send({
            to: client.phone,
            message: this.generateSMSMessage(ata)
          });
        case 'push':
          return this.pushService.send({
            userId: client.portal_user_id,
            title: 'ÄTA kräver godkännande',
            body: ata.title
          });
      }
    });
    
    await Promise.all(promises);
    
    // Log notification
    await this.auditService.log({
      entity_type: 'ata',
      entity_id: ataId,
      action: 'notification_sent',
      data_after: { channels, sent_at: new Date() }
    });
  }
}
```

### 5.4 AI Integration Points

#### 5.4.1 Risk Detection AI

```typescript
// AI-powered risk detection
interface IRiskDetectionAI {
  analyzeClient(clientId: string): Promise<RiskAnalysis>;
  detectAnomalies(projectId: string): Promise<Anomaly[]>;
  predictPaymentBehavior(clientId: string): Promise<PaymentPrediction>;
}

class RiskDetectionAI implements IRiskDetectionAI {
  private readonly model = 'gemini-2.0-flash';
  
  async analyzeClient(clientId: string): Promise<RiskAnalysis> {
    const clientData = await this.gatherClientData(clientId);
    
    const prompt = `
      Analyze the following client data for risk indicators:
      ${JSON.stringify(clientData)}
      
      Consider:
      1. Payment history patterns
      2. ÄTA rejection frequency
      3. Dispute history
      4. Communication patterns
      
      Return a JSON object with:
      - risk_score: 0-100
      - risk_factors: array of identified risks
      - recommendations: array of suggested actions
    `;
    
    const response = await this.aiService.generate(prompt);
    return JSON.parse(response);
  }
  
  async detectAnomalies(projectId: string): Promise<Anomaly[]> {
    const projectData = await this.gatherProjectData(projectId);
    
    // Use AI to detect unusual patterns
    const anomalies = await this.aiService.detectAnomalies({
      time_entries: projectData.timeEntries,
      materials: projectData.materials,
      ata_requests: projectData.ataRequests,
      historical_baseline: projectData.similarProjects
    });
    
    return anomalies;
  }
}
```

#### 5.4.2 Document Auto-Summarization

```typescript
// AI document summarization
interface IDocumentAI {
  summarizeATA(ataId: string): Promise<ATASummary>;
  generateContractClause(context: ClauseContext): Promise<string>;
  extractKeyTerms(documentUrl: string): Promise<KeyTerms>;
}

class DocumentAI implements IDocumentAI {
  async summarizeATA(ataId: string): Promise<ATASummary> {
    const ata = await this.ataRepository.findById(ataId);
    
    const prompt = `
      Summarize this ÄTA request for a construction project:
      
      Title: ${ata.title}
      Type: ${ata.change_type}
      Description: ${ata.description}
      Estimated Cost: ${ata.final_quoted_amount} SEK
      Timeline Impact: ${ata.delay_days} days
      
      Generate:
      1. A one-sentence summary for the customer
      2. Key points in bullet format
      3. Recommended questions the customer should ask
      
      Use professional Swedish language.
    `;
    
    return this.aiService.generate(prompt);
  }
}
```

---

## 6. Implementation Strategy

### 6.1 "Steal & Ship" Philosophy

The V2 development follows a **"Steal & Ship"** methodology:

1. **Identify** - Find the best features from competitors
2. **Analyze** - Understand the core value proposition
3. **Adapt** - Modify for Swedish construction context
4. **Integrate** - Build into unified platform
5. **Ship** - Release quickly, iterate based on feedback

### 6.2 Technical Reconnaissance Approach

#### 6.2.1 Competitor Analysis Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                 COMPETITOR ANALYSIS MATRIX                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  For each competitor feature:                                   │
│                                                                 │
│  1. CAPTURE                                                     │
│     - Screenshot key workflows                                  │
│     - Document UX patterns                                      │
│     - Note API endpoints (if public)                           │
│     - Identify data models                                      │
│                                                                 │
│  2. EVALUATE                                                    │
│     - User value: High/Medium/Low                              │
│     - Implementation complexity: 1-5                           │
│     - Integration potential: Standalone/Integrated             │
│     - Legal requirements: Yes/No                               │
│                                                                 │
│  3. PRIORITIZE                                                  │
│     - Must-have for MVP                                        │
│     - Nice-to-have for V2.1                                    │
│     - Future consideration                                      │
│                                                                 │
│  4. IMPLEMENT                                                   │
│     - Assign to sprint                                         │
│     - Define acceptance criteria                               │
│     - Build and test                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Feature Replication Priority

| Feature | Source | Priority | Complexity | Sprint |
|---------|--------|----------|------------|--------|
| Credit Check Integration | Konsumentvarning | P0 | 3 | 1 |
| ÄTA Push Notice | VOPA | P0 | 4 | 1 |
| E-Signing | Sajn | P0 | 4 | 1 |
| Drawing Markup | Bluebeam | P1 | 5 | 2 |
| KMA Templates | Hantverksdata | P1 | 3 | 2 |
| Site Access Control | SSG | P2 | 4 | 3 |
| Waste Management | Logistikbolaget | P2 | 3 | 3 |
| Cost Estimation | CAB MEPS | P2 | 4 | 4 |

### 6.3 Rapid Replication Methodology

#### 6.3.1 Sprint Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    2-WEEK SPRINT STRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WEEK 1: BUILD                                                  │
│  ─────────────────────────────────────────────                  │
│  Day 1-2: Feature analysis & design                            │
│  Day 3-4: Core implementation                                   │
│  Day 5: Integration & basic testing                            │
│                                                                 │
│  WEEK 2: POLISH & SHIP                                         │
│  ─────────────────────────────────────────────                  │
│  Day 6-7: UI/UX refinement                                     │
│  Day 8: User testing with beta group                           │
│  Day 9: Bug fixes & documentation                              │
│  Day 10: Release & monitoring                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 Quality Gates

Each feature must pass:

1. **Functional Test** - Core functionality works
2. **Legal Review** - Complies with AB04/ABT06
3. **Security Audit** - No vulnerabilities
4. **Performance Test** - Meets latency requirements
5. **User Acceptance** - Beta users approve

### 6.4 User Validation via Community Feedback

#### 6.4.1 Beta Program Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    BETA PROGRAM TIERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 1: ALPHA PARTNERS (5 companies)                          │
│  ─────────────────────────────────────                          │
│  - Direct access to development team                           │
│  - Weekly feedback sessions                                     │
│  - Feature request priority                                     │
│  - Free lifetime access to V2                                  │
│                                                                 │
│  TIER 2: BETA TESTERS (25 companies)                           │
│  ─────────────────────────────────────                          │
│  - Early access to new features                                │
│  - Monthly feedback surveys                                     │
│  - 50% discount on V2 subscription                             │
│                                                                 │
│  TIER 3: EARLY ADOPTERS (100 companies)                        │
│  ─────────────────────────────────────                          │
│  - Access 2 weeks before public launch                         │
│  - In-app feedback mechanism                                   │
│  - 25% discount on first year                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.4.2 Feedback Collection

**Channels:**
- In-app feedback widget
- Weekly video calls with alpha partners
- Monthly surveys
- Usage analytics
- Support ticket analysis

**Metrics Tracked:**
- Feature adoption rate
- Time to complete key workflows
- Error rates
- User satisfaction scores
- Feature request frequency

---

## 7. Roadmap

### 7.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         V2 ROADMAP OVERVIEW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  2026 Q1          2026 Q2          2026 Q3          2026 Q4            │
│  ────────         ────────         ────────         ────────            │
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ PHASE 1  │    │ PHASE 2  │    │ PHASE 3  │    │ PHASE 4  │         │
│  │   MVP    │───▶│  INTEG   │───▶│   AI     │───▶│  SCALE   │         │
│  │ Security │    │ rations  │    │ Features │    │          │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                                         │
│  Key Deliverables:                                                      │
│  • Legal Shield   • Credit APIs   • Risk AI      • Enterprise          │
│  • ÄTA Flow       • E-Signing     • Auto-Docs    • White-label         │
│  • Basic KMA      • Accounting    • Predictions  • API Platform        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Phase 1: MVP/Security Foundation

**Timeline:** 8 weeks  
**Focus:** Core legal protection features

#### 7.2.1 Sprint 1-2: ÄTA Protection Core

**Deliverables:**
- [ ] Enhanced ÄTA request form with all required fields
- [ ] Photo upload with mandatory validation for UNFORESEEN
- [ ] Admin review dashboard
- [ ] Basic pricing calculator

**Acceptance Criteria:**
- Worker can create ÄTA with photos in < 2 minutes
- Admin can review and price ÄTA in < 5 minutes
- All ÄTA data persisted with audit trail

#### 7.2.2 Sprint 3-4: Customer Approval Flow

**Deliverables:**
- [ ] Public approval page with token access
- [ ] Digital signature capture
- [ ] Email/SMS notification system
- [ ] Approval status tracking

**Acceptance Criteria:**
- Customer receives notification within 5 minutes
- Approval page loads in < 2 seconds
- Signature legally valid per Swedish law

#### 7.2.3 Sprint 5-6: Contract Templates

**Deliverables:**
- [ ] AB04 compliant contract template
- [ ] ABT06 compliant contract template
- [ ] Consumer contract template
- [ ] Auto-fill from project data

**Acceptance Criteria:**
- Templates reviewed by legal counsel
- Auto-fill accuracy > 95%
- PDF generation < 3 seconds

#### 7.2.4 Sprint 7-8: Basic KMA Module

**Deliverables:**
- [ ] Risk analysis templates
- [ ] Self-inspection checklists
- [ ] Incident reporting form
- [ ] Photo documentation

**Acceptance Criteria:**
- 10 industry-standard templates available
- Mobile-optimized forms
- Offline capability for field use

### 7.3 Phase 2: External Integrations

**Timeline:** 8 weeks  
**Focus:** Third-party service connections

#### 7.3.1 Sprint 9-10: Credit Check Integration

**Deliverables:**
- [ ] UC API integration
- [ ] Bisnode API integration (backup)
- [ ] Blacklist database connection
- [ ] Risk score calculation engine

**Acceptance Criteria:**
- Credit check completes in < 10 seconds
- Risk score accuracy validated
- GDPR compliant data handling

#### 7.3.2 Sprint 11-12: E-Signing Integration

**Deliverables:**
- [ ] BankID integration
- [ ] Freja eID integration
- [ ] Simple digital signature fallback
- [ ] Signature verification system

**Acceptance Criteria:**
- BankID signing works on mobile and desktop
- Signature audit trail complete
- Legal validity confirmed

#### 7.3.3 Sprint 13-14: Accounting Integration

**Deliverables:**
- [ ] Fortnox two-way sync
- [ ] Visma integration
- [ ] Invoice auto-generation from ÄTA
- [ ] Payment status tracking

**Acceptance Criteria:**
- Invoice sync < 30 seconds
- No duplicate entries
- Reconciliation reports available

#### 7.3.4 Sprint 15-16: Communication Services

**Deliverables:**
- [ ] Twilio SMS integration
- [ ] SendGrid email integration
- [ ] Push notification service
- [ ] Notification preferences management

**Acceptance Criteria:**
- SMS delivery rate > 98%
- Email delivery rate > 99%
- User can manage preferences

### 7.4 Phase 3: AI Features

**Timeline:** 8 weeks  
**Focus:** Intelligent automation

#### 7.4.1 Sprint 17-18: Risk Detection AI

**Deliverables:**
- [ ] Client risk analysis model
- [ ] Anomaly detection for projects
- [ ] Payment behavior prediction
- [ ] Fraud pattern recognition

**Acceptance Criteria:**
- Risk predictions > 80% accurate
- Anomalies detected within 24 hours
- False positive rate < 10%

#### 7.4.2 Sprint 19-20: Document AI

**Deliverables:**
- [ ] ÄTA auto-summarization
- [ ] Contract clause generation
- [ ] Document key term extraction
- [ ] Multi-language support

**Acceptance Criteria:**
- Summaries accurate and professional
- Generated clauses legally valid
- Swedish and English supported

#### 7.4.3 Sprint 21-22: Predictive Analytics

**Deliverables:**
- [ ] Budget overrun prediction
- [ ] Project delay forecasting
- [ ] Resource optimization suggestions
- [ ] Cash flow predictions

**Acceptance Criteria:**
- Predictions available 2 weeks in advance
- Accuracy > 75%
- Actionable recommendations provided

#### 7.4.4 Sprint 23-24: Smart Automation

**Deliverables:**
- [ ] Auto-categorization of expenses
- [ ] Smart scheduling suggestions
- [ ] Automated report generation
- [ ] Intelligent search

**Acceptance Criteria:**
- Categorization accuracy > 90%
- Scheduling conflicts auto-detected
- Reports generated in < 30 seconds

### 7.5 Success Metrics

#### 7.5.1 Phase 1 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| ÄTA creation time | < 2 min | Analytics |
| Customer approval rate | > 80% | Database |
| Audit trail completeness | 100% | Automated check |
| User satisfaction | > 4.0/5 | Survey |

#### 7.5.2 Phase 2 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Credit check usage | > 70% of new clients | Analytics |
| E-signing adoption | > 60% of contracts | Database |
| Integration uptime | > 99.5% | Monitoring |
| Sync accuracy | > 99% | Reconciliation |

#### 7.5.3 Phase 3 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI prediction accuracy | > 80% | Validation |
| Automation time saved | > 5 hrs/week/user | Survey |
| Feature adoption | > 50% of users | Analytics |
| Support ticket reduction | > 30% | Helpdesk |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ÄTA** | Ändrings- och Tilläggsarbeten - Changes and additions to contracted work |
| **AB04** | Allmänna Bestämmelser 04 - General conditions for construction contracts |
| **ABT06** | Allmänna Bestämmelser Totalentreprenad 06 - General conditions for design-build |
| **KMA** | Kvalitet, Miljö, Arbetsmiljö - Quality, Environment, Work Environment |
| **ROT** | Renovering, Ombyggnad, Tillbyggnad - Tax deduction for home renovation |
| **Personalliggare** | Personnel register required by Swedish tax authority |
| **Betalningsanmärkning** | Payment remark/default registered with credit agencies |

---

## Appendix B: Legal References

- **AB04** - Swedish Construction Federation standard contract
- **ABT06** - Swedish Construction Federation design-build contract
- **Konsumenttjänstlagen** - Consumer Services Act
- **GDPR** - General Data Protection Regulation
- **Bokföringslagen** - Swedish Bookkeeping Act

---

## Appendix C: Integration API Endpoints

### Credit Check APIs

| Provider | Endpoint | Auth |
|----------|----------|------|
| UC | `api.uc.se/v2/company/{orgNr}` | OAuth2 |
| Bisnode | `api.bisnode.com/credit/v1` | API Key |
| Creditsafe | `api.creditsafe.com/v1` | OAuth2 |

### E-Signing APIs

| Provider | Endpoint | Auth |
|----------|----------|------|
| BankID | `appapi2.bankid.com/rp/v6` | mTLS |
| Freja eID | `services.prod.frejaeid.com` | mTLS |

### Accounting APIs

| Provider | Endpoint | Auth |
|----------|----------|------|
| Fortnox | `api.fortnox.se/3` | OAuth2 |
| Visma | `api.visma.net/v1` | OAuth2 |

---

*Document End*

**Next Steps:**
1. Review with legal counsel
2. Validate with alpha partners
3. Begin Phase 1 Sprint 1
4. Establish beta program

---

*Created: 2026-01-29*  
*Last Updated: 2026-01-29*  
*Version: 2.0.0-draft*
```

