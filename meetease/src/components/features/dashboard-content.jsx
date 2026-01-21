"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EventDetailsModal from "@/components/events/eventDetailsModal";
import UpcomingEventsModal from "./upcoming-events-modal";
import InvitationsModal from "./invitations-modal";
import EventCard from "@/components/events/eventCard";
import FriendsListModal from "./friends-modal";

export default function DashboardContent({
  user,
  logout,
  serverActions,
  events = [],
}) {
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [eventsData, setEventsData] = useState(events);
  // const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  // const [eventsData, setEventsData] = useState(events)

  const handleInvitationHandled = () => {
    // Refresh upcoming events if open
    if (showUpcomingEvents) {
      // The modal will reload when it reopens, but we could trigger a refresh here if needed
    }
  };

  return (
    <div className="p-8">
      {/* <div className="flex justify-between items-center mb-6">
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
      </form> */}

      <div className="flex flex-col gap-4 p-8">
        <div className="flex flex-col py-4 gap-4 justify-center w-1/2">
          {events &&
            events.length > 0 &&
            events.map((event) => (
              <EventCard
                user={user}
                event={event}
                key={event.id}
                serverActions={serverActions}
              />
            ))}
        </div>
      </div>

      <div className="flex-1 flex justify-end items-start pt-4 pr-8">
        <Button
          variant="outline"
          className="rounded-lg px-6 py-3 text-base"
          onClick={() => setShowFriendsList(true)}
        >
          Lista Znajomych
        </Button>
      </div>

      <Button onClick={() => setShowUpcomingEvents(true)} variant="outline">
        Nadchodzące
      </Button>
      <Button onClick={() => setShowInvitations(true)} variant="outline">
        Zaproszenia
      </Button>

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

      {showFriendsList && (
        <FriendsListModal
          user={user}
          open={showFriendsList}
          onClose={() => setShowFriendsList(false)}
          serverActions={serverActions}
        />
      )}
    </div>
  );
}
