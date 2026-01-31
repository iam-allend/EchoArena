'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Clock, Target, Zap, Play } from 'lucide-react'
import { getQuizById } from '@/lib/data/quizzes'
import { Button } from '@/components/ui/button'

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()

  const quizId = params.quizId as string
  const quiz = getQuizById(quizId)

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <p className="text-white text-xl">Quiz tidak ditemukan</p>
      </div>
    )
  }

  const difficultyColors = {
    easy: 'from-green-500 to-green-600',
    medium: 'from-yellow-500 to-yellow-600',
    hard: 'from-red-500 to-red-600'
  }

  const difficultyText = {
    easy: 'Mudah',
    medium: 'Sedang',
    hard: 'Sulit'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
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
          <span>Kembali</span>
        </button>

        {/* Quiz Header */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-400/30">
              <span className="text-7xl">{quiz.thumbnail}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              {quiz.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              {quiz.description}
            </p>
            <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${difficultyColors[quiz.difficulty]} text-white font-bold`}>
              Tingkat: {difficultyText[quiz.difficulty]}
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
              <p className="text-sm text-gray-400">Poin</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">Real-time</p>
              <p className="text-sm text-gray-400">Mode</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => alert('Fitur quiz akan segera hadir! Saat ini masih dalam tahap pengembangan.')}
            size="lg"
            className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Play className="mr-3 h-6 w-6" />
            Mulai Quiz Sekarang
          </Button>
        </div>

        {/* Quiz Rules */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-blue-500/30 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            📋 Aturan Quiz
          </h2>
          <ul className="space-y-4 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Setiap soal memiliki waktu {Math.floor(quiz.duration / quiz.questionCount)} detik untuk dijawab</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Jawaban benar mendapat {Math.floor(quiz.points / quiz.questionCount)} poin</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Kamu bisa menjawab dengan suara atau klik</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span>Tidak ada pengurangan poin untuk jawaban salah</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold">!</span>
              <span>Pastikan koneksi internetmu stabil</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}