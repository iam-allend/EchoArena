'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createGuestAccount, getGuestAccountFromStorage } from '@/lib/auth/guest'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mic, Users, Trophy, Sparkles, Zap, Star, Target } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkExistingAuth()
  }, [])

  async function checkExistingAuth() {
    setCheckingAuth(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/dashboard')
        return
      }

      const guestAccount = getGuestAccountFromStorage()
      
      if (guestAccount) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setCheckingAuth(false)
    }
  }

  async function handlePlayAsGuest() {
    setLoading(true)

    try {
      const existingGuest = getGuestAccountFromStorage()
      
      if (existingGuest) {
        router.push('/dashboard')
        return
      }

      await createGuestAccount()
      router.push('/dashboard')
    } catch (error) {
      console.error('Guest creation failed:', error)
      alert('Failed to create guest account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
          <p className="font-medium text-purple-200">Loading EchoArena...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-20 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Star className="absolute top-32 left-1/4 w-8 h-8 text-purple-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Sparkles className="absolute top-1/3 right-1/4 w-7 h-7 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Zap className="absolute bottom-1/3 left-1/3 w-8 h-8 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Trophy className="absolute bottom-32 right-1/3 w-7 h-7 text-pink-400/30 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center max-w-5xl w-full">
          {/* Logo/Title with Icon */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 rotate-6 hover:rotate-12 transition-transform">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              EchoArena
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-3xl font-bold text-white mb-3">
            Where Voices Echo, Champions Rise
          </p>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Voice-controlled quiz battles • Real-time multiplayer • Learn by competing
          </p>

          {/* Auth Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {/* Play as Guest */}
            <Button
              size="lg"
              onClick={handlePlayAsGuest}
              disabled={loading}
              className="w-full sm:w-auto px-10 py-7 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all hover:scale-105 border-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-6 w-6" />
                  Play as Guest
                </>
              )}
            </Button>

            {/* Register */}
            <Button
              size="lg"
              onClick={() => router.push('/auth/register')}
              className="w-full sm:w-auto px-10 py-7 text-lg bg-white/10 hover:bg-white/20 text-white font-bold border-2 border-purple-400/50 shadow-lg hover:shadow-xl transition-all hover:scale-105 backdrop-blur-sm"
            >
              <Sparkles className="mr-2 h-6 w-6" />
              Create Account
            </Button>

            {/* Login */}
            <Button
              size="lg"
              onClick={() => router.push('/auth/login')}
              className="w-full sm:w-auto px-10 py-7 text-lg bg-transparent hover:bg-white/10 text-white font-bold border-2 border-white/30 shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <Star className="mr-2 h-6 w-6" />
              Login
            </Button>
          </div>

          {/* Guest Info */}
          <div className="inline-flex items-center gap-2 bg-purple-900/50 border-2 border-purple-500/50 px-6 py-3 rounded-full mb-16 shadow-lg backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <p className="text-sm font-medium text-purple-200">
              <strong className="text-purple-100">Guest accounts</strong> expire after 7 days. Create an account to save progress forever!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-purple-500/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Voice Controlled</h3>
              <p className="text-gray-300 leading-relaxed">Answer questions with your voice, not clicks. Natural and engaging gameplay</p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-pink-500/30 shadow-lg hover:shadow-2xl hover:shadow-pink-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Multiplayer Rooms</h3>
              <p className="text-gray-300 leading-relaxed">Battle with 2-8 players in real-time. Make friends while you compete</p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-orange-500/30 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Compete & Learn</h3>
              <p className="text-gray-300 leading-relaxed">Turn-based battles, real knowledge gains. Level up your brain!</p>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Online Players: 1,234</span>
            </div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Active Battles: 89</span>
            </div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="font-medium">Questions: 10K+</span>
            </div>
          </div>
        </div>

        {/* ========== SECTION: CATEGORY CARDS ========== */}
        {/* Carousel card untuk menampilkan berbagai kategori quiz seperti Math, Science, History, dll */}
        <div className="max-w-7xl mx-auto mt-32 px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Explore Quiz Categories
          </h2>
          <p className="text-purple-200 text-center mb-12 text-lg">
            Choose from various subjects and start your learning journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Mathematics */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
              <div className="w-full h-40 bg-yellow-500/10 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-6xl">📊</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">Mathematics</h3>
              <p className="text-gray-300 text-sm mb-4">Algebra, Geometry, Calculus & more</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>120 Quizzes</span>
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            </div>

            {/* Card 2: Science */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
              <div className="w-full h-40 bg-green-500/10 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-6xl">🔬</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Science</h3>
              <p className="text-gray-300 text-sm mb-4">Physics, Chemistry, Biology topics</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>95 Quizzes</span>
                <Sparkles className="w-4 h-4 text-green-400" />
              </div>
            </div>

            {/* Card 3: History */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
              <div className="w-full h-40 bg-blue-500/10 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-6xl">📚</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">History</h3>
              <p className="text-gray-300 text-sm mb-4">World events, civilizations & cultures</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>78 Quizzes</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Card 4: Literature */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer group">
              <div className="w-full h-40 bg-purple-500/10 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-6xl">📖</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Literature</h3>
              <p className="text-gray-300 text-sm mb-4">Reading comprehension & analysis</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>64 Quizzes</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ========== SECTION: KEGUNAAN / BENEFITS ========== */}
        {/* Section untuk menjelaskan kegunaan dan manfaat menggunakan platform */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose EchoArena?
            </h2>
            <p className="text-purple-200 text-lg">
              Discover the benefits that make learning fun and effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefit 1 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Instant Feedback</h3>
              <p className="text-gray-300 leading-relaxed">
                Get immediate results and explanations for every answer. Learn from your mistakes in real-time and improve faster with our AI-powered feedback system.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Gamified Learning</h3>
              <p className="text-gray-300 leading-relaxed">
                Earn points, unlock achievements, and climb the leaderboards. Our gamification system makes studying addictive and rewarding for all ages.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Social Learning</h3>
              <p className="text-gray-300 leading-relaxed">
                Challenge friends, join study groups, and learn together. Voice chat integration makes collaboration natural and engaging for remote learning.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Personalized Experience</h3>
              <p className="text-gray-300 leading-relaxed">
                Adaptive difficulty levels and custom quiz creation. Our AI learns your strengths and weaknesses to provide tailored content that matches your pace.
              </p>
            </div>
          </div>
        </div>

        {/* ========== SECTION: TUJUAN / OUR MISSION ========== */}
        {/* Section untuk menjelaskan tujuan dan visi platform */}
        <div className="max-w-5xl mx-auto mt-32 px-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-3xl p-12 backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-xl">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-xl text-purple-200 max-w-3xl mx-auto">
                To revolutionize education by making learning interactive, accessible, and fun for everyone
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  10K+
                </div>
                <p className="text-gray-300">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <p className="text-gray-300">Quiz Categories</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  1M+
                </div>
                <p className="text-gray-300">Questions Answered</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SECTION: HOW IT WORKS ========== */}
        {/* Section untuk menjelaskan cara kerja platform step by step */}
        <div className="max-w-6xl mx-auto mt-32 px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-purple-200 text-lg">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="mt-4 mb-4">
                  <div className="text-6xl mb-4">🎮</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Create or Join Room</h3>
                <p className="text-gray-300">
                  Start by creating your own quiz room or join an existing one with a room code
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-purple-500/20 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="mt-4 mb-4">
                  <div className="text-6xl mb-4">🎤</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Use Your Voice</h3>
                <p className="text-gray-300">
                  Answer questions using voice commands - natural and hands-free interaction
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 text-center hover:shadow-xl hover:shadow-green-500/20 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="mt-4 mb-4">
                  <div className="text-6xl mb-4">🏆</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Compete & Win</h3>
                <p className="text-gray-300">
                  Battle with others, earn points, and climb the leaderboard to become champion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SECTION: TESTIMONIALS ========== */}
        {/* Section untuk menampilkan testimoni dari pengguna */}
        

      </div>
              
    </main>
  )
}