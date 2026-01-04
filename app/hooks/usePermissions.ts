'use client';

import { useQuery } from '@tanstack/react-query';
import supabase from '@/utils/supabase/supabaseClient';
import { useTenant } from '@/context/TenantContext';

export type Role = 'super_admin' | 'admin' | 'manager' | 'employee' | 'client';
export type Resource = 'projects' | 'invoices' | 'employees' | 'time_entries' | 'clients' | '*';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

interface Permission {
 resource: Resource;
 action: Action;
}

/**
 * Hook to get current user's role and permissions
 */
export function usePermissions() {
 const { tenantId } = useTenant();

 return useQuery({
  queryKey: ['permissions', tenantId],
  queryFn: async () => {
   const { data: { user } } = await supabase.auth.getUser();
   if (!user || !tenantId) {
    return { role: 'employee' as Role, permissions: [] as Permission[] };
   }

   const response = await fetch(`/api/rbac/permissions?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
   });

   if (!response.ok) {
    throw new Error('Failed to fetch permissions');
   }

   const result = await response.json();
   return {
    role: result.role as Role,
    permissions: result.permissions as Permission[],
   };
  },
  enabled: !!tenantId,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
 });
}

/**
 * Hook to check if user can perform action on resource
 */
export function useCan(resource: Resource, action: Action) {
 const { data: permissionsData, isLoading } = usePermissions();

 if (!permissionsData) {
  return { can: false, isLoading: isLoading };
 }

 const { role, permissions } = permissionsData;

 // Super admin can do everything
 if (role === 'super_admin') {
  return { can: true, isLoading: false };
 }

 // Check if user has specific permission
 const hasPermission = permissions.some(
  (p) =>
   (p.resource === resource && p.action === action) ||
   (p.resource === '*' && p.action === 'manage')
 );

 return { can: hasPermission, isLoading: false };
}
