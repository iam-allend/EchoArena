'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Zap, Trophy, Star, Sparkles, User, Mail, Lock, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle()

      if (existingUser) {
        setError('Username already taken')
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email,
          is_guest: false,
          level: 1,
          xp: 0,
          coins: 100,
          total_wins: 0,
          total_games: 0,
        })
        .select()
        .single()

      if (dbError) throw dbError

      localStorage.setItem('auth_mode', 'registered')
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Please check your email to confirm your account, then login.')
        router.push('/auth/login')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Trophy className="absolute top-20 left-1/4 w-8 h-8 text-yellow-400/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Star className="absolute top-40 right-1/4 w-6 h-6 text-pink-400/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }} />
        <Zap className="absolute bottom-40 left-1/3 w-7 h-7 text-purple-400/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }} />
        <Sparkles className="absolute bottom-20 right-1/3 w-6 h-6 text-blue-400/30 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-purple-500/20">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-purple-500/50 rotate-3 hover:rotate-6 transition-transform">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Join the Arena
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Create your account and compete with players worldwide! 🎮
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">!</span>
                  </div>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="WarriorKing123"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={20}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-12 pl-4 pr-10"
                  />
                  {formData.username.length >= 3 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  3-20 characters, visible to other players
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="champion@echoarena.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-12 pl-4 pr-10"
                  />
                  {formData.email.includes('@') && formData.email.includes('.') && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                />
                <div className="flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${
                    formData.password.length === 0 ? 'bg-gray-700' :
                    formData.password.length < 6 ? 'bg-red-500' :
                    formData.password.length < 8 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <p className="text-xs text-gray-500">Min. 8 characters</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-12 pl-4 pr-10"
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Start Your Journey
                  </>
                )}
              </Button>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

              <p className="text-sm text-center text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text hover:from-purple-300 hover:to-pink-300 font-semibold transition-all">
                  Login here
                </Link>
              </p>

              <Link 
                href="/" 
                className="text-sm text-center text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 group"
              >
                <Sparkles className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                Play as guest instead
              </Link>

              <div className="pt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-500/50" />
                  <span>Free to play</span>
                </div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-500/50" />
                  <span>Earn rewards</span>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}