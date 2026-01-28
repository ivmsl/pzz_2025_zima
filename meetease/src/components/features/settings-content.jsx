/**
 * @file settings-content.jsx
 * @brief Komponent strony ustawień konta użytkownika w aplikacji MeetEase
 *
 * Strona ustawień wyświetla dane użytkownika (e-mail, nazwa użytkownika) oraz umożliwia
 * edycję nazwy użytkownika i zmianę hasła przez osobne dialogi. Po zapisaniu zmian
 * odświeża stronę (router.refresh()) i pokazuje komunikaty sukcesu lub błędu.
 *
 * @component SettingsContent
 * @returns {JSX.Element} Widok ustawień z sekcją danych użytkownika i przyciskami akcji
 *
 * @param {Object} props
 * @param {Object} props.user - Obiekt użytkownika z sesji (np. z Supabase Auth)
 * @param {string} [props.user.email] - Adres e-mail użytkownika
 * @param {string} [props.user.username] - Nazwa użytkownika (metadata)
 *
 * @state {boolean} usernameDialogOpen - Czy dialog zmiany nazwy użytkownika jest otwarty
 * @state {boolean} passwordDialogOpen - Czy dialog zmiany hasła jest otwarty
 * @state {string} usernameValue - Aktualna/nowa wartość nazwy użytkownika w formularzu
 * @state {Object} passwordForm - Pola formularza hasła: current, next, confirm
 * @state {Object} loading - Stan ładowania: { username: boolean, password: boolean }
 * @state {Object|null} feedback - Komunikat globalny: { type: "success"|"error", message: string }
 * @state {Object|null} passwordDialogFeedback - Komunikat w dialogu hasła (ten sam format)
 *
 * @description
 * Zmiana nazwy: walidacja (niepusta), updateUsernameAction (server action), przy sukcesie
 * zamknięcie dialogu i router.refresh(). Zmiana hasła: walidacja (nowe min. 6 znaków,
 * zgodność nowe/potwierdzenie), signInWithPassword (weryfikacja bieżącego), updateUser
 * (Supabase), przy sukcesie zamknięcie dialogu i czyszczenie pól. Link „Zamknij” prowadzi
 * do /dashboard.
 *
 * @see createClient - Klient Supabase (@/utils/supabase/client)
 * @see updateUsernameAction - Server action (@/app/settings/actions)
 */




"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { createClient } from "@/utils/supabase/client"
import { updateUsernameAction } from "@/app/settings/actions"

export default function SettingsContent({ user }) {
  const router = useRouter()
  const supabase = createClient()

  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const [usernameValue, setUsernameValue] = useState(user.username || "")
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: ""
  })

  const [loading, setLoading] = useState({
    username: false,
    password: false
  })

  const [feedback, setFeedback] = useState(null)
  const [passwordDialogFeedback, setPasswordDialogFeedback] = useState(null)

  const handleUsernameSubmit = async (event) => {
    event.preventDefault()
    if (!usernameValue.trim()) {
      setFeedback({ type: "error", message: "Nazwa użytkownika nie może być pusta." })
      return
    }

    setLoading((prev) => ({ ...prev, username: true }))
    setFeedback(null)

    const newUsername = usernameValue.trim()

    const result = await updateUsernameAction(newUsername)

    if (result?.error) {
      setFeedback({
        type: "error",
        message: result.error || "Nie udało się zaktualizować nazwy użytkownika."
      })
    } else {
      setFeedback({
        type: "success",
        message: "Nazwa użytkownika została zaktualizowana."
      })
      setUsernameDialogOpen(false)
      router.refresh()
    }

    setLoading((prev) => ({ ...prev, username: false }))
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordDialogFeedback(null)

    if (passwordForm.next.length < 6) {
      setPasswordDialogFeedback({ type: "error", message: "Nowe hasło powinno mieć co najmniej 6 znaków." })
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordDialogFeedback({ type: "error", message: "Nowe hasła muszą być takie same." })
      return
    }

    setLoading((prev) => ({ ...prev, password: true }))
    setFeedback(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.current
    })

    if (signInError) {
      setPasswordDialogFeedback({ type: "error", message: "Bieżące hasło jest nieprawidłowe." })
      setLoading((prev) => ({ ...prev, password: false }))
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.next
    })

    if (updateError) {
      setPasswordDialogFeedback({ type: "error", message: updateError.message })
    } else {
      setFeedback({ type: "success", message: "Hasło zostało zmienione." })
      setPasswordDialogOpen(false)
      setPasswordForm({ current: "", next: "", confirm: "" })
      setPasswordDialogFeedback(null)
    }

    setLoading((prev) => ({ ...prev, password: false }))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12 relative">
      <Button asChild variant="ghost" className="absolute top-6 right-6 text-gray-600 hover:text-gray-900">
        <Link href="/dashboard">Zamknij</Link>
      </Button>
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold">Ustawienia konta</h1>
          <p className="text-gray-600">
            Zarządzaj swoimi danymi logowania oraz podstawowymi informacjami.
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-3">Informacje o użytkowniku</h2>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Adres e-mail</span>
                <span className="text-lg">{user.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Nazwa użytkownika</span>
                <span className="text-lg">{usernameValue || "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => setUsernameDialogOpen(true)}>
              Zmień nazwę użytkownika
            </Button>
            <Button onClick={() => setPasswordDialogOpen(true)}>
              Zmień hasło
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień nazwę użytkownika</DialogTitle>
            <DialogDescription>
              Podaj nową nazwę, która będzie widoczna dla innych uczestników wydarzeń.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-6" onSubmit={handleUsernameSubmit}>
            <div className="flex flex-col gap-6">
              <input
                type="text"
                value={usernameValue}
                onChange={(event) => setUsernameValue(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nowa nazwa użytkownika"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setUsernameDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={loading.username}>
                {loading.username ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open)
          if (!open) {
            setPasswordDialogFeedback(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień hasło</DialogTitle>
            <DialogDescription>
              Wprowadź obecne hasło oraz nowe hasło, aby zaktualizować dane logowania.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-6" onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-6">
              <input
                type="password"
                value={passwordForm.current}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, current: event.target.value }))
                }
                placeholder="Aktualne hasło"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={passwordForm.next}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, next: event.target.value }))
                }
                placeholder="Nowe hasło"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                }
                placeholder="Powtórz nowe hasło"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {passwordDialogFeedback && (
              <div
                className={`rounded-lg border px-4 py-2 text-sm ${
                  passwordDialogFeedback.type === "success"
                    ? "border-green-200 bg-green-50 text-green-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                {passwordDialogFeedback.message}
              </div>
            )}
            <DialogFooter className="mt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setPasswordDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={loading.password}>
                {loading.password ? "Aktualizowanie..." : "Zapisz"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


