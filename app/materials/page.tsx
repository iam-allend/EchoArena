'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Search, BookOpen, Zap, Clock, Layers,
  ChevronRight, Loader2, SlidersHorizontal, X,
  GraduationCap, FlaskConical, Scroll, Feather,
  Trophy, LogIn, UserPlus, LayoutDashboard,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: number
  title: string
  description: string
  subject: string
  level: string
  duration: string
  thumbnail: string | null
  topics_count: number
  question_count: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { value: 'all',        label: 'Semua',      icon: Layers },
  { value: 'matematika', label: 'Matematika', icon: Zap },
  { value: 'sains',      label: 'Sains',      icon: FlaskConical },
  { value: 'sejarah',    label: 'Sejarah',    icon: Scroll },
  { value: 'sastra',     label: 'Sastra',     icon: Feather },
]

const LEVELS = [
  { value: 'all',  label: 'Semua Level', color: 'text-slate-300',  bg: 'bg-white/5 border-white/10',           active: 'bg-white/15 border-white/30 text-white' },
  { value: 'sd',   label: 'SD',          color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/20',  active: 'bg-green-500/25 border-green-400/50 text-green-300' },
  { value: 'smp',  label: 'SMP',         color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20', active: 'bg-yellow-500/25 border-yellow-400/50 text-yellow-300' },
  { value: 'sma',  label: 'SMA',         color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/20',      active: 'bg-red-500/25 border-red-400/50 text-red-300' },
  { value: 'umum', label: 'Umum',        color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/20',    active: 'bg-blue-500/25 border-blue-400/50 text-blue-300' },
]

const LEVEL_BADGE: Record<string, string> = {
  sd:   'bg-green-500/15 text-green-300 border-green-500/30',
  smp:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  sma:  'bg-red-500/15 text-red-300 border-red-500/30',
  umum: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
}

const SUBJECT_STYLE: Record<string, { card: string; glow: string; accent: string }> = {
  matematika: { card: 'from-violet-600/15 to-purple-900/5 border-violet-500/20',  glow: 'hover:shadow-violet-900/50', accent: 'text-violet-400' },
  sains:      { card: 'from-cyan-600/15 to-teal-900/5 border-cyan-500/20',        glow: 'hover:shadow-cyan-900/50',   accent: 'text-cyan-400' },
  sejarah:    { card: 'from-amber-600/15 to-orange-900/5 border-amber-500/20',    glow: 'hover:shadow-amber-900/50',  accent: 'text-amber-400' },
  sastra:     { card: 'from-rose-600/15 to-pink-900/5 border-rose-500/20',        glow: 'hover:shadow-rose-900/50',   accent: 'text-rose-400' },
}
const DEFAULT_STYLE = { card: 'from-slate-700/15 to-slate-900/5 border-slate-600/20', glow: 'hover:shadow-slate-900/50', accent: 'text-slate-400' }

// ─── Floating particle (pure CSS, no lib) ─────────────────────────────────────

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Orbs */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[50%] right-[10%] w-56 h-56 bg-pink-600/15 rounded-full blur-[70px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      <div className="absolute bottom-[20%] left-[30%] w-48 h-48 bg-indigo-600/15 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '4s' }} />

      {/* Floating emoji particles */}
      {[
        { emoji: '📖', top: '8%',  left: '5%',  delay: '0s',   duration: '12s', size: 'text-2xl' },
        { emoji: '🔬', top: '20%', right: '8%', delay: '3s',   duration: '10s', size: 'text-xl'  },
        { emoji: '📐', top: '60%', left: '3%',  delay: '1.5s', duration: '14s', size: 'text-lg'  },
        { emoji: '🏺', top: '75%', right: '5%', delay: '5s',   duration: '11s', size: 'text-2xl' },
        { emoji: '✏️', top: '40%', left: '90%', delay: '2s',   duration: '13s', size: 'text-xl'  },
        { emoji: '🧮', top: '85%', left: '20%', delay: '4s',   duration: '9s',  size: 'text-lg'  },
      ].map((p, i) => (
        <div key={i} className={`absolute ${p.size} opacity-20`}
          style={{
            top: p.top, left: (p as any).left, right: (p as any).right,
            animation: `float ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}>
          {p.emoji}
        </div>
      ))}

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-20 bg-white/[0.04]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-full" />
        <div className="h-3 bg-white/[0.04] rounded-lg w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-10 bg-white/[0.06] rounded-full" />
          <div className="h-5 w-14 bg-white/[0.06] rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Material Card ─────────────────────────────────────────────────────────────

function MaterialCard({ m }: { m: Material }) {
  const style = SUBJECT_STYLE[m.subject] ?? DEFAULT_STYLE

  return (
    <Link href={`/materials/${m.id}`}>
      <div className={`group relative bg-gradient-to-br ${style.card} border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl ${style.glow} cursor-pointer h-full flex flex-col`}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start gap-4">
          <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            {m.thumbnail || '📚'}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors">
              {m.title}
            </p>
            <p className={`text-xs mt-1 font-semibold capitalize ${style.accent}`}>{m.subject}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full border ${LEVEL_BADGE[m.level] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
            {m.level?.toUpperCase()}
          </span>
        </div>

        {/* Desc */}
        <div className="px-5 pb-4 flex-1">
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {m.description || 'Tidak ada deskripsi.'}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-3 flex-wrap">
            {m.duration && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" /> {m.duration}
              </span>
            )}
            {m.topics_count > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Layers className="w-3 h-3" /> {m.topics_count} bagian
              </span>
            )}
            {m.question_count > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-purple-400/80 font-semibold">
                <Zap className="w-3 h-3" /> {m.question_count} soal
              </span>
            )}
          </div>
          <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-purple-500/25 border border-white/10 group-hover:border-purple-400/40 flex items-center justify-center transition-all shrink-0">
            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>

        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/[0.04] to-transparent" />
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const supabase = createClient()

  const [materials, setMaterials]     = useState<Material[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [subject, setSubject]         = useState('all')
  const [level, setLevel]             = useState('all')
  const [showFilter, setShowFilter]   = useState(false)
  const [categoryCount, setCategoryCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn]   = useState(false)   // ← tambah

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: { session } }, { data: mats }, { count: catCount }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('materials').select(`
        id, title, description, subject, level,
        duration, thumbnail, topics_count,
        question_count:questions(count)
      `).order('created_at', { ascending: false }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ])

    setIsLoggedIn(!!session)
    if (mats) {
      setMaterials(mats.map((m: any) => ({
        ...m,
        question_count: m.question_count?.[0]?.count ?? 0,
      })))
    }
    setCategoryCount(catCount ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = materials.filter(m => {
    const q = search.toLowerCase()
    const matchSearch  = !q || m.title.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q)
    const matchSubject = subject === 'all' || m.subject === subject
    const matchLevel   = level === 'all'   || m.level   === level
    return matchSearch && matchSubject && matchLevel
  })

  const activeFilters = (subject !== 'all' ? 1 : 0) + (level !== 'all' ? 1 : 0)
  const totalQuestions = materials.reduce((a, m) => a + m.question_count, 0)

  return (
    <>
      {/* ── Keyframes untuk float animation ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-18px) rotate(3deg); }
          66%       { transform: translateY(-8px) rotate(-2deg); }
        }
      `}</style>

      <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-10">
        <Particles />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-20">

          {/* ── Hero ── */}
          <div className="text-center pt-14 pb-8 sm:py-20 space-y-5">
            <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/25 rounded-full px-4 py-1.5 text-xs font-bold text-purple-300 uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5" /> Perpustakaan Materi
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              Belajar Lebih{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Cerdas
              </span>
            </h1>
            <p className="text-purple-200/80 text-lg max-w-xl mx-auto">
              Jelajahi materi dari kontributor terbaik, lengkap dengan kuis interaktif
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-3">
              {[
                { label: 'Materi',   value: loading ? '...' : materials.length },
                { label: 'Soal',     value: loading ? '...' : totalQuestions },
                { label: 'Kategori', value: loading ? '...' : categoryCount },   // ← dari DB
              ].map(s => (
                <div key={s.label} className="text-center group">
                  <p className="text-3xl font-black text-white group-hover:text-purple-300 transition-colors">{s.value}</p>
                  <p className="text-xs text-purple-300/60 font-semibold uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Search + Filter ── */}
          <div className="sticky top-20 z-30 py-3">
            <div className="bg-indigo-950/70 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl shadow-purple-900/30">

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari materi..."
                  className="w-full bg-white/5 border border-purple-500/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.08] transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subject pills — desktop */}
              <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                {SUBJECTS.map(s => (
                  <button key={s.value} onClick={() => setSubject(s.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      subject === s.value
                        ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                        : 'border-purple-500/10 text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/10'
                    }`}>
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Filter toggle — mobile */}
              <button onClick={() => setShowFilter(o => !o)}
                className={`sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  activeFilters > 0
                    ? 'bg-purple-500/25 border-purple-400/40 text-purple-200'
                    : 'border-purple-500/15 text-purple-300/50 hover:bg-purple-500/10'
                }`}>
                <SlidersHorizontal className="w-4 h-4" />
                Filter {activeFilters > 0 && `(${activeFilters})`}
              </button>
            </div>

            {/* Level pills */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {LEVELS.map(l => (
                <button key={l.value} onClick={() => setLevel(l.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    level === l.value ? l.active : `${l.bg} ${l.color} hover:opacity-80`
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Mobile subject filter dropdown */}
            {showFilter && (
              <div className="sm:hidden mt-2 flex flex-wrap gap-2 bg-indigo-950/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3">
                {SUBJECTS.map(s => (
                  <button key={s.value} onClick={() => setSubject(s.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      subject === s.value
                        ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                        : 'border-purple-500/10 text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/10'
                    }`}>
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Result info ── */}
          {!loading && (
            <div className="flex items-center justify-between mb-5 mt-3 px-1">
              <p className="text-xs text-purple-300/50 font-medium">
                {filtered.length === materials.length
                  ? `${materials.length} materi tersedia`
                  : `${filtered.length} dari ${materials.length} materi`}
              </p>
              {(search || subject !== 'all' || level !== 'all') && (
                <button onClick={() => { setSearch(''); setSubject('all'); setLevel('all') }}
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" /> Reset filter
                </button>
              )}
            </div>
          )}

          {/* ── Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>

          ) : filtered.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-500/50" />
              </div>
              <p className="text-purple-200/60 font-semibold">Tidak ada materi yang cocok</p>
              <button onClick={() => { setSearch(''); setSubject('all'); setLevel('all') }}
                className="text-sm text-pink-400 hover:text-pink-300 underline transition-colors">
                Tampilkan semua materi
              </button>
            </div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(m => <MaterialCard key={m.id} m={m} />)}
            </div>
          )}

          {/* ── Bottom CTA — conditional ── */}
          <div className="mt-16 relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gray-900/60 backdrop-blur-sm p-8 sm:p-12 text-center shadow-2xl shadow-purple-900/30">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-600/25 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-600/15 blur-3xl" />
            </div>
            <div className="relative">
              {isLoggedIn ? (
                /* Sudah login → arahkan ke dashboard / arena */
                <>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 mb-5 shadow-xl shadow-emerald-900/50">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                    Siap Bertarung di Arena?
                  </h2>
                  <p className="text-purple-200/70 mb-6 max-w-md mx-auto text-sm">
                    Kamu sudah login — pilih materi, selesaikan kuis, lalu tantang pemain lain di arena multiplayer.
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all text-sm">
                      <LayoutDashboard className="w-4 h-4" /> Ke Dashboard
                    </Link>
                  </div>
                </>
              ) : (
                /* Belum login → dorong daftar */
                <>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-5 shadow-xl shadow-purple-900/50">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                    Siap Bertanding di Arena?
                  </h2>
                  <p className="text-purple-200/70 mb-6 max-w-md mx-auto text-sm">
                    Daftar sekarang untuk akses penuh ke semua materi, kuis interaktif, dan arena multiplayer.
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link href="/auth/register"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg shadow-purple-900/40 hover:opacity-90 hover:scale-[1.02] transition-all text-sm">
                      <UserPlus className="w-4 h-4" /> Mulai Gratis <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link href="/auth/login"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-purple-400/20 text-purple-200/80 font-medium hover:bg-purple-500/10 transition-colors text-sm">
                      <LogIn className="w-4 h-4" /> Sudah punya akun
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}