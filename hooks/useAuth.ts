'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import {
  getGuestAccountFromStorage,
  updateGuestActivity,
  isGuestExpired,
  clearGuestAccount,
} from '@/lib/auth/guest'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  const supabase = createClient()

  const checkAuth = useCallback(async () => {
    setLoading(true)

    try {
      // Priority 1: Check for registered user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Has valid Supabase Auth session → Registered user
        await loadRegisteredUser(session.user.id)
        setIsGuest(false)
        localStorage.setItem('auth_mode', 'registered')
        return // Exit early
      }

      // Priority 2: Check for guest account in localStorage
      const guestAccount = getGuestAccountFromStorage()

      if (guestAccount) {
        // Check if guest is expired
        if (isGuestExpired(guestAccount.expiresAt)) {
          console.log('Guest account expired, clearing...')
          clearGuestAccount()
          setUser(null)
          setIsGuest(false)
          return // Exit early
        }

        // Valid guest account → Load from database
        const guestUser = await loadGuestUser(guestAccount.id)

        if (guestUser) {
          setUser(guestUser)
          setIsGuest(true)
          setExpiresAt(guestAccount.expiresAt)
          localStorage.setItem('auth_mode', 'guest')

          // Update last active timestamp
          updateGuestActivity(guestAccount.id)
        } else {
          // Guest not found in DB (maybe deleted)
          console.log('Guest not found in database, clearing localStorage')
          clearGuestAccount()
          setUser(null)
          setIsGuest(false)
        }
      } else {
        // No auth at all
        setUser(null)
        setIsGuest(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      setIsGuest(false)
    } finally {
      // ALWAYS set loading to false, even on error
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // Initial auth check
    checkAuth()

    // Subscribe to Supabase auth changes (for registered users)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session) {
        await loadRegisteredUser(session.user.id)
        setIsGuest(false)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsGuest(false)
        setExpiresAt(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth, supabase])

  async function loadRegisteredUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_guest', false)
        .single()

      if (error) throw error

      if (data) {
        setUser(data)
        return data
      }

      return null
    } catch (error) {
      console.error('Error loading registered user:', error)
      return null
    }
  }

  async function loadGuestUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_guest', true)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error loading guest user:', error)
      return null
    }
  }

  async function logout() {
    if (isGuest) {
      // Guest logout: just clear localStorage
      clearGuestAccount()
      setUser(null)
      setIsGuest(false)
      setExpiresAt(null)
    } else {
      // Registered user logout: Supabase signout
      await supabase.auth.signOut()
      localStorage.removeItem('auth_mode')
      setUser(null)
      setIsGuest(false)
    }
  }

  return {
    user,
    isGuest,
    loading,
    expiresAt,
    isAuthenticated: !!user,
    refreshAuth: checkAuth,
    logout,
  }
}