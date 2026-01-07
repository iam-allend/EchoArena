'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import {
  getGuestAccountFromStorage,
  updateGuestActivity,
  isGuestExpired,
} from '@/lib/auth/guest'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Check auth status
    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUser(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsGuest(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkAuth() {
    setLoading(true)

    try {
      // Check for registered user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Registered user
        await loadUser(session.user.id)
        setIsGuest(false)
        localStorage.setItem('auth_mode', 'registered')
      } else {
        // Check for guest account
        const guestAccount = getGuestAccountFromStorage()

        if (guestAccount && !isGuestExpired(guestAccount.expiresAt)) {
          // Valid guest account
          await loadGuestUser(guestAccount.id)
          setIsGuest(true)
          setExpiresAt(guestAccount.expiresAt)

          // Update activity
          updateGuestActivity(guestAccount.id)
        } else {
          // No auth
          setUser(null)
          setIsGuest(false)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadUser(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setUser(data)
    }
  }

  async function loadGuestUser(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_guest', true)
      .single()

    if (data) {
      setUser(data)
    }
  }

  return {
    user,
    isGuest,
    loading,
    expiresAt,
    isAuthenticated: !!user,
    refreshAuth: checkAuth,
  }
}