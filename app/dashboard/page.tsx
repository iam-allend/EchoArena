'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getGuestDaysRemaining } from '@/lib/auth/guest'
import { Loader2, AlertTriangle, Crown } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const { user, isGuest, loading, expiresAt, isAuthenticated } = useAuth()
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }

    if (isGuest && expiresAt) {
      setDaysRemaining(getGuestDaysRemaining(expiresAt))
    }
  }, [loading, isAuthenticated, isGuest, expiresAt])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
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

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {user?.username}! {isGuest && '👤'}
          </h1>
          <p className="text-purple-200">
            {isGuest ? 'Playing as guest' : 'Ready to battle?'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-3xl font-bold text-white">{user?.level || 1}</div>
              <div className="text-purple-200">Level</div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-white">{user?.xp || 0}</div>
              <div className="text-purple-200">Experience</div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-3xl font-bold text-white">{user?.total_games || 0}</div>
              <div className="text-purple-200">Games Played</div>
            </div>
          </Card>
        </div>

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