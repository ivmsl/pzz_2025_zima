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

export default function sendFriendInviteModal({ username }) {
    const supabase = createClientComponentClient()
    const [usernameInput, setUsernameInput] = useState(username || "")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const sendFriendInvite = async (e) => {
        e.preventDefault()

        setError(null)
        setLoading(true)

        const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", usernameInput)
            .single()

        if (userError || !userData) {
            setError("Nie znaleziono użytkownika o podanej nazwie.")
            setLoading(false)
            return
        }

        const { error: inviteError } = await supabase
            .from("friend_invites")
            .insert({
                sender_id: (await supabase.auth.getUser()).data.user.id,
                receiver_id: userData.id,
            })

        if (inviteError) {
            setError("Wystąpił błąd podczas wysyłania zaproszenia.")
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">
                        Dodaj do znajomych
                    </DialogTitle>
                </DialogHeader>

                <form className="flex gap-4 flex-col" onSubmit={sendFriendInvite}>
                    <Input
                        type="text"
                        placeholder="Podaj nazwe użytkownika"
                        value={code}
                        onChange={(e) => setUsernameInput(e.target.value)}
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
                            {loading ? "Wysyłanie zaproszenia..." : "Dodaj znajomego"}
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