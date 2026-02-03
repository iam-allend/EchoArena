'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewQuestionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    question_text: '',
    category_id: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    difficulty: 'medium'
  })

  // Fetch categories saat load
  useEffect(() => {
    const getCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name')
      if (data) setCategories(data)
    }
    getCategories()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        // Pastikan category_id null jika string kosong
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      }

      const { error } = await supabase.from('questions').insert(payload)
      if (error) throw error

      router.push('/admin/questions')
      router.refresh()
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/questions" className="text-slate-400 hover:text-white flex items-center gap-2 mb-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
        <h1 className="text-3xl font-bold">Buat Soal Baru</h1>
        <p className="text-slate-400">Masukkan detail pertanyaan untuk bank soal EchoArena.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Pertanyaan & Kategori */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Pertanyaan Utama</Label>
                <Input 
                  required
                  placeholder="Contoh: Siapakah penemu bola lampu?"
                  value={formData.question_text}
                  onChange={e => setFormData({...formData, question_text: e.target.value})}
                  className="bg-slate-800 border-slate-700 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <select 
                  className="w-full h-12 px-3 rounded-md bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tingkat Kesulitan</Label>
                <select 
                  className="w-full h-12 px-3 rounded-md bg-slate-800 border border-slate-700 text-sm"
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="easy">Mudah (Easy)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="hard">Sulit (Hard)</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-slate-800 my-4" />

            {/* Opsi Jawaban */}
            <div className="space-y-4">
              <Label className="text-indigo-400">Pilihan Jawaban</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opsi A</Label>
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={formData.correct_answer === 'A'}
                      onChange={() => setFormData({...formData, correct_answer: 'A'})}
                      className="accent-green-500"
                    />
                  </div>
                  <Input 
                    required
                    placeholder="Jawaban A"
                    value={formData.option_a}
                    onChange={e => setFormData({...formData, option_a: e.target.value})}
                    className={`bg-slate-800 border-slate-700 ${formData.correct_answer === 'A' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opsi B</Label>
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={formData.correct_answer === 'B'}
                      onChange={() => setFormData({...formData, correct_answer: 'B'})}
                      className="accent-green-500"
                    />
                  </div>
                  <Input 
                    required
                    placeholder="Jawaban B"
                    value={formData.option_b}
                    onChange={e => setFormData({...formData, option_b: e.target.value})}
                    className={`bg-slate-800 border-slate-700 ${formData.correct_answer === 'B' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opsi C</Label>
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={formData.correct_answer === 'C'}
                      onChange={() => setFormData({...formData, correct_answer: 'C'})}
                      className="accent-green-500"
                    />
                  </div>
                  <Input 
                    required
                    placeholder="Jawaban C"
                    value={formData.option_c}
                    onChange={e => setFormData({...formData, option_c: e.target.value})}
                    className={`bg-slate-800 border-slate-700 ${formData.correct_answer === 'C' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opsi D</Label>
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={formData.correct_answer === 'D'}
                      onChange={() => setFormData({...formData, correct_answer: 'D'})}
                      className="accent-green-500"
                    />
                  </div>
                  <Input 
                    required
                    placeholder="Jawaban D"
                    value={formData.option_d}
                    onChange={e => setFormData({...formData, option_d: e.target.value})}
                    className={`bg-slate-800 border-slate-700 ${formData.correct_answer === 'D' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 text-right">*Klik radio button untuk menandai jawaban benar</p>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
              Simpan Soal ke Database
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}