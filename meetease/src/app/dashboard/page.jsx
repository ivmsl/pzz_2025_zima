import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
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

    return <DashboardContent user={user} logout={logout} />
}