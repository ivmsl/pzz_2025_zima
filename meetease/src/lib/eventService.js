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
    
    return event
}

export async function fetchEventsByUserId(userId) {
    const { supabase, user } = await getAuthenticatedUser()

    const { data: eventsCreatedByUser, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", user.id)

    if (eventsError || !eventsCreatedByUser) {
        console.log("Error:", eventsError)
        return []
    }

    const { data: eventsUserIsAttending, error: eventsUserIsAttendingError } = await supabase
        .from("users_events")
        .select("event_id")
        .eq("user_id", user.id)

    if (eventsUserIsAttendingError || !eventsUserIsAttending) {
        return []
        console.log("Error:", eventsUserIsAttendingError)
    }

    return [...eventsCreatedByUser, ...eventsUserIsAttending]
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
    
    // Add participants to users_events table if provided
    if (eventData.participants && eventData.participants.length > 0) {
        const participantsData = eventData.participants.map((participantId) => ({
            event_id: createdEvent.id,
            user_id: participantId,
        }))
        
        const { error: participantsError } = await supabase
            .from("users_events")
            .insert(participantsData)
        
        if (participantsError) {
            console.error("Error adding participants:", participantsError)
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



