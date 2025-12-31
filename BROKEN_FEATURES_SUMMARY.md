# 🔴 BROKEN FEATURES & ISSUES SUMMARY

**Last Updated:** $(date)  
**Status:** Critical issues need immediate attention

---

## 🚨 CRITICAL ISSUES (Fix Immediately)

### 1. PAYROLL EXPORT SYSTEM - COMPLETELY BROKEN

**Severity:** 🔴 CRITICAL  
**Impact:** Users cannot export payroll data, blocking payroll functionality

#### Affected Files:
```
app/components/payroll/ExportButton.tsx          ❌ HMR Error
app/components/payroll/ValidationIssues.tsx    ❌ Related HMR issue
app/lib/payroll/periods.ts                     ❌ Period creation broken
app/lib/payroll/employeeColumns.ts              ❌ Column detection broken
app/lib/payroll/exporters/helpers.ts            ❌ Export logic broken
app/lib/payroll/exporters/fortnox.ts            ⚠️ May be affected
app/lib/payroll/exporters/visma.ts              ⚠️ May be affected
app/api/payroll/periods/[id]/export/route.ts    ❌ Export API broken
app/hooks/usePayrollPeriods.ts                 ⚠️ May be affected
```

#### Specific Problems:

**Problem 1.1: HMR Error with Download Icon**
```
Error: Module [project]/frost-demo/node_modules/lucide-react/dist/esm/icons/download.js 
[app-client] (ecmascript) <export default as Download> was instantiated because it was 
required from module [project]/frost-demo/app/components/payroll/ExportButton.tsx 
[app-client] (ecmascript), but the module factory is not available. It might have been 
deleted in an HMR update.
```

**Root Cause:**
- Next.js 16.0.1 with Turbopack cache issue
- Download icon was removed from ExportButton.tsx but cache still references it
- Even affects ValidationIssues.tsx which doesn't import Download

**Attempted Fixes:**
- ✅ Removed Download from imports
- ✅ Cleared .next cache
- ❌ Problem persists

**Solution Needed:**
- Clear Turbopack cache completely
- Restart dev server
- Or refactor to avoid lucide-react icons temporarily

---

**Problem 1.2: Cannot Create Payroll Periods**
- Users cannot create new payroll periods
- No specific error messages
- Functionality completely broken

**Root Cause:**
- Likely related to column detection changes
- May be RPC function issue
- Form submission may be failing silently

**Solution Needed:**
- Check `app/lib/payroll/periods.ts` - `createPeriod()` function
- Check `app/api/payroll/periods/route.ts` - POST handler
- Check `app/components/payroll/PeriodForm.tsx` - Form submission
- Check `app/hooks/usePayrollPeriods.ts` - React Query mutation

---

**Problem 1.3: Cannot Export Payroll Periods**
- Export functionality completely broken
- Related to new column detection implementation

**Root Cause:**
- New column detection using RPC may be failing
- Export helpers may have bugs
- API route may have errors

**Solution Needed:**
- Review `app/lib/payroll/employeeColumns.ts`
- Review `app/lib/payroll/exporters/helpers.ts`
- Review `app/api/payroll/periods/[id]/export/route.ts`
- Check SQL RPC function: `sql/migrations/20251108_1200_get_existing_columns_rpc.sql`

---

#### Documentation References:
- `docs/PROMPT_CHATGPT5_PAYROLL_FIXES.md`
- `docs/PROMPT_CLAUDE45_PAYROLL_FIXES.md`
- `docs/PROMPT_EXTERNAL_AI_PAYROLL_FIXES.md`
- `docs/PROMPT_GPT4O_PAYROLL_FIXES.md`

---

## 🟡 HIGH PRIORITY ISSUES (Fix Soon)

### 2. MISSING DEPENDENCIES

**Severity:** 🟡 HIGH  
**Impact:** Multiple components will fail at runtime

#### Missing Packages:
```json
{
  "date-fns": "^2.30.0",        // ❌ Used but not installed
  "react-hook-form": "^7.48.0" // ❌ Used but not installed
}
```

#### Affected Files:
- Multiple components using `date-fns` for date formatting
- Multiple forms using `react-hook-form`
- Check all files importing these packages

**Solution:**
```bash
pnpm add date-fns react-hook-form
```

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 3. API RESPONSE FORMAT MISMATCH

**Severity:** 🟡 HIGH  
**Impact:** Inconsistent error handling, potential runtime errors

#### Problem:
- Frontend expects: `data.data` format
- Backend returns: `{ success: true, data }` format
- API clients not handling `success` field

#### Affected Files:
- All API client files in `app/lib/api/`
- All hooks using API clients
- Components expecting specific response format

**Solution:**
- Standardize on `{ success: boolean, data?: T, error?: string }` format
- Update all API clients to handle both formats
- Or update backend to match frontend expectations

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

## 🟢 MEDIUM PRIORITY ISSUES (Fix When Possible)

### 4. QUOTE API ENDPOINT MISMATCH

**Severity:** 🟢 MEDIUM  
**Impact:** Quote item editing may not work correctly

#### Problem:
**Frontend expects:**
- `PUT /api/quotes/${id}/items/${itemId}`
- `DELETE /api/quotes/${id}/items/${itemId}`

