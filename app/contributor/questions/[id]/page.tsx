'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Loader2, BrainCircuit, CheckCircle2, ShieldAlert } from 'lucide-react'

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

export default function ContributorEditQuestionPage() {
  const { id } = useParams()
  const router  = useRouter()
  const supabase = createClient()

  const [fetching, setFetching]   = useState(true)
  const [saving, setSaving]       = useState(false)
  const [notOwner, setNotOwner]   = useState(false)
  const [saved, setSaved]         = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [materials, setMaterials]   = useState<{ id: number; title: string; thumbnail: string | null }[]>([])

  const [form, setForm] = useState({
    question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty: 'medium',
    category_id: '',
    material_id: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: cats }, { data: mats }, { data: q, error }] = await Promise.all([
        supabase.from('categories').select('id, name'),
        supabase.from('materials').select('id, title, thumbnail').eq('created_by', user.id).order('title'),
        supabase.from('questions').select('*').eq('id', id).single(),
      ])
      if (cats) setCategories(cats)
      if (mats) setMaterials(mats as any)

      if (error || !q) {
        alert('Soal tidak ditemukan.')
        router.push('/contributor/questions')
        return
      }

      // Cek kepemilikan — hanya boleh edit soal sendiri
      if (q.created_by !== user.id) {
        setNotOwner(true)
        setFetching(false)
        return
      }

      setForm({
        question_text:  q.question_text  || '',
        option_a:       q.option_a       || '',
        option_b:       q.option_b       || '',
        option_c:       q.option_c       || '',
        option_d:       q.option_d       || '',
        correct_answer: q.correct_answer || 'A',
        difficulty:     q.difficulty     || 'medium',
        category_id:    q.category_id ? String(q.category_id) : '',
        material_id:    q.material_id ? String(q.material_id) : '',
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
    const { error } = await supabase
      .from('questions')
      .update({
        question_text:  form.question_text,
        option_a:       form.option_a,
        option_b:       form.option_b,
        option_c:       form.option_c,
        option_d:       form.option_d,
        correct_answer: form.correct_answer,
        difficulty:     form.difficulty,
        category_id:    form.category_id ? parseInt(form.category_id) : null,
        material_id:    form.material_id || null,
      })
      .eq('id', id)

    setSaving(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }

    setSaved(true)
    setTimeout(() => { router.push('/contributor/questions'); router.refresh() }, 1000)
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      Memuat soal...
    </div>
  )

  // ── Bukan pemilik ────────────────────────────────────────────────────────

  if (notOwner) return (
    <div className="max-w-md mx-auto text-center py-20 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white">Akses Ditolak</h2>
      <p className="text-slate-400 text-sm">Kamu hanya bisa mengedit soal yang kamu buat sendiri.</p>
      <Button onClick={() => router.push('/contributor/questions')}
        className="bg-slate-700 hover:bg-slate-600 text-white gap-2">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Bank Soal
      </Button>
    </div>
  )

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Button variant="ghost" size="icon" onClick={() => router.back()}
          className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-emerald-400 shrink-0" /> Edit Soal
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Perbarui soal yang kamu buat.</p>
        </div>
      </div>

      {/* Success */}
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 font-semibold text-sm">Soal berhasil disimpan! Mengalihkan...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Pertanyaan */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-400" /> Pertanyaan
          </h2>
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              Teks Pertanyaan <span className="text-red-400">*</span>
            </Label>
            <textarea required rows={4} value={form.question_text}
              onChange={e => set('question_text', e.target.value)}
              placeholder="Tulis pertanyaan di sini..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Opsi Jawaban */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Opsi Jawaban</h2>
            <span className="text-[11px] text-slate-600">Klik label opsi → set sebagai kunci</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OPTIONS.map(({ key, field }) => {
              const isCorrect = form.correct_answer === key
              return (
                <div key={key} className={`rounded-xl border transition-all ${isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-950/50'}`}>
                  <button type="button" onClick={() => set('correct_answer', key)}
                    className={`w-full flex items-center gap-2 px-3 pt-2.5 pb-1 text-left rounded-t-xl ${isCorrect ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${isCorrect ? 'bg-green-500 border-green-400 text-white' : 'border-slate-600 text-slate-400'}`}>
                      {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : key}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      {isCorrect ? '✓ Kunci Jawaban' : `Opsi ${key}`}
                    </span>
                  </button>
                  <div className="px-3 pb-3">
                    <Input required value={form[field]} onChange={e => set(field, e.target.value)}
                      placeholder={`Jawaban ${key}...`}
                      className={`bg-transparent border-0 border-b text-white text-sm placeholder:text-slate-600 rounded-none focus-visible:ring-0 px-0 h-8 ${isCorrect ? 'border-green-800' : 'border-slate-800'}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
          <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Tingkat Kesulitan</Label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d.value} type="button" onClick={() => set('difficulty', d.value)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  form.difficulty === d.value ? `${d.activeBg} ${d.color}` : `${d.bg} text-slate-500 hover:text-slate-300`
                }`}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Info kategori */}
          <div className="mt-2 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-blue-400/60 text-xs">ℹ</span>
            <p className="text-blue-300/50 text-xs">Kategori soal akan ditentukan oleh admin setelah di-review.</p>
          </div>
        </div>

        {/* Kategori */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
          <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Kategori</Label>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
          >
            <option value="">— Pilih kategori (opsional) —</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Materi Terkait */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
          <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Materi Terkait</Label>
          <select
            value={form.material_id}
            onChange={e => set('material_id', e.target.value)}
            className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">— Tanpa Materi —</option>
            {materials.map(m => (
              <option key={m.id} value={String(m.id)}>{m.thumbnail} {m.title}</option>
            ))}
          </select>
          <p className="text-xs text-slate-600">Soal ini akan muncul di Solo Quiz materi yang dipilih.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={() => router.back()}
            className="text-slate-400 hover:text-white hover:bg-slate-800">Batal</Button>
          <Button type="submit" disabled={saving || saved}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] shadow-lg shadow-emerald-900/30">
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