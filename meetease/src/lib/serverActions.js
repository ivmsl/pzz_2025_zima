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

        // Auto-assign winning result to event for special votes (location/time) when deadline has passed
        if (isClosed && (vote.type === "location" || vote.type === "time")) {
            const { data: eventData } = await supabase
                .from("events")
                .select("id, location, time")
                .eq("id", eventId)
                .single()

            if (eventData) {
                // Check if we should assign the winning result
                // For location votes: only assign if location is currently empty
                // For time votes: only assign if time is currently empty
                const shouldAssign = (vote.type === "location" && !eventData.location) ||
                                    (vote.type === "time" && !eventData.time)

                if (shouldAssign && totalVotes > 0) {
                    // Find winning option
                    let winningOption = optionsWithResults[0]
                    for (const opt of optionsWithResults) {
                        if (opt.votes > winningOption.votes) {
                            winningOption = opt
                        }
                    }

                    if (winningOption) {
                        const updateData = {}

                        if (vote.type === "location") {
                            updateData.location = winningOption.option_text
                        } else if (vote.type === "time") {
                            // For time votes, the option_text is already in format YYYY-MM-DD|HH:MM|HH:MM
                            updateData.time = winningOption.option_text
                        }

                        await supabase
                            .from("events")
                            .update(updateData)
                            .eq("id", eventId)
                            .single()
                    }
                }
            }
        }

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

async function handleFetchEventVotes(eventId, userId) {
    "use server"
    const supabase = await createClient()

    // Access: creator or accepted participant
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, creator_id")
        .eq("id", eventId)
        .single()

    if (eventError || !event) {
        return { success: false, votes: [], error: eventError?.message || "Nie znaleziono wydarzenia." }
    }

    if (event.creator_id !== userId) {
        const { data: membership } = await supabase
            .from("users_events")
            .select("user_id")
            .eq("user_id", userId)
            .eq("event_id", eventId)
            .maybeSingle()

        if (!membership) {
            return { success: false, votes: [], error: "Brak dostępu." }
        }
    }

    // Some schemas may not have votes.created_at, so order by id for compatibility.
    const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("id, event_id, type, question, deadline")
        .eq("event_id", eventId)
        .order("id", { ascending: true })

    if (votesError) {
        return { success: false, votes: [], error: votesError.message }
    }

    if (!votes || votes.length === 0) {
        return { success: true, votes: [], error: null }
    }

    const result = []
    for (const v of votes) {
        const { data: options, error: optionsError } = await supabase
            .from("vote_options")
            .select("id, option_text")
            .eq("vote_id", v.id)

        if (optionsError) {
            return { success: false, votes: [], error: optionsError.message }
        }

        const optionIds = (options || []).map((o) => o.id)
        const { data: userVotes, error: userVotesError } = await supabase
            .from("user_votes")
            .select("user_id, vote_option_id")
            .in("vote_option_id", optionIds.length ? optionIds : ["00000000-0000-0000-0000-000000000000"])

        if (userVotesError) {
            return { success: false, votes: [], error: userVotesError.message }
        }

        const counts = {}
        for (const uv of userVotes || []) {
            counts[uv.vote_option_id] = (counts[uv.vote_option_id] || 0) + 1
        }

        const totalVotes = (userVotes || []).length
        const my = (userVotes || []).find((uv) => uv.user_id === userId)
        const userVoteOptionId = my?.vote_option_id || null
        const isClosed = v.deadline ? new Date(v.deadline).getTime() <= Date.now() : false

        const optionsWithResults = (options || []).map((o) => {
            const c = counts[o.id] || 0
            const percent = totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0
            return { ...o, votes: c, percent }
        })

        result.push({
            ...v,
            creator_id: event.creator_id,
            isClosed,
            totalVotes,
            userVoteOptionId,
            options: optionsWithResults,
        })

        // Auto-assign winning result to event for special votes (location/time) when deadline has passed
        // Auto-assign winning result to event for special votes (location/time) when deadline has passed
        if (isClosed && (v.type === "location" || v.type === "time")) {
            const { data: eventData } = await supabase
                .from("events")
                .select("id, location, time")
                .eq("id", eventId)
                .single()

            if (eventData) {
                // Check if we should assign the winning result
                // For location votes: only assign if location is currently empty
                // For time votes: only assign if time is currently empty
                const shouldAssign = (v.type === "location" && !eventData.location) ||
                                    (v.type === "time" && !eventData.time)

                if (shouldAssign && totalVotes > 0) {
                    // Find winning option
                    let winningOption = optionsWithResults[0]
                    for (const opt of optionsWithResults) {
                        if (opt.votes > winningOption.votes) {
                            winningOption = opt
                        }
                    }

                    if (winningOption) {
                        const updateData = {}

                        if (v.type === "location") {
                            updateData.location = winningOption.option_text
                        } else if (v.type === "time") {
                            // For time votes, the option_text is already in format YYYY-MM-DD|HH:MM|HH:MM
                            updateData.time = winningOption.option_text
                        }

                        await supabase
                            .from("events")
                            .update(updateData)
                            .eq("id", eventId)
                            .single()
                    }
                }
            }
        }
    }

    return { success: true, votes: result, error: null }
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
            .select("id, event_id, deadline, type")
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

        const closeAt = new Date().toISOString()
        const { error } = await supabase
            .from("votes")
            .update({ deadline: closeAt })
            .eq("id", voteId)

        if (error) return { success: false, error: error.message }

        // Bonus: po zamknięciu głosowań specjalnych ustaw zwycięską opcję w evencie
        if (vote.type === "location" || vote.type === "time") {
            const { data: options } = await supabase
                .from("vote_options")
                .select("id, option_text")
                .eq("vote_id", voteId)

            const optionIds = (options || []).map((o) => o.id)
            const { data: userVotes } = await supabase
                .from("user_votes")
                .select("vote_option_id")
                .in("vote_option_id", optionIds.length ? optionIds : ["00000000-0000-0000-0000-000000000000"])

            const counts = {}
            for (const uv of userVotes || []) {
                counts[uv.vote_option_id] = (counts[uv.vote_option_id] || 0) + 1
            }

            let winner = null
            let winnerCount = -1
            for (const opt of options || []) {
                const c = counts[opt.id] || 0
                if (c > winnerCount) {
                    winner = opt
                    winnerCount = c
                }
            }

            if (winner?.option_text) {
                if (vote.type === "location") {
                    await supabase
                        .from("events")
                        .update({ location: winner.option_text, location_poll_enabled: false })
                        .eq("id", vote.event_id)
                } else if (vote.type === "time") {
                    // expected: YYYY-MM-DD|HH:MM|HH:MM
                    const [date, start, end] = String(winner.option_text).split("|")
                    await supabase
                        .from("events")
                        .update({ date: date || null, time_start: start || null, time_end: end || null, time_poll_enabled: false })
                        .eq("id", vote.event_id)
                }
            }
        }

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
    handleFetchEventVotes,
    handleCastGeneralVote,
    handleCloseGeneralVote,
    handleDeleteGeneralVote
}
export default serverActions