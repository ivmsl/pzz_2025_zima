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
        // console.log("fetching vote options for vote descriptor: ", voteDescriptor)
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
    // if (vote.length !== 0) {
        
    // }
    
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

async function __checkIfVoteCreator(userId, voteId) {
    const supabase = await createClient()
    const {data: eventId, error: eventIdError} = await supabase
        .from("votes")
        .select("event_id")
        .eq("id", voteId)
        .single()

    if (eventIdError || !eventId) {
        return false
    }

    const {data: eventCreator, error: eventCreatorError} = await supabase
        .from("events")
        .select("creator_id")
        .eq("id", eventId.event_id)
        .single()

    if (eventCreatorError || !eventCreator) {
        return false
    }

    return eventCreator.creator_id === userId
}

async function _checkIfUserCanVote(userId, voteId) {
    const supabase = await createClient()
    const {data: eventId, error: eventIdError} = await supabase
        .from("votes")
        .select("event_id")
        .eq("id", voteId)
        .single()

    if (eventIdError || !eventId) {
        return false
    }

    let ret = false 

    if (eventId.event_id) {
        const {data: userEvent, error: userEventError} = await supabase
            .from("users_events")
            .select("user_id")
            .eq("user_id", userId)
            .eq("event_id", eventId.event_id)
            .single()

        if (userEventError || !userEvent) {
            ret |= false
        }

        const {data: eventCreator, error: eventCreatorError} = await supabase
            .from("events")
            .select("creator_id")
            .eq("id", eventId.event_id)
            .single()

        if (eventCreatorError || !eventCreator) {
            ret |= false
        }

        if ((userEvent?.user_id && userEvent?.user_id === userId) || (eventCreator?.creator_id && eventCreator?.creator_id === userId))  {
            ret |= true
        }
    }
        return ret
}

export async function castAVote(voteId, optionId, userId) {
    const supabase = await createClient()

    const canVote = await _checkIfUserCanVote(userId, voteId)
    console.log("canVote: ", canVote)
    if (!canVote) {
        throw new Error(`User cannot vote for this vote`)
    }

    const { data: userVote, error: userVoteError } = await supabase
        .from("user_votes")
        .insert({
            user_id: userId,
            vote_option_id: optionId,
        })
        .select("*")
        .single()

    if (userVoteError || !userVote) {
        throw new Error(`Error casting vote: ${userVoteError?.message || "Unknown error"}`)
    }

    return userVote
}

export async function fetchVoteVotes(voteId) {
    const supabase = await createClient()
    const { data: voteVotes, error: voteVotesError } = await supabase
        .from("vote_results")
        .select("*")
        .eq("vote_id", voteId)

    if (voteVotesError || !voteVotes) {
        throw new Error(`Error fetching vote votes: ${voteVotesError?.message || "Unknown error"}`)
    }
    return voteVotes
}

async function _fetchVoteResultsBulk(voteIdList) {
    const supabase = await createClient()
    const { data: voteResults, error: voteResultsError } = await supabase
        .from("vote_results")
        .select("*")
        .in("vote_id", voteIdList)

    if (voteResultsError || !voteResults) {
        throw new Error(`Error fetching vote results: ${voteResultsError?.message || "Unknown error"}`)
    }

    const parsedResults = voteResults.reduce((acc, r) => {
        if (!acc[r.vote_id]) {
            acc[r.vote_id] = { results: [] }
        }
        acc[r.vote_id].results.push({
            option_id: r.option_id,
            option_text: r.option_text,
            total_votes: r.total_votes,
        })
        return acc
    }, {})

    return parsedResults
}

export async function getUserVoteByVoteID(userId, voteId) {
    const supabase = await createClient()
    const { data: userVote, error: userVoteError } = await supabase
        .from("user_votes")
        .select("vote_option_id, user_id, vote_options!inner (id, vote_id)")
        .eq("vote_options.vote_id", voteId)
        .eq("user_id", userId)
        .maybeSingle()

    if (userVoteError || !userVote) {
        console.log("userVoteError: ", userVoteError)
        return null
    }

    console.log("userVote in function getUserVoteByVoteID: ", userVote)

    if (userVote && userVote.user_id && userVote.user_id === userId) {

        // console.log("userVote in function getUserVoteByVoteID: ", userVote, voteId, userVote.vote_option_id)
        return {
            id: userVote.vote_options.id,
            voteId: voteId,
            user: userId,
        }
    }

    return {}
}

export async function fetchVotedVotesForEvent(eventId) {
    const supabase = await createClient()
    const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("id")
        .eq("event_id", eventId)

    if (votesError || !votes) {
        throw new Error(`Error fetching votes for event: ${votesError?.message || "Unknown error"}`)
    }
    

    const votesWithResults = []
    for (const v of votes) {

        const voteRes = await fetchVoteVotes(v.id)

        if (voteRes && voteRes.length > 0) {
            votesWithResults.push(
                {
                    id: v.id,
                    question: voteRes[0].question,
                    results: voteRes,
                }
            )    
        }
        
    }
    return votesWithResults
}

export async function fetchVoteResultsEventUser(eventId, userId) {
    const voteDescriptors = await _fetchVoteDescriptors(eventId)
    .catch(error => {
        console.error(`Error fetching vote descriptors: ${error?.message || "Unknown error"}`)
        throw new Error(`Error fetching vote descriptors: ${error?.message || "Unknown error"}`)
    })

    if (voteDescriptors.length === 0) {
        return []
    }

    const voteIds = voteDescriptors.map(v => v.id)
    const voteResults = await _fetchVoteResultsBulk(voteIds)
    .catch(error => {
        console.error(`Error fetching vote results: ${error?.message || "Unknown error"}`)
        throw new Error(`Error fetching vote results: ${error?.message || "Unknown error"}`)
    })

    const voteObjectsArr = []

    for (const vd of voteDescriptors) {
        const userVote = await getUserVoteByVoteID(userId, vd.id)
        // console.log("userVote in function fetchVoteResultsEventUser: ", userVote, vd.id)
        if (vd) {
            voteObjectsArr.push({
                voteDescriptor: vd,
                results: voteResults[vd.id]?.results || [],
                userVote: userVote?.id ? userVote.id : null,
            })
        }
    }
   
    // console.log("voteObjectsArr in function fetchVoteResultsEventUser: ", voteObjectsArr)
    return voteObjectsArr
}