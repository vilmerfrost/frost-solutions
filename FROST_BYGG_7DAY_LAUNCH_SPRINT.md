# 🚀 FROST BYGG - 7-DAY LAUNCH SPRINT

**Start Date:** January 1, 2025  
**Launch Date:** January 7, 2025  
**Goal:** Ship-ready product with critical fixes + AI integration

---

## 📋 OVERVIEW

### Current Status
- ✅ **90% Complete** - Most features working
- 🔴 **Critical Issues:** Payroll export system
- 🟡 **High Priority:** Missing dependencies, API format
- ⚠️ **New Feature:** AI integration (ready to integrate)

### Launch Readiness
- **Core Features:** ✅ Ready
- **Payroll System:** 🔴 Needs fix (2-3 hours)
- **AI Features:** ⚠️ Ready to integrate (1-2 hours)
- **Polish:** 🟢 Can wait

---

## 🎯 PHASE 1: TONIGHT (2-3 HOURS) - FIX CRITICAL SHIT

### Task 1: Kill the Payroll HMR Error (30 min)

**Problem:** Turbopack cache issue with lucide-react Download icon

**Solution:**
```bash
# Stop dev server first!
rm -rf .next
rm -rf node_modules/.cache
pnpm install
pnpm dev
```

**If that doesn't work:**
```bash
# Replace ExportButton with fixed version
cp ExportButton-FIXED.tsx app/components/payroll/ExportButton.tsx
```

**Expected Result:** No HMR errors, button works

---

### Task 2: Install Missing Dependencies (5 min)

```bash
pnpm add date-fns react-hook-form
```

**Verify:**
```bash
pnpm list date-fns react-hook-form
```

---

### Task 3: Fix Payroll Period Creation (1 hour)

**Replace files:**
```bash
cp payroll-periods-route-FIXED.ts app/api/payroll/periods/route.ts
cp payroll-export-route-FIXED.ts app/api/payroll/periods/[id]/export/route.ts
```

**Test:**
1. Create new payroll period ✅
2. Try to create overlapping period (should fail) ✅
3. Export period to CSV ✅
4. Export period to Fortnox ✅
5. Export period to Visma ✅

**Expected Result:** Payroll system 100% working

---

### Task 4: Fix API Response Format (30 min)

**Update API clients to handle both formats:**
```typescript
// In app/lib/api/payroll.ts and other API clients
const response = await fetch(...);
const data = await response.json();

// Handle both formats
const result = data.success ? data.data : data;
```

**Test:** All API calls work correctly

---

## 🎯 PHASE 2: TOMORROW (1-2 HOURS) - INTEGRATE AI & POLISH

### Task 1: Quick AI Integration (45 min)

**Run setup script:**
```bash
./setup-ai-integration.sh
```

**Add environment variables:**
```bash
# Get free API keys:
# Gemini: https://makersuite.google.com/app/apikey
# Groq:   https://console.groq.com/

# Add to .env.local:
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

**Test AI endpoints:**
```bash
# Test invoice OCR
curl -X POST http://localhost:3000/api/ai/invoice-ocr \
  -F "file=@test-invoice.pdf"

# Test ROT/RUT summary
curl -X POST http://localhost:3000/api/ai/rot-rut-summary \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "projectDescription": "Badrumsrenovering",
    "workPeriod": "2025-01-01 till 2025-01-31",
    "totalAmount": 100000,
    "vatAmount": 25000,
    "rotAmount": 75000
  }'
```

**Expected Result:** AI endpoints working

---

### Task 2: Add ROT AI Summary to UI (30 min)

**Add to ROT detail page:**
```tsx
// In app/rot/[id]/page.tsx
import { AIRotSummaryButton } from '@/components/rot/AIRotSummaryButton';

// Add component where you want it:
<AIRotSummaryButton
  rotApplicationId={rot.id}
  customerName={rot.customer_name}
  projectDescription={rot.project_description}
  workPeriod={`${rot.start_date} till ${rot.end_date}`}
  totalAmount={rot.total_amount}
  vatAmount={rot.vat_amount}
  rotAmount={rot.rot_amount}
  rutAmount={rot.rut_amount}
