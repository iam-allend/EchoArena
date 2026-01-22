'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useGameBroadcast, GameEvent } from '@/hooks/useGameBroadcast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Home, Trophy, Crown, Star, X, Award, Target, Zap, Users, Clock } from 'lucide-react'
import { Timer } from '@/components/game/Timer'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
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

// ===== LEADERBOARD COMPONENT =====
function ModernLeaderboard({ 
  participants, 
  myUserId, 
  roomCode, 
  currentStage, 
  maxStages,
  currentTurn 
}: any) {
  const [showPopup, setShowPopup] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  const sortedParticipants = [...participants]
    .filter((p: any) => p.status === 'active')
    .sort((a: any, b: any) => b.total_score - a.total_score)

  const top3 = sortedParticipants.slice(0, 3)
  const restOfPlayers = sortedParticipants.slice(3)

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player)
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
    setSelectedPlayer(null)
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-pink-900/40 backdrop-blur-xl border-2 border-purple-500/30 overflow-hidden relative">
  {/* Animated Stars Background */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={`star-${i}`}
        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
        }}
      />
    ))}
  </div>

  {/* Header */}
  <div className="relative p-4 md:p-6 border-b border-purple-500/30">
    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
        <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400">
          Leaderboard
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-2 md:px-3 py-1 bg-purple-500/30 rounded-full border border-purple-400/50">
          <p className="text-xs text-purple-200">
            Stage {currentStage}/{maxStages}
          </p>
        </div>
        <div className="px-2 md:px-3 py-1 bg-blue-500/30 rounded-full border border-blue-400/50">
          <p className="text-xs text-blue-200">{roomCode}</p>
        </div>
      </div>
    </div>

    {/* Current Turn Indicator */}
    {currentTurn && (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-gray-300">
          Turn: <span className="text-white font-semibold">{currentTurn.username}</span>
        </span>
      </div>
    )}
  </div>

  {/* Podium - Top 3 */}
  <div className="relative p-4 md:p-6">
    <div className="flex items-end justify-center gap-2 md:gap-4 mb-6">
      {/* 2nd Place */}
      {top3[1] && (
        <div 
          className="flex flex-col items-center cursor-pointer transform hover:scale-105 transition-all duration-300 w-24 md:w-32"
          onClick={() => handlePlayerClick(top3[1])}
        >
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-gray-400 rounded-full blur-lg opacity-60 animate-pulse" />
            <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 flex items-center justify-center border-3 md:border-4 border-gray-300 shadow-xl">
              <Crown className="h-6 w-6 md:h-10 md:w-10 text-gray-700" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-xs md:text-sm font-bold text-gray-800">2</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-500/30 to-gray-700/40 backdrop-blur-md border-2 border-gray-400/50 rounded-xl md:rounded-2xl p-2 md:p-3 w-full text-center shadow-xl">
            <p className="text-xs md:text-sm font-bold text-white truncate mb-1">
              {top3[1].user.username}
            </p>
            <p className="text-lg md:text-2xl font-bold text-gray-200 mb-0.5">
              {top3[1].total_score}
            </p>
            <p className="text-xs text-gray-300">pts</p>
            <div className="flex gap-0.5 justify-center mt-1">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-xs ${i < top3[1].lives ? 'opacity-100' : 'opacity-30'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 h-16 md:h-24 w-full bg-gradient-to-t from-gray-600/50 to-gray-500/30 rounded-t-xl md:rounded-t-2xl border-2 border-gray-400/30 border-b-0" />
        </div>
      )}

      {/* 1st Place */}
      {top3[0] && (
        <div 
          className="flex flex-col items-center cursor-pointer transform hover:scale-105 transition-all duration-300 -mt-4 w-28 md:w-36 z-10"
          onClick={() => handlePlayerClick(top3[0])}
        >
          <div className="absolute w-24 h-24 md:w-32 md:h-32 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
          
          <div className="relative mb-3 z-10">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-70 animate-pulse" />
            <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-500 flex items-center justify-center border-3 md:border-4 border-yellow-200 shadow-2xl">
              <Crown className="h-8 w-8 md:h-12 md:w-12 text-yellow-900 animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-1 w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-xl animate-pulse">
              <span className="text-sm md:text-base font-bold text-yellow-900">1</span>
            </div>
            <Star className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 h-5 w-5 md:h-8 md:w-8 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <div className="bg-gradient-to-br from-yellow-500/40 to-orange-600/40 backdrop-blur-md border-2 md:border-3 border-yellow-300/60 rounded-xl md:rounded-2xl p-3 md:p-4 w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-yellow-300" />
                <p className="text-xs font-bold text-yellow-200">CHAMPION</p>
              </div>
              <p className="text-xs md:text-sm font-bold text-white truncate mb-1">
                {top3[0].user.username}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-300 mb-0.5">
                {top3[0].total_score}
              </p>
              <p className="text-xs text-yellow-200">pts</p>
              <div className="flex gap-0.5 justify-center mt-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-sm ${i < top3[0].lives ? 'opacity-100' : 'opacity-30'}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 h-20 md:h-32 w-full bg-gradient-to-t from-yellow-600/60 to-yellow-500/40 rounded-t-xl md:rounded-t-2xl border-2 md:border-3 border-yellow-400/40 border-b-0" />
        </div>
      )}

      {/* 3rd Place */}
      {top3[2] && (
        <div 
          className="flex flex-col items-center cursor-pointer transform hover:scale-105 transition-all duration-300 w-24 md:w-32"
          onClick={() => handlePlayerClick(top3[2])}
        >
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-60 animate-pulse" />
            <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 flex items-center justify-center border-3 md:border-4 border-orange-300 shadow-xl">
              <Crown className="h-6 w-6 md:h-10 md:w-10 text-orange-900" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-xs md:text-sm font-bold text-orange-900">3</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/30 to-orange-700/40 backdrop-blur-md border-2 border-orange-400/50 rounded-xl md:rounded-2xl p-2 md:p-3 w-full text-center shadow-xl">
            <p className="text-xs md:text-sm font-bold text-white truncate mb-1">
              {top3[2].user.username}
            </p>
            <p className="text-lg md:text-2xl font-bold text-orange-200 mb-0.5">
              {top3[2].total_score}
            </p>
            <p className="text-xs text-orange-300">pts</p>
            <div className="flex gap-0.5 justify-center mt-1">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-xs ${i < top3[2].lives ? 'opacity-100' : 'opacity-30'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 h-14 md:h-20 w-full bg-gradient-to-t from-orange-600/50 to-orange-500/30 rounded-t-xl md:rounded-t-2xl border-2 border-orange-400/30 border-b-0" />
        </div>
      )}
    </div>

    {/* Rest of Players */}
    {restOfPlayers.length > 0 && (
      <div className="space-y-2 mt-4">
        <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 md:h-5 md:w-5 text-cyan-400" />
          Other Players
        </h3>
        {restOfPlayers.map((player: any, index: number) => {
          const rank = index + 4
          const isMe = player.user_id === myUserId
          
          return (
            <div
              key={player.user_id}
              onClick={() => handlePlayerClick(player)}
              className={`flex items-center justify-between p-2 md:p-3 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                isMe 
                  ? 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40 border-2 border-blue-400' 
                  : 'bg-white/10 border border-white/20 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className={`flex items-center justify-center w-7 h-7 md:w-10 md:h-10 rounded-full font-bold text-sm md:text-base ${
                  isMe ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                }`}>
                  #{rank}
                </div>
                
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                  <Award className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-xs md:text-sm ${isMe ? 'text-cyan-200' : 'text-white'}`}>
                    {player.user.username} {isMe && <span className="text-xs">(You)</span>}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>Lv.{player.user.level}</span>
                    <span>•</span>
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <span key={i} className={i < player.lives ? 'text-red-500' : 'text-gray-600'}>
                          ❤️
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-base md:text-xl font-bold ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                  {player.total_score}
                </p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
</Card>

      {/* Player Detail Popup */}
      {showPopup && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-pink-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border-2 border-white/20 max-w-md w-full shadow-2xl transform animate-scaleIn">
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
            >
              <X className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </button>

            <div className="p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center border-3 md:border-4 border-white/30 shadow-xl flex-shrink-0">
                  <Crown className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate">{selectedPlayer.user.username}</h2>
                  <p className="text-sm text-gray-300">Level {selectedPlayer.user.level}</p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/20">
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">{selectedPlayer.total_score}</p>
                  <p className="text-xs text-gray-300">Total Score</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/20">
                  <Zap className="h-6 w-6 md:h-8 md:w-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {sortedParticipants.findIndex((p: any) => p.user_id === selectedPlayer.user_id) + 1}
                  </p>
                  <p className="text-xs text-gray-300">Rank</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-red-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-white font-semibold">Lives</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`text-xl md:text-2xl ${i < selectedPlayer.lives ? 'opacity-100' : 'opacity-30'}`}
                      >
                        ❤️
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 py-2 md:py-3 bg-green-500/20 rounded-xl md:rounded-2xl border border-green-400/30">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm md:text-base text-green-300 font-semibold">Active Player</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ===== MAIN GAME PAGE =====
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

  const handleGameEvent = useCallback(async (event: GameEvent) => {
    console.log('🎯 Event received:', event.type)

    switch (event.type) {
      case 'QUESTION_LOADED':
        console.log('📖 Question loaded event')
        setCurrentQuestion(event.question)
        hasAnswered.current = false
        
        const stateResp = await fetch(`/api/game/${roomId}/state`)
        const stateData = await stateResp.json()
        
        if (stateData.success) {
          setGameState(stateData.game)
          
          const myParticipant = stateData.game.participants.find(
            (p: any) => p.user_id === user?.id
          )
          
          if (myParticipant?.status === 'eliminated') {
            console.log('💀 I am eliminated - spectator mode')
            setPhase('waiting')
            return
          }
          
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
        
        const answerResp = await fetch(`/api/game/${roomId}/state`)
        const answerData = await answerResp.json()
        
        if (answerData.success) {
          setGameState(answerData.game)
          
          const myParticipant = answerData.game.participants.find(
            (p: any) => p.user_id === user?.id
          )
          
          if (myParticipant?.status === 'eliminated') {
            console.log('💀 Eliminated - stay in spectator mode')
            setPhase('waiting')
            return
          }
          
          const nowMyTurn = answerData.game.currentTurn?.user_id === user?.id
          
          if (nowMyTurn && !hasAnswered.current) {
            console.log('🎯 Now my turn!')
            setPhase('waiting')
            setCurrentQuestion(null)
            
            setTimeout(() => {
              loadQuestion()
            }, 500)
          }
        }
        break

      case 'PLAYER_ELIMINATED':
        console.log('💀 Player eliminated:', event.username)
        
        const elimResp = await fetch(`/api/game/${roomId}/state`)
        const elimData = await elimResp.json()
        
        if (elimData.success) {
          setGameState(elimData.game)
        }
        break

      case 'STAGE_COMPLETE':
        console.log('📈 Stage complete, moving to:', event.nextStage)
        
        setNextStageNumber(event.nextStage)
        setPhase('stage_transition')
        setCurrentQuestion(null)
        setAnswerResult(null)
        hasAnswered.current = false
        
        setTimeout(async () => {
          await refreshGameState()
          
          const stateResp = await fetch(`/api/game/${roomId}/state`)
          const stateData = await stateResp.json()
          
          if (stateData.success) {
            setGameState(stateData.game)
            
            const myParticipant = stateData.game.participants.find(
              (p: any) => p.user_id === user?.id
            )
            
            if (myParticipant?.status === 'eliminated') {
              console.log('💀 Eliminated - stay in spectator mode')
              setPhase('waiting')
              return
            }
            
            const isMyTurn = stateData.game.currentTurn?.user_id === user?.id
            
            if (isMyTurn) {
              console.log('🎯 My turn in new stage - loading question')
              setPhase('waiting')
              
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

  const { broadcast } = useGameBroadcast({
    roomId,
    onEvent: handleGameEvent,
    enabled: !authLoading && !!user,
  })

  useEffect(() => {
    if (!authLoading && user && roomId) {
      initializeGame()
    }

    return () => {
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
      console.log('🎤 Voice room URL:', data.game.room.voice_room_url)

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

      if (data.eliminated) {
        console.log('💀 You were eliminated!')
        
        setAnswerResult({
          selectedAnswer,
          correctAnswer: data.result.correct_answer,
          isCorrect: data.result.is_correct,
          pointsEarned: data.result.points_earned,
          livesRemaining: 0,
        })
        setPhase('result')

        setTimeout(() => {
          alert('💀 You have been eliminated! You can still watch the game.')
          setPhase('waiting')
        }, 3000)

        return
      }

      if (data.gameFinished) {
        console.log('🏁 Game finished - last player standing!')
        setPhase('finished')
        return
      }

      setAnswerResult({
        selectedAnswer,
        correctAnswer: data.result.correct_answer,
        isCorrect: data.result.is_correct,
        pointsEarned: data.result.points_earned,
        livesRemaining: data.result.lives_remaining,
      })
      setPhase('result')

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg md:text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  if (!gameState || !user) {
    return null
  }

  const isMyTurn = gameState.currentTurn?.user_id === user.id

  // ===== STAGE TRANSITION =====
  if (phase === 'stage_transition') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-6 md:p-12 text-center max-w-2xl w-full relative z-10 animate-pulse">
          <div className="mb-6">
            <Trophy className="h-16 w-16 md:h-20 md:w-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Stage {gameState.room.current_stage} Complete!
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8">
            Moving to Stage {nextStageNumber}...
          </p>
          
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl w-full relative z-10">
          <Card className={`backdrop-blur-xl border-2 p-6 md:p-8 text-center mb-6 ${
            isWinner 
              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400' 
              : 'bg-white/10 border-white/20'
          }`}>
            {isWinner ? (
              <>
                <div className="mb-6">
                  <div className="text-6xl md:text-8xl mb-4 animate-bounce">🏆</div>
                  <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2">
                    YOU WIN!
                  </h1>
                  <p className="text-2xl md:text-3xl text-white font-bold">
                    Congratulations, {winner.user.username}!
                  </p>
                </div>
                <div className="flex justify-center gap-4 md:gap-8 mb-4">
                  <div className="bg-white/10 rounded-lg p-4 min-w-[100px] md:min-w-[120px]">
                    <p className="text-purple-200 text-xs md:text-sm">Total Score</p>
                    <p className="text-3xl md:text-4xl font-bold text-yellow-400">{winner.total_score}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 min-w-[100px] md:min-w-[120px]">
                    <p className="text-purple-200 text-xs md:text-sm">Rank</p>
                    <p className="text-3xl md:text-4xl font-bold text-yellow-400">#1</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-5xl md:text-6xl mb-4">
                    {myRank === 2 && '🥈'}
                    {myRank === 3 && '🥉'}
                    {myRank > 3 && '🎮'}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    Game Over!
                  </h1>
                  <p className="text-xl md:text-2xl text-purple-200">
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
                <div className="flex justify-center gap-4 md:gap-8 mb-4">
                  <div className="bg-white/10 rounded-lg p-4 min-w-[100px] md:min-w-[120px]">
                    <p className="text-purple-200 text-xs md:text-sm">Your Score</p>
                    <p className="text-3xl md:text-4xl font-bold text-white">
                      {sortedParticipants.find((p: any) => p.user_id === user.id)?.total_score || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 min-w-[100px] md:min-w-[120px]">
                    <p className="text-purple-200 text-xs md:text-sm">Rank</p>
                    <p className="text-3xl md:text-4xl font-bold text-white">#{myRank}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {!isWinner && winner && (
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-yellow-400 p-4 md:p-6 text-center mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl md:text-5xl">👑</div>
                <div className="text-left">
                  <p className="text-yellow-400 text-xs md:text-sm font-semibold">WINNER</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{winner.user.username}</p>
                  <p className="text-yellow-400 font-bold">{winner.total_score} points</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-4 md:p-6 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
              🏅 Final Leaderboard
            </h2>
            <div className="space-y-2 md:space-y-3">
              {sortedParticipants.map((p: any, i: number) => {
                const isMe = p.user_id === user.id
                const rank = i + 1
                
                return (
                  <div 
                    key={p.user_id} 
                    className={`flex items-center justify-between p-3 md:p-4 rounded-lg transition-all ${
                      isMe 
                        ? 'bg-blue-500/30 border-2 border-blue-400 scale-105' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-2xl md:text-3xl min-w-[40px] md:min-w-[50px] text-center">
                        {rank === 1 && '🥇'}
                        {rank === 2 && '🥈'}
                        {rank === 3 && '🥉'}
                        {rank > 3 && `#${rank}`}
                      </div>
                      <div>
                        <p className={`font-bold text-sm md:text-base ${isMe ? 'text-blue-300' : 'text-white'}`}>
                          {p.user.username} {isMe && '(You)'}
                        </p>
                        <p className="text-xs md:text-sm text-purple-200">
                          Level {p.user.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl md:text-2xl font-bold ${
                        rank === 1 ? 'text-yellow-400' : 
                        rank === 2 ? 'text-gray-300' : 
                        rank === 3 ? 'text-orange-400' : 
                        'text-white'
                      }`}>
                        {p.total_score}
                      </p>
                      <p className="text-xs md:text-sm text-purple-200">points</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm md:text-base">
              <Home className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Back to Dashboard
            </Button>
            <Button
              size="lg"
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-sm md:text-base"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8 relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(150)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
        
        {[...Array(5)].map((_, i) => (
          <div
            key={`shooting-${i}`}
            className="absolute w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              left: '-10%',
              animationDelay: `${i * 6}s`,
            }}
          />
        ))}

        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-1 space-y-4">
            <ModernLeaderboard
              participants={gameState.participants}
              myUserId={user.id}
              roomCode={gameState.room.room_code}
              currentStage={gameState.room.current_stage}
              maxStages={gameState.room.max_stages}
              currentTurn={gameState.currentTurn}
            />

            <div className="mt-4">
              <VoiceControl
                voiceRoomUrl={gameState.room.voice_room_url}
                isMyTurn={isMyTurn}
                myUserId={user.id}
                phase={phase}
              />
            </div>
          </div>

          {/* Right: Game Area */}
          {/* Right: Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Turn Notification - TAMBAHKAN DI SINI */}
            {gameState.currentTurn && (
              <Card className="bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-xl border-2 border-cyan-400 p-4 md:p-6 animate-pulse">
                <div className="flex items-center justify-center gap-3">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-cyan-300" />
                  <div className="text-center">
                    <p className="text-sm md:text-base text-cyan-200 font-semibold">Currently Playing</p>
                    <p className="text-xl md:text-2xl font-bold text-white">
                      {gameState.currentTurn.username}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
              </Card>
            )}

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
                phase={phase}
              />
            ) : (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-8 md:p-12 text-center">
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-white mx-auto mb-4" />
                <p className="text-white text-lg md:text-xl">
                  {phase === 'waiting' 
                    ? '⏳ Waiting for next question...' 
                    : 'Loading...'}
                </p>
              </Card>
            )}

            {gameState && user && (
              (() => {
                const myParticipant = gameState.participants.find(
                  (p: any) => p.user_id === user.id
                )
                
                if (myParticipant?.status === 'eliminated') {
                  return (
                    <Card className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border-2 border-gray-500 p-4 md:p-6 text-center">
                      <div className="text-5xl md:text-6xl mb-4">💀</div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-300 mb-2">
                        You have been eliminated
                      </h2>
                      <p className="text-sm md:text-base text-gray-400">
                        You can still watch the game and cheer for others!
                      </p>
                    </Card>
                  )
                }
                return null
              })()
            )}

            {phase === 'result' && answerResult && (
              <Card className={`p-4 md:p-6 border-2 backdrop-blur-xl ${
                answerResult.isCorrect 
                  ? 'bg-green-500/20 border-green-400' 
                  : 'bg-red-500/20 border-red-400'
              }`}>
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {answerResult.isCorrect ? '✅ Correct!' : '❌ Wrong!'}
                  </h2>
                  {answerResult.isCorrect ? (
                    <p className="text-white text-lg md:text-xl">
                      +{answerResult.pointsEarned} points!
                    </p>
                  ) : (
                    <p className="text-white text-lg md:text-xl">
                      Lives: {answerResult.livesRemaining}/3
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Card */}
        <Card className="mt-6 bg-black/40 backdrop-blur-xl p-3 md:p-4">
          <h3 className="text-yellow-400 font-bold mb-2 text-sm md:text-base">DEBUG INFO</h3>
          <div className="text-white text-xs md:text-sm space-y-1 font-mono">
            <p>Phase: <span className="text-cyan-400">{phase}</span></p>
            <p>Turn: <span className="text-cyan-400">{gameState.currentTurn?.username || 'NULL'}</span></p>
            <p>My Turn: <span className="text-cyan-400">{isMyTurn ? 'YES' : 'NO'}</span></p>
            <p>Question ID: <span className="text-cyan-400">{currentQuestion?.id || 'NULL'}</span></p>
            <p>Has Answered: <span className="text-cyan-400">{hasAnswered.current ? 'YES' : 'NO'}</span></p>
            <p>Stage: <span className="text-cyan-400">{gameState.room.current_stage}/{gameState.room.max_stages}</span></p>
          </div>
          <Button 
            onClick={() => reloadGameState()} 
            className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-sm"
            size="sm"
          >
            🔄 Force Reload State
          </Button>
        </Card>
      </div>

      <MusicControl trackUrl="/audio/home/upbeat-game-menu.mp3" />

      <style jsx>{`
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateX(300px) translateY(300px); opacity: 0; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-shooting-star {
          animation: shooting-star 3s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}