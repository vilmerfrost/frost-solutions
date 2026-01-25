import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { documentType, documentVersion, acceptanceMethod } = body

    // Validation
    const validTypes = ['terms', 'privacy', 'dpa', 'sla']
    if (!validTypes.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    if (!documentVersion?.match(/^v\d+\.\d+$/)) {
      return NextResponse.json({ error: 'Invalid version format' }, { status: 400 })
    }

    // Get IP and User Agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Get tenant_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .maybeSingle()

    // Insert acceptance (upsert to handle duplicates)
    const { data, error } = await supabase
      .from('legal_acceptances')
      .upsert({
        user_id: session.user.id,
        tenant_id: profile?.tenant_id || null,
        document_type: documentType,
        document_version: documentVersion,
        ip_address: ip,
        user_agent: userAgent,
        acceptance_method: acceptanceMethod || 'api',
        accepted_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,document_type,document_version',
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging acceptance:', error)
      return NextResponse.json({ error: 'Failed to log acceptance' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
    
  } catch (error: any) {
    console.error('Error in accept endpoint:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
