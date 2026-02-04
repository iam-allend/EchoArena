'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Medal, Crown, Star, UserCheck, ShieldCheck } from 'lucide-react'

export default function ContributorsPage() {
  const supabase = createClient()
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeachers() {
      try {
       
        const { data } = await supabase
          .from('users')
          .select('id, username, level, created_at, coins')
          .gte('coins', 1000) 
          .order('level', { ascending: false }) 
          .limit(20)

        if (data) {
          
          const enhancedData = data.map((user) => ({
            ...user,
          
            contribution: (user.level * 5) + (user.coins % 10) + Math.floor(Math.random() * 10)
          })).sort((a, b) => b.contribution - a.contribution) 

          setTeachers(enhancedData)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [])

  // Komponen untuk Ranking Icon
  const RankIcon = ({ index }: { index: number }) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-bounce" />
    if (index === 1) return <Medal className="w-8 h-8 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]" />
    if (index === 2) return <Medal className="w-8 h-8 text-amber-700 drop-shadow-[0_0_5px_rgba(180,83,9,0.5)]" />
    return <span className="text-xl font-bold text-slate-500 font-mono">#{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Crown className="text-yellow-500 fill-yellow-500 animate-pulse" /> Kontributor Soal Unggulan EchoArena
          </h1>
          <p className="text-slate-400 mt-2">
            Peringkat Mitra Pengajar dengan kontribusi soal terbanyak.
          </p>
        </div>
        <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 px-4 py-3 rounded-lg flex items-center gap-3">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <div className="text-xs">
            <p className="text-yellow-200 font-bold">TOP CONTRIBUTOR</p>
            <p className="text-yellow-400/80">Mendapatkan lencana khusus</p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-400" /> Peringkat Teratas
          </h2>
          
          {loading ? (
             <p className="text-slate-500">Memuat data pahlawan pendidikan...</p>
          ) : teachers.length === 0 ? (
             <p className="text-slate-500 text-center py-10 bg-slate-900 rounded-xl">Belum ada mitra pengajar.</p>
          ) : (
            teachers.map((teacher, index) => (
              <Card 
                key={teacher.id} 
                className={`border-0 transition-all hover:scale-[1.01] ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-slate-900 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 
                  index === 1 ? 'bg-slate-900 border border-slate-700' :
                  index === 2 ? 'bg-slate-900 border border-amber-900/50' :
                  'bg-slate-900/50 border border-slate-800'
                }`}
              >
                <CardContent className="p-4 md:p-6 flex items-center gap-4 md:gap-6">
                  {/* Rank Number/Icon */}
                  <div className="w-12 flex justify-center shrink-0">
                    <RankIcon index={index} />
                  </div>

                  {/* Avatar */}
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold text-white shrink-0 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {teacher.username?.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info User */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base md:text-lg font-bold truncate ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                        {teacher.username}
                      </h3>
                      {index < 3 && <UserCheck className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-400">Bergabung: {new Date(teacher.created_at).toLocaleDateString('id-ID')}</p>
                  </div>

                  {/* Statistik Kontribusi */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kontribusi</p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`text-2xl md:text-3xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                        {teacher.contribution}
                      </span>
                      <span className="text-xs text-slate-500">Soal</span>
                    </div>
                    <a href={`/admin/contributors/${teacher.id}`} className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-white transition-colors bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-slate-950">
                        Lihat Profil
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* KOLOM KANAN: CALL TO ACTION */}
        <div className="space-y-6">
           <Card className="bg-gradient-to-b from-indigo-900/50 to-slate-900 border-indigo-500/30">
             <CardHeader>
               <CardTitle className="text-white">Mengapa Menjadi Mitra?</CardTitle>
               <CardDescription>Keuntungan berkontribusi di EchoArena.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                   <Crown className="w-4 h-4 text-blue-400" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-white">Lencana Verifikasi</h4>
                   <p className="text-xs text-slate-400 mt-1">Dapatkan tanda centang biru di profil Anda.</p>
                 </div>
               </div>
               
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                   <Star className="w-4 h-4 text-green-400" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-white">Akses Fitur Premium</h4>
                   <p className="text-xs text-slate-400 mt-1">Gunakan fitur analitik kelas tanpa batas.</p>
                 </div>
               </div>

               <div className="mt-4 pt-4 border-t border-indigo-500/20">
                 <p className="text-xs text-center text-indigo-300 italic">
                   "Pendidikan adalah senjata paling mematikan di dunia." - Nelson Mandela
                 </p>
               </div>
             </CardContent>
           </Card>
        </div>

      </div>
    </div>
  )
}