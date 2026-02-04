'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Loader2, Eraser, CheckCircle2 } from 'lucide-react'

export default function EditQuestionPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  
  // State Form
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    difficulty: 'medium',
    category_id: ''
  })

  // 1. Fetch Data Soal & Kategori saat halaman dibuka
  useEffect(() => {
    async function fetchData() {
      try {
        // Ambil Data Categories untuk Dropdown
        const { data: cats } = await supabase.from('categories').select('*')
        if (cats) setCategories(cats)

        // Ambil Data Soal Berdasarkan ID
        const { data: question, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        // Isi form dengan data lama
        if (question) {
          setFormData({
            question_text: question.question_text || '',
            option_a: question.option_a || '',
            option_b: question.option_b || '',
            option_c: question.option_c || '',
            option_d: question.option_d || '',
            correct_answer: question.correct_answer || 'A',
            difficulty: question.difficulty || 'medium',
            category_id: question.category_id || ''
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        alert('Gagal memuat soal.')
        router.push('/admin/questions')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  // 2. Handle Update Data
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('questions')
        .update({
            question_text: formData.question_text,
            option_a: formData.option_a,
            option_b: formData.option_b,
            option_c: formData.option_c,
            option_d: formData.option_d,
            correct_answer: formData.correct_answer,
            difficulty: formData.difficulty,
            category_id: formData.category_id ? parseInt(formData.category_id) : null
        })
        .eq('id', id)

      if (error) throw error

      // Redirect kembali ke list setelah sukses
      router.push('/admin/questions')
      
    } catch (error) {
      alert('Gagal menyimpan perubahan.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Memuat data soal...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigasi */}
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
            </Button>
            <h1 className="text-2xl font-bold text-white">Edit Soal</h1>
        </div>

        {/* Form Card */}
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-white">Formulir Perubahan</CardTitle>
                <CardDescription>Perbarui konten soal di bawah ini.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdate} className="space-y-6">
                    
                    {/* Pertanyaan */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Teks Pertanyaan</Label>
                        <textarea
                            required
                            value={formData.question_text}
                            onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                            className="w-full min-h-[100px] bg-slate-950 border border-slate-700 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Tulis pertanyaan di sini..."
                        />
                    </div>

                    {/* Opsi Jawaban Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center justify-between">
                                Opsi A
                                {formData.correct_answer === 'A' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </Label>
                            <Input 
                                required
                                value={formData.option_a}
                                onChange={(e) => setFormData({...formData, option_a: e.target.value})}
                                className={`bg-slate-950 border-slate-700 text-white ${formData.correct_answer === 'A' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center justify-between">
                                Opsi B
                                {formData.correct_answer === 'B' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </Label>
                            <Input 
                                required
                                value={formData.option_b}
                                onChange={(e) => setFormData({...formData, option_b: e.target.value})}
                                className={`bg-slate-950 border-slate-700 text-white ${formData.correct_answer === 'B' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center justify-between">
                                Opsi C
                                {formData.correct_answer === 'C' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </Label>
                            <Input 
                                required
                                value={formData.option_c}
                                onChange={(e) => setFormData({...formData, option_c: e.target.value})}
                                className={`bg-slate-950 border-slate-700 text-white ${formData.correct_answer === 'C' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center justify-between">
                                Opsi D
                                {formData.correct_answer === 'D' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </Label>
                            <Input 
                                required
                                value={formData.option_d}
                                onChange={(e) => setFormData({...formData, option_d: e.target.value})}
                                className={`bg-slate-950 border-slate-700 text-white ${formData.correct_answer === 'D' ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                        
                        {/* Kunci Jawaban */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Kunci Jawaban</Label>
                            <select
                                value={formData.correct_answer}
                                onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-md px-3 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>

                        {/* Tingkat Kesulitan */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tingkat Kesulitan</Label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-md px-3 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="easy">Easy (Mudah)</option>
                                <option value="medium">Medium (Sedang)</option>
                                <option value="hard">Hard (Sulit)</option>
                            </select>
                        </div>

                         {/* Kategori */}
                         <div className="space-y-2">
                            <Label className="text-slate-300">Kategori</Label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-md px-3 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    {/* Tombol Simpan */}
                    <div className="flex justify-end pt-6">
                        <Button 
                            type="submit" 
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] shadow-lg shadow-indigo-500/20"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}