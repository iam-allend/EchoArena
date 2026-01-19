class AudioManager {
  private static instance: AudioManager
  private audio: HTMLAudioElement | null = null
  private currentTrack: string | null = null
  private volume: number = 0.3 // Default 30%
  private isMuted: boolean = false
  private fadeInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Load saved preferences
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('echoarena_audio_prefs')
      if (saved) {
        const prefs = JSON.parse(saved)
        this.volume = prefs.volume ?? 0.3
        this.isMuted = prefs.isMuted ?? false
      }
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  async play(trackUrl: string) {
    // Same track already playing
    if (this.currentTrack === trackUrl && this.audio && !this.audio.paused) {
      return
    }

    // Fade out current track
    if (this.audio && !this.audio.paused) {
      await this.fadeOut()
      this.audio.pause()
    }

    // Create new audio element
    this.audio = new Audio(trackUrl)
    this.audio.loop = true
    this.audio.volume = this.isMuted ? 0 : 0 // Start from 0 for fade in
    this.currentTrack = trackUrl

    try {
      await this.audio.play()
      if (!this.isMuted) {
        await this.fadeIn()
      }
    } catch (error) {
      console.error('Audio play failed:', error)
    }
  }

  pause() {
    if (this.audio) {
      this.fadeOut().then(() => {
        this.audio?.pause()
      })
    }
  }

  stop() {
    if (this.audio) {
      this.fadeOut().then(() => {
        this.audio?.pause()
        this.audio = null
        this.currentTrack = null
      })
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.audio) {
      if (this.isMuted) {
        this.fadeOut()
      } else {
        this.fadeIn()
      }
    }
    this.savePreferences()
    return this.isMuted
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume
    }
    this.savePreferences()
  }

  getVolume() {
    return this.volume
  }

  getMuted() {
    return this.isMuted
  }

  private async fadeIn(duration: number = 1000) {
    if (!this.audio || this.isMuted) return

    return new Promise<void>((resolve) => {
      const steps = 20
      const stepTime = duration / steps
      const volumeStep = this.volume / steps
      let currentStep = 0

      if (this.fadeInterval) clearInterval(this.fadeInterval)

      this.fadeInterval = setInterval(() => {
        if (!this.audio) {
          if (this.fadeInterval) clearInterval(this.fadeInterval)
          resolve()
          return
        }

        currentStep++
        this.audio.volume = Math.min(volumeStep * currentStep, this.volume)

        if (currentStep >= steps) {
          if (this.fadeInterval) clearInterval(this.fadeInterval)
          resolve()
        }
      }, stepTime)
    })
  }

  private async fadeOut(duration: number = 800) {
    if (!this.audio) return

    return new Promise<void>((resolve) => {
      const steps = 15
      const stepTime = duration / steps
      const currentVolume = this.audio!.volume
      const volumeStep = currentVolume / steps
      let currentStep = 0

      if (this.fadeInterval) clearInterval(this.fadeInterval)

      this.fadeInterval = setInterval(() => {
        if (!this.audio) {
          if (this.fadeInterval) clearInterval(this.fadeInterval)
          resolve()
          return
        }

        currentStep++
        this.audio.volume = Math.max(currentVolume - volumeStep * currentStep, 0)

        if (currentStep >= steps) {
          if (this.fadeInterval) clearInterval(this.fadeInterval)
          this.audio.volume = 0
          resolve()
        }
      }, stepTime)
    })
  }

  private savePreferences() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'echoarena_audio_prefs',
        JSON.stringify({
          volume: this.volume,
          isMuted: this.isMuted,
        })
      )
    }
  }
}

export const audioManager = AudioManager.getInstance()