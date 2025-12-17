import { createEvent, joinEventByCode, leaveEvent, fetchUserParticipatingEvents, fetchPendingInvitations } from "@/lib/eventService"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)
    console.log("Event created:", event)
    redirect("/dashboard")
}

async function handleJoinEventServerAction(code, userId) {
    "use server"
    const { success, error } = await joinEventByCode(code, userId)
    if (error) {
       return { success: false, error: error }
    } else {
        return { success: true, error: null }
    }
}

async function handleLeaveEventServerAction(eventId, userId) {
    "use server"
    const { success, error } = await leaveEvent(eventId, userId)
    if (error) {
       return { success: false, error: error }
    } else {
        return { success: true, error: null }
    }
}

async function handleFetchParticipatingEvents(userId) {
    "use server"
    try {
        const events = await fetchUserParticipatingEvents(userId)
        return { success: true, events, error: null }
    } catch (error) {
        console.error("Error fetching participating events:", error)
        return { success: false, events: [], error: error.message }
    }
}

async function handleFetchPendingInvitations(userId) {
    "use server"
    try {
        const invitations = await fetchPendingInvitations(userId)
        return { success: true, invitations, error: null }
    } catch (error) {
        console.error("Error fetching invitations:", error)
        return { success: false, invitations: [], error: error.message }
    }
}

async function handleAcceptInvitation(inviteId, eventId, userId) {
    "use server"
    const supabase = await createClient()
    
    try {
        // Check if user is already in users_events
        const { data: existingEntry } = await supabase
            .from("users_events")
            .select("user_id")
            .eq("user_id", userId)
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
                    user_id: userId,
                    event_id: eventId
                })
            
            if (insertError) {
                console.error("Error adding user to event:", insertError)
                return { success: false, error: insertError.message }
            }
        }
        
        return { success: true, error: null }
    } catch (error) {
        console.error("Error accepting invitation:", error)
        return { success: false, error: error.message }
    }
}

async function handleDeclineInvitation(inviteId) {
    "use server"
    const supabase = await createClient()
    
    try {
        const { error } = await supabase
            .from("invites")
            .update({ status: "declined" })
            .eq("id", inviteId)
        
        if (error) {
            console.error("Error declining invitation:", error)
            return { success: false, error: error.message }
        }
        
        return { success: true, error: null }
    } catch (error) {
        console.error("Error declining invitation:", error)
        return { success: false, error: error.message }
    }
}

const serverActions = {
    handleCreateEventServerAction,
    handleJoinEventServerAction,
    handleLeaveEventServerAction,
    handleFetchParticipatingEvents,
    handleFetchPendingInvitations,
    handleAcceptInvitation,
    handleDeclineInvitation
}
export default serverActions