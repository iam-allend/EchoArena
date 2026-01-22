'use client'

// ✅ FIX: Dynamic import with SSR guard + better typing
import type { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack 
} from 'agora-rtc-sdk-ng'

let AgoraRTC: any = null

// Only load Agora in browser environment
if (typeof window !== 'undefined') {
  import('agora-rtc-sdk-ng').then((module) => {
    AgoraRTC = module.default
  })
}

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!

class AgoraManager {
  private static client: IAgoraRTCClient | null = null
  private static localAudioTrack: IMicrophoneAudioTrack | null = null
  private static currentChannel: string | null = null
  private static isJoined: boolean = false

  private static async getToken(channelName: string, uid: string): Promise<string> {
    try {
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get token')
      }

      return data.token
    } catch (error: any) {
      console.error('❌ Get token error:', error)
      throw new Error(`Token fetch failed: ${error.message}`)
    }
  }

  static async joinChannel(channelName: string, userId: string) {
    // ✅ Wait for Agora to load
    if (!AgoraRTC) {
      // Wait up to 3 seconds for dynamic import
      let attempts = 0
      while (!AgoraRTC && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (!AgoraRTC) {
        throw new Error('Agora RTC failed to load')
      }
    }

    try {
      if (this.isJoined && this.currentChannel === channelName) {
        console.log('♻️ Already joined this channel')
        return { client: this.client!, audioTrack: this.localAudioTrack! }
      }

      await this.cleanup()

      console.log('🎤 Creating Agora client for channel:', channelName)

      this.client = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      })

      console.log('🔑 Fetching token...')
      const token = await this.getToken(channelName, userId)
      console.log('✅ Token received')

      if (!this.client) {
        throw new Error('Agora client is not initialized')
      }

      const uid = await this.client.join(
        APP_ID,
        channelName,
        token,
        userId
      )


      console.log('✅ Joined channel with UID:', uid)

      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
      })

      if (!this.client || !this.localAudioTrack) {
        throw new Error('Audio track or client not ready')
      }

      await this.client.publish(this.localAudioTrack)

      console.log('🎵 Local audio published')

      this.currentChannel = channelName
      this.isJoined = true

      return { client: this.client, audioTrack: this.localAudioTrack }

    } catch (error: any) {
      console.error('❌ Agora join error:', error)
      await this.cleanup()
      throw new Error(`Failed to join voice: ${error.message}`)
    }
  }

  static async cleanup() {
    console.log('🧹 Cleaning up Agora connection')

    if (this.localAudioTrack) {
      this.localAudioTrack.stop()
      this.localAudioTrack.close()
      this.localAudioTrack = null
    }

    if (this.client && this.isJoined) {
      await this.client.leave()
      this.isJoined = false
    }

    this.client = null
    this.currentChannel = null
  }

  static setMuted(muted: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!muted)
      console.log(`🔇 Audio ${muted ? 'muted' : 'unmuted'}`)
    }
  }

  static getClient(): IAgoraRTCClient | null {
    return this.client
  }

  static isConnected(): boolean {
    return this.isJoined
  }

  static getChannelName(): string | null {
    return this.currentChannel
  }
}

export default AgoraManager