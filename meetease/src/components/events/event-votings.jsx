"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import VoteResultBlock from "@/components/votes/results/voteResultBlock"

function formatTimeOption(optionText) {
  // expected: YYYY-MM-DD|HH:MM|HH:MM
  const [date, start, end] = String(optionText || "").split("|")
  if (!date || !start || !end) return optionText
  const parts = date.split("-")
  const ddMMyyyy = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : date
  return `${ddMMyyyy}, ${start} - ${end}`
}

export default function EventVotings({ user, event, fetchEventVotes, castVote, closeVote, deleteVote }) {
  const [loading, setLoading] = useState(false)
  const [votes, setVotes] = useState([])
  const [error, setError] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedByVoteId, setSelectedByVoteId] = useState({})

  const isCreator = user?.id === event?.creator_id

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchEventVotes(event.id, user.id)
      console.log("res: ", res)
      if (!res?.success) {
        setVotes([])
        setError(res?.error || "Nie udało się pobrać głosowań.")
      } else {
        setVotes(res.voteResults || [])
      }
    } catch (e) {
      setVotes([])
      setError(e?.message || "Nie udało się pobrać głosowań.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  const handleCast = async (voteId, optionId) => {
  
    setActionLoadingId(optionId)
    setError(null)
    try {
      const res = await castVote(voteId, optionId, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się oddać głosu.")
        return
      }
      await load()
    } catch (e) {
      console.error("Error casting vote: ", e)
      setError(e?.message || "Nie udało się oddać głosu.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleClose = async (voteId) => {
    setActionLoadingId(voteId)
    setError(null)
    try {
      const res = await closeVote(voteId, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się zamknąć głosowania.")
        return
      }
      await load()
    } catch (e) {
      setError(e?.message || "Nie udało się zamknąć głosowania.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (voteId) => {
    const ok = confirm("Na pewno chcesz usunąć głosowanie? Tej operacji nie da się cofnąć.")
    if (!ok) return
    setActionLoadingId(voteId)
    setError(null)
    try {
      const res = await deleteVote(voteId, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się usunąć głosowania.")
        return
      }
      await load()
    } catch (e) {
      setError(e?.message || "Nie udało się usunąć głosowania.")
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return <div className="mt-6 text-gray-500">Ładowanie głosowań...</div>
  }

  if (error) {
    return <div className="mt-4 text-red-600 text-sm">{error}</div>
  }

  if (!votes || votes.length === 0) {
    return (
      <div className="mt-6 border border-gray-200 rounded-xl p-6 bg-white">
        <div className="text-xl font-semibold">Głosowania</div>
        <div className="text-sm text-gray-500 mt-1">Anonimowe — widoczne są tylko wyniki.</div>
        <div className="py-4 text-gray-500">Brak głosowań dla tego wydarzenia.</div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {votes.map((vote) => (
        <VoteResultBlock key={vote.voteDescriptor.id} voteDescriptor={vote.voteDescriptor} results={vote.results} userVote={vote.userVote} onCastVote={handleCast} />
      ))}
    </div>
  )
}


