import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { requirePermission, Resource, Action } from './permissions';

/**
 * Middleware wrapper for API routes that require permissions
 * 
 * @param resource - Resource to check permission for
 * @param action - Action to check permission for
 * @param handler - Handler function to execute if permission granted
 * @returns NextResponse
 */
export function withPermission(
  resource: Resource,
  action: Action,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    try {
      await requirePermission(user.id, resource, action);
      return handler(req, context);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Behörighet saknas' },
        { status: 403 }
      );
    }
  };
}

