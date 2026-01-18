import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, VolumeX, Loader2 } from 'lucide-react'
import AgoraManager from '@/lib/agora/client'
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

interface VoiceControlProps {
  voiceRoomUrl: string | null
  isMyTurn: boolean
  myUserId: string
}

export function VoiceControl({ voiceRoomUrl, isMyTurn, myUserId }: VoiceControlProps) {
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
      // Jangan cleanup di sini, biarkan global manager handle
    }
  }, [])

  // Auto mute/unmute based on turn
  useEffect(() => {
    if (isConnected) {
      if (isMyTurn) {
        setIsMuted(false)
        AgoraManager.setMuted(false)
      } else {
        setIsMuted(true)
        AgoraManager.setMuted(true)
      }
    }
  }, [isMyTurn, isConnected])

  async function connectToVoice() {
    if (!voiceRoomUrl) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log('🎤 Connecting to Agora voice...')

      // Extract channel name from voiceRoomUrl
      // Format: "agora-channel-<roomId>" or just use roomId
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
          // Subscribe to remote audio
          await client.subscribe(user, mediaType)
          // Audio akan auto-play di browser
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
    if (!isConnected) return

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

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
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

      <div className="flex items-center gap-2">
        <Button
          onClick={toggleMute}
          disabled={!isConnected}
          className={`flex-1 ${
            isMuted 
              ? 'bg-red-500/50 hover:bg-red-600/50' 
              : 'bg-green-500/50 hover:bg-green-600/50'
          }`}
        >
          {isMuted ? (
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

        {!isMyTurn && (
          <div className="flex items-center gap-1 text-yellow-400 text-xs">
            <VolumeX className="h-4 w-4" />
            <span>Not your turn</span>
          </div>
        )}
      </div>

      {isMyTurn && !isMuted && (
        <p className="text-green-400 text-xs mt-2 text-center animate-pulse">
          🎤 You can speak now!
        </p>
      )}
    </Card>
  )
}