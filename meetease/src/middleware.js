import { updateSession } from '@/utils/supabase/middleware'

export function middleware(request) {
    return updateSession(request)
}

export const config = {
    matcher: [
        '/((?!login|auth|_next/static|_next/image|api|favicon.ico).*)',
        '/dashboard/:path*',
    ],
}