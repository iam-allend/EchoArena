'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useGameBroadcast, GameEvent } from '@/hooks/useGameBroadcast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Home, Trophy } from 'lucide-react'
import { Timer } from '@/components/game/Timer'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
import { GameHeader } from '@/components/game/GameHeader'
import { VoiceControl } from '@/components/game/VoiceControl'

import { MusicControl } from '@/components/ui/MusicControl'

type GamePhase = 'loading' | 'reading' | 'answering' | 'result' | 'waiting' | 'stage_transition' | 'finished'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer?: string
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
  const [nextStageNumber, setNextStageNumber] = useState<number | null>(null)

  const hasAnswered = useRef(false)

  // ✅ Handle broadcast events
  const handleGameEvent = useCallback(async (event: GameEvent) => {
    console.log('🎯 Event received:', event.type)

    switch (event.type) {
      case 'QUESTION_LOADED':
        console.log('📖 Question loaded event')
        setCurrentQuestion(event.question)
        hasAnswered.current = false
        
        // Check if it's my turn
        const stateResp = await fetch(`/api/game/${roomId}/state`)
        const stateData = await stateResp.json()
        
        if (stateData.success) {
          setGameState(stateData.game)
          const isMyTurn = stateData.game.currentTurn?.user_id === user?.id
          
          if (isMyTurn) {
            console.log('✅ My turn - start reading')
            setPhase('reading')
          } else {
            console.log('👀 Spectating')
            setPhase('waiting')
          }
        }
        break

      case 'ANSWER_SUBMITTED':
        console.log('✍️ Answer submitted by:', event.userId)
        
        // Refresh game state
        const answerResp = await fetch(`/api/game/${roomId}/state`)
        const answerData = await answerResp.json()
        
        if (answerData.success) {
          setGameState(answerData.game)
          
          // Check if it's now my turn
          const nowMyTurn = answerData.game.currentTurn?.user_id === user?.id
          
          if (nowMyTurn && !hasAnswered.current) {
            console.log('🎯 Now my turn!')
            setPhase('waiting')
            setCurrentQuestion(null)
            
            // Small delay then load question
            setTimeout(() => {
              loadQuestion()
            }, 500)
          }
        }
        break

      case 'STAGE_COMPLETE':
        console.log('📈 Stage complete, moving to:', event.nextStage)
        
        // ✅ Show transition screen
        setNextStageNumber(event.nextStage)
        setPhase('stage_transition')
        setCurrentQuestion(null)
        setAnswerResult(null)
        hasAnswered.current = false
        
        // ✅ Auto-dismiss after 3 seconds and load question
        setTimeout(async () => {
          await refreshGameState()
          
          // Fetch latest turn
          const stateResp = await fetch(`/api/game/${roomId}/state`)
          const stateData = await stateResp.json()
          
          if (stateData.success) {
            setGameState(stateData.game)
            const isMyTurn = stateData.game.currentTurn?.user_id === user?.id
            
            if (isMyTurn) {
              console.log('🎯 My turn in new stage - loading question')
              setPhase('waiting')
              
              // Load question
              setTimeout(() => {
                loadQuestion()
              }, 500)
            } else {
              console.log('👀 Not my turn - waiting for question')
              setPhase('waiting')
            }
          }
        }, 3000)
        break

      case 'GAME_FINISHED':
        console.log('🏁 Game finished')
        setPhase('finished')
        break
    }
  }, [roomId, user?.id])

  // ✅ Setup broadcast
  const { broadcast } = useGameBroadcast({
    roomId,
    onEvent: handleGameEvent,
    enabled: !authLoading && !!user,
  })

