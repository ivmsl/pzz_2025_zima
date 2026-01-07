"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
// Importujemy stworzoną akcję
import { loginAction } from "@/app/actions"

export default function LoginComponent({ onClose }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false) // Warto dodać stan ładowania

    const handleLogin = async () => {
        setError("")
        setLoading(true)

        // Wywołujemy Server Action
        // Nie potrzebujemy tu supabase.auth.signIn... ani router.push
        // Redirect nastąpi automatycznie z serwera jeśli się uda
        const result = await loginAction(email, password)

        // Jeśli funkcja zwróciła wynik, to znaczy że był błąd
        // (bo sukces kończy się redirectem i ten kod by się nie wykonał)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // Jeśli sukces -> nastąpi redirect z poziomu serwera,
        // więc onClose i tak przestanie mieć znaczenie, bo zmieni się strona.
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-200 p-4 rounded-3xl w-[420px] h-[300px] relative shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 text-3xl text-black hover:text-gray-700"
                >
                    ×
                </button>
                <div className="flex flex-col gap-4 w-full flex-1 justify-center items-center">
                    <h2 className="text-3xl font-semibold text-center mt-2 flex-1">Logowanie</h2>
                    <form
                        className="flex flex-col gap-4 w-full flex-1 justify-center items-center"
                        onSubmit={e => {
                            e.preventDefault();
                            handleLogin();
                        }}
                    >
                        <input
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-400 p-3 rounded-xl bg-white w-full"
                            disabled={loading}
                        />

                        <input
                            placeholder="Hasło"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border border-gray-400 p-3 rounded-xl bg-white w-full"
                            disabled={loading}
                        />

                        {error && (
                            <p className="text-red-600 text-sm text-center w-full">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-3 rounded-xl text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Logowanie..." : "Zaloguj"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}