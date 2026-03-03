'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'       // ← useParams, bukan props
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft, Clock, Layers, Zap, Lock,
  BookOpen, ChevronDown, ChevronRight,
  Loader2, AlertCircle, CheckCircle2,
  Trophy, LogIn, UserPlus, LayoutDashboard,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  title: string
  content: string
  examples: string[]
}

interface Material {
  id: number
  title: string
  description: string
  subject: string
  level: string
  duration: string
  thumbnail: string | null
  topics_count: number
  content: Section[]
  created_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sd:   { label: 'SD',   color: 'text-green-300',  bg: 'bg-green-500/15 border-green-500/30' },
  smp:  { label: 'SMP',  color: 'text-yellow-300', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  sma:  { label: 'SMA',  color: 'text-red-300',    bg: 'bg-red-500/15 border-red-500/30' },
  umum: { label: 'Umum', color: 'text-blue-300',   bg: 'bg-blue-500/15 border-blue-500/30' },
}

const SUBJECT_GRADIENT: Record<string, string> = {
  matematika: 'from-violet-900/40 via-purple-900/20 to-transparent',
  sains:      'from-cyan-900/40 via-teal-900/20 to-transparent',
  sejarah:    'from-amber-900/40 via-orange-900/20 to-transparent',
  sastra:     'from-rose-900/40 via-pink-900/20 to-transparent',
}

const SUBJECT_ACCENT: Record<string, string> = {
  matematika: 'border-violet-500/30 text-violet-300',
  sains:      'border-cyan-500/30 text-cyan-300',
  sejarah:    'border-amber-500/30 text-amber-300',
  sastra:     'border-rose-500/30 text-rose-300',
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: Section; index: number }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      open
        ? 'border-purple-500/25 bg-purple-900/10'
        : 'border-purple-500/10 bg-white/[0.02]'
    }`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-white/[0.03] transition-colors">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
          open ? 'bg-purple-600/40 text-purple-200' : 'bg-purple-900/30 text-purple-400/60'
        }`}>
          {index + 1}
        </div>
        <span className={`flex-1 font-bold text-sm transition-colors ${open ? 'text-white' : 'text-purple-200/60'}`}>
          {section.title}
        </span>
        <ChevronDown className={`w-4 h-4 text-purple-400/50 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-purple-500/10">
          <p className="pt-4 text-purple-100/80 text-sm leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
          {section.examples?.filter(Boolean).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-purple-300/40 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60" /> Contoh
              </p>
              {section.examples.filter(Boolean).map((ex, i) => (
                <div key={i} className="bg-emerald-900/15 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-emerald-200/70 leading-relaxed">{ex}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Login Gate ───────────────────────────────────────────────────────────────

function LoginGate({ title }: { title: string }) {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-purple-500/25">
      {/* Fake blurred content preview */}
      <div className="p-6 space-y-3 opacity-20 blur-sm pointer-events-none select-none">
        {[80, 60, 90, 50].map((w, i) => (
          <div key={i} className={`h-3 bg-purple-300/30 rounded-full`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8
        bg-gradient-to-t from-indigo-950/95 via-purple-950/80 to-indigo-950/60 backdrop-blur-sm">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/25 border border-purple-400/25 flex items-center justify-center mb-4 shadow-xl shadow-purple-900/40">
          <Lock className="w-7 h-7 text-purple-300" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Konten Terkunci</h3>
        <p className="text-purple-200/60 text-sm mb-6 max-w-sm leading-relaxed">
          Login atau buat akun gratis untuk membaca isi materi{' '}
          <strong className="text-purple-200">{title}</strong> dan mengerjakan kuisnya.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-400/25 bg-purple-900/30 text-white text-sm font-semibold hover:bg-purple-800/40 transition-colors">
            <LogIn className="w-4 h-4" /> Masuk
          </Link>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg shadow-purple-900/40 hover:opacity-90 transition-opacity">
            <UserPlus className="w-4 h-4" /> Daftar Gratis
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Bottom CTA — conditional ─────────────────────────────────────────────────

function BottomCTA({ isLoggedIn, hasQuiz, materialId }: {
  isLoggedIn: boolean
  hasQuiz: boolean
  materialId: number
}) {
  // Sudah login & ada soal → CTA ke Quiz
  if (isLoggedIn && hasQuiz) {
    return (
      <div className="mt-8 relative overflow-hidden rounded-2xl border border-yellow-500/25 bg-yellow-900/10 p-6 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-yellow-500/15 blur-3xl" />
        </div>
        <div className="relative">
          <Trophy className="w-9 h-9 text-yellow-400 mx-auto mb-3" />
          <p className="text-white font-black text-lg mb-1">Sudah siap diuji?</p>
          <p className="text-purple-200/50 text-sm mb-4">Kerjakan kuis dan lihat seberapa paham kamu.</p>
          <Link href={`/materials/${materialId}/quiz`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black shadow-lg hover:opacity-90 transition-opacity text-sm">
            <Zap className="w-4 h-4" /> Mulai Solo Quiz
          </Link>
        </div>
      </div>
    )
  }

  // Sudah login & tidak ada soal → CTA ke dashboard
  if (isLoggedIn && !hasQuiz) {
    return (
      <div className="mt-8 flex justify-center">
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-400/20 text-purple-300/60 text-sm font-medium hover:bg-purple-500/10 transition-colors">
          <LayoutDashboard className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  // Belum login → CTA daftar/masuk
  return (
    <div className="mt-8 relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-900/10 p-6 text-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-purple-600/15 blur-3xl" />
      </div>
      <div className="relative">
        <p className="text-white font-black text-lg mb-1">Suka materinya?</p>
        <p className="text-purple-200/50 text-sm mb-4 max-w-sm mx-auto">
          Buat akun gratis untuk akses penuh, kuis interaktif, dan arena multiplayer.
        </p>
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg shadow-purple-900/40 hover:opacity-90 transition-opacity text-sm">
            <UserPlus className="w-4 h-4" /> Daftar Gratis
          </Link>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-400/20 text-purple-200/60 text-sm font-medium hover:bg-purple-500/10 transition-colors">
            <LogIn className="w-4 h-4" /> Sudah punya akun
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaterialDetailPage() {
  const params   = useParams()                           // ← fix: useParams hook
  const id       = params?.id as string
  const supabase = createClient()

  const [material, setMaterial]           = useState<Material | null>(null)
  const [loading, setLoading]             = useState(true)
  const [notFound, setNotFound]           = useState(false)
  const [isLoggedIn, setIsLoggedIn]       = useState(false)
  const [questionCount, setQuestionCount] = useState(0)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        // Jalankan semua fetch parallel
        const [sessionRes, matRes, countRes] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from('materials').select('*').eq('id', id).single(),
          supabase.from('questions').select('*', { count: 'exact', head: true }).eq('material_id', id),
        ])

        setIsLoggedIn(!!sessionRes.data.session)

        if (matRes.error || !matRes.data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        // Parse content jsonb → Section[]
        let sections: Section[] = []
        try {
          const raw = typeof matRes.data.content === 'string'
            ? JSON.parse(matRes.data.content)
            : matRes.data.content
          if (Array.isArray(raw)) sections = raw
        } catch {
          sections = []
        }

        setMaterial({ ...matRes.data, content: sections })
        setQuestionCount(countRes.count ?? 0)
      } catch (err) {
        console.error('Load material error:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center gap-3 text-purple-300/50">
      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      Memuat materi...
    </div>
  )

  // ── Not found ─────────────────────────────────────────────────────────────

  if (notFound || !material) return (
    <div className="max-w-lg mx-auto text-center py-32 space-y-4 px-4">
      <AlertCircle className="w-12 h-12 text-purple-500/40 mx-auto" />
      <p className="text-purple-200/60 font-bold text-xl">Materi tidak ditemukan</p>
      <Link href="/materials" className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors">
        ← Kembali ke daftar materi
      </Link>
    </div>
  )

  const levelCfg    = LEVEL_CONFIG[material.level]     ?? { label: material.level, color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-600/30' }
  const gradClass   = SUBJECT_GRADIENT[material.subject] ?? 'from-purple-900/30 to-transparent'
  const accentClass = SUBJECT_ACCENT[material.subject]   ?? 'border-purple-500/20 text-purple-300/60'

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-24">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-purple-700/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] w-56 h-56 bg-pink-700/10 rounded-full blur-[70px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-purple-300/40 mb-6 pt-2">
          <Link href="/materials" className="hover:text-purple-300 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Semua Materi
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-purple-200/50 truncate max-w-[200px]">{material.title}</span>
        </div>

        {/* ── Hero Banner ── */}
        <div className={`relative rounded-3xl overflow-hidden border border-purple-500/15 bg-gradient-to-br ${gradClass} mb-8`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-3xl" />
          </div>
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/25 border border-white/10 flex items-center justify-center text-5xl sm:text-6xl shadow-xl shrink-0">
              {material.thumbnail || '📚'}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${levelCfg.bg} ${levelCfg.color}`}>
                  {levelCfg.label}
                </span>
                <span className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full border bg-transparent ${accentClass}`}>
                  {material.subject}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-3">
                {material.title}
              </h1>
              {material.description && (
                <p className="text-purple-200/60 text-sm leading-relaxed mb-4 max-w-2xl">
                  {material.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                {material.duration && (
                  <span className="flex items-center gap-1.5 text-purple-300/50">
                    <Clock className="w-3.5 h-3.5" /> {material.duration}
                  </span>
                )}
                {material.topics_count > 0 && (
                  <span className="flex items-center gap-1.5 text-purple-300/50">
                    <Layers className="w-3.5 h-3.5" /> {material.topics_count} bagian
                  </span>
                )}
                {questionCount > 0 && (
                  <span className="flex items-center gap-1.5 text-yellow-400/80 font-semibold">
                    <Zap className="w-3.5 h-3.5" /> {questionCount} soal kuis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quiz strip — hanya jika login dan ada soal */}
          {isLoggedIn && questionCount > 0 && (
            <div className="border-t border-purple-500/10 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 bg-black/15">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-semibold text-white">
                  {questionCount} soal siap
                </p>
                <span className="hidden sm:block text-xs text-purple-300/40">· Tes pemahamanmu setelah belajar</span>
              </div>
              <Link href={`/materials/${material.id}/quiz`}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-black shadow-lg hover:opacity-90 transition-opacity">
                <Zap className="w-3.5 h-3.5" /> Mulai Kuis
              </Link>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {!isLoggedIn ? (
          <LoginGate title={material.title} />
        ) : material.content.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-10 h-10 text-purple-500/30 mx-auto" />
            <p className="text-purple-300/40">Konten materi belum tersedia.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 px-1">
              <BookOpen className="w-4 h-4 text-purple-400/40" />
              <p className="text-xs text-purple-300/40 font-bold uppercase tracking-widest">
                {material.content.length} Bagian
              </p>
            </div>
            <div className="space-y-3">
              {material.content.map((sec, i) => (
                <SectionCard key={i} section={sec} index={i} />
              ))}
            </div>
          </>
        )}

        {/* ── Bottom CTA — conditional ── */}
        <BottomCTA
          isLoggedIn={isLoggedIn}
          hasQuiz={questionCount > 0}
          materialId={material.id}
        />

        {/* Back link */}
        <div className="pt-8 flex justify-center">
          <Link href="/materials"
            className="inline-flex items-center gap-2 text-sm text-purple-400/50 hover:text-purple-300 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Materi
          </Link>
        </div>
      </div>
    </div>
  )
}