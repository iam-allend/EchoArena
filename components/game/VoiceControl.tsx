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
  phase?: string 
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
  const previousPhase = useRef(phase) // ✅ Track phase changes

  useEffect(() => {
    if (voiceRoomUrl && !hasConnected.current) {
      hasConnected.current = true
      connectToVoice()
    }

    return () => {
      console.log('🧹 VoiceControl cleanup')
    }
  }, [])

  // ✅ FIX: Force unmute on phase change to 'answering'
  useEffect(() => {
    if (!isConnected) return

    const canSpeak = isMyTurn && phase === 'answering'
    const phaseChanged = previousPhase.current !== phase
    
    if (phaseChanged) {
      console.log(`📍 Phase changed: ${previousPhase.current} → ${phase}`)
      previousPhase.current = phase
    }

    if (canSpeak) {
      // ✅ FORCE unmute immediately when answering starts
      console.log('🎤 FORCING unmute for answering phase!')
      setIsMuted(false)
      AgoraManager.setMuted(false)
    } else {
      // Mute when not answering
      if (!isMuted) {
        console.log('🔇 Auto-muting (not answering)')
        setIsMuted(true)
        AgoraManager.setMuted(true)
      }
    }
  }, [isMyTurn, phase, isConnected]) // Remove isMuted from deps

  async function connectToVoice() {
    if (!voiceRoomUrl) return

    setIsConnecting(true)
    setError(null)

    try {
      console.log('🎤 Connecting to Agora voice...')

      const channelName = voiceRoomUrl.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 64)

      const { client, audioTrack } = await AgoraManager.joinChannel(channelName, myUserId)
      if (!client) {
        throw new Error('Agora client is null')
      }
      
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
          
          try {
            await client.subscribe(user, mediaType)
            console.log('✅ Subscribed to:', user.uid)
            
            // ✅ Force play with error handling
            if (user.audioTrack) {
              user.audioTrack.play()
              console.log('🔊 Playing audio from:', user.uid)
            }
          } catch (err) {
            console.error('❌ Subscribe/play error:', err)
          }
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
    
    console.log(newMuted ? '🔇 Manually muted' : '🎤 Manually unmuted')
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
        {/* ✅ Mic Status Display */}
        <div className={`p-3 rounded-lg border-2 ${
          canSpeak && !isMuted
            ? 'bg-green-500/20 border-green-400'
            : 'bg-gray-500/20 border-gray-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold">
              Microphone Status
            </span>
            {canSpeak && !isMuted && (
              <span className="text-green-400 text-xs font-bold animate-pulse">
                🔴 LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {canSpeak && !isMuted 
              ? '✅ Broadcasting - Others can hear you!' 
              : isMuted 
                ? '🔇 Muted - Not broadcasting' 
                : '⏸️ Standby'}
          </p>
        </div>

        {/* ✅ Manual Toggle Button */}
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
              Click to Unmute
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Click to Mute
            </>
          )}
        </Button>

        {/* Status Messages */}
        {!isMyTurn && (
          <div className="flex items-center gap-2 text-yellow-400 text-xs justify-center bg-yellow-500/10 py-2 rounded">
            <VolumeX className="h-4 w-4" />
            <span>Listening mode - Not your turn</span>
          </div>
        )}

        {isMyTurn && phase === 'reading' && (
          <div className="text-blue-400 text-xs text-center bg-blue-500/10 py-2 rounded">
            📖 Reading phase - Mic will auto-unlock
          </div>
        )}

        {isMyTurn && phase === 'answering' && (
          <div className="text-green-400 text-xs text-center bg-green-500/10 py-2 rounded font-semibold">
            🎤 Answering phase - {isMuted ? 'Click button to speak!' : 'You are speaking!'}
          </div>
        )}
      </div>
    </Card>
  )
}