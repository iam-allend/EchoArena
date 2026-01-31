'use client'

import { useParams, useRouter } from 'next/navigation'
import { subjects } from '@/lib/data/subjects'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.subject as string

  const subject = subjects.find(s => s.id === subjectId)

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Subject Not Found</h1>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Card>
      </div>
    )
  }

  const levels = [
    { id: 'sd', name: 'SD', desc: 'Sekolah Dasar', color: 'blue' },
    { id: 'smp', name: 'SMP', desc: 'Sekolah Menengah Pertama', color: 'purple' },
    { id: 'sma', name: 'SMA', desc: 'Sekolah Menengah Atas', color: 'pink' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-white mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <div className="text-6xl mb-4">{subject.emoji}</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {subject.title}
            </h1>
            <p className="text-purple-200 text-lg">{subject.description}</p>
          </div>
        </div>

        {/* Level Selection */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Pilih Jenjang Pendidikan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => (
            <Card
              key={level.id}
              onClick={() => router.push(`/learn/${subjectId}/${level.id}`)}
              className={`bg-gradient-to-br from-${level.color}-500/20 to-${level.color}-600/10 backdrop-blur-xl border-2 border-${level.color}-500/30 p-8 cursor-pointer hover:scale-105 transition-all`}
            >
              <div className="text-center">
                <GraduationCap className={`w-16 h-16 text-${level.color}-400 mx-auto mb-4`} />
                <h3 className="text-2xl font-bold text-white mb-2">{level.name}</h3>
                <p className="text-gray-300">{level.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}