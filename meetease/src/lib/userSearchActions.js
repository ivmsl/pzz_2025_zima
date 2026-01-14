"use server"

import { createClient } from "@/utils/supabase/server"

export async function searchUsersByUsername(searchQuery) {
    if (!searchQuery || searchQuery.trim().length < 1) {
        return []
    }
    
    const supabase = await createClient()
    const query = searchQuery.trim()
    
    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .ilike("username", `%${query}%`)
        .limit(10)
    
    if (error) {
        console.error("Error searching users:", error)
        return []
    }
    
    return users || []
}

export async function fetchAllUsers() {
    const supabase = await createClient()
    
    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .order("username", { ascending: true })
        .limit(100) // Limit to prevent too many results
    
    if (error) {
        console.error("Error fetching users:", error)
        return []
    }
    
    return users || []
}

