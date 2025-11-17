"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {createClient} from "@/utils/supabase/client";

export default function LoginComponent({ onClose }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()
    const supabase = createClient();

    const handleLogin = async () => {
        setError("")
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
        } else {
            onClose?.()
            router.push("/dashboard")
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-96 space-y-4">
                <h2 className="text-2xl font-bold">Logowanie</h2>

                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    placeholder="Hasło"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <Button className="w-full" onClick={handleLogin}>
                        Zaloguj
                    </Button>

                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Zamknij
                    </Button>
                </div>
            </div>
        </div>
    )
}
