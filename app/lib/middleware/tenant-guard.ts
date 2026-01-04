// app/lib/middleware/tenant-guard.ts
import { createAdminClient } from '@/utils/supabase/admin';
import { AuthorizationError } from '@/lib/utils/errors';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TenantGuard');

/**
 * Verify tenant access for a resource
 * Ensures multi-tenant isolation
 */
export async function verifyTenantAccess(
 tenantId: string,
 resourceId: string,
 resourceTable: string,
 resourceTenantColumn: string = 'tenant_id'
): Promise<boolean> {
 const admin = createAdminClient();

 const { data, error } = await admin
  .schema('app')
  .from(resourceTable)
  .select(resourceTenantColumn)
  .eq('id', resourceId)
  .eq(resourceTenantColumn, tenantId)
  .maybeSingle();

 if (error) {
  logger.error('Failed to verify tenant access', error);
  return false;
 }

 return !!data;
}

/**
 * Guard function to ensure tenant isolation
 */
export async function requireTenantAccess(
 tenantId: string,
 resourceId: string,
 resourceTable: string
): Promise<void> {
 const hasAccess = await verifyTenantAccess(tenantId, resourceId, resourceTable);

 if (!hasAccess) {
  throw new AuthorizationError('Access denied to resource', {
   tenantId,
   resourceId,
   resourceTable,
  });
 }
}

