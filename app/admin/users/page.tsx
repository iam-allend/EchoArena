'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Search, X, ChevronLeft, ChevronRight, Loader2, Trash2,
  Shield, ShieldOff, ShieldCheck, UserX, UserCheck, RefreshCw,
  CheckCircle2, XCircle, Clock, Crown, Eye, Ghost,
  AlertTriangle, Pencil, Save, Phone, MapPin, Building2,
  IdCard, User2, Mail, Hash,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributorData {
  nip?: string
  phone?: string
  address?: string
  ktp_path?: string
  full_name?: string
  institution?: string
}

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
  is_contributor?: boolean
  contributor_data?: ContributorData | null
  guest_expires_at: string | null
  last_active: string | null
  created_at: string
}

type FilterRole   = 'all' | 'admin' | 'contributor' | 'user' | 'guest'
type FilterStatus = 'all' | 'active' | 'banned' | 'expired'
type DrawerTab    = 'detail' | 'edit' | 'contributor'

const PAGE_SIZE = 15

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

// ─── Role Toggle Switch ───────────────────────────────────────────────────────

function RoleSwitch({ label, icon, active, color, onChange, disabled }: {
  label: string; icon: React.ReactNode; active: boolean
  color: string; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border transition-all ${
        active ? `${color} border-opacity-60` : 'bg-slate-800/60 border-slate-700 text-slate-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">{icon} {label}</div>
      <div className={`w-9 h-5 rounded-full transition-all relative ${active ? 'bg-white/30' : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${active ? 'left-4' : 'left-0.5'}`} />
      </div>
    </button>
  )
}

// ─── Delete Modal (double confirm) ────────────────────────────────────────────

function DeleteModal({ targets, onConfirm, onCancel, loading }: {
  targets: UserRow[]; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const isBulk = targets.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-red-400">
                {isBulk ? `Hapus ${targets.length} Pengguna?` : 'Hapus Pengguna?'}
              </h3>
              <p className="text-slate-400 text-sm">
                {isBulk
                  ? `${targets.length} akun akan dihapus secara permanen.`
                  : `Akun "${targets[0].username}" akan dihapus permanen beserta seluruh datanya.`}
              </p>
              {!isBulk && (
                <div className="w-full bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {targets[0].username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-slate-200 text-sm font-semibold">{targets[0].username}</p>
                    <p className="text-slate-500 text-xs">{targets[0].email || '—'}</p>
                  </div>
                </div>
              )}
              {isBulk && (
                <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
                  {targets.map(u => u.username).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                Lanjutkan
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">Konfirmasi Akhir</h3>
              <p className="text-slate-400 text-sm">
                Data yang dihapus <span className="text-red-400 font-bold">tidak bisa dikembalikan</span>.
              </p>
              {isBulk && (
                <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
                  {targets.map(u => u.username).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onCancel} disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Ban Modal (double confirm for bulk) ─────────────────────────────────────

function BanModal({ targets, action, onConfirm, onCancel, loading }: {
  targets: UserRow[]; action: 'ban' | 'unban'
  onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const isBan  = action === 'ban'
  const isBulk = targets.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isBan ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                {isBan ? <UserX className="w-7 h-7 text-red-400" /> : <UserCheck className="w-7 h-7 text-green-400" />}
              </div>
              <h3 className={`text-base font-bold ${isBan ? 'text-red-400' : 'text-green-400'}`}>
                {isBulk
                  ? isBan ? `Ban ${targets.length} Pengguna?` : `Cabut Ban ${targets.length} Pengguna?`
                  : isBan ? 'Ban Pengguna?' : 'Cabut Ban?'
                }
              </h3>
              <p className="text-slate-400 text-sm">
                {isBulk
                  ? isBan
                    ? `${targets.length} pengguna akan diblokir dari platform.`
                    : `${targets.length} pengguna akan dipulihkan aksesnya.`
                  : isBan
                    ? `${targets[0].username} tidak akan bisa masuk dan menggunakan platform.`
                    : `${targets[0].username} akan bisa kembali menggunakan platform.`
                }
              </p>
              {isBulk && (
                <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
                  {targets.map(u => u.username).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button
                onClick={isBulk ? () => setStep(2) : onConfirm}
                disabled={!isBulk && loading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isBan ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {!isBulk && loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isBan ? 'Ya, Ban' : 'Ya, Cabut Ban'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center animate-pulse ${isBan ? 'bg-red-600/20 border-red-500' : 'bg-green-600/20 border-green-500'}`}>
                <AlertTriangle className={`w-7 h-7 ${isBan ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <h3 className="text-base font-bold text-white">Konfirmasi Akhir</h3>
              <p className="text-slate-400 text-sm">
                {isBan
                  ? <>Semua akun berikut akan <span className="text-red-400 font-bold">diblokir</span>.</>
                  : <>Semua akun berikut akan <span className="text-green-400 font-bold">dipulihkan</span>.</>
                }
              </p>
              <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
                {targets.map(u => u.username).join(', ')}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onCancel} disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={onConfirm} disabled={loading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isBan ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isBan ? 'Ya, Ban Semua' : 'Ya, Cabut Semua'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Detail / Edit Drawer ─────────────────────────────────────────────────────

function UserDetailDrawer({ user, onClose, onBan, onUnban, onDelete, onUpdated, actionLoading }: {
  user: UserRow; onClose: () => void
  onBan: (u: UserRow) => void
  onUnban: (u: UserRow) => void
  onDelete: (u: UserRow) => void
  onUpdated: (u: UserRow) => void
  actionLoading: string | null
}) {
  const supabase = createClient()
  const busy = actionLoading === user.id
  const [tab, setTab] = useState<DrawerTab>('detail')

  // Edit form state
  const [editUsername, setEditUsername] = useState(user.username)
  const [editEmail, setEditEmail]       = useState(user.email || '')
  const [editLevel, setEditLevel]       = useState(String(user.level))
  const [editXp, setEditXp]             = useState(String(user.xp))
  const [editCoins, setEditCoins]       = useState(String(user.coins))
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess]   = useState(false)

  // Role switches (live state)
  const [roleAdmin, setRoleAdmin]             = useState(user.is_admin)
  const [roleContributor, setRoleContributor] = useState(!!user.is_contributor)
  const [roleLoading, setRoleLoading]         = useState<string | null>(null)

  async function handleRoleToggle(field: 'is_admin' | 'is_contributor', value: boolean) {
    setRoleLoading(field)
    const { error } = await supabase.from('users').update({ [field]: value }).eq('id', user.id)
    if (!error) {
      if (field === 'is_admin') setRoleAdmin(value)
      if (field === 'is_contributor') setRoleContributor(value)
      onUpdated({ ...user, is_admin: field === 'is_admin' ? value : roleAdmin, is_contributor: field === 'is_contributor' ? value : roleContributor })
    }
    setRoleLoading(null)
  }

  async function handleSave() {
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    const updates = {
      username: editUsername.trim(),
      email: editEmail.trim() || null,
      level: parseInt(editLevel) || 0,
      xp: parseInt(editXp) || 0,
      coins: parseInt(editCoins) || 0,
    }
    const { error } = await supabase.from('users').update(updates).eq('id', user.id)
    if (!error) { onUpdated({ ...user, ...updates }); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500) }
    else setSaveError(error.message)
    setSaving(false)
  }

  const cd = user.contributor_data
  const showContributorTab = !!user.is_contributor && !!cd

  // KTP signed URL state
  const [ktpSignedUrl, setKtpSignedUrl] = useState<string | null>(null)
  const [ktpLoading, setKtpLoading]     = useState(false)

  async function loadKtpSignedUrl(ktpPath: string) {
    setKtpSignedUrl(null)
    setKtpLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from('contributor-docs')
        .createSignedUrl(ktpPath, 3600)
      if (error) throw error
      setKtpSignedUrl(data.signedUrl)
    } catch (err) {
      console.error('Gagal generate signed URL:', err)
    } finally {
      setKtpLoading(false)
    }
  }

  const TABS = [
    { key: 'detail' as DrawerTab, label: 'Detail' },
    { key: 'edit'   as DrawerTab, label: 'Edit' },
    ...(showContributorTab ? [{ key: 'contributor' as DrawerTab, label: 'Kontributor' }] : []),
  ]

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${
              user.is_banned ? 'bg-red-900' : user.is_admin ? 'bg-purple-800' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
            }`}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{user.username}</p>
              <p className="text-slate-500 text-[11px]">{user.email || 'Tanpa email'}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-800 px-4 shrink-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                tab === t.key ? 'text-white border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── DETAIL ── */}
          {tab === 'detail' && (
            <>
              <div className="flex flex-col items-center gap-2 py-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ${
                  user.is_banned ? 'bg-red-900' : user.is_admin ? 'bg-purple-800' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                }`}>
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex gap-2 flex-wrap justify-center mt-1">
                  <RoleBadge user={{ ...user, is_admin: roleAdmin, is_contributor: roleContributor }} />
                  <StatusBadge user={user} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Level',        value: user.level,                  color: 'text-yellow-400' },
                  { label: 'XP',           value: user.xp.toLocaleString(),    color: 'text-blue-400' },
                  { label: 'Total Game',   value: user.total_games,            color: 'text-white' },
                  { label: 'Total Menang', value: user.total_wins,             color: 'text-green-400' },
                  { label: 'Koin',         value: user.coins.toLocaleString(), color: 'text-amber-400' },
                  { label: 'Win Rate',     value: user.total_games > 0 ? `${Math.round((user.total_wins / user.total_games) * 100)}%` : '0%', color: 'text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/40 space-y-2 text-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Riwayat</p>
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

              {!user.is_admin && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tindakan Cepat</p>
                  {user.is_banned ? (
                    <button className="w-full py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      onClick={() => onUnban(user)} disabled={busy}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Cabut Ban
                    </button>
                  ) : (
                    <button className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      onClick={() => onBan(user)} disabled={busy}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />} Ban Pengguna
                    </button>
                  )}
                  <button className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    onClick={() => onDelete(user)} disabled={busy}>
                    <Trash2 className="w-4 h-4" /> Hapus Akun
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── EDIT ── */}
          {tab === 'edit' && (
            <>
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Informasi Akun</p>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5"><User2 className="w-3.5 h-3.5" /> Username</label>
                  <input value={editUsername} onChange={e => setEditUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</label>
                  <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Level', value: editLevel, set: setEditLevel },
                    { label: 'XP',    value: editXp,    set: setEditXp },
                    { label: 'Koin',  value: editCoins, set: setEditCoins },
                  ].map(f => (
                    <div key={f.label} className="space-y-1">
                      <label className="text-xs text-slate-400">{f.label}</label>
                      <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kelola Role</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Toggle langsung menyimpan ke database.</p>
                </div>

                <RoleSwitch label="User" icon={<UserCheck className="w-4 h-4" />}
                  active={true} disabled={true}
                  color="bg-blue-500/20 border-blue-500/40 text-blue-300"
                  onChange={() => {}} />

                <div className="relative">
                  <RoleSwitch label="Kontributor" icon={<Crown className="w-4 h-4" />}
                    active={roleContributor}
                    disabled={roleAdmin || roleLoading === 'is_contributor'}
                    color="bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                    onChange={v => handleRoleToggle('is_contributor', v)} />
                  {roleLoading === 'is_contributor' && (
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>

                <div className="relative">
                  <RoleSwitch label="Admin" icon={<Shield className="w-4 h-4" />}
                    active={roleAdmin}
                    disabled={roleLoading === 'is_admin'}
                    color="bg-purple-500/20 border-purple-500/40 text-purple-300"
                    onChange={v => handleRoleToggle('is_admin', v)} />
                  {roleLoading === 'is_admin' && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>

                {roleAdmin && (
                  <p className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    ⚠ Admin memiliki akses penuh ke seluruh panel.
                  </p>
                )}
              </div>

              {saveError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perubahan berhasil disimpan!
                </p>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </>
          )}

          {/* ── CONTRIBUTOR DATA ── */}
          {tab === 'contributor' && showContributorTab && cd && (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Data Kontributor</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Nama Lengkap', value: cd.full_name,   icon: <User2 className="w-4 h-4" /> },
                  { label: 'NIP',          value: cd.nip,         icon: <Hash className="w-4 h-4" /> },
                  { label: 'No. HP',       value: cd.phone,       icon: <Phone className="w-4 h-4" /> },
                  { label: 'Instansi',     value: cd.institution, icon: <Building2 className="w-4 h-4" /> },
                  { label: 'Alamat',       value: cd.address,     icon: <MapPin className="w-4 h-4" /> },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex gap-3">
                    <div className="text-slate-500 mt-0.5 shrink-0">{f.icon}</div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-0.5">{f.label}</p>
                      <p className="text-sm text-slate-200 font-medium">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* KTP Preview — private bucket, pakai signed URL (berlaku 1 jam) */}
              {cd.ktp_path && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    <IdCard className="w-3.5 h-3.5" /> Foto KTP
                  </div>

                  {ktpLoading ? (
                    <div className="rounded-xl border border-slate-700 p-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Memuat foto KTP...
                    </div>
                  ) : ktpSignedUrl ? (
                    <a href={ktpSignedUrl} target="_blank" rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors group">
                      <img
                        src={ktpSignedUrl}
                        alt="KTP"
                        className="w-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="p-2 bg-slate-800 text-xs text-blue-400 text-center">
                        Buka di tab baru → (link berlaku 1 jam)
                      </div>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-slate-700 p-4 flex items-center justify-between bg-slate-800/40">
                      <span className="text-slate-400 text-sm">Foto KTP tersedia</span>
                      <button
                        onClick={() => loadKtpSignedUrl(cd.ktp_path!)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-semibold">
                        Muat foto
                      </button>
                    </div>
                  )}
                </div>
              )}
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

  const [users, setUsers]               = useState<UserRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)

  const [search, setSearch]             = useState('')
  const [dSearch, setDSearch]           = useState('')
  const [filterRole, setFilterRole]     = useState<FilterRole>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [page, setPage]                 = useState(1)

  const [selected, setSelected]               = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)

  const [banModal, setBanModal]           = useState<{ targets: UserRow[]; action: 'ban' | 'unban' } | null>(null)
  const [deleteModal, setDeleteModal]     = useState<UserRow[] | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading]     = useState(false)
  const [selectedUser, setSelectedUser]   = useState<UserRow | null>(null)

  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, expired: 0, guest: 0 })

  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [filterRole, filterStatus])

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
      .select('id, username, email, level, xp, coins, total_wins, total_games, is_admin, is_banned, is_guest, is_contributor, contributor_data, guest_expires_at, last_active, created_at')
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

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.username.toLowerCase().includes(dSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(dSearch.toLowerCase())

    const matchRole =
      filterRole === 'all'         ? true :
      filterRole === 'admin'       ? u.is_admin :
      filterRole === 'contributor' ? !!u.is_contributor :
      filterRole === 'guest'       ? u.is_guest :
      !u.is_admin && !u.is_guest && !u.is_contributor

    const matchStatus =
      filterStatus === 'all'     ? true :
      filterStatus === 'banned'  ? u.is_banned :
      filterStatus === 'expired' ? isExpired(u) :
      !u.is_banned && !isExpired(u)

    return matchSearch && matchRole && matchStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const selectableInView = pagedUsers.filter(u => !u.is_admin)
  const allSelected = selectableInView.length > 0 && selectableInView.every(u => selected.has(u.id))
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(selectableInView.map(u => u.id)))
  }
  const exitMultiSelect = () => { setMultiSelectMode(false); setSelected(new Set()) }

  // Ban (single or bulk — same handler)
  async function executeBan() {
    if (!banModal) return
    const { targets, action } = banModal
    if (targets.length === 1) setActionLoading(targets[0].id)
    else setBulkLoading(true)

    const ids = targets.map(u => u.id)
    const { error } = await supabase.from('users').update({ is_banned: action === 'ban' }).in('id', ids)
    if (!error) {
      setUsers(prev => {
        const next = prev.map(u => ids.includes(u.id) ? { ...u, is_banned: action === 'ban' } : u)
        setStats(computeStats(next))
        return next
      })
      if (selectedUser && ids.includes(selectedUser.id))
        setSelectedUser(prev => prev ? { ...prev, is_banned: action === 'ban' } : null)
      setSelected(new Set())
      if (targets.length > 1) setMultiSelectMode(false)
    } else {
      alert('Gagal: ' + error.message)
    }
    setActionLoading(null)
    setBulkLoading(false)
    setBanModal(null)
  }

  // Delete
  async function executeDelete() {
    if (!deleteModal) return
    const ids = deleteModal.map(u => u.id)
    setBulkLoading(true)
    try {
      for (const table of ['stage_answers', 'active_questions', 'room_used_questions', 'turn_queue', 'room_participants'] as const) {
        const { error } = await supabase.from(table).delete().in('user_id', ids)
        if (error) throw new Error(`${table}: ${error.message}`)
      }
      const { data: hostedRooms } = await supabase.from('game_rooms').select('id').in('host_user_id', ids)
      if (hostedRooms && hostedRooms.length > 0) {
        const roomIds = hostedRooms.map(r => r.id)
        for (const table of ['stage_answers', 'active_questions', 'room_used_questions', 'turn_queue', 'room_participants'] as const) {
          await supabase.from(table).delete().in('room_id', roomIds)
        }
        const { error } = await supabase.from('game_rooms').delete().in('id', roomIds)
        if (error) throw new Error(`game_rooms: ${error.message}`)
      }
      const { error } = await supabase.from('users').delete().in('id', ids)
      if (error) throw new Error(`users: ${error.message}`)

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

  function handleUserUpdated(updated: UserRow) {
    setUsers(prev => { const next = prev.map(u => u.id === updated.id ? updated : u); setStats(computeStats(next)); return next })
    setSelectedUser(updated)
  }

  const tabCounts = {
    all:         users.length,
    admin:       users.filter(u => u.is_admin).length,
    contributor: users.filter(u => !!u.is_contributor).length,
    user:        users.filter(u => !u.is_admin && !u.is_guest && !u.is_contributor).length,
    guest:       users.filter(u => u.is_guest).length,
  }

  const TAB_CONFIG: { key: FilterRole; label: string; activeColor: string }[] = [
    { key: 'all',         label: 'Semua',       activeColor: 'bg-slate-700 border-slate-600 text-white' },
    { key: 'admin',       label: 'Admin',       activeColor: 'bg-purple-700/60 border-purple-600/60 text-white' },
    { key: 'contributor', label: 'Kontributor', activeColor: 'bg-yellow-700/60 border-yellow-600/60 text-white' },
    { key: 'user',        label: 'User',        activeColor: 'bg-blue-700/60 border-blue-600/60 text-white' },
    { key: 'guest',       label: 'Guest',       activeColor: 'bg-slate-600/60 border-slate-500/60 text-white' },
  ]

  const selectedUsers  = users.filter(u => selected.has(u.id))
  const selectedBanned = selectedUsers.filter(u => u.is_banned)
  const selectedActive = selectedUsers.filter(u => !u.is_banned)

  return (
    <>
      <div className="space-y-5 pb-10 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-blue-400 w-6 h-6" /> Manajemen Pengguna
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              <span className="text-white font-semibold">{stats.total.toLocaleString('id-ID')}</span> pengguna terdaftar
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => multiSelectMode ? exitMultiSelect() : setMultiSelectMode(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                multiSelectMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}>
              <CheckCircle2 className="w-4 h-4" />
              {multiSelectMode ? 'Batalkan Pilihan' : 'Multi Select'}
            </button>
            <button onClick={() => fetchUsers(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
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

        {/* Search + Status */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari username atau email..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm pl-9 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            {([
              { key: 'all',     label: 'Semua Status', active: 'bg-slate-600 border-slate-500 text-white' },
              { key: 'active',  label: 'Aktif',         active: 'bg-green-700 border-green-600 text-white' },
              { key: 'banned',  label: 'Banned',        active: 'bg-red-700 border-red-600 text-white' },
              { key: 'expired', label: 'Expired',       active: 'bg-orange-700 border-orange-600 text-white' },
            ] as { key: FilterStatus; label: string; active: string }[]).map(s => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  filterStatus === s.key ? s.active : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TAB_CONFIG.map(t => (
            <button key={t.key} onClick={() => setFilterRole(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                filterRole === t.key ? t.activeColor : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              {t.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                filterRole === t.key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {tabCounts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Action Bar */}
        {multiSelectMode && selected.size > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-950/60 border border-blue-500/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="text-sm text-blue-300 font-semibold">{selected.size} pengguna dipilih</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelected(new Set())}
                className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                Hapus Pilihan
              </button>
              {selectedActive.length > 0 && (
                <button onClick={() => setBanModal({ targets: selectedActive, action: 'ban' })}
                  className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
                  <ShieldOff className="w-4 h-4" /> Ban ({selectedActive.length})
                </button>
              )}
              {selectedBanned.length > 0 && (
                <button onClick={() => setBanModal({ targets: selectedBanned, action: 'unban' })}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
                  <ShieldCheck className="w-4 h-4" /> Cabut Ban ({selectedBanned.length})
                </button>
              )}
              <button onClick={() => setDeleteModal(selectedUsers)}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" /> Hapus ({selected.size})
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-1.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-900/60 rounded-xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
            <Users className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-bold text-sm">Tidak ada pengguna yang cocok</p>
            <button onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline">
              Reset filter
            </button>
          </div>
        ) : (
          <div>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
              <div className="flex items-center gap-3 bg-slate-800/70 border-b border-slate-700/60 px-4 py-2.5">
                {multiSelectMode && (
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer shrink-0" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-8 shrink-0">#</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex-1">Pengguna</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-28 hidden md:block shrink-0">Peran</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-20 hidden md:block shrink-0">Status</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-14 hidden sm:block shrink-0">Level</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-16 hidden lg:block shrink-0">Game</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-24 hidden xl:block shrink-0">Aktif</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-24 hidden xl:block shrink-0">Bergabung</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-28 text-right shrink-0">Aksi</span>
              </div>

              {pagedUsers.map((user, idx) => {
                const isSelected = selected.has(user.id)
                return (
                  <div key={user.id}
                    onClick={multiSelectMode && !user.is_admin ? () => toggleSelect(user.id) : undefined}
                    style={multiSelectMode && !user.is_admin ? { cursor: 'pointer' } : undefined}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 last:border-0 transition-colors ${
                      isSelected      ? 'bg-blue-950/30' :
                      user.is_banned  ? 'bg-red-950/10 hover:bg-red-950/20' :
                      isExpired(user) ? 'bg-orange-950/10 hover:bg-orange-950/20' :
                      idx % 2 === 1   ? 'bg-slate-900/40 hover:bg-slate-800/25' :
                      'hover:bg-slate-800/25'
                    }`}>

                    {multiSelectMode && (
                      <div onClick={e => e.stopPropagation()} className="shrink-0">
                        {!user.is_admin ? (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer" />
                        ) : (
                          <span className="text-slate-700 text-xs w-4 inline-block">—</span>
                        )}
                      </div>
                    )}

                    <span className="text-slate-600 text-xs font-mono w-8 shrink-0">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </span>

                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        user.is_banned      ? 'bg-red-900 text-red-300' :
                        user.is_admin       ? 'bg-purple-800 text-purple-200' :
                        user.is_contributor ? 'bg-yellow-600/40 text-yellow-300' :
                        user.is_guest       ? 'bg-slate-700 text-slate-300' :
                        'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                      }`}>
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 text-sm font-semibold truncate leading-tight">{user.username}</p>
                        <p className="text-slate-500 text-[11px] truncate">{user.email || '—'}</p>
                      </div>
                    </div>

                    <div className="w-28 shrink-0 hidden md:block"><RoleBadge user={user} /></div>
                    <div className="w-20 shrink-0 hidden md:block"><StatusBadge user={user} /></div>
                    <div className="w-14 shrink-0 hidden sm:block">
                      <span className="text-[11px] font-bold text-yellow-400">Lv.{user.level}</span>
                    </div>
                    <div className="w-16 shrink-0 hidden lg:block">
                      <span className="text-[11px] text-slate-400">{user.total_games.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-24 shrink-0 hidden xl:block">
                      <span className="text-[11px] text-slate-500">{timeAgo(user.last_active)}</span>
                    </div>
                    <div className="w-24 shrink-0 hidden xl:block">
                      <span className="text-[11px] text-slate-500">{formatDate(user.created_at)}</span>
                    </div>

                    <div className="w-28 shrink-0 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button title="Lihat / Edit" onClick={() => setSelectedUser(user)}
                        className="p-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!user.is_admin && (
                        <>
                          {user.is_banned ? (
                            <button title="Cabut Ban"
                              onClick={() => setBanModal({ targets: [user], action: 'unban' })}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded-lg border border-green-500/25 bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-50">
                              {actionLoading === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <button title="Ban"
                              onClick={() => setBanModal({ targets: [user], action: 'ban' })}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 text-orange-400 hover:bg-orange-500/25 transition-all disabled:opacity-50">
                              {actionLoading === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button title="Hapus" onClick={() => setDeleteModal([user])}
                            className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} dari{' '}
                <span className="text-white font-bold">{filteredUsers.length.toLocaleString('id-ID')}</span> pengguna
                {filteredUsers.length !== users.length && (
                  <button onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}
                    className="ml-2 text-blue-400 hover:text-blue-300 underline">
                    Reset filter
                  </button>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {(() => {
                  const pages: number[] = []
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const end   = Math.min(totalPages, start + 4)
                  for (let i = start; i <= end; i++) pages.push(i)
                  return pages.map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 rounded-xl text-xs font-bold border transition-all ${
                        page === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}>
                      {p}
                    </button>
                  ))
                })()}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {banModal && (
        <BanModal
          targets={banModal.targets} action={banModal.action}
          onConfirm={executeBan} onCancel={() => setBanModal(null)}
          loading={bulkLoading || !!actionLoading}
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
          onBan={u => setBanModal({ targets: [u], action: 'ban' })}
          onUnban={u => setBanModal({ targets: [u], action: 'unban' })}
          onDelete={u => setDeleteModal([u])}
          onUpdated={handleUserUpdated}
          actionLoading={actionLoading}
        />
      )}
    </>
  )
}