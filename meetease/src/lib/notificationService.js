import { useNotificationStore } from './notificationStore'

/**
 * Service for managing event-related notifications
 */

/**
 * Calculate time until event in hours
 */
export function getHoursUntilEvent(eventDate, eventTime) {
  if (!eventDate) return null
  
  try {
    // Parse date (YYYY-MM-DD format)
    const [year, month, day] = eventDate.split('-').map(Number)
    
    // Parse time (HH:MM format)
    let hours = 0
    let minutes = 0
    if (eventTime) {
      const [h, m] = eventTime.split(':').map(Number)
      hours = h || 0
      minutes = m || 0
    }
    
    // Create event datetime
    const eventDateTime = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()
    
    // Calculate difference in milliseconds
    const diffMs = eventDateTime.getTime() - now.getTime()
    
    // Convert to hours
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return diffHours
  } catch (error) {
    console.error('Error calculating hours until event:', error)
    return null
  }
}

/**
 * Check if reminder should be sent (24h, 12h, 1h before event)
 */
export function shouldSendReminder(hoursUntil, reminderHours) {
  if (hoursUntil === null || hoursUntil < 0) return false
  
  // Send reminder if we're within the reminder window
  // e.g., for 24h reminder: send if between 24h and 23h before
  // e.g., for 12h reminder: send if between 12h and 11h before
  // e.g., for 1h reminder: send if between 1h and 0h before
  const windowSize = 0.5 // 30 minutes window
  return hoursUntil <= reminderHours && hoursUntil > (reminderHours - windowSize)
}

/**
 * Check events and send reminders
 */
export function checkEventReminders(events, userId) {
  const { addNotification, hasNotification } = useNotificationStore.getState()
  
  if (!events || events.length === 0) return
  
  events.forEach((event) => {
    if (!event.date) return
    
    const hoursUntil = getHoursUntilEvent(event.date, event.time_start)
    if (hoursUntil === null || hoursUntil < 0) return
    
    const eventName = event.name || 'Wydarzenie'
    
    // Check for 24h reminder
    if (shouldSendReminder(hoursUntil, 24)) {
      const title = `Przypomnienie: ${eventName} za 24 godziny`
      if (!hasNotification('warning', event.id, title)) {
        addNotification({
          title,
          message: `Wydarzenie "${eventName}" rozpocznie się za 24 godziny.${event.location ? ` Miejsce: ${event.location}` : ''}`,
          type: 'warning',
          eventId: event.id
        })
      }
    }
    
    // Check for 12h reminder
    if (shouldSendReminder(hoursUntil, 12)) {
      const title = `Przypomnienie: ${eventName} za 12 godzin`
      if (!hasNotification('warning', event.id, title)) {
        addNotification({
          title,
          message: `Wydarzenie "${eventName}" rozpocznie się za 12 godzin.${event.location ? ` Miejsce: ${event.location}` : ''}`,
          type: 'warning',
          eventId: event.id
        })
      }
    }
    
    // Check for 1h reminder
    if (shouldSendReminder(hoursUntil, 1)) {
      const title = `Przypomnienie: ${eventName} za 1 godzinę`
      if (!hasNotification('warning', event.id, title)) {
        addNotification({
          title,
          message: `Wydarzenie "${eventName}" rozpocznie się za 1 godzinę.${event.location ? ` Miejsce: ${event.location}` : ''}`,
          type: 'warning',
          eventId: event.id
        })
      }
    }
  })
}

/**
 * Send notification when user is added to an event
 */
export function notifyEventAdded(event, addedBy = null) {
  const { addNotification } = useNotificationStore.getState()
  
  const eventName = event.name || 'Wydarzenie'
  const addedByText = addedBy ? ` przez ${addedBy}` : ''
  
  addNotification({
    title: `Zostałeś dodany do wydarzenia`,
    message: `Zostałeś dodany do wydarzenia "${eventName}"${addedByText}.${event.date ? ` Data: ${event.date}` : ''}`,
    type: 'success',
    eventId: event.id
  })
}

/**
 * Send notification when user receives an event invitation
 */
export function notifyEventInvitation(event, senderName) {
  const { addNotification } = useNotificationStore.getState()
  
  const eventName = event.name || 'Wydarzenie'
  const senderText = senderName ? ` od ${senderName}` : ''
  
  addNotification({
    title: `Nowe zaproszenie do wydarzenia`,
    message: `Otrzymałeś zaproszenie do wydarzenia "${eventName}"${senderText}.${event.date ? ` Data: ${event.date}` : ''}`,
    type: 'info',
    eventId: event.id
  })
}

/**
 * Send notification to host when a guest accepts an invitation
 */
export function notifyHostGuestAccepted(event, guestName) {
  const { addNotification } = useNotificationStore.getState()
  
  const eventName = event.name || 'Wydarzenie'
  const guestText = guestName ? ` ${guestName}` : 'Gość'
  
  addNotification({
    title: `Gość dołączył do wydarzenia`,
    message: `${guestText} zaakceptował zaproszenie do wydarzenia "${eventName}".`,
    type: 'success',
    eventId: event.id
  })
}

/**
 * Send notification to host when a guest leaves an event
 */
export function notifyHostGuestLeft(event, guestName) {
  const { addNotification } = useNotificationStore.getState()
  
  const eventName = event.name || 'Wydarzenie'
  const guestText = guestName ? ` ${guestName}` : 'Gość'
  
  addNotification({
    title: `Gość opuścił wydarzenie`,
    message: `${guestText} opuścił wydarzenie "${eventName}".`,
    type: 'info',
    eventId: event.id
  })
}

/**
 * Check if current user is host and notify them about guest activity
 * This is called from client-side when guest accepts/leaves
 * Note: For full functionality, you'd want server-side notifications
 * that persist and can be fetched by the host when they log in
 */
export function notifyHostIfCurrentUser(event, guestName, action) {
  // This would need to check if current user is host
  // For now, we'll handle this in the components that call it
  // by checking if user.id === event.creator_id
}

