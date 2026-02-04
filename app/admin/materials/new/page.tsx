'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Save, Loader2, ArrowLeft, XCircle } from 'lucide-react'

// Tipe Data untuk Materi
interface MaterialSection {
  title: string
  content: string
  examples: string[]
}

export default function NewMaterialPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // State Form Utama
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '', // matematika, sains, sejarah, sastra
    level: '',   // sd, smp, sma
    duration: '', // contoh: "10 Menit"
    thumbnail: '📚', // Default emoji
  })

  // State Bagian Materi (Sections)
  const [sections, setSections] = useState<MaterialSection[]>([
    { title: '', content: '', examples: [''] }
  ])

  // Handler Input Utama (Input & Textarea HTML)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // --- LOGIC SECTION (BAGIAN MATERI) ---
  const addSection = () => {
    setSections([...sections, { title: '', content: '', examples: [''] }])
  }

  const removeSection = (index: number) => {
    const newSections = [...sections]
    newSections.splice(index, 1)
    setSections(newSections)
  }

  const updateSection = (index: number, field: keyof MaterialSection, value: any) => {
    const newSections = [...sections]
    // @ts-ignore
    newSections[index][field] = value
    setSections(newSections)
  }

  // --- LOGIC EXAMPLE (CONTOH) ---
  const addExample = (sectionIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].examples.push('')
    setSections(newSections)
  }

  const updateExample = (sectionIndex: number, exampleIndex: number, value: string) => {
    const newSections = [...sections]
    newSections[sectionIndex].examples[exampleIndex] = value
    setSections(newSections)
  }

  const removeExample = (sectionIndex: number, exampleIndex: number) => {
    const newSections = [...sections]
    newSections[sectionIndex].examples.splice(exampleIndex, 1)
    setSections(newSections)
  }

  // --- SUBMIT DATA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validasi sederhana
      if (!formData.title || !formData.subject || !formData.level) {
        alert("Mohon lengkapi Judul, Mapel, dan Tingkat!")
        setLoading(false)
        return
      }

      // 1. Simpan ke Supabase
      const { data, error } = await supabase
        .from('materials') 
        .insert([
          {
            title: formData.title,
            description: formData.description,
            subject: formData.subject,
            level: formData.level,
            duration: formData.duration,
            thumbnail: formData.thumbnail,
            content: sections, 
            topics_count: sections.length
          }
        ])
        .select()

      if (error) throw error

      alert("Sukses! Materi berhasil dibuat.")
      router.push('/admin') // Redirect ke dashboard admin

    } catch (error: any) {
      console.error('Error:', error)
      alert(`Gagal menyimpan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Class CSS untuk Input Standar agar seragam (Dark Theme)
  const inputClass = "flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
  
  // Class CSS untuk Textarea Standar
  const textareaClass = "flex min-h-[120px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Buat Materi Baru</h1>
            <p className="text-slate-400">Tambahkan modul pembelajaran baru ke database.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. INFORMASI UTAMA */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Materi</Label>
                  <Input 
                    name="title" 
                    placeholder="Contoh: Aljabar Dasar" 
                    className="bg-slate-950 border-slate-800"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thumbnail (Emoji)</Label>
                  <Input 
                    name="thumbnail" 
                    placeholder="Contoh: 📐" 
                    className="bg-slate-950 border-slate-800"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                {/* Textarea HTML Standar */}
                <textarea 
                  name="description" 
                  placeholder="Jelaskan secara singkat tentang materi ini..." 
                  className={textareaClass}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  {/* Select HTML Standar */}
                  <select 
                    name="subject"
                    className={inputClass}
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Pilih Mapel</option>
                    <option value="matematika">Matematika</option>
                    <option value="sains">Sains</option>
                    <option value="sejarah">Sejarah</option>
                    <option value="sastra">Sastra</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tingkat</Label>
                  {/* Select HTML Standar */}
                  <select 
                    name="level"
                    className={inputClass}
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Pilih Tingkat</option>
                    <option value="sd">SD</option>
                    <option value="smp">SMP</option>
                    <option value="sma">SMA</option>
                    <option value="umum">Umum</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Estimasi Durasi</Label>
                  <Input 
                    name="duration" 
                    placeholder="Contoh: 15 Menit" 
                    className="bg-slate-950 border-slate-800"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. KONTEN MATERI (DINAMIS) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Isi Materi</h2>
              <Button type="button" onClick={addSection} variant="outline" className="border-dashed border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Plus className="w-4 h-4 mr-2" /> Tambah Bagian
              </Button>
            </div>

            {sections.map((section, sIndex) => (
              <Card key={sIndex} className="bg-slate-900 border-slate-800 relative group">
                <CardContent className="pt-6 space-y-4">
                  {/* Tombol Hapus Section */}
                  {sections.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeSection(sIndex)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label className="text-blue-400">Judul Bagian {sIndex + 1}</Label>
                    <Input 
                      placeholder={`Judul Bab ${sIndex + 1}`} 
                      className="bg-slate-950 border-slate-800 font-bold"
                      value={section.title}
                      onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Penjelasan Materi</Label>
                    {/* Textarea HTML Standar */}
                    <textarea 
                      placeholder="Tuliskan materi lengkap di sini..." 
                      className={textareaClass}
                      value={section.content}
                      onChange={(e) => updateSection(sIndex, 'content', e.target.value)}
                    />
                  </div>

                  {/* Nested Examples */}
                  <div className="pl-4 border-l-2 border-slate-800 space-y-3">
                    <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Contoh / Studi Kasus</Label>
                    {section.examples.map((ex, exIndex) => (
                      <div key={exIndex} className="flex gap-2">
                        <Input 
                          placeholder={`Contoh ${exIndex + 1}`} 
                          className="bg-slate-950 border-slate-800 text-sm"
                          value={ex}
                          onChange={(e) => updateExample(sIndex, exIndex, e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeExample(sIndex, exIndex)}
                          disabled={section.examples.length === 1}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addExample(sIndex)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Tambah Contoh Lain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan Materi
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}