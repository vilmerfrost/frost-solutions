// app/api/peppol/received/route.ts
// GET endpoint listing received PEPPOL invoices for the authenticated tenant
import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin();
    if (auth.error) return auth.error;

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const offset = (page - 1) * limit;

    // Fetch received PEPPOL invoices for this tenant, joined with supplier info
    const { data: invoices, error, count } = await auth.admin
      .from('supplier_invoices')
      .select('*, suppliers(id, name, org_number)', { count: 'exact' })
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'received')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[PEPPOL Received] Query error:', error);
      throw error;
    }

    return apiSuccess({
      data: invoices ?? [],
      meta: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
