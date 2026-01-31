'use client'

import { BookOpen, Clock } from 'lucide-react'
import { Material } from '@/lib/data/materials'
import { useRouter } from 'next/navigation'

interface MaterialCardProps {
  material: Material
}

export function MaterialCard({ material }: MaterialCardProps) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/learn/${material.subject}/${material.level}/material/${material.id}`)}
      className="group bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer hover:scale-105"
    >
      {/* Thumbnail */}
      <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-4 flex items-center justify-center border border-blue-400/30">
        <span className="text-6xl">{material.thumbnail}</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
        {material.title}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {material.description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span>{material.topics} Topik</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{material.duration}</span>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-bold transition-all">
        Pelajari Materi
      </button>
    </div>
  )
}