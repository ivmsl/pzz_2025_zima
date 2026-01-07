import { createEvent, joinEventByCode, leaveEvent, updateEvent, deleteEvent } from "@/lib/eventService"
import { redirect } from "next/navigation"

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
    const { success, error } = await deleteEvent(eventId)
    if (error) {
       return { success: false, error: error }
    } else {
        return { success: true, error: null }
    }
}

const serverActions = {
    handleCreateEventServerAction,
    handleJoinEventServerAction,
    handleLeaveEventServerAction,
    handleUpdateEventServerAction, 
    handleDeleteEventServerAction
}
export default serverActions