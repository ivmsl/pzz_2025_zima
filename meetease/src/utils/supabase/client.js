import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;


/**
 * Tworzy klient Supabase
 * 
 * @returns {SupabaseClient} - Klient Supabase
 */
export function createClient() {
    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    )
}