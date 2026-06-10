import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a pass-through response. The Supabase client mutates this via
  // setAll when it refreshes the session, so we must return THIS object (or a
  // redirect that copies its cookies) for the refreshed cookies to persist.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies back to BOTH the request (so getUser sees
          // them this pass) and a fresh response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run any logic between createServerClient and getUser().
  // getUser() revalidates the token against the Supabase Auth server and
  // triggers a cookie refresh (via setAll above) when needed.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // --- DEBUG: temporary logging to diagnose the redirect loop ---
  // eslint-disable-next-line no-console
  console.log(
    '[middleware]',
    request.nextUrl.pathname,
    'cookies:',
    request.cookies.getAll().map((c) => c.name),
    'user:',
    user?.id ?? 'NONE',
    'error:',
    error?.message ?? 'none'
  )
  // Surface the full error object for network/fetch failures (wrong URL/key, etc.)
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[middleware] getUser error detail:', {
      message: error.message,
      status: (error as { status?: number }).status,
      name: error.name,
      supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    })
  }
  // --- END DEBUG ---

  const { pathname } = request.nextUrl

  // Helper: build a redirect that carries over any refreshed auth cookies.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie)
    })
    return redirect
  }

  // No authenticated user → bounce protected routes to login.
  // /onboarding requires a user but does NOT bounce users whose onboarded_at is
  // still null — that is exactly who needs to be there.
  if (!user && (pathname.startsWith('/tracker') || pathname.startsWith('/onboarding'))) {
    return redirectTo('/auth/login')
  }

  // Authenticated user on an auth page → send to the tracker.
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return redirectTo('/tracker')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/tracker/:path*', '/onboarding', '/auth/login', '/auth/signup'],
}
