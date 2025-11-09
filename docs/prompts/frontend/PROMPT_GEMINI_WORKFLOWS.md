# 🔄 GEMINI: WORKFLOW UI & REAL-TIME

**Frost Solutions - OCR Document Processing Frontend**  
**Developer:** Frontend Team - Real-time Specialist  
**Date:** November 2025

---

Du är en frontend-utvecklare som implementerar real-time workflow UI för Frost Solutions OCR-system.

**TEKNISK STACK:**
- Next.js 16 App Router
- React 19
- Supabase Realtime (subscriptions)
- React Query (TanStack Query)
- Zustand eller Context API för state

**UPPGIFT: Implementera Real-time Workflow UI**

### 1. Real-time Status Updates

**Component:** `app/components/workflows/WorkflowStatus.tsx`

**Krav:**
- Subscribe till `workflow_executions` table changes
- Real-time updates när workflow progress ändras
- Visual progress bar
- Stage indicators
- Error handling för connection issues
- Reconnection logic

**Implementation:**
- Use Supabase Realtime subscriptions
- Filter på `execution_id` eller `user_id`
- Update UI när `status`, `current_step`, eller `execution_history` ändras
- Handle connection drops gracefully

### 2. Workflow Progress Visualization

**Component:** `app/components/workflows/WorkflowProgress.tsx`

**Krav:**
- Visual timeline av workflow steps
- Current step highlighting
- Completed steps checkmarks
- Failed steps error indicators
- Estimated time remaining
- Step details on hover/click

**Workflow Steps:**
1. File Upload
2. OCR Processing
3. Data Extraction
4. Validation
5. Project Matching (invoices)
6. Material Registration (delivery notes)
7. Complete

### 3. Auto-fill Form Service

**Component:** `app/components/workflows/AutoFillForm.tsx`

**Krav:**
- Auto-fill form fields från OCR data
- Map OCR fields till form fields
- Allow manual override
- Show source indicator (OCR vs manual)
- Validation before submit

**Implementation:**
- Use `form_field_mappings` table för field mapping
- Pre-fill form med OCR extracted data
- Highlight auto-filled fields
- Allow user to edit any field
- Save draft automatically

### 4. Notification System

**Component:** `app/components/workflows/WorkflowNotifications.tsx`

**Krav:**
- Toast notifications för workflow events
- In-app notification center
- Real-time updates
- Notification types: success, error, warning, info
- Mark as read functionality
- Sound alerts (optional)

**Events:**
- OCR processing started
- OCR processing completed
- Low confidence warning
- Project match found
- Workflow completed
- Workflow failed

### 5. Live Updates Dashboard

**Component:** `app/components/workflows/LiveUpdatesDashboard.tsx`

**Krav:**
- Dashboard med alla active workflows
- Real-time updates för alla workflows
- Filter och search
- Status badges
- Quick actions (retry, cancel)
- Refresh button

**Features:**
- List view med status indicators
- Card view med progress bars
- Filter by status, type, date
- Sort by date, status
- Pagination eller infinite scroll

### 6. Workflow History

**Component:** `app/components/workflows/WorkflowHistory.tsx`

**Krav:**
- Display completed workflows
- Execution history timeline
- Step-by-step breakdown
- Error logs
- Retry failed workflows
- Export history

**Implementation Guidelines:**
- Use Supabase Realtime för live updates
- React Query för caching och synchronization
- Optimistic updates för better UX
- Error boundaries för graceful failures
- Connection status indicator
- Retry logic för failed operations

**Code Quality:**
- Handle connection drops gracefully
- Show connection status
- Queue updates om connection lost
- Sync when connection restored
- Debounce rapid updates

**Visa mig komplett real-time workflow UI med alla features implementerade.**

---

**Backend API:** Se `BACKEND_DEVELOPER_PROMPTS.md`  
**Supabase Realtime:** Se Gemini backend prompt för workflow structure

