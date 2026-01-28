/**
 * @brief Komponent modalnego okna dołączania do wydarzenia
 *
 * Komponent modalnego okna dołączania do wydarzenia, pozwala na wprowadzenie kodu wydarzenia i dołączenie do wydarzenia.
 *
 * @returns {JSX.Element} Komponent modalnego okna dołączania do wydarzenia
 * 
 * @param {Object} user - Użytkownik
 * @param {boolean} open - Czy jest otwarte
 * @param {Function} onClose - Funkcja do zamknięcia modalnego okna
 * @param {Function} onJoinEvent - Funkcja do dołączania do wydarzenia
 *
 * @see serverActions
 */



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


export default function JoinEventModal({ user, open, onClose, onJoinEvent }) {
    
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const joinEvent = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (onJoinEvent) {
            const { success, error } = await onJoinEvent(code, user.id)
            if (error) {
                setError(error)
            } else {
                setError(null)
                onClose(false)
                
            }
            console.log("Success:", success, "Error:", error)
        }


        setLoading(false)

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