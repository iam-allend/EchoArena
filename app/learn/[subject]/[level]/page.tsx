'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, BookOpen } from 'lucide-react'
import { getSubjectById, getLevelById, SubjectId, LevelId } from '@/lib/data/subjects'
import { getQuizzesBySubjectAndLevel } from '@/lib/data/quizzes'
import { getMaterialsBySubjectAndLevel } from '@/lib/data/materials'
import { QuizCard } from '@/components/learn/QuizCard'
import { MaterialCard } from '@/components/learn/MaterialCard'
import { useState } from 'react'

export default function LearnLevelPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'quiz' | 'material'>('quiz')

  const subjectId = params.subject as SubjectId
  const levelId = params.level as LevelId

  const subject = getSubjectById(subjectId)
  const level = getLevelById(subjectId, levelId)
  const quizzes = getQuizzesBySubjectAndLevel(subjectId, levelId)
  const materials = getMaterialsBySubjectAndLevel(subjectId, levelId)

  if (!subject || !level) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <p className="text-white text-xl">Subject atau Level tidak ditemukan</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex items-center gap-4 sm:gap-6 mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl">
              {subject.emoji}
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white">
                {subject.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg sm:text-xl text-purple-300">
                  {level.icon} {level.name}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{level.description}</span>
              </div>
            </div>
          </div>
          <p className="text-purple-200 text-lg">{subject.description}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/20 pb-2">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Kuis ({quizzes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('material')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${
              activeTab === 'material'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Materi ({materials.length})</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'quiz' ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              🏆 Daftar Kuis Tersedia
            </h2>
            {quizzes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-white/10">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Belum ada kuis tersedia untuk level ini
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              📚 Materi Pembelajaran
            </h2>
            {materials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-white/10">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Belum ada materi tersedia untuk level ini
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}