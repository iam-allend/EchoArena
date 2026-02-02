'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Users, Heart, Mic, Sparkles, Trophy, Zap, Star } from 'lucide-react'

export default function CreateRoomPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [creating, setCreating] = useState(false)
  const [maxStages, setMaxStages] = useState(10)

  async function handleCreateRoom() {
    if (!user) {
      alert('Silakan login terlebih dahulu')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          maxStages,
          userId: user.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat room')
      }

      router.push(`/room/${data.room.id}`)
    } catch (error: any) {
      console.error('Create room error:', error)
      alert(error.message || 'Gagal membuat room')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
          <p className="text-purple-200 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Animated Background Elements - Reduced blur for mobile performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 md:w-72 h-40 md:h-72 bg-purple-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-52 md:w-96 h-52 md:h-96 bg-pink-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Floating Icons - Hidden on very small screens to reduce clutter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <Trophy className="absolute top-20 left-1/4 w-8 h-8 text-yellow-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className="absolute top-40 right-1/4 w-6 h-6 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Zap className="absolute bottom-40 left-1/3 w-7 h-7 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Sparkles className="absolute bottom-20 right-1/3 w-6 h-6 text-fuchsia-400/30 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button - Full width on tiny screens */}
          <Button
            onClick={() => {
              router.push('/dashboard')
              router.refresh()
            }}
            className="mb-6 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <Card className="border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            <CardHeader className="text-center pb-4 md:pb-6 pt-8 md:pt-10">
              <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-green-500/50 rotate-3 hover:rotate-6 transition-transform">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                Buat Room
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm md:text-base mt-2 px-4">
                Siapkan room permainan baru dan undang temanmu! 🎮
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 md:px-8 pb-8">
              {/* Room Settings */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-gray-300 font-medium text-base md:text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 md:w-5 h-5 text-purple-400" />
                    Jumlah Babak
                  </Label>
                  {/* Grid Buttons - Stays 3 columns but scales text */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {[5, 10, 15].map((num) => (
                      <Button
                        key={num}
                        onClick={() => setMaxStages(num)}
                        className={`h-12 md:h-16 text-sm md:text-lg font-bold transition-all ${
                          maxStages === num
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105 z-10'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                        }`}
                      >
                        {num} <span className="hidden xs:inline ml-1">Babak</span>
                        <span className="xs:hidden ml-0.5">Babak</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-[10px] md:text-sm text-gray-500 flex items-center gap-2">
                    <Zap className="w-3 h-3 md:w-4 md:h-4" />
                    Setiap babak = semua pemain menjawab 1 pertanyaan
                  </p>
                </div>

                {/* Info Room - Responsive Padding & Text */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-xl p-4 md:p-5 backdrop-blur-sm">
                  <h4 className="font-bold text-base md:text-lg text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 md:w-5 h-5 text-blue-400" />
                    Info Room
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                      </div>
                      <span className="truncate">Maksimal pemain: <strong className="text-white">8</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                      </div>
                      <span>Mulai dengan <strong className="text-white">3 nyawa</strong> ❤️</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                      </div>
                      <span className="leading-tight">Sistem giliran: pemain menjawab bergantian</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mic className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                      </div>
                      <span>Obrolan suara aktif otomatis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Button - Responsive Height */}
              <div className="pt-2">
                <Button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="w-full h-14 md:h-16 text-lg md:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-500/50 hover:shadow-2xl hover:shadow-green-500/60 transition-all active:scale-[0.98] border-0"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                      Membuat Room...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                      Buat Room
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] md:text-sm text-gray-500 mt-4 px-2">
                  Kamu akan menjadi host dan bisa memulai permainan saat siap 🎯
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}