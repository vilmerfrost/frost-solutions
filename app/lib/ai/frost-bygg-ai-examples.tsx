/**
 * 🏗️ FROST BYGG AI INTEGRATION - USAGE EXAMPLES
 * 
 * Complete examples for using the Frost Bygg AI integration library
 * 
 * This file contains:
 * - API route examples (Next.js App Router) - Copy to app/api/ai/...
 * - Client component examples - Use 'use client' directive
 * - Server component examples - Use in Server Components
 * - Error handling patterns
 * - UI examples with Tailwind CSS
 * 
 * NOTE: This is a reference file. Copy the code you need to your actual files.
 * 
 * For API routes: Copy to app/api/ai/[endpoint]/route.ts
 * For client components: Add 'use client' at the top and copy to your components folder
 */

// React imports (for client components)
import { useState } from 'react';

// Type imports (used in examples)
import type {
  InvoiceOCRResult,
  DeliveryNoteOCRResult,
  ReceiptOCRResult,
  ROTRUTSummary,
  ProjectInsights,
  PayrollValidationResult,
  MonthlyReport,
} from './frost-bygg-ai-integration';

// Function imports (used in API route examples)
import {
  processInvoiceOCR,
  processDeliveryNoteOCR,
  processReceiptOCR,
  generateROTRUTSummary,
  generateProjectInsights,
  validatePayroll,
  generateMonthlyReport,
} from './frost-bygg-ai-integration';

// ============================================================================
// EXAMPLE 1: Invoice OCR API Route
// ============================================================================

/**
 * API Route: POST /api/ai/invoice-ocr
 * 
 * Create file: app/api/ai/invoice-ocr/route.ts
 * 
 * Usage from client:
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * 
 * const response = await fetch('/api/ai/invoice-ocr', {
 *   method: 'POST',
 *   body: formData,
 * });
 * 
 * const result = await response.json();
 * ```
 */
