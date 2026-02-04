'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Zap, Trophy, Star, Sparkles, User, Mail, Lock, CheckCircle2, GraduationCap, FileText, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  // STATE: Mode Guru
  const [isTeacherMode, setIsTeacherMode] = useState(false)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok')
      return
    }

    if (formData.password.length < 8) {
      setError('Kata sandi minimal harus 8 karakter')
      return
    }

    if (formData.username.length < 3) {
      setError('Username minimal harus 3 karakter')
      return
    }

    setLoading(true)

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle()

      if (existingUser) {
        setError('Username sudah digunakan')
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: formData.username,
            full_name: formData.username,
            role: isTeacherMode ? 'teacher_pending' : 'student'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat pengguna')

      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email,
          is_guest: false,
          level: 1,
          xp: 0,
          coins: isTeacherMode ? 1000 : 100,
          total_wins: 0,
          total_games: 0,
        })
        .select()
        .single()

      if (dbError) throw dbError

      localStorage.setItem('auth_mode', 'registered')
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Silakan periksa email Anda untuk konfirmasi akun, lalu masuk.')
        router.push('/auth/login')
        return
      }

      if (isTeacherMode) {
        router.push('/admin/questions')
      } else {
        router.push('/dashboard')
      }
      
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // Helper untuk warna dinamis
  const themeColor = isTeacherMode ? 'text-blue-400' : 'text-purple-400'
  const focusColor = isTeacherMode ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${isTeacherMode ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-950'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-blue-500/25' : 'bg-fuchsia-500/25'}`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-indigo-500/25' : 'bg-purple-500/25'}`} style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Trophy className={`absolute top-20 left-1/4 w-8 h-8 animate-bounce ${isTeacherMode ? 'text-blue-400/30' : 'text-yellow-400/30'}`} style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className={`absolute top-40 right-1/4 w-6 h-6 animate-bounce ${isTeacherMode ? 'text-indigo-400/30' : 'text-pink-400/30'}`} style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Zap className={`absolute bottom-40 left-1/3 w-7 h-7 animate-bounce ${isTeacherMode ? 'text-blue-400/30' : 'text-purple-400/30'}`} style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Sparkles className={`absolute bottom-20 right-1/3 w-6 h-6 animate-bounce ${isTeacherMode ? 'text-indigo-400/30' : 'text-fuchsia-400/30'}`} style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-10">
        <Card className="w-full max-w-md border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-black/40">
          
          {/* Toggle Role */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex p-1 bg-gray-800/80 rounded-xl">
              <button 
                type="button"
                onClick={() => setIsTeacherMode(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${!isTeacherMode ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Trophy className="w-4 h-4" />
                Peserta
              </button>
              <button 
                type="button"
                onClick={() => setIsTeacherMode(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${isTeacherMode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <GraduationCap className="w-4 h-4" />
                Pengajar
              </button>
            </div>
          </div>

          <CardHeader className="space-y-3 text-center pb-6">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg transition-transform hover:rotate-6 ${isTeacherMode ? 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-indigo-500/50' : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/50 rotate-3'}`}>
              {isTeacherMode ? <GraduationCap className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className={`text-3xl font-bold bg-clip-text text-transparent ${isTeacherMode ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400' : 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400'}`}>
              {isTeacherMode ? 'Mitra Pengajar' : 'Gabung ke Arena'}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {isTeacherMode ? 'Bergabunglah untuk mencerdaskan bangsa 📚' : 'Buat akunmu dan bersaing dengan pemain di seluruh dunia! 🎮'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">!</span>
                  </div>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 font-medium flex items-center gap-2">
                  <User className={`w-4 h-4 ${themeColor}`} />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder={isTeacherMode ? "PakGuru_Budi" : "RajaPrajurit123"}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={20}
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pl-4 pr-10 ${focusColor}`}
                  />
                  {formData.username.length >= 3 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
                {!isTeacherMode && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    3-20 karakter, terlihat oleh pemain lain
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${themeColor}`} />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="juara@echoarena.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pl-4 pr-10 ${focusColor}`}
                  />
                  {formData.email.includes('@') && formData.email.includes('.') && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${themeColor}`} />
                  Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 ${focusColor}`}
                />
                <div className="flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${
                    formData.password.length === 0 ? 'bg-gray-700' :
                    formData.password.length < 6 ? 'bg-red-500' :
                    formData.password.length < 8 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <p className="text-xs text-gray-500">Min. 8 karakter</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${themeColor}`} />
                  Konfirmasi Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pl-4 pr-10 ${focusColor}`}
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>

              {/* SECTION KHUSUS GURU */}
              {isTeacherMode && (
                <div className="pt-4 border-t border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gray-800"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verifikasi Pendidik</span>
                    <div className="h-px flex-1 bg-gray-800"></div>
                  </div>

                  {/* 1. NIK/NIP */}
                  <div className="space-y-2 opacity-60 cursor-not-allowed">
                    <Label className="text-gray-400 font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      NIK / NIP / NIDN
                    </Label>
                    <Input
                      disabled
                      placeholder="19800101 200001 1 001"
                      className="bg-gray-800/30 border-gray-800 text-gray-500 italic h-12"
                    />
                  </div>

                  {/* 2. Upload Foto KTP (BARU) */}
                  <div className="space-y-2 opacity-60 cursor-not-allowed">
                    <Label className="text-gray-400 font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      Foto KTP
                    </Label>
                    <div className="border border-dashed border-gray-700 rounded-lg p-3 text-center bg-gray-800/30 flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <p className="text-xs text-gray-500">Upload Foto KTP (JPG/PNG)</p>
                    </div>
                  </div>

                  {/* 3. Upload Sertifikat */}
                  <div className="space-y-2 opacity-60 cursor-not-allowed">
                    <Label className="text-gray-400 font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-400" />
                      Foto Sertifikat Guru / Pendidik
                    </Label>
                    <div className="border border-dashed border-gray-700 rounded-lg p-3 text-center bg-gray-800/30 flex flex-col items-center justify-center gap-1">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <p className="text-xs text-gray-500">Upload Sertifikat (PDF/JPG)</p>
                    </div>
                  </div>

                  {/* Pesan Demo Mode */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-indigo-300 leading-tight">
                      <strong>Hackathon Mode:</strong> Verifikasi dokumen (KTP & Sertifikat) di-bypass otomatis agar akun langsung aktif untuk demo.
                    </p>
                  </div>
                </div>
              )}

            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className={`w-full h-12 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] ${isTeacherMode ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-blue-500/30' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    {isTeacherMode ? 'Daftar & Verifikasi Instan' : 'Mulai Petualanganmu'}
                  </>
                )}
              </Button>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

              <p className="text-sm text-center text-gray-400">
                {isTeacherMode ? 'Sudah terdaftar sebagai pengajar? ' : 'Sudah punya akun? '}
                <Link href="/auth/login" className={`text-transparent bg-clip-text font-semibold transition-all ${isTeacherMode ? 'bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-300 hover:to-indigo-300' : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300'}`}>
                  Masuk di sini
                </Link>
              </p>

              {/* Tombol Tamu hanya muncul untuk Siswa agar tidak membingungkan Guru */}
              {!isTeacherMode && (
                <Link 
                  href="/" 
                  className="text-sm text-center text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 group"
                >
                  <Sparkles className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                  Main sebagai tamu saja
                </Link>
              )}

              <div className="pt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500/50" />
                  <span>Gratis</span>
                </div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-500/50" />
                  <span>Rewards</span>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}