import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
 try {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json({ userId: user.id, email: user.email })
 } catch (error: any) {
  console.error('Error fetching user:', error)
  return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 })
 }
}

