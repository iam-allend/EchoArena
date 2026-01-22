'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { upgradeGuestToRegistered } from '@/lib/auth/upgrade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Crown, Check, Star, Trophy, Users, Lock, Sparkles, Zap, Target } from 'lucide-react'

export default function UpgradePage() {
  const router = useRouter()
  const { user, isGuest, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isGuest) {
        router.push('/dashboard')
      } else if (user) {
        // Pre-fill username
        setFormData(prev => ({ ...prev, username: user.username }))
      }
    }
  }, [authLoading, isGuest, user])

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok')
      return
    }

    if (formData.password.length < 8) {
      setError('Kata sandi minimal harus 8 karakter')
      return
    }

    setLoading(true)

    try {
      const result = await upgradeGuestToRegistered(
        user!.id,
        formData.email,
        formData.password,
        formData.username
      )

      if (!result.success) {
        throw result.error
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'Upgrade gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Crown className="absolute top-20 left-1/4 w-8 h-8 text-yellow-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className="absolute top-40 right-1/4 w-6 h-6 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Trophy className="absolute bottom-40 left-1/3 w-7 h-7 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Sparkles className="absolute bottom-20 right-1/3 w-6 h-6 text-fuchsia-400/30 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative flex items-center justify-center p-4 md:p-8 min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl mb-6 shadow-2xl shadow-yellow-500/50 animate-pulse">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              Upgrade ke Premium
            </h1>
            <p className="text-xl text-purple-200">
              Ubah akun tamu kamu jadi keanggotaan seumur hidup — 100% GRATIS! 🎉
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Benefit 1 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Simpan Progres</h3>
                  <p className="text-purple-200 text-sm">Simpan semua statistik, level, XP, dan pencapaian selamanya</p>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Sistem Teman</h3>
                  <p className="text-purple-200 text-sm">Tambah teman dan tantang mereka dalam duel kuis seru</p>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Room Pribadi</h3>
                  <p className="text-purple-200 text-sm">Buat room khusus dengan kata sandi untuk pertandingan eksklusif</p>
                </div>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Papan Peringkat</h3>
                  <p className="text-purple-200 text-sm">Bersaing secara global dan naik ke puncak peringkat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="bg-gray-900/80 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Selesaikan Upgrade Kamu
              </CardTitle>
              <CardDescription className="text-purple-200 text-base">
                Isi detail di bawah ini untuk membuka semua fitur premium
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpgrade}>
              <CardContent className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm flex items-center gap-2">
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white font-semibold">Username</Label>
                  <Input
                    id="username"
                    placeholder="pejuang123"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={20}
                    className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                  />
                  <p className="text-sm text-purple-300">Pertahankan username saat ini atau pilih yang baru</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-semibold">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="kamu@contoh.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-semibold">Kata Sandi</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                    <p className="text-xs text-purple-300">Minimal 8 karakter</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-semibold">Konfirmasi Kata Sandi</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-500 h-12"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/60 transition-all hover:scale-105 border-0"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Sedang Mengupgrade Akun...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-6 w-6" />
                      Upgrade Sekarang - 100% GRATIS Selamanya!
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border-2 border-white/20 backdrop-blur-sm transition-all hover:scale-105"
                >
                  Nanti Saja
                </Button>

                <p className="text-center text-sm text-purple-300">
                  🔒 Datamu aman dan terenkripsi. Tidak perlu kartu kredit.
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-purple-300">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>100% Gratis</span>
            </div>
            <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Tanpa Kartu Kredit</span>
            </div>
            <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Akses Instan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}