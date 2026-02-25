'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft, Save, Loader2, BrainCircuit, CheckCircle2,
} from 'lucide-react'

const DIFFICULTIES = [
  { value: 'easy',   label: 'Mudah',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/40',  activeBg: 'bg-green-500/20 border-green-400' },
  { value: 'medium', label: 'Sedang', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', activeBg: 'bg-yellow-500/20 border-yellow-400' },
  { value: 'hard',   label: 'Sulit',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/40',       activeBg: 'bg-red-500/20 border-red-400' },
]

const OPTIONS: { key: 'A' | 'B' | 'C' | 'D'; field: 'option_a' | 'option_b' | 'option_c' | 'option_d' }[] = [
  { key: 'A', field: 'option_a' },
  { key: 'B', field: 'option_b' },
  { key: 'C', field: 'option_c' },
  { key: 'D', field: 'option_d' },
]

export default function EditQuestionPage() {
  const { id } = useParams()
  const router  = useRouter()
  const supabase = createClient()

  const [fetching, setFetching]   = useState(true)
  const [saving, setSaving]       = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const [form, setForm] = useState({
    question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty: 'medium',
    category_id: '',
  })

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: q, error }] = await Promise.all([
        supabase.from('categories').select('id, name'),
        supabase.from('questions').select('*').eq('id', id).single(),
      ])

      if (cats) setCategories(cats)

      if (error || !q) {
        alert('Soal tidak ditemukan.')
        router.push('/admin/questions')
        return
      }

      setForm({
        question_text: q.question_text || '',
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_answer: q.correct_answer || 'A',
        difficulty: q.difficulty || 'medium',
        category_id: q.category_id ? String(q.category_id) : '',
      })
      setFetching(false)
    }

    if (id) load()
  }, [id])

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      alert('Semua opsi jawaban (A, B, C, D) harus diisi.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('questions').update({
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }).eq('id', id)

      if (error) throw error
      router.push('/admin/questions')
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-5 h-5 animate-spin" /> Memuat data soal...
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}
          className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-400" /> Edit Soal
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Perbarui konten soal yang sudah ada.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Teks Pertanyaan */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
          <Label className="text-slate-300 font-semibold">Teks Pertanyaan <span className="text-red-400">*</span></Label>
          <textarea
            required
            rows={4}
            value={form.question_text}
            onChange={e => set('question_text', e.target.value)}
            placeholder="Tulis pertanyaan di sini..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Opsi Jawaban */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-slate-300 font-semibold">Opsi Jawaban <span className="text-red-400">*</span></Label>
            <span className="text-xs text-slate-500">Klik label opsi untuk menjadikannya kunci jawaban</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OPTIONS.map(({ key, field }) => {
              const isCorrect = form.correct_answer === key
              return (
                <div key={key}
                  className={`rounded-xl border transition-all ${
                    isCorrect
                      ? 'border-green-500/60 bg-green-500/5'
                      : 'border-slate-700 bg-slate-950/50'
                  }`}>
                  <button
                    type="button"
                    onClick={() => set('correct_answer', key)}
                    className={`w-full flex items-center gap-2 px-3 pt-2.5 pb-1 text-left transition-colors rounded-t-xl ${
                      isCorrect ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                      isCorrect
                        ? 'bg-green-500 border-green-400 text-white'
                        : 'border-slate-600 text-slate-400'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : key}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {isCorrect ? 'Kunci Jawaban ✓' : `Opsi ${key}`}
                    </span>
                  </button>
                  <div className="px-3 pb-3">
                    <Input
                      required
                      placeholder={`Jawaban ${key}...`}
                      value={form[field]}
                      onChange={e => set(field, e.target.value)}
                      className={`bg-transparent border-0 border-b text-white placeholder:text-slate-600 rounded-none focus-visible:ring-0 px-0 text-sm h-9 ${
                        isCorrect ? 'border-green-700' : 'border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Kunci jawaban saat ini: <span className="font-bold text-green-400">Opsi {form.correct_answer}</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <Label className="text-slate-300 font-semibold block">Pengaturan Soal</Label>

          <div className="space-y-2">
            <Label className="text-slate-500 text-xs uppercase tracking-wide">Tingkat Kesulitan</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d.value} type="button"
                  onClick={() => set('difficulty', d.value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                    form.difficulty === d.value
                      ? `${d.activeBg} ${d.color}`
                      : `${d.bg} text-slate-500 hover:text-slate-300`
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-500 text-xs uppercase tracking-wide">Kategori</Label>
            <select
              value={form.category_id}
              onChange={e => set('category_id', e.target.value)}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Tanpa Kategori —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}
            className="text-slate-400 hover:text-white hover:bg-slate-800">
            Batal
          </Button>
          <Button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] shadow-lg shadow-indigo-900/30">
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>
            }
          </Button>
        </div>

      </form>
    </div>
  )
}