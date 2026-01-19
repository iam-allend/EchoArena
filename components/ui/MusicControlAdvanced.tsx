'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX, Volume1 } from 'lucide-react'
import { audioManager } from '@/lib/audio/AudioManager'
import { motion } from 'framer-motion'

interface MusicControlAdvancedProps {
  trackUrl: string
  autoPlay?: boolean
}

export function MusicControlAdvanced({ trackUrl, autoPlay = true }: MusicControlAdvancedProps) {
  const [isMuted, setIsMuted] = useState(audioManager.getMuted())
  const [volume, setVolume] = useState(audioManager.getVolume())
  const [showSlider, setShowSlider] = useState(false)

  useEffect(() => {
    if (autoPlay) {
      audioManager.play(trackUrl)
    }
  }, [trackUrl, autoPlay])

  function handleToggleMute() {
    const newMuted = audioManager.toggleMute()
    setIsMuted(newMuted)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    audioManager.setVolume(newVolume)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <motion.div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
        animate={{ y: [0, -12, 0] }}
        transition={{
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
        }}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
        >

      {/* Volume Slider */}
      {showSlider && (
        <div className="bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/20 animate-in slide-in-from-right">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>
      )}

      {/* Mute Button */}
      <button
        onClick={handleToggleMute}
        className="group relative w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center border border-white/20"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {/* Animated waves */}
        {!isMuted && volume > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-16 h-16 border-2 border-purple-400/30 rounded-full animate-ping" />
            <div className="absolute w-20 h-20 border-2 border-pink-400/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
          </div>
        )}

        <VolumeIcon className="w-6 h-6 text-white relative z-10" />
      </button>
    </motion.div>
  )
}
