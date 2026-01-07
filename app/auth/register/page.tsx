'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

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

    // Validation
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
      // 1. Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle() // Changed from .single() to avoid error if not found

      if (existingUser) {
        setError('Username already taken')
        setLoading(false)
        return
      }

      // 2. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      console.log('Auth user created:', authData.user.id)

      // 3. Create user record in database
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

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw dbError
      }

      console.log('Database user created:', newUser)

      // 4. Set auth mode
      localStorage.setItem('auth_mode', 'registered')

      // 5. Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 500))

      // 6. Check if session is created
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session after signup:', session ? 'exists' : 'null')

      if (!session) {
        // Email confirmation required
        alert('Please check your email to confirm your account, then login.')
        router.push('/auth/login')
        return
      }

      // 7. Redirect to dashboard
      console.log('Redirecting to dashboard...')
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join EchoArena and start battling!</CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="warrior123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">3-20 characters, will be visible to other players</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-600 hover:underline font-semibold">
                Login
              </Link>
            </p>

            <p className="text-sm text-center text-gray-600">
              Or{' '}
              <Link href="/" className="text-purple-600 hover:underline font-semibold">
                play as guest
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}