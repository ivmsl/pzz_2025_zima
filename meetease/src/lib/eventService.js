import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { getAuthenticatedUser } from "@/utils/auth"

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

    const { data: eventsCreatedByUser, error: eventsError } = await supabase
        .from("events")
        .select("*, event_codes( code )")
        .eq("creator_id", user.id)

    if (eventsError || !eventsCreatedByUser) {
        console.log("Error:", eventsError)
        return []
    }

    const eventsCreatedByUserWithCode = eventsCreatedByUser?.map(({ event_codes, ...event }) => ({
        ...event,
        code: event_codes?.at(0)?.code
    }))

    console.log("Events created by user WITH CODE:", eventsCreatedByUserWithCode)

    const { data: eventsUserIsAttending, error: eventsUserIsAttendingError } = await supabase
        .from("users_events")
        .select("event_id")
        .eq("user_id", user.id)

    let eventsUserIsAttendingData = []
    if (eventsUserIsAttendingError || !eventsUserIsAttending) {
        console.log("Error:", eventsUserIsAttendingError)
    } else {
        const eventsUserIsAttendingArray = eventsUserIsAttending.map((event) => String(event.event_id))
        let { data: eventsUserIsAttendingDB, error: eventsUserIsAttendingError } = await supabase
            .from("events")
            .select("*")
            .in("id", eventsUserIsAttendingArray)

        if (eventsUserIsAttendingError || !eventsUserIsAttendingData) {
            console.log("Error:", eventsUserIsAttendingError)
            eventsUserIsAttendingData = []
        } else {
            eventsUserIsAttendingData = eventsUserIsAttendingDB
        }
        console.log("Events user is attending data:", eventsUserIsAttendingData)
    }

    // The original code has a scope issue: `eventsUserIsAttendingData` is re-declared as a local variable inside the `else` block,
    // so its value is not accessible here. Fix by moving its declaration before the if/else, and assign to it instead of redeclaring.
    const totalEvents = [
        ...eventsCreatedByUserWithCode,
        // ...eventsCreatedByUser,
        ...eventsUserIsAttendingData
    ]


    let totalEventsWithAttendees = []
    for (const event of totalEvents) {
        const attendees = await fetchEventAttendees(event.id, event.creator_id)
        totalEventsWithAttendees.push({ ...event, attendees })
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
        console.log("Attendees ids:", attendeesIds)

        const attendeesIdsArray = attendeesIds.map((attendee) => String(attendee.user_id)) //trzeba było tu dać String() bo UUID...

        const { data: attendeesData, error: attendeesError } = await supabase
            .from("profiles")
            .select("id, username, email")
            .in("id", attendeesIdsArray)
            // .single()
    

        console.log("Attendees data:", attendeesData, "Error:", attendeesError)

        if (attendeesError || !attendeesData) {
            console.log("Error:", attendeesError)
            return []
        } else {
            return attendeesData
        }
    }
    
    // Try users_events table name
    // const { data: data1, error: error1 } = await supabase
    //     .from("users_events")
    //     .select(`
    //         user_id,
    //         profiles:user_id!inner (
    //             id,
    //             username,
    //             email
    //         )
    //     `)
    //     .eq("event_id", eventId)
    
    // if (!error1 && data1) {
    //     attendeesData = data1
    // } else {
    //     // Fallback to user_events table name
    //     const { data: data2, error: error2 } = await supabase
    //         .from("users_events")
    //         .select(`
    //             user_id
    //         `)
    //         .eq("event_id", eventId)
    //     console.log("Error1:", error1, "Error2:", error2, data2)
        // attendeesData = data2
    // }
    
    // If join doesn't work, fetch user_ids and then users separately
    let attendees = []
    if (attendeesData && attendeesData.length > 0) {
        // Check if join worked (users data is present)
        if (attendeesData[0]?.users) {
            attendees = attendeesData.map((item) => ({
                id: item.users?.id || item.user_id,
                name: item.users?.username || item.users?.email || "Unknown User",
            }))
        } else {
            // Join didn't work, fetch users separately
            const userIds = attendeesData.map((item) => item.user_id)
            if (userIds.length > 0) {
                const { data: usersData } = await supabase
                    .from("users")
                    .select("id, username, email")
                    .in("id", userIds)
                
                attendees = usersData?.map((user) => ({
                    id: user.id,
                    name: user.username || user.email || "Unknown User",
                })) || []
            }
        }
    }
    
    // Add creator to attendees if not already present
    const creatorInAttendees = attendees.some((a) => a.id === creatorId)
    if (!creatorInAttendees && creatorId) {
        // Fetch creator info
        const { data: creatorData } = await supabase
            .from("users")
            .select("id, username, email")
            .eq("id", creatorId)
            .single()
        
        if (creatorData) {
            attendees.unshift({
                id: creatorData.id,
                name: creatorData.username || creatorData.email || "Unknown User",
            })
        }
    }
    
    return attendees
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
    
    // Prepare event data for insertion
    const newEvent = {
        name: eventData.name,
        description: eventData.description || null,
        creator_id: eventData.creator_id,
        time_start: eventData.startTime,
        time_end: eventData.endTime,
        date: eventData.date.split('-').reverse().join('-'), //DD-MM-YYYY to YYYY-MM-DD 
        location: eventData.location || null,
        time_poll_enabled: eventData.voting || false,
        location_poll_enabled: false, // Default to false, can be set separately if needed
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

/**
 * Fetch events user is participating in (from users_events table) and events created by user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of event objects
 */
export async function fetchUserParticipatingEvents(userId) {
    const supabase = await createClient()
    
    // Get event IDs from users_events (events user is attending)
    const { data: userEvents, error: userEventsError } = await supabase
        .from("users_events")
        .select("event_id")
        .eq("user_id", userId)
    
    let eventIds = []
    if (!userEventsError && userEvents) {
        eventIds = userEvents.map(ue => ue.event_id)
    }
    
    // Also get events created by the user
    const { data: createdEvents, error: createdEventsError } = await supabase
        .from("events")
        .select("id")
        .eq("creator_id", userId)
    
    if (!createdEventsError && createdEvents) {
        const createdEventIds = createdEvents.map(e => e.id)
        // Combine both lists and remove duplicates
        eventIds = [...new Set([...eventIds, ...createdEventIds])]
    }
    
    if (eventIds.length === 0) {
        return []
    }
    
    // Fetch all event details
    const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("date", { ascending: true })
    
    if (eventsError || !events) {
        console.error("Error fetching participating events:", eventsError)
        return []
    }
    
    // Fetch creator usernames for events where user is not the creator
    const eventsWithCreators = await Promise.all(
        events.map(async (event) => {
            if (event.creator_id === userId) {
                return event // User is creator, no need to fetch
            }
            
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
    
    return eventsWithCreators || []
}

/**
 * Fetch pending invitations for a user
 * @param {string} userId - The user ID (receiver)
 * @returns {Promise<Array>} - Array of invitation objects with event and sender details
 */
export async function fetchPendingInvitations(userId) {
    const supabase = await createClient()
    
    // Fetch invitations
    const { data: invitations, error: invitationsError } = await supabase
        .from("invites")
        .select("id, event_id, sender_id, receiver_id, status")
        .eq("receiver_id", userId)
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



