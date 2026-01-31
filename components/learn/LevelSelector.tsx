'use client'

import { X } from 'lucide-react'
import { Subject } from '@/lib/data/subjects'
import { useRouter } from 'next/navigation'

interface LevelSelectorProps {
  subject: Subject
  onClose: () => void
}

export function LevelSelector({ subject, onClose }: LevelSelectorProps) {
  const router = useRouter()

  const handleLevelClick = (levelId: string) => {
    router.push(`/learn/${subject.id}/${levelId}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 max-w-2xl w-full shadow-2xl animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl shadow-xl">
              {subject.emoji}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {subject.title}
              </h2>
              <p className="text-purple-300 mt-1">{subject.description}</p>
            </div>
          </div>
        </div>

        {/* Levels */}
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Pilih Jenjang Pendidikan:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subject.levels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelClick(level.id)}
                className={`group p-6 rounded-2xl border-2 bg-gradient-to-br hover:scale-105 transition-all duration-300 ${
                  subject.color === 'yellow'
                    ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/25'
                    : subject.color === 'green'
                    ? 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/25'
                    : subject.color === 'blue'
                    ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/25'
                    : 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/25'
                } hover:shadow-xl`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{level.icon}</div>
                  <h4 className="text-xl font-bold text-white mb-1">
                    {level.name}
                  </h4>
                  <p className="text-sm text-gray-300">{level.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}