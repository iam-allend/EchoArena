'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft, ChevronRight, Clock, Layers, Zap, Lock,
  BookOpen, ChevronDown, Loader2, AlertCircle, CheckCircle2,
  Trophy, LogIn, UserPlus, Eye, Menu, X, Star, Flame,
  Play, Shield, Target, Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  title: string
  content: string
  examples: string[]
}

interface Material {
  id: string
  title: string
  description: string | null
  subject: string
  level: string
  duration: string | null
  thumbnail: string | null
  topics_count: number
  is_quiz_enabled: boolean
  content: Section[]
  created_at: string
}

type SectionStatus = 'locked' | 'unlocked' | 'opened'

// ─── Config ───────────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, { label: string; color: string; glow: string }> = {
  sd:   { label: 'SD',   color: '#10b981', glow: 'rgba(16,185,129,.3)' },
  smp:  { label: 'SMP',  color: '#f59e0b', glow: 'rgba(245,158,11,.3)' },
  sma:  { label: 'SMA',  color: '#f43f5e', glow: 'rgba(244,63,94,.3)' },
  umum: { label: 'Umum', color: '#60a5fa', glow: 'rgba(96,165,250,.3)' },
}

const SUBJECT_CFG: Record<string, { accent: string; glow: string; from: string; icon: string }> = {
  matematika: { accent: '#a78bfa', glow: 'rgba(167,139,250,.2)', from: 'rgba(124,58,237,.15)', icon: '🔢' },
  sains:      { accent: '#22d3ee', glow: 'rgba(34,211,238,.2)',  from: 'rgba(6,182,212,.15)',  icon: '🔬' },
  sejarah:    { accent: '#fbbf24', glow: 'rgba(251,191,36,.2)',  from: 'rgba(217,119,6,.15)',  icon: '📜' },
  sastra:     { accent: '#f472b6', glow: 'rgba(244,114,182,.2)', from: 'rgba(219,39,119,.15)', icon: '✍️' },
  fisika:     { accent: '#60a5fa', glow: 'rgba(96,165,250,.2)',  from: 'rgba(37,99,235,.15)',  icon: '⚡' },
  kimia:      { accent: '#34d399', glow: 'rgba(52,211,153,.2)',  from: 'rgba(5,150,105,.15)',  icon: '⚗️' },
}

const BG = `
  radial-gradient(ellipse at 15% 15%, rgba(139,92,246,.12) 0%, transparent 55%),
  radial-gradient(ellipse at 85% 80%, rgba(34,211,238,.08) 0%, transparent 55%),
  linear-gradient(160deg, #050510 0%, #0a0820 60%, #060312 100%)
`

const GRID = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 40h40M40 0v40' stroke='rgba(139,92,246,.05)' stroke-width='1'/%3E%3C/svg%3E")`

function estimateReadTime(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}

function sectionStatus(index: number, opened: Set<number>): SectionStatus {
  if (opened.has(index)) return 'opened'
  if (index === 0 || opened.has(index - 1)) return 'unlocked'
  return 'locked'
}

// ─── Login Gate ───────────────────────────────────────────────────────────────

