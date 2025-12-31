# 🚀 AI INTEGRATION GUIDE - QUICK START

**Time Required:** 20 minutes  
**Status:** Ready to integrate

---

## ✅ FILES CREATED

All 5 files have been created:

1. ✅ `app/api/ai/rot-summary/route.ts` - ROT summary API
2. ✅ `app/api/ai/invoice-ocr/route.ts` - Invoice OCR API (enhanced)
3. ✅ `app/components/rot/ROTAISummary.tsx` - ROT AI summary component
4. ✅ `app/components/invoices/InvoiceOCRUpload.tsx` - Invoice OCR upload component
5. ✅ `LANDING_PAGE_COPY.md` - Landing page content

---

## 📦 STEP 1: INSTALL PACKAGES (2 min)

```bash
cd /Users/vilmerfrost/Documents/frost-solutions
npm install @google/generative-ai groq-sdk
# or
pnpm add @google/generative-ai groq-sdk
# or
yarn add @google/generative-ai groq-sdk
```

**Note:** The packages are already added to `package.json`, just run install!

---

## 🔑 STEP 2: ADD API KEYS (3 min)

Add to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

**Get free API keys:**
- **Gemini:** https://makersuite.google.com/app/apikey (1,500 free requests/day)
- **Groq:** https://console.groq.com/ (14,400 free requests/day)

---

## 🎨 STEP 3: ADD ROT AI SUMMARY TO ROT PAGE (5 min)

### Option A: Add to existing ROT detail page

```tsx
// app/rot/[id]/page.tsx
import { ROTAISummary } from '@/components/rot/ROTAISummary';

export default function ROTApplicationPage({ params }: { params: { id: string } }) {
  // ... your existing code
  
  // Get ROT data (example)
  const rotData = {
    customerName: rot.customer_name || rot.clients?.name,
    projectDescription: `${rot.work_type} på ${rot.property_designation}`,
    workPeriod: rot.submission_date 
      ? `${rot.submission_date} till ${new Date().toISOString().split('T')[0]}`
      : 'Pågående',
    totalAmount: rot.total_cost_sek,
    vatAmount: Math.round(rot.total_cost_sek * 0.25),
    rotAmount: rot.work_cost_sek, // ROT is labor cost
    rutAmount: null, // If applicable
  };

  return (
    <div>
      {/* Your existing ROT form/content */}
      
      {/* ADD THIS: */}
      <div className="mt-8">
        <ROTAISummary
          rotData={rotData}
          onSummaryGenerated={(summary) => {
            // Save to database (example)
            // await updateROTApplication(rot.id, { ai_summary: summary });
            console.log('AI Summary generated:', summary);
          }}
        />
      </div>
    </div>
  );
}
```

### Option B: Add to ROT form page

```tsx
// app/rot/new/page.tsx or app/rot/[id]/edit/page.tsx
import { ROTAISummary } from '@/components/rot/ROTAISummary';

export default function ROTFormPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    workType: '',
    propertyAddress: '',
    totalCost: 0,
    // ... other fields
  });

  return (
    <div>
      {/* Your existing form */}
      
      {/* ADD THIS: */}
      <div className="mt-6">
        <ROTAISummary
          rotData={{
            customerName: formData.customerName,
            projectDescription: `${formData.workType} på ${formData.propertyAddress}`,
            workPeriod: 'Pågående',
            totalAmount: formData.totalCost,
            vatAmount: Math.round(formData.totalCost * 0.25),
            rotAmount: formData.totalCost * 0.7, // Estimate
          }}
          onSummaryGenerated={(summary) => {
            // Optionally save to form state
            setFormData(prev => ({ ...prev, aiSummary: summary }));
          }}
        />
      </div>
    </div>
  );
}
```

---

## 📄 STEP 4: ADD INVOICE OCR TO INVOICE PAGE (5 min)

### Option A: Add to invoice upload page

```tsx
// app/invoices/new/page.tsx or app/supplier-invoices/new/page.tsx
import { InvoiceOCRUpload } from '@/components/invoices/InvoiceOCRUpload';

export default function InvoiceUploadPage() {
  const handleInvoiceExtracted = async (data: InvoiceOCRResult) => {
    // Save to Supabase
    const { error } = await supabase
      .from('supplier_invoices')
      .insert({
        supplier_name: data.supplierName,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        due_date: data.dueDate,
        total_amount: data.totalAmount,
        vat_amount: data.vatAmount,
        // ... map other fields
      });
    
    if (error) {
      console.error('Error saving invoice:', error);
    } else {
      toast.success('Faktura sparad!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ladda upp faktura</h1>
      
      <InvoiceOCRUpload
        onInvoiceExtracted={handleInvoiceExtracted}
        onError={(error) => {
          toast.error(error);
        }}
      />
    </div>
  );
}
```

### Option B: Add to existing invoice form

```tsx
// app/supplier-invoices/[id]/page.tsx
import { InvoiceOCRUpload } from '@/components/invoices/InvoiceOCRUpload';

export default function InvoiceDetailPage() {
  return (
    <div>
      {/* Your existing invoice detail */}
      
      {/* ADD THIS: */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">AI Fakturaavläsning</h2>
        <InvoiceOCRUpload
          onInvoiceExtracted={(data) => {
            // Auto-fill form fields
            setFormData({
              supplierName: data.supplierName,
              invoiceNumber: data.invoiceNumber,
              invoiceDate: data.invoiceDate,
              // ... etc
            });
          }}
        />
      </div>
    </div>
  );
}
```

---

## 🧪 STEP 5: TEST (5 min)

### Test ROT Summary:
1. Go to any ROT page
2. Click "Generera sammanfattning"
3. ✅ Should generate AI summary

### Test Invoice OCR:
1. Go to invoice upload page
2. Upload a PDF/PNG invoice
3. ✅ Should extract invoice data

---

## 📋 INTEGRATION CHECKLIST

- [ ] Install packages: `npm install`
- [ ] Add API keys to `.env.local`
- [ ] Add `ROTAISummary` to ROT page
- [ ] Add `InvoiceOCRUpload` to invoice page
- [ ] Test ROT summary generation
- [ ] Test invoice OCR extraction
- [ ] Handle errors gracefully
- [ ] Save data to database

---

## 🐛 TROUBLESHOOTING

### API Keys Not Working?
- Check `.env.local` exists
- Verify keys are correct
- Restart dev server after adding keys

### Components Not Showing?
- Check imports are correct
- Verify component paths
- Check for TypeScript errors

### OCR Not Working?
- Check file size (max 10MB)
- Verify file format (PNG, JPEG, PDF)
- Check browser console for errors

---

## 📚 DOCUMENTATION

- **AI Integration:** `docs/FROST_BYGG_AI_SETUP.md`
- **API Routes:** See `app/api/ai/` directory
- **Components:** See `app/components/rot/` and `app/components/invoices/`

---

**✅ Ready to integrate! Follow the steps above and you're done in 20 minutes!**

