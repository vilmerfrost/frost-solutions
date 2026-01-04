import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
 try {
  const url = new URL(req.url)
  const quoteId = url.searchParams.get('quote_id')
  const tenantId = url.searchParams.get('tenant_id')
  
  if (quoteId && tenantId) {
   const admin = createAdminClient()
   await admin
    .from('quotes')
    .update({ 
     opened_at: new Date().toISOString(),
     status: 'viewed'
    })
    .eq('id', quoteId)
    .eq('tenant_id', tenantId)
    .in('status', ['sent', 'viewed'])
    .catch(() => {
     // Silent fail for tracking
    })
  }

  // Returnera 1x1 transparent GIF pixel
  const pixel = Buffer.from(
   'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
   'base64'
  )
  
  return new NextResponse(pixel, {
   headers: {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length.toString(),
    'Cache-Control': 'no-store'
   }
  })
 } catch {
  return new NextResponse(null, { status: 204 })
 }
}

