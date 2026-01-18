'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getGuestDaysRemaining } from '@/lib/auth/guest'
import { Loader2, AlertTriangle, Crown, LogOut, Play, Clock, CheckCircle, Sparkles, Trophy, Star, Zap, Users, Target, BookOpen, Plus, ArrowRight, Flame, TrendingUp, Calendar } from 'lucide-react'

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
          {/* Guest Warning - Modern Design */}
          {isGuest && daysRemaining !== null && (
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 blur-2xl"></div>
              <Alert className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/50 backdrop-blur-xl rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <AlertDescription className="text-amber-100">
                      <div className="font-bold text-lg mb-1 text-white">Guest Account</div>
                      <div className="text-amber-200">
                        Your account expires in <span className="font-bold text-white">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>. Create an account to save your progress!
                      </div>
                    </AlertDescription>
                  </div>
                  <Button
                    onClick={() => router.push('/auth/upgrade')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-xl font-bold px-6 py-6 rounded-xl hover:scale-105 transition-all whitespace-nowrap"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* Header - Modern Design */}
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-2xl"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-5xl font-black mb-3 flex items-center gap-4">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Welcome, {user.username}!
                    </span>
                    {isGuest && (
                      <span className="text-4xl">👤</span>
                    )}
                  </h1>
                  <p className="text-purple-200 text-xl font-medium">
                    {isGuest ? '✨ Playing as guest • Ready to explore?' : '🎮 Ready to dominate the arena?'}
                  </p>
                </div>
                
                <Button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm font-bold px-6 py-6 rounded-xl hover:scale-105 transition-all shadow-xl"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Enhanced Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Level Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/30 transition-all hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-6xl font-black bg-gradient-to-br from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    {user.level || 1}
                  </div>
                  <div className="text-yellow-200 font-bold text-lg tracking-wide">Level</div>
                  <div className="mt-3 pt-3 border-t border-yellow-500/20">
                    <div className="flex items-center justify-center gap-2 text-yellow-300/60 text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Beginner</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Experience Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-pink-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-pink-500/30 transition-all hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-6xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    {user.xp || 0}
                  </div>
                  <div className="text-purple-200 font-bold text-lg tracking-wide">Experience</div>
                  <div className="mt-3 pt-3 border-t border-purple-500/20">
                    <div className="flex items-center justify-center gap-2 text-purple-300/60 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>Start Your Journey</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Games Played Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-6xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    {user.total_games || 0}
                  </div>
                  <div className="text-blue-200 font-bold text-lg tracking-wide">Games Played</div>
                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                    <div className="flex items-center justify-center gap-2 text-blue-300/60 text-sm">
                      <Flame className="w-4 h-4" />
                      <span>Ready to Play</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions - REDESIGNED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Create Room Card */}
            <div 
              onClick={() => router.push('/room/create')}
              className="group relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/50 rounded-3xl p-8 backdrop-blur-xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-green-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-green-400/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-green-500/50 group-hover:rotate-6 group-hover:scale-110 transition-all">
                  <Plus className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-3xl font-black text-white mb-3 flex items-center gap-2">
                  Create Room
                  <ArrowRight className="w-6 h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                
                <p className="text-green-100 text-lg mb-4 leading-relaxed">
                  Start a new quiz battle and invite your friends to compete
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-medium backdrop-blur-sm">
                    <Users className="w-3 h-3 inline mr-1" />
                    Host Game
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-medium backdrop-blur-sm">
                    <Crown className="w-3 h-3 inline mr-1" />
                    Be the Leader
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-green-300 font-bold">
                  <span>Get Started</span>
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/40 transition-all">
                    <Play className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Join Room Card */}
            <div 
              onClick={() => router.push('/room/join')}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-3xl p-8 backdrop-blur-xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-6 right-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50 group-hover:rotate-6 group-hover:scale-110 transition-all">
                  <Play className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-3xl font-black text-white mb-3 flex items-center gap-2">
                  Join Room
                  <ArrowRight className="w-6 h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                
                <p className="text-blue-100 text-lg mb-4 leading-relaxed">
                  Enter a room code and jump into an existing quiz battle
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Quick Join
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
                    <Trophy className="w-3 h-3 inline mr-1" />
                    Compete Now
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <span>Join Battle</span>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/40 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Categories Section */}
          <Card className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 p-6 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-purple-400" />
              Quiz Categories
            </h2>
            <p className="text-purple-200 mb-6">Choose a category and start your learning journey</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mathematics */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 rounded-xl p-5 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
                <div className="w-full h-32 bg-yellow-500/10 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-5xl">📊</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">Mathematics</h3>
                <p className="text-gray-300 text-xs mb-3">Algebra, Geometry, Calculus</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>120 Quizzes</span>
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
              </div>

              {/* Science */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-xl p-5 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
                <div className="w-full h-32 bg-green-500/10 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-5xl">🔬</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Science</h3>
                <p className="text-gray-300 text-xs mb-3">Physics, Chemistry, Biology</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>95 Quizzes</span>
                  <Sparkles className="w-4 h-4 text-green-400" />
                </div>
              </div>

              {/* History */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 rounded-xl p-5 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
                <div className="w-full h-32 bg-blue-500/10 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-5xl">📚</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">History</h3>
                <p className="text-gray-300 text-xs mb-3">World events & civilizations</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>78 Quizzes</span>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              {/* Literature */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-xl p-5 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
                <div className="w-full h-32 bg-purple-500/10 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-5xl">📖</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Literature</h3>
                <p className="text-gray-300 text-xs mb-3">Reading & comprehension</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>64 Quizzes</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
          </Card>

          {/* Active Rooms - Modern Design */}
          {activeRooms.length > 0 && (
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-3xl"></div>
              
              <div className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-green-500/30 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/50">
                      <Play className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white flex items-center gap-2">
                        Active Rooms
                        <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-bold">
                          {activeRooms.length}
                        </span>
                      </h2>
                      <p className="text-green-200 text-sm mt-1">Your ongoing quiz battles</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-green-300 animate-pulse">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">LIVE</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  {activeRooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="group relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-800/30 border-2 border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-2xl font-black text-green-300">#{index + 1}</span>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl font-black text-white tracking-wider">{room.room_code}</span>
                              {room.is_host && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                                  <Crown className="h-3 w-3 text-yellow-400" />
                                  <span className="text-yellow-300 text-xs font-bold">HOST</span>
                                </div>
                              )}
                              <div className={`px-3 py-1 rounded-full font-bold text-xs ${
                                room.status === 'waiting' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                                  : 'bg-green-500/20 text-green-300 border border-green-500/50 animate-pulse'
                              }`}>
                                {room.status === 'waiting' ? '⏳ Waiting' : '🎮 In Progress'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 text-purple-300">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-medium">Stage {room.current_stage}/{room.max_stages}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => router.push(`/room/${room.id}`)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-6 rounded-xl shadow-xl shadow-green-500/30 border-0 group-hover:scale-110 transition-all"
                        >
                          {room.status === 'waiting' ? (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Join Lobby
                            </>
                          ) : (
                            <>
                              <Flame className="w-5 h-5 mr-2" />
                              Resume Battle
                            </>
                          )}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400 font-medium">Progress</span>
                          <span className="text-xs text-green-400 font-bold">{Math.round((room.current_stage / room.max_stages) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(room.current_stage / room.max_stages) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Past Rooms - Modern Design */}
          {pastRooms.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-3xl"></div>
              
              <div className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/50">
                      <Clock className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">Recent Games</h2>
                      <p className="text-purple-200 text-sm mt-1">Your quiz battle history</p>
                    </div>
                  </div>
                  
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm font-bold">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {pastRooms.slice(0, 5).map((room, index) => (
                    <div
                      key={room.id}
                      className="group relative overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-800/30 border-2 border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-600/30 to-gray-700/30 border-2 border-gray-500/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-2xl font-black text-gray-400">#{index + 1}</span>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-black text-white tracking-wider">{room.room_code}</span>
                              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                                <CheckCircle className="h-3 w-3 text-green-400" />
                                <span className="text-green-300 text-xs font-bold">COMPLETED</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">{new Date(room.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-purple-300">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-medium">{room.max_stages} Stages</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}