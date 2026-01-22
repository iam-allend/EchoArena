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

    // ✅ Check if player eliminated (lives = 0)
    if (result && typeof result === 'object' && 'lives_remaining' in result) {
      const typedResult = result as { lives_remaining: number; status: string }
      
      if (typedResult.lives_remaining === 0) {
        console.log('💀 Player eliminated:', userId)

        // Update participant status
        await supabase
          .from('room_participants')
          .update({ status: 'eliminated' })
          .eq('room_id', roomId)
          .eq('user_id', userId)

        // ✅ Broadcast elimination (without username - frontend will get it from gameState)
        const elimChannel = supabase.channel(`room:${roomId}:elimination`)
        await elimChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await elimChannel.send({
              type: 'broadcast',
              event: 'game-event',
              payload: {
                type: 'PLAYER_ELIMINATED',
                userId
                // Frontend can get username from gameState.participants
              }
            })
            setTimeout(() => supabase.removeChannel(elimChannel), 1000)
          }
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
    })
  } catch (error: any) {
    console.error('❌ Submit answer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}