import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. SÄKERHET: Kolla att anropet verkligen kommer från Vercel Cron
  // Vercel skickar automatiskt med denna header när jobbet körs.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return new NextResponse('CRON_SECRET is not configured', { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new NextResponse('Supabase is not configured', { status: 503 });
    }

    // Create the admin client lazily so the route does not crash at build time.
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. LOGIK: Hitta de som inte rapporterat tid
    // Exempel: Vi kollar vilka som inte loggat in eller uppdaterat något på 3 dagar
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Hämta profiles som har 'last_seen_at' äldre än 3 dagar (bara ett exempel)
    // Du kan byta detta mot en query i din 'time_entries' tabell senare.
    const { data: slackers, error } = await supabase
      .from('profiles')
      .select('email, first_name')
      .lt('last_seen_at', threeDaysAgo.toISOString());

    if (error) throw error;

    // 3. ACTION: Här skulle vi skicka mail med Resend
    // Just nu loggar vi bara för att se att det funkar i Vercel-loggarna.
    console.log(`Fredagskollen körd! Hittade ${slackers?.length || 0} personer att påminna.`);

    return NextResponse.json({ 
      success: true, 
      checked_count: slackers?.length || 0 
    });

  } catch (error: any) {
    console.error('Friday Panic Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}