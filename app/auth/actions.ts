'use server'

import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getBaseUrlFromHeaders } from '@/utils/url'

// Typ för att hantera både FormData och JS-objekt (TypeScript-friendly)
type EmailInput = FormData | { email: string }

export async function sendMagicLink(formData: EmailInput) {
 // Debug-logg! Kolla vad som faktiskt kommer in hit
 console.log('formData:', formData);

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
 if (error) throw error;

 return { ok: true };
}
