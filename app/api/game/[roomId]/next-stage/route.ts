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

    // ✅ CHECK IF GAME FINISHED
    if (nextStage > room.max_stages) {
      console.log('🏁 Game finished! Updating player stats...')
      
      // ✅ 1. Get final standings
      const { data: finalStats, error: statsError } = await supabase
        .rpc('get_game_final_stats', { p_room_id: roomId })

      if (statsError) {
        console.error('❌ Error getting final stats:', statsError)
        throw statsError
      }

      console.log('📊 Final stats:', finalStats)

      // ✅ 2. Update stats for each player
      if (finalStats && finalStats.length > 0) {
        const totalPlayers = finalStats.length

        for (const player of finalStats) {
          console.log(`📈 Updating stats for ${player.username}...`)
          
          const { data: updateResult, error: updateError } = await supabase
            .rpc('update_user_game_stats', {
              p_user_id: player.user_id,
              p_final_score: player.final_score,
              p_rank: player.rank,
              p_total_players: totalPlayers,
              p_was_eliminated: player.was_eliminated
            })

          if (updateError) {
            console.error(`❌ Error updating ${player.username}:`, updateError)
          } else {
            console.log(`✅ ${player.username} stats updated:`, updateResult[0])
          }
        }
      }

      // ✅ 3. Update room status
      await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId)

      // ✅ 4. Broadcast game finished
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

    // ✅ MOVE TO NEXT STAGE
    console.log(`📈 Moving to stage ${nextStage}/${room.max_stages}`)

    await supabase
      .from('game_rooms')
      .update({ current_stage: nextStage })
      .eq('id', roomId)

    await supabase.rpc('initialize_stage_turns', {
      p_room_id: roomId,
      p_stage_number: nextStage,
    })

    console.log('✅ Stage initialized')

    // ✅ Broadcast stage complete
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