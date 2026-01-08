'use client'

import { useEffect, useState } from 'react'
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

  // ✅ FIX 1: Create supabase client ONCE, not in callback dependency
  const supabase = createClient()

  // ✅ FIX 2: Remove useCallback - not needed, causes re-render issues
  async function checkAuth() {
    console.log('🔍 checkAuth called')
    
    try {
      // Priority 1: Check for registered user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('📋 Session check:', session ? 'found' : 'not found')

      if (session) {
        console.log('✅ Loading registered user...')
        await loadRegisteredUser(session.user.id)
        setIsGuest(false)
        localStorage.setItem('auth_mode', 'registered')
        setLoading(false) // ✅ Set loading false here
        return
      }

      // Priority 2: Check for guest account
      const guestAccount = getGuestAccountFromStorage()

      console.log('📋 Guest account check:', guestAccount ? 'found' : 'not found')

      if (guestAccount) {
        if (isGuestExpired(guestAccount.expiresAt)) {
          console.log('⏰ Guest expired, clearing...')
          clearGuestAccount()
          setUser(null)
          setIsGuest(false)
          setLoading(false) // ✅ Set loading false here
          return
        }

        console.log('✅ Loading guest user...')
        const guestUser = await loadGuestUser(guestAccount.id)

        if (guestUser) {
          setUser(guestUser)
          setIsGuest(true)
          setExpiresAt(guestAccount.expiresAt)
          localStorage.setItem('auth_mode', 'guest')
          updateGuestActivity(guestAccount.id)
        } else {
          console.log('❌ Guest not found in DB')
          clearGuestAccount()
          setUser(null)
          setIsGuest(false)
        }
        
        setLoading(false) // ✅ Set loading false here
        return
      }

      // No auth
      console.log('ℹ️ No authentication found')
      setUser(null)
      setIsGuest(false)
      setLoading(false) // ✅ Set loading false here
      
    } catch (error) {
      console.error('❌ Auth check error:', error)
      setUser(null)
      setIsGuest(false)
      setLoading(false) // ✅ Always set loading false in catch
    }
  }

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
      console.error('❌ Error loading registered user:', error)
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
      console.error('❌ Error loading guest user:', error)
      return null
    }
  }

  async function logout() {
    if (isGuest) {
      clearGuestAccount()
      setUser(null)
      setIsGuest(false)
      setExpiresAt(null)
    } else {
      await supabase.auth.signOut()
      localStorage.removeItem('auth_mode')
      setUser(null)
      setIsGuest(false)
    }
  }

  // ✅ FIX 3: Simplify useEffect - run ONCE on mount
  useEffect(() => {
    console.log('🚀 useAuth mounted')
    
    let mounted = true
    let authSubscription: any = null

    async function initialize() {
      // Check auth
      await checkAuth()

      // Setup subscription AFTER initial check
      if (mounted) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔔 Auth state changed:', event)
            
            if (!mounted) return

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
          }
        )
        
        authSubscription = subscription
      }
    }

    initialize()

    // ✅ FIX 4: Proper cleanup
    return () => {
      console.log('🧹 useAuth cleanup')
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, []) // ✅ Empty dependency array - run ONCE

  // ✅ FIX 5: Safety timeout - force loading to false after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth check timeout - forcing loading to false')
        setLoading(false)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [loading])

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