"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import EventCreatorComponent from "./event-creator"
import JoinEventModal from "@/components/features/joinEventModal";

export default function DashboardContent({ user, logout, handleEventSubmit }) {
  const [showEventCreator, setShowEventCreator] = useState(false)
  const [showJoinEventModal, setShowJoinEventModal] = useState(false)
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="mb-4">Zalogowany jako: {user.email}</p>
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

      {showEventCreator && (
        <EventCreatorComponent
          user={user}
          onClose={() => setShowEventCreator(false)}
          onSubmit={handleEventSubmit}
        />
      )}

      {showJoinEventModal && (
          <JoinEventModal
              open={showJoinEventModal}
              onClose={() => setShowJoinEventModal(false)}
              onSubmit={handleEventSubmit}
          />
      )}
    </div>
  )
}

