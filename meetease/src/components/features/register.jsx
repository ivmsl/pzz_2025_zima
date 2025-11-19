"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function RegisterComponent({ onClose }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    setError("")

    if (password !== confirmPassword) {
      setError("Hasła nie są takie same")
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      onClose?.()
      router.push("/dashboard")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start py-20 z-50">
      {/* Modal */}
      <div className="bg-gray-200 p-4 rounded-3xl w-[460px] space-y-8 relative shadow-xl">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-3xl text-black hover:text-gray-700"
        >
          ×
        </button>

        {/* Header */}
        

        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-center mb-6">Utwórz konto</h2>  
          {/* Username */}
          <input
            placeholder="Nazwa użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white"
          />

          {/* Email */}
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white"
          />

          {/* Extra spacing before password fields */}
          <div className="mt-3 flex flex-col gap-4">
            
            <input
              placeholder="Hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-400 p-3 rounded-xl bg-white"
            />

            <input
              placeholder="Powtórz hasło"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-gray-400 p-3 rounded-xl bg-white"
            />

          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Button
            onClick={handleRegister}
            className="w-full py-3 rounded-xl text-lg bg-blue-600 hover:bg-blue-700"
          >
            Utwórz konto
          </Button>
        </div>
      </div>
    </div>
  )
}
