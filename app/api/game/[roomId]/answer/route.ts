import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await context.params
    const body = await request.json()

    console.log('✍️ Answer submission for room:', roomId)

    const {
      userId,
      stageNumber,
      questionId,
      selectedAnswer,
      timeTaken,
      voiceTranscript,
    } = body

    if (!userId || !stageNumber || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Check if player is already eliminated
    const { data: participant } = await supabase
      .from('room_participants')
      .select('status, lives_remaining')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (participant?.status === 'eliminated') {
      console.log('⚠️ Player already eliminated, skipping answer')
      return NextResponse.json({
        success: false,
        error: 'Player is eliminated'
      }, { status: 403 })
    }

    // Submit answer
    const { data: result, error } = await supabase
      .rpc('submit_answer', {
        p_room_id: roomId,
        p_stage_number: stageNumber,
        p_user_id: userId,
        p_question_id: questionId,
        p_selected_answer: selectedAnswer,
        p_time_taken: timeTaken,
        p_voice_transcript: voiceTranscript,
      })

    if (error) throw error

    console.log('✅ Answer submitted:', result)

    // Delete active question
    await supabase
      .from('active_questions')
      .delete()
      .eq('room_id', roomId)
      .eq('stage_number', stageNumber)

    // ✅ Check if player was eliminated after this answer
    const wasEliminated = result.lives_remaining <= 0

    if (wasEliminated) {
      console.log('💀 Player eliminated!')
      
      // ✅ Check if game is over (only 1 player left)
      const { data: gameOver } = await supabase
        .rpc('check_game_over', { p_room_id: roomId })

      if (gameOver) {
        console.log('🏁 Game over - only 1 player remaining!')
        
        await supabase
          .from('game_rooms')
          .update({ status: 'finished' })
          .eq('id', roomId)

        // Broadcast game finished
        const finishChannel = supabase.channel(`room:${roomId}:finish`)
        await finishChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await finishChannel.send({
              type: 'broadcast',
              event: 'game-event',
              payload: { type: 'GAME_FINISHED' }
            })
            setTimeout(() => supabase.removeChannel(finishChannel), 1000)
          }
        })

        return NextResponse.json({
          success: true,
          result,
          stageComplete: false,
          gameFinished: true, // ✅ NEW
          eliminated: true
        })
      }
    }

    // Check if stage complete
    const { data: stageComplete } = await supabase
      .rpc('is_stage_complete', {
        p_room_id: roomId,
        p_stage_number: stageNumber,
      })

    // ✅ BROADCAST answer submitted
    const broadcastChannel = supabase.channel(`room:${roomId}:broadcast`)
    
    await broadcastChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'game-event',
          payload: {
            type: 'ANSWER_SUBMITTED',
            userId,
            stageNumber,
            eliminated: wasEliminated, // ✅ NEW
          },
        })
        
        console.log('📡 Answer broadcasted')
        
        setTimeout(() => {
          supabase.removeChannel(broadcastChannel)
        }, 1000)
      }
    })

    return NextResponse.json({
      success: true,
      result,
      stageComplete: stageComplete || false,
      eliminated: wasEliminated, // ✅ NEW
    })
  } catch (error: any) {
    console.error('❌ Submit answer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}