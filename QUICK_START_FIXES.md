# ⚡ QUICK START - FIX CRITICAL ISSUES TONIGHT

**Time Required:** 2-3 hours  
**Goal:** Fix payroll system + install dependencies

---

## 🚀 STEP-BY-STEP FIX GUIDE

### Step 1: Kill HMR Error (10 min)

```bash
# Stop dev server first!
# Then run:
cd /Users/vilmerfrost/Documents/frost-solutions
rm -rf .next
rm -rf node_modules/.cache
pnpm install
```

**Replace ExportButton:**
```bash
cp ExportButton-FIXED.tsx app/components/payroll/ExportButton.tsx
```

**Start dev server:**
```bash
pnpm dev
```

**✅ Expected:** No HMR errors, button works

---

### Step 2: Install Missing Dependencies (2 min)

```bash
pnpm add date-fns react-hook-form
```

**Verify:**
```bash
pnpm list date-fns react-hook-form
```

**✅ Expected:** Both packages installed

---

### Step 3: Fix Payroll Period Creation (5 min)

```bash
# Replace broken files with fixed versions
cp payroll-periods-route-FIXED.ts app/api/payroll/periods/route.ts
cp payroll-export-route-FIXED.ts app/api/payroll/periods/[id]/export/route.ts
```

**✅ Expected:** Files replaced successfully

---

### Step 4: Test Payroll System (30 min)

1. **Create Period:**
   - Go to `/payroll/periods/new`
   - Create a new period
   - ✅ Should work without errors

2. **Test Overlap Detection:**
   - Try to create overlapping period
   - ✅ Should show error message

3. **Export Period:**
   - Go to period detail page
   - Click "Exportera period"
   - ✅ Should export successfully

**✅ Expected:** Payroll system 100% working

---

## 📋 FILES CREATED

All fixed files are in project root:

1. ✅ `ExportButton-FIXED.tsx` - Fixed button (no HMR errors)
2. ✅ `payroll-periods-route-FIXED.ts` - Fixed period creation
3. ✅ `payroll-export-route-FIXED.ts` - Fixed export functionality
4. ✅ `setup-ai-integration.sh` - AI setup script
5. ✅ `AIRotSummaryButton.tsx` - AI summary component
6. ✅ `FROST_BYGG_7DAY_LAUNCH_SPRINT.md` - Complete launch plan

---

## 🎯 NEXT STEPS (Tomorrow)

### AI Integration (45 min)
```bash
./setup-ai-integration.sh
# Add API keys to .env.local
# Test AI endpoints
```

### Add ROT AI Summary (30 min)
```tsx
// Add to app/rot/[id]/page.tsx
import { AIRotSummaryButton } from '@/components/rot/AIRotSummaryButton';
// Use component in page
```

---

## 🐛 IF SOMETHING BREAKS

### HMR Error Still Happening?
```bash
# Nuclear option:
rm -rf .next node_modules/.cache
pnpm install --force
pnpm dev
```

### Period Creation Failing?
- Check browser console for errors
- Check server logs
- Verify database connection
- Check tenant ID is set

### Export Not Working?
- Check period is locked
- Check time entries are approved
- Check employee columns exist
- Check export format is set

---

## ✅ SUCCESS CRITERIA

After tonight, you should have:

- ✅ No HMR errors
- ✅ Can create payroll periods
- ✅ Can export payroll periods
- ✅ All dependencies installed
- ✅ Payroll system 100% working

---

## 📞 NEED HELP?

1. Check error logs in browser console
2. Check server logs in terminal
3. Check database in Supabase dashboard
4. Review `FROST_BYGG_7DAY_LAUNCH_SPRINT.md` for detailed plan

---

**💪 YOU GOT THIS! Let's fix this tonight!**

