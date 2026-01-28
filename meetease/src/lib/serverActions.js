import {
  createEvent,
  joinEventByCode,
  leaveEvent,
  updateEvent,
  deleteEvent,
  fetchEventsByUserId,
} from "@/lib/eventService";
import {
  fetchPendingInvitations,
  acceptPendingInvitation,
  declinePendingInvitation,
  searchUsersByUsername,
} from "@/lib/userService";
import {
  registerVote,
  castAVote,
  fetchVoteVotes,
  fetchVotedVotesForEvent,
  fetchVoteResultsEventUser,
} from "@/lib/voteService";
import { createClient } from "@/utils/supabase/server";

/**
 * Akcja serwera: tworzy nowe wydarzenie i rejestruje powiązane głosowania.
 * Wywołuje createEvent z eventService, a następnie registerVote dla voteObjects.
 * @param {Object} eventData - Dane wydarzenia (nazwa, data, uczestnicy itd.) oraz opcjonalnie voteObjects
 * @returns {Promise<void>} - Nie zwraca ustandaryzowanego obiektu; błędy głosowań są tylko logowane
 */
async function handleCreateEventServerAction(eventData) {
  "use server";

  const { voteObjects, ...eventDataToHandle } = eventData;
  const event = await createEvent(eventDataToHandle);

  if (event && event.id) {
    await registerVote(voteObjects, event.id).catch((error) => {
      console.error("Error registering vote:", error);
      return { success: false, error: error.message };
    });
  }

  console.log("Event created:", event);
  // redirect("/dashboard")
}

/**
 * Akcja serwera: dołącza użytkownika do wydarzenia na podstawie kodu zaproszenia.
 * Opakowuje joinEventByCode i zwraca ustandaryzowany wynik { success, error }.
 * @param {string} code - Kod zaproszenia do wydarzenia
 * @param {string} userId - Identyfikator użytkownika dołączającego
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleJoinEventServerAction(code, userId) {
  "use server";
  const { success, error } = await joinEventByCode(code, userId);
  if (error) {
    return { success: false, error: error };
  } else {
    return { success: true, error: null };
  }
}

/**
 * Akcja serwera: usuwa użytkownika z listy uczestników wydarzenia.
 * Opakowuje leaveEvent z eventService i zwraca { success, error }.
 * @param {string} eventId - Identyfikator wydarzenia
 * @param {string} userId - Identyfikator użytkownika opuszczającego wydarzenie
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleLeaveEventServerAction(eventId, userId) {
  "use server";
  const { success, error } = await leaveEvent(eventId, userId);
  if (error) {
    return { success: false, error: error };
  } else {
    return { success: true, error: null };
  }
}

/**
 * Akcja serwera: aktualizuje istniejące wydarzenie (tylko twórca).
 * Opakowuje updateEvent i zwraca ustandaryzowany wynik; updateEvent może rzucić wyjątek.
 * @param {string} eventId - Identyfikator wydarzenia do aktualizacji
 * @param {Object} eventData - Zaktualizowane dane (nazwa, data, uczestnicy, zaproszeni itd.)
 * @param {string} userId - Identyfikator użytkownika (musi być twórcą)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleUpdateEventServerAction(eventId, eventData, userId) {
  "use server";
  const { success, error } = await updateEvent(eventId, eventData, userId);
  if (error) {
    return { success: false, error: error };
  } else {
    return { success: true, error: null };
  }
}

/**
 * Akcja serwera: usuwa wydarzenie (tylko twórca). Opakowuje deleteEvent z eventService.
 * Używa bieżącego użytkownika z getAuthenticatedUser wewnątrz deleteEvent.
 * @param {string} eventId - Identyfikator wydarzenia do usunięcia
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleDeleteEventServerAction(eventId) {
  "use server";
  await deleteEvent(eventId)
    .then((_) => {
      return { success: true, error: null };
    })
    .catch((error) => {
      console.error("Error deleting event:", error);
      return { success: false, error: error.message };
    });
}

/**
 * Akcja serwera: pobiera wszystkie wydarzenia, w których uczestniczy zalogowany użytkownik
 * (utworzone przez niego oraz te, do których dołączył). Wywołuje fetchEventsByUserId bez argumentu.
 * @returns {Promise<{success: boolean, events: Array, error: string|null}>}
 */
