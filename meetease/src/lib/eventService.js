import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/utils/auth"
import { cacnelPendingInvitation } from "./userService"
import { fetchEventVotes } from "./voteService"

/**
 * Check if user has access to an event
 * @param {string} userId - The user ID
 * @param {string} eventId - The event ID
 * @param {string} creatorId - The event creator ID
 * @returns {Promise<boolean>} - True if user has access
 */
export async function checkEventAccess(userId, eventId, creatorId) {
    const supabase = await createClient()
    
    // Check if user is the creator
    const isCreator = creatorId === userId
    
    // Check if user is in user_events table (try both table name variations)
    let userEventAccess = null
    const { data: access1 } = await supabase
        .from("users_events")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle()
    
    if (access1) {
        userEventAccess = access1
    } else {
        const { data: access2 } = await supabase
            .from("user_events")
            .select("user_id")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .maybeSingle()
        userEventAccess = access2
    }
    
    return userEventAccess || isCreator
}


export async function leaveEvent(eventId, userId) {
    const supabase = await createClient()
    const { error: leaveError } = await supabase
        .from("users_events")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId)

    if (leaveError) {
        console.log("Error inside leaveEvent:", leaveError)
        return { error: "Wystąpił błąd podczas opuszczania wydarzenia" }
    }
    return { success: true, error: null }
}


export async function fetchSharedCode(eventId) {
    const supabase = await createClient()
    console.log("Fetching shared code for event id:", eventId)
    const { data: sharedCode, error: sharedCodeError } = await supabase
        .from("event_codes")
        .select("*")
        .eq("event_id", String(eventId))
        // .single()
    
        if (sharedCodeError || !sharedCode) {
            console.log("Error inside fetchSharedCode:", sharedCodeError)
            return null
        }
    return sharedCode
}


export async function joinEventByCode(code, userId) {
    const supabase = await createClient()

    // Check if event code is valid
    const { data: eventCode, error: codeError } = await supabase
        .from("event_codes")
        .select("*")
        .eq("code", code)
        .single()

    if (codeError || !eventCode) {
        console.log("Error inside joinEventByCode:", codeError)
        return { error: "Nieprawidłowy kod wydarzenia" }
    }

    // Check if event code is expired
    const now = new Date()
    if (eventCode.expire_at && new Date(eventCode.expire_at) < now) {
        console.log("Event code expired")
        return { error: "Ten kod wydarzenia wygasł" }
    }

    //Check if user is already attending the event
    const { data: existing } = await supabase
        .from("users_events")
        .select("*")
        .eq("event_id", eventCode.event_id)
        .eq("user_id", userId)
        .maybeSingle()
    if (existing) {
        return { error: "Już jesteś uczestnikiem tego wydarzenia" }
    }

    //Insert user into users_events table
    const { error: insertError } = await supabase
        .from("users_events")
        .insert({
            event_id: eventCode.event_id,
            user_id: userId
        })
    if (insertError) {
        console.log("Error inside joinEventByCode:", insertError)
        return { error: "Wystąpił błąd podczas dołączania do wydarzenia" }
    }

    return { success: true, error: null }
}

/**
 * Fetch event by ID
 * @param {string} eventId - The event ID
 * @returns {Promise<Object>} - Event data
 */
export async function fetchEvent(eventId) {
    const supabase = await createClient()
    // console.log("Event id:", eventId)
    
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()
    
    if (eventError || !event) {
        notFound()
        // console.log("Event not found", eventError)
        // return null
    }

    sharedCode = await fetchSharedCode(eventId)
    if (sharedCode) {
        event.shared_code = sharedCode.code
    }

    const event_with_code = { ...event, shared_code: sharedCode }

    console.log("Event with code:", event_with_code)
    return event_with_code
}

