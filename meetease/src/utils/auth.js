/**
 * Narzędzia autentykacji: pobieranie zalogowanego użytkownika i klienta Supabase,
 * wylogowanie (Server Action) oraz opcjonalna synchronizacja username z user_metadata do profiles.
 */
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

/**
 * Zwraca zalogowanego użytkownika i klienta Supabase. Przy braku sesji przekierowuje na stronę główną (/).
 * Jeśli user.user_metadata.username jest ustawione, aktualizuje profil w tabeli profiles (username, email).
 * @returns {Promise<{supabase: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User}>}
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
 * Wylogowuje użytkownika (Server Action): wywołuje signOut na kliencie Supabase i przekierowuje na /.
 * @returns {Promise<void>} - Nie zwraca (redirect przerywa wykonanie)
 */
export async function logout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
}

