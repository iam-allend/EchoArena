'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type GameEvent = 
  | { type: 'QUESTION_LOADED'; question: any; stageNumber: number }
  | { type: 'TURN_CHANGED'; turn: any; stageNumber: number }
  | { type: 'ANSWER_SUBMITTED'; userId: string; stageNumber: number }
  | { type: 'PLAYER_ELIMINATED'; userId: string; username: string } // ✅ NEW
  | { type: 'STAGE_COMPLETE'; nextStage: number }
  | { type: 'GAME_FINISHED' }

interface UseGameBroadcastProps {
  roomId: string
  onEvent: (event: GameEvent) => void
  enabled?: boolean
}

export function useGameBroadcast({ roomId, onEvent, enabled = true }: UseGameBroadcastProps) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !roomId) return

    console.log('📡 Setting up broadcast channel for room:', roomId)

    const channel = supabase.channel(`room:${roomId}:broadcast`, {
      config: {
        broadcast: { self: true }, // Receive own messages
      },
    })

    // Listen to all game events
    channel.on('broadcast', { event: 'game-event' }, ({ payload }) => {
      console.log('📨 Broadcast received:', payload.type)
      onEvent(payload as GameEvent)
    })

    channel.subscribe((status) => {
      console.log('📡 Broadcast status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ Broadcast channel ready')
      }
    })
    channelRef.current = channel
    return () => {
      console.log('🧹 Cleaning up broadcast channel')
      channel.unsubscribe()
    }
  }, [roomId, enabled, onEvent])

  // Function to send events
  const broadcast = async (event: GameEvent) => {
    if (!channelRef.current) {
      console.error('❌ Channel not ready')
      return
    }

    console.log('📤 Broadcasting:', event.type)
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'game-event',
      payload: event,
    })
  }

  return { broadcast }
}