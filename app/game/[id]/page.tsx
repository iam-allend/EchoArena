'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Home } from 'lucide-react'
import { Timer } from '@/components/game/Timer'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
import { GameHeader } from '@/components/game/GameHeader'

type GamePhase = 'loading' | 'reading' | 'answering' | 'result' | 'waiting' | 'finished'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  difficulty: string
}

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const roomId = params.id as string

  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [answerResult, setAnswerResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && user && roomId) {
      initializeGame()
    }
  }, [authLoading, user, roomId])

  async function initializeGame() {
    try {
      console.log('🎮 Initializing game...')

      // Get game state
      const response = await fetch(`/api/game/${roomId}/state`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setGameState(data.game)
      setLoading(false)

      // Check if it's my turn
      if (data.game.currentTurn?.user_id === user?.id) {
        await loadQuestion()
      } else {
        setPhase('waiting')
      }

      // Subscribe to game updates
      subscribeToGameUpdates()
    } catch (error: any) {
      console.error('❌ Initialize game error:', error)
      alert(`Failed to load game: ${error.message}`)
      router.push('/dashboard')
    }
  }

  async function loadQuestion() {
    try {
      console.log('❓ Loading question...')
      
      const response = await fetch(`/api/game/${roomId}/question`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setCurrentQuestion(data.question)
      setPhase('reading')
      
      console.log('✅ Question loaded:', data.question.id)
    } catch (error: any) {
      console.error('❌ Load question error:', error)
      alert('Failed to load question')
    }
  }

  function subscribeToGameUpdates() {
    console.log('🔔 Setting up real-time subscriptions...')

    // Subscribe to room updates
    const roomChannel = supabase
      .channel(`game_room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log('🎮 Room updated:', payload.new)
          handleRoomUpdate(payload.new)
        }
      )
      .subscribe()

    // Subscribe to turn queue updates
    const turnChannel = supabase
      .channel(`turn_queue:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turn_queue',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('🔄 Turn updated, reloading state...')
          reloadGameState()
        }
      )
      .subscribe()

    // Subscribe to participant updates (score, lives)
    const participantChannel = supabase
      .channel(`participants:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('👥 Participants updated, reloading state...')
          reloadGameState()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(turnChannel)
      supabase.removeChannel(participantChannel)
    }
  }

  async function reloadGameState() {
    try {
      const response = await fetch(`/api/game/${roomId}/state`)
      const data = await response.json()

      if (data.success) {
        setGameState(data.game)

        // Check if it's now my turn
        if (data.game.currentTurn?.user_id === user?.id && phase === 'waiting') {
          await loadQuestion()
        } else if (!data.game.currentTurn || data.game.currentTurn?.user_id !== user?.id) {
          setPhase('waiting')
          setCurrentQuestion(null)
          setAnswerResult(null)
        }
      }
    } catch (error) {
      console.error('Failed to reload game state:', error)
    }
  }

  function handleRoomUpdate(room: any) {
    if (room.status === 'finished') {
      setPhase('finished')
    }
  }

  function handleReadingComplete() {
    console.log('📖 Reading time complete, starting answer timer...')
    setPhase('answering')
  }

  async function handleAnswer(selectedAnswer: 'A' | 'B' | 'C' | 'D') {
    if (isSubmitting || !currentQuestion || !gameState) return

    setIsSubmitting(true)

    try {
      console.log('✍️ Submitting answer:', selectedAnswer)

      const response = await fetch(`/api/game/${roomId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          stageNumber: gameState.room.current_stage,
          questionId: currentQuestion.id,
          selectedAnswer,
          timeTaken: 10, // TODO: Calculate actual time
          voiceTranscript: null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      console.log('✅ Answer result:', data.result)

      // Show result
      setAnswerResult({
        selectedAnswer,
        correctAnswer: data.result.correct_answer,
        isCorrect: data.result.is_correct,
        pointsEarned: data.result.points_earned,
        livesRemaining: data.result.lives_remaining,
      })
      setPhase('result')

      // Wait 3 seconds then check stage status
      setTimeout(async () => {
        if (data.stageComplete) {
          await handleStageComplete()
        } else {
          setPhase('waiting')
          setCurrentQuestion(null)
          setAnswerResult(null)
        }
      }, 3000)
    } catch (error: any) {
      console.error('❌ Submit answer error:', error)
      alert(`Failed to submit answer: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAnsweringTimeout() {
    console.log('⏰ Time out! Auto-submitting wrong answer...')
    // Auto-submit wrong answer (assume A)
    handleAnswer('A')
  }

  async function handleStageComplete() {
    console.log('🏁 Stage complete!')
    
    try {
      const response = await fetch(`/api/game/${roomId}/next-stage`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      if (data.gameFinished) {
        setPhase('finished')
      }
      // Game will continue via real-time updates
    } catch (error: any) {
      console.error('❌ Next stage error:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading game...</p>
        </div>
      </div>
    )
  }

  if (!gameState || !user) {
    return null
  }

  // ✅ DEBUG: Log game state
  console.log('🎮 Game State:', {
    currentTurn: gameState.currentTurn,
    roomStatus: gameState.room?.status,
    currentStage: gameState.room?.current_stage,
    myUserId: user.id,
    phase,
  })

  const isMyTurn = gameState.currentTurn?.user_id === user.id
  const myData = gameState.participants.find((p: any) => p.user_id === user.id)

  // Game finished screen
  if (phase === 'finished') {
    const winner = gameState.participants
      .filter((p: any) => p.status === 'active')
      .sort((a: any, b: any) => b.total_score - a.total_score)[0]

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎉 Game Over!
            </h1>
            <p className="text-2xl text-purple-200 mb-8">
              Winner: {winner?.user.username} with {winner?.total_score} points!
            </p>

            <div className="space-y-3 mb-8">
              {gameState.participants
                .sort((a: any, b: any) => b.total_score - a.total_score)
                .map((p: any, i: number) => (
                  <div key={p.user_id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                    <span className="text-white font-bold">#{i + 1} {p.user.username}</span>
                    <span className="text-white font-bold">{p.total_score} points</span>
                  </div>
                ))}
            </div>

            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Game info */}
          <div className="lg:col-span-1">
            <GameHeader
              roomCode={gameState.room.room_code}
              currentStage={gameState.room.current_stage}
              maxStages={gameState.room.max_stages}
              currentTurn={gameState.currentTurn}
              participants={gameState.participants}
              myUserId={user.id}
              isHost={gameState.room.host_user_id === user.id}
            />
          </div>

          {/* Main content - Question */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timer */}
            {isMyTurn && currentQuestion && phase !== 'result' && (
              <Timer
                duration={phase === 'reading' ? 5 : 10}
                onComplete={phase === 'reading' ? handleReadingComplete : handleAnsweringTimeout}
                label={phase === 'reading' ? 'Reading Time' : 'Answer Time'}
              />
            )}

            {/* Question or Waiting */}
            {currentQuestion ? (
              <QuestionDisplay
                question={currentQuestion}
                onAnswer={handleAnswer}
                isMyTurn={isMyTurn}
                showResult={phase === 'result' ? answerResult : undefined}
                disabled={phase === 'reading' || isSubmitting}
              />
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                <p className="text-white text-xl">
                  {phase === 'waiting' 
                    ? '⏳ Waiting for other players...' 
                    : 'Loading question...'}
                </p>
              </Card>
            )}

            {/* Result Display */}
            {phase === 'result' && answerResult && (
              <Card className={`p-6 border-2 ${
                answerResult.isCorrect 
                  ? 'bg-green-500/20 border-green-400' 
                  : 'bg-red-500/20 border-red-400'
              }`}>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {answerResult.isCorrect ? '✅ Correct!' : '❌ Wrong!'}
                  </h2>
                  {answerResult.isCorrect ? (
                    <p className="text-white text-xl">
                      +{answerResult.pointsEarned} points!
                    </p>
                  ) : (
                    <p className="text-white text-xl">
                      Lives remaining: {answerResult.livesRemaining}/3
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ✅ DEBUG PANEL - Hapus setelah fix */}
        <Card className="mt-6 bg-black/40 backdrop-blur-sm border-yellow-400/50 p-4">
          <h3 className="text-yellow-400 font-bold mb-2">🐛 DEBUG INFO</h3>
          <div className="text-white text-sm space-y-1 font-mono">
            <p>Room ID: {roomId}</p>
            <p>Room Status: {gameState.room?.status}</p>
            <p>Current Stage: {gameState.room?.current_stage}/{gameState.room?.max_stages}</p>
            <p>Phase: {phase}</p>
            <p>My User ID: {user.id}</p>
            <p>Current Turn User ID: {gameState.currentTurn?.user_id || 'NULL'}</p>
            <p>Current Turn Username: {gameState.currentTurn?.username || 'NULL'}</p>
            <p>Is My Turn: {isMyTurn ? 'YES' : 'NO'}</p>
            <p>Has Question: {currentQuestion ? 'YES' : 'NO'}</p>
            <p>Participants: {gameState.participants?.length || 0}</p>
          </div>
          <Button 
            onClick={() => reloadGameState()} 
            className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600"
            size="sm"
          >
            🔄 Reload Game State
          </Button>
        </Card>
      </div>
    </div>
  )
}