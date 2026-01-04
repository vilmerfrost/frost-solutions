import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL; // sätt i .env

export async function POST(req: Request) {
 // Enkel Origin/Referer-kontroll (grundläggande CSRF-skydd)
 // I development, tillåt localhost på alla portar för att hantera olika enheter
 const origin = req.headers.get('origin') || req.headers.get('referer') || '';
 
 if (ORIGIN && !origin.startsWith(ORIGIN)) {
  // I development, tillåt localhost på alla portar
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.');
  
  if (!isDevelopment || !isLocalhost) {
   console.error('Invalid origin:', { origin, ORIGIN, isDevelopment, isLocalhost });
   return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
 }

 const { access_token, refresh_token } = await req.json();
 if (!access_token || !refresh_token) {
  return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
 }

 const res = NextResponse.json({ ok: true });
 const base = { 
  httpOnly: true, 
  sameSite: 'lax' as const, 
  secure: isProd, 
  path: '/',
  // Ensure cookies are available immediately
  domain: undefined // Don't restrict domain
 };

 // Kort livslängd för access, längre för refresh
 // CRITICAL: Set cookies with explicit options to ensure they work
 res.cookies.set('sb-access-token', access_token, { 
  ...base, 
  maxAge: 60 * 60,
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
 });
 res.cookies.set('sb-refresh-token', refresh_token, { 
  ...base, 
  maxAge: 60 * 60 * 24 * 7,
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
 });
 
 // Also set SameSite=None if needed for cross-site (but we're same-site, so lax is fine)
 return res;
}

export async function DELETE() {
 const res = NextResponse.json({ ok: true });
 const base = { httpOnly: true, sameSite: 'lax' as const, secure: true, path: '/' };
 res.cookies.set('sb-access-token', '', { ...base, maxAge: 0 });
 res.cookies.set('sb-refresh-token', '', { ...base, maxAge: 0 });
 return res;
}
