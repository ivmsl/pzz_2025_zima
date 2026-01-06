import { createEvent, joinEventByCode, leaveEvent, fetchUserParticipatingEvents, fetchPendingInvitations } from "@/lib/eventService"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

async function handleCreateEventServerAction(eventData) {
    "use server"
    const event = await createEvent(eventData)

    // Safety: ensure voting was created (in case the insert was skipped/failed earlier)
    if (eventData?.vote?.question && Array.isArray(eventData?.vote?.options)) {
        const supabase = await createClient()
        const question = String(eventData.vote.question).trim()
        const options = eventData.vote.options.map((o) => String(o).trim()).filter(Boolean)

        if (question && options.length >= 2) {
            const { data: existingVote, error: existingVoteError } = await supabase
                .from("votes")
                .select("id")
                .eq("event_id", event.id)
                .limit(1)
                .maybeSingle()

            if (existingVoteError) {
                console.error("Error checking existing vote:", existingVoteError)
            }

            if (!existingVote) {
                const { data: createdVote, error: voteError } = await supabase
                    .from("votes")
                    .insert({
                        event_id: event.id,
                        type: "general",
                        question,
                        deadline: null,
                    })
                    .select("id")
                    .single()

                if (voteError || !createdVote) {
                    console.error("Error creating vote (retry):", voteError)
                } else {
                    const optionsRows = options.map((option_text) => ({
                        vote_id: createdVote.id,
                        option_text,
                    }))

                    const { error: optionsError } = await supabase
                        .from("vote_options")
                        .insert(optionsRows)

                    if (optionsError) {
                        console.error("Error creating vote options (retry):", optionsError)
                    }
                }
            }
        }
    }

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

async function handleFetchGeneralVote(eventId, userId) {
    "use server"
    const supabase = await createClient()

    try {
        // Access check: creator or participant
        const { data: event } = await supabase
            .from("events")
            .select("id, creator_id")
            .eq("id", eventId)
            .single()

        if (!event) {
            return { success: false, vote: null, error: "Event not found" }
        }

        if (event.creator_id !== userId) {
            const { data: membership } = await supabase
                .from("users_events")
                .select("user_id")
                .eq("user_id", userId)
                .eq("event_id", eventId)
                .maybeSingle()

            if (!membership) {
                return { success: false, vote: null, error: "No access" }
            }
        }

        // Some DBs may not store the exact enum value/type; be tolerant and fetch the first vote for the event.
        const { data: vote, error: voteFetchError } = await supabase
            .from("votes")
            .select("id, event_id, type, question, deadline")
            .eq("event_id", eventId)
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle()

        if (voteFetchError) {
            console.error("Error fetching vote row:", voteFetchError)
            return { success: false, vote: null, error: voteFetchError.message }
        }

        if (!vote) {
            return { success: true, vote: null, error: null }
        }

        const { data: options, error: optionsError } = await supabase
            .from("vote_options")
            .select("id, option_text")
            .eq("vote_id", vote.id)

        if (optionsError) {
            console.error("Error fetching vote options:", optionsError)
            return { success: false, vote: null, error: optionsError.message }
        }

        const optionIds = (options || []).map((o) => o.id)

        const { data: votes, error: userVotesError } = await supabase
            .from("user_votes")
            .select("user_id, vote_option_id")
            .in("vote_option_id", optionIds.length ? optionIds : ["00000000-0000-0000-0000-000000000000"])

        if (userVotesError) {
            console.error("Error fetching user votes:", userVotesError)
            return { success: false, vote: null, error: userVotesError.message }
        }

        const counts = {}
        for (const v of votes || []) {
            counts[v.vote_option_id] = (counts[v.vote_option_id] || 0) + 1
        }

        const totalVotes = (votes || []).length
        const userVote = (votes || []).find((v) => v.user_id === userId)
        const userVoteOptionId = userVote?.vote_option_id || null

        const optionsWithResults = (options || []).map((o) => {
            const c = counts[o.id] || 0
            const percent = totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0
            return { ...o, votes: c, percent }
        })

        const isClosed = vote.deadline ? new Date(vote.deadline).getTime() <= Date.now() : false

        return {
            success: true,
            vote: {
                ...vote,
                isClosed,
                creator_id: event.creator_id,
                totalVotes,
                userVoteOptionId,
                options: optionsWithResults,
            },
            error: null,
        }
    } catch (error) {
        console.error("Error fetching vote:", error)
        return { success: false, vote: null, error: error.message }
    }
}

async function handleCastGeneralVote(voteId, optionId, userId) {
    "use server"
    const supabase = await createClient()

    try {
        // Ensure option belongs to vote
        const { data: option } = await supabase
            .from("vote_options")
            .select("id, vote_id")
            .eq("id", optionId)
            .maybeSingle()

        if (!option || option.vote_id !== voteId) {
            return { success: false, error: "Invalid option" }
        }

        const { data: vote } = await supabase
            .from("votes")
            .select("id, event_id, deadline")
            .eq("id", voteId)
            .single()

        if (!vote) {
            return { success: false, error: "Vote not found" }
        }

        // Closed check (deadline in past => closed)
        if (vote.deadline && new Date(vote.deadline).getTime() <= Date.now()) {
            return { success: false, error: "Voting is closed" }
        }

        // Access check: creator or participant
        const { data: event } = await supabase
            .from("events")
            .select("creator_id")
            .eq("id", vote.event_id)
            .single()

        if (!event) {
            return { success: false, error: "Event not found" }
        }

        if (event.creator_id !== userId) {
            const { data: membership } = await supabase
                .from("users_events")
                .select("user_id")
                .eq("user_id", userId)
                .eq("event_id", vote.event_id)
                .maybeSingle()

            if (!membership) {
                return { success: false, error: "No access" }
            }
        }

        // Delete previous vote by this user for this vote (any option of this vote)
        const { data: allOptions } = await supabase
            .from("vote_options")
            .select("id")
            .eq("vote_id", voteId)

        const allOptionIds = (allOptions || []).map((o) => o.id)
        if (allOptionIds.length > 0) {
            await supabase
                .from("user_votes")
                .delete()
                .eq("user_id", userId)
                .in("vote_option_id", allOptionIds)
        }

        const { error: insertError } = await supabase
            .from("user_votes")
            .insert({ user_id: userId, vote_option_id: optionId })

        if (insertError) {
            console.error("Error casting vote:", insertError)
            return { success: false, error: insertError.message }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error("Error casting vote:", error)
        return { success: false, error: error.message }
    }
}

async function handleCloseGeneralVote(voteId, userId) {
    "use server"
    const supabase = await createClient()

    try {
        const { data: vote } = await supabase
            .from("votes")
            .select("id, event_id, deadline")
            .eq("id", voteId)
            .single()

        if (!vote) return { success: false, error: "Vote not found" }

        const { data: event } = await supabase
            .from("events")
            .select("creator_id")
            .eq("id", vote.event_id)
            .single()

        if (!event || event.creator_id !== userId) {
            return { success: false, error: "Only creator can close voting" }
        }

        const { error } = await supabase
            .from("votes")
            .update({ deadline: new Date().toISOString() })
            .eq("id", voteId)

        if (error) return { success: false, error: error.message }
        return { success: true, error: null }
    } catch (error) {
        console.error("Error closing vote:", error)
        return { success: false, error: error.message }
    }
}

async function handleDeleteGeneralVote(voteId, userId) {
    "use server"
    const supabase = await createClient()

    try {
        const { data: vote } = await supabase
            .from("votes")
            .select("id, event_id")
            .eq("id", voteId)
            .single()

        if (!vote) return { success: false, error: "Vote not found" }

        const { data: event } = await supabase
            .from("events")
            .select("creator_id")
            .eq("id", vote.event_id)
            .single()

        if (!event || event.creator_id !== userId) {
            return { success: false, error: "Only creator can delete voting" }
        }

        const { data: options } = await supabase
            .from("vote_options")
            .select("id")
            .eq("vote_id", voteId)

        const optionIds = (options || []).map((o) => o.id)
        if (optionIds.length > 0) {
            await supabase.from("user_votes").delete().in("vote_option_id", optionIds)
        }

        await supabase.from("vote_options").delete().eq("vote_id", voteId)
        await supabase.from("votes").delete().eq("id", voteId)

        return { success: true, error: null }
    } catch (error) {
        console.error("Error deleting vote:", error)
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
    handleFetchGeneralVote,
    handleCastGeneralVote,
    handleCloseGeneralVote,
    handleDeleteGeneralVote
}
export default serverActions