'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Trophy, Star, MessageSquare, Hash, Award, CheckCircle2 } from 'lucide-react'

export default function ContributorProfile() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Data Palsu untuk Demo Portofolio (Biar terlihat penuh)
  const [dummyPortfolio, setDummyPortfolio] = useState<any[]>([])

  useEffect(() => {
    async function fetchUser() {
      try {
        // 1. Ambil Detail User Asli
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setUser(data)

        const topics = ['Sains: Tata Surya', 'Matematika: Aljabar', 'Biologi: Sel Hewan', 'Fisika: Hukum Newton']
        const diffs = ['Easy', 'Medium', 'Hard']
        
        const portfolio = Array.from({ length: 5 }).map((_, i) => ({
          id: i + 1,
          topic: topics[i % topics.length],
          difficulty: diffs[i % 3],
          likes: Math.floor(Math.random() * 50) + 10,
          usedCount: Math.floor(Math.random() * 200) + 50,
          date: new Date(Date.now() - (i * 86400000 * 3)).toLocaleDateString('id-ID')
        }))
        
        setDummyPortfolio(portfolio)

      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchUser()
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Memuat profil...</div>
  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500">Kontributor tidak ditemukan.</div>

  // Hitung Level Label
  const getLevelLabel = (lvl: number) => {
    if (lvl > 20) return { label: "Grandmaster Guru", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/50" }
    if (lvl > 10) return { label: "Senior Educator", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/50" }
    return { label: "Rising Star", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/50" }
  }

  const levelInfo = getLevelLabel(user.level || 1)

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      
      {/* 1. Header Banner */}
      <div className="h-48 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative border-b border-slate-800">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="absolute top-6 left-6 text-slate-300 hover:text-white hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative">
        
        {/* 2. Kartu Profil Utama */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
         
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-950 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
             <span className="text-4xl md:text-5xl font-bold text-white">
               {user.username?.substring(0, 2).toUpperCase()}
             </span>
          </div>

          {/* Info Text */}
          <div className="flex-1 pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{user.username}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelInfo.bg} ${levelInfo.color} ${levelInfo.border} flex items-center gap-1 w-fit`}>
                <Award className="w-3 h-3" /> {levelInfo.label}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
               <div className="flex items-center gap-1">
                 <MapPin className="w-4 h-4" /> Indonesia
               </div>
               <div className="flex items-center gap-1">
                 <Calendar className="w-4 h-4" /> Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
               </div>
               <div className="flex items-center gap-1 text-yellow-500">
                 <Star className="w-4 h-4 fill-yellow-500" /> {((user.level % 5) + 4.5).toFixed(1)} Rating Guru
               </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pb-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-4 h-4 mr-2" /> Kirim Pesan
            </Button>
          </div>
        </div>

        {/* 3. Grid Statistik & Konten */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          
          {/* KOLOM KIRI: STATISTIK */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Statistik Kontribusi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Soal</span>
                  <span className="text-xl font-bold text-white">{(user.level * 12) + 5}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Dimainkan Siswa</span>
                  <span className="text-xl font-bold text-white">{(user.level * 150) + 840}x</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Reputasi (XP)</span>
                  <span className="text-xl font-bold text-blue-400">{user.xp || 0} XP</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Akurasi Soal</span>
                  <span className="text-xl font-bold text-green-400">98.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-indigo-900/30 border-slate-800">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-2">Tentang Pengajar</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Seorang pendidik yang berdedikasi tinggi dalam mengembangkan materi pembelajaran interaktif. Aktif berkontribusi di EchoArena untuk memajukan pendidikan Indonesia melalui gamifikasi.
                </p>
              </CardContent>
            </Card>
          </div>

          
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Hash className="text-indigo-400" /> Portofolio Soal Terbaru
            </h2>

            <div className="space-y-4">
              {dummyPortfolio.map((item) => (
                <Card key={item.id} className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-all group cursor-default">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">
                          {item.topic}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          item.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          item.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Dibuat pada {item.date}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Trophy className="w-3 h-3" /> {item.usedCount}x dimainkan
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Star className="w-3 h-3 text-yellow-500" /> {item.likes} likes
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center pt-4">
               <Button variant="outline" className="text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800">
                 Lihat Semua Portofolio
               </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}