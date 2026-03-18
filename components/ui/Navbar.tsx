'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getGuestAccountFromStorage, clearGuestAccount } from '@/lib/auth/guest'
import {
  Trophy, Home, LayoutDashboard, LogIn, UserPlus,
  LogOut, User, Menu, X, BookOpen, ChevronRight,
  Sparkles, AlertTriangle,
} from 'lucide-react'

interface UserProfile {
  username: string
  email: string
  is_admin: boolean
  is_contributor: boolean
  is_guest: boolean
}

export default function Navbar() {
  const pathname = usePathname()
  const sb       = createClient()

  const [user, setUser]               = useState<UserProfile | null>(null)
  const [checking, setChecking]       = useState(true)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      // ── 1. Cek Supabase session (user terdaftar) ──────────────────────────
      const { data: { session } } = await sb.auth.getSession()

      if (session?.user) {
        const { data: profile } = await sb
          .from('users')
          .select('username, email, is_admin, is_contributor')
          .eq('id', session.user.id)
          .single()

        setUser({
          username:       profile?.username ?? session.user.email ?? 'User',
          email:          profile?.email ?? session.user.email ?? '',
          is_admin:       profile?.is_admin ?? false,
          is_contributor: profile?.is_contributor ?? false,
          is_guest:       false,
        })
        setChecking(false)
        return
      }

      // ── 2. Cek guest account dari localStorage ────────────────────────────
      const guest = getGuestAccountFromStorage()
      if (guest) {
        setUser({
          username:       guest.username,
          email:          '',
          is_admin:       false,
          is_contributor: false,
          is_guest:       true,
        })
        setChecking(false)
        return
      }

      // ── 3. Tidak ada session ──────────────────────────────────────────────
      setUser(null)
      setChecking(false)
    }

    checkAuth()

    // Listen perubahan Supabase auth (login/logout registered user)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Cek ulang apakah masih ada guest
        const guest = getGuestAccountFromStorage()
        if (guest) {
          setUser({
            username: guest.username, email: '',
            is_admin: false, is_contributor: false, is_guest: true,
          })
        } else {
          setUser(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false); setProfileOpen(false) }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('.profile-dropdown')) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    if (user?.is_guest) {
      // Guest: hapus localStorage + cookie
      clearGuestAccount()
    } else {
      // Registered: signOut Supabase
      await sb.auth.signOut({ scope: 'local' })
      localStorage.removeItem('auth_mode')
    }
    window.location.href = '/'
  }

  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'User'
  const initials    = displayName.slice(0, 2).toUpperCase()

  const mainLinks = [
    { href: '/',           label: 'Beranda',     icon: Home     },
    { href: '/materials',  label: 'Materi',      icon: BookOpen },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy  },
  ]

  const dropdownLinks = [
    { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, show: !!user },
    { href: '/contributor', label: 'Kontributor', icon: Sparkles,        show: !!user?.is_contributor },
    { href: '/admin/stats', label: 'Admin',        icon: User,            show: !!user?.is_admin },
  ].filter(l => l.show)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isDropdownPageActive = dropdownLinks.some(l => isActive(l.href))

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav className={`w-full max-w-5xl transition-all duration-300 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4 ${
        scrolled
          ? 'bg-[#0d0d1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60'
          : 'bg-[#0d0d1a]/60 backdrop-blur-md border border-white/[0.06]'
      }`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50 group-hover:shadow-purple-500/40 transition-shadow">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
            EchoArena
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {mainLinks.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-2 shrink-0">
          {checking ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Avatar + dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className={`hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors border ${
                    isDropdownPageActive
                      ? 'bg-purple-600/20 border-purple-500/40 hover:bg-purple-600/25'
                      : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
                  }`}>
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    user.is_guest
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {initials}
                  </div>
                  {/* Name */}
                  <span className={`text-xs max-w-[100px] truncate ${
                    isDropdownPageActive ? 'text-purple-300' : 'text-slate-300'
                  }`}>
                    {displayName}
                  </span>
                  {/* Guest badge */}
                  {user.is_guest && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,.2)', border: '1px solid rgba(245,158,11,.4)', color: '#f59e0b' }}>
                      TAMU
                    </span>
                  )}
                </button>

                {/* Dropdown menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-2 space-y-1">
                    {/* Guest warning in dropdown */}
                    {user.is_guest && (
                      <div className="px-3 py-2 rounded-xl mb-1"
                        style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
                        <p className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                          <AlertTriangle className="inline w-3 h-3 mr-1" />Mode Tamu — data hilang 7 hari
                        </p>
                        <Link href="/auth/register" onClick={() => setProfileOpen(false)}
                          className="text-[10px] font-black underline" style={{ color: '#fbbf24' }}>
                          Upgrade ke akun permanen →
                        </Link>
                      </div>
                    )}

                    {dropdownLinks.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {isActive(item.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </Link>
                    ))}

                    <div className="h-px bg-white/5 my-1" />
                    <button onClick={() => { handleLogout(); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>

              {/* Logout shortcut button */}
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

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full mt-2 left-4 right-4 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden md:hidden">
          <div className="p-3 space-y-1">

            {/* Guest badge mobile */}
            {user?.is_guest && (
              <div className="px-4 py-2.5 rounded-xl mb-1"
                style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {displayName} · Mode Tamu
                </p>
                <Link href="/auth/register" className="text-[11px] font-black underline" style={{ color: '#fbbf24' }}>
                  Upgrade ke akun permanen →
                </Link>
              </div>
            )}

            {mainLinks.map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </Link>
            ))}

            {dropdownLinks.length > 0 && (
              <>
                <div className="h-px bg-white/5 my-1" />
                {dropdownLinks.map(item => (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {isActive(item.href)
                      ? <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                      : <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                    }
                  </Link>
                ))}
              </>
            )}

            {!user ? (
              <div className="pt-2 border-t border-white/5 flex gap-2 mt-2">
                <Link href="/auth/login"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
                <Link href="/auth/register"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold">
                  <UserPlus className="w-4 h-4" /> Daftar
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/5 mt-2">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}