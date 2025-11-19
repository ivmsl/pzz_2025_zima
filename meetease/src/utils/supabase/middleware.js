import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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