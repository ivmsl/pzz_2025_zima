"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function FriendsList({ userId }) {
    const supabase = createClient()
    const [acceptedFriends, setAcceptedFriends] = useState([])
    const [pendingFriends, setPendingFriends] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState(null) // Do blokowania przycisków podczas klikania

    // --- Funkcja Akceptacji ---
    const handleAccept = async (friendId) => {
        setActionLoading(friendId)

        // Aktualizujemy status na 'accepted'.
        // Szukamy relacji w obie strony, żeby mieć pewność, że trafimy w dobry wiersz.
        const { error } = await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

        if (error) {
            console.error("Błąd akceptacji:", error)
            alert("Nie udało się zaakceptować zaproszenia.")
        } else {
            // Aktualizacja stanu lokalnego (UI) bez odświeżania strony
            const friendToMove = pendingFriends.find(f => f.id === friendId)
            if (friendToMove) {
                setPendingFriends(prev => prev.filter(f => f.id !== friendId))
                setAcceptedFriends(prev => [...prev, { ...friendToMove, status: 'accepted' }])
            }
        }
        setActionLoading(null)
    }

    // --- Funkcja Odrzucenia ---
    const handleReject = async (friendId) => {
        if (!confirm("Czy na pewno chcesz odrzucić/usunąć tego znajomego?")) return;

        setActionLoading(friendId)

        // Usuwamy wiersz z bazy
        const { error } = await supabase
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

        if (error) {
            console.error("Błąd usuwania:", error)
            alert("Nie udało się usunąć.")
        } else {
            // Usuwamy z listy lokalnej
            setPendingFriends(prev => prev.filter(f => f.id !== friendId))
            setAcceptedFriends(prev => prev.filter(f => f.id !== friendId))
        }
        setActionLoading(null)
    }

    useEffect(() => {
        const fetchFriends = async () => {
            if (!userId) {
                setError("Brak identyfikatora użytkownika.")
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            const { data: relations, error } = await supabase
                .from('friends')
                .select(`
                    status,
                    user_id,
                    friend_id,
                    user_profile:profiles!user_id (email, username),
                    friend_profile:profiles!friend_id (email, username)
                `)
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

            if (error) {
                console.error("Błąd ładowania znajomych:", JSON.stringify(error, null, 2))
                setError("Wystąpił błąd podczas ładowania listy znajomych.")
                setLoading(false)
                return
            }

            const accepted = []
            const pending = []

            if (relations) {
                relations.forEach(relation => {
                    const isCurrentUserSender = relation.user_id === userId

                    const friendDetails = isCurrentUserSender
                        ? relation.friend_profile
                        : relation.user_profile

                    if (!friendDetails) return

                    const displayName = friendDetails.username || friendDetails.email || "Nieznany Użytkownik"

                    const friendData = {
                        id: isCurrentUserSender ? relation.friend_id : relation.user_id,
                        name: displayName,
                        email: friendDetails.email,
                        status: relation.status,
                        // WAŻNE: Dodajemy flagę, czy to my wysłaliśmy zaproszenie
                        initiatedByMe: isCurrentUserSender
                    }

                    if (relation.status === 'accepted') {
                        accepted.push(friendData)
                    } else if (relation.status === 'requested') {
                        pending.push(friendData)
                    }
                })
            }

            setAcceptedFriends(accepted)
            setPendingFriends(pending)
            setLoading(false)
        }

        fetchFriends()
    }, [userId])

    if (loading) return <div className="p-8 text-center">Ładowanie listy znajomych...</div>
    if (error) return <div className="p-8 text-red-600 text-center">{error}</div>

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Lista Znajomych</h1>

            {/* --- Sekcja 1: Znajomi (Accepted) --- */}
            <h2 className="text-2xl font-semibold mt-6 mb-3 border-b pb-2">
                Znajomi ({acceptedFriends.length})
            </h2>
            {acceptedFriends.length === 0 ? (
                <p className="text-gray-500">Brak zaakceptowanych znajomych.</p>
            ) : (
                <ul className="space-y-3">
                    {acceptedFriends.map((friend) => (
                        <li key={friend.id} className="p-3 bg-green-50 rounded-lg shadow-sm border border-green-100 flex justify-between items-center">
                            <div>
                                <span className="font-medium block">{friend.name}</span>
                                <span className="text-sm text-gray-600">{friend.email}</span>
                            </div>
                            <button
                                onClick={() => handleReject(friend.id)}
                                className="text-xs text-red-500 hover:text-red-700 underline"
                                disabled={actionLoading === friend.id}
                            >
                                Usuń
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* --- Sekcja 2: Oczekujący Znajomi (Requested) --- */}
            <h2 className="text-2xl font-semibold mt-10 mb-3 border-b pb-2">
                Oczekujący ({pendingFriends.length})
            </h2>
            {pendingFriends.length === 0 ? (
                <p className="text-gray-500">Brak oczekujących zaproszeń.</p>
            ) : (
                <ul className="space-y-3">
                    {pendingFriends.map((friend) => (
                        <li key={friend.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm flex justify-between items-center">
                            <div>
                                <span className="font-medium block">{friend.name}</span>
                                <span className="text-sm text-yellow-800">
                                    {friend.initiatedByMe ? "Wysłano zaproszenie" : "Otrzymano zaproszenie"}
                                </span>
                                <span className="text-xs text-gray-500 block">{friend.email}</span>
                            </div>

                            {/* Wyświetlamy przyciski TYLKO jeśli to nie my wysłaliśmy zaproszenie */}
                            <div className="flex gap-2">
                                {friend.initiatedByMe ? (
                                    <button
                                        onClick={() => handleReject(friend.id)}
                                        className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300 transition"
                                        disabled={actionLoading === friend.id}
                                    >
                                        Anuluj
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAccept(friend.id)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition shadow-sm"
                                            disabled={actionLoading === friend.id}
                                        >
                                            {actionLoading === friend.id ? "..." : "Akceptuj"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(friend.id)}
                                            className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-sm hover:bg-red-50 transition"
                                            disabled={actionLoading === friend.id}
                                        >
                                            Odrzuć
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}