// Initialize game
useEffect(() => {
  if (!authLoading && user && roomId) {
    initializeGame()
  }

  // ✅ FIX: Cleanup dengan dynamic import
  return () => {
    // Cleanup Agora saat leave game page
    import('@/lib/agora/client').then((module) => {
      module.default.cleanup()
    })
  }
}, [authLoading, user, roomId])

  async function initializeGame() {
    try {
      console.log('🎮 Initializing game...')

      const response = await fetch(`/api/game/${roomId}/state`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      console.log('✅ Game state loaded')
      console.log('🎤 Voice room URL:', data.game.room.voice_room_url) // ✅ ADD THIS

      setGameState(data.game)
      setLoading(false)

      const isMyTurn = data.game.currentTurn?.user_id === user?.id
      
      if (isMyTurn) {
        console.log('🎯 My turn! Loading question...')
        hasAnswered.current = false
        await loadQuestion()
      } else {
        console.log('👀 Not my turn, checking for active question...')
        await loadCurrentQuestion()
      }
    } catch (error: any) {
      console.error('❌ Initialize error:', error)
      alert(`Failed: ${error.message}`)
      router.push('/dashboard')
    }
    
  }
  

  async function loadCurrentQuestion() {
    try {
      const { data } = await supabase
        .from('active_questions')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle()

      if (data) {
        console.log('✅ Found active question:', data.question_id)
        setCurrentQuestion({
          id: data.question_id,
          question_text: data.question_text,
          option_a: data.option_a,
          option_b: data.option_b,
          option_c: data.option_c,
          option_d: data.option_d,
          difficulty: data.difficulty,
        })
        setPhase('waiting')
      } else {
        setPhase('waiting')
      }
    } catch (error) {
      console.error('Load current question error:', error)
      setPhase('waiting')
    }
  }

  async function loadQuestion() {
    try {
      console.log('❓ Loading NEW question...')
      
      const response = await fetch(`/api/game/${roomId}/question`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      console.log('✅ Question API called (will broadcast)')
      
      // Question akan di-broadcast dan diterima via handleGameEvent
    } catch (error: any) {
      console.error('❌ Load question error:', error)
      alert('Failed to load question')
    }
  }

  async function refreshGameState() {
    try {
      const response = await fetch(`/api/game/${roomId}/state`)
      const data = await response.json()

      if (data.success) {
        setGameState(data.game)
      }
    } catch (error) {
      console.error('Refresh error:', error)
    }
  }

  function handleReadingComplete() {
    console.log('📖 Reading done')
    setPhase('answering')
  }

  async function handleAnswer(selectedAnswer: 'A' | 'B' | 'C' | 'D') {
    if (isSubmitting || !currentQuestion || !gameState || hasAnswered.current) {
      console.log('⚠️ Cannot answer')
      return
    }

    hasAnswered.current = true
    setIsSubmitting(true)

    try {
      console.log('✍️ Submitting:', selectedAnswer)

      const response = await fetch(`/api/game/${roomId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          stageNumber: gameState.room.current_stage,
          questionId: currentQuestion.id,
          selectedAnswer,
          timeTaken: 10,
          voiceTranscript: null,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      console.log('✅ Answer submitted')

      setAnswerResult({
        selectedAnswer,
        correctAnswer: data.result.correct_answer,
        isCorrect: data.result.is_correct,
        pointsEarned: data.result.points_earned,
        livesRemaining: data.result.lives_remaining,
      })
      setPhase('result')

      // Wait then check stage complete
      setTimeout(async () => {
        if (data.stageComplete) {
          await handleStageComplete()
        } else {
          console.log('⏳ Waiting for next turn')
          setPhase('waiting')
          setAnswerResult(null)
        }
      }, 3000)
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      hasAnswered.current = false
      alert(`Failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAnsweringTimeout() {
    console.log('⏰ Timeout - auto answer A')
    handleAnswer('A')
  }

  async function handleStageComplete() {
    console.log('🏁 Stage complete')
    
    try {
      const response = await fetch(`/api/game/${roomId}/next-stage`, {
        method: 'POST',
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Event STAGE_COMPLETE atau GAME_FINISHED akan di-broadcast
    } catch (error: any) {
      console.error('❌ Next stage error:', error)
    }
  }

  async function reloadGameState() {
    try {
      const response = await fetch(`/api/game/${roomId}/state`)
      const data = await response.json()

      if (data.success) {
        setGameState(data.game)

        if (data.game.currentTurn?.user_id === user?.id) {
          if (!currentQuestion && phase === 'waiting' && !hasAnswered.current) {
            await loadQuestion()
          }
        } else {
          setPhase('waiting')
        }
      }
    } catch (error) {
      console.error('Failed reload:', error)
    }
  }

  // ===== RENDER =====

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

  const isMyTurn = gameState.currentTurn?.user_id === user.id

  // ===== STAGE TRANSITION SCREEN =====
  if (phase === 'stage_transition') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-12 text-center max-w-2xl mx-4 animate-pulse">
          <div className="mb-6">
            <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Stage {gameState.room.current_stage} Complete!
          </h1>
          <p className="text-2xl text-purple-200 mb-8">
            Moving to Stage {nextStageNumber}...
          </p>
          
          {/* Leaderboard */}
          <div className="space-y-2 mb-6">
            {gameState.participants
              .sort((a: any, b: any) => b.total_score - a.total_score)
              .slice(0, 3)
              .map((p: any, i: number) => (
                <div key={p.user_id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <span className="text-white font-bold">
                    {i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'} {p.user.username}
                  </span>
                  <span className="text-yellow-400 font-bold">{p.total_score} pts</span>
                </div>
              ))}
          </div>

          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
        </Card>
      </div>
    )
  }

  // ===== FINISHED STATE =====
  if (phase === 'finished') {
    const sortedParticipants = gameState.participants
      .filter((p: any) => p.status === 'active')
      .sort((a: any, b: any) => b.total_score - a.total_score)

    const winner = sortedParticipants[0]
    const myRank = sortedParticipants.findIndex((p: any) => p.user_id === user.id) + 1
    const isWinner = winner?.user_id === user.id

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          {/* Personal Result Card */}
          <Card className={`backdrop-blur-sm border-2 p-8 text-center mb-6 ${
            isWinner 
              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400' 
              : 'bg-white/10 border-white/20'
          }`}>
            {isWinner ? (
              <>
                <div className="mb-6">
                  <div className="text-8xl mb-4 animate-bounce">🏆</div>
                  <h1 className="text-6xl font-bold text-yellow-400 mb-2">
                    YOU WIN!
                  </h1>
                  <p className="text-3xl text-white font-bold">
                    Congratulations, {winner.user.username}!
                  </p>
                </div>
                <div className="flex justify-center gap-8 mb-4">
                  <div className="bg-white/10 rounded-lg p-4 min-w-[120px]">
                    <p className="text-purple-200 text-sm">Total Score</p>
                    <p className="text-4xl font-bold text-yellow-400">{winner.total_score}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 min-w-[120px]">
                    <p className="text-purple-200 text-sm">Rank</p>
                    <p className="text-4xl font-bold text-yellow-400">#1</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-6xl mb-4">
                    {myRank === 2 && '🥈'}
                    {myRank === 3 && '🥉'}
                    {myRank > 3 && '🎮'}
                  </div>
                  <h1 className="text-5xl font-bold text-white mb-2">
                    Game Over!
                  </h1>
                  <p className="text-2xl text-purple-200">
                    You finished in{' '}
                    <span className="font-bold text-yellow-400">
                      {myRank === 1 && '1st'}
                      {myRank === 2 && '2nd'}
                      {myRank === 3 && '3rd'}
                      {myRank > 3 && `${myRank}th`}
                    </span>{' '}
                    place!
                  </p>
                </div>
                <div className="flex justify-center gap-8 mb-4">
                  <div className="bg-white/10 rounded-lg p-4 min-w-[120px]">
                    <p className="text-purple-200 text-sm">Your Score</p>
                    <p className="text-4xl font-bold text-white">
                      {sortedParticipants.find((p: any) => p.user_id === user.id)?.total_score || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 min-w-[120px]">
                    <p className="text-purple-200 text-sm">Rank</p>
                    <p className="text-4xl font-bold text-white">#{myRank}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Winner Announcement (if not winner) */}
          {!isWinner && (
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-400 p-6 text-center mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-5xl">👑</div>
                <div className="text-left">
                  <p className="text-yellow-400 text-sm font-semibold">WINNER</p>
                  <p className="text-3xl font-bold text-white">{winner.user.username}</p>
                  <p className="text-yellow-400 font-bold">{winner.total_score} points</p>
                </div>
              </div>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              🏅 Final Leaderboard
            </h2>
            <div className="space-y-3">
              {sortedParticipants.map((p: any, i: number) => {
                const isMe = p.user_id === user.id
                const rank = i + 1
                
                return (
                  <div 
                    key={p.user_id} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isMe 
                        ? 'bg-blue-500/30 border-2 border-blue-400 scale-105' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl min-w-[50px] text-center">
                        {rank === 1 && '🥇'}
                        {rank === 2 && '🥈'}
                        {rank === 3 && '🥉'}
                        {rank > 3 && `#${rank}`}
                      </div>
                      <div>
                        <p className={`font-bold ${isMe ? 'text-blue-300' : 'text-white'}`}>
                          {p.user.username} {isMe && '(You)'}
                        </p>
                        <p className="text-sm text-purple-200">
                          Level {p.user.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        rank === 1 ? 'text-yellow-400' : 
                        rank === 2 ? 'text-gray-300' : 
                        rank === 3 ? 'text-orange-400' : 
                        'text-white'
                      }`}>
                        {p.total_score}
                      </p>
                      <p className="text-sm text-purple-200">points</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
            <Button
              size="lg"
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              disabled
            >
              🔄 Play Again (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN GAME UI =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {/* ✅ ADD VOICE CONTROL */}
            <div className="mt-4">
              <VoiceControl
                voiceRoomUrl={gameState.room.voice_room_url}
                isMyTurn={isMyTurn}
                myUserId={user.id}
              />
            </div>
          </div>
          

          <div className="lg:col-span-2 space-y-4">
            {isMyTurn && currentQuestion && phase !== 'result' && !hasAnswered.current && (
              <Timer
                key={`${currentQuestion.id}-${phase}`}
                duration={phase === 'reading' ? 5 : 10}
                onComplete={phase === 'reading' ? handleReadingComplete : handleAnsweringTimeout}
                label={phase === 'reading' ? 'Reading Time' : 'Answer Time'}
              />
            )}

            {currentQuestion ? (
              <QuestionDisplay
                question={currentQuestion}
                onAnswer={handleAnswer}
                isMyTurn={isMyTurn && !hasAnswered.current}
                showResult={phase === 'result' ? answerResult : undefined}
                disabled={phase === 'reading' || isSubmitting || !isMyTurn || hasAnswered.current}
                phase={phase} // ✅ ADD THIS LINE
              />
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                <p className="text-white text-xl">
                  {phase === 'waiting' 
                    ? '⏳ Waiting for next question...' 
                    : 'Loading...'}
                </p>
              </Card>
            )}

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
                      Lives: {answerResult.livesRemaining}/3
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Card */}
        <Card className="mt-6 bg-black/40 p-4">
          <h3 className="text-yellow-400 font-bold mb-2">DEBUG INFO</h3>
          <div className="text-white text-sm space-y-1 font-mono">
            <p>Phase: <span className="text-cyan-400">{phase}</span></p>
            <p>Turn: <span className="text-cyan-400">{gameState.currentTurn?.username || 'NULL'}</span></p>
            <p>My Turn: <span className="text-cyan-400">{isMyTurn ? 'YES' : 'NO'}</span></p>
            <p>Question ID: <span className="text-cyan-400">{currentQuestion?.id || 'NULL'}</span></p>
            <p>Has Answered: <span className="text-cyan-400">{hasAnswered.current ? 'YES' : 'NO'}</span></p>
            <p>Stage: <span className="text-cyan-400">{gameState.room.current_stage}/{gameState.room.max_stages}</span></p>
          </div>
          <Button 
            onClick={() => reloadGameState()} 
            className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600"
            size="sm"
          >
            🔄 Force Reload State
          </Button>
        </Card>
      </div>

      <MusicControl trackUrl="/audio/home/upbeat-game-menu.mp3" />
      
    </div>
    
  )
}