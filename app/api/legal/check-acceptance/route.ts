import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const CURRENT_VERSIONS = {
  terms: 'v1.0',
  privacy: 'v1.0',
  dpa: 'v1.0',
  sla: 'v1.0',
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentType = searchParams.get('type') || 'terms'

    if (!CURRENT_VERSIONS[documentType as keyof typeof CURRENT_VERSIONS]) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Check if user has accepted current version
    const { data: acceptance } = await supabase
      .from('legal_acceptances')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('document_type', documentType)
      .eq('document_version', CURRENT_VERSIONS[documentType as keyof typeof CURRENT_VERSIONS])
      .maybeSingle()

    return NextResponse.json({
      hasAccepted: !!acceptance,
      acceptance: acceptance,
      currentVersion: CURRENT_VERSIONS[documentType as keyof typeof CURRENT_VERSIONS],
    })
    
  } catch (error: any) {
    console.error('Error checking acceptance:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
