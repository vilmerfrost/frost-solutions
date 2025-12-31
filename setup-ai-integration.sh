#!/bin/bash
# 🚀 FROST BYGG AI INTEGRATION SETUP SCRIPT
# One-command setup for AI integration

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 FROST BYGG AI INTEGRATION SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Step 1: Creating API routes...${NC}"

# Create API routes directory structure
mkdir -p app/api/ai/invoice-ocr
mkdir -p app/api/ai/delivery-note-ocr
mkdir -p app/api/ai/receipt-ocr
mkdir -p app/api/ai/rot-rut-summary
mkdir -p app/api/ai/project-insights
mkdir -p app/api/ai/validate-payroll
mkdir -p app/api/ai/monthly-report

# Invoice OCR Route
cat > app/api/ai/invoice-ocr/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceOCR } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';

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
EOF

# Delivery Note OCR Route
cat > app/api/ai/delivery-note-ocr/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { processDeliveryNoteOCR } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';

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
    const result = await processDeliveryNoteOCR(buffer, file.name);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delivery note OCR error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
EOF

# ROT/RUT Summary Route
cat > app/api/ai/rot-rut-summary/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { generateROTRUTSummary } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('ROT/RUT summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
EOF

echo -e "${GREEN}✅ Step 2: Checking environment variables...${NC}"

# Check .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating template...${NC}"
    touch .env.local
fi

# Check if API keys are set
if ! grep -q "GEMINI_API_KEY=" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not found in .env.local${NC}"
    echo -e "${YELLOW}   Add: GEMINI_API_KEY=your_key_here${NC}"
fi

if ! grep -q "GROQ_API_KEY=" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  GROQ_API_KEY not found in .env.local${NC}"
    echo -e "${YELLOW}   Add: GROQ_API_KEY=your_key_here${NC}"
fi

echo ""
echo -e "${GREEN}✅ Step 3: Verifying files...${NC}"

# Check if main integration file exists
if [ ! -f "app/lib/ai/frost-bygg-ai-integration.ts" ]; then
    echo -e "${RED}❌ Error: frost-bygg-ai-integration.ts not found${NC}"
    echo -e "${YELLOW}   Make sure the AI integration library is in place${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All API routes created successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Add API keys to .env.local:"
echo "   GEMINI_API_KEY=your_gemini_key"
echo "   GROQ_API_KEY=your_groq_key"
echo ""
echo "2. Get free API keys:"
echo "   Gemini: https://makersuite.google.com/app/apikey"
echo "   Groq:   https://console.groq.com/"
echo ""
echo "3. Restart dev server:"
echo "   pnpm dev"
echo ""
echo "4. Test the integration:"
echo "   POST /api/ai/invoice-ocr"
echo "   POST /api/ai/rot-rut-summary"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup complete!${NC}"

