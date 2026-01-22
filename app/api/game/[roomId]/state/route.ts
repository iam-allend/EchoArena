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
    
    console.log('📥 API ambil status permainan dipanggil untuk room:', roomId)

    // ✅ FIX: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roomId)) {
      console.error('❌ Format UUID tidak valid:', roomId)
      return NextResponse.json(
        { error: `Format ID room tidak valid: ${roomId}` },
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
      console.error('❌ Kesalahan query room:', roomError)
      throw roomError
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Room tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('✅ Room ditemukan:', room.room_code, 'Status:', room.status)

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
      console.error('❌ Kesalahan query peserta:', partError)
      throw partError
    }

    console.log('✅ Peserta dimuat:', participants?.length || 0)

    // Get current turn (if in playing state)
    let currentTurn = null
    if (room.status === 'playing') {
      console.log('🎯 Mengambil giliran saat ini untuk babak:', room.current_stage)
      
      const { data: turn, error: turnError } = await supabase
        .rpc('get_current_turn', {
          p_room_id: roomId,
          p_stage_number: room.current_stage
        })

      if (turnError) {
        console.error('⚠️ Kesalahan ambil giliran saat ini:', turnError)
        // Don't throw, just log - turn might not exist yet
      }

      currentTurn = turn?.[0] || null
      console.log('✅ Giliran saat ini:', currentTurn?.username || 'tidak ada')
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
    console.error('❌ Kesalahan ambil status permainan:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Gagal mengambil status permainan',
        details: error.details || null
      },
      { status: 500 }
    )
  }
}