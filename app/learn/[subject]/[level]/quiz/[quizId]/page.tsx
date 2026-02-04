'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Clock, Target, Zap, Play, CheckCircle2, XCircle, RefreshCcw, Home, Volume2, StopCircle } from 'lucide-react'
import { getQuizById } from '@/lib/data/quizzes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// --- MOCK DATA PERTANYAAN (Karena database soal aslinya di server) ---
// Nanti bisa diganti dengan fetch API real
const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "Apa fungsi utama dari Mitokondria dalam sel?",
    options: ["Sintesis Protein", "Penghasil Energi (ATP)", "Menyimpan DNA", "Membelah Sel"],
    answer: "Penghasil Energi (ATP)"
  },
  {
    id: 2,
    question: "Siapakah penemu bola lampu pijar?",
    options: ["Nikola Tesla", "Albert Einstein", "Thomas Alva Edison", "Isaac Newton"],
    answer: "Thomas Alva Edison"
  },
  {
    id: 3,
    question: "Ibukota negara Indonesia yang baru berada di pulau?",
    options: ["Jawa", "Sumatera", "Kalimantan", "Sulawesi"],
    answer: "Kalimantan"
  },
  {
    id: 4,
    question: "Planet manakah yang disebut sebagai Planet Merah?",
    options: ["Jupiter", "Mars", "Venus", "Saturnus"],
    answer: "Mars"
  },
  {
    id: 5,
    question: "Rumus kimia dari air adalah?",
    options: ["CO2", "H2O", "O2", "NaCl"],
    answer: "H2O"
  }
]

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as string
  const quiz = getQuizById(quizId)

  // --- STATE MANAGEMENT ---
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // --- LOGIC SUARA (SAMA SEPERTI ECHOARENA) ---
  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 1.1
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  // Stop suara kalau pindah soal/halaman
  useEffect(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [currentQIndex, gameState])

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <p className="text-white text-xl">Quiz tidak ditemukan</p>
      </div>
    )
  }

  const handleStart = () => {
    setGameState('playing')
    setCurrentQIndex(0)
    setScore(0)
    setIsCorrect(null)
    setSelectedOption(null)
  }

  const handleAnswer = (option: string) => {
    if (selectedOption) return // Cegah klik ganda

    const currentQuestion = MOCK_QUESTIONS[currentQIndex]
    const correct = option === currentQuestion.answer
    
    setSelectedOption(option)
    setIsCorrect(correct)
    
    if (correct) setScore(s => s + 20) // Asumsi 1 soal 20 poin

    // Delay pindah soal
    setTimeout(() => {
      if (currentQIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentQIndex(prev => prev + 1)
        setSelectedOption(null)
        setIsCorrect(null)
      } else {
        setGameState('finished')
      }
    }, 1500)
  }

  // --- TAMPILAN 3: HASIL (FINISHED) ---
  if (gameState === 'finished') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/50">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Simulasi Selesai!</h2>
          <p className="text-purple-200 mb-8">Kamu sudah siap untuk EchoArena?</p>
          
          <div className="bg-black/20 rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Total Skor</p>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              {score}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleStart} variant="outline" className="h-12 border-white/20 text-white hover:bg-white/10 bg-transparent">
              <RefreshCcw className="mr-2 h-4 w-4" /> Ulangi
            </Button>
            <Button onClick={() => setGameState('intro')} className="h-12 bg-purple-600 hover:bg-purple-700">
              <Home className="mr-2 h-4 w-4" /> Menu
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // --- TAMPILAN 2: MAIN QUIZ (PLAYING) ---
  if (gameState === 'playing') {
    const question = MOCK_QUESTIONS[currentQIndex]
    const progress = ((currentQIndex + 1) / MOCK_QUESTIONS.length) * 100

    return (
      <main className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col font-sans">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-800 w-full">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-12 flex flex-col justify-center">
          {/* Header Soal */}
          <div className="flex justify-between items-center mb-8">
            <div className="bg-white/10 px-4 py-2 rounded-full text-white text-sm font-bold border border-white/10">
              Soal {currentQIndex + 1} / {MOCK_QUESTIONS.length}
            </div>
            <div className="text-white font-bold text-xl flex items-center gap-2">
              <Trophy className="text-yellow-400 w-5 h-5" /> {score}
            </div>
          </div>

          {/* Kartu Soal */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 rounded-3xl mb-6 relative overflow-hidden">
             {/* Tombol Suara */}
             <button 
                onClick={() => handleSpeak(question.question)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 transition-colors"
             >
                {isSpeaking ? <StopCircle className="w-6 h-6 animate-pulse text-red-400" /> : <Volume2 className="w-6 h-6" />}
             </button>

            <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed pr-12">
              {question.question}
            </h2>
          </Card>

          {/* Pilihan Jawaban */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt, idx) => {
              // Logic Warna Tombol
              let btnClass = "bg-white/5 border-white/20 text-white hover:bg-white/10" // Default
              
              if (selectedOption) {
                if (opt === question.answer) {
                  btnClass = "bg-green-500/20 border-green-500 text-green-400" // Jawaban Benar (Selalu hijau di akhir)
                } else if (opt === selectedOption && opt !== question.answer) {
                  btnClass = "bg-red-500/20 border-red-500 text-red-400" // Jawaban Salah yg dipilih user
                } else {
                  btnClass = "bg-white/5 border-white/10 text-gray-500 opacity-50" // Opsi lain jadi redup
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selectedOption}
                  className={`
                    p-6 rounded-2xl border-2 text-left text-lg font-medium transition-all duration-300
                    flex items-center justify-between group
                    ${btnClass}
                  `}
                >
                  <span>{opt}</span>
                  {selectedOption === opt && (
                     isCorrect && opt === question.answer ? <CheckCircle2 className="text-green-400" /> : <XCircle className="text-red-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  // --- TAMPILAN 1: INTRO (LOBI) ---
  // (Ini kode asli kamu, saya bungkus dalam return)
  const difficultyColors = {
    easy: 'from-green-500 to-green-600',
    medium: 'from-yellow-500 to-yellow-600',
    hard: 'from-red-500 to-red-600'
  } as const

  const difficultyText = {
    easy: 'Mudah',
    medium: 'Sedang',
    hard: 'Sulit'
  } as const

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Materi</span>
        </button>

        {/* Quiz Header */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-400/30">
              <span className="text-7xl">{quiz.thumbnail}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
               <Target className="w-3 h-3" /> Mode Latihan Solo
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              {quiz.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              {quiz.description}
            </p>
            <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${difficultyColors[quiz.difficulty as keyof typeof difficultyColors]} text-white font-bold shadow-lg`}>
              Tingkat: {difficultyText[quiz.difficulty as keyof typeof difficultyText]}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{quiz.questionCount}</p>
              <p className="text-sm text-gray-400">Soal</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{quiz.duration}</p>
              <p className="text-sm text-gray-400">Menit</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{quiz.points}</p>
              <p className="text-sm text-gray-400">Poin Max</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">Solo</p>
              <p className="text-sm text-gray-400">Tanpa Lawan</p>
            </div>
          </div>

          {/* CTA Button (FUNGSI START AKTIF) */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="mr-3 h-6 w-6 fill-white" />
            Mulai Simulasi Sekarang
          </Button>
          <p className="text-center text-gray-400 text-sm mt-4">
             *Ini adalah mode latihan. Skor tidak akan masuk ke Leaderboard Global.
          </p>
        </div>

        {/* Quiz Rules */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-blue-500/30 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            📋 Aturan Simulasi
          </h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Jawablah dengan santai, tidak ada batas waktu per soal di mode ini.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Setiap jawaban benar akan memberimu poin latihan.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Gunakan fitur <span className="text-white font-bold">Suara (Speaker)</span> untuk mendengarkan soal.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">!</span>
              <span>Ini adalah simulasi untuk melatih mental sebelum masuk ke Arena Pertarungan.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}