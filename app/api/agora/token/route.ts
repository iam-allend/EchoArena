import { NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

export async function POST(request: Request) {
  try {
    const { channelName, uid } = await request.json()

    if (!channelName || !uid) {
      return NextResponse.json(
        { error: 'channelName and uid required' },
        { status: 400 }
      )
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!

    if (!appId || !appCertificate) {
      console.error('❌ Missing Agora credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Token expiration: 24 hours from now
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 86400

    // Role: Publisher (can send & receive audio)
    const role = RtcRole.PUBLISHER

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      expirationTimeInSeconds,
      expirationTimeInSeconds
    )

    console.log('✅ Token generated for channel:', channelName)

    return NextResponse.json({
      success: true,
      token,
      uid,
      channelName,
      expiresAt: expirationTimeInSeconds,
    })

  } catch (error: any) {
    console.error('❌ Token generation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}