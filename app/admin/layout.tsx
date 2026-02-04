'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Globe, 
  Crown, 
  PlusCircle, 
  User, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  // --- STATE DARI KODE LAMA ---
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- LOGIKA AUTH (SAMA PERSIS DENGAN KODE LAMA) ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // --- DAFTAR MENU (DIGABUNGKAN KE ARRAY BIAR RAPI DI SIDEBAR) ---
  const menuItems = [
    {
      title: 'Statistik',
      href: '/admin/stats',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: 'Daftar Soal',
      href: '/admin/questions',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      title: 'Buat Soal',
      href: '/admin/questions/new',
      icon: <PlusCircle className="w-5 h-5" />
    },
    {
      title: 'Library Komunitas',
      href: '/admin/library',
      icon: <Globe className="w-5 h-5" />
    },
    {
      title: 'Kontributor Unggulan',
      href: '/admin/contributors',
      icon: <Crown className="w-5 h-5" />
    },
    {
      title: 'Manajemen Materi',
      href: '/admin/materials',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      title: 'Tambah Materi',
      href: '/admin/materials/new',
      icon: <PlusCircle className="w-5 h-5" />
    },
    
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      
      {/* 1. SIDEBAR (Desktop Only - Kiri) */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide block leading-none">EchoAdmin</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Teacher Panel</span>
          </div>
        </div>

        {/* Menu Items (Scrollable) */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}>
                  {item.icon}
                  <span className="text-sm">{item.title}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              </Link>
            )
          })}

          {/* Tombol Khusus: Buat Materi Baru (Shortcut) */}
          <div className="mt-4 pt-4 border-t border-slate-800 px-2">
            <Link href="/admin/profile">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/20 border-0">
                <User className="mr-2 h-4 w-4" />
                Profile Saya
              </Button>
            </Link>
          </div>
        </nav>

        {/* Bottom Area (Logout) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
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

      {/* 2. MOBILE HEADER & CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Mobile Header (Hanya muncul di HP) */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0 z-20 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">EchoAdmin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* 3. MAIN CONTENT (Scrollable Area) */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative scroll-smooth">
          
          {/* Mobile Sidebar Overlay (Dropdown Menu di HP) */}
          {isMobileMenuOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm md:hidden animate-in slide-in-from-top-5 fade-in duration-200 flex flex-col">
              <nav className="p-4 space-y-2 overflow-y-auto flex-1">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`p-4 rounded-xl flex items-center gap-4 ${pathname === item.href ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </Link>
                ))}
                
                <div className="h-px bg-slate-800 my-4" />
                
                <Link href="/admin/materials/new" onClick={() => setIsMobileMenuOpen(false)}>
                   <Button className="w-full bg-blue-600 h-12 text-lg">
                      <PlusCircle className="mr-2 h-5 w-5" /> Buat Materi
                   </Button>
                </Link>

                <Button 
                  variant="destructive" 
                  className="w-full justify-start mt-4 h-12" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Keluar
                </Button>
              </nav>
            </div>
          )}

          {/* Render Halaman Admin Disini (Children) */}
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
             {children}
          </div>

        </main>
      </div>
    </div>
  )
}