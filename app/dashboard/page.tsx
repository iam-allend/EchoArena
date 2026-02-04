'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getGuestDaysRemaining } from '@/lib/auth/guest'

import { MusicControl } from '@/components/ui/MusicControl'

import {
  Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle,
  Sparkles, Trophy, Star, Zap, Users, Target, BookOpen, Plus,
  ArrowRight, Flame, TrendingUp, Calendar
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

export default function Dashboard() {
  const router = useRouter()
  const { user, isGuest, loading, expiresAt, isAuthenticated, logout } = useAuth()
  const supabase = createClient()

  const [activeRooms, setActiveRooms] = useState<RoomHistory[]>([])
  const [pastRooms, setPastRooms] = useState<RoomHistory[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
    if (user) {
      loadRoomHistory()
      
      // ✅ REFRESH USER STATS setelah game selesai
      refreshUserStats()
    }
  }, [loading, isAuthenticated, user, router])

  async function refreshUserStats() {
    if (!user) return
    
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .select('level, xp, total_games, total_wins')
        .eq('id', user.id)
        .single()
      
      if (updatedUser && !error) {
        // Update user object di hook (jika ada setter)
        // Atau trigger re-render dengan state
        console.log('✅ Stats refreshed:', updatedUser)
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    }
  }


  async function loadRoomHistory() {
    if (!user) return
    try {
      const { data: participants } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          status,
          game_rooms (
            id,
            room_code,
            status,
            host_user_id,
            current_stage,
            max_stages,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (!participants) return

      const rooms: RoomHistory[] = participants
        .filter(p => p.game_rooms)
        .map(p => {
          const room = p.game_rooms as any
          return {
            id: room.id,
            room_code: room.room_code,
            status: room.status,
            created_at: room.created_at,
            current_stage: room.current_stage,
            max_stages: room.max_stages,
            is_host: room.host_user_id === user.id,
            participant_status: p.status,
          }
        })

      const active = rooms.filter(r =>
        (r.status === 'waiting' || r.status === 'playing') &&
        r.participant_status === 'active'
      )

      setActiveRooms(active)
      setPastRooms(rooms.filter(r => r.status === 'finished'))
    } catch (error) {
      console.error('Load room history error:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  // Handler untuk navigasi ke halaman upgrade
  function handleUpgradeClick() {
    router.push('/auth/upgrade')
  }

  const daysRemaining = isGuest && expiresAt ? getGuestDaysRemaining(expiresAt) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-purple-400" />
          <p className="text-purple-200 font-medium text-sm sm:text-base">Sedang memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Background blobs - lebih kecil di mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/3 w-56 h-56 sm:w-72 sm:h-72 bg-indigo-500/15 rounded-full blur-3xl animate-pulse hidden sm:block" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating icons - disembunyikan di mobile agar tidak crowded */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <Trophy className="absolute top-24 left-1/5 w-6 h-6 sm:w-8 sm:h-8 text-yellow-400/30 animate-bounce" style={{ animationDelay: '0s' }} />
        <Star className="absolute top-40 right-1/5 w-5 h-5 sm:w-6 sm:h-6 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s' }} />
        <Zap className="absolute bottom-32 left-1/3 w-6 h-6 sm:w-7 sm:h-7 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute bottom-24 right-1/4 w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400/30 animate-bounce" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

          {/* Guest Warning - FIXED: Added onClick handler */}
          {isGuest && daysRemaining !== null && (
            <Alert className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/40 backdrop-blur-xl rounded-xl sm:rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-base sm:text-lg text-white">Akun Tamu</div>
                    <div className="text-amber-100 text-sm sm:text-base">
                      Berakhir dalam <span className="font-bold">{daysRemaining} hari</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleUpgradeClick}
                  className="mt-3 sm:mt-0 w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Akun
                </Button>
              </div>
            </Alert>
          )}

          {/* Header */}
          <div className="bg-gray-900/70 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl border border-purple-500/30 shadow-xl p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Halo, {user.username}!
                  </span>
                </h1>
                <p className="text-purple-200 text-base sm:text-lg lg:text-xl">
                  {isGuest ? '✨ Mode Tamu • Ayo Main!' : '🎮 Siap untuk tantangan seru?'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Level */}
            <Card className="bg-gray-900/70 backdrop-blur-xl border-yellow-500/30 p-5 sm:p-6 lg:p-8 hover:scale-[1.02] transition-all">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {user.level || 1}
                </div>
                <div className="text-yellow-200 font-bold mt-1 text-lg">Level</div>
              </div>
            </Card>

            {/* XP */}
            <Card className="bg-gray-900/70 backdrop-blur-xl border-purple-500/30 p-5 sm:p-6 lg:p-8 hover:scale-[1.02] transition-all">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {user.xp || 0}
                </div>
                <div className="text-purple-200 font-bold mt-1 text-lg">Total XP</div>
              </div>
            </Card>

            {/* Games Played */}
            <Card className="bg-gray-900/70 backdrop-blur-xl border-blue-500/30 p-5 sm:p-6 lg:p-8 hover:scale-[1.02] transition-all">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {user.total_games || 0}
                </div>
                <div className="text-blue-200 font-bold mt-1 text-lg">Total Main</div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div
              onClick={() => router.push('/room/create')}
              className="group relative bg-gradient-to-br from-green-600/20 to-emerald-700/20 border border-green-500/40 rounded-2xl p-6 sm:p-8 cursor-pointer hover:scale-[1.02] transition-all backdrop-blur-sm"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl mx-auto sm:mx-0">
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Buat Room
              </h3>
              <p className="text-green-100 text-base sm:text-lg mb-5">
                Bikin kuis baru dan ajak temanmu
              </p>
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Buat Sekarang
              </Button>
            </div>

            <div
              onClick={() => router.push('/room/join')}
              className="group relative bg-gradient-to-br from-blue-600/20 to-cyan-700/20 border border-blue-500/40 rounded-2xl p-6 sm:p-8 cursor-pointer hover:scale-[1.02] transition-all backdrop-blur-sm"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl mx-auto sm:mx-0">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Gabung Room
              </h3>
              <p className="text-blue-100 text-base sm:text-lg mb-5">
                Masukkan kode dan mulai main
              </p>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <ArrowRight className="h-4 w-4 mr-2" />
                Gabung Yuk
              </Button>
            </div>
          </div>

          {/* Quiz Categories */}
          <Card className="bg-gray-900/70 backdrop-blur-xl border-purple-500/30 p-5 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              Pilihan Topik
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { emoji: '📊', title: 'Matematika', desc: 'Aljabar, Geometri, Berhitung', count: '120 Kuis', color: 'yellow' },
                { emoji: '🔬', title: 'Sains', desc: 'Fisika, Kimia, Biologi', count: '95 Kuis', color: 'green' },
                { emoji: '📚', title: 'Sejarah', desc: 'Peristiwa dunia & sejarah', count: '78 Kuis', color: 'blue' },
                { emoji: '📖', title: 'Bahasa', desc: 'Membaca & cerita', count: '64 Kuis', color: 'purple' },
              ].map((cat, i) => (
                <div
                  key={i}
                  className={`group bg-gradient-to-br from-${cat.color}-500/10 to-${cat.color}-600/10 border border-${cat.color}-500/30 rounded-xl p-4 sm:p-5 hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="h-28 sm:h-32 bg-black/20 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl">{cat.emoji}</span>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold text-white group-hover:text-${cat.color}-400 transition-colors`}>
                    {cat.title}
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1">{cat.desc}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{cat.count}</span>
                    <Sparkles className={`h-4 w-4 text-${cat.color}-400`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Rooms */}
          {activeRooms.length > 0 && (
            <div className="bg-gray-900/70 backdrop-blur-xl border-green-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                      Kuis Berlangsung
                      <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-bold">
                        {activeRooms.length}
                      </span>
                    </h2>
                    <p className="text-green-200 text-sm">Permainanmu saat ini</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-300 animate-pulse text-sm font-medium">
                  <Flame className="h-4 w-4" /> LIVE
                </div>
              </div>

              <div className="space-y-4">
                {activeRooms.map((room, idx) => (
                  <div
                    key={room.id}
                    className="group bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-white/10 rounded-xl p-5 sm:p-6 hover:border-green-500/50 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl flex items-center justify-center">
                          <span className="text-xl sm:text-2xl font-black text-green-300">#{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xl font-black text-white">{room.room_code}</span>
                            {room.is_host && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-yellow-300 text-xs font-bold">
                                HOST
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              room.status === 'waiting'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-green-500/20 text-green-300 border-green-500/40 animate-pulse'
                            }`}>
                              {room.status === 'waiting' ? 'Menunggu' : 'Main'}
                            </span>
                          </div>
                          <div className="text-sm text-purple-300 flex items-center gap-3">
                            <Sparkles className="h-4 w-4" />
                            Babak {room.current_stage} / {room.max_stages}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/room/${room.id}`)}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 mt-3 sm:mt-0"
                        size="sm"
                      >
                        {room.status === 'waiting' ? 'Masuk Lobi' : 'Lanjut Main'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Kemajuan</span>
                        <span className="text-green-400 font-bold">
                          {Math.round((room.current_stage / room.max_stages) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                          style={{ width: `${(room.current_stage / room.max_stages) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Rooms */}
          {pastRooms.length > 0 && (
            <div className="bg-gray-900/70 backdrop-blur-xl border-purple-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">Riwayat Main</h2>
                    <p className="text-purple-200 text-sm">Kuis yang sudah selesai</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-100">
                  Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {pastRooms.slice(0, 5).map((room, idx) => (
                  <div
                    key={room.id}
                    className="group bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-white/10 rounded-xl p-5 sm:p-6 hover:border-purple-500/50 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-600/30 to-gray-700/30 border border-gray-500/50 rounded-xl flex items-center justify-center">
                          <span className="text-xl sm:text-2xl font-black text-gray-400">#{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-lg sm:text-xl font-black text-white">{room.room_code}</span>
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-300 text-xs font-bold">
                              SELESAI
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-300">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {new Date(room.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4" />
                              {room.max_stages} Babak
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
            
    <MusicControl trackUrl="/audio/dashboard/dashboard-music-2.mp3" />
      
    </div>
    
  )
}