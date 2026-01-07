import SettingsContent from "@/components/features/settings-content"
import { getAuthenticatedUser } from "@/utils/auth"

export default async function SettingsPage() {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("id", user.id)
    .maybeSingle()

  const username = profile?.username ?? user.user_metadata?.username ?? ""
  const email = profile?.email ?? user.email ?? ""

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsContent
        user={{
          id: user.id,
          email,
          username
        }}
      />
    </div>
  )
}



