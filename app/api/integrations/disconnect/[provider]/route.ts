import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> | { provider: string } }
) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const provider = params.provider;

    if (!['fortnox', 'visma', 'visma_eaccounting'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from('integrations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('provider', provider);

    if (error) {
      console.error('[Disconnect] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Disconnect] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
