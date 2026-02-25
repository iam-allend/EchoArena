'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Loader2, ArrowRight,
  Sparkles, Crown, Trophy,
} from 'lucide-react'

export default function ConfirmedPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const status       = searchParams.get('status')
  const role         = searchParams.get('role')
  const message      = searchParams.get('message')

  const [countdown, setCountdown] = useState(5)

  const destination =
    role === 'admin'       ? '/admin' :
    role === 'contributor' ? '/contributor' :
    role === 'pending'     ? '/contributor' :
    '/dashboard'

  const destinationLabel =
    role === 'admin'       ? 'Admin Panel' :
    role === 'contributor' ? 'Panel Kontributor' :
    role === 'pending'     ? 'Dashboard Kontributor' :
    'Dashboard'

  useEffect(() => {
    if (status !== 'success') return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); router.push(destination); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status, destination])

  const isContributor = role === 'contributor' || role === 'pending'

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-900/50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-300 font-medium">Memverifikasi akun kamu...</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-800/50 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-xl shadow-red-900/40">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Link Tidak Valid</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {message ? decodeURIComponent(message) : 'Link verifikasi sudah kadaluarsa atau tidak valid. Silakan daftar ulang.'}
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Link href="/auth/register">
              <button className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                Daftar Ulang <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="w-full h-11 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors">
                Sudah punya akun? Masuk
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isContributor
        ? 'bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900'
        : 'bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900'
    }`}>

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${isContributor ? 'bg-emerald-500/15' : 'bg-purple-500/15'}`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${isContributor ? 'bg-teal-500/10' : 'bg-fuchsia-500/10'}`} style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-24 left-1/4 w-7 h-7 text-yellow-400/25 animate-bounce" style={{ animationDuration: '3s' }} />
        <Trophy className="absolute top-32 right-1/4 w-6 h-6 text-yellow-400/20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        {isContributor && <Crown className="absolute bottom-32 right-1/3 w-7 h-7 text-emerald-400/25 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />}
      </div>

      <div className="relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl p-8 text-center space-y-6">

        {/* Icon */}
        <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl ${
          isContributor
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-900/50'
            : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-900/50'
        }`}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Email Terverifikasi! 🎉</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isContributor
              ? 'Akun pengajar kamu berhasil diaktifkan. Lengkapi data verifikasi pendidik untuk akses penuh.'
              : 'Akun kamu berhasil diaktifkan. Selamat datang di EchoArena!'}
          </p>
        </div>

        {/* Role badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
          isContributor
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
        }`}>
          {isContributor ? <Crown className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
          {isContributor ? 'Akun Pengajar / Kontributor' : 'Akun Peserta'}
        </div>

        {/* Info pending */}
        {role === 'pending' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left space-y-1">
            <p className="text-amber-300 text-xs font-bold">Langkah selanjutnya:</p>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              Lengkapi data verifikasi (NIP, institusi, foto KTP) di dashboard agar bisa direview admin.
            </p>
          </div>
        )}

        {/* CTA + countdown */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push(destination)}
            className={`w-full h-12 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 ${
              isContributor
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-900/30'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-900/30'
            }`}>
            Masuk ke {destinationLabel} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Auto redirect dalam</span>
              <span className="text-xs font-bold text-gray-400">{countdown}s</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isContributor ? 'bg-emerald-500' : 'bg-purple-500'}`}
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}