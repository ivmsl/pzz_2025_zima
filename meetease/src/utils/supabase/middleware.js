/**
 * Middleware Supabase dla Next.js: odświeżanie sesji użytkownika (cookies) oraz
 * ochrona tras — niezalogowani użytkownicy są przekierowywani na stronę główną,
 * z wyjątkiem ścieżek /login, /auth i /.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Odświeża sesję Supabase na podstawie ciasteczek żądania i ustawia nowe ciasteczka w odpowiedzi.
 * Sprawdza claims użytkownika (getClaims); jeśli użytkownik nie jest zalogowany i ścieżka nie jest
 * /login, /auth ani /, przekierowuje na stronę główną (/).
 * @param {NextRequest} request - Żądanie Next.js (dostęp do nextUrl, cookies)
 * @returns {Promise<NextResponse>} - Odpowiedź z ustawionymi ciasteczkami lub przekierowaniem na /
 */
export async function updateSession(request) {
    let supabaseResponse = NextResponse.next()

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    // return Array.from(request.cookies.entries()).map(([name, value]) => ({ name, value }))
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => supabaseResponse.cookies.set(name, value))
                },
            },
        }
    )

    const { data } = await supabase.auth.getClaims()
    const user = data?.claims

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') && 
        !request.nextUrl.pathname.startsWith('/')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}