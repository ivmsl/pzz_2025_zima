"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime } from "@/lib/timeUtils"

export default function InvitationsModal({ user, open, onClose, serverActions, onInvitationHandled }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(new Set())
  const loadingRef = useRef(false)

  useEffect(() => {
    if (open && !loadingRef.current) {
      loadInvitations()
    }
  }, [open, user.id])

  const loadInvitations = async () => {
    // Prevent duplicate calls
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const result = await serverActions.handleFetchPendingInvitations(user.id)
      if (result.success) {
        setInvitations(result.invitations || [])
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const handleAccept = async (inviteId, eventId) => {
    setProcessing(prev => new Set(prev).add(inviteId))
    try {
      const result = await serverActions.handleAcceptInvitation(inviteId, eventId, user.id)
      if (result.success) {
        // Remove invitation from list
        setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
        // Notify parent to refresh upcoming events
        if (onInvitationHandled) {
          onInvitationHandled()
        }
      }
    } catch (error) {
      console.error("Error accepting invitation:", error)
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(inviteId)
        return newSet
      })
    }
  }

  const handleDecline = async (inviteId) => {
    setProcessing(prev => new Set(prev).add(inviteId))
    try {
      const result = await serverActions.handleDeclineInvitation(inviteId)
      if (result.success) {
        // Remove invitation from list
        setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
      }
    } catch (error) {
      console.error("Error declining invitation:", error)
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(inviteId)
        return newSet
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Zaproszenia</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8 px-6">
            <p className="text-gray-500">Ładowanie zaproszeń...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex justify-center items-center py-8 px-6">
            <p className="text-gray-500">Brak zaproszeń</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <div className="flex flex-col gap-4 py-4">
              {invitations.map((invitation) => {
                const event = invitation.event
                const isProcessing = processing.has(invitation.id)
                
                return (
                  <div
                    key={invitation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{event?.name || "Nieznane wydarzenie"}</h3>
                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6z"/>
                            </svg>
                            <span>
                              {formatDate(event?.date)}
                              {event?.time_start && `, ${formatTime(event.time_start)}`}
                              {event?.time_end && ` - ${formatTime(event.time_end)}`}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Zaproszenie od: </span>
                            <span className="font-medium">{invitation.sender?.username || invitation.sender?.email || "Nieznany użytkownik"}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Organizator: </span>
                            <span className="font-medium">
                              {event?.creator_id === user.id ? "Ty" : (event?.creatorUsername || "Nieznany")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2 border-t border-gray-200">
                        <Button
                          onClick={() => handleAccept(invitation.id, event?.id)}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isProcessing ? "Przetwarzanie..." : "Zaakceptuj"}
                        </Button>
                        <Button
                          onClick={() => handleDecline(invitation.id)}
                          disabled={isProcessing}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {isProcessing ? "Przetwarzanie..." : "Odrzuć"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

