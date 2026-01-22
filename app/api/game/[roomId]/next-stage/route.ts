import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('➡️ Next stage for room:', roomId)

    // ✅ Check if game should end (only 1 or 0 active players)
    const { data: shouldEnd } = await supabase
      .rpc('should_game_end', { p_room_id: roomId })

    if (shouldEnd) {
      console.log('🏁 Game Over - Only 1 or 0 active player(s) remaining!')
      
      await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId)

      // Broadcast game finished
      const broadcastChannel = supabase.channel(`room:${roomId}:gameover`)
      await broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'game-event',
            payload: { type: 'GAME_FINISHED' },
          })
          setTimeout(() => supabase.removeChannel(broadcastChannel), 2000)
        }
      })

      return NextResponse.json({
        success: true,
        gameFinished: true,
      })
    }

    // ✅ Get current room state
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage, max_stages')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room not found')

    const nextStage = room.current_stage + 1

    // ✅ Check if reached max stages
    if (nextStage > room.max_stages) {
      console.log('🏁 Game finished - Max stages reached!')
      
      await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId)

      const broadcastChannel = supabase.channel(`room:${roomId}:maxstages`)
      await broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'game-event',
            payload: { type: 'GAME_FINISHED' },
          })
          setTimeout(() => supabase.removeChannel(broadcastChannel), 2000)
        }
      })

      return NextResponse.json({
        success: true,
        gameFinished: true,
      })
    }

    console.log(`📈 Moving to stage ${nextStage}/${room.max_stages}`)

    // ✅ Update stage
    await supabase
      .from('game_rooms')
      .update({ current_stage: nextStage })
      .eq('id', roomId)

    // ✅ Initialize turns (will check if game should end inside)
    await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: nextStage,
    })

    console.log('✅ Stage initialized')

    // ✅ Broadcast stage complete with longer timeout
    const broadcastChannel = supabase.channel(`room:${roomId}:stage${nextStage}`)
    
    await broadcastChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'game-event',
          payload: {
            type: 'STAGE_COMPLETE',
            nextStage,
          },
        })
        
        console.log('📡 Stage change broadcasted')
        setTimeout(() => supabase.removeChannel(broadcastChannel), 2000)
      }
    })

    return NextResponse.json({
      success: true,
      gameFinished: false,
      nextStage,
    })
  } catch (error: any) {
    console.error('❌ Next stage error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}