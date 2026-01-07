'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createGuestAccount } from '@/lib/auth/guest'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePlayAsGuest() {
    setLoading(true)

    try {
      await createGuestAccount()
      router.push('/dashboard')
    } catch (error) {
      console.error('Guest creation failed:', error)
      alert('Failed to create guest account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="text-center max-w-4xl">
        {/* Logo/Title */}
        <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          EchoArena
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-purple-100 mb-2">
          Where Voices Echo, Champions Rise
        </p>
        <p className="text-lg text-purple-300 mb-12">
          Voice-controlled quiz battles • Real-time multiplayer • Learn by competing
        </p>

        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {/* Play as Guest */}
          <Button
            size="lg"
            onClick={handlePlayAsGuest}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Guest Account...
              </>
            ) : (
              <>
                🎮 Play as Guest
              </>
            )}
          </Button>

          {/* Register */}
          <Button
            size="lg"
            onClick={() => router.push('/auth/register')}
            className="w-full sm:w-auto px-8 py-6 text-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            📝 Create Account
          </Button>

          {/* Login */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/auth/login')}
            className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-purple-400 text-purple-100 hover:bg-purple-800/50"
          >
            🔑 Login
          </Button>
        </div>

        {/* Guest Info */}
        <p className="text-sm text-purple-300">
          💡 <strong>Guest accounts</strong> expire after 7 days. Create an account to save your progress forever!
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-purple-800/30 backdrop-blur-sm p-6 rounded-lg border border-purple-500/30">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="text-xl font-bold text-white mb-2">Voice Controlled</h3>
            <p className="text-purple-200">Answer questions with your voice, not clicks</p>
          </div>

          <div className="bg-purple-800/30 backdrop-blur-sm p-6 rounded-lg border border-purple-500/30">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Multiplayer Rooms</h3>
            <p className="text-purple-200">Battle with 2-8 players in real-time</p>
          </div>

          <div className="bg-purple-800/30 backdrop-blur-sm p-6 rounded-lg border border-purple-500/30">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Compete & Learn</h3>
            <p className="text-purple-200">Turn-based battles, real knowledge gains</p>
          </div>
        </div>
      </div>
    </main>
  )
}