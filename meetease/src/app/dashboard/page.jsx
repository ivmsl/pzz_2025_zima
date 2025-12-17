import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"
// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardContent from "@/components/features/dashboard-content"
// import { createEvent, joinEventByCode } from "@/lib/eventService"
// import { redirect } from "next/navigation"
import EventDetailsModal from "@/components/events/eventDetailsModal"
import serverActions from "@/lib/serverActions"



export default async function DashboardPage() {
    const { supabase, user, logout } = await getAuthenticatedUser()
    const events = await fetchEventsByUserId(user.id) || []
    console.log("Events:", events)

    // Fetch user profile to get username
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user.id)
        .maybeSingle()

    const username = profile?.username ?? user.user_metadata?.username ?? user.email ?? "Użytkownik"
    const userWithProfile = {
        ...user,
        username,
        email: profile?.email ?? user.email ?? ""
    }

    return (
        <>
            <DashboardContent user={userWithProfile} logout={logout} serverActions={serverActions} events={events} />

           
            {/* <EventDetailsModal user={user}/> */}
        </>
    )
}
