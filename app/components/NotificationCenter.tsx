'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications'
import { useAdmin } from '@/hooks/useAdmin'
import CreateNotificationModal from './CreateNotificationModal'
import { BASE_PATH } from '@/utils/url'

interface Notification {
 id: string
 type: 'info' | 'success' | 'warning' | 'error'
 title: string
 message: string
 read: boolean
 createdAt: string
 created_at?: string // Database format
 link?: string
}

interface NotificationCenterProps {
 className?: string
}

/**
 * Notification Center Component
 * Displays a bell icon with unread count and dropdown with notifications
 */
export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [isOpen, setIsOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const router = useRouter()
 const { isAdmin } = useAdmin()

 const unreadCount = notifications.filter(n => !n.read).length

 useEffect(() => {
  // Load notifications from both localStorage and API
  loadNotifications()
  
  // Listen for notification events
  const handleNotificationAdded = () => loadNotifications()
  const handleNotificationsUpdated = () => loadNotifications()
  
  window.addEventListener('notification-added', handleNotificationAdded)
  window.addEventListener('notifications-updated', handleNotificationsUpdated)
  
  // Poll for new notifications every 30 seconds
  const interval = setInterval(() => {
   loadNotifications()
  }, 30000)

  return () => {
   clearInterval(interval)
   window.removeEventListener('notification-added', handleNotificationAdded)
   window.removeEventListener('notifications-updated', handleNotificationsUpdated)
  }
 }, [])

 async function loadNotifications() {
  try {
   // Load from localStorage (legacy support)
   const localNotifications = getNotifications()
   
   // Load from API (database)
   try {
    const response = await fetch(`${BASE_PATH}/api/notifications/list`, { cache: 'no-store' })
    if (response.ok) {
     const data = await response.json()
     const dbNotifications: Notification[] = (data.notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.created_at || n.createdAt,
      link: n.link,
     }))
     
     // Combine: database notifications first, then local ones
     // Remove duplicates by ID
     const allNotifications = [...dbNotifications, ...localNotifications]
     const uniqueNotifications = Array.from(
      new Map(allNotifications.map(n => [n.id, n])).values()
     )
     
     // Sort by date (newest first)
     uniqueNotifications.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
     })
     
     setNotifications(uniqueNotifications.slice(0, 50)) // Keep last 50
     return
    }
   } catch (apiErr) {
    console.warn('Error loading notifications from API:', apiErr)
   }
   
   // Fallback to localStorage only
   setNotifications(localNotifications)
  } catch (err) {
   console.error('Error loading notifications:', err)
  }
 }

 async function markAsRead(id: string) {
  // Try API first (for database notifications)
  try {
   const response = await fetch(`${BASE_PATH}/api/notifications/${id}/read`, {
    method: 'PATCH',
   })
   if (response.ok) {
    loadNotifications()
    return
   }
  } catch (err) {
   console.warn('Error marking notification as read via API:', err)
  }
  
  // Fallback to localStorage
  markNotificationAsRead(id)
  loadNotifications()
 }

 async function markAllAsRead() {
  // Mark all unread notifications as read
  const unread = notifications.filter(n => !n.read)
  await Promise.all(unread.map(n => markAsRead(n.id)))
  
  // Also mark localStorage notifications
  markAllNotificationsAsRead()
  loadNotifications()
 }

 function handleNotificationClick(notification: Notification) {
  markAsRead(notification.id)
  if (notification.link) {
   router.push(notification.link)
   setIsOpen(false)
  }
 }

 return (
  <div className={`relative ${className}`}>
   {/* Bell Icon */}
   <button
    onClick={() => setIsOpen(!isOpen)}
    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    aria-label="Notifications"
   >
    <svg
     className="w-6 h-6 text-gray-600 dark:text-gray-400"
     fill="none"
     stroke="currentColor"
     viewBox="0 0 24 24"
    >
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
     />
    </svg>
    {unreadCount > 0 && (
     <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
      {unreadCount > 9 ? '9+' : unreadCount}
     </span>
    )}
   </button>

   {/* Dropdown */}
   {isOpen && (
    <>
     {/* Backdrop */}
     <div
      className="fixed inset-0 z-10"
      onClick={() => setIsOpen(false)}
     />
     
     {/* Dropdown Panel */}
     <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-2xl border border-gray-200 dark:border-gray-700 z-20 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col"
        style={{ 
         maxWidth: 'min(calc(100vw - 2rem), 24rem)', 
         right: '0',
         left: 'auto'
        }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-2">
       <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
        Notifikationer {unreadCount > 0 && `(${unreadCount})`}
       </h3>
       <div className="flex items-center gap-2">
        {isAdmin && (
         <button
          onClick={() => setShowCreateModal(true)}
          className="text-sm bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:shadow-md transition-all whitespace-nowrap flex-shrink-0"
          title="Skapa notis"
         >
          + Skapa
         </button>
        )}
        {unreadCount > 0 && (
         <button
          onClick={markAllAsRead}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap flex-shrink-0"
         >
          Markera alla som lästa
         </button>
        )}
       </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
       {notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
         <p>Inga notifikationer</p>
        </div>
       ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
         {notifications.map((notification) => (
          <div
           key={notification.id}
           onClick={() => handleNotificationClick(notification)}
           className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
           }`}
          >
           <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
             notification.type === 'error' ? 'bg-red-500' :
             notification.type === 'warning' ? 'bg-yellow-500' :
             notification.type === 'success' ? 'bg-green-500' :
             'bg-blue-500'
            } ${notification.read ? 'opacity-50' : ''}`} />
            <div className="flex-1 min-w-0">
             <p className={`text-sm font-semibold ${
              notification.read
               ? 'text-gray-600 dark:text-gray-400'
               : 'text-gray-900 dark:text-white'
             }`}>
              {notification.title}
             </p>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {notification.message}
             </p>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {new Date(notification.createdAt || notification.created_at || Date.now()).toLocaleDateString('sv-SE', {
               hour: '2-digit',
               minute: '2-digit'
              })}
             </p>
            </div>
            {!notification.read && (
             <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
            )}
           </div>
          </div>
         ))}
        </div>
       )}
      </div>
     </div>
    </>
   )}
   
   {/* Create Notification Modal */}
   <CreateNotificationModal
    isOpen={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    onSuccess={() => {
     loadNotifications()
     // Dispatch event to refresh other components
     window.dispatchEvent(new CustomEvent('notifications-updated'))
    }}
   />
  </div>
 )
}

/**
 * Hook to add notifications
 */
export function useNotifications() {
 const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  const newNotification: Notification = {
   ...notification,
   id: crypto.randomUUID(),
   read: false,
   createdAt: new Date().toISOString(),
  }

  try {
   const stored = localStorage.getItem('notifications')
   const existing = stored ? JSON.parse(stored) : []
   const updated = [newNotification, ...existing].slice(0, 50) // Keep last 50
   localStorage.setItem('notifications', JSON.stringify(updated))
   
   // Dispatch custom event to notify NotificationCenter
   window.dispatchEvent(new CustomEvent('notification-added', { detail: newNotification }))
  } catch (err) {
   console.error('Error adding notification:', err)
  }
 }

 return { addNotification }
}

