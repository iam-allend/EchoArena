'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createGuestAccount, getGuestAccountFromStorage } from '@/lib/auth/guest'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
  Mic,
  Users,
  Trophy,
  Sparkles,
  Zap,
  Star,
  Target,
  Code,
  GraduationCap,
  Instagram,
  Github,
  Lightbulb,
  CheckCircle,
  XCircle,
  BookOpen,
  Pencil
} from 'lucide-react'

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
      alert('Gagal membuat akun tamu. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-purple-400" />
          <p className="font-medium text-purple-200 text-sm sm:text-base">Memuat EchoArena...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Background Quiz Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-indigo-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Quiz icons floating */}
        <div className="absolute top-[10%] left-[5%] sm:top-[12%] sm:left-[8%] text-5xl sm:text-7xl lg:text-8xl text-yellow-300/15 animate-float-slow">?</div>
        <div className="absolute top-[25%] right-[8%] sm:top-[20%] sm:right-[12%] text-6xl sm:text-8xl lg:text-9xl text-pink-300/15 animate-float-medium rotate-12">?</div>
        <div className="absolute bottom-[15%] left-[12%] sm:bottom-[22%] sm:left-[18%] text-5xl sm:text-7xl text-purple-300/18 animate-float-fast">?</div>

        <div className="absolute top-[35%] left-[6%] sm:top-[42%] sm:left-[10%] flex gap-2 sm:gap-3 opacity-25 animate-float-medium">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500/15 rounded-full flex items-center justify-center text-green-300/70 font-bold text-base sm:text-lg border border-green-400/20">A</div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-500/15 rounded-full flex items-center justify-center text-red-300/70 font-bold text-base sm:text-lg border border-red-400/20">B</div>
        </div>

        <div className="absolute bottom-[28%] right-[7%] sm:bottom-[35%] sm:right-[12%] flex gap-2 sm:gap-3 opacity-20 animate-float-slow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-blue-500/15 rounded-full flex items-center justify-center text-blue-300/70 font-bold text-base sm:text-lg border border-blue-400/20">C</div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-yellow-500/15 rounded-full flex items-center justify-center text-yellow-300/70 font-bold text-base sm:text-lg border border-yellow-400/20">D</div>
        </div>

        <Lightbulb className="absolute top-[48%] left-[10%] sm:top-[55%] sm:left-[15%] w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-400/20 animate-float-medium" />
        <CheckCircle className="absolute bottom-[20%] right-[15%] sm:bottom-[25%] sm:right-[22%] w-8 h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-green-400/18 animate-float-fast" />
        <XCircle className="absolute top-[58%] right-[18%] sm:top-[65%] sm:right-[25%] w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 text-red-400/18 animate-float-slow" />
        <BookOpen className="absolute bottom-[38%] left-[8%] sm:bottom-[45%] sm:left-[12%] w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-400/20 animate-float-medium rotate-6" />
        <Pencil className="absolute top-[32%] left-[20%] sm:top-[38%] sm:left-[28%] w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-orange-400/22 animate-float-fast" />
      </div>

      {/* Hero Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-5xl w-full space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Logo & Title */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 rotate-6 hover:rotate-12 transition-transform">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              EchoArena
            </h1>
          </div>

          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Where Voices Echo, Champions Rise
          </p>

          <p className="text-lg sm:text-xl lg:text-2xl text-purple-100 max-w-3xl mx-auto">
            Voice-controlled quiz battles • Real-time multiplayer • Belajar sambil bertanding
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-6 sm:pt-10">
            <Button
              size="lg"
              onClick={handlePlayAsGuest}
              disabled={loading}
              className="w-full sm:w-auto min-w-[220px] py-6 sm:py-7 text-base sm:text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 sm:mr-3 sm:h-6 sm:w-6 animate-spin" />
                  Membuat akun...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5 sm:mr-3 sm:h-6 sm:w-6" />
                  Main sebagai Tamu
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/auth/register')}
              className="w-full sm:w-auto min-w-[220px] py-6 sm:py-7 text-base sm:text-lg border-purple-400/60 hover:bg-purple-500/10 text-white font-bold transition-all hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5 sm:mr-3 sm:h-6 sm:w-6" />
              Buat Akun
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push('/auth/login')}
              className="w-full sm:w-auto min-w-[220px] py-6 sm:py-7 text-base sm:text-lg text-white hover:bg-white/5 border border-white/20 transition-all hover:scale-105"
            >
              <Star className="mr-2 h-5 w-5 sm:mr-3 sm:h-6 sm:w-6" />
              Masuk
            </Button>
          </div>

          {/* Guest Warning */}
          <div className="inline-flex items-center gap-2 bg-purple-900/50 border-2 border-purple-500/50 px-5 sm:px-6 py-3 sm:py-4 rounded-full mt-6 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <p className="text-sm sm:text-base font-medium text-purple-200">
              <strong className="text-purple-100">Guest accounts</strong> expire after 7 days. Create an account to save progress forever!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-16 sm:mt-24">
            <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border-2 border-purple-500/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Voice Controlled</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">Answer questions with your voice, not clicks. Natural and engaging gameplay</p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border-2 border-pink-500/30 shadow-lg hover:shadow-2xl hover:shadow-pink-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Multiplayer Rooms</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">Battle with 2-8 players in real-time. Make friends while you compete</p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border-2 border-orange-500/30 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:rotate-6 transition-transform">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Compete & Learn</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">Turn-based battles, real knowledge gains. Level up your brain!</p>
            </div>
          </div>

          {/* Quiz Categories */}
          <div className="max-w-7xl mx-auto mt-16 sm:mt-24 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-4">
              Explore Quiz Categories
            </h2>
            <p className="text-purple-200 text-center mb-10 sm:mb-12 text-lg sm:text-xl">
              Choose from various subjects and start your learning journey
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { emoji: '📊', title: 'Mathematics', desc: 'Algebra, Geometry, Calculus & more', count: '120 Quizzes', color: 'yellow' },
                { emoji: '🔬', title: 'Science', desc: 'Physics, Chemistry, Biology topics', count: '95 Quizzes', color: 'green' },
                { emoji: '📚', title: 'History', desc: 'World events, civilizations & cultures', count: '78 Quizzes', color: 'blue' },
                { emoji: '📖', title: 'Literature', desc: 'Reading comprehension & analysis', count: '64 Quizzes', color: 'purple' }
              ].map((cat, i) => (
                <div
                  key={i}
                  className={`group bg-gradient-to-br from-${cat.color}-500/20 to-${cat.color}-600/10 border-2 border-${cat.color}-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="w-full h-36 sm:h-40 bg-black/20 rounded-xl mb-4 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl">{cat.emoji}</span>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-${cat.color}-400 transition-colors`}>{cat.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{cat.desc}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{cat.count}</span>
                    <Sparkles className={`w-4 h-4 text-${cat.color}-400`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose */}
          <div className="max-w-6xl mx-auto mt-16 sm:mt-24 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-6">
              Why Choose EchoArena?
            </h2>
            <p className="text-purple-200 text-center mb-10 sm:mb-12 text-lg">
              Discover the benefits that make learning fun and effective
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {[
                { icon: Zap, title: "Instant Feedback", desc: "Immediate results and explanations for every answer.", color: "blue" },
                { icon: Trophy, title: "Gamified Learning", desc: "Points, achievements, leaderboards.", color: "green" },
                { icon: Users, title: "Social Learning", desc: "Challenge friends, groups, voice chat.", color: "purple" },
                { icon: Star, title: "Personalized", desc: "Adaptive difficulty & custom quizzes.", color: "orange" }
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Development Team */}
          <div className="max-w-6xl mx-auto mt-16 sm:mt-24 px-4 pb-16">
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-xl">
                <Code className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Development Team
              </h2>
              <p className="text-purple-200 text-lg sm:text-xl">
                Dibuat dengan semangat oleh mahasiswa D3 Teknik Informatika Universitas Dian Nuswantoro
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  initials: "AM",
                  name: "Anur Mustakin",
                  nim: "A22.2023.03012",
                  role: "Full Stack Developer",
                  color: "blue",
                  github: "https://github.com/anurmustakin",        // GANTI DENGAN LINK ASLI
                  instagram: "https://instagram.com/anurmustakin"   // GANTI DENGAN LINK ASLI
                },
                {
                  initials: "ZD",
                  name: "Zikry Dwi Maulana",
                  nim: "A22.2023.03014",
                  role: "Frontend Developer",
                  color: "purple",
                  github: "https://github.com/zikrydwim",           // GANTI DENGAN LINK ASLI
                  instagram: "https://instagram.com/zikrydwim"      // GANTI DENGAN LINK ASLI
                },
                {
                  initials: "MN",
                  name: "Muhammad Najwa Syarif",
                  nim: "A22.2023.03026",
                  role: "Backend Developer",
                  color: "green",
                  github: "https://github.com/najwasyrf",           // GANTI DENGAN LINK ASLI
                  instagram: "https://instagram.com/najwasyrf"      // GANTI DENGAN LINK ASLI
                }
              ].map((dev, i) => (
                <div
                  key={i}
                  className="group bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 sm:p-8 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-${dev.color}-500 to-${dev.color}-600 rounded-full flex items-center justify-center text-white font-black text-3xl sm:text-4xl mx-auto mb-5 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      {dev.initials}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{dev.name}</h3>

                    <div className="space-y-1.5 mb-5">
                      <p className="text-purple-300 text-sm sm:text-base font-medium flex items-center justify-center gap-2">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                        {dev.nim}
                      </p>
                      <p className="text-gray-400 text-sm sm:text-base">D3 Teknik Informatika</p>
                      <p className="text-gray-400 text-xs sm:text-sm">Universitas Dian Nuswantoro</p>
                    </div>

                    <div className="inline-block px-4 py-2 bg-gray-800/80 border border-purple-500/40 rounded-full mb-5">
                      <span className={`text-${dev.color}-300 font-medium text-sm sm:text-base`}>{dev.role}</span>
                    </div>

                    <div className="flex justify-center gap-5 sm:gap-6">
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        aria-label={`GitHub ${dev.name}`}
                      >
                        <Github className="w-6 h-6 sm:w-7 sm:h-7" />
                      </a>

                      <a
                        href={dev.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-400 transition-colors"
                        aria-label={`Instagram ${dev.name}`}
                      >
                        <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA follow proyek */}
            <div className="text-center mt-10 sm:mt-14 text-purple-300">
              <p className="text-base sm:text-lg mb-4">
                Ikuti perkembangan proyek ini di GitHub dan Instagram!
              </p>
              <div className="flex justify-center gap-6 sm:gap-8">
                <a
                  href="https://github.com/[username-proyek]" // GANTI DENGAN REPO PROYEK
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <Github className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">GitHub</span>
                </a>
                <a
                  href="https://instagram.com/echoarena.id" // GANTI DENGAN AKUN RESMI
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">@echoarena.id</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}