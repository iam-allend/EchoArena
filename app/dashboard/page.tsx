'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { getGuestDaysRemaining, clearGuestAccount } from '@/lib/auth/guest'
import { MusicControl } from '@/components/ui/MusicControl'

import {
  Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle,
  Trophy, Star, Zap, Target, BookOpen, Plus, ArrowRight, Flame,
  Calendar, ChevronDown, ChevronUp, Swords, Shield, Users, Settings,
  PenLine, BarChart3, Coins, Medal, Layers, ChevronRight, FileText,
  Sparkles, UserCheck, Lock,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomHistory {
  id: string
  room_code: string
  status: string
  created_at: string
  current_stage: number
  max_stages: number
  is_host: boolean
  participant_status?: string
}

interface QuizSession {
  id: number
  material_title: string
  correct_count: number
  wrong_count: number
  total_coins_earned: number
  coin_credited: boolean
  completed_at: string
}

interface ContribStats {
  questions_count: number
  materials_count: number
  quiz_enabled_count: number
}

const ACTIVE_PAGE_SIZE = 3
const PAST_PAGE_SIZE   = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xpToLevel(xp: number) {
  let lvl = 1, threshold = 100, cum = 0
  while (cum + threshold <= xp && lvl < 99) { cum += threshold; lvl++; threshold = 100 + (lvl - 1) * 150 }
  return { level: lvl, current: xp - cum, needed: threshold, percent: Math.round(((xp - cum) / threshold) * 100) }
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const gradients = [
    'from-violet-500 to-purple-700', 'from-cyan-500 to-blue-700',
    'from-pink-500 to-rose-700',     'from-emerald-500 to-teal-700',
    'from-amber-500 to-orange-600',  'from-fuchsia-500 to-pink-700',
  ]
  const g  = gradients[(name?.charCodeAt(0) ?? 0) % gradients.length]
  const sz = size === 'xl' ? 'w-20 h-20 text-2xl' : size === 'lg' ? 'w-14 h-14 text-lg' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${g} flex items-center justify-center font-black text-white shrink-0 shadow-lg ring-2 ring-white/15`}>
      {name?.slice(0, 2).toUpperCase() ?? 'U'}
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ isAdmin, isContributor, isGuest }: { isAdmin?: boolean; isContributor?: boolean; isGuest?: boolean }) {
  if (isAdmin) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
      style={{ background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.4)', color: '#f43f5e', boxShadow: '0 0 12px rgba(244,63,94,.2)' }}>
      <Shield className="w-3 h-3" /> Admin
    </span>
  )
  if (isContributor) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
      style={{ background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.4)', color: '#fbbf24', boxShadow: '0 0 12px rgba(251,191,36,.2)' }}>
      <PenLine className="w-3 h-3" /> Kontributor
    </span>
  )
  if (isGuest) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
      style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', color: '#f59e0b' }}>
      <AlertTriangle className="w-3 h-3" /> Tamu
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
      style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.35)', color: '#a78bfa' }}>
      <Star className="w-3 h-3" /> Pemain
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: string | number; color: string; sub?: string
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    yellow:  { bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.2)',  text: '#fbbf24', glow: '0 0 20px rgba(251,191,36,.15)' },
    purple:  { bg: 'rgba(167,139,250,.08)', border: 'rgba(167,139,250,.2)', text: '#c4b5fd', glow: '0 0 20px rgba(167,139,250,.15)' },
    cyan:    { bg: 'rgba(34,211,238,.08)',  border: 'rgba(34,211,238,.2)',  text: '#22d3ee', glow: '0 0 20px rgba(34,211,238,.15)' },
    emerald: { bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.2)',  text: '#34d399', glow: '0 0 20px rgba(52,211,153,.15)' },
    pink:    { bg: 'rgba(244,114,182,.08)', border: 'rgba(244,114,182,.2)', text: '#f472b6', glow: '0 0 20px rgba(244,114,182,.15)' },
    red:     { bg: 'rgba(248,113,113,.08)', border: 'rgba(248,113,113,.2)', text: '#f87171', glow: '0 0 20px rgba(248,113,113,.15)' },
  }
  const c = colorMap[color] ?? colorMap.purple
  return (
    <div className="relative rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02]"
      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: c.glow }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{ background: c.text + '20', border: `1px solid ${c.text}40` }}>
        <Icon className="w-4 h-4" style={{ color: c.text }} />
      </div>
      <p className="font-black text-2xl leading-none" style={{ color: c.text, textShadow: `0 0 16px ${c.text}60` }}>{value}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(200,180,255,.4)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(200,180,255,.25)' }}>{sub}</p>}
    </div>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function QuickAction({ icon: Icon, label, sub, color, href, onClick, badge }: {
  icon: any; label: string; sub: string; color: string; href?: string; onClick?: () => void; badge?: string
}) {
  const colorMap: Record<string, { from: string; to: string; glow: string; border: string }> = {
    emerald: { from: '#10b981', to: '#059669', glow: 'rgba(16,185,129,.3)',  border: 'rgba(16,185,129,.25)' },
    blue:    { from: '#3b82f6', to: '#2563eb', glow: 'rgba(59,130,246,.3)',  border: 'rgba(59,130,246,.25)' },
    yellow:  { from: '#fbbf24', to: '#f59e0b', glow: 'rgba(251,191,36,.3)',  border: 'rgba(251,191,36,.25)' },
    purple:  { from: '#a855f7', to: '#7c3aed', glow: 'rgba(168,85,247,.3)',  border: 'rgba(168,85,247,.25)' },
    red:     { from: '#f43f5e', to: '#e11d48', glow: 'rgba(244,63,94,.3)',   border: 'rgba(244,63,94,.25)' },
    cyan:    { from: '#06b6d4', to: '#0891b2', glow: 'rgba(6,182,212,.3)',   border: 'rgba(6,182,212,.25)' },
    pink:    { from: '#f472b6', to: '#ec4899', glow: 'rgba(244,114,182,.3)', border: 'rgba(244,114,182,.25)' },
    amber:   { from: '#f59e0b', to: '#d97706', glow: 'rgba(245,158,11,.3)',  border: 'rgba(245,158,11,.25)' },
  }
  const c = colorMap[color] ?? colorMap.purple
  const cls = "group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[.99]"
  const style = { background: `${c.from}10`, border: `1px solid ${c.border}`, boxShadow: `0 4px 20px ${c.glow}20` }
  const inner = (
    <>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-80"
        style={{ background: `${c.from}20` }} />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shrink-0"
          style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, boxShadow: `0 4px 16px ${c.glow}` }}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-black text-base leading-tight">{label}</p>
            {badge && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                style={{ background: c.from + '30', border: `1px solid ${c.from}50`, color: c.from }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(200,180,255,.4)' }}>{sub}</p>
        </div>
        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: c.from + '80' }} />
      </div>
    </>
  )
  if (href) return <Link href={href} className={cls} style={style}>{inner}</Link>
  return <button onClick={onClick} className={cls} style={style}>{inner}</button>
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, color = '#a78bfa' }: {
  icon: any; title: string; count?: number; color?: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-1 mb-3">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color + '25' }}>
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <span className="text-white font-bold text-sm">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(200,180,255,.4)', border: '1px solid rgba(255,255,255,.06)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ─── XP Progress Bar ──────────────────────────────────────────────────────────

function XPBar({ xp }: { xp: number }) {
  const { level, current, needed, percent } = xpToLevel(xp)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold" style={{ color: 'rgba(200,180,255,.4)' }}>XP Progress</span>
        <span className="text-[11px] font-black" style={{ color: '#a78bfa' }}>{current}/{needed} XP → Lv.{level + 1}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.05)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)', boxShadow: '0 0 10px rgba(168,85,247,.5)' }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router   = useRouter()
  const { user, isGuest, loading, expiresAt, isAuthenticated, logout } = useAuth()
  const supabase = createClient()

  // Room history
  const [activeRooms, setActiveRooms]   = useState<RoomHistory[]>([])
  const [pastRooms, setPastRooms]       = useState<RoomHistory[]>([])
  const [activePage, setActivePage]     = useState(1)
  const [pastPage, setPastPage]         = useState(1)
  const [pastTotal, setPastTotal]       = useState(0)
  const [activeTotal, setActiveTotal]   = useState(0)
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Quiz history
  const [quizSessions, setQuizSessions]       = useState<QuizSession[]>([])
  const [loadingQuiz, setLoadingQuiz]         = useState(true)
  const [showAllQuiz, setShowAllQuiz]         = useState(false)

  // Contributor stats
  const [contribStats, setContribStats]       = useState<ContribStats | null>(null)

  // Leaderboard rank
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/')
  }, [loading, isAuthenticated])

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user])

  async function loadAll() {
    if (!user) return
    await Promise.all([
      loadRoomHistory(),
      loadQuizHistory(),
      loadContribStats(),
      loadMyRank(),
    ])
  }

  async function loadRoomHistory() {
    if (!user) return
    setLoadingRooms(true)
    try {
      const { data: participants } = await supabase
        .from('room_participants')
        .select(`room_id, status, game_rooms (id, room_code, status, host_user_id, current_stage, max_stages, created_at)`)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (!participants) return

      // ── Auto-expire rooms > 24 jam yang masih waiting/playing ──────────────
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const expiredIds = participants
        .filter(p => {
          const room = p.game_rooms as any
          return (
            room &&
            (room.status === 'waiting' || room.status === 'playing') &&
            new Date(room.created_at) < new Date(threshold)
          )
        })
        .map(p => (p.game_rooms as any).id)

      if (expiredIds.length > 0) {
        await supabase
          .from('game_rooms')
          .update({ status: 'finished' })
          .in('id', expiredIds)
      }
      // ───────────────────────────────────────────────────────────────────────

      const rooms: RoomHistory[] = participants.filter(p => p.game_rooms).map(p => {
        const room = p.game_rooms as any
        // Terapkan status expired secara lokal juga (tanpa perlu fetch ulang)
        const effectiveStatus = expiredIds.includes(room.id) ? 'finished' : room.status
        return {
          id: room.id, room_code: room.room_code, status: effectiveStatus,
          created_at: room.created_at, current_stage: room.current_stage,
          max_stages: room.max_stages, is_host: room.host_user_id === user.id,
          participant_status: p.status,
        }
      })

      const active = rooms.filter(r => (r.status === 'waiting' || r.status === 'playing') && r.participant_status === 'active')
      const past   = rooms.filter(r => r.status === 'finished')
      setActiveRooms(active); setActiveTotal(active.length)
      setPastRooms(past);     setPastTotal(past.length)
    } catch (err) { console.error(err) }
    finally { setLoadingRooms(false) }
  }

  async function loadQuizHistory() {
    if (!user) return
    setLoadingQuiz(true)
    try {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('id, correct_count, wrong_count, total_coins_earned, coin_credited, completed_at, material_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20)

      if (!data) return

      // Fetch material titles
      const materialIds = [...new Set(data.map(s => s.material_id))]
      const { data: materials } = await supabase
        .from('materials').select('id, title').in('id', materialIds)

      const titleMap = new Map(materials?.map(m => [m.id, m.title]) ?? [])

      setQuizSessions(data.map(s => ({
        id: s.id,
        material_title: titleMap.get(s.material_id) ?? 'Materi',
        correct_count: s.correct_count,
        wrong_count: s.wrong_count,
        total_coins_earned: s.total_coins_earned,
        coin_credited: s.coin_credited,
        completed_at: s.completed_at,
      })))
    } catch (err) { console.error(err) }
    finally { setLoadingQuiz(false) }
  }

  async function loadContribStats() {
    if (!user?.is_contributor && !user?.is_admin) return
    try {
      const [{ count: qc }, { count: mc }, { count: qzc }] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('materials').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
        supabase.from('materials').select('*', { count: 'exact', head: true }).eq('created_by', user.id).eq('is_quiz_enabled', true),
      ])
      setContribStats({ questions_count: qc ?? 0, materials_count: mc ?? 0, quiz_enabled_count: qzc ?? 0 })
    } catch (err) { console.error(err) }
  }

  async function loadMyRank() {
    if (!user) return
    try {
      const { data } = await supabase.from('users').select('id').eq('is_banned', false).order('coins', { ascending: false })
      if (data) {
        const idx = data.findIndex(u => u.id === user.id)
        if (idx >= 0) setMyRank(idx + 1)
      }
    } catch {}
  }


  async function handleLogout() {
    if (isGuest) {
      clearGuestAccount()
    } else {
      await supabase.auth.signOut({ scope: 'local' })
      localStorage.removeItem('auth_mode')
    }
    window.location.href = '/'
  }
  
  const pagedActive   = activeRooms.slice(0, activePage * ACTIVE_PAGE_SIZE)
  const hasMoreActive = pagedActive.length < activeTotal
  const pagedPast     = pastRooms.slice(0, pastPage * PAST_PAGE_SIZE)
  const hasMorePast   = pagedPast.length < pastTotal
  const daysRemaining = isGuest && expiresAt ? getGuestDaysRemaining(expiresAt) : null
  const winRate       = user?.total_games ? Math.round(((user.total_wins ?? 0) / user.total_games) * 100) : 0
  const xpData        = xpToLevel(user?.xp ?? 0)
  const shownQuiz     = showAllQuiz ? quizSessions : quizSessions.slice(0, 4)

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 30px rgba(124,58,237,.5)', animation: 'bounce 1s infinite' }}>
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <p className="text-sm font-semibold" style={{ color: 'rgba(200,180,255,.5)' }}>Memuat dashboard...</p>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-16px) rotate(2deg)} 66%{transform:translateY(-7px) rotate(-1deg)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .grad-text { background:linear-gradient(to right,#c084fc,#f472b6,#c084fc); background-size:200% auto; animation:gradShift 4s ease infinite; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-hover { transition:all .2s ease; }
        .card-hover:hover { transform:translateY(-2px); }
      `}</style>

      <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-20 pb-20">

        {/* ── Ambient BG ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-700/18 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-700/12 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-indigo-700/10 rounded-full blur-[90px]" />
          {/* Floating particles */}
          {['🏆','⚔️','🎮','🪙','⚡','🌟'].map((e, i) => (
            <div key={i} className="absolute text-2xl opacity-[0.07]"
              style={{
                top: `${[8,22,55,75,38,88][i]}%`,
                left: `${[5,92,3,90,6,25][i]}%`,
                animation: `float ${[12,10,14,11,13,9][i]}s ease-in-out infinite`,
                animationDelay: `${[0,3,1.5,5,2,4][i]}s`,
              }}>
              {e}
            </div>
          ))}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-5 pt-4">

          {/* ── Guest Warning ── */}
          {isGuest && daysRemaining !== null && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl px-5 py-4"
              style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 14px rgba(245,158,11,.4)' }}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Akun Tamu</p>
                  <p className="text-xs" style={{ color: 'rgba(251,191,36,.6)' }}>
                    Berakhir dalam <strong style={{ color: '#fbbf24' }}>{daysRemaining} hari</strong> — upgrade untuk simpan progres permanen
                  </p>
                </div>
              </div>
              <Link href="/auth/upgrade"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 14px rgba(245,158,11,.4)' }}>
                <Crown className="w-3.5 h-3.5" /> Upgrade Gratis
              </Link>
            </div>
          )}

          {/* ── Profile Hero Card ── */}
          <div className="relative overflow-hidden rounded-3xl"
            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(139,92,246,.2)', boxShadow: '0 0 60px rgba(139,92,246,.12), 0 20px 40px rgba(0,0,0,.3)' }}>
            {/* Top gradient accent */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #a855f7, #7c3aed)' }} />
            {/* Glow orb */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,.15) 0%, transparent 70%)' }} />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

                {/* Left: Avatar + info */}
                <div className="flex items-center gap-5">
                  {/* Avatar with ring */}
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-3xl blur-md"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.4), rgba(236,72,153,.3))' }} />
                    <div className="relative">
                      <Avatar name={user.username ?? 'U'} size="xl" />
                      {/* Level badge */}
                      <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[11px] font-black"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 10px rgba(251,191,36,.5)', color: '#000' }}>
                        Lv.{user.level ?? 1}
                      </div>
                    </div>
                  </div>

                  {/* Name + roles */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <RoleBadge isAdmin={user.is_admin} isContributor={user.is_contributor} isGuest={isGuest} />
                      {user.is_admin && user.is_contributor && (
                        <RoleBadge isContributor={true} />
                      )}
                      {myRank && myRank <= 10 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black"
                          style={{ background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.3)', color: '#fbbf24' }}>
                          👑 Top #{myRank}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {user.username ?? 'Pengguna'}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(200,180,255,.4)' }}>
                      {isGuest ? '✨ Mode Tamu' : user.is_admin ? '⚡ Mengawasi seluruh platform' : user.is_contributor ? '✍️ Membangun konten EchoArena' : '🎮 Siap untuk tantangan seru!'}
                    </p>
                  </div>
                </div>

                {/* Right: Coins + logout */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {/* Coins chip */}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                    style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)', boxShadow: '0 0 20px rgba(251,191,36,.1)' }}>
                    <span className="text-xl">🪙</span>
                    <div>
                      <p className="font-black text-base leading-none" style={{ color: '#fbbf24' }}>
                        {(user.coins ?? 0).toLocaleString('id-ID')}
                      </p>
                      <p style={{ color: 'rgba(251,191,36,.4)', fontSize: 10, fontWeight: 700 }}>KOIN</p>
                    </div>
                  </div>

                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.2)', color: 'rgba(248,113,113,.7)' }}>
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </div>

              {/* XP Bar */}
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <XPBar xp={user.xp ?? 0} />
              </div>
            </div>
          </div>

          {/* ── Rank callout (if not top 3) ── */}
          {myRank && myRank > 3 && (
            <div className="flex items-center gap-3 rounded-2xl px-5 py-3.5"
              style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.18)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.35)' }}>
                <Medal className="w-4 h-4" style={{ color: '#a78bfa' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Peringkat #{myRank} di Leaderboard</p>
                <p className="text-xs" style={{ color: 'rgba(200,180,255,.4)' }}>
                  Kumpulkan lebih banyak koin dari quiz & multiplayer untuk naik peringkat
                </p>
              </div>
              <Link href="/leaderboard"
                className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all hover:scale-[1.03]"
                style={{ background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.35)', color: '#c4b5fd' }}>
                Lihat <ChevronRight className="inline w-3 h-3" />
              </Link>
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Trophy} label="Level"      value={`${user.level ?? 1}`}        color="yellow"  sub={`${(user.xp ?? 0).toLocaleString()} XP`} />
            <StatCard icon={Target} label="Total Main" value={user.total_games ?? 0}        color="cyan"    sub={`${user.total_wins ?? 0} menang`} />
            <StatCard icon={Zap}    label="Win Rate"   value={`${winRate}%`}                color="emerald" sub={`dari ${user.total_games ?? 0} game`} />
            <StatCard icon={Flame}  label="Streak"     value={user.win_streak ?? 0}         color="pink"    sub="kemenangan beruntun" />
          </div>

          {/* ── Role-specific section ── */}
          {/* ADMIN PANEL LINK */}
          {user.is_admin && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(244,63,94,.06)', border: '1px solid rgba(244,63,94,.18)', boxShadow: '0 0 40px rgba(244,63,94,.08)' }}>
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(244,63,94,.1)' }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: '#f43f5e' }} />
                  <span className="text-white font-bold text-sm">Admin Control Panel</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(244,63,94,.2)', border: '1px solid rgba(244,63,94,.4)', color: '#f43f5e' }}>
                  ADMIN
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickAction icon={Users}    label="Kelola Users"      sub="Lihat & manage semua pengguna"    color="red"    href="/admin/users" />
                <QuickAction icon={FileText} label="Kelola Soal"       sub="Review & moderasi soal quiz"      color="pink"   href="/admin/questions" />
                <QuickAction icon={Settings} label="Panel Admin"       sub="Pengaturan & statistik platform"  color="purple" href="/admin/stats" />
              </div>
            </div>
          )}

          {/* CONTRIBUTOR PANEL */}
          {user.is_contributor && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.15)', boxShadow: '0 0 40px rgba(251,191,36,.06)' }}>
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(251,191,36,.1)' }}>
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4" style={{ color: '#fbbf24' }} />
                  <span className="text-white font-bold text-sm">Kontributor Panel</span>
                </div>
                {contribStats && (
                  <div className="flex items-center gap-3">
                    {[
                      { label: 'Soal', val: contribStats.questions_count, color: '#a78bfa' },
                      { label: 'Materi', val: contribStats.materials_count, color: '#22d3ee' },
                      { label: 'Quiz Aktif', val: contribStats.quiz_enabled_count, color: '#34d399' },
                    ].map(s => (
                      <div key={s.label} className="text-center hidden sm:block">
                        <p className="font-black text-sm" style={{ color: s.color }}>{s.val}</p>
                        <p style={{ color: 'rgba(200,180,255,.3)', fontSize: 10 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickAction icon={Layers}   label="Kelola Materi" sub="Buat & edit konten pembelajaran" color="yellow" href="/contributor/materials" />
                <QuickAction icon={PenLine}  label="Kelola Soal"   sub="Buat soal via form atau batch"  color="amber"  href="/contributor/questions" />
              </div>
            </div>
          )}

          {/* ── Multiplayer Quick Actions ── */}
          <div>
            <SectionHeader icon={Swords} title="Multiplayer" color="#22d3ee" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction icon={Plus}   label="Buat Room"    sub="Bikin kuis baru & ajak temanmu"     color="emerald" onClick={() => router.push('/room/create')} />
              <QuickAction icon={Swords} label="Gabung Room"  sub="Masukkan kode & langsung main"      color="blue"    onClick={() => router.push('/room/join')} />
            </div>
          </div>

          {/* ── Solo Quiz + Materials ── */}
          <div>
            <SectionHeader icon={BookOpen} title="Belajar" color="#a78bfa" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction icon={BookOpen} label="Jelajahi Materi" sub="Baca & kerjakan solo quiz"        color="purple" href="/materials" />
              <QuickAction icon={Trophy}   label="Leaderboard"     sub="Lihat posisi kamu vs semua user"  color="pink"   href="/leaderboard" />
            </div>
          </div>

          {/* ── Active Rooms ── */}
          {!loadingRooms && activeRooms.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(16,185,129,.2)' }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-bold text-sm">Game Berlangsung</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(16,185,129,.2)', border: '1px solid rgba(16,185,129,.4)', color: '#34d399' }}>
                  {activeTotal} LIVE
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                {pagedActive.map(room => (
                  <div key={room.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }}>
                      <Play className="w-4 h-4" style={{ color: '#34d399' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{room.room_code}</span>
                        {room.is_host && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.25)', color: '#fbbf24' }}>HOST</span>}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={room.status === 'waiting'
                            ? { background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa' }
                            : { background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#34d399' }}>
                          {room.status === 'waiting' ? 'Menunggu' : 'Bermain'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(200,180,255,.35)' }}>Babak {room.current_stage} / {room.max_stages}</p>
                    </div>
                    <button onClick={() => router.push(`/room/${room.id}`)}
                      className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.03]"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 3px 12px rgba(16,185,129,.35)' }}>
                      {room.status === 'waiting' ? 'Masuk' : 'Lanjut'} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {(hasMoreActive || activePage > 1) && (
                <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                  <p className="text-xs" style={{ color: 'rgba(200,180,255,.3)' }}>{pagedActive.length} dari {activeTotal}</p>
                  <div className="flex gap-2">
                    {hasMoreActive && <button onClick={() => setActivePage(p => p + 1)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.05]" style={{ border: '1px solid rgba(255,255,255,.07)', color: 'rgba(200,180,255,.4)' }}><ChevronDown className="w-3.5 h-3.5" /> Lebih</button>}
                    {activePage > 1 && <button onClick={() => setActivePage(1)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.05]" style={{ border: '1px solid rgba(255,255,255,.07)', color: 'rgba(200,180,255,.4)' }}><ChevronUp className="w-3.5 h-3.5" /> Lipat</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Solo Quiz History ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(139,92,246,.15)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
              <SectionHeader icon={BarChart3} title="Riwayat Solo Quiz" count={quizSessions.length} color="#a78bfa" />
              {quizSessions.length > 4 && (
                <button onClick={() => setShowAllQuiz(p => !p)} className="text-xs font-bold transition-colors hover:opacity-80" style={{ color: '#a78bfa' }}>
                  {showAllQuiz ? 'Lihat lebih sedikit' : `Lihat semua`}
                </button>
              )}
            </div>

            {loadingQuiz ? (
              <div className="p-8 flex items-center justify-center gap-2" style={{ color: 'rgba(200,180,255,.35)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat...
              </div>
            ) : quizSessions.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)' }}>
                  <BarChart3 className="w-6 h-6" style={{ color: 'rgba(167,139,250,.3)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(200,180,255,.4)' }}>Belum ada riwayat quiz</p>
                <p className="text-xs" style={{ color: 'rgba(200,180,255,.25)' }}>Baca materi dan kerjakan solo quiz untuk mulai!</p>
                <Link href="/materials" className="text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.3)', color: '#c4b5fd' }}>
                  Jelajahi Materi →
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                {shownQuiz.map(s => {
                  const total    = s.correct_count + s.wrong_count
                  const accuracy = total > 0 ? Math.round((s.correct_count / total) * 100) : 0
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={accuracy >= 75
                          ? { background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }
                          : { background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.2)' }}>
                        {accuracy >= 75
                          ? <CheckCircle className="w-4 h-4" style={{ color: '#34d399' }} />
                          : <Target     className="w-4 h-4" style={{ color: '#f87171' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{s.material_title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px]" style={{ color: accuracy >= 75 ? '#34d399' : '#f87171' }}>
                            {accuracy}% akurasi ({s.correct_count}/{total})
                          </span>
                          {!s.coin_credited && s.total_coins_earned > 0 && (
                            <span className="text-[11px] font-bold" style={{ color: '#fbbf24' }}>+🪙{s.total_coins_earned}</span>
                          )}
                          {s.coin_credited && (
                            <span className="text-[11px]" style={{ color: 'rgba(200,180,255,.3)' }}>replay</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] shrink-0" style={{ color: 'rgba(200,180,255,.3)' }}>
                        {relativeTime(s.completed_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Game History ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
              <SectionHeader icon={Clock} title="Riwayat Multiplayer" count={pastTotal} color="#60a5fa" />
            </div>

            {loadingRooms ? (
              <div className="p-8 flex items-center justify-center gap-2" style={{ color: 'rgba(200,180,255,.35)' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat...
              </div>
            ) : pastRooms.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                  <Trophy className="w-6 h-6" style={{ color: 'rgba(200,180,255,.2)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(200,180,255,.4)' }}>Belum ada riwayat game</p>
                <p className="text-xs" style={{ color: 'rgba(200,180,255,.25)' }}>Buat atau gabung room untuk mulai bermain!</p>
              </div>
            ) : (
              <>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                  {pagedPast.map(room => (
                    <div key={room.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: 'rgba(52,211,153,.6)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm">{room.room_code}</span>
                          {room.is_host && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.25)', color: '#fbbf24' }}>HOST</span>}
                        </div>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'rgba(200,180,255,.3)' }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(room.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span style={{ color: 'rgba(200,180,255,.15)' }}>·</span>
                          {room.max_stages} babak
                        </p>
                      </div>
                      
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                        style={
                          room.current_stage === 0
                            ? { background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', color: 'rgba(245,158,11,.7)' }
                            : { background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', color: 'rgba(52,211,153,.7)' }
                        }>
                        {room.current_stage === 0 ? 'Expired' : 'Selesai'}
                      </span>

                    </div>
                  ))}
                </div>

                {(hasMorePast || pastPage > 1) && (
                  <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,.04)' }}>
                    <p className="text-xs" style={{ color: 'rgba(200,180,255,.3)' }}>{pagedPast.length} dari {pastTotal}</p>
                    <div className="flex gap-2">
                      {hasMorePast && <button onClick={() => setPastPage(p => p + 1)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.05]" style={{ border: '1px solid rgba(255,255,255,.07)', color: 'rgba(200,180,255,.4)' }}><ChevronDown className="w-3.5 h-3.5" /> Lebih</button>}
                      {pastPage > 1 && <button onClick={() => setPastPage(1)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.05]" style={{ border: '1px solid rgba(255,255,255,.07)', color: 'rgba(200,180,255,.4)' }}><ChevronUp className="w-3.5 h-3.5" /> Lipat</button>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        <MusicControl trackUrl="/audio/dashboard/dashboard-music-2.mp3" />
      </div>
    </>
  )
}