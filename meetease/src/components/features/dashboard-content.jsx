"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EventCreatorComponent from "./event-creator"
import JoinEventModal from "@/components/features/joinEventModal";
import EventDetailsModal from "@/components/events/eventDetailsModal"

export default function DashboardContent({ user, logout, serverActions, events = [] }) {
  const [showEventCreator, setShowEventCreator] = useState(false)
  const [showJoinEventModal, setShowJoinEventModal] = useState(false)
  // const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  // const [eventsData, setEventsData] = useState(events)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="mb-4">Zalogowany jako: {user.username}</p>
        </div>
        <div className="flex gap-3">
          <Button
              onClick={() => setShowJoinEventModal(true)}
          >
            Dołącz do wydarzenia
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
                    {events.map((event) => (
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
    </div>
  )
}

