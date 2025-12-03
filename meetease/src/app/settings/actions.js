"use server"

import { createClient } from "@/utils/supabase/server"

export async function updateUsernameAction(newUsername) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: userError?.message || "Nie udało się pobrać danych użytkownika."
    }
  }

  const { data: existingProfile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (profileFetchError) {
    return { error: profileFetchError.message }
  }

  let profileError = null
  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", user.id)
    profileError = error
  } else {
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username: newUsername, email: user.email })
    profileError = error
  }

  if (profileError) {
    return { error: profileError.message }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { username: newUsername }
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}


