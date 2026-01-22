import { createClient } from '@/lib/supabase/server'
import { generateUniqueRoomCode } from '@/lib/room/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { maxStages = 10, userId } = await request.json()

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'ID Pengguna diperlukan' },
        { status: 400 }
      )
    }

    // Verify user exists in database
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userExists) {
      return NextResponse.json(
        { error: 'Pengguna tidak valid' },
        { status: 401 }
      )
    }

    // Generate unique room code
    const roomCode = await generateUniqueRoomCode()

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        host_user_id: userId,
        max_stages: maxStages,
        status: 'waiting',
        current_stage: 0,
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add host as first participant
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        lives_remaining: 3,
        total_score: 0,
        status: 'active',
      })

    if (participantError) throw participantError

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.room_code,
        hostId: room.host_user_id,
      },
    })
  } catch (error: any) {
    console.error('Kesalahan pembuatan room:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal membuat room' },
      { status: 500 }
    )
  }
}