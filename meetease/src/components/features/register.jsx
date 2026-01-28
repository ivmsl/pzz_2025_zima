/**
 * @file register.jsx
 * @brief Komponent rejestracji użytkownika w aplikacji MeetEase
 *
 * Pełnoekranowy modal rejestracji umożliwiający utworzenie nowego konta. Wyświetla formularz
 * z polami: nazwa użytkownika, e-mail, hasło i potwierdzenie hasła. Po pomyślnej rejestracji
 * zamyka modal i przekierowuje użytkownika na dashboard.
 *
 * @component RegisterComponent
 * @returns {JSX.Element} Modal z formularzem rejestracji
 *
 * @param {Object} props
 * @param {Function} [props.onClose] - Opcjonalna funkcja wywoływana po zamknięciu modala
 *                                    (np. po sukcesie lub kliknięciu przycisku ×)
 *
 * @state {string} username - Nazwa użytkownika (max 50 znaków)
 * @state {string} email - Adres e-mail (max 50 znaków)
 * @state {string} password - Hasło
 * @state {string} confirmPassword - Potwierdzenie hasła
 * @state {string} error - Komunikat błędu walidacji lub błędu Supabase
 *
 * @description
 * Walidacja przed wysłaniem:
 * - Długość nazwy użytkownika i e-maila ograniczona do MAX_FIELD_LENGTH (50).
 * - Sprawdzenie zgodności hasła i potwierdzenia hasła.
 * Rejestracja odbywa się przez Supabase Auth (signUp) z metadanymi username.
 * W razie błędu wyświetlany jest komunikat; przy sukcesie wywoływane jest onClose
 * i następuje przekierowanie na /dashboard.
 *
 * @see useRouter - Next.js (next/navigation) do przekierowania
 * @see createClient - Klient Supabase (@/utils/supabase/client)
 */


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function RegisterComponent({ onClose }) {
  const MAX_FIELD_LENGTH = 50
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    setError("")

    const usernameTooLong = username.length > MAX_FIELD_LENGTH
    const emailTooLong = email.length > MAX_FIELD_LENGTH

    if (usernameTooLong && emailTooLong) {
      setError(`Nazwa użytkownika i adres e-mail mogą mieć maksymalnie ${MAX_FIELD_LENGTH} znaków`)
      return
    }
    if (usernameTooLong) {
      setError(`Nazwa użytkownika może mieć maksymalnie ${MAX_FIELD_LENGTH} znaków`)
      return
    }
    if (emailTooLong) {
      setError(`Adres e-mail może mieć maksymalnie ${MAX_FIELD_LENGTH} znaków`)
      return
    }

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
            maxLength={MAX_FIELD_LENGTH}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white"
          />
          <p className="text-xs text-gray-600 -mt-2">
            Maksymalna długość nazwy użytkownika wynosi {MAX_FIELD_LENGTH} znaków
          </p>

          {/* Email */}
          <input
            placeholder="Email"
            value={email}
            maxLength={MAX_FIELD_LENGTH}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-400 p-3 rounded-xl bg-white"
          />
          <p className="text-xs text-gray-600 -mt-2">
            Maksymalna długość adresu e-mail wynosi {MAX_FIELD_LENGTH} znaków
          </p>

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