export async function POST_InvoiceOCR_API(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processInvoiceOCR(buffer, file.name);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Invoice OCR error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 2: Delivery Note OCR API Route
// ============================================================================

/**
 * API Route: POST /api/ai/delivery-note-ocr
 */
export async function POST_DeliveryNoteOCR_API(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processDeliveryNoteOCR(buffer, file.name);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delivery note OCR error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 3: ROT/RUT Summary API Route
// ============================================================================

/**
 * API Route: POST /api/ai/rot-rut-summary
 * 
 * Request body:
 * ```json
 * {
 *   "customerName": "Anders Andersson",
 *   "projectDescription": "Badrumsrenovering",
 *   "workPeriod": "2025-01-15 till 2025-03-20",
 *   "totalAmount": 150000,
 *   "vatAmount": 37500,
 *   "rotAmount": 112500
 * }
 * ```
 */
export async function POST_ROTRUTSummary_API(req: Request) {
  try {
    const body = await req.json();
    
    const result = await generateROTRUTSummary({
      customerName: body.customerName,
      projectDescription: body.projectDescription,
      workPeriod: body.workPeriod,
      totalAmount: body.totalAmount,
      vatAmount: body.vatAmount,
      rotAmount: body.rotAmount,
      rutAmount: body.rutAmount,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('ROT/RUT summary error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 4: Project Insights API Route
// ============================================================================

/**
 * API Route: POST /api/ai/project-insights
 */
export async function POST_ProjectInsights_API(req: Request) {
  try {
    const body = await req.json();
    
    const result = await generateProjectInsights({
      projectName: body.projectName,
      currentStatus: body.currentStatus,
      totalBudget: body.totalBudget,
      spent: body.spent,
      startDate: body.startDate,
      endDate: body.endDate,
      expectedCompletion: body.expectedCompletion,
      risks: body.risks,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Project insights error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 5: Payroll Validation API Route
// ============================================================================

/**
 * API Route: POST /api/ai/validate-payroll
 */
export async function POST_ValidatePayroll_API(req: Request) {
  try {
    const body = await req.json();
    
    const result = await validatePayroll({
      employeeName: body.employeeName,
      hours: body.hours,
      hourlyRate: body.hourlyRate,
      obKvall: body.obKvall,
      obNatt: body.obNatt,
      obHelg: body.obHelg,
      taxRate: body.taxRate,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Payroll validation error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 6: Monthly Report API Route
// ============================================================================

/**
 * API Route: POST /api/ai/monthly-report
 */
export async function POST_MonthlyReport_API(req: Request) {
  try {
    const body = await req.json();
    
    const result = await generateMonthlyReport({
      month: body.month,
      totalRevenue: body.totalRevenue,
      totalCosts: body.totalCosts,
      projectsCompleted: body.projectsCompleted,
      projectsActive: body.projectsActive,
      projectDetails: body.projectDetails,
      employeeUtilization: body.employeeUtilization,
      customerSatisfaction: body.customerSatisfaction,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 7: Client Component - Invoice OCR Upload
// ============================================================================

/**
 * CLIENT COMPONENT EXAMPLE
 * 
 * Copy this to: app/components/invoice-ocr-upload.tsx
 * 
 * Add at the top of your file:
 * ```tsx
 * 'use client';
 * 
 * import { useState } from 'react';
 * import type { InvoiceOCRResult } from '@/lib/ai/frost-bygg-ai-integration';
 * ```
 * 
 * Usage:
 * ```tsx
 * import { InvoiceOCRUpload } from '@/components/invoice-ocr-upload';
 * 
 * export default function Page() {
 *   return <InvoiceOCRUpload />;
 * }
 * ```
 */

// NOTE: This example uses React hooks. In your actual component file, add:
// 'use client';
// import { useState } from 'react';

export function InvoiceOCRUpload() {
  // In your actual file, uncomment these:
  // const [file, setFile] = useState<File | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [result, setResult] = useState<InvoiceOCRResult | null>(null);
  // const [error, setError] = useState<string | null>(null);
  
  // Placeholder for example file (remove in actual implementation):
  const [file, setFile] = [null, () => {}] as [File | null, (f: File | null) => void];
  const [loading, setLoading] = [false, () => {}] as [boolean, (l: boolean) => void];
  const [result, setResult] = [null, () => {}] as [InvoiceOCRResult | null, (r: InvoiceOCRResult | null) => void];
  const [error, setError] = [null, () => {}] as [string | null, (e: string | null) => void];

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/invoice-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'OCR processing failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Invoice
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Process Invoice'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold mb-2">OCR Result</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Supplier:</strong> {result.supplierName}</p>
            <p><strong>Invoice Number:</strong> {result.invoiceNumber}</p>
            <p><strong>Date:</strong> {result.invoiceDate}</p>
            <p><strong>Total:</strong> {result.totalAmount} {result.currency}</p>
            <p><strong>Confidence:</strong> {result.ocrConfidence}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Client Component - ROT/RUT Summary Generator
// ============================================================================

export function ROTRUTSummaryGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ROTRUTSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/rot-rut-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Anders Andersson',
          projectDescription: 'Badrumsrenovering',
          workPeriod: '2025-01-15 till 2025-03-20',
          totalAmount: 150000,
          vatAmount: 37500,
          rotAmount: 112500,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Summary generation failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate ROT/RUT Summary'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">{result.customerName}</h2>
          <p className="text-gray-700 mb-4">{result.summary}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-lg font-semibold">{result.totalAmount} SEK</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">VAT</p>
              <p className="text-lg font-semibold">{result.vatAmount} SEK</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Key Points:</h3>
            <ul className="list-disc list-inside space-y-1">
              {result.keyPoints.map((point: string, idx: number) => (
                <li key={idx} className="text-sm">{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Client Component - Project Insights
// ============================================================================

export function ProjectInsightsDisplay({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch project data first (example)
      const projectData = {
        projectName: 'Badrumsrenovering',
        currentStatus: 'Pågående',
        totalBudget: 200000,
        spent: 150000,
        startDate: '2025-01-15',
        endDate: '2025-04-30',
      };

      const response = await fetch('/api/ai/project-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate insights');
      }

      setInsights(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <button
        onClick={loadInsights}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Generate Insights
      </button>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading insights...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        {error}
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white border rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{insights.projectName}</h2>
        <p className="text-gray-600 mb-4">Status: {insights.currentStatus}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Budget Used</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${insights.budgetStatus.percentageUsed}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {insights.budgetStatus.percentageUsed}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Timeline</p>
            <p className="text-sm">
              {insights.timelineStatus.isOnTrack ? '✅ On Track' : '⚠️ Delayed'}
            </p>
          </div>
        </div>

        {insights.risks.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Risks</h3>
            <div className="space-y-2">
              {insights.risks.map((risk: string, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-md ${
                    risk.severity === 'high'
                      ? 'bg-red-50 border border-red-200'
                      : risk.severity === 'medium'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <p className="font-medium">{risk.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {risk.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Recommendations</h3>
          <ul className="list-disc list-inside space-y-1">
            {insights.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="text-sm">{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Server Component - Monthly Report
// ============================================================================

/**
 * Server Component Example
 * 
 * Usage in a server component:
 * ```tsx
 * import { generateMonthlyReport } from '@/lib/ai/frost-bygg-ai-integration';
 * 
 * export default async function MonthlyReportPage() {
 *   const report = await generateMonthlyReport({
 *     month: '2025-01',
 *     totalRevenue: 500000,
 *     totalCosts: 350000,
 *     projectsCompleted: 5,
 *     projectsActive: 3,
 *     projectDetails: [...],
 *   });
 * 
 *   return <MonthlyReportDisplay report={report} />;
 * }
 * ```
 */

// ============================================================================
// EXAMPLE 11: Error Boundary Pattern
// ============================================================================

export function AIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="ai-error-boundary">
      {children}
    </div>
  );
}

// ============================================================================
// EXAMPLE 12: Loading States Component
// ============================================================================

export function AILoadingState({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 13: Complete Invoice Processing Flow
// ============================================================================

export function CompleteInvoiceProcessingFlow() {
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'complete'>('upload');
  const [invoiceData, setInvoiceData] = useState<InvoiceOCRResult | null>(null);

  const handleFileUpload = async (file: File) => {
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/invoice-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setInvoiceData(data.data);
      setStep('review');
    } catch (error) {
      console.error('Processing failed:', error);
      setStep('upload');
    }
  };

  const handleApprove = async () => {
    // Save to database, etc.
    setStep('complete');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 'upload' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upload Invoice</h2>
          <InvoiceOCRUpload />
        </div>
      )}

      {step === 'processing' && <AILoadingState message="Analyzing invoice..." />}

      {step === 'review' && invoiceData && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Review Invoice Data</h2>
          <div className="p-6 bg-white border rounded-lg">
            {/* Display invoice data */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-semibold">{invoiceData.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-semibold">{invoiceData.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{invoiceData.invoiceDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-semibold">
                  {invoiceData.totalAmount} {invoiceData.currency}
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleApprove}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve & Save
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Re-upload
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-8">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Invoice Processed!</h2>
          <p className="text-gray-600">The invoice has been saved successfully.</p>
        </div>
      )}
    </div>
  );
}

