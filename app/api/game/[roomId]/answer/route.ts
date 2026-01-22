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

    const { userId, stageNumber, questionId, selectedAnswer, timeTaken, voiceTranscript } = body

    if (!userId || !stageNumber || !questionId || !selectedAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ✅ Submit answer
    const { data: result, error } = await supabase.rpc('submit_answer', {
      p_room_id: roomId,
      p_stage_number: stageNumber,
      p_user_id: userId,
      p_question_id: questionId,
      p_selected_answer: selectedAnswer,
      p_time_taken: timeTaken,
      p_voice_transcript: voiceTranscript,
    })

    if (error) throw error

    console.log('✅ Answer result:', result)

    // ✅ Delete active question
    await supabase
      .from('active_questions')
      .delete()
      .eq('room_id', roomId)
      .eq('stage_number', stageNumber)

    // ✅ Check elimination (lives = 0)
    const wasEliminated = result?.lives_remaining === 0

    if (wasEliminated) {
      console.log('💀 Player eliminated!')
      
      // ✅ Check if game over (only 1 active player left)
      const { data: activeCount } = await supabase
        .from('room_participants')
        .select('user_id', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('status', 'active')

      const activePlayers = activeCount || 0

      if (activePlayers <= 1) {
        console.log('🏁 Game Over - Only 1 player remaining!')
        
        await supabase
          .from('game_rooms')
          .update({ status: 'finished' })
          .eq('id', roomId)

        // Broadcast game finished
        await supabase.channel(`room:${roomId}:finish`)
          .subscribe()
          .send({
            type: 'broadcast',
            event: 'game-event',
            payload: { type: 'GAME_FINISHED' }
          })

        return NextResponse.json({
          success: true,
          result,
          gameFinished: true,
          stageComplete: false
        })
      }
    }

    // ✅ Check stage complete (only active players)
    const { data: stageComplete } = await supabase
      .rpc('is_stage_complete', {
        p_room_id: roomId,
        p_stage_number: stageNumber,
      })

    console.log('📊 Stage complete:', stageComplete)

    // ✅ BROADCAST with retry logic
    const broadcastChannel = supabase.channel(`room:${roomId}:answers`)
    
    await broadcastChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await broadcastChannel.send({
          type: 'broadcast',
          event: 'game-event',
          payload: {
            type: 'ANSWER_SUBMITTED',
            userId,
            stageNumber,
            wasEliminated, // ✅ Include elimination flag
          },
        })
        
        console.log('📡 Answer broadcasted')
        setTimeout(() => supabase.removeChannel(broadcastChannel), 2000) // ✅ Longer timeout
      }
    })

    return NextResponse.json({
      success: true,
      result,
      stageComplete: stageComplete || false,
      wasEliminated, // ✅ Return elimination status
    })
  } catch (error: any) {
    console.error('❌ Submit answer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}