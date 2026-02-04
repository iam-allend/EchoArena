'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Loader2, 
  BookOpen,
  FileText
} from 'lucide-react'

// Tipe Data
interface Material {
  id: string
  title: string
  subject: string
  level: string
  thumbnail: string
  topics_count: number
  created_at: string
}

export default function MaterialsListPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 1. FETCH DATA MATERI
  useEffect(() => {
    fetchMaterials()
  }, [])

  async function fetchMaterials() {
    setLoading(true)
    const { data, error } = await supabase
      .from('materials')
      .select('id, title, subject, level, thumbnail, topics_count, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching materials:', error)
      alert('Gagal mengambil data materi')
    } else {
      setMaterials(data || [])
    }
    setLoading(false)
  }

  // 2. HANDLE DELETE
  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini? Data yang dihapus tidak bisa dikembalikan.')) return

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus materi')
    } else {
      // Refresh list tanpa reload page
      setMaterials(prev => prev.filter(m => m.id !== id))
      alert('Materi berhasil dihapus')
    }
  }

  // Filter Search
  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-blue-500" /> Manajemen Materi
            </h1>
            <p className="text-slate-400">Kelola modul pembelajaran dan materi siswa.</p>
          </div>
          <Link href="/admin/materials/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Buat Materi Baru
            </Button>
          </Link>
        </div>

        {/* SEARCH & FILTER */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <Search className="text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari judul materi atau mata pelajaran..." 
            className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* TABLE LIST */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-2" /> Memuat data...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Belum ada materi yang ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Gunakan Tag HTML Table Biasa agar Aman dari Error Component */}
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-4 w-[50px]">#</th>
                    <th className="p-4">Judul Materi</th>
                    <th className="p-4">Mapel</th>
                    <th className="p-4">Tingkat</th>
                    <th className="p-4 text-center">Topik</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMaterials.map((material, index) => (
                    <tr key={material.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4 text-slate-500 font-mono">
                        {(index + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl border border-slate-700">
                            {material.thumbnail}
                          </div>
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {material.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 capitalize text-xs">
                          {material.subject}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                          ${material.level === 'sd' ? 'bg-green-900/30 text-green-400 border border-green-900' : ''}
                          ${material.level === 'smp' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' : ''}
                          ${material.level === 'sma' ? 'bg-red-900/30 text-red-400 border border-red-900' : ''}
                          ${material.level === 'umum' ? 'bg-blue-900/30 text-blue-400 border border-blue-900' : ''}
                        `}>
                          {material.level}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-400">
                        {material.topics_count} Bab
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Tombol Edit (Link ke halaman edit yang akan dibuat nanti) */}
                          <Link href={`/admin/materials/${material.id}`}> 
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-white hover:bg-blue-600">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          {/* Tombol Hapus */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-600"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}