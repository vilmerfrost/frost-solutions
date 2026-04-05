import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { callOpenRouterVision } from '@/lib/ai/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en erfaren bygginköpare i Sverige med djup kunskap om byggmaterial.
Identifiera byggmaterialet på bilden. Svara alltid med JSON i detta format:
{
  "name": "materialets namn på svenska",
  "confidence": 0-100,
  "category": "Trä|Betong|Stål|Isolering|VVS|El|Ytskikt|Tätskikt|Fästelement|Övrigt",
  "estimatedUnit": "st|m|m2|m3|kg|förpackning",
  "commonSuppliers": ["Byggmax", "Beijer", etc],
  "alternatives": [{"name": "alternativt material", "confidence": 0-100}]
}

Om bilden inte visar byggmaterial, ange confidence < 20 och category "Övrigt".`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return fail(new Error('Ingen tenant'), 'Kunde inte identifiera organisation.');
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return fail(new Error('imageBase64 saknas'), 'Bild saknas.');
    }

    const result = await callOpenRouterVision(
      SYSTEM_PROMPT,
      'Identifiera byggmaterialet på denna bild.',
      imageBase64,
      { jsonMode: true }
    );

    return ok({ material: result, model: 'gemini' });
  } catch (e) {
    return fail(e, 'Kunde inte identifiera material.');
  }
}
