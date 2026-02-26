'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Crown, Search, RefreshCw, Loader2, Eye, CheckCircle2, XCircle,
  Clock, UserCheck, UserX, AlertTriangle, Building2, Phone,
  MapPin, CreditCard, GraduationCap, MessageSquare, Users, Trophy,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributorData {
  full_name?: string
  nip?: string
  institution?: string
  phone?: string
  address?: string
  ktp_path?: string  // storage path, bukan URL
}

interface Contributor {
  id: string
  username: string
  email: string | null
  level: number
  total_games: number
  is_admin: boolean
  is_banned: boolean
  is_guest: boolean
  is_contributor: boolean
  contributor_status: 'pending' | 'approved' | 'rejected' | null
  contributor_data: ContributorData
  contributor_applied_at: string | null
  contributor_reviewed_at: string | null
  contributor_review_note: string | null
  created_at: string
  last_active: string | null
}

type TabKey = 'all' | 'pending' | 'approved' | 'rejected'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null, withTime = false) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function timeAgo(d: string | null) {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Contributor['contributor_status'] }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <Clock className="w-3 h-3" /> Menunggu
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
      <XCircle className="w-3 h-3" /> Ditolak
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-400 border border-slate-600">
      — Tidak ada
    </span>
  )
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ targets, onConfirm, onCancel, loading }: {
  targets: Contributor[]
  onConfirm: (note: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [note, setNote] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const isBulk = targets.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-400">
                Tolak {isBulk ? `${targets.length} Kontributor?` : `"${targets[0].username}"?`}
              </h3>
              <p className="text-slate-400 text-sm">Berikan alasan penolakan agar kontributor bisa memperbaiki data mereka.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Catatan / Alasan (opsional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Contoh: Data NIP tidak valid, foto KTP tidak jelas, dll."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel}>Batal</Button>
              <Button className="flex-1 bg-red-700 hover:bg-red-600 text-white" onClick={() => setStep(2)}>Lanjutkan</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Konfirmasi Penolakan</h3>
              {note && (
                <div className="w-full bg-slate-800 rounded-lg p-3 text-sm text-slate-300 text-left border border-slate-700">
                  <span className="text-slate-500 text-xs block mb-1">Catatan:</span>{note}
                </div>
              )}
              {isBulk && (
                <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
                  {targets.map(t => t.username).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>Batal</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => onConfirm(note)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Tolak'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

function ApproveModal({ targets, onConfirm, onCancel, loading }: {
  targets: Contributor[]
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isBulk = targets.length > 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-emerald-400">
            Verifikasi {isBulk ? `${targets.length} Kontributor?` : `"${targets[0].username}"?`}
          </h3>
          <p className="text-slate-400 text-sm">
            {isBulk ? `${targets.length} akun` : targets[0].username} akan mendapatkan akses penuh sebagai kontributor.
          </p>
          {isBulk && (
            <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
              {targets.map(t => t.username).join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>Batal</Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Verifikasi'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Revoke Modal ─────────────────────────────────────────────────────────────

function RevokeModal({ targets, onConfirm, onCancel, loading }: {
  targets: Contributor[]
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const isBulk = targets.length > 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-slate-600/20 border border-slate-500/40 flex items-center justify-center">
            <UserX className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Cabut Verifikasi {isBulk ? `${targets.length} Kontributor?` : `"${targets[0].username}"?`}
          </h3>
          <p className="text-slate-400 text-sm">
            Status akan kembali ke <span className="text-amber-400 font-semibold">Menunggu</span>.
            Akses kontributor akan dinonaktifkan hingga di-approve ulang.
          </p>
          {isBulk && (
            <div className="w-full text-xs bg-slate-800 rounded-lg p-3 text-left max-h-24 overflow-y-auto text-slate-300 border border-slate-700">
              {targets.map(t => t.username).join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Cabut'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function ContributorDrawer({ c, onClose, onApprove, onReject, onRevoke, actionLoading, ktpLoading, ktpSignedUrl, onLoadKtp }: {
  c: Contributor
  onClose: () => void
  onApprove: (t: Contributor[]) => void
  onReject: (t: Contributor[]) => void
  onRevoke: (t: Contributor[]) => void
  actionLoading: boolean
  ktpLoading: boolean
  ktpSignedUrl: string | null
  onLoadKtp: (path: string) => void
}) {
  const d = c.contributor_data || {}

  const DataRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide font-bold">{label}</p>
        <p className="text-sm text-white mt-0.5 break-words">{value || <span className="text-slate-600 italic">Tidak diisi</span>}</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto z-10 shadow-2xl flex flex-col">

        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Detail Kontributor
          </h2>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Avatar & name */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 ${
              c.contributor_status === 'approved' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
              c.contributor_status === 'pending'  ? 'bg-gradient-to-br from-amber-600 to-orange-700' :
              'bg-gradient-to-br from-red-700 to-rose-800'
            }`}>
              {c.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-white truncate">{d.full_name || c.username}</h3>
              <p className="text-sm text-slate-400 truncate">@{c.username}</p>
              <p className="text-xs text-slate-500 truncate">{c.email || 'Tanpa email'}</p>
              <div className="mt-2"><StatusBadge status={c.contributor_status} /></div>
            </div>
          </div>

          {/* Data Pendaftaran */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Data Pendaftaran</p>
            <div className="space-y-4">
              <DataRow icon={<GraduationCap className="w-4 h-4" />} label="Nama Lengkap" value={d.full_name} />
              <DataRow icon={<CreditCard className="w-4 h-4" />} label="NIP" value={d.nip} />
              <DataRow icon={<Building2 className="w-4 h-4" />} label="Institusi / Sekolah" value={d.institution} />
              <DataRow icon={<Phone className="w-4 h-4" />} label="Nomor Telepon" value={d.phone} />
              <DataRow icon={<MapPin className="w-4 h-4" />} label="Alamat" value={d.address} />
            </div>
          </div>

          {/* Foto KTP — private bucket, pakai signed URL */}
          {d.ktp_path && (
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Foto KTP</p>
              {ktpLoading ? (
                <div className="rounded-xl border border-slate-700 p-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat foto KTP...
                </div>
              ) : ktpSignedUrl ? (
                <a href={ktpSignedUrl} target="_blank" rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors group">
                  <img src={ktpSignedUrl} alt="KTP" className="w-full object-cover group-hover:opacity-90 transition-opacity" />
                  <div className="p-2 bg-slate-800 text-xs text-blue-400 text-center">Buka di tab baru → (link berlaku 1 jam)</div>
                </a>
              ) : (
                <div className="rounded-xl border border-slate-700 p-4 flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Foto KTP tersedia</span>
                  <button
                    onClick={() => onLoadKtp(d.ktp_path!)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline">
                    Muat foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Riwayat</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Mendaftar sebagai user</span>
                <span className="text-slate-300">{formatDate(c.created_at)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Apply kontributor</span>
                <span className="text-slate-300">{formatDate(c.contributor_applied_at)}</span>
              </div>
              {c.contributor_reviewed_at && (
                <div className="flex justify-between text-slate-400">
                  <span>Direview admin</span>
                  <span className="text-slate-300">{formatDate(c.contributor_reviewed_at, true)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Terakhir aktif</span>
                <span className="text-slate-300">{timeAgo(c.last_active)}</span>
              </div>
            </div>
          </div>

          {/* Catatan penolakan */}
          {c.contributor_status === 'rejected' && c.contributor_review_note && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl">
              <p className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Catatan Penolakan
              </p>
              <p className="text-sm text-red-200">{c.contributor_review_note}</p>
            </div>
          )}

          {/* Stats */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Statistik Akun</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Level', value: c.level, color: 'text-yellow-400' },
                { label: 'Total Game', value: c.total_games, color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 p-4 space-y-2">
          {c.contributor_status === 'pending' && (
            <>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
                onClick={() => onApprove([c])} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Verifikasi Kontributor
              </Button>
              <Button className="w-full bg-red-800 hover:bg-red-700 text-white h-10"
                onClick={() => onReject([c])} disabled={actionLoading}>
                <XCircle className="w-4 h-4 mr-2" /> Tolak Aplikasi
              </Button>
            </>
          )}
          {c.contributor_status === 'approved' && (
            <Button variant="ghost" className="w-full border border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 h-10"
              onClick={() => onRevoke([c])} disabled={actionLoading}>
              <UserX className="w-4 h-4 mr-2" /> Cabut Status Kontributor
            </Button>
          )}
          {c.contributor_status === 'rejected' && (
            <Button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white h-10"
              onClick={() => onApprove([c])} disabled={actionLoading}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContributorsVerifyPage() {
  const supabase = createClient()

  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [activeTab, setActiveTab]       = useState<TabKey>('all')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)

  const [approveModal, setApproveModal] = useState<Contributor[] | null>(null)
  const [rejectModal, setRejectModal]   = useState<Contributor[] | null>(null)
  const [revokeModal, setRevokeModal]   = useState<Contributor[] | null>(null)
  const [drawer, setDrawer]             = useState<Contributor | null>(null)
  const [ktpSignedUrl, setKtpSignedUrl] = useState<string | null>(null)
  const [ktpLoading, setKtpLoading]     = useState(false)

  const [stats, setStats] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 })

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchContributors = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .select(`
        id, username, email, level, total_games,
        is_admin, is_banned, is_guest, is_contributor,
        contributor_status, contributor_data,
        contributor_applied_at, contributor_reviewed_at, contributor_review_note,
        created_at, last_active
      `)
      .not('contributor_status', 'is', null)
      .order('contributor_applied_at', { ascending: false })

    if (!error && data) {
      setContributors(data as Contributor[])
      setStats({
        all:      data.length,
        pending:  data.filter(c => c.contributor_status === 'pending').length,
        approved: data.filter(c => c.contributor_status === 'approved').length,
        rejected: data.filter(c => c.contributor_status === 'rejected').length,
      })
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchContributors() }, [fetchContributors])

  // ── Generate signed URL untuk preview KTP (berlaku 1 jam) ─────────────────

  const loadKtpSignedUrl = async (ktpPath: string) => {
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

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = contributors.filter(c => {
    const matchTab    = activeTab === 'all' || c.contributor_status === activeTab
    const matchSearch =
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contributor_data?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contributor_data?.institution || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))
  const toggleSelectAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(c => c.id)))
  const exitMultiSelect = () => { setMultiSelectMode(false); setSelected(new Set()) }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function executeApprove(targets: Contributor[]) {
    setActionLoading(true)
    const ids = targets.map(c => c.id)
    const { error } = await supabase.from('users').update({
      contributor_status: 'approved',
      is_contributor: true,
      contributor_reviewed_at: new Date().toISOString(),
      contributor_review_note: null,
    }).in('id', ids)

    if (!error) {
      setContributors(prev => prev.map(c =>
        ids.includes(c.id) ? { ...c, contributor_status: 'approved', is_contributor: true } : c
      ))
      if (drawer && ids.includes(drawer.id))
        setDrawer(prev => prev ? { ...prev, contributor_status: 'approved', is_contributor: true } : null)
      setSelected(new Set())
      await fetchContributors(true)
    } else {
      alert('Gagal: ' + error.message)
    }
    setActionLoading(false)
    setApproveModal(null)
  }

  async function executeReject(targets: Contributor[], note: string) {
    setActionLoading(true)
    const ids = targets.map(c => c.id)
    const { error } = await supabase.from('users').update({
      contributor_status: 'rejected',
      is_contributor: false,
      contributor_reviewed_at: new Date().toISOString(),
      contributor_review_note: note || null,
    }).in('id', ids)

    if (!error) {
      setContributors(prev => prev.map(c =>
        ids.includes(c.id) ? { ...c, contributor_status: 'rejected', is_contributor: false, contributor_review_note: note || null } : c
      ))
      if (drawer && ids.includes(drawer.id))
        setDrawer(prev => prev ? { ...prev, contributor_status: 'rejected', is_contributor: false } : null)
      setSelected(new Set())
      await fetchContributors(true)
    } else {
      alert('Gagal: ' + error.message)
    }
    setActionLoading(false)
    setRejectModal(null)
  }

  async function executeRevoke(targets: Contributor[]) {
    setActionLoading(true)
    const ids = targets.map(c => c.id)
    const { error } = await supabase.from('users').update({
      contributor_status: 'pending',
      is_contributor: false,
      contributor_reviewed_at: new Date().toISOString(),
    }).in('id', ids)

    if (!error) {
      setContributors(prev => prev.map(c =>
        ids.includes(c.id) ? { ...c, contributor_status: 'pending', is_contributor: false } : c
      ))
      if (drawer && ids.includes(drawer.id))
        setDrawer(prev => prev ? { ...prev, contributor_status: 'pending', is_contributor: false } : null)
      setSelected(new Set())
      await fetchContributors(true)
    } else {
      alert('Gagal: ' + error.message)
    }
    setActionLoading(false)
    setRevokeModal(null)
  }

  const selectedItems  = contributors.filter(c => selected.has(c.id))
  // pending + rejected → bisa di-approve
  const bulkApprovable = selectedItems.filter(c => c.contributor_status === 'pending' || c.contributor_status === 'rejected')
  // pending saja → bisa di-tolak
  const bulkRejectable = selectedItems.filter(c => c.contributor_status === 'pending')
  // approved saja → bisa dicabut verifikasinya
  const bulkRevokable  = selectedItems.filter(c => c.contributor_status === 'approved')

  const tabs = [
    { key: 'all'      as TabKey, label: 'Semua',         count: stats.all,      color: 'text-slate-300' },
    { key: 'pending'  as TabKey, label: 'Menunggu',      count: stats.pending,  color: 'text-amber-400' },
    { key: 'approved' as TabKey, label: 'Terverifikasi', count: stats.approved, color: 'text-emerald-400' },
    { key: 'rejected' as TabKey, label: 'Ditolak',       count: stats.rejected, color: 'text-red-400' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 pb-8 font-sans">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="text-yellow-400 fill-yellow-400/20" /> Manajemen Kontributor
            </h1>
            <p className="text-slate-400 mt-1">Review dan kelola aplikasi pengajar yang mendaftar sebagai kontributor.</p>
          </div>

          {/* Tombol-tombol header */}
          <div className="flex gap-2 flex-wrap">

            {/* ★ Tombol ke halaman Kontributor Unggulan */}
            <Link href="/admin/contributors">
              <Button
                variant="outline"
                className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500 gap-2"
              >
                <Trophy className="w-4 h-4" />
                Kontributor Unggulan
              </Button>
            </Link>

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

            <Button variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
              onClick={() => fetchContributors(true)} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Aplikasi', value: stats.all,      icon: <Users className="w-4 h-4" />,       color: 'text-white',       bg: 'bg-slate-800' },
            { label: 'Menunggu',       value: stats.pending,  icon: <Clock className="w-4 h-4" />,       color: 'text-amber-400',   bg: 'bg-amber-500/10 border border-amber-500/20' },
            { label: 'Terverifikasi',  value: stats.approved, icon: <CheckCircle2 className="w-4 h-4" />,color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
            { label: 'Ditolak',        value: stats.rejected, icon: <XCircle className="w-4 h-4" />,     color: 'text-red-400',     bg: 'bg-red-500/10 border border-red-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
              <div className={`flex items-center gap-2 text-xs mb-1 ${s.color} opacity-70`}>
                {s.icon}<span className="uppercase font-bold tracking-wide">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === t.key ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {t.label}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-slate-600 text-white' : 'bg-slate-800 ' + t.color
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Cari nama, username, email, institusi..."
              className="pl-10 bg-slate-900 border-slate-800 text-white focus:border-blue-500 h-10 w-full"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Bulk Action Bar ── */}
        {multiSelectMode && selected.size > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-950/60 border border-blue-500/40 rounded-xl px-4 py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-blue-300 font-semibold">{selected.size} kontributor dipilih</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700 text-sm h-8"
                onClick={() => setSelected(new Set())}>Hapus Pilihan</Button>
              {bulkApprovable.length > 0 && (
                <Button className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm h-8 gap-2"
                  onClick={() => setApproveModal(bulkApprovable)}>
                  <CheckCircle2 className="w-4 h-4" /> Approve {bulkApprovable.length}
                </Button>
              )}
              {bulkRejectable.length > 0 && (
                <Button className="bg-red-800 hover:bg-red-700 text-white text-sm h-8 gap-2"
                  onClick={() => setRejectModal(bulkRejectable)}>
                  <XCircle className="w-4 h-4" /> Tolak {bulkRejectable.length}
                </Button>
              )}
              {bulkRevokable.length > 0 && (
                <Button className="bg-slate-600 hover:bg-slate-500 text-white text-sm h-8 gap-2"
                  onClick={() => setRevokeModal(bulkRevokable)}>
                  <UserX className="w-4 h-4" /> Cabut Verifikasi {bulkRevokable.length}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center items-center text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> Memuat data kontributor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-slate-400">
                {contributors.length === 0 ? 'Belum ada aplikasi kontributor masuk.' : 'Tidak ada yang cocok dengan filter.'}
              </p>
              {contributors.length > 0 && (
                <button onClick={() => { setSearch(''); setActiveTab('all') }}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline">Reset filter</button>
              )}
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
                    <th className="p-4">Identitas</th>
                    <th className="p-4">Institusi</th>
                    <th className="p-4">NIP</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Apply</th>
                    <th className="p-4">Direview</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filtered.map(c => {
                    const isSelected = selected.has(c.id)
                    const d = c.contributor_data || {}
                    return (
                      <tr key={c.id}
                        onClick={multiSelectMode ? () => toggleSelect(c.id) : undefined}
                        style={multiSelectMode ? { cursor: 'pointer' } : undefined}
                        className={`transition-colors group ${
                          isSelected                           ? 'bg-blue-950/30' :
                          c.contributor_status === 'pending'  ? 'hover:bg-amber-950/10' :
                          c.contributor_status === 'rejected' ? 'hover:bg-red-950/10' :
                          'hover:bg-slate-800/40'
                        }`}>

                        {multiSelectMode && (
                          <td className="p-4" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 cursor-pointer" />
                          </td>
                        )}

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                              c.contributor_status === 'approved' ? 'bg-emerald-800' :
                              c.contributor_status === 'pending'  ? 'bg-amber-800' : 'bg-red-900'
                            }`}>
                              {c.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{d.full_name || c.username}</p>
                              <p className="text-xs text-slate-500 truncate">@{c.username} · {c.email || '—'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-slate-300">{d.institution || <span className="text-slate-600 italic">—</span>}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{d.nip || <span className="text-slate-600 italic">—</span>}</td>
                        <td className="p-4"><StatusBadge status={c.contributor_status} /></td>
                        <td className="p-4 text-slate-400 text-xs">{timeAgo(c.contributor_applied_at)}</td>
                        <td className="p-4 text-slate-500 text-xs">{c.contributor_reviewed_at ? timeAgo(c.contributor_reviewed_at) : '—'}</td>

                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {/* Detail — selalu tampil */}
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-700"
                              onClick={() => { setDrawer(c); setKtpSignedUrl(null); if (c.contributor_data?.ktp_path) loadKtpSignedUrl(c.contributor_data.ktp_path) }} title="Lihat detail">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* pending: Approve + Tolak */}
                            {c.contributor_status === 'pending' && (<>
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 text-emerald-400 hover:text-white hover:bg-emerald-700"
                                onClick={() => setApproveModal([c])} title="Approve">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-700"
                                onClick={() => setRejectModal([c])} title="Tolak">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>)}

                            {/* approved: Cabut Verifikasi saja */}
                            {c.contributor_status === 'approved' && (
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                                onClick={() => setRevokeModal([c])} title="Cabut Verifikasi">
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}

                            {/* rejected: Approve saja (beri kesempatan lagi) */}
                            {c.contributor_status === 'rejected' && (
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 text-emerald-400 hover:text-white hover:bg-emerald-700"
                                onClick={() => setApproveModal([c])} title="Approve (beri kesempatan lagi)">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
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
                  Menampilkan <span className="text-slate-300 font-bold">{filtered.length}</span> dari{' '}
                  <span className="text-slate-300 font-bold">{contributors.length}</span> aplikasi
                </p>
                {stats.pending > 0 && (
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {stats.pending} menunggu review
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {approveModal && (
        <ApproveModal targets={approveModal}
          onConfirm={() => executeApprove(approveModal)}
          onCancel={() => setApproveModal(null)} loading={actionLoading} />
      )}
      {rejectModal && (
        <RejectModal targets={rejectModal}
          onConfirm={note => executeReject(rejectModal, note)}
          onCancel={() => setRejectModal(null)} loading={actionLoading} />
      )}
      {revokeModal && (
        <RevokeModal targets={revokeModal}
          onConfirm={() => executeRevoke(revokeModal)}
          onCancel={() => setRevokeModal(null)} loading={actionLoading} />
      )}
      {drawer && (
        <ContributorDrawer c={drawer} onClose={() => setDrawer(null)}
          onApprove={t => { setDrawer(null); setApproveModal(t) }}
          onReject={t => { setDrawer(null); setRejectModal(t) }}
          onRevoke={t => { setDrawer(null); setRevokeModal(t) }}
          actionLoading={actionLoading}
          ktpLoading={ktpLoading}
          ktpSignedUrl={ktpSignedUrl}
          onLoadKtp={loadKtpSignedUrl} />
      )}
    </>
  )
}