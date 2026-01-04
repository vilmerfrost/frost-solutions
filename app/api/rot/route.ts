// app/api/rot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';
import { resolveRotPercent, calcRot } from '@/lib/rot/calc';
import { buildSkatteverketXml } from '@/lib/rot/xml';
import { decryptPnr } from '@/lib/crypto/pnr';

const RotInput = z.object({
 invoiceId: z.string().uuid(),
 laborAmountSEK: z.number().positive(),
 materialAmountSEK: z.number().nonnegative().default(0),
 travelAmountSEK: z.number().nonnegative().default(0),
 customerPnrEnc: z.string(), // krypterat i DB eller inkommande
 projectAddress: z.string().optional(),
});

export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoice_id');

  if (invoiceId) {
   // Get ROT deduction for specific invoice
   const { data: rot, error } = await admin
    .schema('app')
    .from('rot_deductions')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

   if (error) {
    throw error;
   }

   return NextResponse.json({ success: true, data: rot });
  }

  // Get all ROT deductions for tenant
  const { data: rotList, error } = await admin
   .schema('app')
   .from('rot_deductions')
   .select('*')
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false });

  if (error) {
   throw error;
  }

  return NextResponse.json({ success: true, data: rotList || [] });
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  );
 }
}

export async function POST(req: NextRequest) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant' }, { status: 401 });
  }

  const input = RotInput.parse(await req.json());
  const admin = createAdminClient();

  const { data: inv } = await admin
   .from('invoices')
   .select('id, number, issue_date, tenant_id, customer_id')
   .eq('id', input.invoiceId)
   .eq('tenant_id', tenantId)
   .maybeSingle();

  if (!inv) {
   return NextResponse.json({ error: 'Faktura saknas' }, { status: 404 });
  }

  const percent = resolveRotPercent(inv.issue_date);
  const deduction = calcRot(input.laborAmountSEK, percent);
  const pnr = await decryptPnr(input.customerPnrEnc);

  const xml = buildSkatteverketXml({
   orgNumber: process.env.COMPANY_ORG_NUMBER || '',
   personalIdentityNoDecrypted: pnr,
   invoiceNumber: inv.number,
   invoiceDate: inv.issue_date,
   laborAmountSEK: input.laborAmountSEK,
   deductionAmountSEK: deduction,
   projectAddress: input.projectAddress,
  });

  const { data: rot, error } = await admin
   .schema('app')
   .from('rot_deductions')
   .insert({
    tenant_id: tenantId,
    invoice_id: inv.id,
    rot_percentage: percent,
    labor_amount_sek: input.laborAmountSEK,
    material_amount_sek: input.materialAmountSEK,
    travel_amount_sek: input.travelAmountSEK,
    deduction_amount_sek: deduction,
    xml_payload: xml,
    status: 'queued',
   } as any)
   .select()
   .single();

  if (error) {
   throw error;
  }

  await admin.schema('app').from('rot_deduction_history').insert({
   tenant_id: tenantId,
   rot_id: rot.id,
   action: 'created',
   meta: { percent, deduction },
  } as any);

  return NextResponse.json({ success: true, data: rot });
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) },
   { status: 500 }
  );
 }
}
