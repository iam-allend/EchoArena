'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createGuestAccount, getGuestAccountFromStorage } from '@/lib/auth/guest'
import { subjects } from '@/lib/data/subjects'
import { MusicControl } from '@/components/ui/MusicControl'
import {
  Loader2, Trophy, Sparkles, Zap, Star, Target, Code,
  GraduationCap, Instagram, Github, BookOpen, Lightbulb,
  ChevronRight, Rocket, Crown, Shield, Flame, Gift, Play,
  Mic, Users, LogIn, ArrowRight, CheckCircle2,
} from 'lucide-react'

interface Stats { materials: number; questions: number; categories: number; players: number }

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (done.current || value === 0) return
    done.current = true
    let i = 0; const steps = 50
    const iv = setInterval(() => {
      i++; setN(Math.round((value / steps) * i))
      if (i >= steps) { setN(value); clearInterval(iv) }
    }, 1600 / steps)
    return () => clearInterval(iv)
  }, [value])
  return <>{n.toLocaleString('id-ID')}{suffix}</>
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter(); const supabase = createClient()
  const [loading, setLoading]           = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLoggedIn, setIsLoggedIn]     = useState(false)
  const [stats, setStats]               = useState<Stats>({ materials: 0, questions: 0, categories: 0, players: 0 })
  const [showGuestModal, setShowGuestModal] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { setIsLoggedIn(true); return }
        if (getGuestAccountFromStorage()) setIsLoggedIn(true)
      } catch { } finally { setCheckingAuth(false) }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    const v = sessionStorage.getItem('visitedHome')
    if (!v) { sessionStorage.setItem('visitedHome', 'true'); router.replace('/dashboard') }
  }, [isLoggedIn])

  useEffect(() => {
    async function loadStats() {
      const [{ count: mc }, { count: qc }, { count: cc }, { count: pc }] = await Promise.all([
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
      ])
      setStats({ materials: mc ?? 0, questions: qc ?? 0, categories: cc ?? 0, players: pc ?? 0 })
    }
    loadStats()
  }, [])

  async function handleGuest() {
    setLoading(true)
    try {
      if (getGuestAccountFromStorage()) {
        // Pastikan cookie ada
        document.cookie = 'guest_session=1; path=/; max-age=604800' // 7 hari
        window.location.href = '/dashboard'
        return
      }
      await createGuestAccount()
      // Set cookie setelah guest account dibuat
      document.cookie = 'guest_session=1; path=/; max-age=604800'
      window.location.href = '/dashboard'
    } catch {
      alert('Gagal membuat akun tamu. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (checkingAuth) return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl animate-bounce">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <p className="font-semibold text-purple-200/60 text-sm">Memuat EchoArena...</p>
      </div>
    </main>
  )

  const STATS_DATA = [
    { value: stats.players,    label: 'Pemain Aktif',     icon: Users,     gradient: 'from-violet-600 to-purple-700', suffix: '+' },
    { value: stats.materials,  label: 'Materi Tersedia',  icon: BookOpen,  gradient: 'from-pink-600 to-rose-700',     suffix: '+' },
    { value: stats.questions,  label: 'Soal Berkualitas', icon: Lightbulb, gradient: 'from-amber-500 to-orange-600',  suffix: '+' },
    { value: stats.categories, label: 'Kategori',         icon: Crown,     gradient: 'from-cyan-600 to-blue-700',     suffix: ''  },
  ]

  const FEATURES = [
    { icon: Mic,      title: 'Jawab Pakai Suara',    desc: 'Ucapkan jawabanmu — sistem mengenali suaramu secara real-time.',              g: 'from-purple-500 to-violet-600' },
    { icon: Users,    title: 'Multiplayer Real-Time', desc: 'Tantang 2–8 teman dalam satu sesi kuis yang kompetitif.',                    g: 'from-cyan-500 to-blue-600' },
    { icon: Zap,      title: 'Feedback Instan',       desc: 'Lihat hasil dan penjelasan tiap soal langsung setelah menjawab.',            g: 'from-yellow-500 to-orange-500' },
    { icon: Trophy,   title: 'Poin & Peringkat',      desc: 'Kumpulkan poin, raih badge, panjat papan skor bersama pemain lain.',         g: 'from-pink-500 to-rose-600' },
    { icon: BookOpen, title: 'Materi Terstruktur',    desc: 'Ribuan soal dari kontributor terpilih, dikelompokkan per pelajaran & level.', g: 'from-emerald-500 to-teal-600' },
    { icon: Star,     title: 'Level Adaptif',         desc: 'SD, SMP, SMA — tingkat kesulitan yang tepat untuk setiap pelajar.',          g: 'from-purple-500 to-pink-500' },
  ]

  const TEAM = [
    { initials: 'AM', name: 'Anur Mustakin',         nim: 'A22.2023.03012', role: 'Full Stack Developer', g: 'from-blue-500 to-indigo-600',  github: 'https://github.com/iam-allend', ig: 'https://instagram.com/iam.allend' },
    { initials: 'ZD', name: 'Zikry Dwi Maulana',     nim: 'A22.2023.03014', role: 'Frontend Developer',   g: 'from-purple-500 to-pink-600',  github: 'https://github.com/zikrydwim',  ig: 'https://instagram.com/zikrydwim' },
    { initials: 'MN', name: 'Muhammad Najwa Syarif', nim: 'A22.2023.03026', role: 'Backend Developer',    g: 'from-emerald-500 to-teal-600', github: 'https://github.com/najwasyrf',  ig: 'https://instagram.com/najwasyrf' },
  ]

  return (
    <>
      <style>{`
        @keyframes fa { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(7deg)} }
        @keyframes fb { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(-5deg)} }
        @keyframes wg { 0%,100%{transform:rotate(-3deg) scale(1)} 50%{transform:rotate(3deg) scale(1.04)} }
        @keyframes ap { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes su { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes sm { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .su  { animation: su .5s ease both }
        .su1 { animation: su .5s .08s ease both }
        .su2 { animation: su .5s .16s ease both }
        .su3 { animation: su .5s .24s ease both }
        .su4 { animation: su .5s .32s ease both }
        .btn-shim::after {
          content:''; position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.13) 50%,transparent 60%);
          background-size:200% 100%; opacity:0; transition:opacity .25s;
        }
        .btn-shim:hover::after { opacity:1; animation: sm 1.4s ease infinite; }
      `}</style>

      {/* Guest Confirmation Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1030 100%)',
              border: '1px solid rgba(139,92,246,.35)',
              boxShadow: '0 0 60px rgba(139,92,246,.2), 0 25px 50px rgba(0,0,0,.6)',
            }}>
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }} />
            <div className="p-7 text-center space-y-4">
              <div className="text-4xl">🎮</div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">Main sebagai Tamu?</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,180,255,.55)' }}>
                  Akun tamu berlaku <strong style={{ color: '#fbbf24' }}>7 hari</strong> dan akan
                  dihapus otomatis. Progres, koin, dan riwayat game{' '}
                  <strong style={{ color: '#f87171' }}>tidak bisa dipulihkan</strong> setelah expired.
                </p>
              </div>

              {/* Terms list */}
              <div className="rounded-2xl p-4 text-left space-y-2"
                style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)' }}>
                {[
                  { icon: '✅', text: 'Akses semua materi & quiz gratis' },
                  { icon: '✅', text: 'Main multiplayer langsung' },
                  { icon: '⚠️', text: 'Data hilang setelah 7 hari' },
                  { icon: '⚠️', text: 'Tidak bisa ganti username/password' },
                  { icon: '💡', text: 'Bisa upgrade ke akun permanen kapan saja' },
                ].map((item, i) => (
                  <p key={i} className="text-xs flex items-center gap-2"
                    style={{ color: 'rgba(200,180,255,.6)' }}>
                    <span>{item.icon}</span> {item.text}
                  </p>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    color: 'rgba(200,180,255,.5)',
                  }}>
                  Batal
                </button>
                <button
                  onClick={() => { setShowGuestModal(false); handleGuest() }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    boxShadow: '0 4px 20px rgba(124,58,237,.5)',
                  }}>
                  {loading ? '...' : 'Ya, Main Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">

        {/* Ambient + grid */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-700/25 rounded-full blur-[130px]" style={{animation:'ap 7s ease-in-out infinite'}} />
          <div className="absolute top-[40%] right-0 w-[420px] h-[420px] bg-pink-700/20 rounded-full blur-[110px]" style={{animation:'ap 9s ease-in-out infinite',animationDelay:'2s'}} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-700/20 rounded-full blur-[100px]" style={{animation:'ap 8s ease-in-out infinite',animationDelay:'4s'}} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{backgroundImage:'linear-gradient(rgba(139,92,246,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
        </div>

        {/* Floating particles */}
        {[
          {e:'⭐',s:{top:'10%',left:'3%',animation:'fa 9s ease-in-out infinite',fontSize:'1.6rem',opacity:.38}},
          {e:'🏆',s:{top:'15%',right:'4%',animation:'fb 7s ease-in-out infinite',fontSize:'2rem',opacity:.32}},
          {e:'✨',s:{top:'44%',left:'2%',animation:'fa 10s ease-in-out infinite',animationDelay:'2s',fontSize:'1.3rem',opacity:.28}},
          {e:'🎯',s:{top:'62%',right:'3%',animation:'fb 6s ease-in-out infinite',animationDelay:'1s',fontSize:'1.7rem',opacity:.28}},
          {e:'🚀',s:{bottom:'12%',left:'4%',animation:'fa 11s ease-in-out infinite',animationDelay:'3s',fontSize:'1.6rem',opacity:.28}},
          {e:'💡',s:{top:'28%',left:'5%',animation:'fb 8s ease-in-out infinite',animationDelay:'4s',fontSize:'1.4rem',opacity:.22}},
          {e:'🎮',s:{bottom:'8%',right:'5%',animation:'fa 8s ease-in-out infinite',animationDelay:'2s',fontSize:'1.8rem',opacity:.25}},
        ].map((p,i) => <div key={i} className="absolute pointer-events-none select-none" style={p.s as any}>{p.e}</div>)}

        {/* ════ HERO ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 flex flex-col items-center text-center">

          <div className="su inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/25 rounded-full px-4 py-1.5 text-purple-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="w-3.5 h-3.5" />Platform Kuis &amp; Belajar Interaktif<Sparkles className="w-3.5 h-3.5" />
          </div>

          <div className="su1 flex flex-col sm:flex-row items-center justify-center gap-5 mb-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 relative z-10"
                style={{animation:'wg 3.5s ease-in-out infinite'}}>
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-40 blur-2xl -z-10 scale-110" />
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tight"
              style={{background:'linear-gradient(135deg,#c084fc 0%,#e879f9 35%,#f9a8d4 65%,#818cf8 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',filter:'drop-shadow(0 0 40px rgba(192,132,252,.4))'}}>
              EchoArena
            </h1>
          </div>

          <p className="su2 text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
            Di Mana Suara Menggema,{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Juara Tercipta!</span>
          </p>
          <p className="su2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Kuis berbasis suara · Multiplayer real-time · Materi lengkap SD, SMP &amp; SMA
          </p>

          {/* ── CTA BUTTONS ── */}
          <div className="su3 w-full max-w-lg">
            {!isLoggedIn ? (
              <div className="flex flex-col gap-3">

                {/* PRIMARY */}
                <button onClick={() => setShowGuestModal(true)} disabled={loading}
                  className="btn-shim group relative w-full flex items-center gap-3 p-1.5 pr-2 rounded-2xl overflow-hidden
                    disabled:opacity-60 disabled:cursor-not-allowed
                    hover:scale-[1.015] active:scale-[.99] transition-transform duration-150
                    bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600
                    shadow-2xl shadow-purple-900/60">
                  <div className="relative w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />}
                  </div>
                  <div className="relative flex-1 text-left">
                    <p className="text-white font-black text-base leading-tight">{loading ? 'Membuat sesi...' : 'Main Sekarang'}</p>
                    <p className="text-white/60 text-xs font-medium">Langsung main tanpa daftar</p>
                  </div>
                  <div className="relative w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* SECONDARY ROW */}
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/auth/register"
                    className="btn-shim group relative flex items-center gap-3 p-3.5 rounded-2xl overflow-hidden
                      border border-purple-500/30 bg-purple-500/10
                      hover:bg-purple-500/18 hover:border-purple-400/45
                      hover:scale-[1.02] active:scale-[.99] transition-all duration-200">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/25 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-white font-bold text-sm leading-tight">Daftar Gratis</p>
                      <p className="text-purple-300/60 text-[11px] truncate">Simpan progresmu</p>
                    </div>
                  </Link>
                  <Link href="/auth/login"
                    className="group flex items-center gap-3 p-3.5 rounded-2xl
                      border border-white/[0.09] bg-white/[0.04]
                      hover:bg-white/[0.08] hover:border-white/15
                      hover:scale-[1.02] active:scale-[.99] transition-all duration-200">
                    <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                      <LogIn className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-white font-bold text-sm leading-tight">Masuk</p>
                      <p className="text-slate-500 text-[11px] truncate">Sudah punya akun</p>
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              <button onClick={() => router.push('/dashboard')}
                className="btn-shim group relative w-full flex items-center gap-3 p-1.5 pr-2 rounded-2xl overflow-hidden
                  hover:scale-[1.015] active:scale-[.99] transition-transform duration-150
                  bg-gradient-to-r from-emerald-600 to-teal-600 shadow-2xl shadow-emerald-900/50">
                <div className="relative w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="relative flex-1 text-left">
                  <p className="text-white font-black text-base">Masuk ke Dashboard</p>
                  <p className="text-white/60 text-xs">Lanjutkan sesi belajarmu</p>
                </div>
                <div className="relative w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )}
          </div>

          {!isLoggedIn && (
            <p className="su4 mt-4 flex items-center gap-1.5 text-white/50 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-white/50 shrink-0" />
              Akun tamu berlaku 7 hari · Daftar untuk simpan progres selamanya
            </p>
          )}
        </section>

        {/* ════ STATS ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {STATS_DATA.map((s, i) => (
              <div key={i} className="text-center group relative rounded-2xl p-5 overflow-hidden
                bg-white/[0.04] border border-white/[0.08]
                hover:border-white/15 hover:bg-white/[0.07]
                hover:scale-[1.03] transition-all duration-200 cursor-default">
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${s.gradient} rounded-t-2xl`} />
                <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-15 bg-gradient-to-br ${s.gradient} group-hover:opacity-30 transition-opacity`} />
                <div className={`m-auto relative w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-md`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="relative text-2xl sm:text-3xl font-black text-white tabular-nums leading-none mb-1">
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </p>
                <p className="relative text-slate-400 text-xs font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════ SUBJECTS ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
                <BookOpen className="w-3.5 h-3.5" />Perpustakaan Materi
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Mulai Belajar dari Sini</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Ribuan soal dari kontributor terpilih, lengkap dengan penjelasan materi yang mudah dipahami.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {subjects.map((s, i) => (
                <Link key={i} href={`/materials?subject=${encodeURIComponent(s.title.toLowerCase())}`}
                  className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl
                    border border-white/[0.07] bg-white/[0.03]
                    hover:bg-white/[0.07] hover:border-white/15
                    hover:scale-[1.03] active:scale-[.98] transition-all duration-200 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-200 shadow-md">
                    {s.emoji}
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs sm:text-sm">{s.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1 hidden sm:block">{s.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/materials"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                  bg-white/[0.06] border border-white/[0.09] hover:bg-white/[0.10] hover:border-white/15
                  text-slate-300 hover:text-white font-semibold text-sm
                  hover:scale-[1.02] active:scale-[.98] transition-all duration-200">
                <BookOpen className="w-4 h-4 text-purple-400" />Lihat Semua Materi<ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </section>

        {/* ════ HOW IT WORKS ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Cara Bermain, Mudah Banget! 🎉</h2>
              <p className="text-slate-500 text-sm">Tiga langkah, langsung bisa bertarung di arena.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-3">
              {[
                {n:'01',e:'📚',t:'Pilih Materi',       d:'Cari pelajaran yang kamu mau, pilih level kesulitan yang sesuai.',     g:'from-purple-500 to-violet-600'},
                {n:'02',e:'🎤',t:'Jawab Pakai Suara',  d:'Ucapkan jawabanmu — EchoArena memahami suaramu secara real-time.',    g:'from-pink-500 to-rose-600'},
                {n:'03',e:'🏆',t:'Raih Poin & Rank!',  d:'Skor terhitung instan, naik peringkat, jadilah juara di arena!',       g:'from-yellow-500 to-orange-500'},
              ].map((step,i) => (
                <div key={i} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/12 transition-colors">
                  {i < 2 && <div className="hidden sm:block absolute top-1/3 -right-5 z-10 text-slate-700 text-xl font-bold">→</div>}
                  <div className={`absolute -top-3 -left-3 w-9 h-9 bg-gradient-to-br ${step.g} rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg`}>{step.n}</div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.g} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>{step.e}</div>
                  <h3 className="text-white font-bold text-sm mb-2">{step.t}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ FEATURES ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto px-2 sm:px-0">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-400/20 rounded-full px-4 py-1.5 text-pink-300 text-xs font-bold uppercase tracking-widest mb-4">
                <Flame className="w-3.5 h-3.5" />Kenapa EchoArena?
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Belajar Serius, Tetap Seru 🔥</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">EchoArena bukan sekadar kuis — ini arena belajar untuk generasi muda.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURES.map((f,i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.07] hover:border-white/12 hover:bg-white/[0.06] rounded-2xl p-5 transition-all duration-200">
                  <div className={`w-10 h-10 bg-gradient-to-br ${f.g} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ FINAL CTA ════ */}
        {!isLoggedIn && (
          <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-800/50 via-pink-800/35 to-rose-800/25 backdrop-blur-sm p-8 sm:p-12 text-center">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-500/20  rounded-full blur-3xl pointer-events-none" />
              {[
                {e:'🎮',s:{top:'1rem',left:'1.5rem',animation:'fa 5s ease-in-out infinite',fontSize:'1.5rem',opacity:.38}},
                {e:'⭐',s:{top:'1rem',right:'1.5rem',animation:'fb 6s ease-in-out infinite',fontSize:'1.5rem',opacity:.38}},
                {e:'🏆',s:{bottom:'1rem',left:'2rem',animation:'fa 7s ease-in-out infinite',animationDelay:'2s',fontSize:'1.3rem',opacity:.28}},
                {e:'🎯',s:{bottom:'1rem',right:'2rem',animation:'fb 5s ease-in-out infinite',animationDelay:'1s',fontSize:'1.3rem',opacity:.28}},
              ].map((p,i) => <div key={i} className="absolute pointer-events-none select-none" style={p.s as any}>{p.e}</div>)}
              <div className="relative">
                <div className="text-4xl mb-4 inline-block" style={{animation:'wg 2.5s ease-in-out infinite'}}>🚀</div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Siap Mulai Petualangan Belajar?</h2>
                <p className="text-slate-300/70 text-sm mb-7 max-w-md mx-auto leading-relaxed">
                  Daftar gratis dan akses semua materi, kuis interaktif, serta arena multiplayer. Tidak perlu kartu kredit.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8">
                  {['Gratis selamanya','Tanpa iklan','Ribuan soal','Main multiplayer'].map(item => (
                    <span key={item} className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{item}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/auth/register"
                    className="btn-shim group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-base text-white overflow-hidden
                      bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                      shadow-xl shadow-purple-900/40 hover:scale-[1.03] active:scale-[.98] transition-all duration-200">
                    <Gift className="w-5 h-5" />Daftar Gratis Sekarang
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <button onClick={handleGuest} disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-medium text-sm
                      border border-white/15 text-slate-300 hover:text-white hover:bg-white/[0.07]
                      active:scale-[.98] transition-all duration-200 disabled:opacity-60">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    Coba Tanpa Daftar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════ TEAM ════ */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 pb-24">
          <div className="max-w-4xl mx-auto px-2 sm:px-0">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-4 shadow-xl">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Tim Pengembang</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">Dibuat dengan ❤️ oleh mahasiswa D3 Teknik Informatika Universitas Dian Nuswantoro</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEAM.map((dev,i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.07] hover:border-white/12 rounded-2xl p-6 text-center hover:scale-[1.02] transition-all duration-300 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${dev.g} rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>{dev.initials}</div>
                  <h3 className="text-white font-bold text-base mb-1">{dev.name}</h3>
                  <p className="text-slate-500 text-xs mb-0.5 flex items-center justify-center gap-1"><GraduationCap className="w-3 h-3" />{dev.nim}</p>
                  <p className="text-slate-600 text-xs mb-4">D3 TI · Udinus</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 bg-gradient-to-r ${dev.g} text-white shadow-md`}>{dev.role}</span>
                  <div className="flex justify-center gap-4">
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
                    <a href={dev.ig} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-pink-400 transition-colors"><Instagram className="w-4 h-4" /></a>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <p className="text-slate-600 text-xs mb-4">Ikuti perkembangan proyek</p>
              <div className="flex justify-center gap-6">
                <a href="https://github.com/iam-allend/EchoArena" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-medium transition-colors text-sm"><Github className="w-4 h-4" />GitHub</a>
                <a href="https://instagram.com/iam.allend" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-500 hover:text-pink-400 font-medium transition-colors text-sm"><Instagram className="w-4 h-4" />@echoarena.id</a>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-white/[0.05] py-6 text-center px-4">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/30 font-black text-sm">EchoArena</span>
          </div>
          <p className="text-white/15 text-xs">© 2025 EchoArena · D3 Teknik Informatika Universitas Dian Nuswantoro</p>
        </footer>

        <MusicControl trackUrl="/audio/home/upbeat-game-menu.mp3" />
      </main>
    </>
  )
}