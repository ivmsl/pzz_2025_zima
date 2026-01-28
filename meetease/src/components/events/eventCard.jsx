/**

 * @brief Komponent karty wydarzenia
 *
 * Komponent karty wydarzenia, pozwala na wyświetlanie danych o wydarzeniu w malym formacie.
 *
 * @returns {JSX.Element} Komponent karty wydarzenia
 * 
 * @param {Object} user - Użytkownik
 * @param {Object} event - Wydarzenie
 * @param {Object} serverActions - Funkcje serwera
 *
 * @details
 * - jest wykorzystywany w EventDetailsModal.jsx
 * - Funkcja pobiera dane użytkownika za pomocą useState.
 * - Przekazuje dane do komponentu EventDetailsModal.
 *
 * @see EventDetailsModal
 * @see formatDate
 * @see formatTime
 * @see serverActions
 */

"use client"

import EventDetailsModal from "@/components/events/eventDetailsModal"
import { formatDate, formatTime } from "@/lib/timeUtils"

export default function EventCard({ user, event, serverActions }) {

    return (
        <div
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
            <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6z"/>
                        </svg>
                        <span>
                          {formatDate(event.date)}
                          {event.time_start && `, ${formatTime(event.time_start)}`}
                          {event.time_end && ` - ${formatTime(event.time_end)}`}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 7.35q3.05-2.8 4.525-5.087T18 10.2q0-2.725-1.737-4.462T12 4T7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22m0-12"/>
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-gray-500">Organizator: </span>
                        <span className="font-medium">
                          {event.creator_id === user.id ? "Ty" : (event.creatorUsername || "Nieznany")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <EventDetailsModal user={user} event={event} serverActions={serverActions} />
                    </div>
                  </div>
                </div>
            </div>
    )

}