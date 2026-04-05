import { NextResponse } from 'next/server'
import { CONTRACT_TEMPLATES } from '@/lib/ata/contract-templates'

/**
 * GET /api/contracts/templates
 * List available contract templates — public reference data, no auth required.
 */
export async function GET() {
  const templates = CONTRACT_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    standard: t.standard,
    description: t.description,
    sectionCount: t.sections.length,
  }))

  return NextResponse.json({ success: true, data: templates })
}
