'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Save, Loader2, ArrowLeft, XCircle, BookOpen, GripVertical, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  title: string
  content: string
  examples: string[]
}

const SUBJECTS = ['matematika', 'sains', 'sejarah', 'sastra'] as const

const LEVELS = [
  { value: 'sd',   label: 'SD',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/40',  active: 'bg-green-500/20 border-green-400' },
  { value: 'smp',  label: 'SMP',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40', active: 'bg-yellow-500/20 border-yellow-400' },
  { value: 'sma',  label: 'SMA',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/40',       active: 'bg-red-500/20 border-red-400' },
  { value: 'umum', label: 'Umum', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/40',     active: 'bg-blue-500/20 border-blue-400' },
]

const EMOJIS = ['📚', '📐', '🔬', '🏛️', '📖', '🧮', '🌍', '🎨', '💡', '🔭']

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section, index, total,
  onChange, onRemove, onAddExample, onUpdateExample, onRemoveExample,
}: {
  section: Section; index: number; total: number
  onChange: (field: keyof Section, value: string) => void
  onRemove: () => void; onAddExample: () => void
  onUpdateExample: (i: number, v: string) => void
  onRemoveExample: (i: number) => void
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bagian {index + 1}</span>
        </div>
        {total > 1 && (
          <button type="button" onClick={onRemove}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Judul Bagian</Label>
          <Input placeholder={`Contoh: Bab ${index + 1} — Pengantar`} value={section.title}
            onChange={e => onChange('title', e.target.value)}
            className="bg-slate-950 border-slate-700 text-white font-semibold focus:border-emerald-500" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Penjelasan Materi</Label>
          <textarea rows={5} placeholder="Tulis konten materi lengkap di sini..."
            value={section.content} onChange={e => onChange('content', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-y" />
        </div>
        <div className="space-y-2 pl-4 border-l-2 border-slate-700">
          <Label className="text-slate-500 text-xs uppercase tracking-wide font-bold">Contoh / Studi Kasus</Label>
          <div className="space-y-2">
            {section.examples.map((ex, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder={`Contoh ${i + 1}`} value={ex}
                  onChange={e => onUpdateExample(i, e.target.value)}
                  className="bg-slate-950 border-slate-700 text-sm text-white focus:border-emerald-500" />
                <button type="button" onClick={() => onRemoveExample(i)}
                  disabled={section.examples.length === 1}
                  className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={onAddExample}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> Tambah Contoh
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContributorNewMaterialPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', subject: '', level: '', duration: '', thumbnail: '📚',
  })
  const [sections, setSections] = useState<Section[]>([
    { title: '', content: '', examples: [''] },
  ])

  const setField = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const addSection    = () => setSections(prev => [...prev, { title: '', content: '', examples: [''] }])
  const removeSection = (i: number) => setSections(prev => prev.filter((_, idx) => idx !== i))
  const updateSection = (i: number, field: keyof Section, value: string) =>
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  const addExample    = (si: number) =>
    setSections(prev => prev.map((s, idx) => idx === si ? { ...s, examples: [...s.examples, ''] } : s))
  const updateExample = (si: number, ei: number, value: string) =>
    setSections(prev => prev.map((s, idx) => idx === si ? { ...s, examples: s.examples.map((e, i) => i === ei ? value : e) } : s))
  const removeExample = (si: number, ei: number) =>
    setSections(prev => prev.map((s, idx) => idx === si ? { ...s, examples: s.examples.filter((_, i) => i !== ei) } : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject) { alert('Pilih Mata Pelajaran terlebih dahulu.'); return }
    if (!form.level)   { alert('Pilih Tingkat terlebih dahulu.'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { error } = await supabase.from('materials').insert({
        title:        form.title,
        description:  form.description,
        subject:      form.subject,
        level:        form.level,
        duration:     form.duration || null,
        thumbnail:    form.thumbnail || '📚',
        content:      sections,
        topics_count: sections.length,
        created_by:   user.id,   // ← tandai milik kontributor ini
      })
      if (error) throw error

      setSaved(true)
      setTimeout(() => { router.push('/contributor/materials'); router.refresh() }, 1200)
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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
            <BookOpen className="text-emerald-400" /> Buat Materi Baru
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Tambahkan modul pembelajaran baru.</p>
        </div>
      </div>

      {/* Success */}
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 font-semibold text-sm">Materi berhasil disimpan! Mengalihkan...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Informasi Dasar */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Informasi Dasar</h2>

          {/* Judul + Ikon */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
                Judul Materi <span className="text-red-400">*</span>
              </Label>
              <Input required placeholder="Contoh: Aljabar Dasar" value={form.title}
                onChange={e => setField('title', e.target.value)}
                className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Ikon</Label>
              <Input value={form.thumbnail} onChange={e => setField('thumbnail', e.target.value)}
                className="bg-slate-950 border-slate-700 text-white w-20 text-center text-xl focus:border-emerald-500" maxLength={2} />
              <div className="flex gap-1 flex-wrap w-20">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setField('thumbnail', e)}
                    className="text-base hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Deskripsi Singkat</Label>
            <textarea rows={3} placeholder="Jelaskan secara singkat tentang materi ini..."
              value={form.description} onChange={e => setField('description', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
              Mata Pelajaran <span className="text-red-400">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => setField('subject', s)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold capitalize transition-all ${
                    form.subject === s
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Level + Durasi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">
                Tingkat <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map(l => (
                  <button key={l.value} type="button" onClick={() => setField('level', l.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                      form.level === l.value ? `${l.active} ${l.color}` : `${l.bg} text-slate-500 hover:text-slate-300`
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wide font-bold">Estimasi Durasi</Label>
              <Input placeholder="Contoh: 15 Menit" value={form.duration}
                onChange={e => setField('duration', e.target.value)}
                className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500" />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Isi Materi</h2>
              <p className="text-slate-500 text-xs mt-0.5">{sections.length} bagian</p>
            </div>
            <Button type="button" onClick={addSection} variant="outline"
              className="border-dashed border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white gap-2">
              <Plus className="w-4 h-4" /> Tambah Bagian
            </Button>
          </div>
          {sections.map((s, i) => (
            <SectionCard key={i} section={s} index={i} total={sections.length}
              onChange={(f, v) => updateSection(i, f, v)}
              onRemove={() => removeSection(i)}
              onAddExample={() => addExample(i)}
              onUpdateExample={(ei, v) => updateExample(i, ei, v)}
              onRemoveExample={ei => removeExample(i, ei)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={() => router.back()}
            className="text-slate-400 hover:text-white hover:bg-slate-800">Batal</Button>
          <Button type="submit" disabled={loading || saved}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px] shadow-lg shadow-emerald-900/30">
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              : <><Save className="w-4 h-4 mr-2" /> Simpan Materi</>
            }
          </Button>
        </div>
      </form>
    </div>
  )
}