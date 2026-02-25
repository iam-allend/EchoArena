'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, PlusCircle, User, LogOut,
  Menu, X, Sparkles, BookOpen, BrainCircuit,
  Crown, ChevronRight, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContributorLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [loading, setLoading]                   = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userName, setUserName]                 = useState('')
  const [isAdmin, setIsAdmin]                   = useState(false)
  const [isVerified, setIsVerified]             = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth/login')
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('username, is_admin, is_contributor, is_banned, contributor_status')
        .eq('id', session.user.id)
        .single()

      if (!user || user.is_banned) {
        await supabase.auth.signOut()
        router.replace('/auth/login')
        return
      }

      // Hanya admin, kontributor approved, atau pending (menunggu) yang boleh masuk
      if (!user.is_admin && !user.is_contributor && user.contributor_status !== 'pending' && user.contributor_status !== 'rejected') {
        router.replace('/dashboard')
        return
      }

      setUserName(user.username)
      setIsAdmin(user.is_admin)
      setIsVerified(user.is_contributor || user.is_admin)
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  // ── Menu items — lebih terbatas dari admin ─────────────────────────────────
  const menuItems = [
    {
      title: 'Dashboard',
      href: '/contributor',
      icon: <LayoutDashboard className="w-5 h-5" />,
      exact: true,
    },
    {
      title: 'Bank Soal',
      href: '/contributor/questions',
      icon: <BrainCircuit className="w-5 h-5" />,
    },
    {
      title: 'Tambah Soal',
      href: '/contributor/questions/new',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      title: 'Materi',
      href: '/contributor/materials',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: 'Tambah Materi',
      href: '/contributor/materials/new',
      icon: <PlusCircle className="w-5 h-5" />,
    },
  ]

  const isActive = (item: typeof menuItems[0]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Memuat panel kontributor...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">

      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 mt-7">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide block leading-none">EchoArena</span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Kontributor Panel</span>
          </div>
        </div>

        {/* Tombol switch ke Admin (hanya admin) */}
        {isAdmin && (
          <div className="px-3 pt-3">
            <Link href="/admin">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-colors cursor-pointer">
                <span className="text-xs font-bold">Buka Admin Panel</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item)
            // Dashboard selalu bisa diakses, menu lain hanya jika verified
            const locked = !isVerified && item.href !== '/contributor'
            if (locked) {
              return (
                <div key={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl opacity-40 cursor-not-allowed select-none text-slate-600">
                  {item.icon}
                  <span className="text-sm">{item.title}</span>
                  <Lock className="w-3.5 h-3.5 ml-auto text-slate-700" />
                </div>
              )
            }
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative
                  ${active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}>
                  {item.icon}
                  <span className="text-sm">{item.title}</span>
                  {active && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              </Link>
            )
          })}

          <div className="mt-4 pt-4 border-t border-slate-800 px-2">
            <Link href="/contributor/profile">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-900/20 border-0">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </Button>
            </Link>
          </div>
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-200 shrink-0">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className={`text-[11px] font-medium ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isVerified ? 'Kontributor Terverifikasi' : 'Menunggu Verifikasi'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* ── MOBILE HEADER + CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0 z-20 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white">
              <Crown className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Kontributor</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative scroll-smooth">

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm md:hidden animate-in slide-in-from-top-5 fade-in duration-200 flex flex-col">
              <nav className="p-4 space-y-2 overflow-y-auto flex-1">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`p-4 rounded-xl flex items-center gap-4 ${isActive(item) ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </Link>
                ))}
                <div className="h-px bg-slate-800 my-4" />
                <Button variant="destructive" className="w-full justify-start mt-4 h-12" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 mr-3" /> Keluar
                </Button>
              </nav>
            </div>
          )}

          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}