export async function fetchEventsByUserId(userId) {
    const { supabase, user } = await getAuthenticatedUser()

    //check events created by user
    let eventsCreatedByUserWithCode = []
    const { data: eventsCreatedByUser, error: eventsCreatedByUserError } = await supabase
        .from("events")
        .select("*, event_codes( code )")
        .eq("creator_id", user.id)
        .order("date", { ascending: false })

    if (eventsCreatedByUserError || !eventsCreatedByUser) {
        console.log("Error:", eventsCreatedByUserError)
        // return []
    } else {
        //add code info 
        eventsCreatedByUserWithCode = eventsCreatedByUser?.map(({ event_codes, ...event }) => ({
            ...event,
            code: event_codes?.at(0)?.code
        }))
        
        eventsCreatedByUserWithCode = await Promise.all(eventsCreatedByUserWithCode.map(async (event) => {
            const invitees = await fetchEventInvitees(event.id)
            return { ...event, invitees: invitees || [] }
        }))
    }

    console.log("Events created by user WITH CODE:", eventsCreatedByUserWithCode)

    
    //fetch all other events user is attending
    let eventsUserIsAttendingData = []

    const { data: eventsUserIsAttending, error: eventsUserIsAttendingError } = await supabase
        .from("users_events")
        .select("event_id")
        .eq("user_id", user.id)

    if (eventsUserIsAttendingError || !eventsUserIsAttending) {
        console.log("Error:", eventsUserIsAttendingError)
    } else {
        const eventsUserIsAttendingArray = eventsUserIsAttending.map((event) => String(event.event_id))

        let { data: eventsUserIsAttendingDB, error: eventsUserIsAttendingError } = await supabase
            .from("events")
            .select("*")
            .in("id", eventsUserIsAttendingArray)
            .order("date", { ascending: false })

        if (eventsUserIsAttendingError || !eventsUserIsAttendingData) {
            console.log("Error:", eventsUserIsAttendingError)
            eventsUserIsAttendingData = []
        } else {
            eventsUserIsAttendingData = await Promise.all(
                        eventsUserIsAttendingDB.map(async (event) => {
                            
                            const { data: creatorProfile } = await supabase
                                .from("profiles")
                                .select("username, email")
                                .eq("id", event.creator_id)
                                .single()
                            
                            return {
                                ...event,
                                creatorUsername: creatorProfile?.username || creatorProfile?.email || "Nieznany"
                            }
                        })
                    )            
            
        }

        console.log("Events user is attending data:", eventsUserIsAttendingData)
    }


    // The original code has a scope issue: `eventsUserIsAttendingData` is re-declared as a local variable inside the `else` block,
    // so its value is not accessible here. Fix by moving its declaration before the if/else, and assign to it instead of redeclaring.
    const totalEvents = [
        ...eventsCreatedByUserWithCode,
        ...eventsUserIsAttendingData
    ]


    let totalEventsWithAttendees = []
    for (const event of totalEvents) {
        const attendees = await fetchEventAttendees(event.id, event.creator_id)
        const voteObjects = await fetchEventVotes(event.id)

        totalEventsWithAttendees.push({ ...event, attendees, voteObjects })
    }


    return totalEventsWithAttendees
}

/**
 * Fetch attendees for an event
 * @param {string} eventId - The event ID
 * @param {string} creatorId - The event creator ID
 * @returns {Promise<Array>} - Array of attendee objects with id and name
 */


export async function fetchEventAttendees(eventId, creatorId) {
    const supabase = await createClient()

    // Try users_events first (common Supabase naming), fallback to user_events
    let attendeesData = null

    // Get all user ids for the event
    const { data: attendeesIds, error: attendeesError } = await supabase
        .from("users_events")
        .select("user_id")
        .eq("event_id", eventId)
    
    if (attendeesError || !attendeesIds) {
        console.log("Error:", attendeesError)
        return []
    } else {

        const attendeesIdsArray = attendeesIds.map((attendee) => String(attendee.user_id)) //trzeba było tu dać String() bo UUID...

        const { data: attendeesData, error: attendeesError } = await supabase
            .from("profiles")
            .select("id, username, email")
            .in("id", attendeesIdsArray)
            // .single()

        if (attendeesError || !attendeesData) {
            console.log("Error:", attendeesError)
            return []
        } else {
            return attendeesData
        }
    }
}

export async function fetchEventInvitees(eventId) {
    const {supabase, user} = await getAuthenticatedUser()

    const { data: invitees, error: inviteesError } = await supabase
        .from("invites")
        .select("receiver_id")
        .eq("event_id", eventId)
        .eq("status", "pending")

    if (inviteesError) {
        throw new Error(inviteesError?.message || "Failed to fetch invitees")
        
    }

    const inviteesIdsArray = invitees.map((invitee) => String(invitee.receiver_id))

    if (invitees.length > 0) {
        const { data: attendeesData, error: attendeesError } = await supabase
            .from("profiles")
            .select("id, username, email")
            .in("id", inviteesIdsArray)
        
        if (attendeesError) {
            throw new Error(attendeesError?.message || "Failed to fetch attendees")
        }
        else {
            console.log("Invitees data:", attendeesData)
            return attendeesData
        }
    }
}


