// app/lib/guards/noClientDb.ts
/**
 * Guard för att blockera direkta Supabase DB-anrop från klienten
 */
const BLOCKED_TABLES = new Set([
  'time_entries',
  'invoices',
  'projects',
  'employees',
  'clients',
]);

export function guardClientDbCall(table: string): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  if (BLOCKED_TABLES.has(table)) {
    const error = new Error(
      `[DB-GUARD] 🚨 Client-side Supabase.from("${table}") is blocked!\n` +
      `Use an API route instead: /api/${table}/...\n` +
      `Check the stack trace below to find the exact component.`
    );

    console.error('🚨 [DB-GUARD] Blocked DB call:', {
      table,
      stack: error.stack,
    });

    throw error;
  }
}

