'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Check, Users, Crown, LogOut } from 'lucide-react'

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
      alert('Room not found')
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
      .eq('status', 'active') // ✅ HANYA ambil yang active
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
    
    // ✅ SINGLE CHANNEL untuk semua subscriptions
    const channel = supabase.channel(`room_lobby:${roomId}`)
    
    // ✅ Subscribe to ROOM updates (status changes)
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

        // If game started, redirect to game page
        if (updatedRoom.status === 'playing') {
          console.log('🚀 Game started! Redirecting to game page...')
          router.push(`/game/${roomId}`)
        }
      }
    )
    
    // ✅ Subscribe to PARTICIPANT changes (join/leave/rejoin)
    channel.on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('👥 Participant change detected:', payload.eventType)
        // Reload participant list whenever there's a change
        loadParticipants()
      }
    )

    // ✅ Subscribe and log status
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to room updates')
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error:', err)
      }
    })

    // ✅ Cleanup function
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
        alert('Invalid user or room')
        return
      }

      console.log('🚪 Leaving room...', { userId: user.id, roomId })

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
        throw new Error(data.error || 'Failed to leave room')
      }

      console.log('✅ Left room successfully')
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('❌ Leave room error:', error)
      alert(error.message || 'Failed to leave room')
    }
  }

  async function handleStartGame() {
    if (!isHost) {
      alert('Only the host can start the game')
      return
    }

    if (participants.length < 2) {
      alert('Need at least 2 players to start!')
      return
    }

    setStarting(true)

    try {
      console.log('🎮 Starting game...')

      // Update room status to playing
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'playing',
          current_stage: 1 
        })
        .eq('id', roomId)

      if (updateError) throw updateError

      // Initialize turn queue for stage 1
      console.log('🎲 Initializing turn queue...')
      
      const { data: initData, error: turnError } = await supabase.rpc('initialize_stage_turns', {
        p_room_id: roomId,
        p_stage_number: 1
      })

      if (turnError) {
        console.error('❌ Failed to initialize turns:', {
          error: turnError,
          message: turnError.message,
          details: turnError.details,
          hint: turnError.hint,
          code: turnError.code
        })
        throw new Error(turnError.message || 'Failed to initialize turn queue')
      }

      console.log('✅ Turn queue initialized:', initData)

      console.log('✅ Game started! Redirecting...')

      // Redirect to game page
      router.push(`/game/${roomId}`)
      
    } catch (error: any) {
      console.error('❌ Start game error:', error)
      alert(`Failed to start game: ${error.message}`)
      setStarting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Room Header */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Game Lobby
                </h1>
                <p className="text-purple-200">
                  {room.max_stages} stages • {participants.length}/8 players
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={handleLeaveRoom}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>

            {/* Room Code */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-purple-200 mb-1">Room Code:</p>
                <div className="flex items-center gap-2">
                  <div className="text-4xl font-bold text-white tracking-widest bg-white/10 px-6 py-3 rounded-lg">
                    {room.room_code}
                  </div>
                  <Button
                    onClick={copyRoomCode}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Waiting for Players Alert */}
        {participants.length < 2 && (
          <Alert className="mb-6 bg-yellow-100 border-yellow-400">
            <Users className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Waiting for players...</strong> Share the room code with your friends! Need at least 2 players to start.
            </AlertDescription>
          </Alert>
        )}

        {/* Participants List */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({participants.length}/8)
            </h2>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {participant.user.username.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {participant.user.username}
                        </span>
                        {participant.user_id === room.host_user_id && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                        {participant.user_id === user?.id && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-purple-200">
                        Level {participant.user.level}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-green-400 text-sm">
                    ● Ready
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: 8 - participants.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-dashed border-white/20"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white/30" />
                  </div>
                  <span className="text-white/40">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Start Game Button (Host Only) */}
        {isHost && room.status === 'waiting' && (
          <Button
            onClick={handleStartGame}
            disabled={starting || participants.length < 2}
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Game...
              </>
            ) : (
              <>
                🎮 Start Game
                {participants.length < 2 && ' (Need 2+ players)'}
              </>
            )}
          </Button>
        )}

        {/* Waiting for Host */}
        {!isHost && (
          <div className="text-center text-white/60">
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  )
}