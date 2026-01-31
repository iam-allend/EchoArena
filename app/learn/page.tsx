'use client'

import { useRouter } from 'next/navigation'
import { subjects } from '@/lib/data/subjects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react'

export default function LearnPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-white mb-4 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-purple-400" />
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Learning Center
              </h1>
            </div>
            <p className="text-purple-200 text-lg md:text-xl max-w-2xl mx-auto">
              Pilih mata pelajaran dan mulai perjalanan belajarmu dengan quiz interaktif dan materi lengkap
            </p>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              onClick={() => router.push(`/learn/${subject.id}`)}
              className={`bg-gradient-to-br from-${subject.color}-500/20 to-${subject.color}-600/10 backdrop-blur-xl border-2 border-${subject.color}-500/30 p-6 cursor-pointer hover:scale-105 transition-all group`}
            >
              <div className="w-full h-40 bg-black/20 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-6xl">{subject.emoji}</span>
              </div>
              
              <h3 className={`text-xl font-bold text-white mb-2 group-hover:text-${subject.color}-400 transition-colors`}>
                {subject.title}
              </h3>
              
              <p className="text-gray-300 text-sm mb-3">
                {subject.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{subject.count}</span>
                <Sparkles className={`w-4 h-4 text-${subject.color}-400`} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}