"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import EventCreatorComponent from "./event-creator"

export default function DashboardContent({ user, logout }) {
  const [showEventCreator, setShowEventCreator] = useState(false)

  const handleEventSubmit = (eventData) => {
    console.log("Event created:", eventData)
    // TODO: Add API call to save event to database
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="mb-4">Zalogowany jako: {user.email}</p>
        </div>
        <Button
          onClick={() => setShowEventCreator(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Stwórz Wydarzenie
        </Button>
      </div>

      <form action={logout}>
        <Button type="submit">Wyloguj</Button>
      </form>

      {showEventCreator && (
        <EventCreatorComponent
          onClose={() => setShowEventCreator(false)}
          onSubmit={handleEventSubmit}
        />
      )}
    </div>
  )
}

