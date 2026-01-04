// app/lib/notifications.ts

/**
 * Notification utilities for localStorage-based notifications
 * These functions handle client-side notification storage and management
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

const STORAGE_KEY = 'notifications';
const MAX_NOTIFICATIONS = 50;

/**
 * Gets all notifications from localStorage
 * @returns Array of notifications
 */
export function getNotifications(): Notification[] {
 try {
  const stored = localStorage.getItem(STORAGE_KEY);
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
 * Saves notifications to localStorage
 * @param notifications Array of notifications to save
 */
function saveNotifications(notifications: Notification[]): void {
 try {
  // Keep only the last MAX_NOTIFICATIONS
  const toSave = notifications.slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
 * Clears all notifications
 */
export function clearAllNotifications(): void {
 try {
  localStorage.removeItem(STORAGE_KEY);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('notifications-updated'));
 } catch (error) {
  console.error('Error clearing notifications:', error);
 }
}


