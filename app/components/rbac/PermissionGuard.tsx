'use client';

import { ReactNode } from 'react';
import { useCan, Resource, Action } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
 resource: Resource;
 action: Action;
 children: ReactNode;
 fallback?: ReactNode;
}

/**
 * Component that only renders children if user has permission
 */
export function PermissionGuard({
 resource,
 action,
 children,
 fallback = null,
}: PermissionGuardProps) {
 const { can, isLoading } = useCan(resource, action);

 if (isLoading) {
  // Returnerar en diskret laddningsspinner
  return (
   <div className="inline-flex items-center justify-center">
    <Loader2 className="w-4 h-4 animate-spin" />
   </div>
  );
 }

 if (!can) {
  return <>{fallback}</>;
 }

 return <>{children}</>;
}

