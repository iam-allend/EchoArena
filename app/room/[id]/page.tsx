'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Copy, Check, Users, Crown, LogOut, X, Settings, Volume2, VolumeX, Sparkles, Trophy, Target } from 'lucide-react'
import { MusicControl } from '@/components/ui/MusicControl'

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

  useEffect(() => {
    if (!authLoading && roomId) {
      loadRoomData()
      const cleanup = subscribeToRoomUpdates()
      return cleanup
    }
  }, [authLoading, roomId])

  async function loadRoomData() {
    try {
      // Load room info
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // Load participants
      await loadParticipants()
    } catch (error) {
      console.error('Load room error:', error)
      alert('Room tidak ditemukan')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadParticipants() {
    const { data, error } = await supabase
      .from('room_participants')
      .select(`
        id,
        user_id,
        lives_remaining,
        total_score,
        status,
        user:users (
          username,
          level,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Load participants error:', error)
      return
    }

    console.log('👥 Participants loaded:', data?.length || 0)
    setParticipants(data || [])
  }

  function subscribeToRoomUpdates() {
    console.log('🔔 Setting up realtime subscriptions for room:', roomId)
    
    const channel = supabase.channel(`room_lobby:${roomId}`)
    
    // Subscribe to ROOM updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        console.log('🎮 Room updated:', payload.new)
        const updatedRoom = payload.new as Room
        setRoom(updatedRoom)

        if (updatedRoom.status === 'playing') {
          console.log('🚀 Game started! Redirecting to game page...')
          router.push(`/game/${roomId}`)
        }
      }
    )
    
    // Subscribe to PARTICIPANT changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('👥 Participant change detected:', payload.eventType)
        loadParticipants()
      }
    )

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to room updates')
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error:', err)
      }
    })

    return () => {
      console.log('🧹 Cleaning up room subscriptions')
      supabase.removeChannel(channel)
    }
  }

  async function copyRoomCode() {
    if (!room) return

    await navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLeaveRoom() {
    try {
      if (!user?.id || !roomId) {
        alert('User atau room tidak valid')
        return
      }

      console.log('🚪 Leaving room...', { userId: user.id, roomId })

      // Cleanup Agora connection
      const AgoraManager = (await import('@/lib/agora/client')).default
      await AgoraManager.cleanup()

      const response = await fetch(`/api/room/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal keluar dari room')
      }

      console.log('✅ Left room successfully')
      setShowLeavePopup(false)
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('❌ Leave room error:', error)
      alert(error.message || 'Gagal keluar dari room')
    }
  }

  async function handleStartGame() {
    if (!isHost) {
      alert('Hanya host yang bisa memulai permainan')
      return
    }

    if (participants.length < 2) {
      alert('Butuh minimal 2 pemain untuk memulai!')
      return
    }

    setStarting(true)

    try {
      console.log('🎮 Starting game...')

      const response = await fetch(`/api/game/${roomId}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      console.log('✅ Game started! Agora channel:', data.voiceChannelName)

    } catch (error: any) {
      console.error('❌ Start game error:', error)
      alert(`Gagal memulai permainan: ${error.message}`)
      setStarting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-black">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-600 rounded-full blur-[150px] animate-pulse"></div>
          </div>
        </div>
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-white" />
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Galaxy Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-600 rounded-full blur-[150px] animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-600 rounded-full blur-[130px] animate-pulse delay-1000"></div>
        </div>
        
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Lobi Pertarungan</h1>
                <p className="text-sm text-purple-300">Bersiaplah untuk kuis!</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettingsPopup(true)}
                className="w-11 h-11 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-105 shadow-lg"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-11 h-11 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-105 shadow-lg"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={() => setShowLeavePopup(true)}
                className="px-5 h-11 rounded-xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all hover:scale-105 shadow-lg"
              >
                <LogOut className="w-4 h-4 text-red-400 mr-2" />
                <span className="text-red-400 font-medium">Keluar</span>
              </button>
            </div>
          </div>

          {/* Room Info Card */}
          <div className="mb-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Room Code Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium uppercase tracking-wider">Kode Room</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/30 rounded-2xl p-5 border border-purple-500/30">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 tracking-[0.3em] text-center animate-pulse">
                      {room.room_code}
                    </div>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-purple-500/50"
                  >
                    {copied ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Copy className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Game Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-300">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wider">Info Game</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-2xl p-4 border border-purple-500/20">
                    <div className="text-purple-300 text-xs mb-1">Total Babak</div>
                    <div className="text-3xl font-bold text-white">{room.max_stages}</div>
                  </div>
                  <div className="bg-black/30 rounded-2xl p-4 border border-purple-500/20">
                    <div className="text-purple-300 text-xs mb-1">Pemain</div>
                    <div className="text-3xl font-bold text-white">{participants.length}<span className="text-xl text-purple-400">/8</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert */}
          {participants.length < 2 && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-yellow-300 font-semibold mb-1">Menunggu Pemain...</h3>
                  <p className="text-yellow-200/80 text-sm">Bagikan kode room ke temanmu! Butuh minimal 2 pemain untuk memulai pertarungan.</p>
                </div>
              </div>
            </div>
          )}

          {/* Players Section */}
          <div className="mb-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Pemain Siap</h2>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white font-semibold">{participants.length}</span>
                <span className="text-purple-300 mx-1">/</span>
                <span className="text-purple-300">8</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="group relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-5 hover:border-purple-500/50 transition-all hover:scale-[1.02] shadow-lg"
                >
                  {/* Rank Badge */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/50">
                        {participant.user.username.charAt(0).toUpperCase()}
                      </div>
                      {participant.user_id === room.host_user_id && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-lg">
                          {participant.user.username}
                        </span>
                        {participant.user_id === user?.id && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-purple-300">
                          <Target className="w-3 h-3" />
                          <span>Level {participant.user.level}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-green-400 font-medium">Siap</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {[...Array(Math.max(0, 8 - participants.length))].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-2xl bg-white/5 backdrop-blur-xl border border-dashed border-white/20 p-5 flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white/20" />
                  </div>
                  <span className="text-white/40 font-medium">Menunggu pemain...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && room.status === 'waiting' && (
            <button
              onClick={handleStartGame}
              disabled={starting || participants.length < 2}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white text-xl shadow-2xl shadow-green-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              {starting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Memulai Pertarungan...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Mulai Pertarungan Kuis
                  {participants.length < 2 && ' (Butuh 2+ Pemain)'}
                </>
              )}
            </button>
          )}

          {!isHost && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-white/80">Menunggu host memulai pertarungan...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Popup */}
      {showSettingsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-purple-900/90 to-black/90 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Pengaturan</h2>
              </div>
              <button
                onClick={() => setShowSettingsPopup(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Efek Suara</h3>
                    <p className="text-purple-300 text-sm">Aktifkan suara game</p>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-green-500 relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Musik Latar</h3>
                    <p className="text-purple-300 text-sm">Aktifkan musik</p>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-white/20 relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Notifikasi</h3>
                    <p className="text-purple-300 text-sm">Notifikasi dalam game</p>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-green-500 relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsPopup(false)}
              className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold text-white transition-all shadow-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Leave Confirmation Popup */}
      {showLeavePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-red-900/90 to-black/90 backdrop-blur-2xl border border-red-500/30 p-8 shadow-2xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Keluar Room?</h2>
              <p className="text-red-200/80">Apakah kamu yakin ingin keluar dari room ini? Kamu tidak dapat bergabung kembali setelah keluar.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeavePopup(false)}
                className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-white transition-all border border-white/20"
              >
                Batal
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold text-white transition-all shadow-lg"
              >
                Keluar Room
              </button>
            </div>
          </div>
        </div>
      )}

      <MusicControl trackUrl="/audio/dashboard/dashboard-music-1.mp3" />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-twinkle {
          animation: twinkle 2s infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  )
}