function LoginGate({ title }: { title: string }) {
  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ border: '1px solid rgba(139,92,246,.2)' }}>
      {/* blurred preview */}
      <div className="p-8 space-y-3 opacity-10 blur-sm pointer-events-none select-none">
        {[85, 65, 90, 55, 75, 60].map((w, i) => (
          <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: 'rgba(167,139,250,.3)' }} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        style={{ background: 'linear-gradient(to top, rgba(5,5,16,.98) 0%, rgba(10,8,32,.9) 60%, rgba(5,5,16,.7) 100%)', backdropFilter: 'blur(6px)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.4)', boxShadow: '0 0 30px rgba(139,92,246,.3)' }}>
          <Lock className="w-7 h-7" style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 8px #a78bfa)' }} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Konten Terkunci</h3>
        <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'rgba(200,180,255,.5)' }}>
          Login untuk membaca <strong style={{ color: '#c4b5fd' }}>{title}</strong> dan mengerjakan kuisnya secara gratis.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm text-white transition-all hover:scale-[1.03]"
            style={{ background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.4)' }}>
            <LogIn className="w-4 h-4" /> Masuk
          </Link>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,.5)' }}>
            <UserPlus className="w-4 h-4" /> Daftar Gratis
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, index, status, isExpanded, onToggle }: {
  section: Section
  index: number
  status: SectionStatus
  isExpanded: boolean
  onToggle: (i: number) => void
}) {
  const locked   = status === 'locked'
  const opened   = status === 'opened'
  const readTime = estimateReadTime(section.content)

  // Color per section — cycling accent colors
  const accentColors = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#60a5fa']
  const accent = accentColors[index % accentColors.length]

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: isExpanded
          ? `1px solid ${accent}35`
          : opened
            ? '1px solid rgba(52,211,153,.18)'
            : locked
              ? '1px solid rgba(255,255,255,.04)'
              : '1px solid rgba(255,255,255,.07)',
        background: isExpanded
          ? `linear-gradient(135deg, ${accent}08 0%, rgba(10,8,25,.9) 100%)`
          : opened
            ? 'rgba(52,211,153,.04)'
            : locked
              ? 'rgba(255,255,255,.01)'
              : 'rgba(255,255,255,.02)',
        boxShadow: isExpanded ? `0 0 30px ${accent}10` : 'none',
        opacity: locked ? 0.55 : 1,
      }}>

      {/* Header */}
      <button
        type="button"
        disabled={locked}
        onClick={() => !locked && onToggle(index)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        style={{ cursor: locked ? 'not-allowed' : 'pointer' }}>

        {/* Number badge */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all"
          style={opened
            ? { background: 'rgba(52,211,153,.2)', border: '1px solid rgba(52,211,153,.5)', color: '#34d399', boxShadow: '0 0 12px rgba(52,211,153,.3)' }
            : locked
              ? { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.2)' }
              : isExpanded
                ? { background: `${accent}25`, border: `1px solid ${accent}60`, color: accent, boxShadow: `0 0 12px ${accent}30` }
                : { background: `${accent}12`, border: `1px solid ${accent}30`, color: accent }
          }>
          {opened
            ? <CheckCircle2 className="w-4 h-4" />
            : locked
              ? <Lock className="w-3.5 h-3.5" />
              : <span>{index + 1}</span>}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate transition-colors"
            style={{ color: locked ? 'rgba(255,255,255,.2)' : opened ? '#86efac' : isExpanded ? '#fff' : 'rgba(220,210,255,.8)' }}>
            {section.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(180,160,255,.35)' }}>
              <Clock className="w-3 h-3" /> ~{readTime} menit
            </span>
            {locked && <span style={{ color: 'rgba(255,255,255,.18)', fontSize: 11 }}>· Selesaikan bagian sebelumnya</span>}
            {opened && <span style={{ color: 'rgba(52,211,153,.5)', fontSize: 11, fontWeight: 700 }}>· Sudah dibaca ✓</span>}
          </div>
        </div>

        {/* Arrow */}
        {!locked && (
          <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
            style={{ color: isExpanded ? accent : 'rgba(180,160,255,.25)', transform: isExpanded ? 'rotate(180deg)' : '' }} />
        )}
      </button>

      {/* Content */}
      {isExpanded && !locked && (
        <div className="px-5 pb-6 border-t" style={{ borderColor: `${accent}15` }}>
          {/* Left accent bar */}
          <div className="flex gap-4 pt-5">
            <div className="w-0.5 rounded-full shrink-0 self-stretch" style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }} />
            <div className="space-y-4 flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'rgba(220,210,255,.75)' }}>
                {section.content}
              </p>

              {section.examples?.filter(Boolean).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    style={{ color: 'rgba(52,211,153,.5)' }}>
                    <Star className="w-3 h-3" style={{ color: '#34d399' }} /> Contoh
                  </p>
                  {section.examples.filter(Boolean).map((ex, i) => (
                    <div key={i} className="rounded-xl px-4 py-3"
                      style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.18)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(134,239,172,.7)' }}>{ex}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ material, openedSections, allRead, activeIndex, onSectionClick }: {
  material: Material
  openedSections: Set<number>
  allRead: boolean
  activeIndex: number | null
  onSectionClick: (i: number) => void
}) {
  const sections = material.content
  const pct = sections.length > 0 ? Math.round((openedSections.size / sections.length) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Progress ring card */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.18)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-12 h-12 shrink-0">
            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(139,92,246,.15)" strokeWidth="3.5" />
              <circle cx="24" cy="24" r="19" fill="none"
                stroke={allRead ? '#10b981' : '#a855f7'} strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - pct / 100)}`}
                style={{ transition: 'stroke-dashoffset .6s ease, stroke .3s ease', filter: allRead ? 'drop-shadow(0 0 6px #10b981)' : 'drop-shadow(0 0 5px #a855f7)' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black text-xs"
              style={{ color: allRead ? '#34d399' : '#c4b5fd' }}>
              {pct}%
            </span>
          </div>
          <div>
            <p className="font-black text-white text-sm">Progress Baca</p>
            <p className="text-[11px]" style={{ color: 'rgba(180,160,255,.45)' }}>
              {openedSections.size} / {sections.length} bagian
            </p>
          </div>
        </div>
        {allRead && (
          <p className="text-xs font-bold text-center py-1.5 rounded-xl" style={{ color: '#34d399', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)' }}>
            ✓ Semua bagian selesai!
          </p>
        )}
      </div>

      {/* Section list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
        <div className="px-3 pt-3 pb-1">
          <p style={{ color: 'rgba(180,160,255,.35)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Daftar Bagian
          </p>
        </div>
        <div className="p-2 space-y-0.5">
          {sections.map((sec, i) => {
            const st = sectionStatus(i, openedSections)
            const isActive = activeIndex === i
            const accentColors = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#60a5fa']
            const accent = accentColors[i % accentColors.length]
            return (
              <button key={i}
                disabled={st === 'locked'}
                onClick={() => st !== 'locked' && onSectionClick(i)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  cursor: st === 'locked' ? 'not-allowed' : 'pointer',
                  opacity: st === 'locked' ? 0.4 : 1,
                  background: isActive ? `${accent}15` : 'transparent',
                  border: isActive ? `1px solid ${accent}30` : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (st === 'locked') return
                  ;(e.currentTarget as HTMLElement).style.background = `${accent}10`
                }}
                onMouseLeave={e => {
                  if (isActive) return
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                  style={st === 'opened'
                    ? { background: 'rgba(52,211,153,.25)', color: '#34d399' }
                    : st === 'locked'
                      ? { background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.2)' }
                      : { background: `${accent}20`, color: accent }}>
                  {st === 'opened' ? '✓' : st === 'locked' ? '🔒' : i + 1}
                </div>
                <p className="text-xs font-semibold truncate flex-1"
                  style={{ color: st === 'locked' ? 'rgba(255,255,255,.2)' : st === 'opened' ? 'rgba(134,239,172,.6)' : 'rgba(220,210,255,.7)' }}>
                  {sec.title}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quiz CTA */}
      {material.is_quiz_enabled && (
        <div className="rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: allRead ? 'rgba(251,191,36,.08)' : 'rgba(255,255,255,.02)',
            border: allRead ? '1px solid rgba(251,191,36,.3)' : '1px solid rgba(255,255,255,.05)',
            boxShadow: allRead ? '0 0 30px rgba(251,191,36,.1)' : 'none',
          }}>
          <div className="p-4">
            {allRead ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
                  <p className="font-black text-sm text-white">Quiz Tersedia!</p>
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'rgba(251,191,36,.5)' }}>Uji pemahamanmu sekarang.</p>
                <Link href={`/materials/${material.id}/quiz`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-black transition-all hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 16px rgba(251,191,36,.4)' }}>
                  <Zap className="w-4 h-4" /> Mulai Quiz
                </Link>
              </>
            ) : (
              <div className="text-center py-1">
                <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(255,255,255,.2)' }} />
                <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,.25)' }}>Quiz Terkunci</p>
                <p style={{ color: 'rgba(255,255,255,.15)', fontSize: 11, marginTop: 2 }}>
                  {openedSections.size}/{sections.length} bagian selesai
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaterialDetailPage() {
  const params   = useParams()
  const id       = params?.id as string
  const supabase = createClient()

  const [material, setMaterial]             = useState<Material | null>(null)
  const [loading, setLoading]               = useState(true)
  const [notFound, setNotFound]             = useState(false)
  const [isLoggedIn, setIsLoggedIn]         = useState(false)
  const [userId, setUserId]                 = useState<string | null>(null)
  const [questionCount, setQuestionCount]   = useState(0)
  const [openedSections, setOpenedSections] = useState<Set<number>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const [sessionRes, matRes, countRes] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from('materials').select('*').eq('id', id).single(),
          supabase.from('questions').select('*', { count: 'exact', head: true }).eq('material_id', id),
        ])
        if (cancelled) return

        const sess = sessionRes.data.session
        setIsLoggedIn(!!sess)

        if (matRes.error || !matRes.data) { setNotFound(true); setLoading(false); return }

        let sections: Section[] = []
        try {
          const raw = typeof matRes.data.content === 'string' ? JSON.parse(matRes.data.content) : matRes.data.content
          if (Array.isArray(raw)) sections = raw
        } catch {}

        setMaterial({ ...matRes.data, content: sections })
        setQuestionCount(countRes.count ?? 0)

        if (sess?.user?.id) {
          setUserId(sess.user.id)
          const { data: prog } = await supabase.from('reading_progress')
            .select('section_index').eq('user_id', sess.user.id).eq('material_id', id)
          if (!cancelled && prog) {
            const opened = new Set(prog.map((p: any) => p.section_index))
            setOpenedSections(opened)
            setExpandedSections(new Set(opened))
          }
        }
      } catch { if (!cancelled) setNotFound(true) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // ── Toggle section ─────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (index: number) => {
    if (!material) return
    setExpandedSections(prev => {
      const s = new Set(prev)
      s.has(index) ? s.delete(index) : s.add(index)
      return s
    })
    if (!openedSections.has(index) && userId) {
      try {
        await supabase.from('reading_progress').upsert(
          { user_id: userId, material_id: material.id, section_index: index },
          { onConflict: 'user_id,material_id,section_index' }
        )
        setOpenedSections(prev => new Set([...prev, index]))
      } catch (err) { console.error(err) }
    }
  }, [material, openedSections, userId])

  const handleSidebarClick = useCallback((index: number) => {
    setMobileSidebarOpen(false)
    setExpandedSections(prev => new Set([...prev, index]))
    setTimeout(() => sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    if (!openedSections.has(index) && userId && material) handleToggle(index)
  }, [openedSections, userId, material, handleToggle])

  const allRead    = material ? openedSections.size >= material.content.length && material.content.length > 0 : false
  const canDoQuiz  = allRead && material?.is_quiz_enabled && questionCount > 0
  const activeIndex = expandedSections.size > 0 ? Math.max(...Array.from(expandedSections)) : null

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.35)', boxShadow: '0 0 25px rgba(139,92,246,.3)' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#a855f7' }} />
        </div>
        <p style={{ color: 'rgba(200,180,255,.45)', fontSize: 14 }}>Memuat materi...</p>
      </div>
    </div>
  )

  if (notFound || !material) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto" style={{ color: '#f43f5e', filter: 'drop-shadow(0 0 10px #f43f5e)' }} />
        <p className="text-white font-bold text-xl">Materi tidak ditemukan</p>
        <Link href="/materials" className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#a78bfa' }}>
          ← Kembali ke daftar materi
        </Link>
      </div>
    </div>
  )

  const subCfg  = SUBJECT_CFG[material.subject] ?? { accent: '#a78bfa', glow: 'rgba(167,139,250,.2)', from: 'rgba(124,58,237,.12)', icon: '📖' }
  const lvlCfg  = LEVEL_CFG[material.level] ?? { label: material.level, color: '#60a5fa', glow: 'rgba(96,165,250,.3)' }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: GRID }} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 p-5 overflow-y-auto transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(5,5,16,.97)', borderRight: '1px solid rgba(139,92,246,.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-black text-white text-sm">Navigasi Materi</p>
          <button onClick={() => setMobileSidebarOpen(false)} style={{ color: 'rgba(180,160,255,.4)' }}
            className="hover:opacity-80 transition-opacity"><X className="w-5 h-5" /></button>
        </div>
        {isLoggedIn && <Sidebar material={material} openedSections={openedSections} allRead={allRead} activeIndex={activeIndex} onSectionClick={handleSidebarClick} />}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-24">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6" style={{ color: 'rgba(180,160,255,.35)', fontSize: 12 }}>
          <Link href="/materials" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
            <ChevronLeft className="w-3.5 h-3.5" /> Semua Materi
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="truncate max-w-[220px]" style={{ color: 'rgba(200,180,255,.5)' }}>{material.title}</span>
        </div>

        {/* ── Hero Banner ── */}
        <div className="relative rounded-3xl overflow-hidden mb-8"
          style={{
            background: `linear-gradient(135deg, ${subCfg.from} 0%, rgba(10,8,25,.9) 60%)`,
            border: `1px solid ${subCfg.accent}20`,
            boxShadow: `0 0 60px ${subCfg.glow}, 0 20px 40px rgba(0,0,0,.4)`,
          }}>
          {/* Glow orb */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${subCfg.glow} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
          {/* Top accent bar */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${subCfg.accent}, transparent)` }} />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl shrink-0"
                style={{ background: `${subCfg.accent}12`, border: `1px solid ${subCfg.accent}25`, boxShadow: `0 0 25px ${subCfg.glow}` }}>
                {material.thumbnail || subCfg.icon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full"
                    style={{ background: `${lvlCfg.color}15`, border: `1px solid ${lvlCfg.color}40`, color: lvlCfg.color, boxShadow: `0 0 10px ${lvlCfg.glow}` }}>
                    {lvlCfg.label}
                  </span>
                  <span className="text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full"
                    style={{ background: `${subCfg.accent}12`, border: `1px solid ${subCfg.accent}30`, color: subCfg.accent }}>
                    {subCfg.icon} {material.subject}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-2.5">{material.title}</h1>

                {material.description && (
                  <p className="text-sm leading-relaxed mb-3 max-w-2xl" style={{ color: 'rgba(200,180,255,.55)' }}>{material.description}</p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-3">
                  {material.duration && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(180,160,255,.45)' }}>
                      <Clock className="w-3.5 h-3.5" /> {material.duration}
                    </span>
                  )}
                  {material.content.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(180,160,255,.45)' }}>
                      <Layers className="w-3.5 h-3.5" /> {material.content.length} bagian
                    </span>
                  )}
                  {questionCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px #fbbf2450)' }}>
                      <Zap className="w-3.5 h-3.5" /> {questionCount} soal quiz
                    </span>
                  )}
                  {isLoggedIn && material.content.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: allRead ? '#34d399' : 'rgba(180,160,255,.45)' }}>
                      <Eye className="w-3.5 h-3.5" /> {openedSections.size}/{material.content.length} dibaca
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile nav button */}
              {isLoggedIn && (
                <button onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden self-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.03]"
                  style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)', color: '#c4b5fd' }}>
                  <Menu className="w-4 h-4" /> Menu
                </button>
              )}
            </div>
          </div>

          {/* Quiz CTA strip */}
          {isLoggedIn && canDoQuiz && (
            <div className="border-t px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4"
              style={{ borderColor: 'rgba(251,191,36,.15)', background: 'rgba(251,191,36,.05)' }}>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
                <p className="text-sm font-semibold text-white">{questionCount} soal siap</p>
                <span className="hidden sm:block text-xs" style={{ color: 'rgba(180,160,255,.35)' }}>· Uji pemahamanmu!</span>
              </div>
              <Link href={`/materials/${material.id}/quiz`}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs text-black transition-all hover:scale-[1.04]"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 16px rgba(251,191,36,.4)' }}>
                <Zap className="w-3.5 h-3.5" /> Mulai Quiz
              </Link>
            </div>
          )}

          {/* Quiz locked strip */}
          {isLoggedIn && material.is_quiz_enabled && questionCount > 0 && !canDoQuiz && (
            <div className="border-t px-6 sm:px-8 py-2.5 flex items-center gap-2"
              style={{ borderColor: 'rgba(255,255,255,.04)', background: 'rgba(0,0,0,.15)' }}>
              <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,.2)' }} />
              <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 12 }}>
                Quiz terkunci · Baca semua {material.content.length} bagian ({openedSections.size}/{material.content.length} selesai)
              </p>
            </div>
          )}
        </div>

        {/* ── Layout ── */}
        <div className="flex gap-7">

          {/* Desktop sidebar */}
          {isLoggedIn && material.content.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <Sidebar material={material} openedSections={openedSections} allRead={allRead} activeIndex={activeIndex} onSectionClick={handleSidebarClick} />
              </div>
            </aside>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!isLoggedIn ? (
              <LoginGate title={material.title} />
            ) : material.content.length === 0 ? (
              <div className="text-center py-24 space-y-3">
                <BookOpen className="w-12 h-12 mx-auto" style={{ color: 'rgba(139,92,246,.3)' }} />
                <p style={{ color: 'rgba(200,180,255,.35)', fontSize: 14 }}>Konten materi belum tersedia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Hint bar */}
                <div className="flex items-center gap-2 px-1 mb-5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgba(167,139,250,.4)' }} />
                  <p style={{ color: 'rgba(180,160,255,.4)', fontSize: 12, fontWeight: 600 }}>
                    Buka setiap bagian secara berurutan untuk membuka kunci quiz
                  </p>
                </div>

                {material.content.map((sec, i) => (
                  <div key={i} ref={el => { sectionRefs.current[i] = el }}>
                    <SectionCard
                      section={sec} index={i}
                      status={sectionStatus(i, openedSections)}
                      isExpanded={expandedSections.has(i)}
                      onToggle={handleToggle}
                    />
                  </div>
                ))}

                {/* All-read celebration */}
                {allRead && (
                  <div className="mt-5 text-center py-6 rounded-2xl"
                    style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.2)', boxShadow: '0 0 30px rgba(52,211,153,.08)' }}>
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-black text-base" style={{ color: '#34d399' }}>Semua bagian sudah dibaca!</p>
                    {canDoQuiz && (
                      <Link href={`/materials/${material.id}/quiz`}
                        className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl font-black text-sm text-black transition-all hover:scale-[1.03]"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 20px rgba(251,191,36,.4)' }}>
                        <Zap className="w-4 h-4" /> Mulai Solo Quiz Sekarang
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Guest CTA */}
            {!isLoggedIn && (
              <div className="mt-6 text-center py-7 px-6 rounded-2xl"
                style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)' }}>
                <p className="text-white font-black text-base mb-1">Suka materinya?</p>
                <p className="text-sm mb-5" style={{ color: 'rgba(200,180,255,.45)' }}>Buat akun gratis untuk akses penuh + quiz interaktif.</p>
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <Link href="/auth/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.03]"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,.4)' }}>
                    <UserPlus className="w-4 h-4" /> Daftar Gratis
                  </Link>
                  <Link href="/auth/login"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(139,92,246,.25)', color: 'rgba(200,180,255,.5)' }}>
                    <LogIn className="w-4 h-4" /> Sudah punya akun
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-8 flex justify-center">
              <Link href="/materials" className="inline-flex items-center gap-2 text-sm transition-all hover:opacity-70"
                style={{ color: 'rgba(180,160,255,.3)' }}>
                <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Materi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}