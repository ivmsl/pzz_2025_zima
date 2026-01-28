/**

 * @brief Komponent nawigacji dashboardu
 *
 * Komponent nawigacji dashboardu, pozwala na wyświetlanie nawigacji dashboardu.
 *
 * @returns {JSX.Element} Komponent nawigacji dashboardu
 * 
 * @param {Object} user - Użytkownik
 * @param {Object} logout - Funkcja do wylogowania
 * @param {Object} serverActions - Funkcje serwera
 *
 * @details
 * - Funkcja pobiera dane użytkownika za pomocą useState.
 * - Przekazuje dane do komponentu EventCreatorComponent.
 * - Przekazuje dane do komponentu JoinEventModal.
 * - Przekazuje dane do komponentu NotificationCenter.
 *
 * @see EventCreatorComponent
 * @see JoinEventModal
 * @see NotificationCenter
 * @see serverActions
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import EventCreatorComponent from "./event-creator";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import JoinEventModal from "@/components/features/joinEventModal";
import NotificationCenter from "@/components/features/notification-center";

export default function DashboardNavbar({ user, logout, serverActions }) {
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showJoinEventModal, setShowJoinEventModal] = useState(false);

  return (
    <>
      <header className="w-full bg-[#0084FF] text-white flex items-center justify-between px-6 py-3 shadow-sm">
        {/* Logo + icon */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold tracking-tight">
            MeetEase
          </span>
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

          {/* Aktywne centrum powiadomień zamiast statycznej ikony */}
          <NotificationCenter userId={user.id} serverActions={serverActions} />

          {/* Options Button */}
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
              className="flex items-center gap-2 text-white font-medium hover:text-red-200 bg-transparent border-none cursor-pointer transition-colors"
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
          userSearchFn={serverActions.handleSearchUserByUsername}
        />
      )}

      {/* Join Event Modal */}
      {showJoinEventModal && (
        <JoinEventModal
          user={user}
          open={showJoinEventModal}
          onClose={() => setShowJoinEventModal(false)}
          onJoinEvent={serverActions.handleJoinEventServerAction}
        />
      )}
    </>
  );
}
