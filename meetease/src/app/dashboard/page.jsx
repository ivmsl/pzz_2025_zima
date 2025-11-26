import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import EventDetailsModal from "@/components/events/eventDetailsModal"
import DashboardContent from "@/components/features/dashboard-content"


export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const logout = async () => {
        "use server"
        const serverSupabase = await createClient()

        await serverSupabase.auth.signOut()
        redirect("/")
    }

    if (!user) {
        redirect("/")
    }
    return (
        <>
            <div className="p-8">
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <p className="mb-4">Zalogowany jako: {user.email}</p>

                <form action={logout}>
                    <Button type="submit">Wyloguj</Button>
                </form>

            </div>
            <EventDetailsModal user={user}/>
            <DashboardContent user={user} logout={logout} />
        </>
    )
}
