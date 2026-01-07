import { createClient } from '@/lib/supabase/client'
import { clearGuestAccount } from './guest'

// Upgrade guest to registered account
export async function upgradeGuestToRegistered(
  guestId: string,
  email: string,
  password: string,
  username?: string
) {
  const supabase = createClient()

  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Update existing user record
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .update({
        id: authData.user!.id, // Replace with auth user ID
        email,
        username: username || `user_${authData.user!.id.slice(0, 8)}`,
        is_guest: false,
        guest_expires_at: null,
      })
      .eq('id', guestId)
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Transfer guest data (games, scores, etc) - handled by foreign keys
    // Data automatically linked karena user_id sama

    // 4. Clear guest localStorage
    clearGuestAccount()

    // 5. Set registered mode
    localStorage.setItem('auth_mode', 'registered')

    return { success: true, user: userData }
  } catch (error) {
    console.error('Upgrade failed:', error)
    return { success: false, error }
  }
}