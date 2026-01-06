"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

export default function EventVoting({ user, eventId, eventCreatorId, serverActions }) {
  const [loading, setLoading] = useState(false)
  const [vote, setVote] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isCreator = user?.id === eventCreatorId

  const loadVote = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await serverActions.handleFetchGeneralVote(eventId, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się pobrać głosowania.")
        setVote(null)
        return
      }
      setVote(res.vote)
      if (res.vote?.userVoteOptionId) {
        setSelectedOption(res.vote.userVoteOptionId)
      }
    } catch (e) {
      setError(e?.message || "Nie udało się pobrać głosowania.")
      setVote(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const canVote = useMemo(() => {
    if (!vote) return false
    if (vote.isClosed) return false
    if (vote.userVoteOptionId) return false
    return true
  }, [vote])

  const handleSubmitVote = async () => {
    if (!vote?.id || !selectedOption) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await serverActions.handleCastGeneralVote(vote.id, selectedOption, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się oddać głosu.")
        return
      }
      await loadVote()
    } catch (e) {
      setError(e?.message || "Nie udało się oddać głosu.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseVote = async () => {
    if (!vote?.id) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await serverActions.handleCloseGeneralVote(vote.id, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się zamknąć głosowania.")
        return
      }
      await loadVote()
    } catch (e) {
      setError(e?.message || "Nie udało się zamknąć głosowania.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteVote = async () => {
    if (!vote?.id) return
    const ok = confirm("Na pewno chcesz usunąć głosowanie? Tej operacji nie da się cofnąć.")
    if (!ok) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await serverActions.handleDeleteGeneralVote(vote.id, user.id)
      if (!res?.success) {
        setError(res?.error || "Nie udało się usunąć głosowania.")
        return
      }
      await loadVote()
    } catch (e) {
      setError(e?.message || "Nie udało się usunąć głosowania.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="mt-8 border border-gray-200 rounded-xl p-6 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Głosowanie</h3>
          <p className="text-sm text-gray-500">Anonimowe — widoczne są tylko wyniki.</p>
        </div>

        {vote && isCreator && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseVote}
              disabled={actionLoading || vote.isClosed}
            >
              Zamknij
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteVote}
              disabled={actionLoading}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Usuń
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-gray-500">Ładowanie...</div>
      ) : error ? (
        <div className="py-4 text-red-600 text-sm">{error}</div>
      ) : !vote ? (
        <div className="py-6 text-gray-500">Brak głosowania dla tego wydarzenia.</div>
      ) : (
        <div className="mt-4">
          <div className="text-lg font-medium">{vote.question}</div>
          <div className="text-sm text-gray-500 mt-1">
            Status: <b>{vote.isClosed ? "Zamknięte" : "Otwarte"}</b> • Oddane głosy: <b>{vote.totalVotes}</b>
          </div>

          {/* Voting form */}
          {!vote.isClosed && !vote.userVoteOptionId && (
            <div className="mt-4 space-y-3">
              {(vote.options || []).map((opt) => (
                <label key={opt.id} className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="voteOption"
                    value={opt.id}
                    checked={selectedOption === opt.id}
                    onChange={() => setSelectedOption(opt.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-900">{opt.option_text}</span>
                </label>
              ))}
              <Button type="button" onClick={handleSubmitVote} disabled={!selectedOption || actionLoading}>
                {actionLoading ? "Głosowanie..." : "Oddaj głos"}
              </Button>
            </div>
          )}

          {/* Results */}
          <div className="mt-6 space-y-3">
            {(vote.options || []).map((opt) => (
              <div key={opt.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{opt.option_text}</span>
                    {vote.userVoteOptionId === opt.id && (
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
      )}
    </div>
  )
}