/>
```

**Test:** Button appears, generates summary

---

### Task 3: Quick Polish (15 min)

**Fix import paths:**
```bash
# Search and replace incorrect imports
grep -r "@/app/hooks/useTenant" app/
grep -r "@/app/lib/api" app/
```

**Fix Quote API endpoints:**
- Update `app/hooks/useQuotes.ts` to match backend format
- Test quote item editing

---

## 🎯 PHASE 3: LAUNCH WEEK (Jan 1-7)

### Day 1-2: Critical Fixes ✅
- [x] Fix payroll HMR error
- [x] Install missing dependencies
- [x] Fix payroll period creation
- [x] Fix payroll export
- [x] Fix API response format

### Day 3-4: AI Integration ✅
- [x] Run AI setup script
- [x] Add API keys
- [x] Test AI endpoints
- [x] Add ROT AI summary component
- [x] Test AI features

### Day 5: Beta Testing 🧪
- [ ] Test with 1-2 beta customers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Performance testing

### Day 6: Final Polish ✨
- [ ] Fix remaining import paths
- [ ] Fix Quote API endpoints
- [ ] UI/UX improvements
- [ ] Documentation updates

### Day 7: LAUNCH 🚀
- [ ] Final testing
- [ ] Deploy to production
- [ ] Monitor errors
- [ ] Celebrate! 🎉

---

## 📊 DAILY CHECKLIST

### Morning (9:00 AM)
- [ ] Check error logs
- [ ] Review yesterday's progress
- [ ] Plan today's tasks
- [ ] Update status

### Afternoon (2:00 PM)
- [ ] Test new features
- [ ] Fix bugs found
- [ ] Update documentation
- [ ] Commit changes

### Evening (6:00 PM)
- [ ] Final testing
- [ ] Deploy if ready
- [ ] Update progress
- [ ] Plan tomorrow

---

## 🐛 BUG TRACKING

### Critical Bugs (Fix Immediately)
- [ ] Payroll HMR error
- [ ] Payroll period creation
- [ ] Payroll export

### High Priority Bugs (Fix Today)
- [ ] Missing dependencies
- [ ] API response format
- [ ] Import paths

### Medium Priority Bugs (Fix This Week)
- [ ] Quote API endpoints
- [ ] Send quote format
- [ ] UI polish

---

## 📈 SUCCESS METRICS

### Technical Metrics
- ✅ Zero critical bugs
- ✅ All core features working
- ✅ AI integration complete
- ✅ Performance < 2s page load

### Business Metrics
- 🎯 5 beta customers onboarded
- 🎯 0 critical support tickets
- 🎯 95%+ uptime
- 🎯 Positive user feedback

---

## 🚨 EMERGENCY CONTACTS

### If Something Breaks
1. **Check logs:** `pnpm dev` console
2. **Check database:** Supabase dashboard
3. **Check API:** Network tab in browser
4. **Rollback:** Git revert if needed

### Escalation
- **Critical:** Fix immediately
- **High:** Fix within 24 hours
- **Medium:** Fix this week

---

## 📝 NOTES

### Known Issues
- Payroll HMR error (fixing tonight)
- Missing dependencies (fixing tonight)
- API format inconsistencies (fixing tonight)

### Future Improvements
- Better error handling
- More AI features
- Performance optimizations
- UI/UX improvements

---

## ✅ FINAL CHECKLIST (Before Launch)

### Technical
- [ ] All critical bugs fixed
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Backup strategy in place

### Business
- [ ] Beta customers onboarded
- [ ] Support process ready
- [ ] Documentation complete
- [ ] Marketing materials ready
- [ ] Launch announcement prepared

### Team
- [ ] Everyone knows their role
- [ ] Support team ready
- [ ] Monitoring set up
- [ ] Communication channels open

---

**🎯 GOAL: Ship-ready product by January 7, 2025**

**💪 YOU GOT THIS!**

---

**Last Updated:** $(date)  
**Status:** Ready to execute

