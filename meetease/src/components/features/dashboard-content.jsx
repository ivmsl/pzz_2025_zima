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

  const updateDashboardContent = async () => {
    const events = await serverActions.handleFetchEventsByUserId(user.id);
    setEventsData(events);
  }

  return (
    <div className="grid grid-cols-12 gap-6 p-2">
      <div className="col-span-8">
        <div className="flex flex-col gap-4 p-8">
          <div className="flex flex-col py-4 gap-4 justify-center">
            {eventsData &&
              eventsData.length > 0 &&
              eventsData.map((event) => (
                <EventCard
                  user={user}
                  event={event}
                  key={event.id}
                  serverActions={serverActions}
                />
              ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Button onClick={updateDashboardContent} variant="outline" className="rounded-3xl px-20 py-6 text-xl">
            Odśwież wydarzenia
          </Button>
        </div>
        
      </div>

      <div className="col-span-4">
        <div className="flex justify-end pr-8 pt-6">
          <div className="flex flex-col gap-6">
          <Button
            variant="outline"
            className="rounded-3xl px-20 py-6 text-xl"
            onClick={() => setShowFriendsList(true)}
          >
            Lista Znajomych
          </Button>
          <Button onClick={() => setShowUpcomingEvents(true)} variant="outline" className="rounded-3xl px-20 py-6 text-xl">
            Nadchodzące
          </Button>
          <Button onClick={() => setShowInvitations(true)} variant="outline" className="rounded-3xl px-20 py-6 text-xl">
            Zaproszenia
          </Button>
          </div>
        </div>
      </div>

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
