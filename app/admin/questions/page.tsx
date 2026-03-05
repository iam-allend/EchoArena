'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, BookOpen, BrainCircuit, Pencil, Trash2, Loader2,
  ChevronDown, ChevronRight, ChevronLeft, X, User, RefreshCw,
  Layers, Tag,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  category_id: number | null
  created_by: string | null
  created_at: string
  categories: { name: string } | null
  creator_username?: string
}

interface Category { id: number; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFF = {
  easy:   { label: 'Mudah',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25' },
  medium: { label: 'Sedang', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25' },
  hard:   { label: 'Sulit',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
} as const

function DiffBadge({ d }: { d: string }) {
  const c = DIFF[d as keyof typeof DIFF] ?? { label: d, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' }
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${c.bg} ${c.color}`}>{c.label}</span>
}

/** Letter + first 3 words of the answer option */
function answerPreview(q: Question, key: 'A' | 'B' | 'C' | 'D') {
  const raw = (q[`option_${key.toLowerCase()}` as keyof Question] as string) ?? ''
  const words = raw.trim().split(/\s+/)
  const preview = words.slice(0, 3).join(' ') + (words.length > 3 ? '…' : '')
  return `${key}. ${preview}`
}

const PAGE_SIZE = 20

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ q, onConfirm, onCancel, loading }: {
  q: Question; onConfirm(): void; onCancel(): void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-11 h-11 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-base font-bold text-white text-center mb-1">Hapus Soal?</h3>
        <p className="text-slate-400 text-xs text-center mb-4">Soal ini akan dihapus permanen.</p>
        <div className="bg-slate-800/60 rounded-xl p-3 mb-5">
          <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">{q.question_text}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminQuestionsPage() {
  const supabase = createClient()

  const [questions, setQuestions]   = useState<Question[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  // Filters
  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDsearch] = useState('')
  const [filterCat, setFilterCat]     = useState<number | 'all'>('all')
  const [filterDiff, setFilterDiff]   = useState<string>('all')
  const [filterCreator, setFilterCreator] = useState('')
  const [groupBy, setGroupBy]         = useState<'none' | 'category' | 'difficulty'>('none')
  const [page, setPage]               = useState(1)

  // Modal
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Collapsed groups
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDsearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Load categories
  useEffect(() => {
    supabase.from('categories').select('id, name').order('name')
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  // Fetch
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, category_id, created_by, created_at, categories (name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (debouncedSearch) q = q.ilike('question_text', `%${debouncedSearch}%`)
    if (filterCat !== 'all') q = q.eq('category_id', filterCat)
    if (filterDiff !== 'all') q = q.eq('difficulty', filterDiff)

    const { data, count } = await q
    if (!data) { setLoading(false); return }

    // Enrich with usernames
    const ids = [...new Set(data.map(r => r.created_by).filter(Boolean))] as string[]
    const umap: Record<string, string> = {}
    if (ids.length) {
      const { data: users } = await supabase.from('users').select('id, username').in('id', ids)
      users?.forEach(u => { umap[u.id] = u.username })
    }

    let enriched: Question[] = data.map(r => ({
      ...r,
      categories: Array.isArray(r.categories) ? (r.categories[0] ?? null) : r.categories,
      creator_username: r.created_by ? (umap[r.created_by] ?? '—') : '—',
    }))

    if (filterCreator)
      enriched = enriched.filter(r => r.creator_username?.toLowerCase().includes(filterCreator.toLowerCase()))

    setQuestions(enriched)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, debouncedSearch, filterCat, filterDiff, filterCreator])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])
  useEffect(() => { setPage(1) }, [debouncedSearch, filterCat, filterDiff, filterCreator])

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('questions').delete().eq('id', deleteTarget.id)
    if (!error) { setQuestions(p => p.filter(r => r.id !== deleteTarget.id)); setTotal(t => t - 1) }
    setDeleting(false); setDeleteTarget(null)
  }

  // Groups
  function getGroups() {
    if (groupBy === 'none') return [{ key: '_all', label: '', items: questions }]
    const map = new Map<string, Question[]>()
    questions.forEach(q => {
      const k = groupBy === 'category' ? (q.categories?.name ?? 'Tanpa Kategori') : (q.difficulty ?? 'unknown')
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(q)
    })
    return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([k, items]) => ({
      key: k,
      label: groupBy === 'difficulty' ? (DIFF[k as keyof typeof DIFF]?.label ?? k) : k,
      items,
    }))
  }

  const groups     = getGroups()
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilter  = search || filterCat !== 'all' || filterDiff !== 'all' || filterCreator

  function clearFilters() { setSearch(''); setFilterCat('all'); setFilterDiff('all'); setFilterCreator('') }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {deleteTarget && <DeleteModal q={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}

      <div className="space-y-5 pb-10 font-sans">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-indigo-400 w-6 h-6" /> Bank Soal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Kelola semua soal ·{' '}
              <span className="text-white font-semibold">{total.toLocaleString('id-ID')}</span> soal
            </p>
          </div>
          <Link href="/admin/questions/new">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 transition-colors">
              <Plus className="w-4 h-4" /> Buat Soal Baru
            </button>
          </Link>
        </div>

        {/* FILTER BAR */}
        <div className="space-y-2">
          {/* Row 1: search + creator + refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari teks soal..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm pl-9 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input value={filterCreator} onChange={e => setFilterCreator(e.target.value)}
                placeholder="Filter pembuat..."
                className="w-40 bg-slate-900 border border-slate-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-600" />
            </div>
            <button onClick={fetchQuestions} title="Refresh"
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Row 2: category + difficulty + group by + clear */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category dropdown */}
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <select value={filterCat === 'all' ? 'all' : String(filterCat)}
                onChange={e => setFilterCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]">
                <option value="all">Semua Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Difficulty */}
            <div className="flex gap-1.5">
              {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setFilterDiff(d)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    filterDiff === d
                      ? d === 'easy' ? 'bg-green-700 border-green-600 text-white'
                        : d === 'medium' ? 'bg-yellow-700 border-yellow-600 text-white'
                        : d === 'hard' ? 'bg-red-700 border-red-600 text-white'
                        : 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {d === 'all' ? 'Semua Level' : DIFF[d].label}
                </button>
              ))}
            </div>

            {/* Separator */}
            <span className="hidden sm:block text-slate-700 text-sm">|</span>

            {/* Group by */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-semibold hidden sm:block">Grup:</span>
              {([
                { k: 'none',       l: 'Tidak' },
                { k: 'category',   l: 'Kategori' },
                { k: 'difficulty', l: 'Kesulitan' },
              ] as const).map(g => (
                <button key={g.k} onClick={() => setGroupBy(g.k)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    groupBy === g.k
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}>{g.l}
                </button>
              ))}
            </div>

            {hasFilter && (
              <button onClick={clearFilters}
                className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-white bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <X className="w-3.5 h-3.5" /> Hapus Filter
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="space-y-1.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-[58px] bg-slate-900/60 rounded-xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
            <BrainCircuit className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-bold text-sm">Tidak ada soal ditemukan</p>
            <p className="text-slate-500 text-xs mt-1">Ubah filter atau buat soal baru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.key}>
                {/* Group header */}
                {groupBy !== 'none' && (
                  <button
                    onClick={() => setCollapsed(p => { const s = new Set(p); s.has(group.key) ? s.delete(group.key) : s.add(group.key); return s })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-colors mb-1.5">
                    {collapsed.has(group.key)
                      ? <ChevronRight className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="text-sm font-bold text-white">{group.label}</span>
                    <span className="ml-auto text-xs text-slate-500 font-semibold">{group.items.length} soal</span>
                  </button>
                )}

                {!collapsed.has(group.key) && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
                    {/* Table head */}
                    <div className="flex items-center gap-3 bg-slate-800/70 border-b border-slate-700/60 px-4 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-7 shrink-0">#</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex-1">Teks Soal</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-28 hidden md:block shrink-0">Kategori</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-16 hidden sm:block shrink-0">Level</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-36 hidden lg:block shrink-0">Jawaban Benar</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-24 hidden xl:block shrink-0">Pembuat</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-[72px] text-right shrink-0">Aksi</span>
                    </div>

                    {/* Rows */}
                    {group.items.map((q, idx) => (
                      <div key={q.id}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/25 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-900/40' : ''
                        }`}>

                        {/* Row number */}
                        <span className="text-slate-600 text-xs font-mono w-7 shrink-0">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </span>

                        {/* Question text + mobile meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm leading-snug line-clamp-2 font-medium">{q.question_text}</p>
                          {/* Mobile fallback meta */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap md:hidden">
                            {q.categories?.name && <span className="text-[11px] font-semibold text-indigo-400">{q.categories.name}</span>}
                            <DiffBadge d={q.difficulty} />
                            <span className="text-[11px] text-green-400 font-bold">✓ {answerPreview(q, q.correct_answer)}</span>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="w-28 shrink-0 hidden md:block">
                          <span className="text-[11px] font-semibold text-indigo-400 line-clamp-2 leading-tight">
                            {q.categories?.name ?? <span className="text-slate-600">—</span>}
                          </span>
                        </div>

                        {/* Difficulty */}
                        <div className="w-16 shrink-0 hidden sm:flex items-start">
                          <DiffBadge d={q.difficulty} />
                        </div>

                        {/* Correct answer + text */}
                        <div className="w-36 shrink-0 hidden lg:block">
                          <span className="text-[11px] font-bold text-green-400 line-clamp-2 leading-tight">
                            {answerPreview(q, q.correct_answer)}
                          </span>
                        </div>

                        {/* Creator */}
                        <div className="w-24 shrink-0 hidden xl:flex items-center gap-1 min-w-0">
                          <User className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="text-[11px] text-slate-500 truncate">{q.creator_username}</span>
                        </div>

                        {/* Actions — always visible */}
                        <div className="w-[72px] shrink-0 flex items-center justify-end gap-1.5">
                          <Link href={`/admin/questions/${q.id}`}>
                            <button title="Edit"
                              className="p-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/22 hover:border-blue-400/40 transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button title="Hapus" onClick={() => setDeleteTarget(q)}
                            className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/22 hover:border-red-400/40 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-500">
                  Hlm <span className="text-white font-bold">{page}</span> / <span className="text-white font-bold">{totalPages}</span>
                  {' '}· {total.toLocaleString('id-ID')} soal
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
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
                          page === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}>
                        {p}
                      </button>
                    ))
                  })()}

                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}