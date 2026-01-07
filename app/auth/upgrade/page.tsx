'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { upgradeGuestToRegistered } from '@/lib/auth/upgrade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Crown, Check } from 'lucide-react'

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
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
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
      setError(err.message || 'Upgrade failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <CardTitle className="text-3xl">Upgrade to Full Account</CardTitle>
          </div>
          <CardDescription>
            Keep your progress forever and unlock premium features!
          </CardDescription>
        </CardHeader>

        <div className="px-6 py-4 bg-purple-50 border-y">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Benefits of Full Account:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Never lose your progress</strong> - Save all stats, levels, and achievements</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Friend system</strong> - Add friends and challenge them directly</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Custom rooms</strong> - Create private rooms with passwords</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Leaderboard fame</strong> - Appear on global leaderboards</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleUpgrade}>
          <CardContent className="space-y-4 pt-6">
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
              <p className="text-sm text-gray-500">You can keep your guest username or change it</p>
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
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Upgrading Account...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Upgrade Now (FREE!)
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Maybe Later
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}