'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              EchoArena <span className="text-slate-500 text-sm font-normal ml-1">Teacher</span>
            </span>
            <div className="flex gap-1">
              <Link href="/admin/questions">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Daftar Soal
                </Button>
              </Link>
              <Link href="/admin/questions/new">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Buat Soal
                </Button>
              </Link>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}