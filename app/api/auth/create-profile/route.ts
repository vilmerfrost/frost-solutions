import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa användarprofil med trial-info under signup
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { userId, fullName, email, trialStartedAt, trialEndsAt, subscriptionStatus } = await req.json()

  if (!userId) {
   return NextResponse.json(
    { error: 'userId is required' },
    { status: 400 }
   )
  }

  // Använd service role för att kringgå RLS
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' },
    { status: 500 }
   )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Check if profiles table exists and create profile
  const profilePayload: Record<string, any> = {
   id: userId,
  }

  // Add optional fields if provided
  if (fullName) profilePayload.full_name = fullName
  if (email) profilePayload.email = email
  if (trialStartedAt) profilePayload.trial_started_at = trialStartedAt
  if (trialEndsAt) profilePayload.trial_ends_at = trialEndsAt
  if (subscriptionStatus) profilePayload.subscription_status = subscriptionStatus

  // Try to upsert the profile
  const result = await supabase
   .from('profiles')
   .upsert([profilePayload], { onConflict: 'id' })
   .select()
   .single()

  if (result.error) {
   // If the table doesn't exist or columns are missing, log but don't fail
   console.warn('Could not create profile:', result.error.message)
   
   // Try a minimal insert without trial fields
   const minimalResult = await supabase
    .from('profiles')
    .upsert([{
     id: userId,
     full_name: fullName || null,
     email: email || null,
    }], { onConflict: 'id' })
    .select()
    .single()

   if (minimalResult.error) {
    console.warn('Minimal profile creation also failed:', minimalResult.error.message)
    // Return success anyway - the user can still proceed
    return NextResponse.json({
     success: false,
     message: 'Profile table may not exist or have expected columns',
     error: result.error.message
    })
   }

   return NextResponse.json({
    success: true,
    profile: minimalResult.data,
    note: 'Created without trial fields'
   })
  }

  return NextResponse.json({
   success: true,
   profile: result.data
  })

 } catch (err: any) {
  console.error('Error in create-profile API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}
