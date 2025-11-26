import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

/**
 * Gets the authenticated user and Supabase client.
 * Redirects to home page if user is not authenticated.
 * 
 * @returns {Promise<{supabase: SupabaseClient, user: User}>}
 */
export async function getAuthenticatedUser() {
    const supabase = await createClient()
    
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/")
    }

    return { supabase, user }
}

/**
 * Creates a logout server action.
 * 
 * @returns {Promise<void>}
 */
export async function logout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
}

