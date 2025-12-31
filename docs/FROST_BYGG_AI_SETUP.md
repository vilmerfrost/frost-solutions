# 🏗️ FROST BYGG AI INTEGRATION - SETUP GUIDE

Complete setup guide for the Frost Bygg AI integration library with Gemini 2.0 Flash and Groq Llama 3.3 70B.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting API Keys](#getting-api-keys)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Cost Analysis](#cost-analysis)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## 🌟 Overview

The Frost Bygg AI integration provides:

- **Gemini 2.0 Flash (Vision)** - OCR for invoices, delivery notes, and receipts
- **Groq Llama 3.3 70B (Text)** - Summaries, insights, payroll validation, and reports
- **Structured JSON Output** - Zod-validated responses
- **Retry Logic** - Automatic retries with exponential backoff
- **Swedish Context** - Optimized prompts for Swedish business documents

---

## 🔑 Getting API Keys

### 1. Google Gemini API Key (FREE TIER AVAILABLE)

**Step 1:** Go to [Google AI Studio](https://makersuite.google.com/app/apikey)

**Step 2:** Sign in with your Google account

**Step 3:** Click "Create API Key"

**Step 4:** Copy your API key

**Free Tier:**
- ✅ 1,500 requests/day
- ✅ 15 requests/minute
- ✅ Perfect for development and small-scale production

**Pricing (after free tier):**
- $0.10 per 1,000 requests (Gemini 2.0 Flash)
- Very affordable even at scale

### 2. Groq API Key (FREE TIER AVAILABLE)

**Step 1:** Go to [Groq Console](https://console.groq.com/)

**Step 2:** Sign up or sign in

**Step 3:** Navigate to "API Keys" in the dashboard

**Step 4:** Click "Create API Key"

**Step 5:** Copy your API key

**Free Tier:**
- ✅ 14,400 requests/day
- ✅ 30 requests/second
- ✅ More than enough for most use cases

**Pricing (after free tier):**
- $0.27 per 1M tokens (Llama 3.3 70B)
- Extremely cost-effective

---

## 📦 Installation

### Step 1: Install Dependencies

The integration uses only standard Node.js APIs (`fetch`, `Buffer`). No additional packages needed!

However, ensure you have Zod installed (already in your project):

```bash
# Already installed in your project
pnpm list zod
```

### Step 2: Add Environment Variables

Add to your `.env.local` file:

```env
# Gemini API (for OCR)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API (for text generation)
GROQ_API_KEY=your_groq_api_key_here
```

**Important:** Never commit API keys to git! Add `.env.local` to `.gitignore`.

### Step 3: Verify Installation

Create a test file `test-ai-setup.ts`:

```typescript
import { processInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration';

// Test that the module loads correctly
console.log('✅ AI Integration module loaded');
```

Run:
```bash
pnpm typecheck
```

---

## ⚙️ Configuration

### Basic Configuration

The library uses environment variables by default. You can also pass a config object:

```typescript
import { processInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration';

const result = await processInvoiceOCR(buffer, 'invoice.pdf', {
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  enableCostTracking: true,
  maxRetries: 3,
  retryDelayMs: 1000,
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `geminiApiKey` | `string` | `process.env.GEMINI_API_KEY` | Gemini API key for OCR |
| `groqApiKey` | `string` | `process.env.GROQ_API_KEY` | Groq API key for text generation |
| `enableCostTracking` | `boolean` | `false` | Track API costs (future feature) |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `retryDelayMs` | `number` | `1000` | Initial retry delay (exponential backoff) |

---

## 💻 Usage Examples

### Example 1: Invoice OCR (API Route)

Create `app/api/ai/invoice-ocr/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processInvoiceOCR(buffer, file.name);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Invoice OCR error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### Example 2: ROT/RUT Summary (Server Component)

```typescript
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';

export default async function ROTRUTPage() {
  const summary = await generateROTRUTSummary({
    customerName: 'Anders Andersson',
    projectDescription: 'Badrumsrenovering',
    workPeriod: '2025-01-15 till 2025-03-20',
    totalAmount: 150000,
    vatAmount: 37500,
    rotAmount: 112500,
  });

  return (
    <div>
      <h1>{summary.customerName}</h1>
      <p>{summary.summary}</p>
      {/* ... */}
    </div>
  );
}
```

### Example 3: Client Component with Upload

```typescript
'use client';

import { useState } from 'react';

export function InvoiceUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ai/invoice-ocr', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setResult(data.data);
    setLoading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Processing...' : 'Upload'}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

See `app/lib/ai/frost-bygg-ai-examples.tsx` for more complete examples!

---

## 🧪 Testing

### Test 1: Invoice OCR

```typescript
// test-invoice-ocr.ts
import { processInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration';
import { readFileSync } from 'fs';

async function testInvoiceOCR() {
  const buffer = readFileSync('./test-invoice.pdf');
  const result = await processInvoiceOCR(buffer, 'test-invoice.pdf');
  
  console.log('✅ Invoice OCR Result:');
  console.log(JSON.stringify(result, null, 2));
}

testInvoiceOCR().catch(console.error);
```

### Test 2: ROT/RUT Summary

```typescript
// test-rot-rut.ts
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';

async function testROTRUT() {
  const summary = await generateROTRUTSummary({
    customerName: 'Test Customer',
    projectDescription: 'Test project',
    workPeriod: '2025-01-01 till 2025-01-31',
    totalAmount: 100000,
    vatAmount: 25000,
    rotAmount: 75000,
  });
  
  console.log('✅ ROT/RUT Summary:');
  console.log(JSON.stringify(summary, null, 2));
}

testROTRUT().catch(console.error);
```

### Test 3: Payroll Validation

```typescript
// test-payroll.ts
import { validatePayroll } from '@/lib/ai/frost-bygg-ai-integration';

async function testPayroll() {
  const validation = await validatePayroll({
    employeeName: 'Test Employee',
    hours: 160,
    hourlyRate: 250,
    obKvall: 10,
    obNatt: 5,
    obHelg: 8,
    taxRate: 30,
  });
  
  console.log('✅ Payroll Validation:');
  console.log(JSON.stringify(validation, null, 2));
}

testPayroll().catch(console.error);
```

---

## 💰 Cost Analysis

### Free Tier Limits

**Gemini 2.0 Flash:**
- 1,500 requests/day
- 15 requests/minute
- **Cost: $0/month** (free tier)

**Groq Llama 3.3 70B:**
- 14,400 requests/day
- 30 requests/second
- **Cost: $0/month** (free tier)

### Cost at Scale

#### Scenario 1: 0-100 Customers (Startup Phase)

**Usage:**
- 50 invoices/day × 30 days = 1,500 invoices/month
- 100 summaries/month
- 50 payroll validations/month

**Cost:**
- Gemini: 1,500 requests/month = **$0** (within free tier)
- Groq: 150 requests/month = **$0** (within free tier)
- **Total: $0/month** ✅

#### Scenario 2: 1,000 Customers (Growth Phase)

**Usage:**
- 5,000 invoices/day × 30 days = 150,000 invoices/month
- 1,000 summaries/month
- 500 payroll validations/month

**Cost:**
- Gemini: 150,000 requests/month = **~$15/month**
- Groq: 1,500 requests/month = **~$0.50/month**
- **Total: ~$15/month**

**Revenue at 1,000 customers:**
- Assuming 499 kr/month per customer = **499,000 kr/month**
- AI cost: **0.003% of revenue** 🎉

#### Scenario 3: 10,000 Customers (Scale Phase)

**Usage:**
- 50,000 invoices/day × 30 days = 1,500,000 invoices/month
- 10,000 summaries/month
- 5,000 payroll validations/month

**Cost:**
- Gemini: 1,500,000 requests/month = **~$150/month**
- Groq: 15,000 requests/month = **~$5/month**
- **Total: ~$155/month**

**Revenue at 10,000 customers:**
- Assuming 499 kr/month per customer = **4,990,000 kr/month**
- AI cost: **Still only 0.003% of revenue** 🚀

### Conclusion

**You can scale to THOUSANDS of customers before AI costs become significant!**

The free tiers are more than enough for:
- Development
- Testing
- Early production (0-100 customers)
- Small businesses (100-500 customers)

---

## 🔧 Troubleshooting

### Error: "GEMINI_API_KEY is required"

**Solution:**
1. Check that `.env.local` exists
2. Verify `GEMINI_API_KEY` is set
3. Restart your Next.js dev server
4. Check that the key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Error: "Groq API error: 401"

**Solution:**
1. Verify `GROQ_API_KEY` is set in `.env.local`
2. Check that the API key is valid at [Groq Console](https://console.groq.com/)
3. Ensure you're using the correct API key (not a test key)

### Error: "Gemini API returned no content"

**Possible causes:**
1. Image format not supported (use PNG, JPEG, or PDF)
2. Image too large (try resizing)
3. Image quality too low (try higher resolution)
4. API rate limit reached (wait a minute)

**Solution:**
- Check image format and size
- Verify API key has remaining quota
- Check [Google AI Studio dashboard](https://makersuite.google.com/app/apikey) for usage

### Error: "Zod validation failed"

**Solution:**
- The AI returned invalid JSON or missing fields
- Check the `rawText` field in the result to see what was extracted
- The OCR confidence might be low - consider manual review
- Try re-uploading with a clearer image

### Slow Response Times

**Possible causes:**
1. Large image files
2. Network latency
3. API rate limiting

**Solutions:**
- Compress images before upload (max 5MB recommended)
- Implement client-side image compression
- Add loading states for better UX
- Consider caching results

---

## 🚀 Production Deployment

### Step 1: Set Environment Variables in Production

**Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `GEMINI_API_KEY` and `GROQ_API_KEY`
4. Redeploy

**Other platforms:**
- Set environment variables in your hosting platform's dashboard
- Never commit `.env` files to git

### Step 2: Enable Rate Limiting

Add rate limiting to your API routes:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function POST(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... rest of your code
}
```

### Step 3: Add Error Monitoring

Use Sentry or similar:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  const result = await processInvoiceOCR(buffer);
  return result;
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Step 4: Add Logging

```typescript
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  logger.info('Invoice OCR request received', {
    timestamp: new Date().toISOString(),
    fileSize: file.size,
  });
  
  // ... process
  
  logger.info('Invoice OCR completed', {
    invoiceNumber: result.invoiceNumber,
    confidence: result.ocrConfidence,
  });
}
```

### Step 5: Cache Results

Cache OCR results to avoid reprocessing:

```typescript
import { cache } from 'react';

export const getCachedInvoiceOCR = cache(async (fileHash: string) => {
  // Check cache first
  const cached = await redis.get(`invoice:ocr:${fileHash}`);
  if (cached) return JSON.parse(cached);
  
  // Process and cache
  const result = await processInvoiceOCR(buffer);
  await redis.setex(`invoice:ocr:${fileHash}`, 3600, JSON.stringify(result));
  
  return result;
});
```

---

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## ✅ Quick Start Checklist

- [ ] Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Get Groq API key from [Groq Console](https://console.groq.com/)
- [ ] Add keys to `.env.local`
- [ ] Test invoice OCR with a sample invoice
- [ ] Test ROT/RUT summary generation
- [ ] Test payroll validation
- [ ] Add API routes to your Next.js app
- [ ] Create UI components for file uploads
- [ ] Add error handling and loading states
- [ ] Deploy to production with environment variables

---

## 🎉 You're Ready!

Your Frost Bygg AI integration is now set up and ready to use. Start with the free tiers and scale as you grow. The cost is negligible compared to your revenue, even at thousands of customers!

**Questions?** Check the examples in `app/lib/ai/frost-bygg-ai-examples.tsx` or review the main integration file at `app/lib/ai/frost-bygg-ai-integration.ts`.

---

**Built with ❄️ by Frost Solutions**

