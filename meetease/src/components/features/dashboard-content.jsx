"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EventCreatorComponent from "./event-creator"
import JoinEventModal from "@/components/features/joinEventModal";
import EventDetailsModal from "@/components/events/eventDetailsModal"
import UpcomingEventsModal from "./upcoming-events-modal"
import InvitationsModal from "./invitations-modal"
import NotificationBell from "./notification-bell"
import { checkEventReminders, notifyEventInvitation } from "@/lib/notificationService"

export default function DashboardContent({ user, logout, serverActions, events = [] }) {
  const [showEventCreator, setShowEventCreator] = useState(false)
  const [showJoinEventModal, setShowJoinEventModal] = useState(false)
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false)
  const [showInvitations, setShowInvitations] = useState(false)
  const [participatingEvents, setParticipatingEvents] = useState([])
  const notifiedInvitationIdsRef = useRef(new Set())
  // const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  // const [eventsData, setEventsData] = useState(events)
  
  // Load participating events for reminders
  useEffect(() => {
    const loadParticipatingEvents = async () => {
      try {
        const result = await serverActions.handleFetchParticipatingEvents(user.id)
        if (result && result.success && result.events) {
          setParticipatingEvents(result.events)
          // Check reminders after loading
          checkEventReminders(result.events, user.id)
        }
      } catch (error) {
        console.error("Error loading participating events:", error)
      }
    }
    
    loadParticipatingEvents()
    
    // Check reminders every 5 minutes
    const interval = setInterval(async () => {
      try {
        const result = await serverActions.handleFetchParticipatingEvents(user.id)
        if (result && result.success && result.events) {
          checkEventReminders(result.events, user.id)
        }
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [user.id, serverActions])
  
  // Load pending invitations on mount to trigger notifications immediately
  useEffect(() => {
    const loadInvitationsForNotifications = async () => {
      try {
        const result = await serverActions.handleFetchPendingInvitations(user.id)
        if (result.success && result.invitations) {
          // Send notifications for new invitations immediately
          result.invitations.forEach((invitation) => {
            if (invitation.event && !notifiedInvitationIdsRef.current.has(invitation.id)) {
              const senderName = invitation.sender?.username || invitation.sender?.email || "Użytkownik"
              notifyEventInvitation(invitation.event, senderName)
              notifiedInvitationIdsRef.current.add(invitation.id)
            }
          })
        }
      } catch (error) {
        console.error("Error loading invitations for notifications:", error)
      }
    }
    loadInvitationsForNotifications()
    
    // Also check periodically for new invitations
    const interval = setInterval(() => {
      loadInvitationsForNotifications()
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [user.id, serverActions])
  
  // Update participating events when they change
  useEffect(() => {
    if (participatingEvents.length > 0) {
      checkEventReminders(participatingEvents, user.id)
    }
  }, [participatingEvents, user.id])
  
  const handleInvitationHandled = async () => {
    // Refresh upcoming events if open
    if (showUpcomingEvents) {
      // The modal will reload when it reopens, but we could trigger a refresh here if needed
    }
    // Reload participating events for reminders
    try {
      const result = await serverActions.handleFetchParticipatingEvents(user.id)
      if (result && result.success && result.events) {
        setParticipatingEvents(result.events)
      }
    } catch (error) {
      console.error("Error loading participating events:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="mb-4">Zalogowany jako: {user.username}</p>
        </div>
        <div className="flex gap-3 items-center">
          <NotificationBell userId={user.id} serverActions={serverActions} />
          <Button
              onClick={() => setShowJoinEventModal(true)}
          >
            Dołącz do wydarzenia
          </Button>
          <Button
            onClick={() => setShowUpcomingEvents(true)}
            variant="outline"
          >
            Nadchodzące
          </Button>
          <Button
            onClick={() => setShowInvitations(true)}
            variant="outline"
          >
            Zaproszenia
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">
              Ustawienia
            </Link>
          </Button>
          <Button
            onClick={() => setShowEventCreator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Stwórz Wydarzenie
          </Button>
        </div>
      </div>

      <form action={logout}>
        <Button type="submit">Wyloguj</Button>
      </form>

      <div className="flex flex-col gap-4 p-8">     
                <div className="flex flex-col py-4 gap-4 justify-center w-1/2">
                    {events && events.length > 0 && events.map((event) => (
                            <EventDetailsModal user={user} event={event} key={event.id} serverActions={serverActions}/>
                    ))}
                </div>
        </div>

      {showEventCreator && (
        <EventCreatorComponent
          user={user}
          onClose={() => setShowEventCreator(false)}
          onSubmit={serverActions.handleCreateEventServerAction}
        />
      )}

      {showJoinEventModal && (
          <JoinEventModal
              user={user}
              open={showJoinEventModal}
              onClose={() => setShowJoinEventModal(false)}
              onJoinEvent={serverActions.handleJoinEventServerAction}
          />
      )}

      {showUpcomingEvents && (
        <UpcomingEventsModal
          user={user}
          open={showUpcomingEvents}
          onClose={() => setShowUpcomingEvents(false)}
          serverActions={serverActions}
        />
      )}

      {showInvitations && (
        <InvitationsModal
          user={user}
          open={showInvitations}
          onClose={() => setShowInvitations(false)}
          serverActions={serverActions}
          onInvitationHandled={handleInvitationHandled}
        />
      )}
    </div>
  )
}

