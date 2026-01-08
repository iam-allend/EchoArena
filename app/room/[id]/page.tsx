'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Check, Users, Crown, LogOut, Play } from 'lucide-react'

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

  // ✅ DEBUG DI USEEFFECT (agar window tersedia)
  useEffect(() => {
    console.log('🔍 DEBUG PAGE LOAD:')
    console.log('- params object:', params)
    console.log('- params.id:', params.id)
    console.log('- roomId:', roomId)
    console.log('- roomId type:', typeof roomId)
    if (typeof window !== 'undefined') {
      console.log('- URL pathname:', window.location.pathname)
    }
  }, [params, roomId])

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
      .neq('status', 'left')
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Load participants error:', error)
      return
    }

    setParticipants(data || [])
  }

  function subscribeToRoomUpdates() {
    console.log('🔔 Setting up realtime subscriptions for room:', roomId)
    
    // ✅ FIX 1: Single channel for better performance
    const channel = supabase
      .channel(`room_${roomId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      
    // ✅ FIX 2: Subscribe to participants with better filter
    channel.on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`, // This works for UUID
      },
      (payload) => {
        console.log('🔔 Participant change detected:', payload.eventType, payload)
        loadParticipants()
      }
    )
    
    // ✅ FIX 3: Subscribe to room status changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        console.log('🔔 Room status change:', payload)
        const updatedRoom = payload.new as Room
        setRoom(updatedRoom)

        // If game started, redirect
        if (updatedRoom.status === 'playing') {
          console.log('🎮 Game started! Redirecting...')
          router.push(`/game/${roomId}`)
        }
      }
    )
    
    // ✅ FIX 4: Subscribe and track status
    channel
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to room updates')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error:', err)
        }
        if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out')
        }
      })

    // ✅ FIX 5: Cleanup function
    return () => {
      console.log('🧹 Cleaning up subscriptions for room:', roomId)
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
      // ✅ VALIDASI 1: Cek user dan user.id
      console.log('🔍 Checking user:', user)
      console.log('🔍 User ID:', user?.id, typeof user?.id)
      
      if (!user) {
        console.error('❌ User object is null/undefined')
        alert('You must be logged in to leave the room')
        return
      }

      if (!user.id) {
        console.error('❌ User ID is missing from user object')
        alert('User ID not found. Please log in again.')
        router.push('/') // Redirect ke login
        return
      }

      // ✅ VALIDASI 2: Cek roomId
      console.log('🔍 Room ID:', roomId, typeof roomId)
      
      if (!roomId) {
        console.error('❌ Room ID is missing')
        alert('Invalid room ID')
        return
      }

      // ✅ VALIDASI 3: Pastikan bukan string "undefined"
      if (user.id === 'undefined' || roomId === 'undefined') {
        console.error('❌ ID contains string "undefined"', { userId: user.id, roomId })
        alert('Invalid user or room ID')
        return
      }

      console.log('✅ All validations passed')
      console.log('🚪 Attempting to leave room...', { 
        userId: user.id, 
        roomId,
        userIdType: typeof user.id,
        roomIdType: typeof roomId
      })

      // ✅ Kirim request
      const response = await fetch(`/api/room/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      })

      // Parse response
      const data = await response.json()
      
      console.log('📥 Leave room response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      // Check jika response tidak OK
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      console.log('✅ Successfully left room!')
      
      // Redirect ke dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('❌ Leave room error:', error)
      
      // Tampilkan error detail ke user
      alert(
        error.message || 
        'Failed to leave room. Please check console for details.'
      )
    }
  }

  async function handleStartGame() {
    if (!isHost) return

    // Check minimum players
    if (participants.length < 2) {
      alert('Need at least 2 players to start!')
      return
    }

    setStarting(true)

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'playing', current_stage: 1 })
        .eq('id', roomId)

      if (error) throw error

      // Will redirect via subscription
    } catch (error) {
      console.error('Start game error:', error)
      alert('Failed to start game')
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
        {isHost && (
          <Button
            onClick={handleStartGame}
            disabled={participants.length < 2 || starting}
            className="w-full h-16 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Starting Game...
              </>
            ) : (
              <>
                <Play className="mr-2 h-6 w-6" />
                Start Game
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