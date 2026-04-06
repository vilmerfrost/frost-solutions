# Binder System, Checklists & Case Management — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Replace hardcoded BSAB folder system with flexible iBinder-style binder management, add structured egenkontroller (checklists), and case/issue tracking.

---

## 1. Overview

Frost Solutions currently has a document management system with a hardcoded BSAB folder structure. This spec replaces that with a flexible binder system inspired by iBinder — the Swedish construction industry standard — plus checklists (egenkontroller) and case management for defect/issue tracking.

### Goals
- Let users create custom binders with tabs, while keeping BSAB as a default template
- Provide structured checklists for quality inspections (egenkontroller) with different field types
- Track issues/defects as cases with kanban workflow and automatic traceability to checklists/documents
- Mobile-first design for field features (checklists, cases), desktop-first for admin features (templates, binder management)
- Safe migration path — existing documents preserved

### Non-Goals
- BIM/3D model viewing
- eTendering / procurement
- Property management (förvaltning)
- Full offline mode (localStorage draft saving only)
- GPS location tracking on cases

---

## 2. Data Model

### 2.1 Binder System

**`binder_templates`** — Reusable binder structures (tenant-level)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| name | TEXT | e.g. "BSAB Standard", "Villaprojekt" |
| description | TEXT | |
| structure | JSONB | `{ tabs: [{ name, key, icon, restricted }] }` |
| is_default | BOOLEAN | One per tenant, used for auto-creation |
| created_by | UUID FK → employees | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**`binders`** — Binder instance within a project
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| project_id | UUID FK → projects | |
| name | TEXT | e.g. "BSAB Standard", "Kunddokumentation" |
| template_id | UUID FK → binder_templates | Nullable, tracks origin |
| sort_order | INTEGER | Display order |
| created_by | UUID FK → employees | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**`binder_tabs`** — Tabs within a binder
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| binder_id | UUID FK → binders ON DELETE CASCADE | |
| name | TEXT | e.g. "Ritningar", "Avtal" |
| key | TEXT | URL-safe slug, unique per binder |
| sort_order | INTEGER | |
| config | JSONB | `{ icon, color, restricted_roles: string[] }` |
| created_by | UUID FK → employees | |
| created_at | TIMESTAMPTZ | |

**`project_documents`** — Existing table, modified
| Change | Details |
|--------|---------|
| ADD `binder_tab_id` | UUID FK → binder_tabs, nullable (for migration) |
| KEEP `folder` | Deprecated but retained for backwards compatibility |

### 2.2 Checklists

**`checklist_templates`** — Reusable checklist definitions (tenant-level)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| name | TEXT | e.g. "Egenkontroll Grund" |
| description | TEXT | |
| category | TEXT | e.g. "Grund", "Stomme", "Tak", "El", "VVS" |
| structure | JSONB | See structure format below |
| created_by | UUID FK → employees | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Checklist template structure format:
```json
{
  "sections": [
    {
      "name": "Grundarbete",
      "items": [
        { "label": "Markförhållanden kontrollerade", "type": "yes_no" },
        { "label": "Fuktmätning (RH%)", "type": "measurement", "config": { "unit": "%", "max": 100 } },
        { "label": "Materialtyp", "type": "dropdown", "config": { "options": ["Betong", "Trä", "Stål"] } },
        { "label": "Kommentar om förhållanden", "type": "text" }
      ]
    }
  ]
}
```

**`checklists`** — A filled-in checklist instance
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| project_id | UUID FK → projects | |
| binder_tab_id | UUID FK → binder_tabs | Nullable, optional placement in a binder |
| template_id | UUID FK → checklist_templates | Which template it was created from |
| name | TEXT | Copied from template, editable |
| status | TEXT | `draft` / `in_progress` / `completed` / `signed_off` |
| assigned_to | UUID FK → employees | Nullable |
| signed_by | UUID FK → employees | Nullable |
| signed_at | TIMESTAMPTZ | Nullable |
| signature_data | TEXT | Base64 canvas signature image |
| created_by | UUID FK → employees | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**`checklist_items`** — Individual items in a filled checklist
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| checklist_id | UUID FK → checklists ON DELETE CASCADE | |
| section | TEXT | Section name for grouping |
| sort_order | INTEGER | |
| label | TEXT | The question/check text |
| item_type | TEXT | `yes_no` / `measurement` / `dropdown` / `text` |
| config | JSONB | Type-specific config (unit, options, min/max) |
| value | TEXT | The answer (nullable until filled) |
| status | TEXT | `pending` / `ok` / `fail` / `na` |
| comment | TEXT | Optional worker comment |
| photo_path | TEXT | Supabase Storage path |
| case_id | UUID FK → cases | Nullable, auto-created on failure |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 2.3 Cases

