'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Plus, Search, Loader2, Pencil, Trash2, Clock,
  HelpCircle, BetweenVerticalEnd, PlayCircle, StopCircle,
  CheckCheck, X, Gamepad2, Info, ToggleLeft, ToggleRight,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: number
  title: string
  description: string | null
  subject: string
  level: string
  duration: string | null
  thumbnail: string | null
  topics_count: number
  questions_count: number
  is_quiz_enabled: boolean
  created_at: string
}

type SortKey = 'created_at' | 'title' | 'questions_count'
type SortDir = 'asc' | 'desc'

// ─── Static config ────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sd:   { label: 'SD',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  smp:  { label: 'SMP',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  sma:  { label: 'SMA',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  umum: { label: 'Umum', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
}

const SUBJECT_MAP: Record<string, { label: string; color: string }> = {
  matematika: { label: 'Matematika', color: 'text-indigo-400' },
  ipa:        { label: 'IPA',        color: 'text-emerald-400' },
  ips:        { label: 'IPS',        color: 'text-amber-400' },
  bahasa:     { label: 'Bahasa',     color: 'text-rose-400' },
  umum:       { label: 'Umum',       color: 'text-slate-400' },
}

// ─── Small components ─────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const c = LEVEL_CONFIG[level] ?? { label: level, color: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' }
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{c.label}</span>
}

function SubjectBadge({ subject }: { subject: string }) {
  const c = SUBJECT_MAP[subject?.toLowerCase()] ?? { label: subject, color: 'text-slate-400' }
  return <span className={`text-[11px] font-semibold ${c.color}`}>{c.label}</span>
}