async function handleFetchParticipatingEvents() {
  "use server";
  try {
    const events = await fetchEventsByUserId();
    return { success: true, events, error: null };
  } catch (error) {
    console.error("Error fetching participating events:", error);
    return { success: false, events: [], error: error.message };
  }
}

/**
 * Akcja serwera: pobiera listę oczekujących zaproszeń do wydarzeń dla użytkownika.
 * Opakowuje fetchPendingInvitations z userService.
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, invitations: Array, error: string|null}>}
 */
async function handleFetchPendingInvitations(userId) {
  "use server";
  try {
    const invitations = await fetchPendingInvitations(userId);
    return { success: true, invitations, error: null };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return { success: false, invitations: [], error: error.message };
  }
}

/**
 * Akcja serwera: akceptuje zaproszenie do wydarzenia i dodaje użytkownika do uczestników.
 * Opakowuje acceptPendingInvitation(inviteId, eventId).
 * @param {string} inviteId - Identyfikator zaproszenia
 * @param {string} eventId - Identyfikator wydarzenia
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleAcceptInvitation(inviteId, eventId) {
  "use server";
  try {
    const { success, error } = await acceptPendingInvitation(inviteId, eventId);
    if (error) {
      return { success: false, error: error };
    } else {
      return { success: true, error: null };
    }
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: odrzuca zaproszenie do wydarzenia (usuwa/aktualizuje zaproszenie bez dołączania).
 * Opakowuje declinePendingInvitation z userService.
 * @param {string} inviteId - Identyfikator zaproszenia do odrzucenia
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleDeclineInvitation(inviteId) {
  "use server";
  try {
    const { success, error } = await declinePendingInvitation(inviteId);
    if (error) {
      return { success: false, error: error };
    } else {
      return { success: true, error: null };
    }
  } catch (error) {
    console.error("Error declining invitation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: wyszukuje użytkowników po nazwie użytkownika (username).
 * Opakowuje searchUsersByUsername; przy błędzie zwraca pustą tablicę.
 * @param {string} query - Fraza do wyszukania (np. fragment username)
 * @returns {Promise<Array>} - Tablica znalezionych użytkowników lub []
 */
async function handleSearchUserByUsername(query) {
  "use server";
  return await searchUsersByUsername(query)
    .then((users) => {
      console.log("users", users);
      return users;
    })
    .catch((error) => {
      console.error("Error searching users:", error);
      return [];
    });
}

/**
 * Akcja serwera: oddaje głos w głosowaniu (jedna opcja). Opakowuje castAVote z voteService.
 * @param {string} voteId - Identyfikator głosowania
 * @param {string} optionId - Identyfikator wybranej opcji
 * @param {string} userId - Identyfikator użytkownika głosującego
 * @returns {Promise<{success: boolean, res: *|null, error: string|null}>}
 */
