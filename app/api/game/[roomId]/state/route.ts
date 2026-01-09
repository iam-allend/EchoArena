import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> } // ✅ FIX: Proper typing for Next.js 15
) {
  try {
    const supabase = await createClient()
    
    // ✅ FIX: Await params (Next.js 15+ requirement)
    const { roomId } = await context.params
    
    console.log('📥 Get game state API called for room:', roomId)

    // ✅ FIX: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roomId)) {
      console.error('❌ Invalid UUID format:', roomId)
      return NextResponse.json(
        { error: `Invalid room ID format: ${roomId}` },
        { status: 400 }
      )
    }

    // Get room info
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      console.error('❌ Room query error:', roomError)
      throw roomError
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    console.log('✅ Room found:', room.room_code, 'Status:', room.status)

    // Get participants with scores
    const { data: participants, error: partError } = await supabase
      .from('room_participants')
      .select(`
        id,
        user_id,
        lives_remaining,
        total_score,
        status,
        user:users (
          username,
          level
        )
      `)
      .eq('room_id', roomId)
      .order('total_score', { ascending: false })

    if (partError) {
      console.error('❌ Participants query error:', partError)
      throw partError
    }

    console.log('✅ Participants loaded:', participants?.length || 0)

    // Get current turn (if in playing state)
    let currentTurn = null
    if (room.status === 'playing') {
      console.log('🎯 Getting current turn for stage:', room.current_stage)
      
      const { data: turn, error: turnError } = await supabase
        .rpc('get_current_turn', {
          p_room_id: roomId,
          p_stage_number: room.current_stage
        })

      if (turnError) {
        console.error('⚠️ Get current turn error:', turnError)
        // Don't throw, just log - turn might not exist yet
      }

      currentTurn = turn?.[0] || null
      console.log('✅ Current turn:', currentTurn?.username || 'none')
    }

    return NextResponse.json({
      success: true,
      game: {
        room,
        participants,
        currentTurn,
      },
    })
  } catch (error: any) {
    console.error('❌ Get game state error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get game state',
        details: error.details || null
      },
      { status: 500 }
    )
  }
}