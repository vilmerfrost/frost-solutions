// app/lib/queryInvalidation.ts
/**
 * Centraliserad query invalidation för dashboard och time entries
 * Används för att synka data mellan komponenter när mutations sker
 */
import { queryClient } from './queryClient';

/**
 * Invalidera alla dashboard-relaterade queries
 */
export const invalidateDashboardData = async (reason?: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 [Query Invalidation] Invalidating dashboard data:', reason || 'manual');
  }

  // Invalida alla dashboard-relaterade queries
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
    queryClient.invalidateQueries({ queryKey: ['projects'] }),
    queryClient.invalidateQueries({ queryKey: ['active-time-entry'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
  ]);

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ [Query Invalidation] Dashboard invalidation complete');
  }
};

/**
 * Invalidera time entries queries
 */
export const invalidateTimeEntries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
    queryClient.invalidateQueries({ queryKey: ['active-time-entry'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] }),
  ]);
};

/**
 * Invalidera projekt-relaterade queries
 */
export const invalidateProjects = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['projects'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] }),
  ]);
};

