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

export default function JoinEventModal({ user, open, onClose, onSubmit }) {
    const supabase = createClientComponentClient()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const joinEvent = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const { data: eventCode, error: codeError } = await supabase
            .from("event_codes")
            .select("*")
            .eq("code", code)
            .single()

        if (codeError || !eventCode) {
            setError("Nieprawidłowy kod wydarzenia")
            setLoading(false)
            return
        }

        const now = new Date()
        if (eventCode.expire_at && new Date(eventCode.expire_at) < now) {
            setError("Ten kod wydarzenia wygasł")
            setLoading(false)
            return
        }

        const eventId = eventCode.event_id

        const { data: existing } = await supabase
            .from("user_events")
            .select("*")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .maybeSingle()

        if (existing) {
            setError("Już jesteś uczestnikiem tego wydarzenia")
            setLoading(false)
            return
        }

        const { error: insertError } = await supabase
            .from("user_events")
            .insert({
                event_id: eventId,
                user_id: user.id
            })

        if (insertError) {
            setError("Wystąpił błąd podczas dołączania do wydarzenia")
            setLoading(false)
            return
        }

        setLoading(false)

        if (onSubmit) {
            onSubmit()
        }

        onClose(false)
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