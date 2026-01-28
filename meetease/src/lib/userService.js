import { getAuthenticatedUser } from "@/utils/auth"
import { createClient } from "@/utils/supabase/server"

/**
 * Pobiera oczekujące zaproszenia do wydarzeń dla zalogowanego użytkownika (odbiorcy).
 * Wewnętrznie: pobiera z invites rekordy receiver_id = user.id, status = "pending",
 * dla każdego dopisuje dane wydarzenia (events), profil nadawcy (profiles) i nazwę twórcy wydarzenia.
 * @returns {Promise<Array>} - Tablica obiektów zaproszeń z polami event, sender, creatorUsername
 */
export async function fetchPendingInvitations() {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Fetch invitations
    const { data: invitations, error: invitationsError } = await supabase
        .from("invites")
        .select("id, event_id, sender_id, receiver_id, status")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
    
    if (invitationsError || !invitations || invitations.length === 0) {
        return []
    }
    
    // Fetch event details, sender profiles, and creator usernames
    const invitationsWithDetails = await Promise.all(
        invitations.map(async (invitation) => {
            // Fetch event
            const { data: event } = await supabase
                .from("events")
                .select("id, name, date, time_start, time_end, location, description, creator_id")
                .eq("id", invitation.event_id)
                .single()
            
            // Fetch sender profile
            const { data: senderProfile } = await supabase
                .from("profiles")
                .select("username, email")
                .eq("id", invitation.sender_id)
                .single()
            
            // Fetch creator username if event exists
            let creatorUsername = null
            if (event?.creator_id) {
                const { data: creatorProfile } = await supabase
                    .from("profiles")
                    .select("username, email")
                    .eq("id", event.creator_id)
                    .single()
                
                creatorUsername = creatorProfile?.username || creatorProfile?.email || "Nieznany"
            }
            
            return {
                ...invitation,
                sender: senderProfile || { username: "Unknown", email: "" },
                event: event ? {
                    ...event,
                    creatorUsername
                } : null
            }
        })
    )
    
    return invitationsWithDetails
}

/**
 * Akceptuje zaproszenie do wydarzenia: ustawia status zaproszenia na "accepted"
 * i dodaje użytkownika do users_events (jeśli jeszcze tam nie ma).
 * @param {string} inviteId - Identyfikator zaproszenia
 * @param {string} eventId - Identyfikator wydarzenia
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function acceptPendingInvitation(inviteId, eventId) {
    const { supabase, user } = await getAuthenticatedUser()
    
    // Check if user is already in users_events
    const { data: existingEntry } = await supabase
        .from("users_events")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .maybeSingle()
    
    // Update invitation status to accepted
    const { error: updateError } = await supabase
        .from("invites")
        .update({ status: "accepted" })
        .eq("id", inviteId)
    
    if (updateError) {
        console.error("Error updating invitation:", updateError)
        return { success: false, error: updateError.message }
    }
    
    // Add user to users_events table only if not already there
    if (!existingEntry) {
        const { error: insertError } = await supabase
            .from("users_events")
            .insert({
                user_id: user.id,
                event_id: eventId
            })
        
        if (insertError) {
            console.error("Error adding user to event:", insertError)
            return { success: false, error: insertError.message }
        }
    }
    
    return { success: true, error: null }
}

/**
 * Odrzuca zaproszenie do wydarzenia: ustawia status zaproszenia na "declined".
 * Nie dodaje użytkownika do uczestników wydarzenia.
 * @param {string} inviteId - Identyfikator zaproszenia do odrzucenia
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function declinePendingInvitation(inviteId) {
    const { supabase, _ } = await getAuthenticatedUser()
    const { error } = await supabase
            .from("invites")
            .update({ status: "declined" })
            .eq("id", inviteId)
        
        if (error) {
            console.error("Error declining invitation:", error)
            return { success: false, error: error.message }
        }
        return { success: true, error: null }

}

/**
 * Anuluje zaproszenie (np. przez twórcę wydarzenia): ustawia status zaproszenia na "canceled".
 * @param {string} inviteId - Identyfikator zaproszenia do anulowania
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function cacnelPendingInvitation(inviteId) {
    const { supabase, _ } = await getAuthenticatedUser()
    const { error } = await supabase
            .from("invites")
            .update({ status: "canceled" })
            .eq("id", inviteId)
        
    if (error) {
        console.error("Error canceling invitation:", error)
        return { success: false, error: error.message }
    }
    return { success: true, error: null }
}

/**
 * Wyszukuje użytkowników po nazwie użytkownika (username, dopasowanie częściowe, bez rozróżniania wielkości liter).
 * Pusta lub tylko białe znaki fraza zwraca []. Maksymalnie 10 wyników z tabeli profiles.
 * @param {string} searchQuery - Fraza do wyszukania (np. fragment username)
 * @returns {Promise<Array>} - Tablica obiektów użytkowników (id, username, email) lub [] przy błędzie; rzuca przy błędzie zapytania
 */
export async function searchUsersByUsername(searchQuery) {
    if (!searchQuery || searchQuery.trim().length < 1) {
        return []
    }

    console.log("searchQuery", searchQuery);
    
    const supabase = await createClient()
    const query = searchQuery.trim()
    
    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .ilike("username", `%${query}%`)
        .limit(10)
    
    if (error) {
        console.error("Error searching users:", error)
        throw new Error("Error searching users")
    }
    
    return users || []
}

/**
 * Pobiera listę użytkowników z profili (id, username, email), posortowaną po username rosnąco.
 * Ograniczenie do 100 rekordów. Przy błędzie zwraca pustą tablicę.
 * @returns {Promise<Array>} - Tablica obiektów użytkowników lub []
 */
export async function fetchAllUsers() {
    const supabase = await createClient()
    
    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .order("username", { ascending: true })
        .limit(100) // Limit to prevent too many results
    
    if (error) {
        console.error("Error fetching users:", error)
        return []
    }
    
    return users || []
}