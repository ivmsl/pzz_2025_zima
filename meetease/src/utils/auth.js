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

    if (user.user_metadata?.username) {
        try {
            await supabase
                .from("profiles")
                .update({
                    username: user.user_metadata.username,
                    email: user.email
                })
                .eq("id", user.id)
        } catch (error) {
            console.error("Failed to sync profile username:", error)
        }
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

