'use client'

import { Card } from '@/components/ui/card'
import { Crown, Heart, Star, Trophy } from 'lucide-react'

interface Participant {
  user_id: string
  lives_remaining: number
  total_score: number
  status: string
  user: {
    username: string
    level: number
  }
}

interface GameHeaderProps {
  roomCode: string
  currentStage: number
  maxStages: number
  currentTurn: {
    user_id: string
    username: string
  } | null
  participants: Participant[]
  myUserId: string
  isHost: boolean
}

export function GameHeader({
  roomCode,
  currentStage,
  maxStages,
  currentTurn,
  participants,
  myUserId,
  isHost
}: GameHeaderProps) {
  const isMyTurn = currentTurn?.user_id === myUserId
  const myData = participants.find(p => p.user_id === myUserId)

  return (
    <div className="space-y-4">
      {/* Room Info */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                Room: {roomCode}
              </h1>
              {isHost && <Crown className="h-5 w-5 text-yellow-400" />}
            </div>
            <p className="text-purple-200">
              Stage {currentStage} of {maxStages}
            </p>
          </div>

          {/* My Stats */}
          {myData && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-bold">{myData.total_score}</span>
                </div>
                <p className="text-purple-200 text-sm">Score</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-5 w-5 ${
                        i < myData.lives_remaining
                          ? 'text-red-500 fill-red-500'
                          : 'text-gray-500'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-purple-200 text-sm">Lives</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Current Turn Indicator */}
      {currentTurn && (
        <Card className={`
          p-4 border-2 transition-all
          ${isMyTurn 
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400 animate-pulse' 
            : 'bg-white/10 backdrop-blur-sm border-white/20'
          }
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {currentTurn.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  {isMyTurn ? "🎤 Your Turn!" : `${currentTurn.username}'s Turn`}
                </p>
                <p className="text-purple-200 text-sm">
                  {isMyTurn ? 'Answer the question using your voice or buttons' : 'Waiting...'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Scoreboard */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="text-white font-bold">Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {participants
            .filter(p => p.status === 'active')
            .sort((a, b) => b.total_score - a.total_score)
            .map((participant, index) => (
              <div
                key={participant.user_id}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${participant.user_id === myUserId 
                    ? 'bg-purple-500/20 border border-purple-400' 
                    : 'bg-white/5'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold w-6">
                    #{index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {participant.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {participant.user.username}
                      {participant.user_id === myUserId && ' (You)'}
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Heart
                          key={i}
                          className={`h-3 w-3 ${
                            i < participant.lives_remaining
                              ? 'text-red-500 fill-red-500'
                              : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">
                    {participant.total_score}
                  </p>
                  <p className="text-purple-200 text-xs">points</p>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}