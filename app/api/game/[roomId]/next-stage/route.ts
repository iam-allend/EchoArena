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

    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage, max_stages')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room not found')

    const nextStage = room.current_stage + 1

    // Check if game finished
    if (nextStage > room.max_stages) {
      console.log('🏁 Game finished!')
      
      await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId)

      // ✅ BROADCAST game finished
      const broadcastChannel = supabase.channel(`room:${roomId}:broadcast`)
      
      await broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'game-event',
            payload: { type: 'GAME_FINISHED' },
          })
          
          setTimeout(() => {
            supabase.removeChannel(broadcastChannel)
          }, 1000)
        }
      })

      return NextResponse.json({
        success: true,
        gameFinished: true,
      })
    }

    console.log(`📈 Moving to stage ${nextStage}/${room.max_stages}`)

    // Update stage
    await supabase
      .from('game_rooms')
      .update({ current_stage: nextStage })
      .eq('id', roomId)

    // Initialize turns
    await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: nextStage,
    })

    console.log('✅ Stage initialized')

    // ✅ BROADCAST stage complete
    const broadcastChannel = supabase.channel(`room:${roomId}:broadcast`)
    
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
        
        setTimeout(() => {
          supabase.removeChannel(broadcastChannel)
        }, 1000)
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