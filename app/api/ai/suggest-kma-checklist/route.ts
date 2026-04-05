import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { callOpenRouter } from '@/lib/ai/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en svensk arbetsmiljöexpert med KMA-certifiering inom bygg- och anläggningsbranschen.
Generera en skräddarsydd KMA-checklista för det angivna projekttypen.
Inkludera riskbedömning, skyddsutrustning och branschspecifika kontroller.

Svara alltid med JSON i detta format:
{
  "items": [
    {
      "title": "string",
      "category": "Säkerhet|Miljö|Kvalitet|El|VVS|Ytskikt",
      "requiresPhoto": true/false,
      "description": "string",
      "order": number
    }
  ],
  "projectType": "string",
  "confidence": "high"
}

Ge minst 5 kontrollpunkter. Anpassa efter yrkestyp (elektriker, rörmokare, målare, snickare, etc).`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return fail(new Error('Unauthorized'), 'Ej inloggad.');
    }

    const { projectType } = await req.json();
    if (!projectType) {
      return fail(new Error('projectType saknas'), 'Projekttyp saknas.');
    }

    const result = await callOpenRouter(
      SYSTEM_PROMPT,
      `Skapa KMA-checklista för projekttyp: "${projectType}"`,
      { jsonMode: true }
    );

    return ok({ checklist: result });
  } catch (e) {
    return fail(e, 'Kunde inte generera KMA-checklista.');
  }
}