**`cases`** — Issues, defects, action items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| project_id | UUID FK → projects | |
| title | TEXT | |
| description | TEXT | Nullable |
| status | TEXT | `ny` / `pagaende` / `atgardad` / `godkand` |
| priority | TEXT | `low` / `medium` / `high` / `critical` |
| assigned_to | UUID FK → employees | Nullable |
| created_by | UUID FK → employees | |
| source_type | TEXT | `manual` / `checklist` / `annotation` |
| source_id | UUID | Nullable, FK to checklist_items or document_annotations |
| due_date | DATE | Nullable |
| resolved_at | TIMESTAMPTZ | Nullable |
| photos | TEXT[] | Array of Supabase Storage paths |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**`case_comments`** — Discussion thread on a case
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| case_id | UUID FK → cases ON DELETE CASCADE | |
| author_id | UUID FK → employees | |
| body | TEXT | |
| photos | TEXT[] | |
| created_at | TIMESTAMPTZ | |

### 2.4 Indexes

```sql
-- Binders
CREATE INDEX idx_binders_project ON binders(project_id);
CREATE INDEX idx_binder_tabs_binder ON binder_tabs(binder_id);
CREATE UNIQUE INDEX idx_binder_tabs_key ON binder_tabs(binder_id, key);

-- Documents (new)
CREATE INDEX idx_documents_binder_tab ON project_documents(binder_tab_id);

-- Checklists
CREATE INDEX idx_checklists_project ON checklists(project_id);
CREATE INDEX idx_checklists_status ON checklists(project_id, status);
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);

-- Cases
CREATE INDEX idx_cases_project ON cases(project_id);
CREATE INDEX idx_cases_status ON cases(project_id, status);
CREATE INDEX idx_cases_assigned ON cases(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_case_comments_case ON case_comments(case_id);
```

### 2.5 RLS Policies

All tables follow the existing pattern:
- `tenant_id` on every table
- SELECT/INSERT/UPDATE/DELETE policies filtered by `auth.jwt() -> 'tenant_id'`
- Service role has full access
- Role-based restrictions (restricted tabs) enforced at the API layer using `config.restricted_roles`

---

## 3. Page Structure

### 3.1 Modified Pages

**`/projects/[id]/documents`** — Binder Browser (rework of current page)
- Left panel: list of binders, expandable to show tabs
- Right panel: documents in selected tab (reuses existing file list, upload, search, versioning)
- Top actions: "Ny pärm" (new binder), "Från mall" (from template)
- Preserves all existing document features (upload, versioning, sharing, auto-tag, annotations)

### 3.2 New Pages

**`/projects/[id]/checklists`** — Checklist overview
- List of all checklists in project
- Filter by: status, template category, assigned_to
- "Ny egenkontroll" button → template picker modal → creates instance
- Status badges: Utkast (grey), Pågående (blue), Klar (green), Signerad (gold)

**`/projects/[id]/checklists/[checklistId]`** — Checklist fill-in view
- Mobile-first layout (see Section 5)
- Section-by-section navigation
- Item cards with type-specific inputs
- Sticky bottom bar with progress + save/complete buttons
- Sign-off view with signature pad

**`/projects/[id]/cases`** — Case board
- 4-column kanban: Ny → Pågående → Åtgärdad → Godkänd
- Cards: title, priority badge, assignee, due date, source link icon
- "Nytt ärende" quick-create button
- Filter by: priority, assignee, source_type

**`/projects/[id]/cases/[caseId]`** — Case detail
- Header: title, status, priority, assignee, due date
- Body: description, photos grid
- Source link: clickable link to originating checklist item or annotation
- Comment thread below
- Action buttons: change status, reassign, edit

