import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }  // ✅ params adalah Promise di Next.js 15
) {
  try {
    const supabase = await createClient()
    
    // ✅ AWAIT params untuk mendapatkan id
    const { id: roomId } = await context.params
    
    // ✅ VALIDASI 1: Cek roomId
    console.log('🔍 Received roomId:', roomId, typeof roomId)
    
    if (!roomId || roomId === 'undefined') {
      console.error('❌ Invalid roomId:', roomId)
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      )
    }

    if (!isValidUUID(roomId)) {
      console.error('❌ roomId is not a valid UUID:', roomId)
      return NextResponse.json(
        { error: 'Room ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    // ✅ VALIDASI 2: Parse request body
    let userId: string
    try {
      const body = await request.json()
      userId = body.userId
      console.log('🔍 Received userId:', userId, typeof userId)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // ✅ VALIDASI 3: Cek userId
    if (!userId || userId === 'undefined') {
      console.error('❌ Invalid userId:', userId)
      return NextResponse.json(
        { error: 'User ID is required and cannot be undefined' },
        { status: 400 }
      )
    }

    if (!isValidUUID(userId)) {
      console.error('❌ userId is not a valid UUID:', userId)
      return NextResponse.json(
        { error: 'User ID must be a valid UUID' },
        { status: 400 }
      )
    }

    console.log('✅ Valid UUIDs - userId:', userId, 'roomId:', roomId)

    // Verify user exists
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userExists) {
      console.error('❌ User verification failed:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User verified')

    // Update participant status to 'left'
    const { error: updateError } = await supabase
      .from('room_participants')
      .update({ status: 'left' })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Failed to update participant:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to update participant status',
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Participant marked as left')

    // Check if room is now empty
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('id, user_id')
      .eq('room_id', roomId)
      .neq('status', 'left')

    if (participantsError) {
      console.error('❌ Failed to check participants:', participantsError)
      // Don't throw, participant already left
    }

    if (!participants || participants.length === 0) {
      // Delete empty room
      console.log('🗑️ Room is empty, deleting...')
      const { error: deleteError } = await supabase
        .from('game_rooms')
        .delete()
        .eq('id', roomId)
      
      if (deleteError) {
        console.error('⚠️ Failed to delete room:', deleteError)
        // Don't throw, participant already left
      } else {
        console.log('✅ Room deleted')
      }
    } else {
      // Check if host left, assign new host
      const { data: room } = await supabase
        .from('game_rooms')
        .select('host_user_id')
        .eq('id', roomId)
        .single()

      if (room?.host_user_id === userId) {
        console.log('👑 Host left, assigning new host...')
        
        const newHostId = participants[0]?.user_id

        if (newHostId && isValidUUID(newHostId)) {
          const { error: hostError } = await supabase
            .from('game_rooms')
            .update({ host_user_id: newHostId })
            .eq('id', roomId)

          if (hostError) {
            console.error('⚠️ Failed to update host:', hostError)
          } else {
            console.log('✅ New host assigned:', newHostId)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully left room'
    })
  } catch (error: any) {
    console.error('❌ Leave room error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to leave room',
        details: error.details || error.hint || null
      },
      { status: 500 }
    )
  }
}