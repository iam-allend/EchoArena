import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params

    console.log('➡️ Babak selanjutnya untuk room:', roomId)

    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_stage, max_stages')
      .eq('id', roomId)
      .single()

    if (!room) throw new Error('Room tidak ditemukan')

    const nextStage = room.current_stage + 1

    // Check if game finished
    if (nextStage > room.max_stages) {
      console.log('🏁 Permainan selesai!')
      
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

    console.log(`📈 Pindah ke babak ${nextStage}/${room.max_stages}`)

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

    console.log('✅ Babak diinisialisasi')

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
        
        console.log('📡 Perubahan babak disiarkan')
        
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
    console.error('❌ Kesalahan babak selanjutnya:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}