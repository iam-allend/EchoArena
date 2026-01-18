'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getGuestDaysRemaining } from '@/lib/auth/guest'
import { Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle, Sparkles, Trophy, Star, Zap, Users, Target } from 'lucide-react'

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
    }
  }, [loading, isAuthenticated, user, router])

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

      const activeRooms = rooms.filter(r => 
        (r.status === 'waiting' || r.status === 'playing') && 
        r.participant_status === 'active'
      )
      
      setActiveRooms(activeRooms)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
          <p className="text-purple-200 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Trophy className="absolute top-20 left-1/4 w-8 h-8 text-yellow-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className="absolute top-40 right-1/4 w-6 h-6 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Zap className="absolute bottom-40 left-1/3 w-7 h-7 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Sparkles className="absolute bottom-20 right-1/3 w-6 h-6 text-fuchsia-400/30 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative p-8">
        <div className="max-w-6xl mx-auto">
          {/* Guest Warning */}
          {isGuest && daysRemaining !== null && (
            <Alert className="mb-6 bg-amber-500/10 border-2 border-amber-500/50 backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-200 font-medium">
                  <strong>Guest Account:</strong> Your account expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                  Create an account to save your progress!
                </span>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/upgrade')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header with Logout */}
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 mb-6 flex justify-between items-center border border-purple-500/20 shadow-xl">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                Welcome, {user.username}! 
                {isGuest && <span className="text-2xl">👤</span>}
              </h1>
              <p className="text-purple-200 text-lg">
                {isGuest ? 'Playing as guest • Ready to explore?' : 'Ready to dominate the arena?'}
              </p>
            </div>
            
            <Button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 p-6 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all hover:scale-105 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{user.level || 1}</div>
                <div className="text-purple-200 font-medium">Level</div>
              </div>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-xl border border-pink-500/30 p-6 shadow-lg hover:shadow-xl hover:shadow-pink-500/20 transition-all hover:scale-105 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{user.xp || 0}</div>
                <div className="text-purple-200 font-medium">Experience</div>
              </div>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/30 p-6 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:scale-105 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-white mb-1">{user.total_games || 0}</div>
                <div className="text-purple-200 font-medium">Games Played</div>
              </div>
            </Card>
          </div>

          {/* Active Rooms */}
          {activeRooms.length > 0 && (
            <Card className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 p-6 mb-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Play className="h-6 w-6 text-green-400" />
                Active Rooms
              </h2>
              <div className="space-y-3">
                {activeRooms.map(room => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-lg">{room.room_code}</span>
                        {room.is_host && <Crown className="h-4 w-4 text-yellow-400" />}
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          room.status === 'waiting' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                            : 'bg-green-500/20 text-green-300 border border-green-500/50'
                        }`}>
                          {room.status === 'waiting' ? 'Waiting' : 'Playing'}
                        </span>
                      </div>
                      <p className="text-purple-200 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Stage {room.current_stage}/{room.max_stages}
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
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
            <Card className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 p-6 mb-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-purple-400" />
                Recent Games
              </h2>
              <div className="space-y-3">
                {pastRooms.slice(0, 5).map(room => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{room.room_code}</span>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-purple-300">
                          {new Date(room.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-purple-200 text-sm flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
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
              className="w-full h-32 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105 border-0"
            >
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <span>Create Room</span>
              </div>
            </Button>

            <Button
              size="lg"
              onClick={() => router.push('/room/join')}
              className="w-full h-32 text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 border-0"
            >
              <div className="flex items-center gap-3">
                <Play className="h-8 w-8" />
                <span>Join Room</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}