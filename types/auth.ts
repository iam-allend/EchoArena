export type AuthMode = 'guest' | 'registered'

export interface GuestAccount {
  id: string
  username: string
  expiresAt: Date
  createdAt: Date
}

export interface RegisteredAccount {
  id: string
  username: string
  email: string
  avatar_url?: string
  level: number
  xp: number
}

export interface AuthUser {
  mode: AuthMode
  user: GuestAccount | RegisteredAccount
  isGuest: boolean
}