"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

function formatTimeOption(optionText) {
  // expected: YYYY-MM-DD|HH:MM|HH:MM
  const [date, start, end] = String(optionText || "").split("|")
  if (!date || !start || !end) return optionText
  const parts = date.split("-")
  const ddMMyyyy = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : date
  return `${ddMMyyyy}, ${start} - ${end}`
}

export default function EventVotings({ user, eventId, eventCreatorId, fetchEventVotes, castVote, closeVote, deleteVote }) {
  const [loading, setLoading] = useState(false)
  const [votes, setVotes] = useState([])
  const [error, setError] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedByVoteId, setSelectedByVoteId] = useState({})

  const isCreator = user?.id === eventCreatorId

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchEventVotes(eventId, user.id)
      if (!res?.success) {
        setVotes([])
        setError(res?.error || "Nie udało się pobrać głosowań.")
      } else {
        setVotes(res.votes || [])
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
  }, [eventId])

  const handleCast = async (voteId) => {
    const optionId = selectedByVoteId[voteId]
    if (!optionId) return
    setActionLoadingId(voteId)
    setError(null)
    try {
      const res = await castVote(voteId, optionId, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się oddać głosu.")
        return
      }
      await load()
    } catch (e) {
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
      {votes.map((v) => {
        const title =
          v.type === "location" ? "Głosowanie nad miejscem" : v.type === "time" ? "Głosowanie nad czasem" : "Głosowanie ogólne"
        const isClosed = !!v.isClosed
        const alreadyVoted = !!v.userVoteOptionId
        const canVote = !isClosed // Allow voting/re-voting if not closed, regardless of previous vote
        const options = (v.options || []).map((o) => ({
          ...o,
          option_text: v.type === "time" ? formatTimeOption(o.option_text) : o.option_text,
        }))

        return (
          <div key={v.id} className="border border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-sm text-gray-500">Anonimowe — widoczne są tylko wyniki.</p>
                {v.deadline && (
                  <p className="text-xs text-gray-400 mt-1">
                    Koniec: {new Date(v.deadline).toLocaleString("pl-PL")}
                  </p>
                )}
              </div>

              {isCreator && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleClose(v.id)} disabled={actionLoadingId === v.id || isClosed}>
                    Zamknij
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(v.id)}
                    disabled={actionLoadingId === v.id}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Usuń
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-lg font-medium">{v.question}</div>
              <div className="text-sm text-gray-500 mt-1">
                Status: <b>{isClosed ? "Zamknięte" : "Otwarte"}</b> • Oddane głosy: <b>{v.totalVotes}</b>
              </div>

              {canVote && (
                <div className="mt-4 space-y-3">
                  {alreadyVoted && (
                    <div className="text-sm text-blue-600 mb-3">
                      ℹ️ Możesz zmienić swój głos. Twój obecny wybór zostanie zastąpiony.
                    </div>
                  )}
                  {options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`vote-${v.id}`}
                        value={opt.id}
                        checked={selectedByVoteId[v.id] === opt.id}
                        onChange={() => setSelectedByVoteId((prev) => ({ ...prev, [v.id]: opt.id }))}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900">{opt.option_text}</span>
                      {v.userVoteOptionId === opt.id && (
                        <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Twój wybór</span>
                      )}
                    </label>
                  ))}
                  <Button type="button" onClick={() => handleCast(v.id)} disabled={!selectedByVoteId[v.id] || actionLoadingId === v.id}>
                    {actionLoadingId === v.id ? "Głosowanie..." : alreadyVoted ? "Zmień głos" : "Oddaj głos"}
                  </Button>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {options.map((opt) => (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{opt.option_text}</span>
                        {v.userVoteOptionId === opt.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Twój wybór</span>
                        )}
                      </div>
                      <span className="text-gray-700">
                        {opt.percent}% ({opt.votes})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${opt.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


