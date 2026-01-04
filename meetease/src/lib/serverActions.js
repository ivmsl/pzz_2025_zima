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
    const supabase = await createClient()
    
    try {
        // Get event_id from code first
        const { data: eventCode } = await supabase
            .from("event_codes")
            .select("event_id")
            .eq("code", code)
            .single()
        
        if (!eventCode) {
            return { success: false, error: "Nieprawidłowy kod wydarzenia" }
        }
        
        // Fetch event info to get creator_id
        const { data: event } = await supabase
            .from("events")
            .select("id, name, creator_id")
            .eq("id", eventCode.event_id)
            .single()
        
        // Fetch user info (guest who is joining)
        const { data: guestProfile } = await supabase
            .from("profiles")
            .select("username, email")
            .eq("id", userId)
            .maybeSingle()
        
        const guestName = guestProfile?.username || guestProfile?.email || "Gość"
        
        // Join the event
        const { success, error } = await joinEventByCode(code, userId)
        if (error) {
            return { success: false, error: error }
        }
        
        // Create notification for host if host is different from guest
        if (event && event.creator_id && event.creator_id !== userId) {
            const notificationContent = `${guestName} dołączył do wydarzenia "${event.name}" używając kodu.`
            await supabase
                .from("notifications")
                .insert({
                    user_id: event.creator_id,
                    type: "event",
                    content: notificationContent,
                    read: false
                })
        }
        
        return { 
            success: true, 
            error: null,
            event: event || null,
            guestName: guestName
        }
    } catch (error) {
        console.error("Error joining event:", error)
        return { success: false, error: error.message }
    }
}

async function handleLeaveEventServerAction(eventId, userId) {
    "use server"
    const supabase = await createClient()
    
    try {
        // Fetch event info to get creator_id before leaving
        const { data: event } = await supabase
            .from("events")
            .select("id, name, creator_id")
            .eq("id", eventId)
            .single()
        
        // Fetch user info (guest who is leaving)
        const { data: guestProfile } = await supabase
            .from("profiles")
            .select("username, email")
            .eq("id", userId)
            .maybeSingle()
        
        const guestName = guestProfile?.username || guestProfile?.email || "Gość"
        
        // Leave the event
        const { success, error } = await leaveEvent(eventId, userId)
        if (error) {
            return { success: false, error: error }
        }
        
        // Create notification for host if host is different from guest
        if (event && event.creator_id && event.creator_id !== userId) {
            const notificationContent = `${guestName} opuścił wydarzenie "${event.name}".`
            await supabase
                .from("notifications")
                .insert({
                    user_id: event.creator_id,
                    type: "event",
                    content: notificationContent,
                    read: false
                })
        }
        
        return { 
            success: true, 
            error: null,
            event: event || null,
            guestName: guestName
        }
    } catch (error) {
        console.error("Error leaving event:", error)
        return { success: false, error: error.message }
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
        // Fetch event info to get creator_id
        const { data: event } = await supabase
            .from("events")
            .select("id, name, creator_id")
            .eq("id", eventId)
            .single()
        
        // Fetch user info (guest who is accepting)
        const { data: guestProfile } = await supabase
            .from("profiles")
            .select("username, email")
            .eq("id", userId)
            .maybeSingle()
        
        const guestName = guestProfile?.username || guestProfile?.email || "Gość"
        
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
            
            // Create notification for host if host is different from guest
            if (event && event.creator_id && event.creator_id !== userId) {
                const notificationContent = `${guestName} zaakceptował zaproszenie do wydarzenia "${event.name}".`
                await supabase
                    .from("notifications")
                    .insert({
                        user_id: event.creator_id,
                        type: "event",
                        content: notificationContent,
                        read: false
                    })
            }
        }
        
        return { 
            success: true, 
            error: null,
            event: event || null,
            guestName: guestName
        }
    } catch (error) {
        console.error("Error accepting invitation:", error)
        return { success: false, error: error.message }
    }
}

async function handleFetchNotifications(userId) {
    "use server"
    const supabase = await createClient()
    
    try {
        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("read", false)
            .order("created_at", { ascending: false })
            .limit(50)
        
        if (error) {
            console.error("Error fetching notifications:", error)
            return { success: false, notifications: [], error: error.message }
        }
        
        return { success: true, notifications: notifications || [], error: null }
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return { success: false, notifications: [], error: error.message }
    }
}

async function handleMarkNotificationAsRead(notificationId) {
    "use server"
    const supabase = await createClient()
    
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId)
        
        if (error) {
            console.error("Error marking notification as read:", error)
            return { success: false, error: error.message }
        }
        
        return { success: true, error: null }
    } catch (error) {
        console.error("Error marking notification as read:", error)
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
    handleDeclineInvitation,
    handleFetchNotifications,
    handleMarkNotificationAsRead
}
export default serverActions