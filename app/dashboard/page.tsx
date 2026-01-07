'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getGuestDaysRemaining } from '@/lib/auth/guest'
import { Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle } from 'lucide-react'

interface RoomHistory {
  id: string
  room_code: string
  status: string
  created_at: string
  current_stage: number
  max_stages: number
  is_host: boolean
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
    }
  }, [loading, isAuthenticated, user, router])

  async function loadRoomHistory() {
    if (!user) return

    try {
      // Get all rooms user participated in
      const { data: participants } = await supabase
        .from('room_participants')
        .select(`
          room_id,
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
        .filter(p => p.game_rooms) // Filter out null rooms
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
          }
        })

      // Split into active and past
      setActiveRooms(rooms.filter(r => r.status === 'waiting' || r.status === 'playing'))
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

  const daysRemaining = isGuest && expiresAt ? getGuestDaysRemaining(expiresAt) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Guest Warning */}
        {isGuest && daysRemaining !== null && (
          <Alert className="mb-6 bg-yellow-100 border-yellow-400">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-800">
                <strong>Guest Account:</strong> Your account expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                Create an account to save your progress!
              </span>
              <Button
                size="sm"
                onClick={() => router.push('/auth/upgrade')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header with Logout */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, {user.username}! {isGuest && '👤'}
            </h1>
            <p className="text-purple-200">
              {isGuest ? 'Playing as guest' : 'Ready to battle?'}
            </p>
          </div>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-3xl font-bold text-white">{user.level || 1}</div>
              <div className="text-purple-200">Level</div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-white">{user.xp || 0}</div>
              <div className="text-purple-200">Experience</div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-3xl font-bold text-white">{user.total_games || 0}</div>
              <div className="text-purple-200">Games Played</div>
            </div>
          </Card>
        </div>

        {/* Active Rooms */}
        {activeRooms.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Play className="h-6 w-6" />
              Active Rooms
            </h2>
            <div className="space-y-3">
              {activeRooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-lg">{room.room_code}</span>
                      {room.is_host && <Crown className="h-4 w-4 text-yellow-400" />}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        room.status === 'waiting' ? 'bg-blue-500' : 'bg-green-500'
                      } text-white`}>
                        {room.status === 'waiting' ? 'Waiting' : 'Playing'}
                      </span>
                    </div>
                    <p className="text-purple-200 text-sm">
                      Stage {room.current_stage}/{room.max_stages}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/room/${room.id}`)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600"
                  >
                    {room.status === 'waiting' ? 'Join Lobby' : 'Resume Game'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Past Rooms */}
        {pastRooms.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Recent Games
            </h2>
            <div className="space-y-3">
              {pastRooms.slice(0, 5).map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{room.room_code}</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-purple-200">
                        {new Date(room.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-purple-200 text-sm">
                      Completed • {room.max_stages} stages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            size="lg"
            onClick={() => router.push('/room/create')}
            className="w-full h-32 text-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            🎮 Create Room
          </Button>

          <Button
            size="lg"
            onClick={() => router.push('/room/join')}
            className="w-full h-32 text-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
          >
            🚪 Join Room
          </Button>
        </div>
      </div>
    </div>
  )
}