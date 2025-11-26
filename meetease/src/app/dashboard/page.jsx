import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
// import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardContent from "@/components/features/dashboard-content"
import { createEvent } from "@/lib/eventService"
import { redirect } from "next/navigation"
import EventDetailsModal from "@/components/events/eventDetailsModal"


async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)
    console.log("Event created:", event)
    redirect("/dashboard")
}

export default async function DashboardPage() {
    const { supabase, user, logout } = await getAuthenticatedUser()
    const events = await fetchEventsByUserId(user.id)
    console.log("Events:", events)

    return (
        <>
            <DashboardContent user={user} logout={logout} handleEventSubmit={handleCreateEventServerAction} />

            <div className="flex flex-col gap-4 p-8">
                
                <div className="flex flex-col py-4 gap-4 justify-center w-1/2">
                    {events.map((event) => (
                            <EventDetailsModal user={user} event={event} key={event.id}/>
                    ))}
                </div>
                
            </div>
            {/* <EventDetailsModal user={user}/> */}
        </>
    )
}
