import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  // Kalau ada error dari Supabase (misalnya link expired)
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/confirmed?status=error&message=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
            cookieStore.set({ name, value, ...options })
        },
        remove: (name, options) => {
            cookieStore.delete({ name, ...options })
        },
        },
    }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      // Cek role untuk redirect yang tepat
      const { data: user } = await supabase
        .from('users')
        .select('is_admin, is_contributor, contributor_status')
        .eq('id', data.user.id)
        .single()

      // Redirect ke halaman sukses dulu (tampil pesan konfirmasi)
      // lalu dari sana redirect ke panel yang sesuai
      const role = user?.is_admin
        ? 'admin'
        : user?.is_contributor
        ? 'contributor'
        : user?.contributor_status === 'pending' || user?.contributor_status === 'rejected'
        ? 'pending'
        : 'user'

      return NextResponse.redirect(
        new URL(`/auth/confirmed?status=success&role=${role}`, request.url)
      )
    }
  }

  // Fallback — link tidak valid atau sudah expired
  return NextResponse.redirect(
    new URL('/auth/confirmed?status=error&message=Link+tidak+valid+atau+sudah+kadaluarsa', request.url)
  )
}