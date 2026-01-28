/**
 * Klient Supabase po stronie serwera (Next.js): tworzy instancję klienta z dostępem
 * do ciasteczek z next/headers, używany w Server Components i Server Actions.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Tworzy klienta Supabase dla kontekstu serwera (Server Components / Server Actions).
 * Wymaga NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; przy braku zmiennych rzuca wyjątek.
 * Używa cookies() z next/headers do odczytu i zapisu sesji; setAll w try/catch ignoruje błąd wywołania z Server Component (sesja odświeżana w middleware).
 * @returns {Promise<ReturnType<createServerClient>>} - Instancja klienta Supabase
 */
export async function createClient() {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'Missing Supabase environment variables. Please check:\n' +
            `- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗ Missing'}\n` +
            `- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? '✓' : '✗ Missing'}`
        )
    }

    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value))
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}