import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import DashboardContent from "@/components/features/dashboard-content"
import { createEvent, updateEvent, deleteEvent, leaveEvent } from "@/lib/eventService"
import { redirect } from "next/navigation"
import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardNavbar from "@/components/features/dashboard-navbar"


async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)
    console.log("Event created:", event)
    redirect("/dashboard")
}

async function handleUpdateEventServerAction(eventId, eventData) {
    "use server"
    const { user } = await getAuthenticatedUser()
    const event = await updateEvent(eventId, eventData, user.id)
    console.log("Event updated:", event)
    redirect("/dashboard")
}

async function handleDeleteEventServerAction(eventId) {
    "use server"
    const { user } = await getAuthenticatedUser()
    await deleteEvent(eventId, user.id)
    console.log("Event deleted:", eventId)
    redirect("/dashboard")
}

async function handleLeaveEventServerAction(eventId) {
    "use server"
    const { user } = await getAuthenticatedUser()
    await leaveEvent(eventId, user.id)
    console.log("Left event:", eventId)
    redirect("/dashboard")
}

export default async function DashboardPage() {
    const { supabase, user } = await getAuthenticatedUser()
    const events = await fetchEventsByUserId(user.id)
    console.log("Events:", events)

    return (
        <main className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Top navbar */}
            <DashboardNavbar user={user} logout={logout} handleEventSubmit={handleCreateEventServerAction} />

            {/* Content area */}
            <section className="flex-1 overflow-hidden">
                <div className="flex gap-4 p-8 h-full">
                    {/* Left side - Events */}
                    <div className="flex flex-col gap-4 w-1/2 h-full overflow-y-auto pr-2">
                        {events.map((event) => (
                            <EventDetailsModal 
                                user={user} 
                                event={event} 
                                key={event.id}
                                handleEventUpdate={handleUpdateEventServerAction}
                                handleEventDelete={handleDeleteEventServerAction}
                                handleEventLeave={handleLeaveEventServerAction}
                            />
                        ))}
                    </div>
                    
                    {/* Right side - Friends List Button */}
                    <div className="flex-1 flex justify-end items-start pt-4 pr-8">
                        <Button
                            variant="outline"
                            className="rounded-lg px-6 py-3 text-base"
                        >
                            Lista Znajomych
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    )
}
