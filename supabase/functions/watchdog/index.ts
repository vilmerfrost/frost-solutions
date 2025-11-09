// supabase/functions/watchdog/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Watchdog] 🔍 Checking for stuck jobs...');

    // Delete locks for stuck jobs
    // First, find stuck jobs
    const { data: stuckJobs } = await supabase
      .from('sync_jobs')
      .select('id')
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (stuckJobs && stuckJobs.length > 0) {
      const stuckJobIds = stuckJobs.map((j: any) => j.id);

      // Delete locks for stuck jobs
      await supabase
        .from('resource_locks')
        .delete()
        .in('job_id', stuckJobIds);

      console.log(`[Watchdog] 🗑️ Deleted ${stuckJobIds.length} stuck locks`);
    }

    // Reset stuck jobs
    const { error: updateError } = await supabase
      .from('sync_jobs')
      .update({
        status: 'pending',
        last_error: 'Sync timed out, reset by watchdog.',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (updateError) {
      console.error('[Watchdog] ❌ Failed to reset stuck jobs:', updateError);
      throw updateError;
    }

    console.log('[Watchdog] ✅ Watchdog completed successfully');

    return new Response(
      JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[Watchdog] ❌ FATAL ERROR:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

