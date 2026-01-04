import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    // Check for duplicates based on serverId, or title+message+eventId combination
    const state = useNotificationStore.getState()
    const isDuplicate = state.notifications.some(n => {
      // If both have serverId, check by serverId
      if (notification.serverId && n.serverId) {
        return n.serverId === notification.serverId
      }
      // Otherwise check by title, message, and eventId
      return n.title === notification.title &&
             n.message === notification.message &&
             n.eventId === notification.eventId &&
             !n.read &&
             // Only consider duplicates if created within last 5 minutes
             (new Date() - new Date(n.createdAt)) < 5 * 60 * 1000
    })
    
    if (isDuplicate) {
      return null // Don't add duplicate
    }
    
    const newNotification = {
      id: Date.now() + Math.random(),
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info', // 'info', 'success', 'warning', 'error'
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
      eventId: notification.eventId || null,
      serverId: notification.serverId || null,
      ...notification
    }
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications]
    }))
    
    return newNotification.id
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    }))
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({
        ...notif,
        read: true
      }))
    }))
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== id)
    }))
  },
  
  clearAll: () => {
    set({ notifications: [] })
  },
  
  getUnreadCount: () => {
    return useNotificationStore.getState().notifications.filter(n => !n.read).length
  },
  
  // Check if notification already exists (to prevent duplicates)
  hasNotification: (type, eventId, title) => {
    const state = useNotificationStore.getState()
    return state.notifications.some(notif => 
      notif.type === type && 
      notif.eventId === eventId && 
      notif.title === title &&
      !notif.read
    )
  }
}))

