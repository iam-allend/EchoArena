'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Search, Shield, ShieldOff, ShieldCheck, UserX, UserCheck,
  RefreshCw, Loader2, Crown, Ghost, Clock, Eye, CheckCircle2,
  XCircle, AlertTriangle, Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  username: string
  email: string | null
  level: number
  xp: number
  coins: number
  total_wins: number
  total_games: number
  is_admin: boolean
  is_banned: boolean
  is_guest: boolean
  guest_expires_at: string | null
  last_active: string | null
  created_at: string
  is_contributor?: boolean
}

type FilterRole   = 'all' | 'admin' | 'contributor' | 'user' | 'guest'
type FilterStatus = 'all' | 'active' | 'banned' | 'expired'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isExpired(user: UserRow): boolean {
  return user.is_guest && !!user.guest_expires_at && new Date(user.guest_expires_at) < new Date()
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function RoleBadge({ user }: { user: UserRow }) {
  if (user.is_admin) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
      <Shield className="w-3 h-3" /> Admin
    </span>
  )
  if (user.is_contributor) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
      <Crown className="w-3 h-3" /> Kontributor
    </span>
  )
  if (user.is_guest) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-400 border border-slate-600">
      <Ghost className="w-3 h-3" /> Guest
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
      <UserCheck className="w-3 h-3" /> User
    </span>
  )
}

function StatusBadge({ user }: { user: UserRow }) {
  if (user.is_banned) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
      <XCircle className="w-3 h-3" /> Banned
    </span>
  )
  if (isExpired(user)) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
      <Clock className="w-3 h-3" /> Expired
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
      <CheckCircle2 className="w-3 h-3" /> Aktif
    </span>
  )
}

// ─── Double Confirm Delete Modal ──────────────────────────────────────────────

