"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import EventCreatorComponent from "./event-creator"
import { MoreVertical } from "lucide-react"
import Link from "next/link"
import JoinEventModal from "@/components/features/joinEventModal"


export default function DashboardNavbar({ user, logout, serverActions }) {
  const [showEventCreator, setShowEventCreator] = useState(false)
  const [showJoinEventModal, setShowJoinEventModal] = useState(false)

  return (
    <>
      <header className="w-full bg-[#0084FF] text-white flex items-center justify-between px-6 py-3 shadow-sm">
        {/* Logo + icon */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold tracking-tight">MeetEase</span>
          <div className="flex items-center justify-center bg-white/10 rounded-lg p-2">
            <span className="text-2xl" aria-hidden="true">
              📅
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Join button */}
          <Button
            variant="secondary"
            onClick={() => setShowJoinEventModal(true)}
            className="bg-white text-[#0084FF] rounded-full px-6 py-2 h-auto text-base hover:bg-gray-100 flex items-center gap-2"
          >
            Dołącz
            <span className="text-lg" aria-hidden="true">
              +
            </span>
          </Button>

          {/* Create button */}
          <Button
            variant="secondary"
            onClick={() => setShowEventCreator(true)}
            className="bg-white text-[#0084FF] rounded-full px-6 py-2 h-auto text-base hover:bg-gray-100 flex items-center gap-2"
          >
            Utwórz
            <span className="text-lg" aria-hidden="true">
              ✏️
            </span>
          </Button>

          {/* Notification icon */}
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0084FF] hover:bg-[#0b75d1] border border-white/40"
            aria-label="Powiadomienia"
          >
            <span className="text-xl" aria-hidden="true">
              🔔
            </span>
          </button>

          {/* Options Button - functionless */}
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0084FF] hover:bg-[#0b75d1] border border-white/40 transition-colors"
          >
            <Link href="/settings">
              <MoreVertical className="w-5 h-5 text-white" />  
            </Link>
          </button>

          {/* Logout button */}
          <form action={logout} className="m-0">
            <button
              type="submit"
              className="flex items-center gap-2 text-red-500 font-medium hover:text-red-600 bg-transparent border-none cursor-pointer"
            >
              Wyloguj się
              <span className="text-lg" aria-hidden="true">
                ↪
              </span>
            </button>
          </form>
        </div>
      </header>

      {/* Event Creator Modal */}
      {showEventCreator && (
        <EventCreatorComponent
          user={user}
          onClose={() => setShowEventCreator(false)}
          onSubmit={serverActions.handleCreateEventServerAction}
          onEditSubmit={serverActions.handleUpdateEventServerAction}
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
    </>
  )
}


