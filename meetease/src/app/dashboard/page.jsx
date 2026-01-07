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

export default async function DashboardPage() {
    const { user } = await getAuthenticatedUser()
    const events = await fetchEventsByUserId(user.id) || []

    console.log("Events:", events)


    return (
        <>
            <DashboardNavbar user={user} logout={logout} serverActions={serverActions} />
            <DashboardContent user={user} logout={logout} serverActions={serverActions} events={events} />
        </>

       
    )
}
