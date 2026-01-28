/**
 * @brief Strona dashboardu użytkownika
 *
 * Asynchroniczna funkcja komponentu strony dashboardu.
 * Pobiera uwierzytelnionego użytkownika oraz powiązane z nim wydarzenia i wyświetla nawigację oraz zawartość dashboardu.
 *
 * @returns {JSX.Element} Zawartość strony dashboardu — Navbar i Content
 *
 * @details
 * - Funkcja pobiera dane użytkownika za pomocą getAuthenticatedUser.
 * - Pobiera listę wydarzeń użytkownika przez fetchEventsByUserId.
 * - Przekazuje dane do komponentów DashboardNavbar oraz DashboardContent.
 *
 * @see getAuthenticatedUser
 * @see fetchEventsByUserId
 * @see DashboardNavbar
 * @see DashboardContent
 * @see serverActions
 */
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