export async function createEvent(eventData, creatorId) {
    const supabase = await createClient()
    
    // Parse date from DD-MM-YYYY format
    // let eventTimestamp = null
    // if (eventData.date && eventData.startTime) {
    //     const [day, month, year] = eventData.date.split('-').map(Number)
    //     const [hours, minutes] = eventData.startTime.split(':').map(Number)
        
    //     // Create a Date object with the parsed date and time
    //     const eventDate = new Date(year, month - 1, day, hours, minutes)
        
    //     if (!isNaN(eventDate.getTime())) {
    //         eventTimestamp = eventDate.toISOString()
    //     }
    // }
    const newEvent = {
        name: eventData.name,
        description: eventData.description || null,
        creator_id: eventData.creator_id,
        time_start: eventData.startTime || null,
        time_end: eventData.endTime || null,
        date: eventData.date || null,
        location: eventData.location || null,
        time_poll_enabled: eventData.time_poll_enabled || false,
        location_poll_enabled: eventData.location_poll_enabled || false,
    }
    
    // Insert the event
    const { data: createdEvent, error: eventError } = await supabase
        .from("events")
        .insert(newEvent)
        .select()
        .single()
    
    if (eventError || !createdEvent) {
        console.error("Error creating event:", eventError)
        throw new Error(eventError?.message || "Failed to create event")
    }
    
    // Create invitations for participants instead of directly adding them to users_events
    if (eventData.participants && eventData.participants.length > 0) {
        const invitationsData = eventData.participants.map((participantId) => ({
            event_id: createdEvent.id,
            sender_id: eventData.creator_id,
            receiver_id: participantId,
            status: "pending"
        }))
        
        const { error: invitationsError } = await supabase
            .from("invites")
            .insert(invitationsData)
        
        if (invitationsError) {
            console.error("Error creating invitations:", invitationsError)
            // Don't throw here - event was created successfully, just log the error
        }
    }
    
    return createdEvent
}

/**
 * Update an existing event
 * @param {string} eventId - The event ID to update
 * @param {Object} eventData - The updated event data
 * @param {string} userId - The user ID (must be the creator)
 * @returns {Promise<Object>} - Updated event data
 */
export async function updateEvent(eventId, eventData, userId) {
    const supabase = await createClient()
    
    // First verify the user is the creator
    const { data: existingEvent, error: fetchError } = await supabase
        .from("events")
        .select("creator_id")
        .eq("id", eventId)
        .single()
    
    if (fetchError || !existingEvent) {
        throw new Error(`Event not found: ${eventId}`)
    }
    
    if (existingEvent.creator_id !== userId) {
        throw new Error("Only the event creator can update this event")
    }
    
    // Prepare event data for update
    const updatedEvent = {
        name: eventData.name,
        description: eventData.description || null,
        time_start: eventData.startTime,
        time_end: eventData.endTime,
        date: eventData.date, // DD-MM-YYYY to YYYY-MM-DD
        location: eventData.location || null,
        time_poll_enabled: eventData.voting || false,
    }
    
    // Update the event
    const { data: updated, error: updateError } = await supabase
        .from("events")
        .update(updatedEvent)
        .eq("id", eventId)
        .select()
        .single()
    
    if (updateError || !updated) {
        console.error("Error updating event:", updateError)
        throw new Error(updateError?.message || "Failed to update event")
    }

    const {data: existingParticipants, error: existingParticipantsError} = await supabase
        .from("users_events")
        .select("user_id")
        .eq("event_id", eventId)
    
    if (existingParticipantsError) {
        console.log("Error fetching existing participants:", existingParticipantsError)
        throw new Error(existingParticipantsError?.message || "Failed to fetch existing participants")
    }
    
    let participantsToRemove = []
    let participantsToInvite = []
    
    if (eventData.participants !== undefined) {
        const eventParticipantsIDs = eventData.participants.map(p => p.id)
        participantsToRemove = existingParticipants.filter(p => !eventParticipantsIDs.includes(p.user_id))
        participantsToInvite = eventParticipantsIDs.filter(p => !existingParticipants.includes(p.user_id))
    }
    

    // Handle participants update if provided
    if (eventData.participants !== undefined) {
        // Remove participants that needs to be removed
        const { error: deleteError } = await supabase
            .from("users_events")
            .delete()
            .eq("event_id", eventId)
            .in("user_id", participantsToRemove)
        
        if (deleteError) {
            console.error("Error removing existing participants:", deleteError)
        }
        
        // Add new participants if any
        participantsToInvite.forEach(async (participantId) => {
            await inviteUserToEvent(eventId, participantId)
            .catch((error) => {
                if (error) {
                    // console.error("Error inviting user to event:", error)
                }
            })
        })

    }

    if (eventData.invitees !== undefined) {
        const eventDatainviteesIDs = eventData.invitees.map(i => i.id)
        const { data: invitesSentIDs, error: invitesSentError } = await supabase
            .from("invites")
            .select("receiver_id, id")
            .eq("event_id", eventId)
            .eq("status", "pending")

        if (invitesSentError) {
            console.error("Error removing existing invitees:", invitesSentError)
        } else {

            const invitesToCancel = invitesSentIDs.map((el) => String(el.receiver_id)).filter((e) => !eventDatainviteesIDs.includes(e))

            console.log(`invitesToCancel: ${invitesToCancel}, eventData.invitees: ${eventDatainviteesIDs}, invitesSentIDs: ${invitesSentIDs.map((el) => String(el.receiver_id))}`)
            
            for (const invite of invitesSentIDs) {
                if (invitesToCancel.includes(String(invite.receiver_id))) {
                    await cacnelPendingInvitation(invite.id)
                    .catch((error) => {
                        if (error) {
                            console.error("Error canceling invitation:", error)
                        }
                    })
                }

            }
        }
    }
    return updated
 
}


