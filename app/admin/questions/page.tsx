'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function QuestionsList() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) setQuestions(data)
      setLoading(false)
    }
    fetchQuestions()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bank Soal</h1>
        <Link href="/admin/questions/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Soal Baru
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Soal</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Jawaban Benar</th>
                <th className="px-6 py-4">Kesulitan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">Memuat data...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">Belum ada soal</td></tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium max-w-md truncate">{q.question_text}</td>
                    <td className="px-6 py-4 text-slate-400">{q.categories?.name || '-'}</td>
                    <td className="px-6 py-4 font-bold text-green-400">{q.correct_answer}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}