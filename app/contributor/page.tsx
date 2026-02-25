'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BrainCircuit, BookOpen, PlusCircle, TrendingUp, Sparkles,
  Crown, CheckCircle2, Clock, XCircle, AlertCircle, Upload,
  User, Building2, Phone, MapPin, FileText, Image as ImageIcon,
  Loader2, ChevronRight, Lock, ArrowRight, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  id: string
  username: string
  level: number
  total_games: number
  is_contributor: boolean
  contributor_status: 'pending' | 'approved' | 'rejected' | null
  contributor_data: {
    full_name?: string
    nip?: string
    institution?: string
    phone?: string
    address?: string
    ktp_url?: string
  } | null
  contributor_applied_at: string | null
  contributor_reviewed_at: string | null
  contributor_review_note: string | null
}

interface VerifForm {
  full_name: string
  nip: string
  institution: string
  phone: string
  address: string
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, hasData }: { status: UserData['contributor_status']; hasData: boolean }) {
  if (status === 'approved') return (
    <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold">
      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
    </span>
  )
  if (status === 'rejected') return (
    <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-full text-xs font-bold">
      <XCircle className="w-3.5 h-3.5" /> Ditolak
    </span>
  )
  if (status === 'pending' && hasData) return (
    <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold">
      <Clock className="w-3.5 h-3.5" /> Menunggu Review
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 bg-slate-700/50 border border-slate-600 text-slate-400 px-3 py-1.5 rounded-full text-xs font-bold">
      <AlertCircle className="w-3.5 h-3.5" /> Belum Diverifikasi
    </span>
  )
}

// ─── Locked Menu Preview ──────────────────────────────────────────────────────

function LockedMenuCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 opacity-50 cursor-not-allowed select-none">
      <div className="text-slate-600">{icon}</div>
      <span className="text-sm text-slate-500">{label}</span>
      <Lock className="w-3.5 h-3.5 text-slate-700 ml-auto" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContributorDashboard() {
  const supabase = createClient()

  const [user, setUser]         = useState<UserData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingKtp, setUploadingKtp] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState<VerifForm>({
    full_name: '', nip: '', institution: '', phone: '', address: '',
  })
  const [ktpUrl, setKtpUrl]     = useState('')
  const [ktpPreview, setKtpPreview] = useState('')
  const fileRef                 = useRef<HTMLInputElement>(null)

  // ── Load user ────────────────────────────────────────────────────────────

  async function loadUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('users')
      .select(`
        id, username, level, total_games,
        is_contributor, contributor_status,
        contributor_data, contributor_applied_at,
        contributor_reviewed_at, contributor_review_note
      `)
      .eq('id', session.user.id)
      .single()

    if (data) {
      setUser(data as UserData)
      // Pre-fill form jika sudah pernah isi
      if (data.contributor_data && Object.keys(data.contributor_data).length > 0) {
        const d = data.contributor_data as VerifForm & { ktp_url?: string }
        setForm({
          full_name:   d.full_name   || '',
          nip:         d.nip         || '',
          institution: d.institution || '',
          phone:       d.phone       || '',
          address:     d.address     || '',
        })
        if (d.ktp_url) { setKtpUrl(d.ktp_url); setKtpPreview(d.ktp_url) }
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadUser() }, [])

  // ── Upload KTP ───────────────────────────────────────────────────────────

  async function handleKtpUpload(file: File) {
    if (!user) return
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file maks 5MB'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format file harus JPG, PNG, atau WebP')
      return
    }

    setUploadingKtp(true)
    setError('')

    try {
      const ext  = file.name.split('.').pop()
      const path = `ktp/${user.id}/ktp.${ext}`

      const { error: upErr } = await supabase.storage
        .from('contributor-docs')
        .upload(path, file, { upsert: true })

      if (upErr) throw upErr

      const { data: urlData } = supabase.storage
        .from('contributor-docs')
        .getPublicUrl(path)

      setKtpUrl(urlData.publicUrl)
      setKtpPreview(URL.createObjectURL(file))
    } catch (err: any) {
      setError('Gagal upload KTP: ' + err.message)
    } finally {
      setUploadingKtp(false)
    }
  }

  // ── Submit verifikasi ────────────────────────────────────────────────────

  async function handleSubmitVerif(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim()) { setError('Nama lengkap wajib diisi'); return }
    if (!form.nip.trim())       { setError('NIP/NIDN/NIK wajib diisi'); return }
    if (!form.institution.trim()) { setError('Institusi wajib diisi'); return }
    if (!ktpUrl)                { setError('Foto KTP wajib diunggah'); return }
    if (!user)                  return

    setSubmitting(true)
    try {
      const { error: dbErr } = await supabase
        .from('users')
        .update({
          contributor_status:       'pending',
          contributor_applied_at:   new Date().toISOString(),
          contributor_reviewed_at:  null,
          contributor_review_note:  null,
          contributor_data: {
            full_name:   form.full_name.trim(),
            nip:         form.nip.trim(),
            institution: form.institution.trim(),
            phone:       form.phone.trim(),
            address:     form.address.trim(),
            ktp_url:     ktpUrl,
          },
        })
        .eq('id', user.id)

      if (dbErr) throw dbErr

      setSubmitDone(true)
      await loadUser()
    } catch (err: any) {
      setError('Gagal mengirim data: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const hasFilledData = !!(user?.contributor_data && Object.keys(user.contributor_data).length > 0 && user.contributor_data.ktp_url)

  const quickActions = [
    { label: 'Tambah Soal Baru',   href: '/contributor/questions/new', icon: <PlusCircle className="w-5 h-5" />, color: 'from-indigo-600 to-purple-600' },
    { label: 'Tambah Materi Baru', href: '/contributor/materials/new', icon: <PlusCircle className="w-5 h-5" />, color: 'from-blue-600 to-cyan-600' },
    { label: 'Bank Soal',          href: '/contributor/questions',      icon: <BrainCircuit className="w-5 h-5" />, color: 'from-slate-700 to-slate-700' },
    { label: 'Materi',             href: '/contributor/materials',      icon: <BookOpen className="w-5 h-5" />, color: 'from-slate-700 to-slate-700' },
  ]

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      Memuat dashboard...
    </div>
  )

  // ── APPROVED — dashboard penuh ───────────────────────────────────────────

  if (user?.is_contributor || user?.contributor_status === 'approved') {
    return (
      <div className="space-y-6 pb-8 font-sans">
        <div className="flex items-start justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="text-emerald-400 fill-emerald-400/20" />
              Selamat datang, {user?.username}!
            </h1>
            <p className="text-slate-400 mt-1">Panel kontributor — kelola soal dan materi pembelajaran.</p>
          </div>
          <StatusBadge status="approved" hasData />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Level', value: user?.level, icon: <TrendingUp className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Total Game', value: user?.total_games, icon: <Sparkles className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-4 border ${c.bg}`}>
              <div className={`flex items-center gap-2 text-xs mb-2 ${c.color} opacity-80`}>
                {c.icon}
                <span className="uppercase font-bold tracking-wide">{c.label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value ?? '—'}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3">Aksi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(a => (
              <Link key={a.href} href={a.href}>
                <div className={`bg-gradient-to-br ${a.color} rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer`}>
                  <div className="text-white/80 mb-2">{a.icon}</div>
                  <p className="text-sm font-bold text-white">{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── PENDING + sudah isi data — menunggu review ───────────────────────────

  if (user?.contributor_status === 'pending' && hasFilledData && !submitDone) {
    const d = user.contributor_data!
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-8 font-sans">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="text-amber-400" /> Menunggu Verifikasi
          </h1>
          <p className="text-slate-400 mt-1">Data kamu sedang direview oleh admin EchoArena.</p>
        </div>

        {/* Timeline status */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h2 className="font-bold text-white text-sm uppercase tracking-wide">Status Pengajuan</h2>
          <div className="space-y-0">
            {[
              { done: true,  active: false, label: 'Akun dibuat',              sub: 'Registrasi berhasil' },
              { done: true,  active: false, label: 'Email diverifikasi',       sub: 'Akun aktif' },
              { done: true,  active: false, label: 'Data pendidik dikirim',    sub: user.contributor_applied_at ? new Date(user.contributor_applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '' },
              { done: false, active: true,  label: 'Review oleh admin',        sub: 'Sedang diproses...' },
              { done: false, active: false, label: 'Akses kontributor aktif',  sub: 'Belum selesai' },
            ].map((s, i, arr) => (
              <div key={i} className="flex gap-4">
                {/* Line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    s.done   ? 'bg-emerald-600 border-emerald-500' :
                    s.active ? 'bg-amber-500/20 border-amber-400 animate-pulse' :
                                'bg-slate-800 border-slate-700'
                  }`}>
                    {s.done
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : s.active
                        ? <Clock className="w-4 h-4 text-amber-300" />
                        : <div className="w-2 h-2 rounded-full bg-slate-600" />
                    }
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-0.5 h-8 ${s.done ? 'bg-emerald-700' : 'bg-slate-800'}`} />
                  )}
                </div>
                {/* Text */}
                <div className="pb-6">
                  <p className={`text-sm font-semibold ${s.done ? 'text-white' : s.active ? 'text-amber-300' : 'text-slate-600'}`}>
                    {s.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${s.done ? 'text-slate-400' : s.active ? 'text-amber-500/70' : 'text-slate-700'}`}>
                    {s.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data yang sudah disubmit */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">Data yang Dikirim</h2>
            <button
              onClick={() => {
                // Allow re-edit: clear filled state
                setSubmitDone(false)
                setUser(prev => prev ? { ...prev, contributor_data: {} } : prev)
              }}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Edit ulang
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Nama Lengkap', value: d.full_name },
              { label: 'NIP/NIDN/NIK', value: d.nip },
              { label: 'Institusi', value: d.institution },
              { label: 'No. Telepon', value: d.phone || '—' },
              { label: 'Alamat', value: d.address || '—' },
            ].map(f => (
              <div key={f.label} className="bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 font-medium mb-1">{f.label}</p>
                <p className="text-white text-sm">{f.value}</p>
              </div>
            ))}
            {d.ktp_url && (
              <div className="bg-slate-800/50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 font-medium mb-2">Foto KTP</p>
                <a href={d.ktp_url} target="_blank" rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs underline flex items-center gap-1">
                  Lihat foto KTP <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-200 font-semibold mb-1">Apa yang terjadi selanjutnya?</p>
            <p className="text-blue-300/70 leading-relaxed">Admin akan memverifikasi data kamu. Proses ini biasanya memakan waktu 1–2 hari kerja. Kamu akan mendapat akses penuh ke panel kontributor setelah disetujui.</p>
          </div>
        </div>

        {/* Menu terkunci */}
        <div className="space-y-2">
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-3">Menu (terkunci sampai diverifikasi)</p>
          {[
            { icon: <BrainCircuit className="w-4 h-4" />, label: 'Bank Soal' },
            { icon: <BookOpen className="w-4 h-4" />, label: 'Materi' },
            { icon: <PlusCircle className="w-4 h-4" />, label: 'Tambah Soal' },
            { icon: <PlusCircle className="w-4 h-4" />, label: 'Tambah Materi' },
          ].map(m => <LockedMenuCard key={m.label} {...m} />)}
        </div>
      </div>
    )
  }

  // ── REJECTED — bisa submit ulang ────────────────────────────────────────

  const isRejected = user?.contributor_status === 'rejected'

  // ── PENDING tanpa data / REJECTED — tampilkan form verifikasi ────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8 font-sans">

      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {isRejected
                ? <><XCircle className="text-red-400" /> Verifikasi Ditolak</>
                : <><FileText className="text-blue-400" /> Verifikasi Data Pendidik</>
              }
            </h1>
            <p className="text-slate-400 mt-1">
              {isRejected
                ? 'Data kamu ditolak. Perbaiki dan kirim ulang.'
                : 'Lengkapi data berikut untuk mengaktifkan akses kontributor.'
              }
            </p>
          </div>
          <StatusBadge status={user?.contributor_status ?? null} hasData={hasFilledData} />
        </div>
      </div>

      {/* Notif ditolak */}
      {isRejected && user?.contributor_review_note && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex gap-4">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold text-sm mb-1">Alasan Penolakan dari Admin:</p>
            <p className="text-red-300/80 text-sm leading-relaxed">"{user.contributor_review_note}"</p>
          </div>
        </div>
      )}

      {/* Success state setelah submit */}
      {submitDone && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex gap-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-bold text-sm mb-1">Data berhasil dikirim!</p>
            <p className="text-emerald-300/70 text-sm">Admin akan segera mereview data kamu. Pantau status di halaman ini.</p>
          </div>
        </div>
      )}

      {/* Info steps */}
      {!submitDone && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Langkah Aktivasi Kontributor</p>
          <div className="flex items-center gap-0 flex-wrap">
            {[
              { n: '1', label: 'Isi data', done: false, active: true },
              { n: '→', label: '', done: false, active: false },
              { n: '2', label: 'Review admin', done: false, active: false },
              { n: '→', label: '', done: false, active: false },
              { n: '3', label: 'Akses penuh', done: false, active: false },
            ].map((s, i) => (
              s.n === '→'
                ? <ChevronRight key={i} className="w-4 h-4 text-slate-700 mx-1" />
                : <div key={i} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>{s.n}</div>
                    <span className={`text-sm ${s.active ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                  </div>
            ))}
          </div>
        </div>
      )}

      {/* Form verifikasi */}
      <form onSubmit={handleSubmitVerif} className="space-y-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" /> Data Diri
          </h2>

          {/* Nama lengkap */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              Nama Lengkap <span className="text-red-400">*</span>
            </Label>
            <Input
              required placeholder="Sesuai KTP"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
            />
          </div>

          {/* NIP */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              NIP / NIDN / NIK <span className="text-red-400">*</span>
            </Label>
            <Input
              required placeholder="Nomor Induk Pegawai / NIDN / NIK KTP"
              value={form.nip}
              onChange={e => setForm(p => ({ ...p, nip: e.target.value }))}
              className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
            />
            <p className="text-xs text-slate-600">Isi salah satu: NIP (PNS), NIDN (dosen), atau NIK (KTP)</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Institusi
          </h2>

          {/* Institusi */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              Nama Institusi / Sekolah <span className="text-red-400">*</span>
            </Label>
            <Input
              required placeholder="Contoh: SMA Negeri 1 Semarang"
              value={form.institution}
              onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
              className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
            />
          </div>

          {/* Telepon */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">No. Telepon / WA</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <Input
                type="tel" placeholder="08xxxxxxxxxx"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="bg-slate-950 border-slate-700 text-white focus:border-blue-500 pl-9"
              />
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Alamat</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
              <textarea
                rows={2} placeholder="Alamat lengkap institusi"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-9 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Upload KTP */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" /> Foto KTP <span className="text-red-400 font-normal">*</span>
          </h2>

          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleKtpUpload(e.target.files[0]) }}
          />

          {ktpPreview ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ktpPreview} alt="KTP Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-xs text-white/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Foto KTP berhasil diunggah
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Ganti foto
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingKtp}
              className="w-full border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
              {uploadingKtp
                ? <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                : <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-400 transition-colors" />
              }
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">
                  {uploadingKtp ? 'Mengunggah...' : 'Klik untuk upload foto KTP'}
                </p>
                <p className="text-xs text-slate-600 mt-1">JPG, PNG, WebP · Maks 5MB</p>
              </div>
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" disabled={submitting || uploadingKtp}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-900/30">
          {submitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim Data...</>
            : <>{isRejected ? 'Kirim Ulang Data Verifikasi' : 'Kirim Data untuk Verifikasi'} <ArrowRight className="w-4 h-4 ml-2" /></>
          }
        </Button>
      </form>

      {/* Menu terkunci preview */}
      <div className="space-y-2 pt-2">
        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-3">
          Menu tersedia setelah terverifikasi
        </p>
        {[
          { icon: <BrainCircuit className="w-4 h-4" />, label: 'Bank Soal' },
          { icon: <BookOpen className="w-4 h-4" />, label: 'Materi' },
          { icon: <PlusCircle className="w-4 h-4" />, label: 'Tambah Soal' },
          { icon: <PlusCircle className="w-4 h-4" />, label: 'Tambah Materi' },
        ].map(m => <LockedMenuCard key={m.label} {...m} />)}
      </div>
    </div>
  )
}