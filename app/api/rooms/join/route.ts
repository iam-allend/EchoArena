import { createClient } from '@/lib/supabase/server'
import { validateRoomCode } from '@/lib/room/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { roomCode, userId } = await request.json() // Get userId from client

    // Validate room code format
    if (!validateRoomCode(roomCode.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      )
    }

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
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
        { error: 'Invalid user' },
        { status: 401 }
      )
    }

    // Check if room exists and available
    const { data: rooms, error: roomError } = await supabase.rpc(
      'get_available_room',
      { p_room_code: roomCode.toUpperCase() }
    )

    if (roomError) throw roomError

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or already started' },
        { status: 404 }
      )
    }

    const room = rooms[0]

    // Check if already in room
    const { data: existing } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Already in room, just return room info
      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          code: room.room_code,
          hostId: room.host_user_id,
        },
      })
    }

    // Add user as participant
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
    console.error('Join room error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join room' },
      { status: 500 }
    )
  }
}