interface DeleteModalProps {
  targets: UserRow[]
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteModal({ targets, onConfirm, onCancel, loading }: DeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const isBulk = targets.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-400">
                {isBulk ? `Hapus ${targets.length} Pengguna?` : 'Hapus Pengguna?'}
              </h3>
              <p className="text-slate-400 text-sm">
                {isBulk
                  ? `Anda akan menghapus ${targets.length} akun secara permanen.`
                  : `Anda akan menghapus akun "${targets[0].username}" secara permanen.`}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel}>
                Batal
              </Button>
              <Button className="flex-1 bg-red-700 hover:bg-red-600 text-white" onClick={() => setStep(2)}>
                Lanjutkan
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Konfirmasi Akhir</h3>
              <p className="text-slate-400 text-sm">
                Data yang dihapus <span className="text-red-400 font-bold">tidak bisa dikembalikan</span>.
              </p>
              {isBulk && (
                <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-28 overflow-y-auto text-slate-300 border border-slate-700">
                  {targets.map(u => u.username).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>
                Batal
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={onConfirm} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus Permanen'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────

function BanModal({ user, action, onConfirm, onCancel, loading }: {
  user: UserRow; action: 'ban' | 'unban'; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const isBan = action === 'ban'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isBan ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
            {isBan ? <UserX className="w-8 h-8 text-red-400" /> : <UserCheck className="w-8 h-8 text-green-400" />}
          </div>
          <h3 className={`text-lg font-bold ${isBan ? 'text-red-400' : 'text-green-400'}`}>
            {isBan ? 'Ban Pengguna?' : 'Cabut Ban?'}
          </h3>
          <p className="text-slate-400 text-sm">
            {isBan
              ? `${user.username} tidak akan bisa masuk dan menggunakan platform.`
              : `${user.username} akan bisa kembali menggunakan platform.`}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button
            className={`flex-1 text-white ${isBan ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={onConfirm} disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isBan ? 'Ya, Ban' : 'Ya, Cabut Ban'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function UserDetailDrawer({ user, onClose, onBan, onUnban, onDelete, actionLoading }: {
  user: UserRow; onClose: () => void
  onBan: (u: UserRow) => void; onUnban: (u: UserRow) => void; onDelete: (u: UserRow) => void
  actionLoading: string | null
}) {
  const busy = actionLoading === user.id
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full overflow-y-auto z-10 shadow-2xl">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="font-bold text-white">Detail Pengguna</h2>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
              user.is_banned ? 'bg-red-900' : user.is_admin ? 'bg-purple-800' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
            }`}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{user.username}</h3>
              <p className="text-sm text-slate-400">{user.email || 'Tanpa email'}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <RoleBadge user={user} />
              <StatusBadge user={user} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Level', value: user.level, color: 'text-yellow-400' },
              { label: 'XP', value: user.xp.toLocaleString(), color: 'text-blue-400' },
              { label: 'Total Game', value: user.total_games, color: 'text-white' },
              { label: 'Total Menang', value: user.total_wins, color: 'text-green-400' },
              { label: 'Koin', value: user.coins.toLocaleString(), color: 'text-amber-400' },
              { label: 'Win Rate', value: user.total_games > 0 ? `${Math.round((user.total_wins / user.total_games) * 100)}%` : '0%', color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Riwayat</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Bergabung</span><span className="text-slate-300">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Terakhir aktif</span><span className="text-slate-300">{timeAgo(user.last_active)}</span>
              </div>
              {user.is_guest && (
                <div className="flex justify-between text-slate-400">
                  <span>Guest exp</span>
                  <span className={isExpired(user) ? 'text-orange-400' : 'text-slate-300'}>
                    {formatDate(user.guest_expires_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!user.is_admin && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tindakan</p>
              {user.is_banned ? (
                <Button className="w-full bg-green-700 hover:bg-green-600 text-white" onClick={() => onUnban(user)} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                  Cabut Ban
                </Button>
              ) : (
                <Button className="w-full bg-red-700 hover:bg-red-600 text-white" onClick={() => onBan(user)} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
                  Ban Pengguna
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full border border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                onClick={() => onDelete(user)} disabled={busy}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Hapus Akun
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const supabase = createClient()

  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch]           = useState('')
  const [filterRole, setFilterRole]   = useState<FilterRole>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)

  const [banModal, setBanModal]       = useState<{ user: UserRow; action: 'ban' | 'unban' } | null>(null)
  const [deleteModal, setDeleteModal] = useState<UserRow[] | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)

  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, expired: 0, guest: 0 })

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const computeStats = (data: UserRow[]) => ({
    total:   data.length,
    active:  data.filter(u => !u.is_banned && !isExpired(u)).length,
    banned:  data.filter(u => u.is_banned).length,
    expired: data.filter(u => isExpired(u)).length,
    guest:   data.filter(u => u.is_guest).length,
  })

  const fetchUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, level, xp, coins, total_wins, total_games, is_admin, is_banned, is_guest, guest_expires_at, last_active, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (!error && data) {
      setUsers(data)
      setStats(computeStats(data))
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())

    const matchRole =
      filterRole === 'all'         ? true :
      filterRole === 'admin'       ? u.is_admin :
      filterRole === 'guest'       ? u.is_guest :
      filterRole === 'contributor' ? !!u.is_contributor :
      /* user */                    !u.is_admin && !u.is_guest && !u.is_contributor

    // FIX: active = not banned AND not expired
    const matchStatus =
      filterStatus === 'all'     ? true :
      filterStatus === 'banned'  ? u.is_banned :
      filterStatus === 'expired' ? isExpired(u) :
      /* active */                 !u.is_banned && !isExpired(u)

    return matchSearch && matchRole && matchStatus
  })

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selectableInView = filteredUsers.filter(u => !u.is_admin)
  const allSelected = selectableInView.length > 0 && selectableInView.every(u => selected.has(u.id))

  const toggleSelectAll = () => {
    const ids = selectableInView.map(u => u.id)
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(ids))
  }

  const exitMultiSelect = () => { setMultiSelectMode(false); setSelected(new Set()) }

  // ── Ban action ────────────────────────────────────────────────────────────

  async function executeBan() {
    if (!banModal) return
    const { user, action } = banModal
    setActionLoading(user.id)

    const { error } = await supabase.from('users').update({ is_banned: action === 'ban' }).eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: action === 'ban' } : u))
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, is_banned: action === 'ban' } : null)
      setStats(computeStats(users.map(u => u.id === user.id ? { ...u, is_banned: action === 'ban' } : u)))
    } else {
      alert('Gagal: ' + error.message)
    }
    setActionLoading(null)
    setBanModal(null)
  }

  // ── Delete action ─────────────────────────────────────────────────────────
  // Harus hapus FK dependencies dulu sebelum hapus user.
  // Urutan: stage_answers → active_questions → room_used_questions
  //         → turn_queue → room_participants → game_rooms (host) → users

  async function executeDelete() {
    if (!deleteModal) return
    const ids = deleteModal.map(u => u.id)
    setBulkLoading(true)

    try {
      // 1. stage_answers
      const { error: e1 } = await supabase.from('stage_answers').delete().in('user_id', ids)
      if (e1) throw new Error('stage_answers: ' + e1.message)

      // 2. active_questions
      const { error: e2 } = await supabase.from('active_questions').delete().in('user_id', ids)
      if (e2) throw new Error('active_questions: ' + e2.message)

      // 3. room_used_questions
      const { error: e3 } = await supabase.from('room_used_questions').delete().in('user_id', ids)
      if (e3) throw new Error('room_used_questions: ' + e3.message)

      // 4. turn_queue
      const { error: e4 } = await supabase.from('turn_queue').delete().in('user_id', ids)
      if (e4) throw new Error('turn_queue: ' + e4.message)

      // 5. room_participants
      const { error: e5 } = await supabase.from('room_participants').delete().in('user_id', ids)
      if (e5) throw new Error('room_participants: ' + e5.message)

      // 6. game_rooms yang di-host user ini
      //    (hapus dulu semua partisipan di room tersebut agar tidak orphan)
      const { data: hostedRooms } = await supabase
        .from('game_rooms')
        .select('id')
        .in('host_user_id', ids)

      if (hostedRooms && hostedRooms.length > 0) {
        const roomIds = hostedRooms.map(r => r.id)

        // Hapus semua data dalam room tersebut
        await supabase.from('stage_answers').delete().in('room_id', roomIds)
        await supabase.from('active_questions').delete().in('room_id', roomIds)
        await supabase.from('room_used_questions').delete().in('room_id', roomIds)
        await supabase.from('turn_queue').delete().in('room_id', roomIds)
        await supabase.from('room_participants').delete().in('room_id', roomIds)

        const { error: e6 } = await supabase.from('game_rooms').delete().in('id', roomIds)
        if (e6) throw new Error('game_rooms: ' + e6.message)
      }

      // 7. Akhirnya hapus user
      const { error: e7 } = await supabase.from('users').delete().in('id', ids)
      if (e7) throw new Error('users: ' + e7.message)

      // Update state
      const remaining = users.filter(u => !ids.includes(u.id))
      setUsers(remaining)
      setStats(computeStats(remaining))
      if (selectedUser && ids.includes(selectedUser.id)) setSelectedUser(null)
      setSelected(new Set())
      setMultiSelectMode(false)

    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setBulkLoading(false)
      setDeleteModal(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 pb-8 font-sans">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-blue-500" /> Manajemen Pengguna
            </h1>
            <p className="text-slate-400 mt-1">Pantau dan kelola semua akun pengguna EchoArena.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`gap-2 transition-colors ${
                multiSelectMode
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => multiSelectMode ? exitMultiSelect() : setMultiSelectMode(true)}
            >
              <CheckCircle2 className="w-4 h-4" />
              {multiSelectMode ? 'Batalkan Pilihan' : 'Multi Select'}
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total',   value: stats.total,   icon: <Users className="w-4 h-4" />,        color: 'text-white',      bg: 'bg-slate-800' },
            { label: 'Aktif',   value: stats.active,  icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400',  bg: 'bg-green-500/10 border border-green-500/20' },
            { label: 'Banned',  value: stats.banned,  icon: <UserX className="w-4 h-4" />,        color: 'text-red-400',    bg: 'bg-red-500/10 border border-red-500/20' },
            { label: 'Expired', value: stats.expired, icon: <Clock className="w-4 h-4" />,        color: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20' },
            { label: 'Guest',   value: stats.guest,   icon: <Ghost className="w-4 h-4" />,        color: 'text-slate-400',  bg: 'bg-slate-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
              <div className={`flex items-center gap-2 text-xs mb-1 ${s.color} opacity-70`}>
                {s.icon}<span className="uppercase font-bold tracking-wide">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder="Cari username atau email..."
              className="pl-10 bg-slate-900 border-slate-800 text-white focus:border-blue-500 h-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'admin', 'contributor', 'user', 'guest'] as FilterRole[]).map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                  filterRole === r ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                }`}>
                {r === 'all' ? 'Semua Role' : r}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all',     label: 'Semua Status', cls: 'bg-slate-600' },
              { key: 'active',  label: 'Aktif',         cls: 'bg-green-700' },
              { key: 'banned',  label: 'Banned',        cls: 'bg-red-700' },
              { key: 'expired', label: 'Expired',       cls: 'bg-orange-700' },
            ] as { key: FilterStatus; label: string; cls: string }[]).map(s => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                  filterStatus === s.key ? `${s.cls} text-white` : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {multiSelectMode && selected.size > 0 && (
          <div className="flex items-center justify-between bg-blue-950/60 border border-blue-500/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-blue-300 font-semibold">{selected.size} pengguna dipilih</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700 text-sm h-8"
                onClick={() => setSelected(new Set())}>
                Hapus Pilihan
              </Button>
              <Button className="bg-red-700 hover:bg-red-600 text-white text-sm h-8 gap-2"
                onClick={() => setDeleteModal(users.filter(u => selected.has(u.id)))}>
                <Trash2 className="w-4 h-4" /> Hapus {selected.size} Akun
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center items-center text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> Memuat data pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Tidak ada pengguna yang cocok dengan filter.</p>
              <button onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline">
                Reset filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-800">
                  <tr>
                    {multiSelectMode && (
                      <th className="p-4 w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer" />
                      </th>
                    )}
                    <th className="p-4">Pengguna</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Level</th>
                    <th className="p-4 text-center">Game</th>
                    <th className="p-4">Terakhir Aktif</th>
                    <th className="p-4">Bergabung</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredUsers.map(user => {
                    const isSelected = selected.has(user.id)
                    return (
                      <tr key={user.id}
                        onClick={multiSelectMode && !user.is_admin ? () => toggleSelect(user.id) : undefined}
                        style={multiSelectMode && !user.is_admin ? { cursor: 'pointer' } : undefined}
                        className={`transition-colors group ${
                          isSelected          ? 'bg-blue-950/30' :
                          user.is_banned      ? 'bg-red-950/10 hover:bg-red-950/20' :
                          isExpired(user)     ? 'bg-orange-950/10 hover:bg-orange-950/20' :
                          'hover:bg-slate-800/40'
                        }`}
                      >
                        {multiSelectMode && (
                          <td className="p-4" onClick={e => e.stopPropagation()}>
                            {!user.is_admin ? (
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user.id)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer" />
                            ) : (
                              <span className="text-slate-700 text-xs" title="Admin tidak bisa dihapus">—</span>
                            )}
                          </td>
                        )}

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                              user.is_banned ? 'bg-red-900' : user.is_admin ? 'bg-purple-800' : user.is_guest ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                            }`}>
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{user.username}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email || '—'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4"><RoleBadge user={user} /></td>
                        <td className="p-4"><StatusBadge user={user} /></td>
                        <td className="p-4 text-center font-bold text-yellow-400">{user.level}</td>
                        <td className="p-4 text-center text-slate-300">{user.total_games}</td>
                        <td className="p-4 text-slate-400 text-xs">{timeAgo(user.last_active)}</td>
                        <td className="p-4 text-slate-400 text-xs">{formatDate(user.created_at)}</td>

                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-700"
                              onClick={() => setSelectedUser(user)}>
                              <Eye className="w-4 h-4" />
                            </Button>

                            {!user.is_admin && (
                              <>
                                {user.is_banned ? (
                                  <Button variant="ghost" size="icon"
                                    className="h-8 w-8 text-green-400 hover:text-white hover:bg-green-700"
                                    onClick={() => setBanModal({ user, action: 'unban' })}
                                    disabled={actionLoading === user.id}
                                    title="Cabut Ban">
                                    {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-700"
                                    onClick={() => setBanModal({ user, action: 'ban' })}
                                    disabled={actionLoading === user.id}
                                    title="Ban Pengguna">
                                    {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                  </Button>
                                )}

                                <Button variant="ghost" size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setDeleteModal([user])}
                                  title="Hapus Akun">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Menampilkan <span className="text-slate-300 font-bold">{filteredUsers.length}</span> dari{' '}
                  <span className="text-slate-300 font-bold">{users.length}</span> pengguna
                </p>
                {filteredUsers.length !== users.length && (
                  <button onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline">
                    Reset filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {banModal && (
        <BanModal
          user={banModal.user} action={banModal.action}
          onConfirm={executeBan} onCancel={() => setBanModal(null)}
          loading={!!actionLoading}
        />
      )}

      {deleteModal && (
        <DeleteModal
          targets={deleteModal}
          onConfirm={executeDelete} onCancel={() => setDeleteModal(null)}
          loading={bulkLoading}
        />
      )}

      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser} onClose={() => setSelectedUser(null)}
          onBan={u => setBanModal({ user: u, action: 'ban' })}
          onUnban={u => setBanModal({ user: u, action: 'unban' })}
          onDelete={u => setDeleteModal([u])}
          actionLoading={actionLoading}
        />
      )}
    </>
  )
}