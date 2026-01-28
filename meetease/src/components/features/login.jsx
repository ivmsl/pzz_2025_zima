/**
 * @brief Komponent  okna logowania
 *
 * Komponent  okna logowania, pozwala na wprowadzenie danych logowania i logowanie do aplikacji.
 *
 * @returns {JSX.Element} Komponent modalnego okna logowania
 *
 * @details
 * - Funkcja pobiera dane użytkownika.
 * - Funkcja korzysta z serverowych funkcji supabase do logowania.
 * 
 * @see supabase
 * @see createClient
 */


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function LoginComponent({ onClose }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      {/* Modal */}
    <div className="bg-gray-200 p-4 rounded-3xl w-[420px] h-[300px] relative shadow-xl">
        {/* Close button */}
        
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
            />

            <input
                placeholder="Hasło"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-400 p-3 rounded-xl bg-white w-full"
            />

            {error && (
                <p className="text-red-600 text-sm text-center w-full">{error}</p>
            )}

            <Button
                type="submit"
                className="w-full py-3 rounded-xl text-lg bg-blue-600 hover:bg-blue-700"
            >
                Zaloguj
            </Button>
            </form>
        </div>
        
      </div>
    </div>
  )
}
