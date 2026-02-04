'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, PlusCircle, TrendingUp, Menu, X, Globe, Crown, User } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>

  const NavItems = () => (
    <>
     <Link href="/admin/stats" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <TrendingUp className="w-4 h-4 mr-2" />
          Statistik
        </Button>
      </Link>
      <Link href="/admin/questions" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Daftar Soal
        </Button>
      </Link>
      <Link href="/admin/library" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <Globe className="w-4 h-4 mr-2" />
          Library Komunitas
        </Button>
      </Link>
      <Link href="/admin/contributors" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <Crown className="w-4 h-4 mr-2" />
         Kontributor Soal Unggulan EchoArena
        </Button>
      </Link>
      <Link href="/admin/questions/new" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <PlusCircle className="w-4 h-4 mr-2" />
          Buat Soal
        </Button>
      </Link>
      <Link href="/admin/profile" onClick={() => setIsMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start md:w-auto text-slate-300 hover:text-white hover:bg-slate-800">
          <User className="w-4 h-4 mr-2" />
          Profil Saya
        </Button>
      </Link>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              EchoArena <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-normal border border-slate-700">Teacher</span>
            </span>
            
           
            <div className="hidden md:flex gap-1">
              <NavItems />
            </div>
          </div>

         
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>

         
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-slate-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <NavItems />
            <div className="h-px bg-slate-800 my-2" />
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        )}
      </nav>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}