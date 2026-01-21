/**
 * Pre-Launch Check Script for Frost Solutions
 * 
 * Validates that all required infrastructure is in place before launch.
 * Run with: npx tsx scripts/pre-launch-check.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface CheckResults {
  passed: number;
  failed: number;
  warnings: number;
}

async function runChecks() {
  console.log('\n🔍 FROST SOLUTIONS - PRE-LAUNCH CHECKS\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results: CheckResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // ═══════════════════════════════════════════════
  // 1. CHECK ENVIRONMENT VARIABLES
  // ═══════════════════════════════════════════════
  console.log('1️⃣  Checking Environment Variables...\n');
  
  const requiredEnvs = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: anonKey },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: serviceKey },
  ];

  const optionalEnvs = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
  ];

  for (const env of requiredEnvs) {
    if (env.value) {
      console.log(`   ✅ ${env.name}`);
      results.passed++;
    } else {
      console.log(`   ❌ ${env.name} - MISSING (required)`);
      results.failed++;
    }
  }

  for (const envName of optionalEnvs) {
    if (process.env[envName]) {
      console.log(`   ✅ ${envName}`);
      results.passed++;
    } else {
      console.log(`   ⚠️  ${envName} - not set (optional)`);
      results.warnings++;
    }
  }
  console.log('');

  // Early exit if no Supabase credentials
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Cannot proceed without Supabase credentials\n');
    printSummary(results);
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceKey);

  // ═══════════════════════════════════════════════
  // 2. CHECK SUPABASE CONNECTION
  // ═══════════════════════════════════════════════
  console.log('2️⃣  Checking Supabase Connection...\n');
  
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    if (error) throw error;
    console.log('   ✅ Supabase connected successfully');
    results.passed++;
  } catch (e: any) {
    console.log(`   ❌ Supabase connection FAILED: ${e.message}`);
    results.failed++;
  }
  console.log('');

  // ═══════════════════════════════════════════════
  // 3. CHECK REQUIRED DATABASE TABLES
  // ═══════════════════════════════════════════════
  console.log('3️⃣  Checking Database Tables...\n');
  
  const requiredTables = [
    'tenants',
    'employees',
    'projects',
    'time_entries',
    'invoices',
    'clients',
  ];

  const optionalTables = [
    'profiles',
    'quotes',
    'materials',
    'supplier_invoices',
    'work_orders',
    'schedules',
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) throw error;
      console.log(`   ✅ ${table}`);
      results.passed++;
    } catch (e: any) {
      console.log(`   ❌ ${table} - ${e.message}`);
      results.failed++;
    }
  }

  for (const table of optionalTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) throw error;
      console.log(`   ✅ ${table}`);
      results.passed++;
    } catch (e: any) {
      console.log(`   ⚠️  ${table} - not found (optional)`);
      results.warnings++;
    }
  }
  console.log('');

  // ═══════════════════════════════════════════════
  // 4. CHECK DATA STATUS
  // ═══════════════════════════════════════════════
  console.log('4️⃣  Checking Data Status...\n');

  // Check tenants
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(10);
    
    if (error) throw error;
    
    if (tenants && tenants.length > 0) {
      console.log(`   ✅ ${tenants.length} tenant(s) found`);
      results.passed++;
    } else {
      console.log('   ⚠️  No tenants yet (will be created on first signup)');
      results.warnings++;
    }
  } catch (e: any) {
    console.log(`   ❌ Could not check tenants: ${e.message}`);
    results.failed++;
  }

  // Check employees
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name')
      .limit(10);
    
    if (error) throw error;
    
    if (employees && employees.length > 0) {
      console.log(`   ✅ ${employees.length} employee(s) found`);
      results.passed++;
    } else {
      console.log('   ⚠️  No employees yet (will be created during onboarding)');
      results.warnings++;
    }
  } catch (e: any) {
    console.log(`   ❌ Could not check employees: ${e.message}`);
    results.failed++;
  }

  // Check projects
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .limit(10);
    
    if (error) throw error;
    
    if (projects && projects.length > 0) {
      console.log(`   ✅ ${projects.length} project(s) found`);
      results.passed++;
    } else {
      console.log('   ⚠️  No projects yet (will be created during onboarding)');
      results.warnings++;
    }
  } catch (e: any) {
    console.log(`   ❌ Could not check projects: ${e.message}`);
    results.failed++;
  }
  console.log('');

  // ═══════════════════════════════════════════════
  // 5. CHECK TRIAL SYSTEM
  // ═══════════════════════════════════════════════
  console.log('5️⃣  Checking Trial System...\n');
  
  try {
    // Check if profiles table has trial columns
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, trial_ends_at, subscription_status')
      .limit(5);
    
    if (error) {
      // Table might not exist or missing columns
      if (error.message.includes('trial_ends_at') || error.message.includes('subscription_status')) {
        console.log('   ⚠️  Trial columns may not exist in profiles table');
        console.log('   💡 Consider adding: trial_started_at, trial_ends_at, subscription_status');
        results.warnings++;
      } else {
        throw error;
      }
    } else if (profiles && profiles.length > 0) {
      const activeTrials = profiles.filter(p => p.subscription_status === 'trial');
      console.log(`   ✅ Trial system ready (${activeTrials.length} active trials)`);
      results.passed++;
    } else {
      console.log('   ✅ Trial system ready (no users yet)');
      results.passed++;
    }
  } catch (e: any) {
    console.log(`   ⚠️  Profiles table check: ${e.message}`);
    results.warnings++;
  }
  console.log('');

  // ═══════════════════════════════════════════════
  // 6. CHECK AUTH CONFIGURATION
  // ═══════════════════════════════════════════════
  console.log('6️⃣  Checking Auth Configuration...\n');
  
  try {
    // Try to list users (requires service role)
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
    console.log('   ✅ Auth admin access working');
    results.passed++;
  } catch (e: any) {
    if (e.message.includes('not authorized')) {
      console.log('   ⚠️  Auth admin access limited (may be normal)');
      results.warnings++;
    } else {
      console.log(`   ❌ Auth check failed: ${e.message}`);
      results.failed++;
    }
  }
  console.log('');

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  printSummary(results);
}

function printSummary(results: CheckResults) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   ✅ Passed:   ${results.passed}`);
  console.log(`   ❌ Failed:   ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL CRITICAL CHECKS PASSED!\n');
    console.log('Your app is ready for launch. Next steps:');
    console.log('  1. Run E2E tests: npx playwright test');
    console.log('  2. Deploy to Vercel: vercel');
    console.log('  3. Update website CTAs to point to /signup\n');
    process.exit(0);
  } else {
    console.log('⚠️  PLEASE FIX FAILED CHECKS BEFORE LAUNCH\n');
    console.log('Common fixes:');
    console.log('  - Missing env vars: Add to .env.local and Vercel');
    console.log('  - Missing tables: Run database migrations');
    console.log('  - Auth issues: Check Supabase dashboard settings\n');
    process.exit(1);
  }
}

// Run the checks
runChecks().catch((error) => {
  console.error('Fatal error running checks:', error);
  process.exit(1);
});
