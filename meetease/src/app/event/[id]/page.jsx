import { getAuthenticatedUser } from "@/utils/auth"
import { ScrollArea } from "@/components/ui/scrollarea"
import {
    fetchEvent,
    checkEventAccess,
    fetchEventAttendees,
    parseEventDateTime,
} from "@/lib/eventService"
import { defaultEvent, defaultAttendees } from "@/lib/defaults"

export default async function EventPage({ params }) {
    const { supabase, user } = await getAuthenticatedUser()
    
    const { id } = await params
    const eventId = id

    // Fetch event data
    let event = await fetchEvent(eventId)

    if (!event) {
        event = defaultEvent
    }

    // Check if user has access to the event
    const hasAccess = await checkEventAccess(user.id, eventId, event.creator_id)

    // if (!hasAccess) {
    //     redirect("/dashboard")
    // }

    // Fetch attendees
    let attendees = await fetchEventAttendees(eventId, event.creator_id)

    if (!attendees) {
        attendees = defaultAttendees
    }

    // Parse event date and time
    const { eventDate, eventTime } = parseEventDateTime(event)

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="border-b border-black pb-4 mb-6">
                    <h1 className="text-center text-3xl font-bold">{event.name}</h1>
                </div>

                {/* Event Details */}
                <div className="flex flex-col gap-6">
                    {/* Date and Time */}
                    <div className="flex flex-col gap-2 text-lg">
                        <div className="flex gap-2 items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6z"
                                />
                            </svg>
                            <span>
                                {eventDate && eventTime
                                    ? `${eventDate}, ${eventTime}`
                                    : event.date || "Brak daty"}
                            </span>
                        </div>

                        {/* Location */}
                        {event.location && (
                            <div className="flex gap-2 items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 7.35q3.05-2.8 4.525-5.087T18 10.2q0-2.725-1.737-4.462T12 4T7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22m0-12"
                                    />
                                </svg>
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="mt-2">
                            <p className="text-gray-700">{event.description}</p>
                        </div>
                    )}

                    {/* Attendees */}
                    <div className="mt-4">
                        <h4 className="text-xl font-semibold mb-3">Uczestnicy:</h4>
                        <ScrollArea className="max-h-64 rounded-md border border-gray-200 p-4">
                            <div className="flex flex-col gap-2">
                                {attendees.length > 0 ? (
                                    attendees.map((attendee) => (
                                        <div key={attendee.id} className="text-sm">
                                           <b>{attendee.username}</b> <i>{attendee.email}</i>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Brak uczestników
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-black pt-4 mt-6 flex justify-between items-center">
                        {event.creator_id === user.id && (
                            <span className="text-blue-500 cursor-pointer hover:text-blue-700">
                                Edytuj wydarzenie
                            </span>
                        )}
                        <span className="text-red-500 cursor-pointer hover:text-red-700">
                            Opuść wydarzenie
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

