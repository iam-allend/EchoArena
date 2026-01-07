import { createClient } from '@/lib/supabase/client'

const GUEST_EXPIRY_DAYS = 7
const GUEST_USERNAME_PREFIX = 'Guest_'

// Generate random guest username
export function generateGuestUsername(): string {
  const randomNumber = Math.floor(10000 + Math.random() * 90000)
  return `${GUEST_USERNAME_PREFIX}${randomNumber}`
}

// Calculate expiry date
export function getGuestExpiryDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + GUEST_EXPIRY_DAYS)
  return date
}

// Create guest account in database
export async function createGuestAccount() {
  const supabase = createClient()
  const username = generateGuestUsername()
  const expiresAt = getGuestExpiryDate()

  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      email: `${username.toLowerCase()}@guest.echoarena.local`, // Dummy email
      is_guest: true,
      guest_expires_at: expiresAt.toISOString(),
      last_active: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Store guest info in localStorage
  const guestInfo = {
    id: data.id,
    username: data.username,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem('guest_account', JSON.stringify(guestInfo))
  localStorage.setItem('auth_mode', 'guest')

  return data
}

// Get guest account from localStorage
export function getGuestAccountFromStorage(): GuestAccount | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('guest_account')
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    const expiresAt = new Date(parsed.expiresAt)

    // Check if expired
    if (expiresAt < new Date()) {
      clearGuestAccount()
      return null
    }

    return {
      id: parsed.id,
      username: parsed.username,
      expiresAt,
      createdAt: new Date(parsed.createdAt),
    }
  } catch {
    return null
  }
}

// Update last active timestamp
export async function updateGuestActivity(userId: string) {
  const supabase = createClient()

  await supabase
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId)
}

// Clear guest account
export function clearGuestAccount() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('guest_account')
  localStorage.removeItem('auth_mode')
}

// Check if guest is expired
export function isGuestExpired(expiresAt: Date): boolean {
  return expiresAt < new Date()
}

// Get days remaining for guest
export function getGuestDaysRemaining(expiresAt: Date): number {
  const diff = expiresAt.getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}