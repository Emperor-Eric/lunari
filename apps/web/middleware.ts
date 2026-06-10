import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // No session → redirect to login for protected routes (tracker + onboarding).
  // Note: /onboarding requires a session but does NOT bounce users whose
  // onboarded_at is still null — that is exactly who needs to be there.
  if (!session && (pathname.startsWith('/tracker') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Session + auth pages → redirect to tracker
  if (session && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/tracker', request.url))
  }

  return response
}

export const config = {
  matcher: ['/tracker/:path*', '/onboarding', '/auth/login', '/auth/signup'],
}
