'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  BrainCircuit, Plus, Search, Loader2, Pencil, Trash2,
  CheckCircle2, Filter, BookOpen, ChevronDown,
  AlertCircle, Layers, GripVertical, ArrowUpDown, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number
  question_text: string
  difficulty: 'easy' | 'medium' | 'hard'
  correct_answer: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  category_id: number | null
  material_id: number | null
  order_index: number
  created_at: string
  categories: { name: string } | null
  materials:  { id: number; title: string; thumbnail: string | null } | null
}

interface MaterialGroup {
  key: string
  material: Question['materials'] | null
  questions: Question[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFF_CONFIG = {
  easy:   { label: 'Mudah',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  dot: 'bg-green-400'  },
  medium: { label: 'Sedang', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  hard:   { label: 'Sulit',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',       dot: 'bg-red-400'    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DiffBadge({ d }: { d: Question['difficulty'] }) {
  const c = DIFF_CONFIG[d] ?? DIFF_CONFIG.medium
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function DiffMiniBar({ questions }: { questions: Question[] }) {
  const counts = {
    easy:   questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard:   questions.filter(q => q.difficulty === 'hard').length,
  }
  return (
    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
      {(['easy', 'medium', 'hard'] as const).map(d => counts[d] > 0 && (
        <span key={d} className={`flex items-center gap-1 text-xs font-semibold ${DIFF_CONFIG[d].color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${DIFF_CONFIG[d].dot}`} />
          {counts[d]} {DIFF_CONFIG[d].label}
        </span>
      ))}
      <span className="text-slate-600 text-xs">{questions.length} soal</span>
    </div>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ question, onConfirm, onCancel, loading }: {
  question: Question; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">Hapus Soal?</h3>
        <p className="text-slate-400 text-sm text-center mb-4">Soal ini akan dihapus permanen.</p>
        <div className="bg-slate-800/60 rounded-xl p-3 mb-5">
          <p className="text-slate-300 text-sm line-clamp-2">{question.question_text}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onCancel} disabled={loading}>Batal</Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Draggable Question Card ──────────────────────────────────────────────────

function QuestionCard({
  q, index, onDelete, reorderMode,
  onDragStart, onDragOver, onDrop, isDragging, isDragOver,
  onTouchStart, onTouchMove, onTouchEnd,
}: {
  q: Question
  index: number
  onDelete: (q: Question) => void
  reorderMode: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  isDragging: boolean
  isDragOver: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}) {
  return (
    <div
      data-drag-index={index}
      draggable={reorderMode}
      onDragStart={reorderMode ? onDragStart : undefined}
      onDragOver={reorderMode ? (e) => { e.preventDefault(); onDragOver(e) } : undefined}
      onDrop={reorderMode ? (e) => { e.preventDefault(); onDrop() } : undefined}
      onTouchStart={reorderMode ? onTouchStart : undefined}
      onTouchMove={reorderMode ? onTouchMove : undefined}
      onTouchEnd={reorderMode ? onTouchEnd : undefined}
      className={`
        flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all
        ${reorderMode ? 'touch-none select-none' : ''}
        ${isDragging  ? 'opacity-40 scale-[0.98]' : ''}
        ${isDragOver && !isDragging ? 'border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]' : ''}
        ${!isDragging && !isDragOver
          ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
          : ''
        }
        ${reorderMode ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* Drag handle / nomor */}
      <div className="shrink-0 mt-0.5 flex items-center">
        {reorderMode ? (
          <div className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-500">
            {index + 1}
          </div>
        )}
      </div>

      {/* Konten */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug line-clamp-2 mb-2 ${reorderMode ? 'text-slate-300' : 'text-white'}`}>
          {q.question_text}
        </p>
        {!reorderMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <DiffBadge d={q.difficulty} />
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500/80" />
              <span className="text-green-400/80 font-bold">{q.correct_answer}.</span>
              <span className="text-slate-400 truncate max-w-[80px]">
                {(q[`option_${q.correct_answer.toLowerCase()}` as keyof Question] as string)?.slice(0, 20) || '—'}
              </span>
            </span>
            <span>
              {q.categories?.name && (
                <span className="text-[11px] text-slate-500 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full">
                  {q.categories.name}
                </span>
              )}
              <span className="text-[11px] text-slate-700 ml-2">
                {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </span>
          </div>
        )}
        {reorderMode && (
          <div className="flex items-center gap-2">
            <DiffBadge d={q.difficulty} />
          </div>
        )}
      </div>

      {/* Aksi (hanya saat bukan reorder mode) */}
      {!reorderMode && (
        <div className="flex items-center gap-0.5 shrink-0">
          <Link href={`/contributor/questions/${q.id}`}>
            <button className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Link>
          <button onClick={() => onDelete(q)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Material Group Card ──────────────────────────────────────────────────────

function MaterialGroupCard({
  group, onDelete, onReorder, defaultOpen = true,
}: {
  group: MaterialGroup
  onDelete: (q: Question) => void
  onReorder: (materialId: number | null, newOrder: Question[]) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen]               = useState(defaultOpen)
  const [reorderMode, setReorderMode] = useState(false)
  const [localQuestions, setLocalQuestions] = useState<Question[]>(group.questions)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  // Desktop drag state
  const dragIndexRef = useRef<number | null>(null)
  const [dragOver, setDragOver]       = useState<number | null>(null)

  // Mobile touch state
  const touchDragIndexRef  = useRef<number | null>(null)
  const touchLastOverRef   = useRef<number | null>(null)
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)

  const isUnlinked = !group.material

  // Sync jika grup berubah dari parent (e.g. setelah filter)
  useEffect(() => {
    if (!reorderMode) setLocalQuestions(group.questions)
  }, [group.questions, reorderMode])

  // ── Desktop drag handlers ──────────────────────────────────────────────────

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(index: number) {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    setDragOver(index)
  }

  function handleDrop(dropIndex: number) {
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null
      setDragOver(null)
      return
    }

    const reordered = [...localQuestions]
    const [moved]   = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)

    dragIndexRef.current = null
    setDragOver(null)
    setLocalQuestions(reordered)
  }

  // ── Mobile touch handlers ──────────────────────────────────────────────────

  function handleTouchStart(index: number, e: React.TouchEvent) {
    touchDragIndexRef.current = index
    touchLastOverRef.current  = index
    setTouchDragIndex(index)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchDragIndexRef.current === null) return
    // Prevent page scroll while dragging
    e.preventDefault()

    const touch   = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const card    = element?.closest('[data-drag-index]')

    if (card) {
      const overIndex = parseInt(card.getAttribute('data-drag-index') ?? '-1', 10)
      if (overIndex !== -1 && overIndex !== touchLastOverRef.current) {
        touchLastOverRef.current = overIndex
        setDragOver(overIndex)
      }
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dragIndex = touchDragIndexRef.current
    if (dragIndex === null) return

    const touch   = e.changedTouches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const card    = element?.closest('[data-drag-index]')

    if (card) {
      const dropIndex = parseInt(card.getAttribute('data-drag-index') ?? '-1', 10)
      if (dropIndex !== -1 && dropIndex !== dragIndex) {
        const reordered = [...localQuestions]
        const [moved]   = reordered.splice(dragIndex, 1)
        reordered.splice(dropIndex, 0, moved)
        setLocalQuestions(reordered)
      }
    }

    touchDragIndexRef.current = null
    touchLastOverRef.current  = null
    setTouchDragIndex(null)
    setDragOver(null)
  }

  // ── Save / cancel ──────────────────────────────────────────────────────────

  async function handleSaveOrder() {
    setSaving(true)
    await onReorder(group.material?.id ?? null, localQuestions)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setReorderMode(false) }, 1200)
  }

  function handleCancelReorder() {
    setLocalQuestions(group.questions)
    setReorderMode(false)
    setDragOver(null)
    dragIndexRef.current     = null
    touchDragIndexRef.current = null
    setTouchDragIndex(null)
  }

  const displayQuestions = reorderMode ? localQuestions : group.questions

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${
      isUnlinked ? 'border-slate-800 bg-slate-900/20' : 'border-slate-700/70 bg-slate-900/50'
    }`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Klik thumbnail/judul untuk toggle */}
        <button
          type="button"
          onClick={() => !reorderMode && setOpen(o => !o)}
          className="flex items-center gap-4 flex-1 min-w-0 text-left"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
            isUnlinked ? 'bg-slate-800/50 border-slate-700/50 text-slate-600' : 'bg-slate-800 border-slate-600/50'
          }`}>
            {isUnlinked ? <AlertCircle className="w-5 h-5" /> : (group.material?.thumbnail || '📚')}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm truncate ${isUnlinked ? 'text-slate-500 italic' : 'text-white'}`}>
              {isUnlinked ? 'Belum Ditautkan ke Materi' : group.material?.title}
            </p>
            <DiffMiniBar questions={displayQuestions} />
          </div>
        </button>

        {/* Aksi kanan */}
        <div className="flex items-center gap-2 shrink-0">
          {reorderMode ? (
            <div className="flex items-center gap-2">
              <button onClick={handleCancelReorder}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveOrder} disabled={saving || saved}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  saved
                    ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                }`}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
                {saved ? 'Tersimpan' : 'Simpan Urutan'}
              </button>
            </div>
          ) : (
            <>
              {!isUnlinked && open && displayQuestions.length > 1 && (
                <button
                  onClick={() => setReorderMode(true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">Atur Urutan</span>
                </button>
              )}
              {!isUnlinked && (
                <Link
                  href={`/contributor/questions/new?material_id=${group.material?.id}`}
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Tambah Soal</span>
                </Link>
              )}
              <button onClick={() => setOpen(o => !o)}
                className={`text-slate-500 transition-transform duration-200 p-1 ${open ? '' : '-rotate-90'}`}>
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Reorder hint banner ── */}
      {reorderMode && (
        <div className="mx-3 mb-2 bg-indigo-500/8 border border-indigo-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-indigo-400/60 shrink-0" />
          <p className="text-indigo-300/70 text-xs">
            Seret kartu soal untuk mengubah urutannya, lalu tekan <strong>Simpan Urutan</strong>.
          </p>
        </div>
      )}

      {/* ── Question list ── */}
      {open && (
        <div className={`px-3 pb-3 pt-1 space-y-1.5 ${
          isUnlinked ? 'border-t border-slate-800/60' : 'border-t border-slate-700/40'
        }`}>
          {displayQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              onDelete={onDelete}
              reorderMode={reorderMode}
              onDragStart={() => handleDragStart(i)}
              onDragOver={() => handleDragOver(i)}
              onDrop={() => handleDrop(i)}
              isDragging={
                (dragIndexRef.current === i && dragOver !== null) ||
                touchDragIndex === i
              }
              isDragOver={dragOver === i && (dragIndexRef.current !== i && touchDragIndex !== i)}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          ))}

          {isUnlinked && (
            <p className="text-xs text-slate-600 text-center py-2">
              Edit soal-soal ini dan pilih materi terkait agar muncul di Solo Quiz.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContributorQuestionsPage() {
  const supabase = createClient()

  const [questions, setQuestions]       = useState<Question[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterDiff, setFilterDiff]     = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('questions')
      .select(`
        id, question_text, difficulty, correct_answer,
        option_a, option_b, option_c, option_d,
        category_id, material_id, order_index, created_at,
        categories(name),
        materials(id, title, thumbnail)
      `)
      .eq('created_by', user.id)
      .order('material_id',  { ascending: true, nullsFirst: false })
      .order('order_index',  { ascending: true })
      .order('created_at',   { ascending: true })

    if (data) setQuestions(data as unknown as Question[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('questions').delete().eq('id', deleteTarget.id)
    if (!error) setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleReorder(materialId: number | null, newOrder: Question[]) {
    const updates = newOrder.map((q, i) =>
      supabase.from('questions').update({ order_index: i }).eq('id', q.id)
    )
    await Promise.all(updates)

    setQuestions(prev => {
      const orderMap = new Map(newOrder.map((q, i) => [q.id, i]))
      return prev.map(q =>
        orderMap.has(q.id) ? { ...q, order_index: orderMap.get(q.id)! } : q
      ).sort((a, b) => {
        if (a.material_id !== b.material_id) return (a.material_id ?? 0) - (b.material_id ?? 0)
        return a.order_index - b.order_index
      })
    })
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = questions.filter(q => {
    const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase()) ||
      (q.categories?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchDiff = filterDiff === 'all' || q.difficulty === filterDiff
    return matchSearch && matchDiff
  })

  const groups: MaterialGroup[] = (() => {
    const map = new Map<number | null, MaterialGroup>()
    filtered.forEach(q => {
      const key = q.material_id
      if (!map.has(key)) {
        map.set(key, { key: key ? String(key) : 'unlinked', material: q.materials, questions: [] })
      }
      map.get(key)!.questions.push(q)
    })
    return Array.from(map.values()).sort((a, b) => {
      if (!a.material && b.material) return 1
      if (a.material && !b.material) return -1
      return (a.material?.title ?? '').localeCompare(b.material?.title ?? '')
    })
  })()

  const stats = {
    total:    questions.length,
    easy:     questions.filter(q => q.difficulty === 'easy').length,
    medium:   questions.filter(q => q.difficulty === 'medium').length,
    hard:     questions.filter(q => q.difficulty === 'hard').length,
    linked:   questions.filter(q => q.material_id !== null).length,
    unlinked: questions.filter(q => q.material_id === null).length,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          question={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="space-y-6 pb-8 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="text-indigo-400" /> Bank Soal Saya
            </h1>
            <p className="text-slate-400 text-sm mt-1">Kelola soal-soal yang kamu buat.</p>
          </div>
          <Link href="/contributor/questions/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-900/30">
              <Plus className="w-4 h-4" /> Buat Soal Baru
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',     value: stats.total,    color: 'text-white',      bg: 'bg-slate-800/60 border-slate-700' },
            { label: 'Mudah',     value: stats.easy,     color: 'text-green-400',  bg: 'bg-green-500/5 border-green-500/20' },
            { label: 'Sedang',    value: stats.medium,   color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
            { label: 'Sulit',     value: stats.hard,     color: 'text-red-400',    bg: 'bg-red-500/5 border-red-500/20' },
            { label: 'Ditautkan', value: stats.linked,   color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3.5 border ${s.bg}`}>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Cari pertanyaan atau kategori..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white pl-9 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            {[
              { key: 'all',    label: 'Semua'  },
              { key: 'easy',   label: 'Mudah'  },
              { key: 'medium', label: 'Sedang' },
              { key: 'hard',   label: 'Sulit'  },
            ].map(d => (
              <button key={d.key} onClick={() => setFilterDiff(d.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filterDiff === d.key
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> Memuat soal...
          </div>

        ) : questions.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <BrainCircuit className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <p className="text-slate-300 font-bold">Belum ada soal</p>
              <p className="text-slate-500 text-sm mt-1">Mulai buat soal dan tautkan ke materi agar muncul di Solo Quiz.</p>
            </div>
            <Link href="/contributor/questions/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Buat Soal Pertama
              </Button>
            </Link>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Search className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-slate-400 font-semibold">Tidak ada soal yang cocok</p>
            <button onClick={() => { setSearch(''); setFilterDiff('all') }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline">
              Reset filter
            </button>
          </div>

        ) : (
          <div className="space-y-3">

            {/* Info bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Layers className="w-3.5 h-3.5" />
                <span>{groups.length} kelompok materi</span>
                <span className="text-slate-700">·</span>
                <span>{filtered.length} soal</span>
              </div>
              <Link href="/contributor/materials"
                className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <BookOpen className="w-3 h-3" /> Kelola Materi
              </Link>
            </div>

            {/* Groups */}
            {groups.map(group => (
              <MaterialGroupCard
                key={group.key}
                group={group}
                onDelete={setDeleteTarget}
                onReorder={handleReorder}
                defaultOpen={group.material !== null}
              />
            ))}

            {/* Warning unlinked */}
            {stats.unlinked > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500/50 shrink-0 mt-0.5" />
                <p className="text-amber-300/50 text-xs leading-relaxed">
                  <span className="font-semibold text-amber-300/70">{stats.unlinked} soal</span> belum ditautkan ke materi —
                  tidak akan muncul di Solo Quiz. Edit soal dan pilih materi terkait.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}