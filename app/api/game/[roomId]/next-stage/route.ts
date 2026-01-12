import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> } // ✅ FIX
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params // ✅ FIX: Await params

    console.log('➡️ Next stage for room:', roomId)

    // Get current room state
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage, max_stages')
      .eq('id', roomId)
      .single()

    if (!room) {
      throw new Error('Room not found')
    }

    const nextStage = room.current_stage + 1

    // Check if game should end
    if (nextStage > room.max_stages) {
      console.log('🏁 Game finished!')
      
      await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId)

      return NextResponse.json({
        success: true,
        gameFinished: true,
      })
    }

    console.log(`📈 Moving to stage ${nextStage}/${room.max_stages}`)

    // Move to next stage
    await supabase
      .from('game_rooms')
      .update({ current_stage: nextStage })
      .eq('id', roomId)

    // Initialize turns for next stage
    await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: nextStage,
    })

    console.log('✅ Stage initialized with turns')

    return NextResponse.json({
      success: true,
      gameFinished: false,
      nextStage,
    })
  } catch (error: any) {
    console.error('❌ Next stage error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}