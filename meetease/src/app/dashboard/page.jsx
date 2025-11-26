import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardContent from "@/components/features/dashboard-content"
// import { Link } from "lucide-react"
import { createEvent } from "@/lib/eventService"
import { redirect } from "next/navigation"


async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)
    console.log("Event created:", event)
    redirect("/dashboard")
}

export default async function DashboardPage() {
    const { supabase, user, logout } = await getAuthenticatedUser()
    
    const events = await fetchEventsByUserId(user.id)
    return (
        <>
            <DashboardContent user={user} logout={logout} handleEventSubmit={handleCreateEventServerAction} />

            <div className="flex flex-col gap-4 p-8">
                {events.map((event) => (
                    <Link href={`/event/${String(event.id)}`} key={event.id}>
                        <div className="text-xl font-bold underline cursor-pointer">{event.name}</div>
                    </Link>
                ))}
            </div>
            
            {/* <EventDetailsModal user={user}/> */}
        </>
    )
}
