"use server"

import { createClient } from "@/utils/supabase/server"
import { getAuthenticatedUser } from "@/utils/auth"


// /**
//  * Fetch events user is participating in (from users_events table) and events created by user
//  * @param {string} userId - The user ID
//  * @returns {Promise<Array>} - Array of event objects
//  */
// export async function fetchUserParticipatingEvents(userId) {
//     const supabase = await createClient()
    
//     // Get event IDs from users_events (events user is attending)
//     const { data: userEvents, error: userEventsError } = await supabase
//         .from("users_events")
//         .select("event_id")
//         .eq("user_id", userId)
    
//     let eventIds = []
//     if (!userEventsError && userEvents) {
//         eventIds = userEvents.map(ue => ue.event_id)
//     }
    
//     // Also get events created by the user
//     const { data: createdEvents, error: createdEventsError } = await supabase
//         .from("events")
//         .select("id")
//         .eq("creator_id", userId)
    
//     if (!createdEventsError && createdEvents) {
//         const createdEventIds = createdEvents.map(e => e.id)
//         // Combine both lists and remove duplicates
//         eventIds = [...new Set([...eventIds, ...createdEventIds])]
//     }
    
//     if (eventIds.length === 0) {
//         return []
//     }
    
//     // Fetch all event details
//     const { data: events, error: eventsError } = await supabase
//         .from("events")
//         .select("*")
//         .in("id", eventIds)
//         .order("date", { ascending: true })
    
//     if (eventsError || !events) {
//         console.error("Error fetching participating events:", eventsError)
//         return []
//     }
    
//     // Fetch creator usernames for events where user is not the creator
//     const eventsWithCreators = await Promise.all(
//         events.map(async (event) => {
//             if (event.creator_id === userId) {
//                 return event // User is creator, no need to fetch
//             }
            
//             const { data: creatorProfile } = await supabase
//                 .from("profiles")
//                 .select("username, email")
//                 .eq("id", event.creator_id)
//                 .single()
            
//             return {
//                 ...event,
//                 creatorUsername: creatorProfile?.username || creatorProfile?.email || "Nieznany"
//             }
//         })
//     )
    
//     return eventsWithCreators || []
// }
