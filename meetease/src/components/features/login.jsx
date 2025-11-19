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
    <div className="bg-[#E6E6E6] p-10 rounded-3xl w-[420px] h-[300px] space-y-6 relative shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-3xl text-black hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-3xl font-semibold text-center mb-10">Logowanie</h2>

        <div className="flex flex-col gap-4 mt-10">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white mt-10"
          />

          <input
            placeholder="Hasło"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white"
          />

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl text-lg bg-blue-600 hover:bg-blue-700 mt-4"
          >
            Zaloguj
          </Button>
        </div>
      </div>
    </div>
  )
}
