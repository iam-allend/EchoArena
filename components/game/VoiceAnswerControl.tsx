'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'

interface VoiceAnswerControlProps {
  onAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void
  isActive: boolean // True during answering phase
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

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      console.warn('⚠️ Speech Recognition not supported')
      return
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false // Stop after one result
    recognition.interimResults = true // Show partial results
    recognition.lang = 'id-ID' // Indonesian language
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const transcript = event.results[current][0].transcript.toLowerCase().trim()
      
      console.log('📝 Transcript:', transcript)
      setTranscript(transcript)

      // Parse answer from transcript
      const answer = parseAnswer(transcript)
      if (answer) {
        console.log('✅ Detected answer:', answer)
        setDetectedAnswer(answer)
        
        // Auto-submit after detection
        setTimeout(() => {
          onAnswer(answer)
          stopListening()
        }, 500)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      console.log('🛑 Voice recognition ended')
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Auto-start listening when answering phase begins
  useEffect(() => {
    if (isActive && !disabled && isSupported) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [isActive, disabled, isSupported])

  const parseAnswer = (text: string): 'A' | 'B' | 'C' | 'D' | null => {
    // Remove common words
    const cleaned = text
      .replace(/pilih|jawab|saya|adalah|yang|itu|ini/gi, '')
      .trim()

    // Direct letter detection
    if (/\ba\b/.test(cleaned)) return 'A'
    if (/\bb\b/.test(cleaned)) return 'B'
    if (/\bc\b/.test(cleaned)) return 'C'
    if (/\bd\b/.test(cleaned)) return 'D'

    // Phonetic alphabet
    if (/alpha|alfa/i.test(cleaned)) return 'A'
    if (/bravo|beta/i.test(cleaned)) return 'B'
    if (/charlie|charly/i.test(cleaned)) return 'C'
    if (/delta/i.test(cleaned)) return 'D'

    // Numbers
    if (/\b1\b|satu|pertama/i.test(cleaned)) return 'A'
    if (/\b2\b|dua|kedua/i.test(cleaned)) return 'B'
    if (/\b3\b|tiga|ketiga/i.test(cleaned)) return 'C'
    if (/\b4\b|empat|keempat/i.test(cleaned)) return 'D'

    return null
  }

  const startListening = () => {
    if (!recognitionRef.current || isListening || !isSupported) return

    try {
      recognitionRef.current.start()
      setTranscript('')
      setDetectedAnswer(null)
    } catch (err) {
      console.error('Start listening error:', err)
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return

    try {
      recognitionRef.current.stop()
    } catch (err) {
      console.error('Stop listening error:', err)
    }
  }

  if (!isSupported) {
    return (
      <Card className="bg-orange-500/20 border-orange-400 p-3">
        <p className="text-orange-300 text-sm text-center">
          ⚠️ Voice answer not supported in this browser
        </p>
      </Card>
    )
  }

  if (!isActive) {
    return null // Don't show when not in answering phase
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-purple-400" />
            <span className="text-white font-semibold">Voice Answer</span>
          </div>
          
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm">Listening...</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-purple-200 text-sm">
          🎙️ Say: "A", "B", "C", or "D" to answer
        </p>

        {/* Live Transcript */}
        {transcript && (
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-xs text-purple-300 mb-1">Transcript:</p>
            <p className="text-white font-mono">{transcript}</p>
          </div>
        )}

        {/* Detected Answer */}
        {detectedAnswer && (
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-3 animate-pulse">
            <p className="text-green-300 font-bold text-center">
              ✓ Detected: {detectedAnswer}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
            <Button
              onClick={startListening}
              size="sm"
              className="mt-2 w-full"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Manual Control (optional) */}
        {!isListening && !detectedAnswer && (
          <Button
            onClick={startListening}
            disabled={disabled}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Voice Answer
          </Button>
        )}
      </div>
    </Card>
  )
}