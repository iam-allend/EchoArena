'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'

interface VoiceAnswerControlProps {
  onAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void
  isActive: boolean
  disabled?: boolean
}

export function VoiceAnswerControl({ 
  onAnswer, 
  isActive, 
  disabled = false 
}: VoiceAnswerControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [detectedAnswer, setDetectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [confidence, setConfidence] = useState<number>(0)

  const recognitionRef = useRef<any>(null)
  const answerSubmittedRef = useRef(false)
  const isStartingRef = useRef(false)
  const abortCountRef = useRef(0) // ✅ NEW: Track abort attempts

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      console.warn('⚠️ Speech Recognition not supported')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'id-ID'
    recognition.maxAlternatives = 5

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
      setIsListening(true)
      setError(null)
      answerSubmittedRef.current = false
      isStartingRef.current = false
      abortCountRef.current = 0 // ✅ Reset counter on success
    }

    recognition.onresult = (event: any) => {
      const results = event.results[event.results.length - 1]
      const transcript = results[0].transcript.toLowerCase().trim()
      const confidence = results[0].confidence
      
      console.log('📝 Transcript:', transcript, '| Confidence:', confidence)
      setTranscript(transcript)
      setConfidence(confidence)

      const answer = parseAnswer(transcript)
      
      if (answer && !answerSubmittedRef.current) {
        console.log('✅ Detected answer:', answer, '| Confidence:', confidence)
        setDetectedAnswer(answer)
        answerSubmittedRef.current = true
        
        setTimeout(() => {
          onAnswer(answer)
          stopListening()
        }, 800)
      }
    }

    recognition.onerror = (event: any) => {
      // ✅ Track aborted errors
      if (event.error === 'aborted') {
        abortCountRef.current++
        console.log(`⚠️ Recognition aborted (${abortCountRef.current} times)`)
        
        // ✅ Stop trying after 3 aborts
        if (abortCountRef.current >= 3) {
          console.log('🛑 Too many aborts - stopping auto-restart')
          setError('Voice recognition unstable. Please use manual buttons.')
          setIsListening(false)
          isStartingRef.current = false
          return
        }
        return
      }
      
      // ✅ Ignore no-speech
      if (event.error === 'no-speech') {
        console.log('⚠️ No speech detected')
        return
      }
      
      console.error('❌ Speech recognition error:', event.error)
      
      if (event.error === 'audio-capture') {
        setError('Microphone not found. Check permissions.')
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Enable in browser settings.')
      } else if (event.error === 'network') {
        setError('Network error. Check your connection.')
      } else {
        setError(`Error: ${event.error}`)
      }
      
      setIsListening(false)
      isStartingRef.current = false
    }

    recognition.onend = () => {
      console.log('🛑 Voice recognition ended')
      setIsListening(false)
      isStartingRef.current = false
      
      // ✅ ONLY restart if all conditions met AND no errors
      const shouldRestart = isActive && !answerSubmittedRef.current && !disabled && !error
      
      if (shouldRestart) {
        console.log('🔄 Auto-restarting recognition...')
        // ✅ Longer delay to prevent rapid restarts
        setTimeout(() => {
          if (isActive && !answerSubmittedRef.current) {
            startListening()
          }
        }, 500)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [isActive, error, disabled])

  useEffect(() => {
    if (isActive && !disabled && isSupported && !isListening && !isStartingRef.current) {
      startListening()
    } else if (!isActive && isListening) {
      stopListening()
    }

    return () => {
      if (!isActive) {
        stopListening()
      }
    }
  }, [isActive, disabled, isSupported])

  const parseAnswer = (text: string): 'A' | 'B' | 'C' | 'D' | null => {
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()

    console.log('🔍 Parsing:', normalized)

    // 1. Exact single letter
    if (/^a+$/.test(normalized)) return 'A'
    if (/^b+$/.test(normalized)) return 'B'
    if (/^c+$/.test(normalized)) return 'C'
    if (/^d+$/.test(normalized)) return 'D'

    // 2. Indonesian phonetics
    if (/\b(ei|ey|ay|eh)\b/.test(normalized)) return 'A'
    if (/\b(bi|bee|beh|be)\b/.test(normalized) && !/(pi|p|ti|ci|si|di)/i.test(normalized)) return 'B'
    if (/\b(si|see|ce|cee|seh|se)\b/.test(normalized)) return 'C'
    if (/\b(di|dee|deh|de)\b/.test(normalized) && !/(ti|t|si|ci|bi)/i.test(normalized)) return 'D'

    // 3. Numbers (safest)
    if (/\b(1|satu|one)\b/.test(normalized)) return 'A'
    if (/\b(2|dua|two)\b/.test(normalized)) return 'B'
    if (/\b(3|tiga|three)\b/.test(normalized)) return 'C'
    if (/\b(4|empat|four)\b/.test(normalized)) return 'D'

    // 4. NATO alphabet
    if (/alpha|alfa/.test(normalized)) return 'A'
    if (/bravo/.test(normalized)) return 'B'
    if (/charlie|charly/.test(normalized)) return 'C'
    if (/delta/.test(normalized)) return 'D'

    // 5. Command phrases
    if (/pilih\s*(a|ei)|jawab\s*(a|ei)/.test(normalized)) return 'A'
    if (/pilih\s*b|jawab\s*b/.test(normalized)) return 'B'
    if (/pilih\s*(c|si)|jawab\s*(c|si)/.test(normalized)) return 'C'
    if (/pilih\s*(d|di)|jawab\s*(d|di)/.test(normalized)) return 'D'

    return null
  }

  const startListening = () => {
    // ✅ FIX: Prevent double start
    if (!recognitionRef.current || isListening || !isSupported || isStartingRef.current) {
      return
    }

    try {
      isStartingRef.current = true // ✅ Set flag BEFORE start
      answerSubmittedRef.current = false
      recognitionRef.current.start()
      setTranscript('')
      setDetectedAnswer(null)
      setConfidence(0)
    } catch (err: any) {
      console.error('Start listening error:', err)
      isStartingRef.current = false // ✅ Reset on error
      
      // ✅ Only show error if not "already started"
      if (!err.message?.includes('already started')) {
        setError(err.message)
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsListening(false)
      isStartingRef.current = false // ✅ Reset flag
    } catch (err) {
      console.error('Stop listening error:', err)
    }
  }

  if (!isSupported) {
    return (
      <Card className="bg-orange-500/20 border-orange-400 p-3">
        <p className="text-orange-300 text-sm text-center">
          ⚠️ Voice answer not supported in this browser. Use Chrome or Edge.
        </p>
      </Card>
    )
  }

  if (!isActive) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/50 p-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-purple-300" />
            <span className="text-white font-bold">Voice Answer</span>
          </div>
          
          {isListening && (
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 text-sm font-semibold">Listening</span>
            </div>
          )}
        </div>

        <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-400/30">
          <p className="text-purple-100 text-sm font-medium mb-2">
            🎙️ Say one of these:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-purple-200">• "A" / "Ei" / "Satu"</div>
            <div className="text-purple-200">• "B" / "Bi" / "Dua"</div>
            <div className="text-purple-200">• "C" / "Si" / "Tiga"</div>
            <div className="text-purple-200">• "D" / "Di" / "Empat"</div>
          </div>
        </div>

        {transcript && (
          <div className="bg-black/40 rounded-lg p-3 border border-purple-400/30">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-purple-300 font-semibold">Live Transcript:</p>
              <span className="text-xs text-purple-400">
                {Math.round(confidence * 100)}% confident
              </span>
            </div>
            <p className="text-white font-mono text-sm break-words">{transcript}</p>
          </div>
        )}

        {detectedAnswer && (
          <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-4 animate-pulse">
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-green-300 font-bold text-xl">
                Detected: Option {detectedAnswer}
              </p>
              <p className="text-green-400 text-sm mt-1">Submitting answer...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400 rounded-lg p-3">
            <p className="text-red-300 text-sm mb-2">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                startListening()
              }}
              size="sm"
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Retry
            </Button>
          </div>
        )}

        {!isListening && !detectedAnswer && !error && (
          <Button
            onClick={startListening}
            disabled={disabled}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Voice Answer
          </Button>
        )}

        {isListening && !detectedAnswer && (
          <div className="flex justify-center gap-1">
            <div className="w-2 h-8 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-12 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-10 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-14 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '450ms' }}></div>
            <div className="w-2 h-8 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '600ms' }}></div>
          </div>
        )}
      </div>
    </Card>
  )
}