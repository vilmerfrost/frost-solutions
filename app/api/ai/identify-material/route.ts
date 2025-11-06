// app/api/ai/identify-material/route.ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { hfClassifyImageBase64 } from '@/lib/ai/huggingface';
import { createAdminClient } from '@/utils/supabase/admin';
import { templateMaterial } from '@/lib/ai/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return fail(new Error('Ingen tenant hittades'), 'Kunde inte identifiera organisation.');
    }

    const { imageBase64 } = await req.json(); // alternativ: { imageUrl }
    if (!imageBase64) {
      return fail(new Error('imageBase64 saknas'), 'Bild saknas.');
    }

    let top = { label: 'okänd', score: 0 };

    try {
      const hf = await hfClassifyImageBase64(imageBase64);
      if (hf?.length) {
        top = hf.sort((a, b) => b.score - a.score)[0];
      }
    } catch (error) {
      // fall through till template
      console.error('Hugging Face error:', error);
    }

    const admin = createAdminClient();
    let supplierItems: any[] = [];

    try {
      // Om du har tabellen supplier_items: försök matcha labelen
      const { data } = await admin
        .from('supplier_items')
        .select('id, name, price, supplier')
        .ilike('name', `%${top.label}%`)
        .eq('tenant_id', tenantId)
        .limit(5);

      supplierItems = data ?? [];
    } catch (error) {
      // ignore if table missing
      console.warn('supplier_items table not found or error:', error);
    }

    const result =
      top.score > 0
        ? {
            name: top.label,
            confidence: Math.round(top.score * 100),
            category: top.label.split(',')[0] ?? 'okänd',
            supplierItems,
            alternatives: [],
          }
        : templateMaterial('okänt material');

    return ok({ material: result, model: top.score > 0 ? 'huggingface' : 'template' });
  } catch (e) {
    return fail(e, 'Kunde inte identifiera material.');
  }
}