export async function inviteUserToEvent(eventId, participantId) {
    const { supabase, user } = await getAuthenticatedUser()
    const { error: inviteError } = await supabase
        .from("invites")
        .insert({
            event_id: eventId,
            sender_id: user.id,
            receiver_id: participantId,
            status: "pending"
        })
    if (inviteError) {
        console.error("Error inviting user to event:", inviteError)
        throw new Error(inviteError?.message || "Failed to invite user to event")
    }
}

/**
 * Delete an event (only creator can delete)
 * @param {string} eventId - The event ID to delete
 * @param {string} userId - The user ID (must be the creator)
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId, userId) {
    const { supabase, user } = await getAuthenticatedUser()

    // First verify the user is the creator
    const { data: existingEvent, error: fetchError } = await supabase
        .from("events")
        .select("creator_id")
        .eq("id", eventId)
        .single()
    
    if (fetchError || !existingEvent) {
        throw new Error("Event not found")
    }
    
    if (existingEvent.creator_id !== user.id) {
        throw new Error("Only the event creator can delete this event")
    }
    
    // Delete all participants first
    const { error: participantsError } = await supabase
        .from("users_events")
        .delete()
        .eq("event_id", eventId)
    
    if (participantsError) {
        console.error("Error removing participants:", participantsError)
        // Continue with event deletion even if participant removal fails
    }

    const {error: deleteFromCodeError} = await supabase
        .from("event_codes")
        .delete()
        .eq("event_id", eventId)
    
    if (deleteFromCodeError) {
        console.error("Error removing code from event:", deleteFromCodeError)
    }

    const {error: deleteFromInvitesError} = await supabase
        .from("invites")
        .delete()
        .eq("event_id", eventId)
    
    if (deleteFromInvitesError) {
        console.error("Error removing invites:", deleteFromInvitesError)
    }
    
    // Delete the event
    const { error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
    
    if (deleteError) {
        console.error("Error deleting event:", deleteError)
        throw new Error(deleteError?.message || "Failed to delete event")
    }

    console.log("Event deleted successfully", eventId)
}

/**
 * Leave an event (remove user from participants)
 * @param {string} eventId - The event ID
 * @param {string} userId - The user ID leaving the event
 * @returns {Promise<void>}
 */
// export async function leaveEvent(eventId, userId) {
//     const supabase = await createClient()
    
//     // Verify the user is not the creator
//     const { data: existingEvent, error: fetchError } = await supabase
//         .from("events")
//         .select("creator_id")
//         .eq("id", eventId)
//         .single()
    
//     if (fetchError || !existingEvent) {
//         throw new Error("Event not found")
//     }
    
//     if (existingEvent.creator_id === userId) {
//         throw new Error("Event creator cannot leave their own event. Please delete the event instead.")
//     }
    
//     // Remove user from participants
//     const { error: leaveError } = await supabase
//         .from("users_events")
//         .delete()
//         .eq("event_id", eventId)
//         .eq("user_id", userId)
    
//     if (leaveError) {
//         console.error("Error leaving event:", leaveError)
//         throw new Error(leaveError?.message || "Failed to leave event")
//     }
// }

/**
 * Parse event time field into date and time strings
 * @param {Object} event - Event object with time and created_at fields
 * @returns {Object} - Object with eventDate and eventTime strings
 */
export function parseEventDateTime(event) {
    let eventDate = ""
    let eventTime = event.time || ""
    
    if (event.time) {
        // Try to parse as ISO timestamp
        const timeDate = new Date(event.time)
        if (!isNaN(timeDate.getTime())) {
            // It's a valid date
            eventDate = timeDate.toLocaleDateString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            })
            eventTime = timeDate.toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit",
            })
        } else {
            // Assume it's just a time string, try to get date from created_at
            if (event.created_at) {
                const createdDate = new Date(event.created_at)
                eventDate = createdDate.toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })
            }
        }
    }
    
    return { eventDate, eventTime }
}