async function handleCastAVote(voteId, optionId, userId) {
  "use server";
  try {
    const { success, error } = await castAVote(voteId, optionId, userId);
    if (error) {
      return { success: false, res: null, error: error };
    }
    return { success: true, res: success, error: null };
  } catch (error) {
    console.error("Error casting vote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: pobiera dane głosowania (głosy/opcje) dla danego vote.
 * Opakowuje fetchVoteVotes z voteService. W bloku catch zwraca { success: false, error }.
 * @param {string} voteId - Identyfikator głosowania
 * @returns {Promise<{success?: boolean, error?: string}>} - W try zwraca wynik fetchVoteVotes (bez success)
 */
async function handleFetchVoteVotes(voteId) {
  "use server";
  try {
    const { success, error } = await fetchVoteVotes(voteId);
    if (error) {
      return { success: false, error: error };
    }
  } catch (error) {
    console.error("Error fetching vote votes:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: pobiera wszystkie głosowania i ich wyniki dla wydarzenia.
 * Opakowuje fetchVotedVotesForEvent z voteService.
 * @param {string} eventId - Identyfikator wydarzenia
 * @returns {Promise<{success: boolean, votes: Array, error: string|null}>}
 */
async function handleFetchAllVoteResultsForEvent(eventId) {
  "use server";
  try {
    const votes = await fetchVotedVotesForEvent(eventId).catch((error) => {
      console.error("Error fetching voted votes for event:", error);
      return { success: false, votes: [], error: error.message };
    });
    console.log("votes: ", votes);
    return { success: true, votes, error: null };
  } catch (error) {
    console.error("Error fetching voted votes for event:", error);
    return { success: false, votes: [], error: error.message };
  }
}

/**
 * Akcja serwera: pobiera wyniki głosowań dla wydarzenia w kontekście użytkownika
 * (np. które opcje wybrał, podsumowania). Opakowuje fetchVoteResultsEventUser z voteService.
 * @param {string} eventId - Identyfikator wydarzenia
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, voteResults: Array, error: string|null}>}
 */
async function handleFetchVoteResultsEventUser(eventId, userId) {
  "use server";
  try {
    const voteResults = await fetchVoteResultsEventUser(eventId, userId);

    return { success: true, voteResults, error: null };
  } catch (error) {
    console.error("Error fetching vote results for event:", error);
    return { success: false, voteResults: [], error: error.message };
  }
}

/**
 * Akcja serwera: sprawdza, czy użytkownik już oddał głos w danym głosowaniu.
 * Wywołuje checkUserHasVoted (voteService). Przy błędzie zwraca hasVoted: false.
 * @param {string} userId - Identyfikator użytkownika
 * @param {string} voteId - Identyfikator głosowania
 * @returns {Promise<{success: boolean, hasVoted: boolean, error: string|null}>}
 */
async function handleCheckUserHasVoted(userId, voteId) {
  "use server";
  const hasVoted = await checkUserHasVoted(userId, voteId).catch((error) => {
    console.error("Error checking user has voted:", error);
    return { success: false, hasVoted: false, error: error.message };
  });
  return { success: true, hasVoted: hasVoted, error: null };
}

/**
 * Akcja serwera: oddaje głos w głosowaniu „ogólnym” (general) z pełną walidacją po stronie serwera.
 * Wewnętrznie: sprawdza, że opcja należy do głosowania, że głosowanie istnieje i nie jest zamknięte (deadline),
 * że użytkownik ma dostęp (twórca lub uczestnik wydarzenia), usuwa poprzedni głos użytkownika w tym głosowaniu,
 * wstawia nowy wpis do user_votes.
 * @param {string} voteId - Identyfikator głosowania
 * @param {string} optionId - Identyfikator wybranej opcji
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleCastGeneralVote(voteId, optionId, userId) {
  "use server";
  const supabase = await createClient();

  try {
    // Ensure option belongs to vote
    const { data: option } = await supabase
      .from("vote_options")
      .select("id, vote_id")
      .eq("id", optionId)
      .maybeSingle();

    if (!option || option.vote_id !== voteId) {
      return { success: false, error: "Invalid option" };
    }

    const { data: vote } = await supabase
      .from("votes")
      .select("id, event_id, deadline")
      .eq("id", voteId)
      .single();

    if (!vote) {
      return { success: false, error: "Vote not found" };
    }

    // Closed check (deadline in past => closed)
    if (vote.deadline && new Date(vote.deadline).getTime() <= Date.now()) {
      return { success: false, error: "Voting is closed" };
    }

    // Access check: creator or participant
    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", vote.event_id)
      .single();

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.creator_id !== userId) {
      const { data: membership } = await supabase
        .from("users_events")
        .select("user_id")
        .eq("user_id", userId)
        .eq("event_id", vote.event_id)
        .maybeSingle();

      if (!membership) {
        return { success: false, error: "No access" };
      }
    }

    // Delete previous vote by this user for this vote (any option of this vote)
    const { data: allOptions } = await supabase
      .from("vote_options")
      .select("id")
      .eq("vote_id", voteId);

    const allOptionIds = (allOptions || []).map((o) => o.id);
    if (allOptionIds.length > 0) {
      await supabase
        .from("user_votes")
        .delete()
        .eq("user_id", userId)
        .in("vote_option_id", allOptionIds);
    }

    const { error: insertError } = await supabase
      .from("user_votes")
      .insert({ user_id: userId, vote_option_id: optionId });

    if (insertError) {
      console.error("Error casting vote:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error casting vote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: zamyka głosowanie (tylko twórca wydarzenia). Ustawia deadline na „teraz”.
 * Dla głosowań typu location/time dodatkowo wylicza zwycięską opcję i zapisuje ją w wydarzeniu
 * (location, date/time_start/time_end, wyłącza time_poll_enabled/location_poll_enabled).
 * @param {string} voteId - Identyfikator głosowania
 * @param {string} userId - Identyfikator użytkownika (musi być twórcą wydarzenia)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleCloseGeneralVote(voteId, userId) {
  "use server";
  const supabase = await createClient();

  try {
    const { data: vote } = await supabase
      .from("votes")
      .select("id, event_id, deadline, type")
      .eq("id", voteId)
      .single();

    if (!vote) return { success: false, error: "Vote not found" };

    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", vote.event_id)
      .single();

    if (!event || event.creator_id !== userId) {
      return { success: false, error: "Only creator can close voting" };
    }

    const closeAt = new Date().toISOString();
    const { error } = await supabase
      .from("votes")
      .update({ deadline: closeAt })
      .eq("id", voteId);

    if (error) return { success: false, error: error.message };

    // Bonus: po zamknięciu głosowań specjalnych ustaw zwycięską opcję w evencie
    if (vote.type === "location" || vote.type === "time") {
      const { data: options } = await supabase
        .from("vote_options")
        .select("id, option_text")
        .eq("vote_id", voteId);

      const optionIds = (options || []).map((o) => o.id);
      const { data: userVotes } = await supabase
        .from("user_votes")
        .select("vote_option_id")
        .in(
          "vote_option_id",
          optionIds.length
            ? optionIds
            : ["00000000-0000-0000-0000-000000000000"],
        );

      const counts = {};
      for (const uv of userVotes || []) {
        counts[uv.vote_option_id] = (counts[uv.vote_option_id] || 0) + 1;
      }

      let winner = null;
      let winnerCount = -1;
      for (const opt of options || []) {
        const c = counts[opt.id] || 0;
        if (c > winnerCount) {
          winner = opt;
          winnerCount = c;
        }
      }

      if (winner?.option_text) {
        if (vote.type === "location") {
          await supabase
            .from("events")
            .update({
              location: winner.option_text,
              location_poll_enabled: false,
            })
            .eq("id", vote.event_id);
        } else if (vote.type === "time") {
          // expected: YYYY-MM-DD|HH:MM|HH:MM
          const [date, start, end] = String(winner.option_text).split("|");
          await supabase
            .from("events")
            .update({
              date: date || null,
              time_start: start || null,
              time_end: end || null,
              time_poll_enabled: false,
            })
            .eq("id", vote.event_id);
        }
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error closing vote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: usuwa głosowanie (tylko twórca wydarzenia). Wewnętrznie usuwa wpisy user_votes
 * dla opcji tego głosowania, potem vote_options, na końcu rekord głosowania z votes.
 * @param {string} voteId - Identyfikator głosowania do usunięcia
 * @param {string} userId - Identyfikator użytkownika (musi być twórcą wydarzenia)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function handleDeleteGeneralVote(voteId, userId) {
  "use server";
  const supabase = await createClient();

  try {
    const { data: vote } = await supabase
      .from("votes")
      .select("id, event_id")
      .eq("id", voteId)
      .single();

    if (!vote) return { success: false, error: "Vote not found" };

    const { data: event } = await supabase
      .from("events")
      .select("creator_id")
      .eq("id", vote.event_id)
      .single();

    if (!event || event.creator_id !== userId) {
      return { success: false, error: "Only creator can delete voting" };
    }

    const { data: options } = await supabase
      .from("vote_options")
      .select("id")
      .eq("vote_id", voteId);

    const optionIds = (options || []).map((o) => o.id);
    if (optionIds.length > 0) {
      await supabase
        .from("user_votes")
        .delete()
        .in("vote_option_id", optionIds);
    }

    await supabase.from("vote_options").delete().eq("vote_id", voteId);
    await supabase.from("votes").delete().eq("id", voteId);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting vote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: pobiera listę znajomych użytkownika (relacje z friends + profile).
 * Zwraca relacje gdzie user_id lub friend_id = userId, z polami status, initiatedByMe,
 * oraz danymi drugiej osoby (id, name, email).
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
async function handleFetchUserFriends(userId) {
  "use server";
  const supabase = await createClient();
  try {
    const { data: relations, error } = await supabase
      .from("friends")
      .select(
        `
                status, user_id, friend_id,
                user_profile:profiles!user_id (email, username),
                friend_profile:profiles!friend_id (email, username)
            `,
      )
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) throw error;

    const formatted = relations.map((rel) => {
      const isMeSender = rel.user_id === userId;
      const profile = isMeSender ? rel.friend_profile : rel.user_profile;
      return {
        id: isMeSender ? rel.friend_id : rel.user_id,
        name: profile.username || profile.email,
        email: profile.email,
        status: rel.status,
        initiatedByMe: isMeSender,
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Akcja serwera: akceptuje prośbę o znajomość (status „requested” → „accepted”).
 * Aktualizuje wiersz w friends gdzie user_id = friendId i friend_id = userId.
 * @param {string} friendId - Identyfikator użytkownika, który wysłał zaproszenie (user_id w relacji)
 * @param {string} userId - Identyfikator użytkownika akceptującego (friend_id w relacji)
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleAcceptFriendRequest(friendId, userId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("friends")
    .update({ status: "accepted" })
    .match({ user_id: friendId, friend_id: userId });
  return { success: !error, error };
}

/**
 * Akcja serwera: usuwa relację znajomości (w obie strony: A–B lub B–A).
 * Usuwa wiersz z friends gdzie (user_id, friend_id) = (userId, friendId) lub (friendId, userId).
 * @param {string} friendId - Identyfikator znajomego
 * @param {string} userId - Identyfikator bieżącego użytkownika
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleRemoveFriend(friendId, userId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("friends")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
    );

  return { success: !error, error };
}

/**
 * Akcja serwera: wysyła prośbę o znajomość do użytkownika o podanym username.
 * Wewnętrznie: wyszukuje użytkownika po username, sprawdza że to nie ten sam użytkownik,
 * że nie ma już relacji (zaproszenie lub znajomy), wstawia wiersz do friends ze statusem „requested”.
 * @param {string} senderId - Identyfikator wysyłającego
 * @param {string} targetUsername - Nazwa użytkownika (username) odbiorcy
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function handleSendFriendRequest(senderId, targetUsername) {
  "use server";
  const supabase = await createClient();

  try {
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email, username")
      .eq("username", targetUsername)
      .single();

    if (userError || !targetUser) {
      return {
        success: false,
        error: "Nie znaleziono użytkownika o podanej nazwie.",
      };
    }

    if (targetUser.id === senderId) {
      return { success: false, error: "Nie możesz zaprosić samego siebie." };
    }

    const { data: existing } = await supabase
      .from("friends")
      .select("status")
      .or(
        `and(user_id.eq.${senderId},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${senderId})`,
      )
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "Zaproszenie już istnieje lub jesteście już znajomymi.",
      };
    }

    const { error: insertError } = await supabase.from("friends").insert({
      user_id: senderId,
      friend_id: targetUser.id,
      status: "requested",
    });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error("Invite error:", error);
    return {
      success: false,
      error: "Wystąpił błąd podczas wysyłania zaproszenia.",
    };
  }
}

/**
 * Akcja serwera: pobiera powiadomienia użytkownika z tabeli notifications.
 * Zwraca do 15 najnowszych, posortowane po created_at malejąco.
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, notifications: Array, error: *}>}
 */
async function handleFetchNotifications(userId) {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  return { success: !error, notifications: data || [], error };
}

/**
 * Akcja serwera: oznacza wszystkie nieprzeczytane powiadomienia użytkownika jako przeczytane.
 * Aktualizuje notifications: read = true gdzie user_id = userId i read = false.
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleMarkAllAsRead(userId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  return { success: !error, error };
}

/**
 * Akcja serwera: oznacza jedno powiadomienie jako przeczytane.
 * Aktualizuje notifications: read = true gdzie id = notificationId.
 * @param {string} notificationId - Identyfikator powiadomienia
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleMarkAsRead(notificationId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  return { success: !error, error };
}

/**
 * Akcja serwera: usuwa jedno powiadomienie.
 * Usuwa wiersz z notifications gdzie id = notificationId.
 * @param {string} notificationId - Identyfikator powiadomienia
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleDeleteNotification(notificationId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  return { success: !error, error };
}

/**
 * Akcja serwera: usuwa wszystkie powiadomienia użytkownika.
 * Usuwa z notifications wszystkie wiersze gdzie user_id = userId.
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<{success: boolean, error: *}>}
 */
async function handleDeleteAllNotifications(userId) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);

  return { success: !error, error };
}

/**
 * Akcja serwera: pobiera wszystkie wydarzenia powiązane z użytkownikiem
 * (utworzone przez niego oraz te, w których uczestniczy), z uczestnikami i głosowaniami.
 * Opakowuje fetchEventsByUserId z eventService. Zwraca surową tablicę wydarzeń (bez obiektu success/error).
 * @param {string} userId - Identyfikator użytkownika
 * @returns {Promise<Array>} - Tablica wydarzeń
 */
async function handleFetchEventsByUserId(userId) {
  "use server";
  const events = await fetchEventsByUserId(userId);
  return events;
}

/**
 * @brief Zbiorczy obiekt akcji serwera (Server Actions) używanych w aplikacji MeetEase.
 * 
 * Zawiera handlery wywoływane z komponentów klienckich (np. formularze, przyciski)
 * do operacji na wydarzeniach, zaproszeniach, głosowaniach, znajomych i powiadomieniach.
 * Eksportowany jako domyślny eksport; import: `import serverActions from "@/lib/serverActions"`.
 * 
 * @see handleCreateEventServerAction - Tworzenie nowego wydarzenia
 * @see handleJoinEventServerAction - Dołączanie do wydarzenia
 * @see handleLeaveEventServerAction - Opuszczanie wydarzenia
 * @see handleUpdateEventServerAction - Aktualizacja wydarzenia
 * @see handleDeleteEventServerAction - Usuwanie wydarzenia
 * @see handleFetchParticipatingEvents - Pobieranie wydarzeń, w których uczestniczy użytkownik
 * @see handleFetchPendingInvitations - Pobieranie oczekujących zaproszeń
 * @see handleAcceptInvitation - Akceptowanie zaproszenia
 * @see handleDeclineInvitation - Odrzucanie zaproszenia
 * @see handleSearchUserByUsername - Wyszukiwanie użytkowników
 * @see handleCheckUserHasVoted - Sprawdzanie, czy użytkownik oddał głos w głosowaniu
 * @see handleFetchVoteVotes - Pobieranie głosów w głosowaniu
 * @see handleFetchAllVoteResultsForEvent - Pobieranie wyników głosowań dla wydarzenia
 * @see handleFetchVoteResultsEventUser - Pobieranie wyników głosowań dla wydarzenia w kontekście użytkownika
 * @see handleCastAVote - Oddawanie głosu w głosowaniu
 * @see handleCloseGeneralVote - Zamknięcie głosowania
 * @see handleDeleteGeneralVote - Usuwanie głosowania
 * @see handleRemoveFriend - Usuwanie znajomości
 * @see handleAcceptFriendRequest - Akceptowanie prośby o znajomość
 * @see handleFetchUserFriends - Pobieranie znajomych użytkownika
 * @see handleSendFriendRequest - Wysyłanie prośby o znajomość
 * @see handleMarkAllAsRead - Oznaczanie wszystkich powiadomień jako przeczytane
 * @see handleMarkAsRead - Oznaczanie powiadomienia jako przeczytane
 * @see handleFetchNotifications - Pobieranie powiadomień użytkownika
 * @see handleDeleteNotification - Usuwanie powiadomienia
 * @see handleDeleteAllNotifications - Usuwanie wszystkich powiadomień
 * @see handleFetchEventsByUserId - Pobieranie wydarzeń powiązanych z użytkownikiem
 */
const serverActions = {
  handleCreateEventServerAction,
  handleJoinEventServerAction,
  handleLeaveEventServerAction,
  handleUpdateEventServerAction,
  handleDeleteEventServerAction,
  handleFetchParticipatingEvents,
  handleFetchPendingInvitations,
  handleAcceptInvitation,
  handleDeclineInvitation,
  handleSearchUserByUsername,
  handleCheckUserHasVoted,
  handleFetchVoteVotes,
  handleFetchAllVoteResultsForEvent,
  handleFetchVoteResultsEventUser,
  handleCastAVote,
  handleCloseGeneralVote,
  handleDeleteGeneralVote,
  handleRemoveFriend,
  handleAcceptFriendRequest,
  handleFetchUserFriends,
  handleSendFriendRequest,
  handleMarkAllAsRead,
  handleMarkAsRead,
  handleFetchNotifications,
  handleDeleteNotification,
  handleDeleteAllNotifications,
  handleFetchEventsByUserId,
};
export default serverActions;
