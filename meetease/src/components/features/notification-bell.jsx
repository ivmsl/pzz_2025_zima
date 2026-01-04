"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, Trash2 } from "lucide-react"
import { useNotificationStore } from "@/lib/notificationStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scrollarea"

export default function NotificationBell({ userId, serverActions }) {
  const [isOpen, setIsOpen] = useState(false)
  const [serverNotifications, setServerNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll, getUnreadCount, addNotification } = useNotificationStore()
  
  // Fetch server-side notifications when modal opens
  useEffect(() => {
    if (isOpen && userId && serverActions) {
      loadServerNotifications()
    }
  }, [isOpen, userId, serverActions])
  
  // Also fetch on mount and periodically
  useEffect(() => {
    if (userId && serverActions) {
      loadServerNotifications()
      const interval = setInterval(() => {
        loadServerNotifications()
      }, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [userId, serverActions])
  
  const loadServerNotifications = async () => {
    if (!serverActions?.handleFetchNotifications) return
    
    setLoading(true)
    try {
      const result = await serverActions.handleFetchNotifications(userId)
      if (result.success && result.notifications) {
        setServerNotifications(result.notifications)
        
        // Add new server notifications to client store, avoiding duplicates
        const { notifications: currentNotifications } = useNotificationStore.getState()
        const existingServerIds = new Set(currentNotifications.map(n => n.serverId).filter(Boolean))
        
        result.notifications.forEach((notif) => {
          // Check if we already have this notification by serverId
          if (!existingServerIds.has(notif.id)) {
            addNotification({
              title: notif.type === 'event' ? 'Wydarzenie' : 'Powiadomienie',
              message: notif.content,
              type: 'info',
              serverId: notif.id,
              createdAt: notif.created_at
            })
            existingServerIds.add(notif.id)
          }
        })
      }
    } catch (error) {
      console.error("Error loading server notifications:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleMarkServerNotificationAsRead = async (notificationId) => {
    if (!serverActions?.handleMarkNotificationAsRead) return
    
    try {
      await serverActions.handleMarkNotificationAsRead(notificationId)
      setServerNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error("Error marking server notification as read:", error)
    }
  }
  
  const allNotifications = [...notifications]
  const unreadCount = getUnreadCount()

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return "przed chwilą"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`
    return date.toLocaleDateString("pl-PL")
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="relative p-2"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl">Powiadomienia</DialogTitle>
              <div className="flex gap-2 flex-wrap">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs whitespace-nowrap"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Oznacz wszystkie
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Wyczyść wszystkie
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            <ScrollArea className="h-full max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mb-4 opacity-50" />
                  <p>Brak powiadomień</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read ? 'bg-gray-50 opacity-75' : getTypeColor(notification.type)
                      } transition-all break-words`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm break-words">{notification.title}</h4>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-sm text-gray-700 mb-2 break-words">{notification.message}</p>
                          )}
                          <p className="text-xs text-gray-500">{formatTime(notification.createdAt)}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                markAsRead(notification.id)
                                // Also mark server notification as read if it exists
                                if (notification.serverId && serverActions?.handleMarkNotificationAsRead) {
                                  handleMarkServerNotificationAsRead(notification.serverId)
                                }
                              }}
                              className="h-6 w-6 p-0"
                              aria-label="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              removeNotification(notification.id)
                              // Also mark server notification as read if it exists
                              if (notification.serverId && serverActions?.handleMarkNotificationAsRead) {
                                handleMarkServerNotificationAsRead(notification.serverId)
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            aria-label="Remove notification"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

