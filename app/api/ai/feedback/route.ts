/**
 * AI Chat Feedback API
 * Stores user feedback on AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const body = await req.json();
    const { conversationId, messageId, rating, reason, feedbackText } = body;

    if (!rating || !['positive', 'negative'].includes(rating)) {
      return NextResponse.json({ error: 'Rating must be "positive" or "negative"' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('ai_chat_feedback')
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId || null,
        message_id: messageId || null,
        rating,
        reason: reason || null,
        feedback_text: feedbackText || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: data }, { status: 201 });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ 
      error: extractErrorMessage(error) || 'Kunde inte spara feedback'
    }, { status: 500 });
  }
}

