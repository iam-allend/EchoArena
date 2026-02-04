'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, LogIn, Sparkles, Trophy, Star, Zap, GraduationCap, School } from 'lucide-react'
import { clearGuestAccount } from '@/lib/auth/guest'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // STATE BARU: Untuk mode login guru
  const [isTeacherMode, setIsTeacherMode] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) throw loginError

      clearGuestAccount()
      localStorage.setItem('auth_mode', 'registered')

      // LOGIC BARU: Redirect beda jika mode guru
      if (isTeacherMode) {
        router.push('/admin/questions')
      } else {
        router.push('/dashboard')
      }
      
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login gagal. Silakan periksa kredensial Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${isTeacherMode ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-950'}`}>
      
      {/* Animated Background Elements - Sedikit berbeda untuk guru */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-blue-500/25' : 'bg-fuchsia-500/25'}`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-indigo-500/25' : 'bg-purple-500/25'}`} style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-black/40">
          
          {/* TOMBOL TOGGLE ROLE */}
          <div className="flex p-2 m-2 bg-gray-800/50 rounded-xl mb-0">
            <button 
              onClick={() => setIsTeacherMode(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${!isTeacherMode ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Trophy className="w-4 h-4" />
              Siswa / Peserta
            </button>
            <button 
              onClick={() => setIsTeacherMode(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${isTeacherMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <GraduationCap className="w-4 h-4" />
              Pengajar / Pendamping
            </button>
          </div>

          <CardHeader className="space-y-3 text-center pb-6">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg transition-all duration-500 ${isTeacherMode ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/50' : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/50 rotate-3'}`}>
              {isTeacherMode ? <School className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className={`text-3xl font-bold bg-clip-text text-transparent ${isTeacherMode ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400' : 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400'}`}>
              {isTeacherMode ? 'Portal Pengajar' : 'Selamat Datang'}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {isTeacherMode ? 'Kelola materi dan soal EchoArena 📚' : 'Masuk untuk melanjutkan petualanganmu 🎮'}
            </CardDescription>
          </CardHeader>

          <div>
            <CardContent className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm flex items-start gap-2">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${isTeacherMode ? 'text-blue-400' : 'text-purple-400'}`} />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isTeacherMode ? "guru@echoarena.com" : "juara@echoarena.com"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 ${isTeacherMode ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${isTeacherMode ? 'text-blue-400' : 'text-purple-400'}`} />
                  Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 ${isTeacherMode ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'}`}
                />
              </div>
            </CardContent>

           <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                onClick={handleLogin}
                className={`w-full h-12 text-white font-semibold shadow-lg transition-all hover:scale-[1.02] ${isTeacherMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30'}`} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    {isTeacherMode ? 'Masuk Dashboard' : 'Masuk ke Arena'}
                  </>
                )}
              </Button>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

              {/* PERUBAHAN DI SINI: Hilangkan kondisi !isTeacherMode agar link muncul untuk semua */}
              <p className="text-sm text-center text-gray-400">
                {isTeacherMode ? 'Belum terdaftar sebagai pengajar? ' : 'Belum punya akun? '}
                <Link href="/auth/register" className={`text-transparent bg-clip-text font-semibold transition-all ${isTeacherMode ? 'bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-300 hover:to-indigo-300' : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300'}`}>
                  {isTeacherMode ? 'Daftar Akun Guru' : 'Daftar di sini'}
                </Link>
              </p>
              
              {/* Link Main Tamu hanya muncul untuk Siswa (Opsional, tapi masuk akal) */}
              {!isTeacherMode && (
                 <Link 
                  href="/" 
                  className="text-sm text-center text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 group"
                >
                  <Sparkles className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                  Main sebagai tamu saja
                </Link>
              )}
            </CardFooter>
          </div>
        </Card>
      </div>
    </div>
  )
}