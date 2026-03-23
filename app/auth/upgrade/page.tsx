'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { getGuestAccountFromStorage, clearGuestAccount } from '@/lib/auth/guest'
import {
  Loader2, Crown, Check, Trophy, Users, Lock, Sparkles, Zap, Target,
  MailCheck, CheckCircle2, AlertCircle,
} from 'lucide-react'

type Step = 'form' | 'email_sent'

export default function UpgradePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isGuest, loading: authLoading } = useAuth()

  const [step, setStep]                       = useState<Step>('form')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isGuest) router.push('/dashboard')
      else if (user) setFormData(prev => ({ ...prev, username: user.username }))
    }
  }, [authLoading, isGuest, user, router])

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // ── Validasi ────────────────────────────────────────────────────────────
    if (formData.username.length < 3)                      { setError('Username minimal 3 karakter'); return }
    if (formData.password.length < 8)                      { setError('Kata sandi minimal 8 karakter'); return }
    if (formData.password !== formData.confirmPassword)    { setError('Kata sandi tidak cocok'); return }
    if (!user?.id)                                         { setError('Data akun tamu tidak ditemukan. Coba refresh halaman.'); return }

    setLoading(true)

    try {
      // ── 1. Cek username unik ─────────────────────────────────────────────
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) { setError('Username sudah digunakan'); setLoading(false); return }

      // ── 2. Buat Supabase Auth user baru via signUp ────────────────────────
      // Guest tidak memiliki auth user sama sekali, jadi HARUS signUp bukan updateUser
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?upgraded=true`,
        },
      })

      if (signUpError) {
        // Email sudah terdaftar
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError('Email ini sudah terdaftar. Gunakan email lain atau login langsung.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Gagal membuat akun. Silakan coba lagi.')
        setLoading(false)
        return
      }

      const newAuthId = authData.user.id
      const guestId   = user.id

      // ── 3. Update record guest di DB ─────────────────────────────────────
      // Strategi: update kolom data dulu, lalu ganti primary key ke newAuthId
      // (Supabase mengizinkan update id jika tidak ada FK constraint yang memblokir)
      const { error: dbError } = await supabase
        .from('users')
        .update({
          username:     formData.username,
          email:        formData.email,
          is_guest:     false,
          guest_expires_at: null,
          upgraded_at:  new Date().toISOString(),
        })
        .eq('id', guestId)

      if (dbError) throw dbError

      // ── 4. Jika ID berbeda, coba transfer data ke ID auth baru ───────────
      // Hanya perlu jika DB tidak menggunakan auth.uid() sebagai default
      if (newAuthId !== guestId) {
        // Cek apakah row dengan newAuthId sudah ada (dari trigger Supabase)
        const { data: existingAuthRow } = await supabase
          .from('users')
          .select('id')
          .eq('id', newAuthId)
          .maybeSingle()

        if (existingAuthRow) {
          // Hapus row duplikat yang dibuat trigger, pakai data dari guest
          await supabase.from('users').delete().eq('id', newAuthId)
        }

        // Ganti primary key guest ke newAuthId
        const { error: idUpdateError } = await supabase
          .from('users')
          .update({ id: newAuthId })
          .eq('id', guestId)

        if (idUpdateError) {
          // Jika gagal update ID (FK constraint), tetap lanjut —
          // data sudah ter-update, ID mismatch akan resolved saat user login
          console.warn('ID update warning:', idUpdateError.message)
        }
      }

      // ── 5. Bersihkan data guest lokal ────────────────────────────────────
      clearGuestAccount()

      // ── 6. Tampilkan konfirmasi ───────────────────────────────────────────
      setRegisteredEmail(formData.email)
      setStep('email_sent')

    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'Upgrade gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl animate-bounce">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <p className="text-purple-200/60 text-sm font-semibold">Memuat...</p>
      </div>
    </div>
  )

  // ── Email sent ────────────────────────────────────────────────────────────
  if (step === 'email_sent') return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-700/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-900/50">
              <MailCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Cek Email Kamu!</h2>
              <p className="text-slate-400 text-sm">Link verifikasi sudah dikirim ke</p>
              <div className="mt-2 px-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl inline-block">
                <p className="font-bold text-purple-300 text-sm">{registeredEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-3">
            {[
              'Buka kotak masuk email kamu',
              'Klik link "Verifikasi Email" dari EchoArena',
              'Akun tamu kamu akan di-upgrade otomatis!',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-purple-500/[0.07] border border-purple-500/20 rounded-2xl p-5">
            <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Setelah Verifikasi
            </p>
            <div className="space-y-2">
              {['Progres & statistik tersimpan selamanya', 'Akses sistem teman & duel kuis', 'Buat room pribadi dengan password', 'Bersaing di papan peringkat global'].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 text-xs">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
            Kembali ke Dashboard
          </button>
          <p className="text-center text-xs text-slate-600">
            Tidak menerima email?{' '}
            <button onClick={() => setStep('form')} className="text-purple-500 hover:text-purple-400 underline transition-colors">
              Coba lagi
            </button>
          </p>
        </div>
      </div>
    </div>
  )

  // ── Upgrade form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-24 pb-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-700/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Header */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl mb-5 shadow-xl shadow-yellow-900/40">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Upgrade ke <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Ubah akun tamu jadi keanggotaan seumur hidup — 100% GRATIS 🎉</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Target, g: 'from-emerald-500 to-teal-500',  title: 'Simpan Progres',  desc: 'Statistik, level, dan XP tersimpan selamanya' },
            { icon: Users,  g: 'from-blue-500 to-cyan-500',     title: 'Sistem Teman',    desc: 'Tambah teman dan tantang dalam duel kuis' },
            { icon: Lock,   g: 'from-purple-500 to-pink-500',   title: 'Room Pribadi',    desc: 'Buat room eksklusif dengan kata sandi' },
            { icon: Trophy, g: 'from-yellow-500 to-orange-500', title: 'Papan Peringkat', desc: 'Bersaing secara global dan raih puncak' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:border-white/15 hover:bg-white/[0.05] transition-all">
              <div className={`w-10 h-10 bg-gradient-to-br ${b.g} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
                <b.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{b.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-white font-black text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Selesaikan Upgrade
            </p>
            <p className="text-slate-500 text-sm mt-0.5">Isi detail di bawah untuk mengaktifkan semua fitur premium</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleUpgrade} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-semibold">Username</label>
              <input
                type="text"
                placeholder="pejuang123"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required minLength={3} maxLength={20}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
              />
              <p className="text-slate-600 text-xs">Pertahankan username saat ini atau ganti yang baru</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-semibold">Alamat Email</label>
              <input
                type="email"
                placeholder="kamu@contoh.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
              />
              <p className="text-slate-600 text-xs">Email untuk login dan verifikasi akun</p>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-white text-sm font-semibold">Kata Sandi</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required minLength={8}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
                />
                <p className="text-slate-600 text-xs">Minimal 8 karakter</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-white text-sm font-semibold">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 bg-blue-500/[0.07] border border-blue-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 text-xs font-bold mb-0.5">📧 Verifikasi Email Diperlukan</p>
                <p className="text-blue-400/70 text-xs leading-relaxed">
                  Setelah submit, link verifikasi dikirim ke email kamu. Klik link tersebut untuk menyelesaikan upgrade. Data progres kamu tetap tersimpan.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-black text-base shadow-xl shadow-yellow-900/40 hover:scale-[1.01] active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                : <><Crown className="w-5 h-5" /> Upgrade Sekarang — 100% GRATIS!</>}
            </button>

            <button type="button" onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-2xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05] text-sm font-medium transition-all">
              Nanti Saja
            </button>
          </form>
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pb-4 flex-wrap">
          {['100% Gratis', 'Tanpa Kartu Kredit', 'Verifikasi Cepat'].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-700 mr-2" />}
              <Check className="w-3.5 h-3.5 text-emerald-500" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}