'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Search, Filter, BookOpen, BrainCircuit, CheckCircle2, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react'

export default function QuestionsList() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State khusus untuk loading saat menghapus (biar tombol tidak dipencet 2x)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('questions')
      .select(`*, categories (name)`)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setQuestions(data)
    setLoading(false)
  }

  // --- FITUR HAPUS (NEW) ---
  const handleDelete = async (id: number) => {
    // 1. Konfirmasi Browser (Paling Cepat & Aman)
    const isSure = window.confirm("Apakah Anda yakin ingin menghapus soal ini secara permanen?")
    if (!isSure) return

    setDeletingId(id) // Aktifkan loading di tombol tong sampah

    try {
      // 2. Hapus dari Supabase
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 3. Hapus dari State Lokal (UI langsung update tanpa refresh halaman)
      setQuestions(prev => prev.filter(q => q.id !== id))
      
    } catch (error: any) {
      alert("Gagal menghapus: " + error.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Logika Filter Client-Side
  const filteredQuestions = questions.filter(q => 
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'hard': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-slate-800 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-indigo-500" /> Bank Soal
          </h1>
          <p className="text-slate-400 mt-2">Kelola koleksi pertanyaan untuk kuis interaktif.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right mr-4">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Soal</p>
            <p className="text-2xl font-bold text-white">{questions.length}</p>
          </div>
          <Link href="/admin/questions/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              <Plus className="w-4 h-4 mr-2" /> Buat Soal Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input 
            placeholder="Cari pertanyaan atau kategori..." 
            className="pl-10 bg-slate-900 border-slate-800 text-white focus:border-indigo-500 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <BrainCircuit className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-300">Tidak ada soal ditemukan</h3>
          <p className="text-slate-500 mt-2">Coba kata kunci lain atau buat soal baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredQuestions.map((q) => (
            <Card key={q.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-950 border-slate-700 text-slate-300">
                    {q.categories?.name || 'Umum'}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${getDifficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-500 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="flex-1">
                <h3 className="text-white font-medium leading-relaxed line-clamp-3">
                  {q.question_text}
                </h3>
              </CardContent>

              <CardFooter className="pt-4 border-t border-slate-800/50 flex items-center justify-between bg-slate-950/30">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Kunci:
                  </span>
                  <span className="font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                    {q.correct_answer}
                  </span>
                </div>
                
                {/* TOMBOL AKSI (Edit & Delete) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/questions/${q.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  
                  {/* TOMBOL DELETE YANG BERFUNGSI */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {deletingId === q.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>

                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}