function QuizChip({ enabled }: { enabled: boolean }) {
  if (!enabled) return null
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400">
      <Gamepad2 className="w-2.5 h-2.5" /> Quiz Aktif
    </span>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function DeleteModal({ material, onConfirm, onCancel, loading }: {
  material: Material; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">Hapus Materi?</h3>
        <p className="text-slate-400 text-sm text-center mb-4">
          Materi dan semua soal yang tertaut akan dihapus permanen.
        </p>
        <div className="bg-slate-800/60 rounded-xl p-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">{material.thumbnail || '📚'}</span>
          <div>
            <p className="text-slate-200 text-sm font-semibold line-clamp-1">{material.title}</p>
            <p className="text-slate-500 text-xs">{material.questions_count} soal akan ikut terhapus</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuizToggleModal({ material, onConfirm, onCancel, loading }: {
  material: Material; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const enabling = !material.is_quiz_enabled
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${enabling ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-slate-700/50 border border-slate-600'}`}>
          {enabling ? <PlayCircle className="w-6 h-6 text-violet-400" /> : <StopCircle className="w-6 h-6 text-slate-400" />}
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">
          {enabling ? 'Aktifkan Solo Quiz?' : 'Nonaktifkan Solo Quiz?'}
        </h3>
        <p className="text-slate-400 text-sm text-center mb-4">
          {enabling
            ? 'Pemain bisa berlatih mandiri dari halaman materi ini.'
            : 'Tombol "Mulai Quiz" akan disembunyikan dari pemain.'}
        </p>
        {enabling && material.questions_count === 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-xs leading-relaxed">
              Materi ini belum memiliki soal. Quiz bisa diaktifkan, tapi belum bisa dimainkan sampai ada soal.
            </p>
          </div>
        )}
        <div className="bg-slate-800/60 rounded-xl p-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">{material.thumbnail || '📚'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-semibold truncate">{material.title}</p>
            <p className="text-slate-500 text-xs">{material.questions_count} soal</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${enabling ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Memproses...' : enabling ? 'Aktifkan Quiz' : 'Nonaktifkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkQuizModal({ count, action, materials, selectedIds, onConfirm, onCancel, loading }: {
  count: number; action: 'enable' | 'disable'
  materials: Material[]; selectedIds: Set<number>
  onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const selected = materials.filter(m => selectedIds.has(m.id))
  const noQ = selected.filter(m => m.questions_count === 0)
  const enabling = action === 'enable'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${enabling ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-slate-700/50 border border-slate-600'}`}>
          <Gamepad2 className={`w-6 h-6 ${enabling ? 'text-violet-400' : 'text-slate-400'}`} />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">
          {enabling ? `Aktifkan ${count} Solo Quiz?` : `Nonaktifkan ${count} Solo Quiz?`}
        </h3>
        <p className="text-slate-400 text-sm text-center mb-5">
          {enabling
            ? 'Semua materi yang dipilih akan bisa dimainkan sebagai Solo Quiz.'
            : 'Tombol quiz akan disembunyikan dari semua materi yang dipilih.'}
        </p>
        {enabling && noQ.length > 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-xs font-bold mb-1">{noQ.length} materi belum memiliki soal</p>
              <p className="text-amber-400/70 text-xs">Quiz diaktifkan tapi belum bisa dimainkan. Tambahkan soal terlebih dahulu.</p>
            </div>
          </div>
        )}
        <div className="bg-slate-800/50 rounded-xl p-3 mb-5 max-h-40 overflow-y-auto space-y-1.5">
          {selected.map(m => (
            <div key={m.id} className="flex items-center gap-2.5">
              <span className="text-base">{m.thumbnail || '📚'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs font-medium truncate">{m.title}</p>
                <p className="text-slate-500 text-[11px]">{m.questions_count} soal</p>
              </div>
              {m.questions_count === 0 && enabling && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${enabling ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Memproses...' : enabling ? `Aktifkan ${count} Quiz` : `Nonaktifkan ${count}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContributorMaterialsPage() {
  const supabase = createClient()

  const [materials, setMaterials]     = useState<Material[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterQuiz, setFilterQuiz]   = useState<'all' | 'quiz' | 'no-quiz'>('all')
  const [sortKey, setSortKey]         = useState<SortKey>('created_at')
  const [sortDir, setSortDir]         = useState<SortDir>('desc')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectMode, setSelectMode]   = useState(false)

  // Modals
  const [deleteTarget, setDeleteTarget]           = useState<Material | null>(null)
  const [deleting, setDeleting]                   = useState(false)
  const [quizTarget, setQuizTarget]               = useState<Material | null>(null)
  const [togglingQuiz, setTogglingQuiz]           = useState(false)
  const [bulkAction, setBulkAction]               = useState<'enable' | 'disable' | null>(null)
  const [bulkLoading, setBulkLoading]             = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: mats } = await supabase
      .from('materials')
      .select('id, title, description, subject, level, duration, thumbnail, topics_count, is_quiz_enabled, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (!mats) { setLoading(false); return }

    const { data: qData } = await supabase
      .from('questions')
      .select('material_id')
      .eq('created_by', user.id)
      .not('material_id', 'is', null)

    const countMap = new Map<number, number>()
    qData?.forEach(q => { if (q.material_id) countMap.set(q.material_id, (countMap.get(q.material_id) || 0) + 1) })

    setMaterials(mats.map(m => ({
      ...m,
      is_quiz_enabled: m.is_quiz_enabled ?? false,
      questions_count: countMap.get(m.id) ?? 0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('materials').delete().eq('id', deleteTarget.id)
    setMaterials(p => p.filter(m => m.id !== deleteTarget.id))
    setSelectedIds(p => { const s = new Set(p); s.delete(deleteTarget.id); return s })
    setDeleting(false)
    setDeleteTarget(null)
  }

  // ── Single quiz toggle ─────────────────────────────────────────────────────

  async function handleQuizToggle() {
    if (!quizTarget) return
    setTogglingQuiz(true)
    const val = !quizTarget.is_quiz_enabled
    const { error } = await supabase.from('materials').update({ is_quiz_enabled: val }).eq('id', quizTarget.id)
    if (!error) setMaterials(p => p.map(m => m.id === quizTarget.id ? { ...m, is_quiz_enabled: val } : m))
    setTogglingQuiz(false)
    setQuizTarget(null)
  }

  // ── Bulk quiz toggle ───────────────────────────────────────────────────────

  async function handleBulkQuiz() {
    if (!bulkAction || selectedIds.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    const val = bulkAction === 'enable'
    const { error } = await supabase.from('materials').update({ is_quiz_enabled: val }).in('id', ids)
    if (!error) setMaterials(p => p.map(m => selectedIds.has(m.id) ? { ...m, is_quiz_enabled: val } : m))
    setBulkLoading(false)
    setBulkAction(null)
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  function toggleSelect(id: number) {
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function selectAll() { setSelectedIds(new Set(filtered.map(m => m.id))) }

  function clearSelect() { setSelectedIds(new Set()); setSelectMode(false) }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = materials
    .filter(m => {
      const q = search.toLowerCase()
      const matchS = !q || m.title.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)
      const matchL = filterLevel === 'all' || m.level === filterLevel
      const matchQ = filterQuiz === 'all' || (filterQuiz === 'quiz' && m.is_quiz_enabled) || (filterQuiz === 'no-quiz' && !m.is_quiz_enabled)
      return matchS && matchL && matchQ
    })
    .sort((a, b) => {
      let v = 0
      if (sortKey === 'title')           v = a.title.localeCompare(b.title)
      else if (sortKey === 'questions_count') v = a.questions_count - b.questions_count
      else                               v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortDir === 'asc' ? v : -v
    })

  const totalQ     = materials.reduce((s, m) => s + m.questions_count, 0)
  const quizCount  = materials.filter(m => m.is_quiz_enabled).length
  const selArr     = materials.filter(m => selectedIds.has(m.id))
  const selQon     = selArr.filter(m => m.is_quiz_enabled).length
  const selQoff    = selArr.filter(m => !m.is_quiz_enabled).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {deleteTarget && <DeleteModal material={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
      {quizTarget   && <QuizToggleModal material={quizTarget} onConfirm={handleQuizToggle} onCancel={() => setQuizTarget(null)} loading={togglingQuiz} />}
      {bulkAction   && (
        <BulkQuizModal
          count={selectedIds.size} action={bulkAction}
          materials={materials} selectedIds={selectedIds}
          onConfirm={handleBulkQuiz} onCancel={() => setBulkAction(null)} loading={bulkLoading}
        />
      )}

      <div className="space-y-5 pb-10 font-sans">

        {/* ════ HEADER ════ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-blue-400" /> Materi Saya
            </h1>
            <p className="text-slate-400 text-sm mt-1">Kelola materi dan aktifkan sebagai Solo Quiz untuk pemain.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode(s => !s); if (selectMode) clearSelect() }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectMode
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}>
              <CheckCheck className="w-4 h-4" />
              {selectMode ? 'Mode Pilih' : 'Pilih Banyak'}
            </button>
            <Link href="/contributor/materials/new">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30 transition-colors">
                <Plus className="w-4 h-4" /> Buat Materi
              </button>
            </Link>
          </div>
        </div>

        {/* ════ STATS ════ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: 'Total Materi', value: materials.length, color: 'text-white',      bg: 'bg-slate-800/60 border-slate-700', icon: null },
            { label: 'Total Soal',   value: totalQ,           color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20', icon: null },
            { label: 'Aktif Quiz',   value: quizCount,        color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: Gamepad2 },
            { label: 'SD',   value: materials.filter(m => m.level === 'sd').length,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',   icon: null },
            { label: 'SMP',  value: materials.filter(m => m.level === 'smp').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: null },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl p-4 border ${s.bg}`}>
              <div className="flex items-center gap-1 mb-1">
                {s.icon && <s.icon className={`w-3 h-3 ${s.color}`} />}
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{s.label}</p>
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ════ FILTER + SORT ════ */}
        <div className="flex flex-col gap-2.5">
          {/* Row 1: search + level filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                placeholder="Cari materi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm pl-9 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'sd', 'smp', 'sma', 'umum'] as const).map(l => (
                <button key={l} onClick={() => setFilterLevel(l)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    filterLevel === l
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {l === 'all' ? 'Semua' : LEVEL_CONFIG[l]?.label ?? l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: quiz filter + sort */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Quiz filter */}
            <div className="flex gap-1.5">
              {([
                { k: 'all',     lbl: 'Semua' },
                { k: 'quiz',    lbl: '🎮 Quiz Aktif' },
                { k: 'no-quiz', lbl: 'Non-Quiz' },
              ] as const).map(f => (
                <button key={f.k} onClick={() => setFilterQuiz(f.k)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    filterQuiz === f.k
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {f.lbl}
                </button>
              ))}
            </div>

            <div className="text-slate-700 text-xs font-bold hidden sm:block">|</div>

            {/* Sort */}
            <div className="flex gap-1.5">
              {([
                { k: 'created_at',      lbl: 'Terbaru' },
                { k: 'title',           lbl: 'A–Z' },
                { k: 'questions_count', lbl: 'Soal' },
              ] as const).map(s => (
                <button key={s.k} onClick={() => toggleSort(s.k)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                    sortKey === s.k
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}>
                  {s.lbl} {sortKey === s.k && <span className="text-[10px] opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════ BULK TOOLBAR ════ */}
        {selectMode && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-blue-500/20 rounded-2xl px-4 py-3">
            <button onClick={selectedIds.size > 0 && selectedIds.size === filtered.length ? clearSelect : selectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700">
              {selectedIds.size === filtered.length && filtered.length > 0
                ? <><X className="w-3.5 h-3.5" />Batal Semua</>
                : <><CheckCheck className="w-3.5 h-3.5" />Pilih Semua ({filtered.length})</>}
            </button>

            <span className="text-slate-600 text-xs hidden sm:block">|</span>

            <span className="text-slate-400 text-sm">
              {selectedIds.size > 0
                ? <><span className="text-white font-bold">{selectedIds.size}</span> dipilih</>
                : <span className="text-slate-600 text-xs">Klik materi untuk memilih</span>}
            </span>

            {selectedIds.size > 0 && (
              <>
                <div className="flex gap-1.5 ml-2 flex-wrap">
                  {selQoff > 0 && (
                    <button onClick={() => setBulkAction('enable')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-colors">
                      <PlayCircle className="w-3.5 h-3.5" />
                      Aktifkan Quiz <span className="opacity-70">({selQoff})</span>
                    </button>
                  )}
                  {selQon > 0 && (
                    <button onClick={() => setBulkAction('disable')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold transition-colors">
                      <StopCircle className="w-3.5 h-3.5" />
                      Nonaktifkan <span className="opacity-70">({selQon})</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={clearSelect}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-white text-xs font-bold transition-colors hover:bg-slate-800">
                  <X className="w-3.5 h-3.5" /> Batal Pilih
                </button>
              </>
            )}
          </div>
        )}

        {/* ════ INFO BANNER ════ */}
        <div className="flex items-start gap-3 bg-violet-500/8 border border-violet-500/20 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-violet-300/70 text-xs leading-relaxed">
            <span className="font-bold text-violet-300">Solo Quiz</span> — Aktifkan agar pemain bisa berlatih mandiri dari halaman materi.
            Materi tetap bisa dibaca tanpa quiz aktif. Tombol quiz hanya muncul jika diaktifkan dan minimal ada 1 soal.
          </p>
        </div>

        {/* ════ MATERIAL LIST ════ */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm">Memuat materi...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-slate-400 font-semibold text-sm">
              {materials.length === 0 ? 'Kamu belum membuat materi apapun.' : 'Tidak ada materi yang cocok dengan filter.'}
            </p>
            {materials.length === 0 && (
              <Link href="/contributor/materials/new">
                <button className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                  <Plus className="w-4 h-4" /> Buat Materi Pertama
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Result summary */}
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wide px-0.5">
              {filtered.length} materi
              {filtered.reduce((s, m) => s + m.questions_count, 0) > 0 && ` · ${filtered.reduce((s, m) => s + m.questions_count, 0)} soal`}
              {filtered.filter(m => m.is_quiz_enabled).length > 0 && ` · ${filtered.filter(m => m.is_quiz_enabled).length} aktif quiz`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filtered.map(m => {
                const isSelected = selectedIds.has(m.id)
                return (
                  <div key={m.id}
                    onClick={selectMode ? () => toggleSelect(m.id) : undefined}
                    className={`relative bg-slate-900 border rounded-xl p-4 flex gap-3.5 transition-all duration-150 ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20'
                        : m.is_quiz_enabled
                          ? 'border-violet-500/20 hover:border-violet-500/35'
                          : 'border-slate-800 hover:border-slate-700'
                    } ${selectMode ? 'cursor-pointer select-none' : ''}`}>

                    {/* Quiz active left accent stripe */}
                    {m.is_quiz_enabled && !isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                    )}

                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <div className="absolute top-3.5 right-3.5 z-10">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {isSelected && <CheckCheck className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-2xl shrink-0">
                      {m.thumbnail || '📚'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title + quiz chip */}
                      <div className="flex items-start gap-2 mb-1.5">
                        <p className="text-white font-semibold text-sm leading-snug flex-1 min-w-0 pr-1">
                          {m.title}
                        </p>
                        <QuizChip enabled={m.is_quiz_enabled} />
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <LevelBadge level={m.level} />
                        <SubjectBadge subject={m.subject} />
                        {m.duration && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {m.duration}
                          </span>
                        )}
                        <span className={`text-[11px] flex items-center gap-1 font-medium ${
                          m.questions_count === 0 ? 'text-amber-500/80' : 'text-slate-500'
                        }`}>
                          <HelpCircle className="w-3 h-3" />
                          {m.questions_count === 0 ? 'Belum ada soal' : `${m.questions_count} soal`}
                        </span>
                        {m.topics_count > 0 && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <BetweenVerticalEnd className="w-3 h-3" /> {m.topics_count} bagian
                          </span>
                        )}
                      </div>

                      {m.description && (
                        <p className="text-slate-500 text-[11px] line-clamp-1">{m.description}</p>
                      )}
                    </div>

                    {/* ── Action buttons — ALWAYS VISIBLE, not hover ── */}
                    {!selectMode && (
                      <div className="flex flex-col gap-1.5 shrink-0">

                        {/* Solo Quiz toggle */}
                        <button
                          onClick={e => { e.stopPropagation(); setQuizTarget(m) }}
                          title={m.is_quiz_enabled ? 'Nonaktifkan Solo Quiz' : 'Aktifkan Solo Quiz'}
                          className={`p-2 rounded-lg border transition-all ${
                            m.is_quiz_enabled
                              ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 hover:bg-violet-500/25 hover:border-violet-500/50'
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/25'
                          }`}>
                          {m.is_quiz_enabled
                            ? <ToggleRight className="w-4 h-4" />
                            : <ToggleLeft  className="w-4 h-4" />}
                        </button>

                        {/* Edit — blue */}
                        <Link href={`/contributor/materials/${m.id}`} onClick={e => e.stopPropagation()}>
                          <button
                            title="Edit Materi"
                            className="p-2 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Link>

                        {/* Delete — red */}
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(m) }}
                          title="Hapus Materi"
                          className="p-2 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}