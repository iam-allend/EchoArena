'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Plus, Search, Loader2, Pencil, Trash2, Clock, HelpCircle, BetweenVerticalEnd,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  questions_count: number          // jumlah soal yang tertaut (milik kontributor ini)
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sd:   { label: 'SD',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  smp:  { label: 'SMP',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  sma:  { label: 'SMA',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  umum: { label: 'Umum', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
}

function LevelBadge({ level }: { level: string }) {
  const c = LEVEL_CONFIG[level] ?? { label: level, color: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  )
}

// Subject badge
function SubjectBadge({ subject }: { subject: string }) {
  const subjectMap: Record<string, { label: string; color: string }> = {
    matematika: { label: 'Matematika', color: 'text-indigo-400' },
    ipa:        { label: 'IPA',        color: 'text-emerald-400' },
    ips:        { label: 'IPS',        color: 'text-amber-400' },
    bahasa:     { label: 'Bahasa',     color: 'text-rose-400' },
    umum:       { label: 'Umum',       color: 'text-slate-400' },
  }
  const config = subjectMap[subject.toLowerCase()] ?? { label: subject, color: 'text-slate-400' }
  return (
    <span className={`text-xs font-medium capitalize ${config.color}`}>
      {config.label}
    </span>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ material, onConfirm, onCancel, loading }: {
  material: Material
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">Hapus Materi?</h3>
        <p className="text-slate-400 text-sm text-center mb-4">Materi ini akan dihapus permanen.</p>
        <div className="bg-slate-800/60 rounded-xl p-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">{material.thumbnail || '📚'}</span>
          <p className="text-slate-300 text-sm font-medium">{material.title}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContributorMaterialsPage() {
  const supabase = createClient()

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 1. Ambil semua materi milik user
    const { data: materialsData, error: materialsError } = await supabase
      .from('materials')
      .select('id, title, description, subject, level, duration, thumbnail, topics_count, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (materialsError || !materialsData) {
      setLoading(false)
      return
    }

    // 2. Ambil semua soal milik user yang memiliki material_id (tidak null)
    const { data: questionsData } = await supabase
      .from('questions')
      .select('material_id')
      .eq('created_by', user.id)
      .not('material_id', 'is', null)

    // 3. Hitung jumlah soal per material_id
    const countMap = new Map<number, number>()
    if (questionsData) {
      questionsData.forEach(q => {
        const mid = q.material_id
        if (mid) {
          countMap.set(mid, (countMap.get(mid) || 0) + 1)
        }
      })
    }

    // 4. Gabungkan data
    const enrichedMaterials: Material[] = materialsData.map(m => ({
      ...m,
      questions_count: countMap.get(m.id) ?? 0,
    }))

    setMaterials(enrichedMaterials)
    setLoading(false)
  }, [])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('materials').delete().eq('id', deleteTarget.id)
    if (!error) {
      setMaterials(prev => prev.filter(m => m.id !== deleteTarget.id))
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
    const matchLevel = filterLevel === 'all' || m.level === filterLevel
    return matchSearch && matchLevel
  })

  // Statistik ringkas (pastikan angka)
  const totalQuestions = materials.reduce((sum, m) => sum + (m.questions_count || 0), 0)

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          material={deleteTarget}
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
              <BookOpen className="text-blue-400" /> Materi Saya
            </h1>
            <p className="text-slate-400 text-sm mt-1">Kelola materi pembelajaran yang kamu buat.</p>
          </div>
          <Link href="/contributor/materials/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-900/30">
              <Plus className="w-4 h-4" /> Buat Materi Baru
            </Button>
          </Link>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Materi', value: materials.length, color: 'text-white', bg: 'bg-slate-800/60 border-slate-700' },
            { label: 'Total Soal', value: totalQuestions, color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20' },
            ...['sd', 'smp', 'sma'].map(l => ({
              label: LEVEL_CONFIG[l]?.label,
              value: materials.filter(m => m.level === l).length,
              color: LEVEL_CONFIG[l]?.color,
              bg: `${LEVEL_CONFIG[l]?.bg} border-opacity-30`,
            })),
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.bg}`}>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter & Pencarian */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Cari materi, deskripsi, atau mata pelajaran..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white pl-9 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'sd', 'smp', 'sma', 'umum'].map(l => (
              <button key={l}
                onClick={() => setFilterLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                  filterLevel === l
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}>
                {l === 'all' ? 'Semua' : LEVEL_CONFIG[l]?.label ?? l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Materi */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Memuat materi...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-slate-400 font-semibold">
              {materials.length === 0 ? 'Kamu belum membuat materi apapun.' : 'Tidak ada materi yang cocok.'}
            </p>
            {materials.length === 0 && (
              <Link href="/contributor/materials/new">
                <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Plus className="w-4 h-4" /> Buat Materi Pertama
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">
              {filtered.length} materi • {filtered.reduce((sum, m) => sum + (m.questions_count || 0), 0)} soal
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(m => (
                <div key={m.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex gap-4 transition-colors group">

                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-3xl shrink-0">
                    {m.thumbnail || '📚'}
                  </div>

                  {/* Konten */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base mb-1 truncate">{m.title}</p>

                    {/* Baris informasi: level + subject + durasi + jumlah soal */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <LevelBadge level={m.level} />
                      <SubjectBadge subject={m.subject} />
                      {m.duration && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {m.duration}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> {m.questions_count} soal
                      </span>

                      {/* Jumlah topik (optional) */}
                      {m.topics_count > 0 && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <BetweenVerticalEnd className="w-3 h-3" /> {m.topics_count} bagian
                      </span>
                      )}
                    </div>

                    {/* Deskripsi singkat */}
                    {m.description && (
                      <p className="text-slate-400 text-xs line-clamp-2">{m.description}</p>
                    )}
                  </div>

                  {/* Aksi (hover) */}
                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/contributor/materials/${m.id}`}>
                      <button className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}