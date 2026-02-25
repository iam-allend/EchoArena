import { createClient } from '@/lib/supabase/client'

export interface UserRole {
  id: string
  username: string
  email: string | null
  is_admin: boolean
  is_contributor: boolean
  is_banned: boolean
  contributor_status: string | null
}

/**
 * Ambil data role user saat ini dari tabel users.
 * Return null jika tidak ada session.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, is_admin, is_contributor, is_banned, contributor_status')
    .eq('id', session.user.id)
    .single()

  if (error || !data) return null
  return data as UserRole
}

/**
 * Cek apakah user saat ini adalah admin.
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role?.is_admin === true
}

/**
 * Cek apakah user saat ini adalah kontributor aktif.
 */
export async function isContributor(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role?.is_contributor === true || role?.is_admin === true
}