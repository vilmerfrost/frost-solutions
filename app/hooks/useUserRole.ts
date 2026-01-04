// app/hooks/useUserRole.ts

'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import type { Role } from '@/lib/work-order-state-machine';

/**
 * Hook för att hämta användarens roll (admin, manager, employee)
 * Använder API route för att få roll från employees tabell
 */
export function useUserRole() {
 const { tenantId } = useTenant();
 const [userRole, setUserRole] = useState<Role>('employee');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function fetchRole() {
   if (!tenantId) {
    setLoading(false);
    setUserRole('employee');
    return;
   }

   try {
    const res = await fetch('/api/admin/check', { cache: 'no-store' });
    if (res.ok) {
     const data = await res.json();
     const role = data.role as string | undefined;
     
     if (role === 'admin' || role === 'Admin') {
      setUserRole('admin');
     } else if (role === 'manager' || role === 'Manager') {
      setUserRole('manager');
     } else {
      setUserRole('employee');
     }
    } else {
     setUserRole('employee');
    }
   } catch (err) {
    console.error('Error fetching user role:', err);
    setUserRole('employee');
   } finally {
    setLoading(false);
   }
  }

  fetchRole();
 }, [tenantId]);

 return { userRole, loading };
}
