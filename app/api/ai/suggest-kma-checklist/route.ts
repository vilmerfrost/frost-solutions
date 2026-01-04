// app/api/ai/suggest-kma-checklist/route.ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { templateKMA } from '@/lib/ai/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
  const { projectType } = await req.json();
  if (!projectType) {
   return fail(new Error('projectType saknas'), 'Projekttyp saknas.');
  }

  const out = templateKMA(String(projectType));
  return ok({ checklist: out });
 } catch (e) {
  return fail(e, 'Kunde inte generera KMA-checklista.');
 }
}

