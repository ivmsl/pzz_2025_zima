"use server"
import { getAuthenticatedUser } from "@/utils/auth"
import { createClient } from "@/utils/supabase/server"
import { dayTimeToTimestampTZ, timestampTZToDayTime } from "@/lib/timeUtils"


// This function is used to register a vote object for the event creation process
//
// @param {Object} voteData - The vote data to register
//  VoteData has the following structure (depending on type):
// {
//  "time", 
//  "location",
//   "general"
// }
// Each vote object has the following structure:
// voteDescriptior: 
// {
//     id: string,
//     event_id: string,
//     type: string,
//     question: string,
//     deadline: string,
//     deadlineTime: string,
// }
// options: string[] (options connected to the vote)
// timedOption: {start: "", end: "", date: ""} (timed options connected to the vote)
//}
// @param {string} eventId - The event ID
// @returns {Promise<void>}
//

export async function registerVote(voteData, eventId) {
    const timeVote = voteData.time? voteData.time : null
    const locationVote = voteData.location? voteData.location : null
    const generalVote = voteData.general? voteData.general : null
    try {
        if (timeVote) {
            console.log("timeVote is : ", timeVote)
            await _createVote(timeVote, eventId)
        }
        if (locationVote) {
            console.log("locationVote is : ", locationVote)
            await _createVote(locationVote, eventId)
        }
        if (generalVote) {
            for (const vote of generalVote) {
            await _createVote(vote, eventId)
            }
        }
    }
    catch (error) {
        console.error(`Error registering vote: ${error?.message || "Unknown error"}`)
        throw new Error(`Error registering vote: ${error?.message || "Unknown error"}`)
    }


}

async function _createVote(voteData, eventId) {
    const supabase = await createClient()
    const { voteDescriptor, options, timedOption } = voteData

    const { data: createdVote, error: voteError } = await supabase
            .from("votes")
            .insert({
                event_id: eventId,
                type: voteDescriptor.type,
                question: voteDescriptor.question,
                deadline: dayTimeToTimestampTZ(voteDescriptor.deadline, voteDescriptor.deadlineTime),
            })
            .select("id")
            .single()

    if (voteError || !createdVote) {
        throw new Error(`Error creating vote: ${voteError?.message || "Unknown error"}`)
    }
    
    const createdVoteID = String(createdVote.id)

    if (timedOption) {
        const timedOptionsStr = timedOption.map(option => option.date && option.start && option.end ? `${option.date}|${option.start}|${option.end}` : null).filter(option => option !== null && option !== undefined)
        for (const option of timedOptionsStr) {
            await _insertVoteOption(createdVoteID, option)
            .catch(error => {
                console.error(`Error inserting timed vote option: ${error?.message || "Unknown error"}`)
                throw new Error(`Error inserting timed vote option: ${error?.message || "Unknown error"}`)
            })
        }
    }

    if (options) {
        for (const option of options) {
            if (option.trim()) {
                console.log("inserting general vote option: ", option)
                await _insertVoteOption(createdVoteID, option)
                .catch(error => {
                    console.error(`Error inserting general vote option: ${error?.message || "Unknown error"}`)
                    throw new Error(`Error inserting general vote option: ${error?.message || "Unknown error"}`)
                })
            }
        }
    }

}

async function _insertVoteOption(voteID, option) {
    const supabase = await createClient()

    const { data: createdVoteOptionID, error: voteOptionError } = await supabase
        .from("vote_options")
        .insert({
            vote_id: voteID,
            option_text: option,
        })
        .select("id")
        .single()

    if (voteOptionError || !createdVoteOptionID) {
        throw new Error(`Error creating a vote option: ${voteOptionError?.message || "Unknown error"}`)
    }
}

export async function fetchEventVotes(eventId) {
    let voteObjects = []
    let timeVote = []
    let locationVote = []
    let generalVote = []
    
    const voteDescriptors = await _fetchVoteDescriptors(eventId)
    .catch(error => {
        console.error(`Error fetching vote descriptors: ${error?.message || "Unknown error"}`)
        throw new Error(`Error fetching vote descriptors: ${error?.message || "Unknown error"}`)
    })

    for (const voteDescriptor of voteDescriptors) {
        console.log("fetching vote options for vote descriptor: ", voteDescriptor)
        const voteOptions = await _fetchVoteOptions(voteDescriptor.id)
        .catch(error => {
            const errorMessage = [
                "Failed to fetch vote options.",
                error?.message ? `Details: ${error.message}` : "No additional error details provided."
            ].join(" ");
            throw new Error(errorMessage);
        })    

        let timedOptions = []
        let options = []
        const regex = /^\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}\|\d{2}:\d{2}$/;

        if (voteDescriptor.type === "time") {
            voteOptions.map(option => {
                if (option.option_text && regex.test(option.option_text)) {
                    const [date, start, end] = option.option_text.split("|")
                    timedOptions.push({
                        date: date,
                        start: start,
                        end: end,
                    })
                }
            })
            
        } else {
            voteOptions.map(option => {
                options.push(option.option_text)
            })
        }

        if (voteDescriptor.type === "time") {
            timeVote.push({
                voteDescriptor: voteDescriptor,
                timedOptions: timedOptions,
                options: options,
            })
        } else if (voteDescriptor.type === "location") {
            locationVote.push({
                voteDescriptor: voteDescriptor,
                timedOptions: timedOptions,
                options: options,
            })
        } else {
            generalVote.push({
                voteDescriptor: voteDescriptor,
                options: options,
                timedOptions: timedOptions,
            })
        }
    }
    return {
        "time": timeVote,
        "location": locationVote,
        "general": generalVote,
    }
}

async function _fetchVoteDescriptors(eventId) {
    const supabase = await createClient()

    const { data: vote, error: voteError } = await supabase
        .from("votes")
        .select("id, event_id, type, question, deadline")
        .eq("event_id", eventId)
        

    if (voteError || !vote) {
        throw new Error(`Error fetching vote: ${voteError?.message || "Unknown error"}`)
    }

    // voteDescriptior: 
// {
//     id: string,
//     event_id: string,
//     type: string,
//     question: string,
//     deadline: string,
//     deadlineTime: string,
// }
    if (vote.length !== 0) {
        console.log("VOTE DESCRIPTOR ALLO???? ", vote)
    }
    
    return vote.map((v) => {
        const {date: deadline, time: deadlineTime} = timestampTZToDayTime(v.deadline)
        return {
            id: v.id,
            event_id: v.event_id,
            type: v.type,
            question: v.question,
            deadline: deadline,
            deadlineTime: deadlineTime,
        }
    }) //list of vote descriptors
}

async function _fetchVoteOptions(voteId) {
    const supabase = await createClient()
    const { data: options, error: optionsError } = await supabase
        .from("vote_options")
        .select("id, option_text")
        .eq("vote_id", voteId)

    if (optionsError || !options) {
        throw new Error(`Error fetching vote options: ${optionsError?.message || "Unknown error"}`)
    }
    return options
}


async function handleFetchGeneralVote(eventId, userId) {
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