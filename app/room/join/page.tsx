'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, DoorOpen, Users, Sparkles, Trophy, Zap, Star, Hash } from 'lucide-react'

export default function JoinRoomPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Please login first')
      return
    }

    setJoining(true)

    try {
      const response = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomCode: roomCode.toUpperCase(),
          userId: user.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      router.push(`/room/${data.room.id}`)
    } catch (error: any) {
      console.error('Join room error:', error)
      setError(error.message || 'Failed to join room')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
          <p className="text-purple-200 font-medium">Loading...</p>
        </div>
      </div>
    )
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
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard')}
            className="mb-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-purple-500/20">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/50 rotate-3 hover:rotate-6 transition-transform">
                <DoorOpen className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Join Room
              </CardTitle>
              <CardDescription className="text-gray-400 text-base mt-2">
                Enter the 6-character room code to join a game 🚪
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">!</span>
                    </div>
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="roomCode" className="text-gray-300 font-medium text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-400" />
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-3xl text-center font-bold tracking-[0.5em] bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20 h-20"
                    required
                  />
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Get the code from your friend who created the room</span>
                  </div>

                  {/* Code Length Indicator */}
                  <div className="flex justify-center gap-2 mt-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${
                          i < roomCode.length
                            ? 'bg-blue-500 scale-110'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-xl p-5 backdrop-blur-sm">
                  <h4 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Quick Tips
                  </h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                      <span>Room codes are <strong className="text-white">6 characters</strong> (letters & numbers)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5"></div>
                      <span>Ask the host to share the code from the lobby</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                      <span>You can join while the game is in <strong className="text-white">waiting</strong> status</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={joining || roomCode.length !== 6 || !user}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/60 transition-all hover:scale-[1.02] border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Joining Room...
                    </>
                  ) : (
                    <>
                      <DoorOpen className="mr-2 h-6 w-6" />
                      Join Room
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Make sure your mic is ready for voice battles! 🎤
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}