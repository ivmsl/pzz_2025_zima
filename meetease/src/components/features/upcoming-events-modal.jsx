"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import EventDetailsModal from "@/components/events/eventDetailsModal"
import { Button } from "@/components/ui/button"
import EventCard from "@/components/events/eventCard"
import { formatDate, formatTime } from "@/lib/utils"

export default function UpcomingEventsModal({ user, open, onClose, serverActions }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadEvents()
    }
  }, [open])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const result = await serverActions.handleFetchParticipatingEvents(user.id)
      if (result && result.success) {
        setEvents(Array.isArray(result.events) ? result.events : [])
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error("Error loading events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Nadchodzące</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8 px-6">
            <p className="text-gray-500">Ładowanie wydarzeń...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex justify-center items-center py-8 px-6">
            <p className="text-gray-500">Brak nadchodzących wydarzeń</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <div className="flex flex-col gap-4 py-4">
              {events && events.length > 0 && events.map((event) => (
                <EventCard user={user} event={event} serverActions={serverActions} key={event.id || Math.random()} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

