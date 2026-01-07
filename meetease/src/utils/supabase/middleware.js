import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request) {
    let supabaseResponse = NextResponse.next()

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 1. ZMIANA: Używamy getUser() - to standardowa metoda do sprawdzania autoryzacji
    // To automatycznie odświeży token, jeśli jest stary.
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Logika ścieżek
    const publicPaths = ['/', '/login', '/auth'];
    const { pathname } = request.nextUrl;

    // Prostsza logika sprawdzania ścieżek
    const isPublicPath = publicPaths.includes(pathname);
    // Sprawdzamy, czy ścieżka zaczyna się od np. /auth (ale ignorujemy sam znak /)
    const isStartingWithPublicPath = publicPaths.some(path => pathname.startsWith(path) && path !== '/');

    // 3. ZMIANA: Poprawiony warunek IF (&& zamiast &)
    if (
        !user && // Jeśli nie ma użytkownika
        !isPublicPath && // I nie jest to ścieżka publiczna
        !isStartingWithPublicPath // I nie zaczyna się od ścieżki publicznej
    ) {
        // Przekieruj na login
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}