import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, VolumeX, Loader2, Lock } from 'lucide-react'
import AgoraManager from '@/lib/agora/client'
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

interface VoiceControlProps {
  voiceRoomUrl: string | null
  isMyTurn: boolean
  myUserId: string
  phase?: 'reading' | 'answering' | 'waiting'
}

export function VoiceControl({ 
  voiceRoomUrl, 
  isMyTurn, 
  myUserId, 
  phase = 'waiting'  
}: VoiceControlProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Set<string>>(new Set())

  const hasConnected = useRef(false)

  useEffect(() => {
    if (voiceRoomUrl && !hasConnected.current) {
      hasConnected.current = true
      connectToVoice()
    }

    return () => {
      console.log('🧹 VoiceControl cleanup')
    }
  }, [])

  // ✅ FORCE MUTE/UNMUTE based on turn AND phase
  useEffect(() => {
    if (isConnected) {
      const canSpeak = isMyTurn && phase === 'answering'
      
      if (canSpeak) {
        // Unmute only during answering phase
        setIsMuted(false)
        AgoraManager.setMuted(false)
        console.log('🎤 Auto-unmuted (answering phase)')
      } else {
        // Force mute in all other cases
        setIsMuted(true)
        AgoraManager.setMuted(true)
        console.log('🔇 Force muted')
      }
    }
  }, [isMyTurn, isConnected, phase])

  async function connectToVoice() {
    if (!voiceRoomUrl) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log('🎤 Connecting to Agora voice...')

      const channelName = voiceRoomUrl.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 64)

      const { client, audioTrack } = await AgoraManager.joinChannel(channelName, myUserId)

      // Setup event listeners
      client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
        console.log('👤 User joined:', user.uid)
        setParticipants((prev) => new Set(prev).add(user.uid.toString()))
      })

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        console.log('👋 User left:', user.uid)
        setParticipants((prev) => {
          const updated = new Set(prev)
          updated.delete(user.uid.toString())
          return updated
        })
      })

      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          console.log('🎵 User published audio:', user.uid)
          await client.subscribe(user, mediaType)
          user.audioTrack?.play()
        }
      })

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          console.log('🔇 User unpublished audio:', user.uid)
        }
      })

      client.on('connection-state-change', (curState, prevState) => {
        console.log(`Connection state: ${prevState} → ${curState}`)
        if (curState === 'DISCONNECTED') {
          setIsConnected(false)
          setError('Connection lost')
        }
      })

      setIsConnected(true)
      setIsConnecting(false)

      // Start muted
      AgoraManager.setMuted(true)
      setIsMuted(true)

      console.log('✅ Voice connected successfully')

    } catch (err: any) {
      console.error('❌ Failed to connect voice:', err)
      setError(err.message || 'Failed to connect to voice')
      setIsConnecting(false)
      hasConnected.current = false
    }
  }

  function toggleMute() {
    // ✅ Only allow toggle if it's my turn AND answering phase
    const canSpeak = isMyTurn && phase === 'answering'
    
    if (!isConnected || !canSpeak) {
      console.log('⚠️ Cannot toggle mic - not your turn or wrong phase')
      return
    }

    const newMuted = !isMuted
    AgoraManager.setMuted(newMuted)
    setIsMuted(newMuted)
  }

  function handleRetry() {
    hasConnected.current = false
    setError(null)
    setIsConnecting(false)
    setIsConnected(false)
    connectToVoice()
  }

  if (!voiceRoomUrl) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
        <p className="text-white text-sm text-center">
          🔇 Voice not available for this game
        </p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/20 backdrop-blur-sm border-red-400 p-4">
        <p className="text-red-300 text-sm text-center mb-2">
          ⚠️ {error}
        </p>
        <Button
          onClick={handleRetry}
          className="w-full"
          size="sm"
        >
          Retry Connection
        </Button>
      </Card>
    )
  }

  if (isConnecting) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <p className="text-white text-sm">Connecting to voice...</p>
        </div>
      </Card>
    )
  }

  const canSpeak = isMyTurn && phase === 'answering'

  return (
    <Card className={`backdrop-blur-sm border-2 p-4 transition-all ${
      canSpeak 
        ? 'bg-green-500/20 border-green-400' 
        : 'bg-white/10 border-white/20'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-white text-sm font-semibold">
            {isConnected ? 'Voice Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="text-purple-200 text-xs">
          {participants.size + 1} in call
        </span>
      </div>

      <div className="space-y-2">
        {/* ✅ Mic Button - DISABLED when not your turn */}
        <Button
          onClick={toggleMute}
          disabled={!isConnected || !canSpeak}
          className={`w-full ${
            !canSpeak
              ? 'bg-gray-500/50 cursor-not-allowed'
              : isMuted 
                ? 'bg-red-500/50 hover:bg-red-600/50' 
                : 'bg-green-500/50 hover:bg-green-600/50'
          }`}
        >
          {!canSpeak ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Mic Locked
            </>
          ) : isMuted ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Muted
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Speaking
            </>
          )}
        </Button>

        {/* Status Messages */}
        {!isMyTurn && (
          <div className="flex items-center gap-2 text-yellow-400 text-xs justify-center bg-yellow-500/10 py-2 rounded">
            <VolumeX className="h-4 w-4" />
            <span>Mic disabled - Not your turn</span>
          </div>
        )}

        {isMyTurn && phase === 'reading' && (
          <div className="text-blue-400 text-xs text-center bg-blue-500/10 py-2 rounded">
            📖 Reading phase - Mic will unlock during answering
          </div>
        )}

        {isMyTurn && phase === 'answering' && !isMuted && (
          <p className="text-green-400 text-xs text-center animate-pulse bg-green-500/10 py-2 rounded font-semibold">
            🎤 You can speak now!
          </p>
        )}
      </div>
    </Card>
  )
}