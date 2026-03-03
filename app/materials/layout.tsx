'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy, Home, LayoutDashboard, LogIn, UserPlus,
  LogOut, User, Menu, X, BookOpen, ChevronRight,
  Sparkles,
} from 'lucide-react'

interface UserProfile {
  email: string
  is_admin: boolean
  is_contributor: boolean
}

export default function MaterialsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const sb       = createClient()

  const [user, setUser]         = useState<UserProfile | null>(null)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await sb.auth.getSession()
      if (session?.user) {
        const { data: profile } = await sb
          .from('users')
          .select('email, is_admin, is_contributor')
          .eq('id', session.user.id)
          .single()
        setUser(profile ?? { email: session.user.email ?? '', is_admin: false, is_contributor: false })
      }
      setChecking(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

    // 👇 TAMBAHKAN DI SINI
    useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
        if (!(e.target as HTMLElement).closest('.profile-dropdown')) {
        setProfileOpen(false)
        }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

  async function handleLogout() {
    await sb.auth.signOut()
    setUser(null)
    router.push('/')
  }

    const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
 
    return (
    <div className="min-h-screen bg-[#07070f] text-white font-sans">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-950/10 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── Floating Navbar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
        <nav className={`w-full max-w-5xl transition-all duration-300 ${
          scrolled
            ? 'bg-[#0d0d1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60'
            : 'bg-[#0d0d1a]/60 backdrop-blur-md border border-white/[0.06]'
        } rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4`}>

          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50 group-hover:shadow-purple-500/40 transition-shadow">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
              EchoArena
            </span>
          </Link>

          {/* Center — Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {[
                { href: '/', label: 'Beranda', icon: Home },
                { href: '/materials', label: 'Materi', icon: BookOpen },
            ].map(item => {
              const isActive = pathname === item.href || (item.href === '/materials' && pathname.startsWith('/materials'))
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right — Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {checking ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Avatar + email */}
                <div className="relative profile-dropdown">
                    <button
                        onClick={() => setProfileOpen(o => !o)}
                        className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white">
                        {initials}
                        </div>
                        <span className="text-xs text-slate-300 max-w-[100px] truncate">
                        {user.email}
                        </span>
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">

                        {/* Dashboard */}
                        <Link
                            href="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>

                        {/* Contributor */}
                        {user?.is_contributor && (
                            <Link
                            href="/contributor"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5"
                            >
                            <Sparkles className="w-4 h-4" />
                            Kontributor
                            </Link>
                        )}

                        {/* Admin */}
                        {user?.is_admin && (
                            <Link
                            href="/admin/stats"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5"
                            >
                            <User className="w-4 h-4" />
                            Admin
                            </Link>
                        )}

                        <div className="h-px bg-white/5 my-1" />

                        <button
                            onClick={() => { handleLogout(); setProfileOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="w-4 h-4" />
                            Keluar
                        </button>
                        </div>
                    )}
                </div>
                <button onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Keluar">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  <LogIn className="w-3.5 h-3.5" /> Masuk
                </Link>
                <Link href="/auth/register"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 transition-all">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Daftar</span>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="absolute top-full mt-2 left-4 right-4 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden md:hidden">
            <div className="p-3 space-y-1">
              {[
                { href: '/',          label: 'Beranda',    icon: Home },
                { href: '/materials', label: 'Materi',     icon: BookOpen },
                ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
                ...(user?.is_contributor ? [{ href: '/contributor', label: 'Kontributor', icon: Sparkles }] : []),
                ...(user?.is_admin ? [{ href: '/admin', label: 'Admin', icon: User }] : []),
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                </Link>
              ))}

              {!user && (
                <div className="pt-2 border-t border-white/5 flex gap-2 mt-2">
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                    <LogIn className="w-4 h-4" /> Masuk
                  </Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold transition-opacity hover:opacity-90">
                    <UserPlus className="w-4 h-4" /> Daftar
                  </Link>
                </div>
              )}

              {user && (
                <div className="pt-2 border-t border-white/5 mt-2">
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Page Content ── */}
      <div className="relative min-h-screen">
        {children}
      </div>
    </div>
  )
}