// app/lib/notifications.ts

/**
 * Notification utilities for localStorage-based notifications
 * These functions handle client-side notification storage and management
 * 
 * SECURITY: All localStorage keys are tenant-scoped to prevent cross-tenant data leakage
 */

interface Notification {
 id: string;
 type: 'info' | 'success' | 'warning' | 'error';
 title: string;
 message: string;
 read: boolean;
 createdAt: string;
 link?: string;
}

const STORAGE_KEY_PREFIX = 'notifications_tenant_';
const MAX_NOTIFICATIONS = 50;

/**
 * Gets the tenant-scoped storage key
 * Falls back to a session-specific key if no tenant ID is available
 */
function getStorageKey(): string {
 try {
  // Try to get tenant ID from localStorage (set by TenantContext)
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) {
   return `${STORAGE_KEY_PREFIX}${tenantId}`;
  }
  // Fallback: use session storage key (cleared on browser close)
  const sessionKey = sessionStorage.getItem('notification_session_key');
  if (sessionKey) {
   return `notifications_session_${sessionKey}`;
  }
  // Create new session key
  const newSessionKey = crypto.randomUUID();
  sessionStorage.setItem('notification_session_key', newSessionKey);
  return `notifications_session_${newSessionKey}`;
 } catch {
  // If all else fails, use a random key (won't persist)
  return `notifications_temp_${Date.now()}`;
 }
}

/**
 * Clears notifications for the current tenant (call on logout)
 */
export function clearTenantNotifications(): void {
 try {
  const key = getStorageKey();
  localStorage.removeItem(key);
 } catch (error) {
  console.error('Error clearing tenant notifications:', error);
 }
}

/**
 * Gets all notifications from localStorage (tenant-scoped)
 * @returns Array of notifications
 */
export function getNotifications(): Notification[] {
 try {
  const key = getStorageKey();
  const stored = localStorage.getItem(key);
  if (!stored) {
   return [];
  }
  const notifications = JSON.parse(stored) as Notification[];
  return notifications || [];
 } catch (error) {
  console.error('Error reading notifications from localStorage:', error);
  return [];
 }
}

/**
 * Saves notifications to localStorage (tenant-scoped)
 * @param notifications Array of notifications to save
 */
function saveNotifications(notifications: Notification[]): void {
 try {
  const key = getStorageKey();
  // Keep only the last MAX_NOTIFICATIONS
  const toSave = notifications.slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(key, JSON.stringify(toSave));
 } catch (error) {
  console.error('Error saving notifications to localStorage:', error);
 }
}

/**
 * Marks a notification as read
 * @param id Notification ID to mark as read
 */
export function markNotificationAsRead(id: string): void {
 try {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
   n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('notifications-updated'));
 } catch (error) {
  console.error('Error marking notification as read:', error);
 }
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsAsRead(): void {
 try {
  const notifications = getNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('notifications-updated'));
 } catch (error) {
  console.error('Error marking all notifications as read:', error);
 }
}

/**
 * Adds a new notification to localStorage
 * @param notification Notification data (without id, read, createdAt)
 */
export function addNotification(
 notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
): void {
 try {
  const newNotification: Notification = {
   ...notification,
   id: crypto.randomUUID(),
   read: false,
   createdAt: new Date().toISOString(),
  };

  const existing = getNotifications();
  const updated = [newNotification, ...existing].slice(0, MAX_NOTIFICATIONS);
  saveNotifications(updated);
  
  // Dispatch event to notify NotificationCenter
  window.dispatchEvent(
   new CustomEvent('notification-added', { detail: newNotification })
  );
 } catch (error) {
  console.error('Error adding notification:', error);
 }
}

/**
 * Removes a notification by ID
 * @param id Notification ID to remove
 */
export function removeNotification(id: string): void {
 try {
  const notifications = getNotifications();
  const updated = notifications.filter((n) => n.id !== id);
  saveNotifications(updated);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('notifications-updated'));
 } catch (error) {
  console.error('Error removing notification:', error);
 }
}

/**
 * Clears all notifications for current tenant
 */
export function clearAllNotifications(): void {
 try {
  const key = getStorageKey();
  localStorage.removeItem(key);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('notifications-updated'));
 } catch (error) {
  console.error('Error clearing notifications:', error);
 }
}


