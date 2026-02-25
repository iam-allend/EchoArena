import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const { data: { session } } = await supabase.auth.getSession()

  // ── 1. Rute butuh login ────────────────────────────────────────────────────
  const protectedRoutes = ['/dashboard', '/room', '/profile', '/admin', '/contributor']
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 2. /admin → hanya is_admin ────────────────────────────────────────────
  if (session && pathname.startsWith('/admin')) {
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_contributor, is_banned')
      .eq('id', session.user.id)
      .single()

    if (!user || user.is_banned) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!user.is_admin) {
      const dest = user.is_contributor ? '/contributor' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // ── 3. /contributor → is_contributor, is_admin, pending, atau rejected ────
  if (session && pathname.startsWith('/contributor')) {
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_contributor, is_banned, contributor_status')
      .eq('id', session.user.id)
      .single()

    if (!user || user.is_banned) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const canAccess =
      user.is_admin ||
      user.is_contributor ||
      user.contributor_status === 'pending' ||
      user.contributor_status === 'rejected'

    if (!canAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── 4. Sudah login, buka /auth/* → redirect ───────────────────────────────
  if (session && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/room/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/contributor/:path*',
    '/auth/login',
    '/auth/register',
  ],
}