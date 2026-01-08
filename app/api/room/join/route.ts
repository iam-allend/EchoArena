import { createClient } from '@/lib/supabase/server'
import { validateRoomCode } from '@/lib/room/utils'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { roomCode, userId } = await request.json()

    console.log('🔍 Join room request:', { roomCode, userId })

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

    if (roomError) {
      console.error('❌ RPC error:', roomError)
      throw roomError
    }

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or already started' },
        { status: 404 }
      )
    }

    const room = rooms[0]
    console.log('✅ Room found:', room.id)

    // ✅ CHECK: Apakah user sudah pernah join room ini?
    const { data: existing, error: existingError } = await supabase
      .from('room_participants')
      .select('id, status')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      console.error('❌ Error checking existing participant:', existingError)
      throw existingError
    }

    if (existing) {
      console.log('🔍 Existing participant found:', existing)
      
      // ✅ CASE 1: User masih active di room (belum leave)
      if (existing.status === 'active') {
        console.log('✅ User already active in room')
        return NextResponse.json({
          success: true,
          message: 'Already in room',
          room: {
            id: room.id,
            code: room.room_code,
            hostId: room.host_user_id,
          },
        })
      }

      // ✅ CASE 2: User sebelumnya leave, sekarang join lagi
      if (existing.status === 'left') {
        console.log('🔄 User rejoining room, updating status...')
        
        const { error: updateError } = await supabase
          .from('room_participants')
          .update({ 
            status: 'active',
            lives_remaining: 3, // Reset lives
            total_score: 0,     // Reset score
            joined_at: new Date().toISOString() // Update join time
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('❌ Failed to update participant:', updateError)
          throw updateError
        }

        console.log('✅ Participant status updated to active')
        
        return NextResponse.json({
          success: true,
          message: 'Rejoined room',
          room: {
            id: room.id,
            code: room.room_code,
            hostId: room.host_user_id,
          },
        })
      }

      // ✅ CASE 3: User eliminated (optional - tergantung game logic)
      if (existing.status === 'eliminated') {
        return NextResponse.json(
          { error: 'You were eliminated from this room' },
          { status: 403 }
        )
      }
    }

    // ✅ CASE 4: User belum pernah join room ini, insert baru
    console.log('➕ Adding new participant...')
    
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        lives_remaining: 3,
        total_score: 0,
        status: 'active',
      })

    if (participantError) {
      console.error('❌ Failed to add participant:', participantError)
      throw participantError
    }

    console.log('✅ New participant added')

    return NextResponse.json({
      success: true,
      message: 'Joined room successfully',
      room: {
        id: room.id,
        code: room.room_code,
        hostId: room.host_user_id,
      },
    })
  } catch (error: any) {
    console.error('❌ Join room error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to join room',
        details: error.details || null
      },
      { status: 500 }
    )
  }
}