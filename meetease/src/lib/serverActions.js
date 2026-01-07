
import { createEvent, joinEventByCode, leaveEvent, updateEvent, deleteEvent, fetchEventsByUserId} from "@/lib/eventService"
import { fetchPendingInvitations, acceptPendingInvitation, declinePendingInvitation, searchUsersByUsername } from "@/lib/userService"


async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)
    console.log("Event created:", event)
    // redirect("/dashboard")
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


async function handleUpdateEventServerAction(eventId, eventData, userId) {
    "use server"
    const { success, error } = await updateEvent(eventId, eventData, userId)
    if (error) {
       return { success: false, error: error }
    } else {
        return { success: true, error: null }
    }
}


async function handleDeleteEventServerAction(eventId) {
    "use server"
        await deleteEvent(eventId)
        .then((_) => {
            return { success: true, error: null }
        })
        .catch((error) => {
            console.error("Error deleting event:", error)
            return { success: false, error: error.message }
        })
        
}

async function handleFetchParticipatingEvents() {
    "use server"
    try {
        const events = await fetchEventsByUserId()
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

async function handleAcceptInvitation(inviteId, eventId) {
    "use server"
    try {
        const { success, error } = await acceptPendingInvitation(inviteId, eventId)
        if (error) {
            return { success: false, error: error }
        } else {
            return { success: true, error: null }
        }
    } catch (error) {
        console.error("Error accepting invitation:", error)
        return { success: false, error: error.message }
    }

}

async function handleDeclineInvitation(inviteId) {
    "use server"
    try {
        const { success, error } = await declinePendingInvitation(inviteId)
        if (error) {
            return { success: false, error: error }
        } else {
            return { success: true, error: null }
        }
    } catch (error) {
        console.error("Error declining invitation:", error)
        return { success: false, error: error.message }
    }
}

async function handleSearchUserByUsername(query) {
    "use server"
    return await searchUsersByUsername(query)
        .then((users) => {
          console.log("users", users);
          return users
        })
        .catch((error) => {
            console.error("Error searching users:", error)
            return []
        })
}

const serverActions = {
    handleCreateEventServerAction,
    handleJoinEventServerAction,
    handleLeaveEventServerAction,
    handleUpdateEventServerAction, 
    handleDeleteEventServerAction,
    handleFetchParticipatingEvents,
    handleFetchPendingInvitations,
    handleAcceptInvitation,
    handleDeclineInvitation,
    handleSearchUserByUsername
}
export default serverActions