'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Clock, CheckCircle } from 'lucide-react'
import { getMaterialById } from '@/lib/data/materials'
import { Button } from '@/components/ui/button'

export default function MaterialDetailPage() {
  const params = useParams()
  const router = useRouter()

  const materialId = params.topicId as string
  const material = getMaterialById(materialId)

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <p className="text-white text-xl">Materi tidak ditemukan</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        {/* Material Header */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-blue-500/30 rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-400/30">
              <span className="text-7xl">{material.thumbnail}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              {material.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              {material.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="flex items-center gap-2 text-gray-300">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>{material.topics} Topik</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>{material.duration}</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {material.content.map((section, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-blue-500/20 rounded-2xl p-6 sm:p-8 shadow-xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {section.title}
                  </h2>
                  <p className="text-gray-300 leading-relaxed text-lg mb-4">
                    {section.content}
                  </p>

                  {/* Examples */}
                  {section.examples && section.examples.length > 0 && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Contoh:
                      </h3>
                      <ul className="space-y-2">
                        {section.examples.map((example, i) => (
                          <li key={i} className="text-white flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-2 border-green-500/30 rounded-3xl p-8 text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            🎉 Selamat! Kamu Telah Menyelesaikan Materi Ini
          </h2>
          <p className="text-gray-300 mb-6">
            Siap untuk menguji pemahamanmu? Coba kerjakan quiz terkait!
          </p>
          <Button
            onClick={() => router.push(`/learn/${material.subject}/${material.level}`)}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Lihat Quiz Terkait
          </Button>
        </div>
      </div>
    </main>
  )
}