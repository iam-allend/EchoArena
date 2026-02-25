'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Loader2, Zap, Trophy, Star, Sparkles, User, Mail, Lock,
  CheckCircle2, GraduationCap, AlertCircle, MailCheck, ArrowRight,
} from 'lucide-react'

type Step = 'form' | 'email_sent'

export default function RegisterPage() {
  const supabase = createClient()

  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [step, setStep]                   = useState<Step>('form')
  const [registeredEmail, setRegisteredEmail] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) { setError('Kata sandi tidak cocok'); return }
    if (formData.password.length < 8)  { setError('Kata sandi minimal 8 karakter'); return }
    if (formData.username.length < 3)  { setError('Username minimal 3 karakter'); return }

    setLoading(true)
    try {
      // Cek username unik
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle()

      if (existing) { setError('Username sudah digunakan'); setLoading(false); return }

      // Daftar ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: formData.username,
            role: isTeacherMode ? 'teacher_pending' : 'student',
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat pengguna')

      // Insert ke tabel users
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: formData.username,
        email: formData.email,
        is_guest: false,
        level: 1,
        xp: 0,
        coins: 100,
        total_wins: 0,
        total_games: 0,
        // Kontributor: langsung pending, tapi data pendidik diisi nanti di dashboard
        ...(isTeacherMode ? {
          contributor_status: 'pending',
          contributor_applied_at: new Date().toISOString(),
          contributor_data: {},
        } : {}),
      })

      if (dbError) throw dbError

      // Tampilkan halaman konfirmasi email
      setRegisteredEmail(formData.email)
      setStep('email_sent')

    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const themeColor  = isTeacherMode ? 'text-blue-400'    : 'text-purple-400'
  const focusColor  = isTeacherMode ? 'focus:border-blue-500' : 'focus:border-purple-500'
  const bgGradient  = isTeacherMode
    ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900'
    : 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-purple-950'

  // ── EMAIL SENT SCREEN ──────────────────────────────────────────────────────

  if (step === 'email_sent') {
    return (
      <div className={`min-h-screen relative overflow-hidden ${bgGradient}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-blue-500/20' : 'bg-fuchsia-500/20'}`} />
          <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-indigo-500/20' : 'bg-purple-500/20'}`} style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center gap-5">

              {/* Icon animasi */}
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl ${
                isTeacherMode
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-900/50'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-900/50'
              }`}>
                <MailCheck className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Cek Email Kamu!</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Kami sudah mengirimkan <span className="text-white font-semibold">link aktivasi</span> ke:
                </p>
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 inline-block">
                  <p className={`font-bold text-base ${isTeacherMode ? 'text-blue-300' : 'text-purple-300'}`}>
                    {registeredEmail}
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="w-full space-y-3 text-left">
                {[
                  { icon: '1', text: 'Buka kotak masuk email kamu' },
                  { icon: '2', text: 'Klik link "Aktivasi Akun" di email dari EchoArena' },
                  { icon: '3', text: isTeacherMode
                    ? 'Login dan lengkapi data verifikasi pendidik untuk akses penuh'
                    : 'Login dan mulai bermain di EchoArena!' },
                ].map((s) => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isTeacherMode ? 'bg-blue-600/30 text-blue-300' : 'bg-purple-600/30 text-purple-300'
                    }`}>{s.icon}</div>
                    <p className="text-gray-400 text-sm">{s.text}</p>
                  </div>
                ))}
              </div>

              {isTeacherMode && (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
                  <p className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Info Kontributor
                  </p>
                  <p className="text-amber-200/70 text-xs leading-relaxed">
                    Setelah login, kamu perlu melengkapi <strong className="text-amber-200">data verifikasi pendidik</strong> (NIP, institusi, foto KTP) agar bisa diaktivasi oleh admin.
                  </p>
                </div>
              )}

              <div className="w-full space-y-3 pt-2">
                <Link href="/auth/login" className="block">
                  <Button className={`w-full h-11 text-white font-semibold ${
                    isTeacherMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}>
                    Sudah Aktivasi? Masuk <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-gray-600 text-center">
                  Tidak menerima email?{' '}
                  <button
                    onClick={() => setStep('form')}
                    className={`underline ${isTeacherMode ? 'text-blue-500 hover:text-blue-400' : 'text-purple-500 hover:text-purple-400'}`}>
                    Coba daftar ulang
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── REGISTER FORM ──────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${bgGradient}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-blue-500/25' : 'bg-fuchsia-500/25'}`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${isTeacherMode ? 'bg-indigo-500/25' : 'bg-purple-500/25'}`} style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Trophy className={`absolute top-20 left-1/4 w-8 h-8 animate-bounce ${isTeacherMode ? 'text-blue-400/30' : 'text-yellow-400/30'}`} style={{ animationDuration: '3s' }} />
        <Star className={`absolute top-40 right-1/4 w-6 h-6 animate-bounce ${isTeacherMode ? 'text-indigo-400/30' : 'text-pink-400/30'}`} style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Sparkles className={`absolute bottom-20 right-1/3 w-6 h-6 animate-bounce ${isTeacherMode ? 'text-indigo-400/30' : 'text-fuchsia-400/30'}`} style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-10">
        <Card className="w-full max-w-md border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-black/40">

          {/* Toggle Role */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex p-1 bg-gray-800/80 rounded-xl">
              <button type="button" onClick={() => setIsTeacherMode(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  !isTeacherMode ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}>
                <Trophy className="w-4 h-4" /> Peserta
              </button>
              <button type="button" onClick={() => setIsTeacherMode(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isTeacherMode ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}>
                <GraduationCap className="w-4 h-4" /> Pengajar
              </button>
            </div>
          </div>

          <CardHeader className="space-y-3 text-center pb-4">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg ${
              isTeacherMode
                ? 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-indigo-500/50'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/50 rotate-3'
            }`}>
              {isTeacherMode ? <GraduationCap className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className={`text-3xl font-bold bg-clip-text text-transparent ${
              isTeacherMode
                ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400'
                : 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400'
            }`}>
              {isTeacherMode ? 'Daftar sebagai Pengajar' : 'Gabung ke Arena'}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              {isTeacherMode
                ? 'Daftar dulu, lengkapi data pendidik setelah login 📋'
                : 'Buat akun dan mulai bersaing! 🎮'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <Label className={`text-gray-300 font-medium flex items-center gap-2`}>
                  <User className={`w-4 h-4 ${themeColor}`} /> Username
                </Label>
                <div className="relative">
                  <Input
                    placeholder={isTeacherMode ? 'PakGuru_Budi' : 'RajaPrajurit123'}
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required minLength={3} maxLength={20}
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-10 ${focusColor}`}
                  />
                  {formData.username.length >= 3 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
                <p className="text-xs text-gray-600">3–20 karakter, terlihat oleh pengguna lain</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${themeColor}`} /> Email
                </Label>
                <div className="relative">
                  <Input
                    type="email" placeholder="kamu@echoarena.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-10 ${focusColor}`}
                  />
                  {formData.email.includes('@') && formData.email.includes('.') && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${themeColor}`} /> Kata Sandi
                </Label>
                <Input
                  type="password" placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required minLength={8}
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 ${focusColor}`}
                />
                <div className="flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${
                    formData.password.length === 0 ? 'bg-gray-700' :
                    formData.password.length < 6  ? 'bg-red-500' :
                    formData.password.length < 8  ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <p className="text-xs text-gray-500">Min. 8 karakter</p>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${themeColor}`} /> Konfirmasi Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    type="password" placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-10 ${focusColor}`}
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>

              {/* Info kontributor */}
              {isTeacherMode && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-indigo-300 leading-relaxed space-y-1">
                    <p className="font-bold text-indigo-200">Proses Verifikasi Pengajar</p>
                    <p>Setelah mendaftar dan mengaktifkan email, kamu akan diminta mengisi data verifikasi (NIP, institusi, foto KTP) di dashboard sebelum bisa mengakses fitur kontributor.</p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" disabled={loading}
                className={`w-full h-12 text-white font-semibold shadow-lg transition-all hover:scale-[1.02] ${
                  isTeacherMode
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-blue-500/20'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/20'
                }`}>
                {loading
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                  : <><Zap className="mr-2 h-5 w-5" /> {isTeacherMode ? 'Daftar sebagai Pengajar' : 'Mulai Petualanganmu'}</>
                }
              </Button>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

              <p className="text-sm text-center text-gray-400">
                Sudah punya akun?{' '}
                <Link href="/auth/login" className={`text-transparent bg-clip-text font-semibold bg-gradient-to-r ${
                  isTeacherMode ? 'from-blue-400 to-indigo-400' : 'from-purple-400 to-pink-400'
                }`}>
                  Masuk di sini
                </Link>
              </p>

              {!isTeacherMode && (
                <Link href="/" className="text-sm text-center text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 group">
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