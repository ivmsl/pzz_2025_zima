import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"

// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardContent from "@/components/features/dashboard-content"
// import { createEvent, joinEventByCode } from "@/lib/eventService"
// import { redirect } from "next/navigation"
import serverActions from "@/lib/serverActions"
import DashboardNavbar from "@/components/features/dashboard-navbar"



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
        <>
            <DashboardNavbar user={user} logout={logout} serverActions={serverActions} />
            <DashboardContent user={user} logout={logout} serverActions={serverActions} events={events} />

           
            {/* <EventDetailsModal user={user}/> */}
        </>

        // <main className="h-screen bg-white flex flex-col overflow-hidden">
        //     {/* Top navbar */}
        //     <DashboardNavbar user={user} logout={logout} serverActions={serverActions} />

        //     {/* Content area */}
        //     <section className="flex-1 overflow-hidden">
        //         <div className="flex gap-4 p-8 h-full">
        //             {/* Left side - Events */}
        //             <div className="flex flex-col gap-4 w-1/2 h-full overflow-y-auto pr-2">
        //                 {events.map((event) => (
        //                     <EventDetailsModal 
        //                         user={user} 
        //                         event={event} 
        //                         key={event.id}
        //                         handleEventUpdate={handleUpdateEventServerAction}
        //                         handleEventDelete={handleDeleteEventServerAction}
        //                         handleEventLeave={handleLeaveEventServerAction}
        //                     />
        //                 ))}
        //             </div>
                    
        //             {/* Right side - Friends List Button */}
                    
        //         </div>
        //     </section>
        // </main>

    )
}
