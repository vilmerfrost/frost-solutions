// app/lib/notifications-server.ts

/**
 * Server-side notification utilities
 * These functions insert notifications into the database
 * Separate from client-side notifications.ts to avoid bundling issues
 */

/**
 * Server-side function to send ROT notification to a specific user
 * This function inserts a notification into the database
 * @param userId - The auth user ID to send notification to
 * @param tenantId - The tenant ID
 * @param type - Notification type ('approved' | 'rejected' | 'status_update')
 * @param rotApplicationId - The ROT application ID
 * @param message - The notification message
 * @param createdBy - The user ID who created/triggered this notification
 */
export async function sendRotNotification(
 userId: string,
 tenantId: string,
 type: 'approved' | 'rejected' | 'status_update',
 rotApplicationId: string,
 message: string,
 createdBy?: string
): Promise<void> {
 try {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
   console.error('Missing Supabase configuration for sendRotNotification');
   return;
  }
  
  const adminSupabase = createClient(supabaseUrl, serviceKey);
  
  const notificationType = type === 'approved' ? 'success' : type === 'rejected' ? 'error' : 'info';
  
  const { error } = await adminSupabase
   .from('notifications')
   .insert({
    tenant_id: tenantId,
    recipient_id: userId,
    type: notificationType,
    title: 'ROT-ansökan uppdaterad',
    message: message,
    link: `/rot/${rotApplicationId}`,
    created_by: createdBy || userId, // Use provided creator or recipient as fallback
   });
  
  if (error) {
   console.error('Error sending ROT notification:', error);
  }
 } catch (error) {
  console.error('Error in sendRotNotification:', error);
 }
}

