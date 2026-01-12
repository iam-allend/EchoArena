'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'

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
}

export function QuestionDisplay({ 
  question, 
  onAnswer, 
  isMyTurn,
  showResult,
  disabled = false
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
    // Show result mode
    if (showResult) {
      if (letter === showResult.correctAnswer) {
        return 'border-green-500 bg-green-500/20'
      }
      if (letter === showResult.selectedAnswer && !showResult.isCorrect) {
        return 'border-red-500 bg-red-500/20'
      }
      return 'border-white/20 bg-white/5 opacity-50'
    }

    // Selection mode
    if (selectedAnswer === letter) {
      return 'border-purple-500 bg-purple-500/20 scale-105'
    }

    return 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-purple-400'
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
      {/* Difficulty Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </span>
        {!isMyTurn && !showResult && (
          <span className="text-yellow-400 text-sm font-semibold animate-pulse">
            ⏳ Wait for your turn...
          </span>
        )}
      </div>

      {/* Question Text */}
      <h2 className="text-2xl font-bold text-white mb-6">
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
              ${(!isMyTurn || disabled || showResult) ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Letter Badge */}
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                ${selectedAnswer === option.letter || showResult?.correctAnswer === option.letter
                  ? 'bg-white text-purple-900' 
                  : 'bg-purple-500 text-white'}
              `}>
                {option.letter}
              </div>
              
              {/* Option Text */}
              <p className="text-white font-medium flex-1 mt-1">
                {option.text}
              </p>

              {/* Result Icons */}
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

      {/* Waiting message */}
      {!isMyTurn && !showResult && (
        <p className="text-center text-purple-200 mt-4">
          🎤 Another player is answering...
        </p>
      )}
    </Card>
  )
}