**`/settings/templates`** — Template management (admin only)
- Two tabs: "Pärmmallar" (binder templates) and "Checklistmallar" (checklist templates)
- CRUD for both types
- Binder template editor: add/remove/reorder tabs, set icons and restrictions
- Checklist template editor: add sections, add items with type configuration

### 3.3 Sidebar Changes

Under each project in the sidebar, add:
- Dokument (existing, links to binder browser)
- Egenkontroller (new)
- Ärenden (new)

Under Settings:
- Mallar (new, links to /settings/templates)

---

## 4. API Routes

### 4.1 Binders

```
GET    /api/projects/[id]/binders                              → List binders
POST   /api/projects/[id]/binders                              → Create binder
PATCH  /api/projects/[id]/binders/[binderId]                   → Update binder
DELETE /api/projects/[id]/binders/[binderId]                   → Delete binder (cascade)

GET    /api/projects/[id]/binders/[binderId]/tabs              → List tabs
POST   /api/projects/[id]/binders/[binderId]/tabs              → Create tab
PATCH  /api/projects/[id]/binders/[binderId]/tabs/[tabId]      → Update tab
DELETE /api/projects/[id]/binders/[binderId]/tabs/[tabId]      → Delete tab
```

### 4.2 Documents (modified existing)

```
GET    /api/projects/[id]/documents?binder_tab_id=X            → Filter by tab
POST   /api/projects/[id]/documents/upload                     → Add binder_tab_id param
```

All other document routes (search, share, versions, annotations, auto-tag) remain unchanged.

### 4.3 Checklists

```
GET    /api/projects/[id]/checklists                           → List, filter by status/assignee
POST   /api/projects/[id]/checklists                           → Create from template
GET    /api/projects/[id]/checklists/[checklistId]             → Full checklist with items
PATCH  /api/projects/[id]/checklists/[checklistId]             → Update status, sign off
PATCH  /api/projects/[id]/checklists/[checklistId]/items/[itemId] → Update item value/status/photo
```

### 4.4 Cases

```
GET    /api/projects/[id]/cases                                → List, filter
POST   /api/projects/[id]/cases                                → Create case
GET    /api/projects/[id]/cases/[caseId]                       → Detail with comments
PATCH  /api/projects/[id]/cases/[caseId]                       → Update
POST   /api/projects/[id]/cases/[caseId]/comments              → Add comment
```

### 4.5 Templates (admin)

```
GET    /api/templates/binders                                  → List binder templates
POST   /api/templates/binders                                  → Create
PATCH  /api/templates/binders/[id]                             → Update
DELETE /api/templates/binders/[id]                              → Delete

GET    /api/templates/checklists                               → List checklist templates
POST   /api/templates/checklists                               → Create
PATCH  /api/templates/checklists/[id]                          → Update
DELETE /api/templates/checklists/[id]                           → Delete
```

---

## 5. Mobile-First Field Features

### 5.1 Checklist Fill-In (Mobile-First)

- One section at a time, "Nästa" button to advance between sections
- Each item rendered as a full-width card with min 48px touch targets
- **yes_no**: Three large toggle buttons — Ja (green) / Nej (red) / Ej tillämpligt (grey)
- **measurement**: Large number input with unit label beside it
- **dropdown**: Native select or bottom sheet on mobile
- **text**: Expandable textarea
- Camera button on every item → native camera → auto-compress to max 2MB → upload
- Comment field collapsed by default, expandable
- Failed item (Nej) → prompt: "Skapa ärende?" → pre-fills case title from item label
- Sticky bottom bar: progress ("4 av 12") + "Spara utkast" + "Slutför"
- Sign-off screen: signature pad (HTML canvas) for platschef/arbetsledare

### 5.2 Case Quick-Create (Mobile-First)

- Minimum fields: title + photo + priority
- One-tap photo capture (camera, not file picker)
- Auto-links to source when created from checklist item
- Full detail editing available but not required at creation time

### 5.3 Photo Handling

- Direct camera capture via `<input type="file" accept="image/*" capture="environment">`
- Client-side compression to max 2MB before upload (canvas resize)
- Storage path: `{tenantId}/{projectId}/cases/{caseId}/photo-{timestamp}.jpg` or `checklists/{checklistId}/item-{itemId}.jpg`

