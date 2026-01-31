'use client'

import { Trophy, Clock, Target } from 'lucide-react'
import { Quiz } from '@/lib/data/quizzes'
import { useRouter } from 'next/navigation'

interface QuizCardProps {
  quiz: Quiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  const router = useRouter()

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
    <div
      onClick={() => router.push(`/learn/${quiz.subject}/${quiz.level}/quiz/${quiz.id}`)}
      className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer hover:scale-105"
    >
      {/* Thumbnail */}
      <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl mb-4 flex items-center justify-center border border-purple-400/30">
        <span className="text-6xl">{quiz.thumbnail}</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
        {quiz.title}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {quiz.description}
      </p>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span>{quiz.questionCount} Soal</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{quiz.duration} menit</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-4 h-4" />
            <span>{quiz.points} poin</span>
          </div>
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${difficultyColors[quiz.difficulty]} text-white text-xs font-bold`}>
            {difficultyText[quiz.difficulty]}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold transition-all">
        Mulai Quiz
      </button>
    </div>
  )
}