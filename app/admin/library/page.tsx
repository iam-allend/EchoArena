'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Copy, Globe, BookOpen, CheckCircle2, Filter, Volume2, StopCircle } from 'lucide-react'

export default function CommunityLibrary() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State UI
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [speakingId, setSpeakingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data } = await supabase
          .from('questions')
          .select(`*, categories (name)`)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (data) setQuestions(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()

    // Cleanup saat pindah halaman (matikan suara)
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const filteredQuestions = questions.filter(q => 
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopyComplete = (q: any) => {
    const formattedText = `
${q.question_text}

A. ${q.option_a}
B. ${q.option_b}
C. ${q.option_c}
D. ${q.option_d}

Kunci Jawaban: ${q.correct_answer}
`.trim()

    navigator.clipboard.writeText(formattedText)
    setCopiedId(q.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- FITUR BARU: TEXT TO SPEECH (SUARA) ---
  const handleSpeak = (q: any) => {
    // Jika sedang bicara soal yang sama, stop.
    if (speakingId === q.id) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    // Stop suara sebelumnya (jika ada)
    window.speechSynthesis.cancel()

    // Siapkan teks yang akan dibaca
    const textToRead = `
      Pertanyaan: ${q.question_text}. 
      Pilihan A: ${q.option_a}. 
      Pilihan B: ${q.option_b}. 
      Pilihan C: ${q.option_c}. 
      Pilihan D: ${q.option_d}.
    `

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = 'id-ID' // Set Bahasa Indonesia
    utterance.rate = 0.9 // Kecepatan sedikit lambat agar jelas
    utterance.pitch = 1

    // Event ketika selesai bicara
    utterance.onend = () => setSpeakingId(null)

    // Mulai bicara
    window.speechSynthesis.speak(utterance)
    setSpeakingId(q.id)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Globe className="text-blue-500 animate-pulse" /> Bank Soal Komunitas
          </h1>
          <p className="text-slate-400 mt-2">
            Akses ribuan soal gratis dengan fitur aksesibilitas suara.
          </p>
        </div>
        <div className="bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-200">
            Total Koleksi: <span className="font-bold text-white">{questions.length}+</span> Soal
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <Input 
          placeholder="Cari topik (misal: Fotosintesis, Sejarah, Matematika)..." 
          className="pl-10 bg-slate-900 border-slate-700 text-white h-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid Soal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-slate-500">Memuat perpustakaan...</p>
        ) : filteredQuestions.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ditemukan soal dengan kata kunci tersebut.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <Card key={q.id} className={`bg-slate-900 border transition-all group ${speakingId === q.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-800 hover:border-blue-500/50'}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-1 rounded-md bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {q.categories?.name || 'UMUM'}
                    </span>
                    <h3 className="font-medium text-white leading-relaxed">
                      {q.question_text}
                    </h3>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    {/* TOMBOL SUARA (BARU) */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`hover:bg-indigo-500/20 ${speakingId === q.id ? 'text-indigo-400 animate-pulse' : 'text-slate-500 hover:text-indigo-300'}`}
                      onClick={() => handleSpeak(q)}
                      title="Baca Soal (Suara)"
                    >
                      {speakingId === q.id ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>

                    {/* TOMBOL COPY */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-500 hover:text-white hover:bg-blue-600"
                      onClick={() => handleCopyComplete(q)}
                      title="Salin Soal Lengkap"
                    >
                      {copiedId === q.id ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Preview Jawaban */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-800/50">
                  <div className={`p-2 rounded ${q.correct_answer === 'A' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-slate-800/50 text-slate-500'}`}>
                    A. {q.option_a}
                  </div>
                  <div className={`p-2 rounded ${q.correct_answer === 'B' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-slate-800/50 text-slate-500'}`}>
                    B. {q.option_b}
                  </div>
                  <div className={`p-2 rounded ${q.correct_answer === 'C' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-slate-800/50 text-slate-500'}`}>
                    C. {q.option_c}
                  </div>
                  <div className={`p-2 rounded ${q.correct_answer === 'D' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-slate-800/50 text-slate-500'}`}>
                    D. {q.option_d}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                   <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${
                       q.difficulty === 'easy' ? 'bg-green-500' : 
                       q.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                     }`}></span>
                     <span className="capitalize">{q.difficulty || 'Medium'}</span>
                   </div>
                   {speakingId === q.id && <span className="text-indigo-400 font-bold flex items-center gap-1"><Volume2 className="w-3 h-3 animate-ping" /> Membaca...</span>}
                   {copiedId === q.id && <span className="text-green-400 font-bold animate-pulse">Tersalin Lengkap!</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}