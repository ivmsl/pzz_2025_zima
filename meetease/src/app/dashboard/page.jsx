import { getAuthenticatedUser, logout } from "@/utils/auth"
import { fetchEventsByUserId } from "@/lib/eventService"

import DashboardContent from "@/components/features/dashboard-content"
import serverActions from "@/lib/serverActions"
import DashboardNavbar from "@/components/features/dashboard-navbar"

export default async function DashboardPage() {
    const { user } = await getAuthenticatedUser()
    const events = await fetchEventsByUserId(user.id) || []


    return (
        <>
            <DashboardNavbar user={user} logout={logout} serverActions={serverActions} />
            <DashboardContent user={user} logout={logout} serverActions={serverActions} events={events} />
        </>

       
    )
}
