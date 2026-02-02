'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Copy, Check, Users, Crown, LogOut, X, Settings, Volume2, VolumeX, Sparkles, Trophy, Target } from 'lucide-react'
import { MusicControl } from '@/components/ui/MusicControl'

// ... (Interface tetap sama seperti kode aslimu)
interface Participant {
  id: string
  user_id: string
  lives_remaining: number
  total_score: number
  status: string
  user: {
    username: string
    level: number
    avatar_url?: string
  }
}

interface Room {
  id: string
  room_code: string
  host_user_id: string
  status: string
  current_stage: number
  max_stages: number
  created_at: string
}

export default function RoomLobbyPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [showSettingsPopup, setShowSettingsPopup] = useState(false)
  const [showLeavePopup, setShowLeavePopup] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const isHost = user?.id === room?.host_user_id

  // ... (useEffect, loadRoomData, loadParticipants, subscribeToRoomUpdates, copyRoomCode, handleLeaveRoom, handleStartGame tetap sama)
  useEffect(() => {
    if (!authLoading && roomId) {
      loadRoomData()
      const cleanup = subscribeToRoomUpdates()
      return cleanup
    }
  }, [authLoading, roomId])

  async function loadRoomData() {
    try {
      const { data: roomData, error: roomError } = await supabase.from('game_rooms').select('*').eq('id', roomId).single()
      if (roomError) throw roomError
      setRoom(roomData)
      await loadParticipants()
    } catch (error) {
      console.error('Load room error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadParticipants() {
    const { data, error } = await supabase
      .from('room_participants')
      .select(`id, user_id, lives_remaining, total_score, status, user:users!inner (username, level, avatar_url)`)
      .eq('room_id', roomId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (!error) setParticipants(data as unknown as Participant[])
  }

  function subscribeToRoomUpdates() {
    const channel = supabase.channel(`room_lobby:${roomId}`)
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
      const updatedRoom = payload.new as Room
      setRoom(updatedRoom)
      if (updatedRoom.status === 'playing') router.push(`/game/${roomId}`)
    })
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, () => {
      loadParticipants()
    })
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  async function copyRoomCode() {
    if (!room) return
    await navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLeaveRoom() {
    try {
      const AgoraManager = (await import('@/lib/agora/client')).default
      await AgoraManager.cleanup()
      await fetch(`/api/room/${roomId}/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id }) })
      router.push('/dashboard')
    } catch (error) { console.error(error) }
  }

  async function handleStartGame() {
    if (!isHost || participants.length < 2) return
    setStarting(true)
    try {
      await fetch(`/api/game/${roomId}/start`, { method: 'POST' })
    } catch (error) {
      setStarting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-black"></div>
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-white" />
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Galaxy Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-40 h-40 md:w-72 md:h-72 bg-purple-600 rounded-full blur-[80px] md:blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-52 h-52 md:w-96 md:h-96 bg-violet-600 rounded-full blur-[100px] md:blur-[150px] animate-pulse delay-700"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Top Bar - Responsive Layout */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Lobi Pertarungan</h1>
                <p className="text-xs md:text-sm text-purple-300">Bersiaplah untuk kuis!</p>
              </div>
            </div>
            
            <div className="flex w-full sm:w-auto gap-2 md:gap-3">
              <button onClick={() => setShowSettingsPopup(true)} className="flex-1 sm:flex-none h-11 px-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <Settings className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="flex-1 sm:flex-none h-11 px-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              <button onClick={() => setShowLeavePopup(true)} className="flex-[2] sm:flex-none px-4 h-11 rounded-xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all">
                <LogOut className="w-4 h-4 text-red-400 mr-2" />
                <span className="text-red-400 font-medium text-sm">Keluar</span>
              </button>
            </div>
          </div>

          {/* Room Info Card - Optimasi Grid Mobile */}
          <div className="mb-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-5 md:p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Room Code Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium uppercase tracking-wider">Kode Room</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex-1 bg-black/30 rounded-xl md:rounded-2xl p-3 md:p-5 border border-purple-500/30 overflow-hidden">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 tracking-[0.15em] sm:tracking-[0.3em] text-center animate-pulse truncate">
                      {room.room_code}
                    </div>
                  </div>
                  <button onClick={copyRoomCode} className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-purple-500/50 flex-shrink-0">
                    {copied ? <Check className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Copy className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                  </button>
                </div>
              </div>

              {/* Game Info - Horizontal on Mobile */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-300">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Info Game</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-xl md:rounded-2xl p-3 md:p-4 border border-purple-500/20">
                    <div className="text-purple-300 text-[10px] md:text-xs mb-1 uppercase">Babak</div>
                    <div className="text-xl md:text-3xl font-bold text-white">{room.max_stages}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl md:rounded-2xl p-3 md:p-4 border border-purple-500/20">
                    <div className="text-purple-300 text-[10px] md:text-xs mb-1 uppercase">Pemain</div>
                    <div className="text-xl md:text-3xl font-bold text-white">{participants.length}<span className="text-lg md:text-xl text-purple-400">/8</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert - Responsive Padding */}
          {participants.length < 2 && (
            <div className="mb-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 p-4 md:p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-yellow-300 font-semibold mb-0.5 text-sm md:text-base">Menunggu Pemain...</h3>
                  <p className="text-yellow-200/80 text-xs md:text-sm">Butuh minimal 2 pemain untuk memulai pertarungan.</p>
                </div>
              </div>
            </div>
          )}

          {/* Players Section - Grid 1 column on small mobile, 2 on tablet+ */}
          <div className="mb-6 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-5 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white">Pemain Siap</h2>
              </div>
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs md:text-base">
                <span className="text-white font-semibold">{participants.length}</span>
                <span className="text-purple-300 mx-1">/</span>
                <span className="text-purple-300">8</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {participants.map((participant, index) => (
                <div key={participant.id} className="group relative rounded-xl md:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-3 md:p-5 hover:border-purple-500/50 transition-all shadow-lg">
                  <div className="absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-[10px] md:text-sm shadow-lg z-20">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-purple-500/50">
                        {participant.user.username.charAt(0).toUpperCase()}
                      </div>
                      {participant.user_id === room.host_user_id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                          <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                        <span className="text-white font-bold text-sm md:text-lg truncate">
                          {participant.user.username}
                        </span>
                        {participant.user_id === user?.id && (
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[8px] md:text-xs font-medium flex-shrink-0">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] md:text-sm">
                        <div className="flex items-center gap-1 text-purple-300">
                          <Target className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          <span>Lv {participant.user.level}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-green-400 font-medium">Siap</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty Slots - Optimized for mobile */}
              {[...Array(Math.max(0, 8 - participants.length))].slice(0, 4).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-xl md:rounded-2xl bg-white/5 border border-dashed border-white/20 p-3 md:p-5 flex items-center gap-3 md:gap-4 opacity-50">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-white/20" />
                  </div>
                  <span className="text-white/40 font-medium text-xs md:text-base">Kosong...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed/Sticky Start Game Button for Mobile */}
          <div className="md:relative sticky bottom-4 left-0 right-0 z-30">
            {isHost && room.status === 'waiting' && (
              <button
                onClick={handleStartGame}
                disabled={starting || participants.length < 2}
                className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 font-bold text-white text-base md:text-xl shadow-2xl shadow-green-500/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {starting ? 'Memulai...' : 'Mulai Pertarungan'}
              </button>
            )}

            {!isHost && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/20">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-white/80 text-xs md:text-sm">Menunggu host memulai...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups - Same content but responsive widths */}
      {showSettingsPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-purple-950 border border-white/20 p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Pengaturan</h2>
              <X onClick={() => setShowSettingsPopup(false)} className="text-white cursor-pointer" />
            </div>
            <div className="space-y-4">
               {/* Simplified Settings Item */}
               {['Efek Suara', 'Musik Latar', 'Notifikasi'].map((item) => (
                 <div key={item} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                   <span className="text-white text-sm">{item}</span>
                   <div className="w-10 h-5 rounded-full bg-green-500 relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                 </div>
               ))}
            </div>
            <button onClick={() => setShowSettingsPopup(false)} className="w-full mt-6 py-3 bg-purple-500 rounded-xl text-white font-bold">Tutup</button>
          </div>
        </div>
      )}

      {/* Leave Popup */}
      {showLeavePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-red-950 border border-red-500/30 p-6 shadow-2xl animate-scaleIn">
            <h2 className="text-xl font-bold text-white mb-2">Keluar?</h2>
            <p className="text-red-200 text-sm mb-6">Anda tidak bisa bergabung kembali ke sesi ini.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeavePopup(false)} className="flex-1 py-3 bg-white/10 rounded-xl text-white text-sm">Batal</button>
              <button onClick={handleLeaveRoom} className="flex-1 py-3 bg-red-600 rounded-xl text-white text-sm font-bold">Keluar</button>
            </div>
          </div>
        </div>
      )}

      <MusicControl trackUrl="/audio/dashboard/dashboard-music-1.mp3" />

      <style jsx>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-twinkle { animation: twinkle 2s infinite; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}