**Backend has:**
- `PUT /api/quotes/${id}/items` (with body.id)
- `DELETE /api/quotes/${id}/items` (with body.id)

#### Affected Files:
```
app/hooks/useQuotes.ts
app/api/quotes/[id]/items/route.ts
app/components/quotes/QuoteItemsEditor.tsx
```

**Solution:**
- Either update frontend to match backend
- Or update backend to match frontend
- Document the chosen approach

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 5. INCORRECT IMPORT PATHS

**Severity:** 🟢 MEDIUM  
**Impact:** TypeScript errors, potential runtime errors

#### Problems:
```typescript
// ❌ Wrong
import { useTenant } from '@/app/hooks/useTenant';
import { extractErrorMessage } from '@/app/lib/api';

// ✅ Correct
import { useTenant } from '@/context/TenantContext';
import { extractErrorMessage } from '@/lib/errorUtils';
```

#### Affected Files:
- Check all files importing `useTenant`
- Check all files importing `extractErrorMessage`
- May be multiple files affected

**Solution:**
- Search and replace incorrect imports
- Run TypeScript check to find all issues

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

### 6. SEND QUOTE API MISMATCH

**Severity:** 🟢 MEDIUM  
**Impact:** Quote email sending may not work

#### Problem:
- Frontend sends: `{ email, subject, body }`
- Backend expects: `{ to }`

#### Affected Files:
```
app/api/quotes/[id]/send/route.ts
app/components/quotes/SendQuoteModal.tsx
```

**Solution:**
- Align frontend and backend
- Update API to accept full email data or update frontend

**Documentation:**
- `docs/GEMINI_CODE_REVIEW.md`

---

## ⚠️ NEW FILES NEED INTEGRATION

### 7. FROST BYGG AI INTEGRATION (Not Yet Integrated)

**Severity:** ⚠️ NEW  
**Status:** Files created but not integrated

#### New Files:
```
✅ app/lib/ai/frost-bygg-ai-integration.ts    - Main library
✅ app/lib/ai/frost-bygg-ai-examples.tsx       - Examples
✅ docs/FROST_BYGG_AI_SETUP.md                 - Setup guide
```

#### What's Needed:
1. ❌ Create API routes:
   - `app/api/ai/invoice-ocr/route.ts`
   - `app/api/ai/delivery-note-ocr/route.ts`
   - `app/api/ai/receipt-ocr/route.ts`
   - `app/api/ai/rot-rut-summary/route.ts`
   - `app/api/ai/project-insights/route.ts`
   - `app/api/ai/validate-payroll/route.ts`
   - `app/api/ai/monthly-report/route.ts`

2. ❌ Add environment variables:
   ```env
   GEMINI_API_KEY=your_key_here
   GROQ_API_KEY=your_key_here
   ```

3. ❌ Create UI components:
   - Invoice OCR upload component
   - ROT/RUT summary generator
   - Project insights display
   - Payroll validator UI

4. ❌ Test integration:
   - Test all OCR functions
   - Test all text generation functions
   - Verify error handling
   - Check cost tracking

**Documentation:**
- `docs/FROST_BYGG_AI_SETUP.md`

---

## 📋 TESTING CHECKLIST

### Payroll System
- [ ] Can create new payroll period
- [ ] Can edit payroll period
- [ ] Can delete payroll period
- [ ] Can export to Fortnox
- [ ] Can export to Visma
- [ ] Can export to CSV
- [ ] Column detection works correctly
- [ ] No HMR errors in dev mode

### Dependencies
- [ ] `date-fns` installed and working
- [ ] `react-hook-form` installed and working
- [ ] All imports resolve correctly

### API Consistency
- [ ] All API responses use consistent format
- [ ] All API clients handle responses correctly
- [ ] Error handling works consistently

### Quote System
- [ ] Can edit quote items
- [ ] Can delete quote items
- [ ] Can send quote emails
- [ ] API endpoints match frontend expectations

### AI Integration
- [ ] API routes created and working
- [ ] Environment variables configured
- [ ] OCR functions tested
- [ ] Text generation functions tested
- [ ] Error handling tested
- [ ] UI components created

---

## 🎯 RECOMMENDED FIX ORDER

1. **🔴 CRITICAL: Fix Payroll Export** (Blocks users)
   - Fix HMR error
   - Fix period creation
   - Fix export functionality

2. **🟡 HIGH: Install Missing Dependencies** (Prevents runtime errors)
   - Install date-fns
   - Install react-hook-form

3. **🟡 HIGH: Fix API Response Format** (Improves stability)
   - Standardize response format
   - Update all API clients

4. **🟢 MEDIUM: Fix Quote API** (Improves UX)
   - Align endpoints
   - Fix email sending

5. **🟢 MEDIUM: Fix Import Paths** (Code quality)
   - Search and replace
   - Run typecheck

6. **⚠️ NEW: Integrate AI Features** (New functionality)
   - Create API routes
   - Add environment variables
   - Create UI components
   - Test thoroughly

---

## 📊 ISSUE STATISTICS

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Needs immediate fix |
| 🟡 High | 2 | Fix soon |
| 🟢 Medium | 3 | Fix when possible |
| ⚠️ New | 1 | Integration needed |

**Total Issues:** 9  
**Blocking Issues:** 3 (Payroll system)

---

**Last Updated:** $(date)  
**Next Review:** After critical fixes

