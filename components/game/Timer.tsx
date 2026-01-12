'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  duration: number // in seconds
  onComplete: () => void
  isPaused?: boolean
  label?: string
}

export function Timer({ duration, onComplete, isPaused = false, label }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration])

  useEffect(() => {
    if (isPaused) return

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
  }, [isPaused, onComplete])

  const percentage = (timeLeft / duration) * 100
  const isLow = percentage < 30
  const isCritical = percentage < 10

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-white" />
          <span className="text-white font-semibold">{label || 'Time Left'}</span>
        </div>
        <span className={`text-2xl font-bold ${
          isCritical ? 'text-red-400 animate-pulse' : 
          isLow ? 'text-yellow-400' : 
          'text-white'
        }`}>
          {timeLeft}s
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? 'bg-red-500' : 
            isLow ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}