'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { audioManager } from '@/lib/audio/AudioManager'

interface MusicControlProps {
  trackUrl: string
  autoPlay?: boolean
}

export function MusicControl({ trackUrl, autoPlay = true }: MusicControlProps) {
  const [isMuted, setIsMuted] = useState(audioManager.getMuted())
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (autoPlay) {
      audioManager.play(trackUrl)
    }
  }, [trackUrl, autoPlay])

  function handleToggleMute() {
    const newMuted = audioManager.toggleMute()
    setIsMuted(newMuted)
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      animate={{ y: [0, -12, 0] }}
      transition={{
        duration: 4,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    >
      <motion.button
        onClick={handleToggleMute}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className="group relative w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-colors duration-300 flex items-center justify-center border border-white/20"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {/* Animated sound waves */}
        {!isMuted && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute w-16 h-16 border-2 border-purple-400/30 rounded-full"
              animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-20 h-20 border-2 border-pink-400/20 rounded-full"
              animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
              transition={{ duration: 1.6, delay: 0.4, repeat: Infinity }}
            />
          </motion.div>
        )}

        {/* Icon */}
        <motion.div
          key={isMuted ? 'muted' : 'playing'}
          initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </motion.div>

        {/* Tooltip */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap backdrop-blur-sm"
          >
            {isMuted ? 'Click to unmute' : 'Click to mute'}
            <div className="absolute top-full right-4 w-2 h-2 bg-black/90 transform rotate-45 -mt-1" />
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  )
}
