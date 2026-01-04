"use client"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { notifyEventAdded, notifyHostGuestAccepted } from "@/lib/notificationService"

export default function JoinEventModal({ user, open, onClose, onJoinEvent }) {
    const supabase = createClientComponentClient()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const joinEvent = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (onJoinEvent) {
            const result = await onJoinEvent(code, user.id)
            if (result.error) {
                setError(result.error)
            } else if (result.success) {
                setError(null)
                
                // Send notification to guest (current user) immediately
                if (result.event) {
                    notifyEventAdded(result.event, null)
                }
                
                onClose(false)
            }
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">
                        Dołącz do wydarzenia
                    </DialogTitle>
                </DialogHeader>

                <form className="flex gap-4 flex-col" onSubmit={joinEvent}>
                    <Input
                        type="text"
                        placeholder="Podaj kod"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    {error && (
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    )}

                    <div className="flex justify-center gap-2 w-full">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                            {loading ? "Dołączanie..." : "Dołącz"}
                        </Button>

                        <DialogClose asChild>
                            <Button className="w-full">Zamknij</Button>
                        </DialogClose>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}