### 5.4 Draft Persistence

- Checklist state saved to localStorage as user fills it in
- Key: `checklist-draft-{checklistId}`
- On load: check localStorage for draft, restore if found
- On successful save to server: clear localStorage draft
- Protects against connection drops mid-inspection

---

## 6. Permissions

| Action | Admin / Projektchef | Arbetsledare | Arbetare | Underentreprenör |
|--------|-------------------|-------------|---------|-----------------|
| Create binder templates | Yes | — | — | — |
| Create/delete binders in project | Yes | Yes | — | — |
| Upload documents | Yes | Yes | Yes (own folders) | Yes (assigned folders) |
| Create checklist templates | Yes | Yes | — | — |
| Fill in checklists | Yes | Yes | Yes | Yes (assigned only) |
| Sign off checklists | Yes | Yes | — | — |
| Create cases | Yes | Yes | Yes | Yes |
| Assign/close cases | Yes | Yes | — | — |
| View restricted tabs (Avtal, Ekonomi) | Yes | — | — | — |
| Manage templates (Settings) | Yes | — | — | — |

Enforced at the API layer. RLS handles tenant isolation. Role checks use the existing `employee.role` field.

---

## 7. Migration Strategy

### Phase 1 — Schema (no breaking changes)
- Create all new tables (binders, binder_tabs, binder_templates, checklist_templates, checklists, checklist_items, cases, case_comments)
- Add nullable `binder_tab_id` to `project_documents`
- Insert BSAB default binder template
- Add RLS policies to all new tables
- Add indexes

### Phase 2 — Data migration
- For each project with existing documents: auto-create a "BSAB Standard" binder from the default template
- Map existing `folder` values to corresponding `binder_tab_id`
- Backfill `binder_tab_id` on all existing `project_documents` rows

### Phase 3 — UI switch
- Replace documents page with binder browser
- Add checklists and cases pages
- Add sidebar items
- Add settings/templates page
- `folder` column kept but deprecated

---

## 8. Checklist Templates — Industry Standard

Pre-built templates will be based on real Swedish construction industry standards:
- Source from Svensk Byggtjänst, AMA (Allmän Material- och Arbetsbeskrivning), BBR (Boverkets Byggregler)
- Research actual egenkontroll forms used in the industry during implementation
- Ship 3-5 commonly used templates covering foundation, framing, wet rooms, fire safety, electrical
- Templates are starting points — users can customize for their needs

---

## 9. File Structure (New Files)

```
app/
  api/
    projects/[id]/
      binders/
        route.ts                          → GET, POST
        [binderId]/
          route.ts                        → PATCH, DELETE
          tabs/
            route.ts                      → GET, POST
            [tabId]/
              route.ts                    → PATCH, DELETE
      checklists/
        route.ts                          → GET, POST
        [checklistId]/
          route.ts                        → GET, PATCH
          items/
            [itemId]/
              route.ts                    → PATCH
      cases/
        route.ts                          → GET, POST
        [caseId]/
          route.ts                        → GET, PATCH
          comments/
            route.ts                      → POST
    templates/
      binders/
        route.ts                          → GET, POST
        [id]/
          route.ts                        → PATCH, DELETE
      checklists/
        route.ts                          → GET, POST
        [id]/
          route.ts                        → PATCH, DELETE
  projects/[id]/
    checklists/
      page.tsx                            → Checklist overview
      [checklistId]/
        page.tsx                          → Checklist fill-in
    cases/
      page.tsx                            → Case kanban board
      [caseId]/
        page.tsx                          → Case detail
  settings/
    templates/
      page.tsx                            → Template management
  lib/
    documents/
      folders.ts                          → Keep for backwards compat, add deprecation note
    binders/
      templates.ts                        → Template helpers (BSAB default, create from template)
    checklists/
      templates.ts                        → Checklist template helpers
    cases/
      utils.ts                            → Case helpers (status transitions, auto-create from checklist)

supabase/
  migrations/
    YYYYMMDD_binder_system.sql            → Phase 1 schema
    YYYYMMDD_migrate_documents.sql        → Phase 2 data migration
```
