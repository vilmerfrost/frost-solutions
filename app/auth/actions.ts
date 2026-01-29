'use server'

import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getBaseUrlFromHeaders } from '@/utils/url'
import * as Sentry from '@sentry/nextjs'

// Typ för att hantera både FormData och JS-objekt (TypeScript-friendly)
type EmailInput = FormData | { email: string }

export async function sendMagicLink(formData: EmailInput) {
 // Hantera både FormData och plain objekt
 let email = '';
 if (typeof (formData as FormData).get === 'function') {
  email = String((formData as FormData).get('email') ?? '').trim();
 } else {
  email = String((formData as any).email ?? '').trim();
 }
 if (!email) throw new Error('Saknar e-post');

 // Use getBaseUrlFromHeaders to get the current origin (works with ngrok, localhost, production)
 const h = await headers();
 const origin = getBaseUrlFromHeaders(h);

 const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
   // Use current origin so it works with ngrok and production
   emailRedirectTo: `${origin}/auth/callback`,
  },
 });
 
 if (error) {
  Sentry.captureException(error, {
   tags: { component: 'auth', action: 'magic-link' },
   extra: { email: email.substring(0, 3) + '***' } // Partial email for debugging
  });
  throw error;
 }

 return { ok: true };
}
