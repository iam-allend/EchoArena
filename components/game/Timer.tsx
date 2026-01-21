'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface TimerProps {
  duration: number // seconds
  onComplete: () => void
  label?: string
}

export function Timer({ duration, onComplete, label = 'Time Remaining' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  const percentage = (timeLeft / duration) * 100
  const isUrgent = timeLeft <= 3

  return (
    <Card className={`p-4 ${
      isUrgent 
        ? 'bg-red-500/20 border-red-400 animate-pulse' 
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-400' : 'text-purple-400'}`} />
          <span className="text-white font-semibold">{label}</span>
        </div>
        <span className={`text-2xl font-bold ${
          isUrgent ? 'text-red-400' : 'text-white'
        }`}>
          {timeLeft}s
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-red-500' : 'bg-purple-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  )
}