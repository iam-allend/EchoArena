'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Eye, Zap } from 'lucide-react'
import { VoiceAnswerControl } from './VoiceAnswerControl'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  difficulty: string
}

interface QuestionDisplayProps {
  question: Question
  onAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void
  isMyTurn: boolean
  showResult?: {
    selectedAnswer: 'A' | 'B' | 'C' | 'D'
    correctAnswer: 'A' | 'B' | 'C' | 'D'
    isCorrect: boolean
  }
  disabled?: boolean
  phase?: string
}

export function QuestionDisplay({ 
  question, 
  onAnswer, 
  isMyTurn,
  showResult,
  disabled = false,
  phase = 'answering'
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)

  const options = [
    { letter: 'A' as const, text: question.option_a },
    { letter: 'B' as const, text: question.option_b },
    { letter: 'C' as const, text: question.option_c },
    { letter: 'D' as const, text: question.option_d },
  ]

  const handleSelect = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (!isMyTurn || disabled || showResult) return
    setSelectedAnswer(letter)
    onAnswer(letter)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getOptionStyle = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) {
      if (letter === showResult.correctAnswer) {
        return 'border-green-500 bg-green-500/20'
      }
      if (letter === showResult.selectedAnswer && !showResult.isCorrect) {
        return 'border-red-500 bg-red-500/20'
      }
      return 'border-white/20 bg-white/5 opacity-50'
    }

    if (selectedAnswer === letter) {
      return 'border-purple-500 bg-purple-500/20 scale-105'
    }

    return 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-purple-400'
  }

  return (
    <div className="space-y-4">
      {/* ✅ ACTIVE PLAYER BANNER */}
      {isMyTurn && phase === 'answering' && !showResult && (
        <Card className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 p-4 animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <Zap className="h-6 w-6 text-green-300 animate-bounce" />
            <p className="text-white font-bold text-xl">
              🎤 GILIRANMU - Jawab Sekarang!
            </p>
            <Zap className="h-6 w-6 text-green-300 animate-bounce" />
          </div>
        </Card>
      )}

      {/* ✅ SPECTATOR BANNER */}
      {!isMyTurn && !showResult && (
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 p-4">
          <div className="flex items-center justify-center gap-3">
            <Eye className="h-5 w-5 text-blue-300" />
            <p className="text-blue-200 font-semibold text-lg">
              👀 Mode Penonton - Tonton & Dengarkan
            </p>
          </div>
        </Card>
      )}

      {/* Voice Answer Control */}
      {isMyTurn && phase === 'answering' && !showResult && (
        <VoiceAnswerControl
          onAnswer={handleSelect}
          isActive={true}
          disabled={disabled}
        />
      )}

      {/* ✅ MAIN CARD - Different styles for active vs spectator */}
      <Card className={`
        backdrop-blur-sm p-6 transition-all duration-300
        ${isMyTurn && !showResult
          ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-4 border-green-400 shadow-2xl shadow-green-500/50'
          : 'bg-white/10 border-white/20 opacity-80'
        }
      `}>
        {/* Difficulty Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty.toUpperCase()}
          </span>
          
          {/* Turn Indicator */}
          {isMyTurn && !showResult && (
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-green-300 text-sm font-bold">AKTIF</span>
            </div>
          )}
        </div>

        {/* Question Text */}
        <h2 className={`text-2xl font-bold mb-6 ${
          isMyTurn ? 'text-white' : 'text-purple-200'
        }`}>
          {question.question_text}
        </h2>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <button
              key={option.letter}
              onClick={() => handleSelect(option.letter)}
              disabled={!isMyTurn || disabled || !!showResult}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                text-left
                ${getOptionStyle(option.letter)}
                ${(!isMyTurn || disabled || showResult) ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                ${isMyTurn && !disabled && !showResult ? 'hover:shadow-lg hover:shadow-purple-500/50' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${selectedAnswer === option.letter || showResult?.correctAnswer === option.letter
                    ? 'bg-white text-purple-900' 
                    : isMyTurn ? 'bg-purple-500 text-white' : 'bg-purple-400 text-white'}
                `}>
                  {option.letter}
                </div>
                
                <p className={`font-medium flex-1 mt-1 ${
                  isMyTurn ? 'text-white' : 'text-purple-200'
                }`}>
                  {option.text}
                </p>

                {showResult && (
                  <>
                    {option.letter === showResult.correctAnswer && (
                      <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    )}
                    {option.letter === showResult.selectedAnswer && !showResult.isCorrect && (
                      <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Waiting Message */}
        {!isMyTurn && !showResult && (
          <div className="mt-6 text-center">
            <p className="text-purple-300 text-lg font-medium">
              🎧 Dengarkan pemain lain menjawab...
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}