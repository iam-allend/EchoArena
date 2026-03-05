'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy, Crown, Medal, Gamepad2, BookOpen,
  Sparkles, BarChart3, Layers, Coins, Star, Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerEntry {
  rank: number
  id: string
  username: string
  level: number
  total_games: number
  coins: number
  win_rate: number
  best_score: number
}

interface ContributorEntry {
  rank: number
  id: string
  username: string
  questions_count: number
  materials_count: number
  total_contribution: number
  quiz_enabled_count: number
  level: number
}

type TabKey = 'player' | 'contributor'
type Period = 'all' | 'month' | 'week'

// ─── Particles ────────────────────────────────────────────────────────────────

function Particles({ tab }: { tab: TabKey }) {
  const isPlayer = tab === 'player'
  const floatItems = isPlayer
    ? [
        { emoji: '🏆', top: '8%',  left: '5%',   delay: '0s',   dur: '12s', size: 'text-2xl' },
        { emoji: '⚔️', top: '20%', right: '7%',  delay: '3s',   dur: '10s', size: 'text-xl'  },
        { emoji: '🎮', top: '58%', left: '3%',   delay: '1.5s', dur: '14s', size: 'text-lg'  },
        { emoji: '🪙', top: '72%', right: '6%',  delay: '5s',   dur: '11s', size: 'text-2xl' },
        { emoji: '🎯', top: '38%', left: '91%',  delay: '2s',   dur: '13s', size: 'text-xl'  },
        { emoji: '🌟', top: '85%', left: '22%',  delay: '4s',   dur: '9s',  size: 'text-lg'  },
      ]
    : [
        { emoji: '📖', top: '8%',  left: '5%',   delay: '0s',   dur: '12s', size: 'text-2xl' },
        { emoji: '✏️', top: '20%', right: '8%',  delay: '3s',   dur: '10s', size: 'text-xl'  },
        { emoji: '🔬', top: '60%', left: '3%',   delay: '1.5s', dur: '14s', size: 'text-lg'  },
        { emoji: '🏺', top: '75%', right: '5%',  delay: '5s',   dur: '11s', size: 'text-2xl' },
        { emoji: '📐', top: '40%', left: '90%',  delay: '2s',   dur: '13s', size: 'text-xl'  },
        { emoji: '🧮', top: '85%', left: '20%',  delay: '4s',   dur: '9s',  size: 'text-lg'  },
      ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[50%] right-[10%] w-56 h-56 bg-pink-600/15 rounded-full blur-[70px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      <div className="absolute bottom-[20%] left-[30%] w-48 h-48 bg-indigo-600/15 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '4s' }} />
      {isPlayer
        ? <div className="absolute top-[60%] left-[60%] w-40 h-40 bg-yellow-500/8 rounded-full blur-[55px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        : <div className="absolute top-[60%] left-[60%] w-40 h-40 bg-cyan-500/8   rounded-full blur-[55px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      }
      {floatItems.map((p, i) => (
        <div key={i} className={`absolute ${p.size} opacity-20`}
          style={{
            top: p.top,
            left:  (p as any).left,
            right: (p as any).right,
            animation: `float ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
          }}>
          {p.emoji}
        </div>
      ))}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const gradients = [
    'from-violet-500 to-purple-700', 'from-cyan-500 to-blue-700',
    'from-pink-500 to-rose-700',     'from-emerald-500 to-teal-700',
    'from-amber-500 to-orange-600',  'from-fuchsia-500 to-pink-700',
    'from-sky-500 to-cyan-700',      'from-indigo-500 to-violet-700',
  ]
  const g  = gradients[(name?.charCodeAt(0) ?? 0) % gradients.length]
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-black text-white shrink-0 shadow-lg ring-2 ring-white/15`}>
      {name?.slice(0, 2).toUpperCase() ?? 'U'}
    </div>
  )
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="relative w-9 h-9 shrink-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-yellow-500/60 animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center">
        <Crown className="w-4 h-4 text-amber-900 fill-amber-900" />
      </div>
    </div>
  )
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 flex items-center justify-center shadow-md shadow-slate-400/40 shrink-0">
      <Medal className="w-4 h-4 text-slate-800 fill-slate-800" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-md shadow-orange-600/40 shrink-0">
      <Medal className="w-4 h-4 text-orange-100 fill-orange-100" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-purple-500/15 flex items-center justify-center shrink-0">
      <span className="text-xs font-black text-purple-300/50">{rank}</span>
    </div>
  )
}

// ─── Podium ───────────────────────────────────────────────────────────────────

const PODIUM_CFGS = [
  { rankLabel: '2nd', blockH: 96,  floatDelay: '0.5s', gradFrom: '#64748b', gradMid: '#475569', gradTo: '#334155', borderColor: 'rgba(203,213,225,0.35)', shadow: '0 12px 40px rgba(148,163,184,0.22)', textColor: '#e2e8f0', coinColor: '#cbd5e1', glowBg: 'rgba(148,163,184,0.15)', shimmer: 'rgba(255,255,255,0.07)' },
  { rankLabel: '1st', blockH: 144, floatDelay: '0s',   gradFrom: '#fbbf24', gradMid: '#f59e0b', gradTo: '#d97706', borderColor: 'rgba(253,224,71,0.6)',    shadow: '0 16px 56px rgba(250,204,21,0.4)',  textColor: '#451a03', coinColor: '#78350f', glowBg: 'rgba(250,204,21,0.2)',  shimmer: 'rgba(255,255,255,0.18)' },
  { rankLabel: '3rd', blockH: 68,  floatDelay: '1s',   gradFrom: '#f97316', gradMid: '#ea580c', gradTo: '#c2410c', borderColor: 'rgba(253,186,116,0.4)',   shadow: '0 10px 36px rgba(251,146,60,0.22)', textColor: '#fff7ed', coinColor: '#fed7aa', glowBg: 'rgba(234,88,12,0.12)',  shimmer: 'rgba(255,255,255,0.08)' },
]

function Podium({ entries, tab }: { entries: (PlayerEntry | ContributorEntry)[]; tab: TabKey }) {
  const top = entries.slice(0, 3)
  if (top.length < 1) return null
  const order = [top[1], top[0], top[2]]

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 pb-0 pt-4">
      {order.map((entry, i) => {
        const cfg      = PODIUM_CFGS[i]
        if (!entry) return <div key={i} className="w-24 sm:w-28" />
        const isPlayer = tab === 'player'
        const mainVal  = isPlayer ? (entry as PlayerEntry).coins.toLocaleString('id-ID') : (entry as ContributorEntry).total_contribution.toLocaleString('id-ID')
        const subLabel = isPlayer ? `${(entry as PlayerEntry).total_games} game` : `${(entry as ContributorEntry).questions_count} soal`

        return (
          <div key={entry.id} className="flex flex-col items-center gap-2 w-24 sm:w-28"
            style={{ animation: 'podiumFloat 2.8s ease-in-out infinite', animationDelay: cfg.floatDelay }}>

            {entry.rank === 1 && (
              <div className="relative flex justify-center">
                <div className="absolute -inset-4 rounded-full blur-xl" style={{ background: cfg.glowBg, animation: 'podiumGlow 2s ease-in-out infinite' }} />
                <Crown className="relative w-8 h-8 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_14px_rgba(250,204,21,1)]" />
              </div>
            )}

            <div className="relative">
              <div className="absolute -inset-2.5 rounded-full blur-lg" style={{ background: cfg.glowBg, animation: 'podiumGlow 2.6s ease-in-out infinite', animationDelay: cfg.floatDelay }} />
              <div className="relative rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${cfg.glowBg}, transparent 60%)` }}>
                <Avatar name={entry.username} size="lg" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-bold text-sm truncate w-24 sm:w-28 px-1 text-center leading-tight">{entry.username}</p>
              <p className="text-purple-300/50 text-[11px] mt-0.5">Lv.{entry.level}</p>
            </div>

            <div className="relative w-full rounded-t-2xl flex flex-col items-center justify-center gap-1 overflow-hidden"
              style={{ height: `${cfg.blockH}px`, background: `linear-gradient(180deg, ${cfg.gradFrom}, ${cfg.gradMid} 50%, ${cfg.gradTo})`, border: `1px solid ${cfg.borderColor}`, boxShadow: cfg.shadow }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(115deg, transparent 25%, ${cfg.shimmer} 50%, transparent 75%)`, animation: 'shimmerSweep 2.4s ease-in-out infinite', animationDelay: cfg.floatDelay }} />
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.shimmer}, transparent)` }} />
              <div className="relative z-10 flex flex-col items-center gap-0.5 px-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70" style={{ color: cfg.textColor }}>{cfg.rankLabel}</span>
                <div className="flex items-center gap-1">
                  {isPlayer && <Coins className="w-3 h-3 shrink-0" style={{ color: cfg.coinColor }} />}
                  <span className="font-black text-sm" style={{ color: cfg.textColor }}>{mainVal}</span>
                </div>
                <span className="text-[10px] opacity-50" style={{ color: cfg.textColor }}>{subLabel}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-9 h-9 rounded-full bg-white/[0.06] shrink-0" />
      <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/[0.06] rounded-lg w-32" />
        <div className="h-2.5 bg-white/[0.04] rounded-lg w-20" />
      </div>
      <div className="hidden sm:block w-16 h-4 bg-white/[0.06] rounded-lg" />
      <div className="hidden md:block w-12 h-4 bg-white/[0.04] rounded-lg" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const supabase = createClient()

  const [tab, setTab]       = useState<TabKey>('player')
  const [period, setPeriod] = useState<Period>('all')
  const [myId, setMyId]     = useState<string | null>(null)

  // ✅ FIX: pisahkan loading state per-data agar tidak saling override
  const [loadingPlayers, setLoadingPlayers]           = useState(true)
  const [loadingContributors, setLoadingContributors] = useState(true)

  const [players, setPlayers]           = useState<PlayerEntry[]>([])
  const [contributors, setContributors] = useState<ContributorEntry[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null))
  }, [])

  const fetchPlayers = useCallback(async () => {
    setLoadingPlayers(true)
    const { data } = await supabase
      .from('users')
      .select('id, username, level, total_games, coins')
      .eq('is_banned', false)
      .order('coins', { ascending: false })
      .order('level', { ascending: false })
      .limit(100)

    if (!data) { setLoadingPlayers(false); return }

    setPlayers(data.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      username: u.username ?? 'Anonim',
      level: u.level ?? 1,
      total_games: u.total_games ?? 0,
      coins: u.coins ?? 0,
      win_rate: Math.min(100, Math.round(((u.level ?? 1) / 20) * 100)),
      best_score: Math.min(100, 60 + (u.level ?? 1) * 2),
    })))
    setLoadingPlayers(false)
  }, [period])

  const fetchContributors = useCallback(async () => {
    setLoadingContributors(true)
    const { data: users } = await supabase
      .from('users')
      .select('id, username, level')
      .eq('is_contributor', true)

    if (!users || users.length === 0) { setLoadingContributors(false); return }

    const ids = users.map(u => u.id)
    const [{ data: qData }, { data: mData }] = await Promise.all([
      supabase.from('questions').select('created_by').in('created_by', ids),
      supabase.from('materials').select('created_by, is_quiz_enabled').in('created_by', ids),
    ])

    const qMap  = new Map<string, number>()
    const mMap  = new Map<string, number>()
    const qzMap = new Map<string, number>()

    qData?.forEach(q => { if (q.created_by) qMap.set(q.created_by, (qMap.get(q.created_by) ?? 0) + 1) })
    mData?.forEach(m => {
      if (m.created_by) {
        mMap.set(m.created_by, (mMap.get(m.created_by) ?? 0) + 1)
        if (m.is_quiz_enabled) qzMap.set(m.created_by, (qzMap.get(m.created_by) ?? 0) + 1)
      }
    })

    const entries = users
      .map(u => {
        const qc = qMap.get(u.id) ?? 0
        const mc = mMap.get(u.id) ?? 0
        const qz = qzMap.get(u.id) ?? 0
        return {
          rank: 0, id: u.id, username: u.username ?? 'Anonim', level: u.level ?? 1,
          questions_count: qc, materials_count: mc, quiz_enabled_count: qz,
          total_contribution: qc * 2 + mc * 10 + qz * 5,
        }
      })
      .sort((a, b) => b.total_contribution - a.total_contribution)
      .map((e, i) => ({ ...e, rank: i + 1 }))

    setContributors(entries)
    setLoadingContributors(false)
  }, [period])

  // ✅ FIX: fetch keduanya sekaligus saat mount & saat period berubah
  useEffect(() => {
    fetchPlayers()
    fetchContributors()
  }, [fetchPlayers, fetchContributors])

  // Loading state sesuai tab yang aktif
  const loading  = tab === 'player' ? loadingPlayers : loadingContributors
  const list     = tab === 'player' ? players : contributors
  const isPlayer = tab === 'player'

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-18px) rotate(3deg); }
          66%       { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes podiumGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .row-enter { animation: slideUp .35s cubic-bezier(.22,1,.36,1) both; }
        .grad-text {
          background: linear-gradient(to right, #c084fc, #f472b6, #c084fc);
          background-size: 200% auto;
          animation: gradShift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rank-1-row { background: linear-gradient(135deg, rgba(250,204,21,0.10) 0%, rgba(251,146,60,0.05) 100%); border-color: rgba(250,204,21,0.25) !important; box-shadow: inset 0 1px 0 rgba(250,204,21,0.08); }
        .rank-2-row { background: linear-gradient(135deg, rgba(203,213,225,0.06) 0%, rgba(148,163,184,0.03) 100%); border-color: rgba(203,213,225,0.16) !important; }
        .rank-3-row { background: linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(234,88,12,0.04) 100%); border-color: rgba(251,146,60,0.20) !important; }
        .me-row     { background: linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 100%); border-color: rgba(168,85,247,0.28) !important; box-shadow: inset 0 1px 0 rgba(168,85,247,0.08); }
        .row-base   { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06) !important; }
        .row-base:hover { background: rgba(139,92,246,0.08) !important; border-color: rgba(139,92,246,0.20) !important; }
        .row-alt    { background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.04) !important; }
        .row-alt:hover  { background: rgba(139,92,246,0.06) !important; border-color: rgba(139,92,246,0.15) !important; }
        .rank-1-row:hover, .rank-2-row:hover, .rank-3-row:hover { filter: brightness(1.07); }
      `}</style>

      <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-20">
        <Particles tab={tab} />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 pb-20">

          {/* ── Hero ── */}
          <div className="text-center pt-14 pb-8 space-y-5">
            <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-400/25 rounded-full px-4 py-1.5 text-xs font-bold text-purple-300 uppercase tracking-widest">
              <Trophy className="w-3.5 h-3.5" /> Hall of Fame
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              Papan{' '}
              <span className="grad-text">Peringkat</span>
            </h1>

            <p className="text-purple-200/70 text-base max-w-xs mx-auto">
              Siapa yang paling top di EchoArena?
            </p>

            {/* Stats strip — count langsung tersedia karena fetch keduanya di awal */}
            <div className="flex items-center justify-center gap-10 pt-2">
              {[
                { label: 'Pemain',      value: loadingPlayers      ? '…' : players.length      },
                { label: 'Kontributor', value: loadingContributors ? '…' : contributors.length },
              ].map(s => (
                <div key={s.label} className="text-center group">
                  <p className="text-3xl font-black text-white group-hover:text-purple-300 transition-colors">{s.value}</p>
                  <p className="text-xs text-purple-300/60 font-semibold uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab + Period ── */}
          <div className="bg-indigo-950/70 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl shadow-purple-900/30 mb-4">
            <div className="flex gap-1.5 flex-1">
              {([
                { k: 'player'      as TabKey, l: 'Pemain',      icon: Gamepad2, count: players.length },
                { k: 'contributor' as TabKey, l: 'Kontributor', icon: BookOpen,  count: contributors.length },
              ]).map(t => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex-1 justify-center ${
                    tab === t.k
                      ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                      : 'border-purple-500/10 text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/10'
                  }`}>
                  <t.icon className="w-4 h-4" />
                  {t.l}
                  {t.count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.k ? 'bg-purple-400/20 text-purple-200' : 'bg-purple-900/60 text-purple-500'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 justify-center sm:justify-end flex-wrap">
              {([
                { k: 'week'  as Period, l: 'Minggu Ini' },
                { k: 'month' as Period, l: 'Bulan Ini' },
                { k: 'all'   as Period, l: 'All Time' },
              ]).map(p => (
                <button key={p.k} onClick={() => setPeriod(p.k)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    period === p.k
                      ? 'bg-purple-500/25 border-purple-400/40 text-purple-200'
                      : 'border-purple-500/10 text-purple-300/40 hover:text-purple-200 hover:bg-purple-500/10'
                  }`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          {/* ── Podium ── */}
          {!loading && list.length >= 3 && (
            <div className="relative mb-4">
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-purple-950/40 to-transparent pointer-events-none" />
              <Podium entries={list} tab={tab} />
            </div>
          )}

          {/* ── My rank callout ── */}
          {myId && !loading && (() => {
            const me = list.find(e => e.id === myId)
            if (!me || me.rank <= 3) return null
            return (
              <div className="mb-3 flex items-center gap-3 bg-white/[0.04] border border-purple-400/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-purple-300">#{me.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-purple-200 text-sm font-bold">Posisi kamu saat ini</p>
                  <p className="text-purple-400/60 text-xs truncate">
                    {isPlayer
                      ? `🪙 ${(me as PlayerEntry).coins.toLocaleString('id-ID')} koin · ${(me as PlayerEntry).total_games} game`
                      : `${(me as ContributorEntry).total_contribution} kontribusi · ${(me as ContributorEntry).questions_count} soal`}
                  </p>
                </div>
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/25 text-purple-300 shrink-0">Kamu</span>
              </div>
            )
          })()}

          {/* ── Column headers ── */}
          {!loading && list.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-400/40">
              <span className="w-9 shrink-0" /><span className="w-8 shrink-0" />
              <span className="flex-1">Pengguna</span>
              {isPlayer ? (
                <>
                  <span className="hidden sm:block w-20 text-right">Koin</span>
                  <span className="hidden md:block w-14 text-right">Game</span>
                  <span className="hidden lg:block w-20 text-right">Win Rate</span>
                  <span className="hidden xl:block w-20 text-right">Level</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:block w-20 text-right">Skor</span>
                  <span className="hidden md:block w-14 text-right">Soal</span>
                  <span className="hidden lg:block w-14 text-right">Materi</span>
                </>
              )}
            </div>
          )}

          {/* ── List ── */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <SkeletonRow key={i} delay={i * 50} />)}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-purple-500/40" />
              </div>
              <p className="text-purple-200/50 font-semibold text-sm">
                {isPlayer ? 'Belum ada pemain.' : 'Belum ada kontributor aktif.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {list.slice(0, 50).map((entry, idx) => {
                const isMe   = entry.id === myId
                const isTop3 = entry.rank <= 3
                const pe     = entry as PlayerEntry
                const ce     = entry as ContributorEntry

                const rowClass = isMe ? 'me-row'
                  : entry.rank === 1 ? 'rank-1-row'
                  : entry.rank === 2 ? 'rank-2-row'
                  : entry.rank === 3 ? 'rank-3-row'
                  : idx % 2 === 0    ? 'row-base'
                  : 'row-alt'

                return (
                  <div key={entry.id}
                    className={`row-enter relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 cursor-default ${rowClass}`}
                    style={{ animationDelay: `${Math.min(idx * 30, 600)}ms` }}>

                    <RankBadge rank={entry.rank} />
                    <Avatar name={entry.username} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-bold text-sm truncate leading-tight ${isMe ? 'text-purple-200' : isTop3 ? 'text-white' : 'text-white/80'}`}>
                          {entry.username}
                        </p>
                        {isMe && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/25 text-purple-300 shrink-0">Kamu</span>}
                        {entry.rank === 1 && !isMe && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/25 text-yellow-400 shrink-0">👑 #1</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-purple-300/40 font-semibold">Lv.{entry.level}</span>
                        <span className="text-purple-700 text-[10px]">·</span>
                        {isPlayer
                          ? <span className="text-[11px] text-purple-300/40 sm:hidden">🪙 {pe.coins.toLocaleString('id-ID')}</span>
                          : <span className="text-[11px] text-purple-300/40 sm:hidden">{ce.total_contribution} poin</span>}
                      </div>
                    </div>

                    {isPlayer && (
                      <>
                        <div className="hidden sm:flex flex-col items-end w-20 shrink-0">
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-yellow-500/60" />
                            <span className={`font-black text-sm tabular-nums ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-orange-400' : 'text-white/90'}`}>
                              {pe.coins.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-400/40">koin</span>
                        </div>
                        <div className="hidden md:flex flex-col items-end w-14 shrink-0">
                          <span className="text-white/80 font-bold text-sm tabular-nums">{pe.total_games.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-purple-400/40">game</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-end w-20 shrink-0 gap-1">
                          <span className="text-emerald-400 font-bold text-sm tabular-nums">{pe.win_rate}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pe.win_rate}%`, background: pe.win_rate >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : pe.win_rate >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                          </div>
                        </div>
                        <div className="hidden xl:flex flex-col items-end w-20 shrink-0 gap-1">
                          <span className="text-purple-200/80 font-bold text-sm">Lv.{pe.level}</span>
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${Math.min(100, (pe.level / 20) * 100)}%` }} />
                          </div>
                        </div>
                      </>
                    )}

                    {!isPlayer && (
                      <>
                        <div className="hidden sm:flex flex-col items-end w-20 shrink-0">
                          <span className={`font-black text-sm tabular-nums ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-orange-400' : 'text-white/90'}`}>
                            {ce.total_contribution}
                          </span>
                          <span className="text-[10px] text-purple-400/40">kontribusi</span>
                        </div>
                        <div className="hidden md:flex flex-col items-end w-14 shrink-0">
                          <span className="text-white/80 font-bold text-sm tabular-nums">{ce.questions_count}</span>
                          <span className="text-[10px] text-purple-400/40">soal</span>
                        </div>
                        <div className="hidden lg:flex flex-col items-end w-14 shrink-0">
                          <span className="text-pink-400 font-bold text-sm tabular-nums">{ce.materials_count}</span>
                          <span className="text-[10px] text-purple-400/40">materi</span>
                        </div>
                      </>
                    )}

                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl" />
                  </div>
                )
              })}

              {list.length > 50 && (
                <p className="text-center text-purple-400/40 text-xs pt-3">
                  Menampilkan 50 dari {list.length} pengguna
                </p>
              )}
            </div>
          )}

          {/* ── Info cards ── */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isPlayer ? (
              <>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-yellow-400/70" /> Cara Mendapat Koin
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Selesaikan 1 Game',  val: '+Koin',   color: 'text-yellow-400' },
                      { label: 'Menang Multiplayer',  val: 'Bonus ×', color: 'text-amber-400' },
                      { label: 'Skor Quiz Sempurna',  val: 'Bonus +', color: 'text-orange-400' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.05] last:border-0">
                        <span className="text-purple-200/50 text-xs">{r.label}</span>
                        <span className={`text-xs font-black ${r.color}`}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400/70" /> Tips Naik Peringkat
                  </p>
                  <div className="space-y-2">
                    {[
                      'Mainkan Solo Quiz setiap hari untuk koin harian',
                      'Jawab soal sulit untuk koin lebih banyak',
                      'Ikut multiplayer — menang dapat bonus besar',
                      'Selesaikan semua materi satu level untuk reward',
                    ].map((tip, i) => (
                      <p key={i} className="text-purple-200/40 text-xs flex items-start gap-2">
                        <Star className="w-3 h-3 text-purple-400/40 shrink-0 mt-0.5" /> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-pink-400/70" /> Skor Kontribusi
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Buat 1 Soal',       val: '+2 poin',  color: 'text-violet-400' },
                      { label: 'Buat 1 Materi',      val: '+10 poin', color: 'text-cyan-400' },
                      { label: 'Aktifkan Solo Quiz', val: '+5 bonus', color: 'text-emerald-400' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.05] last:border-0">
                        <span className="text-purple-200/50 text-xs">{r.label}</span>
                        <span className={`text-xs font-black ${r.color}`}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-purple-400/30 mt-3 italic">* Soal yang sering dimainkan akan mendapat bonus di pembaruan mendatang.</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400/70" /> Tips Kontributor
                  </p>
                  <div className="space-y-2">
                    {[
                      'Buat soal dalam jumlah banyak via batch',
                      'Tautkan soal ke materi agar terorganisir',
                      'Aktifkan Solo Quiz agar bisa dimainkan',
                      'Variasi difficulty — mudah + sedang + sulit',
                    ].map((tip, i) => (
                      <p key={i} className="text-purple-200/40 text-xs flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-pink-400/40 shrink-0 mt-0.5" /> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  )
}