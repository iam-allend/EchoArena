'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { getGuestDaysRemaining } from '@/lib/auth/guest'
import { MusicControl } from '@/components/ui/MusicControl'
import {
  Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle,
  Trophy, Star, Zap, Target, BookOpen, Plus,
  ArrowRight, Flame, Calendar, ChevronDown, ChevronUp, Swords,
} from 'lucide-react'

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

const ACTIVE_PAGE_SIZE = 3
const PAST_PAGE_SIZE   = 5

export default function Dashboard() {
  const router = useRouter()
  const { user, isGuest, loading, expiresAt, isAuthenticated, logout } = useAuth()
  const supabase = createClient()

  const [activeRooms, setActiveRooms]   = useState<RoomHistory[]>([])
  const [pastRooms, setPastRooms]       = useState<RoomHistory[]>([])
  const [activePage, setActivePage]     = useState(1)
  const [pastPage, setPastPage]         = useState(1)
  const [pastTotal, setPastTotal]       = useState(0)
  const [activeTotal, setActiveTotal]   = useState(0)
  const [loadingRooms, setLoadingRooms] = useState(true)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/')
    if (user) loadRoomHistory()
  }, [loading, isAuthenticated, user])

  async function loadRoomHistory() {
    if (!user) return
    try {
      const { data: participants } = await supabase
        .from('room_participants')
        .select(`room_id, status, game_rooms (id, room_code, status, host_user_id, current_stage, max_stages, created_at)`)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (!participants) return

      const rooms: RoomHistory[] = participants.filter(p => p.game_rooms).map(p => {
        const room = p.game_rooms as any
        return {
          id: room.id, room_code: room.room_code, status: room.status,
          created_at: room.created_at, current_stage: room.current_stage,
          max_stages: room.max_stages, is_host: room.host_user_id === user.id,
          participant_status: p.status,
        }
      })

      const active = rooms.filter(r => (r.status === 'waiting' || r.status === 'playing') && r.participant_status === 'active')
      const past   = rooms.filter(r => r.status === 'finished')
      setActiveRooms(active)
      setActiveTotal(active.length)
      setPastRooms(past)
      setPastTotal(past.length)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRooms(false)
    }
  }

  async function handleLogout() { await logout(); router.push('/') }

  const daysRemaining  = isGuest && expiresAt ? getGuestDaysRemaining(expiresAt) : null
  const pagedActive    = activeRooms.slice(0, activePage * ACTIVE_PAGE_SIZE)
  const hasMoreActive  = pagedActive.length < activeTotal
  const pagedPast      = pastRooms.slice(0, pastPage * PAST_PAGE_SIZE)
  const hasMorePast    = pagedPast.length < pastTotal

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl animate-bounce">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <p className="text-purple-200/60 text-sm font-semibold">Memuat dashboard...</p>
      </div>
    </div>
  )

  if (!user) return null

  const winRate = user.total_games ? Math.round((user.total_wins / user.total_games) * 100) : 0

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 pt-24 pb-16">

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-700/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Guest warning */}
        {isGuest && daysRemaining !== null && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Akun Tamu</p>
                <p className="text-amber-200/70 text-xs">Berakhir dalam <span className="font-bold text-amber-300">{daysRemaining} hari</span> — upgrade untuk simpan progres</p>
              </div>
            </div>
            <button onClick={() => router.push('/auth/upgrade')}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:opacity-90 transition-opacity">
              <Crown className="w-3.5 h-3.5" /> Upgrade Gratis
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-purple-300/60 text-xs font-bold uppercase tracking-widest mb-1">Dashboard</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Halo, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user.username}!</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {isGuest ? '✨ Mode Tamu · Ayo bermain!' : '🎮 Siap untuk tantangan seru hari ini?'}
              </p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 text-sm font-medium transition-all">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Level',      value: user.level || 1,       icon: Trophy, g: 'from-yellow-500 to-orange-500', text: 'text-yellow-300' },
            { label: 'Total XP',   value: user.xp || 0,          icon: Star,   g: 'from-purple-500 to-pink-500',   text: 'text-purple-300' },
            { label: 'Total Main', value: user.total_games || 0, icon: Target, g: 'from-blue-500 to-cyan-500',     text: 'text-blue-300'   },
            { label: 'Win Rate',   value: `${winRate}%`,         icon: Zap,    g: 'from-emerald-500 to-teal-500',  text: 'text-emerald-300'},
          ].map((s, i) => (
            <div key={i} className="group relative rounded-2xl p-4 sm:p-5 overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-white/15 hover:bg-white/[0.06] hover:scale-[1.02] transition-all duration-200 cursor-default">
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.g}`} />
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center mb-3 shadow-md`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${s.text} tabular-nums leading-none`}>{s.value}</p>
              <p className="text-slate-500 text-xs font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => router.push('/room/create')}
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12] hover:border-emerald-400/40 hover:scale-[1.015] active:scale-[.99] transition-all duration-200 p-6 text-left">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight">Buat Room</p>
                <p className="text-emerald-300/60 text-xs mt-0.5">Bikin kuis baru & ajak temanmu</p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400/50 group-hover:translate-x-0.5 group-hover:text-emerald-300 transition-all shrink-0" />
            </div>
          </button>

          <button onClick={() => router.push('/room/join')}
            className="group relative overflow-hidden rounded-2xl border border-blue-500/25 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] hover:border-blue-400/40 hover:scale-[1.015] active:scale-[.99] transition-all duration-200 p-6 text-left">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shrink-0">
                <Swords className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight">Gabung Room</p>
                <p className="text-blue-300/60 text-xs mt-0.5">Masukkan kode & langsung main</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400/50 group-hover:translate-x-0.5 group-hover:text-blue-300 transition-all shrink-0" />
            </div>
          </button>
        </div>

        {/* ── Kuis Berlangsung ── */}
        {loadingRooms ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat data room...
          </div>
        ) : activeRooms.length > 0 && (
          <div className="rounded-2xl border border-green-500/20 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md flex items-center justify-center">
                <Flame className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-bold text-sm">Kuis Berlangsung</span>
              <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-300 text-[11px] font-black animate-pulse">
                {activeTotal} LIVE
              </span>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {pagedActive.map((room) => (
                <div key={room.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">{room.room_code}</span>
                      {room.is_host && <span className="px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/25 rounded-full text-yellow-300/80 text-[10px] font-bold">HOST</span>}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${room.status === 'waiting' ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : 'bg-green-500/15 text-green-300 border-green-500/25'}`}>
                        {room.status === 'waiting' ? 'Menunggu' : 'Bermain'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5">Babak {room.current_stage} / {room.max_stages}</p>
                  </div>
                  <button onClick={() => router.push(`/room/${room.id}`)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
                    {room.status === 'waiting' ? 'Masuk' : 'Lanjut'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between gap-3">
              <p className="text-slate-600 text-xs">Menampilkan {pagedActive.length} dari {activeTotal}</p>
              <div className="flex items-center gap-2">
                {hasMoreActive && (
                  <button onClick={() => setActivePage(p => p + 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-all">
                    <ChevronDown className="w-3.5 h-3.5" /> Muat lebih
                  </button>
                )}
                {activePage > 1 && (
                  <button onClick={() => setActivePage(1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-all">
                    <ChevronUp className="w-3.5 h-3.5" /> Lipat
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Materi ── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-white font-bold text-sm">Pilihan Materi</span>
            </div>
            <button onClick={() => router.push('/materials')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { emoji: '📊', title: 'Matematika', sub: 'matematika', color: 'from-violet-600/15 to-purple-900/5 border-violet-500/20', accent: 'text-violet-400' },
              { emoji: '🔬', title: 'Sains',      sub: 'sains',      color: 'from-cyan-600/15 to-teal-900/5 border-cyan-500/20',       accent: 'text-cyan-400' },
              { emoji: '📚', title: 'Sejarah',    sub: 'sejarah',    color: 'from-amber-600/15 to-orange-900/5 border-amber-500/20',   accent: 'text-amber-400' },
              { emoji: '✏️', title: 'Sastra',     sub: 'sastra',     color: 'from-rose-600/15 to-pink-900/5 border-rose-500/20',       accent: 'text-rose-400' },
            ].map((c, i) => (
              <button key={i} onClick={() => router.push(`/materials?subject=${c.sub}`)}
                className={`group bg-gradient-to-br ${c.color} border rounded-xl p-4 text-center hover:scale-[1.03] active:scale-[.98] transition-all duration-200`}>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{c.emoji}</div>
                <p className={`text-xs font-bold ${c.accent}`}>{c.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Riwayat Main ── */}
        {!loadingRooms && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-white font-bold text-sm">Riwayat Main</span>
              <span className="px-2 py-0.5 bg-white/[0.06] rounded-full text-slate-400 text-[11px] font-bold">{pastTotal}</span>
            </div>

            {pastRooms.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm font-semibold">Belum ada riwayat main</p>
                <p className="text-slate-600 text-xs">Buat atau gabung room untuk mulai bermain!</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/[0.05]">
                  {pagedPast.map((room) => (
                    <div key={room.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-500/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm">{room.room_code}</span>
                          {room.is_host && <span className="px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/25 rounded-full text-yellow-300/80 text-[10px] font-bold">HOST</span>}
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(room.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span className="text-slate-700">·</span>
                          {room.max_stages} babak
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold shrink-0">Selesai</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between gap-3">
                  <p className="text-slate-600 text-xs">Menampilkan {pagedPast.length} dari {pastTotal}</p>
                  <div className="flex items-center gap-2">
                    {hasMorePast && (
                      <button onClick={() => setPastPage(p => p + 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-all">
                        <ChevronDown className="w-3.5 h-3.5" /> Muat lebih
                      </button>
                    )}
                    {pastPage > 1 && (
                      <button onClick={() => setPastPage(1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-all">
                        <ChevronUp className="w-3.5 h-3.5" /> Lipat
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      <MusicControl trackUrl="/audio/dashboard/dashboard-music-2.mp3" />
    </div>
  )
}