'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft, Save, Loader2, BrainCircuit,
  CheckCircle2, Plus, Trash2, ChevronDown, ChevronUp, Copy,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionForm {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  category_id: string
  collapsed: boolean
}

const DIFFICULTIES = [
  { value: 'easy',   label: 'Mudah',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/40',  activeBg: 'bg-green-500/20 border-green-400' },
  { value: 'medium', label: 'Sedang', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', activeBg: 'bg-yellow-500/20 border-yellow-400' },
  { value: 'hard',   label: 'Sulit',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/40',       activeBg: 'bg-red-500/20 border-red-400' },
] as const

const OPTION_KEYS   = ['A', 'B', 'C', 'D'] as const
const OPTION_FIELDS = ['option_a', 'option_b', 'option_c', 'option_d'] as const

function emptyQuestion(): QuestionForm {
  return {
    id: Math.random().toString(36).slice(2),
    question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A',
    difficulty: 'medium',
    category_id: '',
    collapsed: false,
  }
}

// ─── Single Question Card ─────────────────────────────────────────────────────

function QuestionCard({
  q, index, total, categories,
  onChange, onRemove, onDuplicate, onToggleCollapse,
}: {
  q: QuestionForm
  index: number
  total: number
  categories: { id: number; name: string }[]
  onChange: (field: keyof QuestionForm, value: string) => void
  onRemove: () => void
  onDuplicate: () => void
  onToggleCollapse: () => void
}) {
  const isValid = !!(q.question_text && q.option_a && q.option_b && q.option_c && q.option_d)
  const diffColor = q.difficulty === 'easy' ? 'text-green-400' : q.difficulty === 'hard' ? 'text-red-400' : 'text-yellow-400'
  const diffLabel = q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'hard' ? 'Sulit' : 'Sedang'

  return (
    <div className={`bg-slate-900 rounded-2xl border transition-colors overflow-hidden ${
      isValid ? 'border-slate-700' : 'border-slate-800'
    }`}>

      {/* ── Header (selalu tampil, klik untuk collapse) ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isValid ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {isValid ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate max-w-sm md:max-w-lg">
              {q.question_text || <span className="text-slate-500 italic font-normal">Soal {index + 1} — belum diisi</span>}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-bold ${diffColor}`}>{diffLabel}</span>
              {q.category_id && categories.find(c => String(c.id) === q.category_id) && (
                <><span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{categories.find(c => String(c.id) === q.category_id)?.name}</span></>
              )}
              <span className="text-slate-700">·</span>
              <span className="text-xs text-green-500">Kunci: {q.correct_answer}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button type="button"
            onClick={e => { e.stopPropagation(); onDuplicate() }}
            title="Duplikat soal ini"
            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {total > 1 && (
            <button type="button"
              onClick={e => { e.stopPropagation(); onRemove() }}
              title="Hapus soal ini"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="p-1.5 text-slate-600">
            {q.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ── Body (collapsed/expanded) ── */}
      {!q.collapsed && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-800">

          {/* Teks Pertanyaan */}
          <div className="space-y-2 pt-4">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              Teks Pertanyaan <span className="text-red-400">*</span>
            </Label>
            <textarea
              rows={3}
              value={q.question_text}
              onChange={e => onChange('question_text', e.target.value)}
              placeholder="Tulis pertanyaan di sini..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Opsi Jawaban */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
                Opsi Jawaban <span className="text-red-400">*</span>
              </Label>
              <span className="text-[11px] text-slate-600">Klik label opsi → set sebagai kunci</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {OPTION_KEYS.map((key, ki) => {
                const field = OPTION_FIELDS[ki]
                const isCorrect = q.correct_answer === key
                return (
                  <div key={key} className={`rounded-xl border transition-all ${
                    isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-950/50'
                  }`}>
                    <button type="button" onClick={() => onChange('correct_answer', key)}
                      className={`w-full flex items-center gap-2 px-3 pt-2 pb-1 text-left rounded-t-xl transition-colors ${
                        isCorrect ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                        isCorrect ? 'bg-green-500 border-green-400 text-white' : 'border-slate-600 text-slate-400'
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : key}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        {isCorrect ? '✓ Kunci Jawaban' : `Opsi ${key}`}
                      </span>
                    </button>
                    <div className="px-3 pb-2.5">
                      <Input
                        placeholder={`Jawaban ${key}...`}
                        value={q[field as keyof QuestionForm] as string}
                        onChange={e => onChange(field as keyof QuestionForm, e.target.value)}
                        className={`bg-transparent border-0 border-b text-white text-sm placeholder:text-slate-600 rounded-none focus-visible:ring-0 px-0 h-8 ${
                          isCorrect ? 'border-green-800' : 'border-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Difficulty + Kategori */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Kesulitan</Label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map(d => (
                  <button key={d.value} type="button"
                    onClick={() => onChange('difficulty', d.value)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      q.difficulty === d.value
                        ? `${d.activeBg} ${d.color}`
                        : `${d.bg} text-slate-500 hover:text-slate-300`
                    }`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Kategori</Label>
              <select
                value={q.category_id}
                onChange={e => onChange('category_id', e.target.value)}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Tanpa Kategori —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewQuestionPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading]       = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [questions, setQuestions]   = useState<QuestionForm[]>([emptyQuestion()])
  const [savedCount, setSavedCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateQuestion = (id: string, field: keyof QuestionForm, value: string) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))

  const removeQuestion = (id: string) =>
    setQuestions(prev => prev.filter(q => q.id !== id))

  const duplicateQuestion = (id: string) => {
    const source = questions.find(q => q.id === id)
    if (!source) return
    const clone: QuestionForm = { ...source, id: Math.random().toString(36).slice(2), collapsed: false }
    setQuestions(prev => {
      const idx  = prev.findIndex(q => q.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, clone)
      return next
    })
  }

  const toggleCollapse = (id: string) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, collapsed: !q.collapsed } : q))

  const collapseAll = () => setQuestions(prev => prev.map(q => ({ ...q, collapsed: true })))
  const expandAll   = () => setQuestions(prev => prev.map(q => ({ ...q, collapsed: false })))

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion()])
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 60)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        alert(`Soal #${i + 1}: Teks pertanyaan belum diisi.`)
        setQuestions(prev => prev.map((x, xi) => ({ ...x, collapsed: xi !== i })))
        return
      }
      if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        alert(`Soal #${i + 1}: Semua opsi jawaban (A–D) harus diisi.`)
        setQuestions(prev => prev.map((x, xi) => ({ ...x, collapsed: xi !== i })))
        return
      }
    }

    setLoading(true)
    try {
      const payload = questions.map(({ id, collapsed, ...q }) => ({
        ...q,
        category_id: q.category_id ? parseInt(q.category_id) : null,
      }))

      const { error } = await supabase.from('questions').insert(payload)
      if (error) throw error

      setSavedCount(questions.length)
      setTimeout(() => {
        router.push('/admin/questions')
        router.refresh()
      }, 1200)
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
      setLoading(false)
    }
  }

  const validCount = questions.filter(q =>
    q.question_text && q.option_a && q.option_b && q.option_c && q.option_d
  ).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-28 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Button variant="ghost" size="icon" onClick={() => router.back()}
          className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-400 shrink-0" /> Buat Soal Baru
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {questions.length} soal · <span className={validCount === questions.length && validCount > 0 ? 'text-green-400' : 'text-slate-500'}>{validCount} siap disimpan</span>
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={collapseAll}
            className="text-xs text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            Tutup Semua
          </button>
          <button type="button" onClick={expandAll}
            className="text-xs text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            Buka Semua
          </button>
        </div>
      </div>

      {/* Success flash */}
      {savedCount !== null && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-300 font-semibold text-sm">
            {savedCount} soal berhasil disimpan! Mengalihkan ke daftar soal...
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Question Cards */}
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id} q={q} index={i} total={questions.length} categories={categories}
            onChange={(field, value) => updateQuestion(q.id, field, value)}
            onRemove={() => removeQuestion(q.id)}
            onDuplicate={() => duplicateQuestion(q.id)}
            onToggleCollapse={() => toggleCollapse(q.id)}
          />
        ))}

        {/* Tombol Tambah */}
        <button type="button" onClick={addQuestion}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-semibold text-sm">
          <Plus className="w-4 h-4" /> Tambah Soal Lagi
        </button>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-2 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-2xl shadow-black/60">
              <div className="text-sm text-slate-400">
                <span className="text-white font-bold">{questions.length}</span> soal ·{' '}
                <span className={validCount === questions.length && validCount > 0 ? 'text-green-400 font-bold' : 'text-amber-400'}>
                  {validCount}/{questions.length} siap
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => router.back()}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 text-sm">
                  Batal
                </Button>
                <Button type="submit"
                  disabled={loading || validCount === 0 || savedCount !== null}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] h-9 text-sm shadow-lg shadow-indigo-900/40">
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                    : <><Save className="w-4 h-4 mr-2" /> Simpan {questions.length} Soal</>
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}