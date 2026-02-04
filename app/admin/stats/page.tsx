'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Clock, Target, Activity, UserPlus, Gamepad2, PlayCircle, AlertTriangle, ArrowDownRight } from 'lucide-react'

export default function AdminDashboard() {
  const supabase = createClient()
  
  // State Data Real
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    avgScore: 0
  })

  // State List Data (Array)
  const [newUsers, setNewUsers] = useState<any[]>([])
  const [recentRooms, setRecentRooms] = useState<any[]>([])
  const [recentAnswers, setRecentAnswers] = useState<any[]>([])
  const [difficultQuestions, setDifficultQuestions] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching Live Data...")
        
        // 1. Ambil Total Counter (Semua User)
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: roomCount } = await supabase.from('game_rooms').select('*', { count: 'exact', head: true })
        
        // 2. Ambil 5 SISWA Terbaru (FILTER: Koin < 1000, asumsi Guru = 1000)
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, created_at, level, coins')
          .lt('coins', 1000) // <--- INI FILTERNYA (Hanya ambil yg koinnya dikit/siswa)
          .order('created_at', { ascending: false })
          .limit(5)

        // 3. Ambil 5 Room Terbaru
        const { data: roomsData } = await supabase
          .from('game_rooms')
          .select('id, room_code, status, created_at, host:users(username)')
          .order('created_at', { ascending: false })
          .limit(5)

        // 4. Ambil Jawaban Terakhir (Untuk Log & Analisis Soal)
        const { data: answersData } = await supabase
          .from('stage_answers')
          .select('id, created_at, is_correct, points_earned, user:users(username), question:questions(question_text)')
          .order('created_at', { ascending: false })
          .limit(50) // Ambil sampel 50 jawaban terakhir untuk analisis

        // --- ANALISIS DATA ---
        
        let totalScore = 0
        const questionStats: Record<string, { total: number, wrong: number }> = {}

        if (answersData && answersData.length > 0) {
           answersData.forEach((a: any) => {
             totalScore += (a.points_earned || 0)
             
             // Hitung Kegagalan per Soal
             const qText = a.question?.question_text || 'Soal tidak diketahui'
             if (!questionStats[qText]) {
               questionStats[qText] = { total: 0, wrong: 0 }
             }
             questionStats[qText].total += 1
             
             if (!a.is_correct) {
               questionStats[qText].wrong += 1 // Tambah counter salah
             }
           })
        }

        // Urutkan Soal Tersulit (Berdasarkan % Salah Tertinggi)
        const topDifficult = Object.entries(questionStats)
          .map(([text, stat]) => ({
            question: text,
            wrongPct: Math.round((stat.wrong / stat.total) * 100),
            totalAttempts: stat.total
          }))
          .sort((a, b) => b.wrongPct - a.wrongPct) // Urutkan Descending (Paling susah di atas)
          .slice(0, 3) // Ambil Top 3

        // Set State
        setStats({
          totalUsers: userCount || 0,
          totalGames: roomCount || 0,
          avgScore: answersData && answersData.length > 0 ? Math.round(totalScore / answersData.length) : 0
        })
        
        setNewUsers(usersData || [])
        setRecentRooms(roomsData || [])
        setRecentAnswers(answersData ? answersData.slice(0, 7) : []) // Cuma tampilkan 7 di log
        setDifficultQuestions(topDifficult)

      } catch (e) {
        console.error("Error Fetching:", e)
      }
    }

    fetchData()
    // Refresh otomatis tiap 5 detik
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper Format Tanggal
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="text-green-500 animate-pulse" /> Live Monitor
          </h1>
          <p className="text-slate-400 mt-2">Memantau aktivitas siswa secara real-time.</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-xs font-mono text-slate-300">
          Mode: <span className="text-blue-400 font-bold">TEACHER VIEW</span>
        </div>
      </div>

      {/* 1. KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Siswa</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Game Room</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalGames}</h3>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Gamepad2 className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Rata-Rata Skor</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.avgScore}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. SISWA TERBARU (HANYA SISWA) */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Siswa Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {newUsers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Belum ada siswa baru.</p>
            ) : (
              newUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {user.username?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-slate-500">Level {user.level}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{formatDate(user.created_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 3. SOAL TERSULIT (NEW FEATURE) */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800/50 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Soal Tersulit (Analisis Kegagalan)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {difficultQuestions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Belum ada data kegagalan siswa.
              </div>
            ) : (
              difficultQuestions.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-start text-sm">
                    <p className="text-slate-300 font-medium line-clamp-2 flex-1 pr-4">
                      {item.question}
                    </p>
                    <div className="text-right flex-shrink-0">
                      <span className="text-red-400 font-bold block">{item.wrongPct}% Gagal</span>
                      <span className="text-[10px] text-slate-500">{item.totalAttempts}x Dicoba</span>
                    </div>
                  </div>
                  {/* Progress Bar Merah */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${item.wrongPct}%` }} 
                      className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                    ></div>
                  </div>
                </div>
              ))
            )}
            
            {difficultQuestions.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/10 border border-red-900/30 rounded flex items-center gap-2">
                 <ArrowDownRight className="w-4 h-4 text-red-400" />
                 <p className="text-xs text-red-300">
                   Saran: Bahas ulang materi soal-soal di atas pada pertemuan berikutnya.
                 </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. LOG AKTIVITAS */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="border-b border-slate-800/50 pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-purple-400" />
            Log Jawaban Masuk
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {recentAnswers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Belum ada aktivitas.</p>
            ) : (
              recentAnswers.map((ans, i) => (
                <div key={ans.id} className={`flex items-center justify-between py-2 px-3 rounded text-sm ${i % 2 === 0 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ans.is_correct ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                    <p className="text-slate-300 truncate">
                      <span className="font-bold text-white">{ans.user?.username || 'Seseorang'}</span> 
                      {' '}menjawab{' '}
                      <span className={ans.is_correct ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {ans.is_correct ? 'BENAR' : 'SALAH'}
                      </span>
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-600">{formatDate(ans.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}